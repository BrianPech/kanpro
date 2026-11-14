-- ============================================================================
-- Migration: 20261115120000_ensure_super_admin_rls_helper.sql
-- Purpose: Ensure app_private.is_active_super_admin() exists before
--          20261116000000_fix_rls_infinite_recursion_profiles_and_staff.sql
--          runs in environments where standalone admin-staff hardening was not
--          applied separately, and refresh PostgREST schema cache.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS app_private;
GRANT USAGE ON SCHEMA app_private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION app_private.is_active_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT app_private.is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.admin_staff_members s ON s.profile_id = p.id
      WHERE p.id = (SELECT auth.uid())
        AND COALESCE(p.status, 'active') <> 'suspended'
        AND s.sub_role = 'super_admin'
        AND s.status = 'active'
    );
$$;

REVOKE ALL ON FUNCTION app_private.is_active_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.is_active_super_admin() TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
