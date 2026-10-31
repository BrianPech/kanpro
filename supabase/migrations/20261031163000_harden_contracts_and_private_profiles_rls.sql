-- ==============================================================================
-- Migration: 20261031163000_harden_contracts_and_private_profiles_rls.sql
-- Description:
--   1. Task 4: Removes open FOR UPDATE RLS policy for employees on company_contracts
--      and replaces it with a strict SECURITY DEFINER RPC sign_employee_contract
--      that only updates employee_signed, employee_signature_url, status, notes,
--      and updated_at for the authenticated collaborator.
--   2. Task 10: Restricts admin access on candidate_private_profiles to active
--      admin staff who explicitly hold the 'verify_documents' permission (or super_admin).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Restrict employee contract updates via RLS & SECURITY DEFINER RPC
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Employees can sign own contracts" ON public.company_contracts;

CREATE OR REPLACE FUNCTION public.sign_employee_contract(
  p_contract_id uuid,
  p_signature_url text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_contract public.company_contracts%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado.';
  END IF;

  IF p_signature_url IS NULL OR length(trim(p_signature_url)) < 10 THEN
    RAISE EXCEPTION 'Los datos o URL de la firma son obligatorios.';
  END IF;

  SELECT *
  INTO v_contract
  FROM public.company_contracts c
  WHERE c.id = p_contract_id
    AND (
      c.candidate_id = v_uid
      OR c.employee_id IN (
        SELECT ce.id
        FROM public.company_employees ce
        WHERE ce.employee_id = v_uid
      )
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No tienes permisos para firmar este contrato o no existe.';
  END IF;

  IF v_contract.employee_signed THEN
    RETURN jsonb_build_object(
      'id', v_contract.id,
      'folio', v_contract.folio,
      'already_signed', true
    );
  END IF;

  UPDATE public.company_contracts
  SET
    employee_signed = true,
    employee_signature_url = p_signature_url,
    status = 'vigente',
    notes = COALESCE(p_notes, notes),
    updated_at = timezone('utc'::text, now())
  WHERE id = p_contract_id;

  RETURN jsonb_build_object(
    'id', v_contract.id,
    'folio', v_contract.folio,
    'already_signed', false
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sign_employee_contract(uuid, text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.sign_employee_contract(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.sign_employee_contract(uuid, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. Restrict candidate_private_profiles RLS to admins with 'verify_documents'
-- ------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS app_private;
GRANT USAGE ON SCHEMA app_private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION app_private.has_admin_permission(required_perm text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.admin_staff_members s ON s.profile_id = p.id
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'::public.user_role
      AND COALESCE(p.status, 'active') <> 'suspended'
      AND s.status = 'active'
      AND (s.sub_role = 'super_admin' OR required_perm = ANY(s.permissions))
  );
$$;

GRANT EXECUTE ON FUNCTION app_private.has_admin_permission(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins manage candidate private identity" ON public.candidate_private_profiles;
CREATE POLICY "Admins manage candidate private identity"
  ON public.candidate_private_profiles FOR ALL TO authenticated
  USING (app_private.has_admin_permission('verify_documents'))
  WITH CHECK (app_private.has_admin_permission('verify_documents'));
