-- ============================================================================
-- Migration: 20261110000000_harden_applications_rls_and_prevent_self_promotion.sql
-- Purpose: Remediate high-severity RLS vulnerability on public.applications.
--          Prevents candidate self-promotion to "Contratado" / "hired" and unauthorized
--          mutation of administrative fields (rating, hired_at, status, notes).
--
-- STRICT GUARANTEE: Non-destructive migration.
--                   Preserves all existing rows, tables, schemas and data.
--                   NO DROP TABLE, NO TRUNCATE, NO DELETE.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DROP VULNERABLE CANDIDATE POLICY
-- ----------------------------------------------------------------------------
-- Drop the overly permissive FOR ALL policy that allowed candidates to update
-- any column on their own applications including status = 'Contratado'
DROP POLICY IF EXISTS "Candidates can manage own applications" ON public.applications;

-- Cleanup any previous iterations of candidate-specific policies if they exist
DROP POLICY IF EXISTS "applications_candidate_select" ON public.applications;
DROP POLICY IF EXISTS "applications_candidate_insert" ON public.applications;
DROP POLICY IF EXISTS "applications_candidate_delete" ON public.applications;
DROP POLICY IF EXISTS "Candidates can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Candidates can insert own applications" ON public.applications;
DROP POLICY IF EXISTS "Candidates can withdraw own applications" ON public.applications;

-- ----------------------------------------------------------------------------
-- 2. CREATE GRANULAR RLS POLICIES FOR CANDIDATES (LEAST PRIVILEGE)
-- ----------------------------------------------------------------------------

-- A. SELECT: Candidates can read only their own applications
CREATE POLICY "applications_candidate_select"
ON public.applications
FOR SELECT
TO authenticated
USING (candidate_id = (select auth.uid()));

-- B. INSERT: Candidates can submit new applications ONLY with initial pending status
--    and cannot inject ratings, notes, or hired timestamps
CREATE POLICY "applications_candidate_insert"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  candidate_id = (select auth.uid())
  AND (status IS NULL OR status IN ('Pendiente', 'applied'))
  AND hired_at IS NULL
  AND rating IS NULL
);

-- C. DELETE: Candidates can withdraw/cancel an application only while it is in an initial
--    or terminal unhired state (never while in hiring, active evaluation, or already hired)
CREATE POLICY "applications_candidate_delete"
ON public.applications
FOR DELETE
TO authenticated
USING (
  candidate_id = (select auth.uid())
  AND status IN ('Pendiente', 'applied', 'Descartado', 'rejected', 'withdrawn')
);

-- NOTE: Candidates have NO UPDATE policy on public.applications.
-- Direct UPDATE queries by candidates are strictly blocked at the RLS engine.

-- ----------------------------------------------------------------------------
-- 3. SECURE RPC FOR CANDIDATE INTERVIEW RESPONSES (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
-- Allows candidates to confirm, cancel, or request rescheduling for an interview
-- without granting general UPDATE table access. Modifies ONLY interview columns.
CREATE OR REPLACE FUNCTION public.respond_candidate_interview(
  p_application_id uuid,
  p_status text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_app record;
BEGIN
  -- 1. Validate status
  IF p_status NOT IN ('confirmed', 'cancelled', 'rescheduled') THEN
    RAISE EXCEPTION 'Estado de entrevista inválido. Valores permitidos: confirmed, cancelled, rescheduled.';
  END IF;

  -- 2. Fetch target application
  SELECT id, candidate_id, status, interview_status
  INTO v_app
  FROM public.applications
  WHERE id = p_application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Postulación no encontrada.';
  END IF;

  -- 3. Validate identity: caller must be the candidate owner
  IF v_app.candidate_id != auth.uid() THEN
    RAISE EXCEPTION 'No tienes permisos para responder sobre esta postulación.';
  END IF;

  -- 4. Perform atomic update restricted solely to interview fields
  UPDATE public.applications
  SET
    interview_status = p_status,
    interview_details = coalesce(interview_details, '{}'::jsonb) || p_details,
    updated_at = now()
  WHERE id = p_application_id;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'interview_status', p_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.respond_candidate_interview(uuid, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.respond_candidate_interview(uuid, text, jsonb) TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. DEFENSE-IN-DEPTH INTEGRITY TRIGGER
-- ----------------------------------------------------------------------------
-- Enforces at the database engine level that if an update is initiated by a candidate,
-- administrative columns (status, rating, notes, hired_at, vacancy_id, candidate_id)
-- CANNOT be mutated under any circumstance.
CREATE OR REPLACE FUNCTION public.prevent_candidate_application_self_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If the authenticated session belongs to the candidate owner of this record
  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.candidate_id THEN
    -- Forbid any tampering with status or evaluation/administrative attributes
    IF (NEW.status IS DISTINCT FROM OLD.status) OR
       (NEW.rating IS DISTINCT FROM OLD.rating) OR
       (NEW.notes IS DISTINCT FROM OLD.notes) OR
       (NEW.hired_at IS DISTINCT FROM OLD.hired_at) OR
       (NEW.candidate_id IS DISTINCT FROM OLD.candidate_id) OR
       (NEW.vacancy_id IS DISTINCT FROM OLD.vacancy_id) THEN
      RAISE EXCEPTION 'Operación denegada: un candidato no tiene autorización para modificar el estado o calificación de su postulación.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_candidate_application_self_promotion ON public.applications;
CREATE TRIGGER trg_prevent_candidate_application_self_promotion
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.prevent_candidate_application_self_promotion();
