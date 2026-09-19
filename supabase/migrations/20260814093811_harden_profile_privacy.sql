-- Privacy boundary for personal and corporate identity data.
-- Roles are derived only from public.profiles, never from mutable user metadata.

CREATE TABLE public.candidate_private_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  curp VARCHAR(18) UNIQUE,
  rfc VARCHAR(13),
  birth_date DATE,
  cedula_profesional TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.candidate_private_profiles (id, curp, rfc, birth_date, cedula_profesional)
SELECT id, curp, rfc, birth_date, cedula_profesional
FROM public.candidate_profiles
ON CONFLICT (id) DO UPDATE SET
  curp = EXCLUDED.curp,
  rfc = EXCLUDED.rfc,
  birth_date = EXCLUDED.birth_date,
  cedula_profesional = EXCLUDED.cedula_profesional,
  updated_at = NOW();

UPDATE public.candidate_profiles
SET curp = NULL, rfc = NULL, birth_date = NULL, cedula_profesional = NULL;

ALTER TABLE public.candidate_private_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates manage own private identity"
  ON public.candidate_private_profiles FOR ALL TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));
CREATE POLICY "Admins manage candidate private identity"
  ON public.candidate_private_profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- Stop exposing complete contact records to the anonymous Data API.
DROP POLICY IF EXISTS "Public profile basic info view" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = (select auth.uid()));
CREATE POLICY "Users update own profile without role changes" ON public.profiles FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()) AND role = (SELECT p.role FROM public.profiles p WHERE p.id = (select auth.uid())));
CREATE POLICY "Admins manage all profiles" ON public.profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));
CREATE POLICY "Companies read applicant contact details" ON public.profiles FOR SELECT TO authenticated
  USING (
    role = 'candidate' AND EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.vacancies v ON v.id = a.vacancy_id
      WHERE a.candidate_id = profiles.id
        AND (v.company_id = (select auth.uid()) OR v.recruiter_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Anyone can view company profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Companies can update own profile" ON public.company_profiles;
DROP POLICY IF EXISTS "Companies can insert own profile" ON public.company_profiles;
CREATE POLICY "Companies manage own profile" ON public.company_profiles FOR ALL TO authenticated
  USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));
CREATE POLICY "Admins manage company profiles" ON public.company_profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

DROP POLICY IF EXISTS "Companies can view candidate profiles" ON public.candidate_profiles;
CREATE POLICY "Companies view applicants' professional profiles" ON public.candidate_profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.vacancies v ON v.id = a.vacancy_id
    WHERE a.candidate_id = candidate_profiles.id
      AND (v.company_id = (select auth.uid()) OR v.recruiter_id = (select auth.uid()))
  ));
CREATE POLICY "Admins manage candidate profiles" ON public.candidate_profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- Public catalogue views intentionally expose only display-safe fields. They
-- are security barriers and replace anonymous table reads.
CREATE OR REPLACE VIEW public.company_directory WITH (security_barrier = true) AS
SELECT id, company_name, industry, company_size, description, logo_url, banner_url,
       website_url, social_links, verification_status
FROM public.company_profiles;
CREATE OR REPLACE VIEW public.candidate_directory WITH (security_barrier = true) AS
SELECT p.id, p.full_name, p.avatar_url, p.location, p.is_verified,
       c.candidate_type, c.headline, c.bio, c.skills, c.experience, c.education,
       c.preferred_zone, c.specialization_area, c.years_experience, c.trade_description
FROM public.profiles p
JOIN public.candidate_profiles c ON c.id = p.id
WHERE p.role = 'candidate';

-- Remove the catch-all anonymous privilege, including future tables. Public
-- vacancy discovery uses vacancies plus company_directory only.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
GRANT SELECT ON public.vacancies, public.company_directory TO anon;
GRANT SELECT ON public.company_directory, public.candidate_directory TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_private_profiles TO authenticated;
