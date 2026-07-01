-- Grant INSERT, SELECT, UPDATE permissions on public.profiles, public.company_profiles, and public.admin_profiles to authenticated and anon roles
GRANT INSERT, SELECT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO anon;

GRANT INSERT, SELECT, UPDATE ON public.company_profiles TO authenticated;
GRANT INSERT ON public.company_profiles TO anon;

GRANT INSERT, SELECT, UPDATE ON public.admin_profiles TO authenticated;
GRANT INSERT ON public.admin_profiles TO anon;

-- 1. Refactorización de la Política RLS de Inserción en public.profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK ((SELECT auth.uid()) = id);

-- 2. Refactorización de la Política RLS de Inserción en public.company_profiles
DROP POLICY IF EXISTS "Users can insert their own company profile" ON public.company_profiles;
CREATE POLICY "Users can insert their own company profile"
  ON public.company_profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK ((SELECT auth.uid()) = id);

-- 3. Refactorización de la Política RLS de Inserción en public.admin_profiles
DROP POLICY IF EXISTS "Users can insert their own admin profile" ON public.admin_profiles;
CREATE POLICY "Users can insert their own admin profile"
  ON public.admin_profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK ((SELECT auth.uid()) = id);
