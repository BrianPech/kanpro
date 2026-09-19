-- Fix Supabase Security Linter Advisor: security_definer_view (Lint 0010)
-- Set security_invoker = true on public directory views so they run with the privileges of the querying user.

-- 1. Enable security_invoker on company_directory and candidate_directory views
CREATE OR REPLACE VIEW public.company_directory WITH (security_barrier = true, security_invoker = true) AS
SELECT id, company_name, industry, company_size, description, logo_url, banner_url,
       website_url, social_links, verification_status
FROM public.company_profiles;

CREATE OR REPLACE VIEW public.candidate_directory WITH (security_barrier = true, security_invoker = true) AS
SELECT p.id, p.full_name, p.avatar_url, p.location, p.is_verified,
       c.candidate_type, c.headline, c.bio, c.skills, c.experience, c.education,
       c.preferred_zone, c.specialization_area, c.years_experience, c.trade_description
FROM public.profiles p
JOIN public.candidate_profiles c ON c.id = p.id
WHERE p.role = 'candidate';

-- 2. Add SELECT policies so security_invoker can query underlying tables for public directory display
DROP POLICY IF EXISTS "Public read company profiles for directory" ON public.company_profiles;
CREATE POLICY "Public read company profiles for directory" ON public.company_profiles
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated view candidate profiles directory" ON public.candidate_profiles;
CREATE POLICY "Authenticated view candidate profiles directory" ON public.candidate_profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated view candidate basic profile directory" ON public.profiles;
CREATE POLICY "Authenticated view candidate basic profile directory" ON public.profiles
  FOR SELECT TO authenticated USING (role = 'candidate' OR id = (select auth.uid()));

-- 3. Ensure appropriate Grants
GRANT SELECT ON public.company_directory TO anon, authenticated;
GRANT SELECT ON public.candidate_directory TO authenticated;
