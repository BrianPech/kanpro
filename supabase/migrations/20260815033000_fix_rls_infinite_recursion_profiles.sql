-- Fix infinite recursion in RLS policies by using SECURITY DEFINER helper functions

-- 1. Helper function to check if the current user is an admin without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'::public.user_role
  );
$$;

-- 2. Helper function to get current user's role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = COALESCE(user_id, auth.uid());
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- 3. Fix policies on public.profiles
DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile without role changes" ON public.profiles;

CREATE POLICY "Admins manage all profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users update own profile without role changes"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()) AND (role = public.get_user_role() OR public.is_admin()));

-- 4. Fix policies on other tables that queried public.profiles directly
DROP POLICY IF EXISTS "Admins manage candidate private identity" ON public.candidate_private_profiles;
CREATE POLICY "Admins manage candidate private identity"
  ON public.candidate_private_profiles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage company profiles" ON public.company_profiles;
CREATE POLICY "Admins manage company profiles"
  ON public.company_profiles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage candidate profiles" ON public.candidate_profiles;
CREATE POLICY "Admins manage candidate profiles"
  ON public.candidate_profiles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage verification documents" ON public.profile_documents;
CREATE POLICY "Admins can manage verification documents"
  ON public.profile_documents FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.company_invoices;
CREATE POLICY "Admins can manage all invoices"
  ON public.company_invoices FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage admin staff members" ON public.admin_staff_members;
CREATE POLICY "Admins can manage admin staff members"
  ON public.admin_staff_members FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage all support tickets" ON public.support_tickets;
CREATE POLICY "Admins manage all support tickets"
  ON public.support_tickets FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage all support ticket messages" ON public.support_ticket_messages;
CREATE POLICY "Admins manage all support ticket messages"
  ON public.support_ticket_messages FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage all vacancy reports" ON public.vacancy_reports;
CREATE POLICY "Admins manage all vacancy reports"
  ON public.vacancy_reports FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
