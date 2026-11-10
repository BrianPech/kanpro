-- ==============================================================================
-- Migration: 20261108000000_remediate_audit_security_and_rls.sql
-- Description: Non-destructive security hardening and integrity remediations
--   1. Restricts company access on public.profile_documents to approved requests,
--      active employment, or standard CV for applicants (protects PII).
--   2. Restricts mutations on public.admin_staff_members strictly to active super_admin.
--   3. Adds database trigger to prevent removal or demotion of last active super_admin.
--   4. Creates atomic adjust_company_credits RPC function for race-condition prevention.
--   5. Updates candidate_directory view to exclude suspended/ARCO deleted profiles.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Restrict profile_documents RLS to preserve confidential PII
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Companies can view applicant documents" ON public.profile_documents;
DROP POLICY IF EXISTS "Authorized companies and employers can view candidate documents" ON public.profile_documents;

CREATE POLICY "Authorized companies and employers can view candidate documents"
  ON public.profile_documents
  FOR SELECT
  TO authenticated
  USING (
    -- Case A: Active employee of the company
    EXISTS (
      SELECT 1 FROM public.company_employees e
      WHERE e.employee_id = profile_documents.owner_id
        AND e.company_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
    -- Case B: Explicit approved document access request
    OR EXISTS (
      SELECT 1 FROM public.document_access_requests dar
      WHERE dar.company_id = (SELECT auth.uid())
        AND dar.candidate_id = profile_documents.owner_id
        AND dar.status = 'approved'
    )
    -- Case C: Non-confidential standard CV for active applicants
    OR (
      profile_documents.doc_type = 'cv'
      AND EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.vacancies v ON v.id = a.vacancy_id
        WHERE a.candidate_id = profile_documents.owner_id
          AND (v.company_id = (SELECT auth.uid()) OR v.recruiter_id = (SELECT auth.uid()))
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 2. Restrict admin_staff_members mutations to active Super Admins
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage admin staff members" ON public.admin_staff_members;
DROP POLICY IF EXISTS "Super admins can manage admin staff members" ON public.admin_staff_members;
DROP POLICY IF EXISTS "Staff can view staff members" ON public.admin_staff_members;

-- Read policy: Any active admin profile can view the staff roster
CREATE POLICY "Staff can view staff members"
  ON public.admin_staff_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'::public.user_role
        AND COALESCE(p.status, 'active') <> 'suspended'
    )
  );

-- Mutation policy: Only active super_admin can insert, update, or delete staff members
CREATE POLICY "Super admins can manage admin staff members"
  ON public.admin_staff_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.admin_staff_members s ON s.profile_id = p.id
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'::public.user_role
        AND COALESCE(p.status, 'active') <> 'suspended'
        AND s.status = 'active'
        AND s.sub_role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.admin_staff_members s ON s.profile_id = p.id
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'::public.user_role
        AND COALESCE(p.status, 'active') <> 'suspended'
        AND s.status = 'active'
        AND s.sub_role = 'super_admin'
    )
  );

-- ------------------------------------------------------------------------------
-- 3. Trigger: Prevent last active super_admin removal or demotion
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_last_super_admin_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count int;
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.sub_role = 'super_admin' AND OLD.status = 'active') OR
     (TG_OP = 'UPDATE' AND OLD.sub_role = 'super_admin' AND OLD.status = 'active' AND (NEW.sub_role <> 'super_admin' OR NEW.status <> 'active')) THEN
    SELECT COUNT(*) INTO v_count
    FROM public.admin_staff_members
    WHERE sub_role = 'super_admin' AND status = 'active' AND id <> OLD.id;

    IF v_count < 1 THEN
      RAISE EXCEPTION 'Operación rechazada: No se puede eliminar ni degradar al único Super Administrador activo.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_super_admin_removal ON public.admin_staff_members;
CREATE TRIGGER trg_prevent_last_super_admin_removal
  BEFORE UPDATE OR DELETE ON public.admin_staff_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_super_admin_removal();

-- ------------------------------------------------------------------------------
-- 4. Atomic Credit Adjustment RPC (eliminates race condition)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_company_credits(
  p_company_id uuid,
  p_amount int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_credits int;
BEGIN
  -- Verify caller is an active admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admin_staff_members s ON s.profile_id = p.id
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'::public.user_role
      AND COALESCE(p.status, 'active') <> 'suspended'
      AND s.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren permisos administrativos activos.';
  END IF;

  UPDATE public.company_profiles
  SET credits_available = GREATEST(0, COALESCE(credits_available, 0) + p_amount),
      updated_at = now()
  WHERE id = p_company_id
  RETURNING credits_available INTO v_new_credits;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empresa no encontrada.';
  END IF;

  RETURN v_new_credits;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.adjust_company_credits(uuid, int) FROM public;
REVOKE EXECUTE ON FUNCTION public.adjust_company_credits(uuid, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.adjust_company_credits(uuid, int) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. Exclude suspended/ARCO profiles from candidate_directory view
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.candidate_directory WITH (security_barrier = true, security_invoker = true) AS
SELECT p.id, p.full_name, p.avatar_url, p.location, p.is_verified,
       c.candidate_type, c.headline, c.bio, c.skills, c.experience, c.education,
       c.preferred_zone, c.specialization_area, c.years_experience, c.trade_description,
       p.is_early_access
FROM public.profiles p
JOIN public.candidate_profiles c ON c.id = p.id
WHERE p.role = 'candidate'
  AND COALESCE(p.status, 'active') <> 'suspended';

GRANT SELECT ON public.candidate_directory TO authenticated;
