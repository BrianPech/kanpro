-- ============================================================================
-- K'anPro Migration: 20260915000001_isolate_rls_security_definer_helpers.sql
-- Purpose: Move SECURITY DEFINER RLS helpers to private schema (app_private)
-- to avoid exposing them as public RPC endpoints via PostgREST and resolve
-- linter warning 0029_authenticated_security_definer_function_executable.
-- ============================================================================

-- 1. Create private schema not exposed to PostgREST
CREATE SCHEMA IF NOT EXISTS app_private;

GRANT USAGE ON SCHEMA app_private TO authenticated, anon, service_role;

-- 2. Define is_admin and get_user_role inside app_private
CREATE OR REPLACE FUNCTION app_private.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'::public.user_role
  );
$$;

CREATE OR REPLACE FUNCTION app_private.get_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = (SELECT auth.uid());
$$;

GRANT EXECUTE ON FUNCTION app_private.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app_private.get_user_role() TO authenticated, service_role;

-- 3. Update RLS policies to use app_private helpers

-- public.profiles
DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;
CREATE POLICY "Admins manage all profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

DROP POLICY IF EXISTS "Users update own profile without role changes" ON public.profiles;
CREATE POLICY "Users update own profile without role changes"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()) AND (role = app_private.get_user_role() OR app_private.is_admin()));

-- public.candidate_private_profiles
DROP POLICY IF EXISTS "Admins manage candidate private identity" ON public.candidate_private_profiles;
CREATE POLICY "Admins manage candidate private identity"
  ON public.candidate_private_profiles FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

-- public.company_profiles
DROP POLICY IF EXISTS "Admins manage company profiles" ON public.company_profiles;
CREATE POLICY "Admins manage company profiles"
  ON public.company_profiles FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

-- public.candidate_profiles
DROP POLICY IF EXISTS "Admins manage candidate profiles" ON public.candidate_profiles;
CREATE POLICY "Admins manage candidate profiles"
  ON public.candidate_profiles FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

-- public.profile_documents
DROP POLICY IF EXISTS "Admins can manage verification documents" ON public.profile_documents;
CREATE POLICY "Admins can manage verification documents"
  ON public.profile_documents FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

-- public.company_invoices
DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.company_invoices;
CREATE POLICY "Admins can manage all invoices"
  ON public.company_invoices FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

-- public.admin_staff_members
DROP POLICY IF EXISTS "Admins can manage admin staff members" ON public.admin_staff_members;
CREATE POLICY "Admins can manage admin staff members"
  ON public.admin_staff_members FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

-- public.support_tickets
DROP POLICY IF EXISTS "Admins manage all support tickets" ON public.support_tickets;
CREATE POLICY "Admins manage all support tickets"
  ON public.support_tickets FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

-- public.support_ticket_messages
DROP POLICY IF EXISTS "Admins manage all support ticket messages" ON public.support_ticket_messages;
CREATE POLICY "Admins manage all support ticket messages"
  ON public.support_ticket_messages FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

-- public.vacancy_reports
DROP POLICY IF EXISTS "Admins manage all vacancy reports" ON public.vacancy_reports;
CREATE POLICY "Admins manage all vacancy reports"
  ON public.vacancy_reports FOR ALL TO authenticated
  USING (app_private.is_admin())
  WITH CHECK (app_private.is_admin());

-- 4. Drop old public functions so they are no longer in the exposed API schema
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.get_user_role();
