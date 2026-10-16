-- ============================================================================
-- Migration: 20261015210000_fix_rls_policies_remove_auth_users_dependency.sql
-- Description:
--   Removes direct queries to auth.users in RLS policies for:
--     1. public.company_attendance
--     2. public.company_incidents
--     3. public.company_leaves
--   Direct access to auth.users causes PostgreSQL error 42501 (permission denied for table users)
--   when executed by the 'authenticated' role. Replaced with public.profiles lookup.
-- ============================================================================

-- 1. Fix company_attendance policies
DROP POLICY IF EXISTS "Employees can view own attendance records" ON public.company_attendance;
CREATE POLICY "Employees can view own attendance records"
  ON public.company_attendance
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM public.company_employees
      WHERE email = (SELECT email FROM public.profiles WHERE id = (select auth.uid()))
         OR employee_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Employees can insert own check-in attendance" ON public.company_attendance;
CREATE POLICY "Employees can insert own check-in attendance"
  ON public.company_attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM public.company_employees
      WHERE email = (SELECT email FROM public.profiles WHERE id = (select auth.uid()))
         OR employee_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Employees can update own check-in attendance" ON public.company_attendance;
CREATE POLICY "Employees can update own check-in attendance"
  ON public.company_attendance
  FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM public.company_employees
      WHERE email = (SELECT email FROM public.profiles WHERE id = (select auth.uid()))
         OR employee_id = (select auth.uid())
    )
  );

-- 2. Fix company_incidents policies
DROP POLICY IF EXISTS "Employees can view own labor incidents" ON public.company_incidents;
CREATE POLICY "Employees can view own labor incidents"
  ON public.company_incidents
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM public.company_employees
      WHERE email = (SELECT email FROM public.profiles WHERE id = (select auth.uid()))
         OR employee_id = (select auth.uid())
    )
  );

-- 3. Fix company_leaves policies
DROP POLICY IF EXISTS "Employees can view own leave requests" ON public.company_leaves;
CREATE POLICY "Employees can view own leave requests"
  ON public.company_leaves
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM public.company_employees
      WHERE email = (SELECT email FROM public.profiles WHERE id = (select auth.uid()))
         OR employee_id = (select auth.uid())
    )
  );
