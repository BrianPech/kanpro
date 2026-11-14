-- ============================================================================
-- Migration: 20261116000000_fix_rls_infinite_recursion_profiles_and_staff.sql
-- Purpose: Eliminate RLS infinite recursion on public.profiles and
--          public.admin_staff_members introduced when self-referential subqueries
--          replaced app_private SECURITY DEFINER helpers.
-- ============================================================================

-- 1. public.profiles: use app_private.is_admin() instead of querying public.profiles
DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;
CREATE POLICY "Admins manage all profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING ((SELECT app_private.is_admin()))
  WITH CHECK ((SELECT app_private.is_admin()));

-- 2. public.admin_staff_members: use SECURITY DEFINER helpers instead of
--    querying public.profiles / public.admin_staff_members recursively
DROP POLICY IF EXISTS "Staff can view staff members" ON public.admin_staff_members;
CREATE POLICY "Staff can view staff members"
  ON public.admin_staff_members
  FOR SELECT
  TO authenticated
  USING ((SELECT app_private.is_admin()));

DROP POLICY IF EXISTS "Super admins can manage admin staff members" ON public.admin_staff_members;
CREATE POLICY "Super admins can manage admin staff members"
  ON public.admin_staff_members
  FOR ALL
  TO authenticated
  USING ((SELECT app_private.is_active_super_admin()))
  WITH CHECK ((SELECT app_private.is_active_super_admin()));
