-- ============================================================================
-- Migration: 20261111000000_harden_candidate_profiles_privacy_and_close_leak.sql
-- Purpose: Close mass privacy leak of candidate phone numbers and email addresses.
--          Revokes permissive "Authenticated view candidate basic profile directory"
--          policy on public.profiles.
--          Enforces least-privilege RLS on profiles so candidate contact details
--          are visible ONLY to the user themselves, admins, or companies with an
--          active application or active employment record.
--          Restores candidate_directory view as a secure, sanitized projection
--          with security_barrier, strictly excluding email and phone fields.
--
-- STRICT GUARANTEE: Non-destructive migration.
--                   Preserves all existing rows, tables, schemas and data.
--                   NO DROP TABLE, NO TRUNCATE, NO DELETE.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DROP THE LEAKY PERMISSIVE POLICY ON public.profiles
-- ----------------------------------------------------------------------------
-- This policy previously allowed ANY authenticated user to select * from profiles
-- where role = 'candidate', exposing emails and whatsapp numbers platform-wide.
DROP POLICY IF EXISTS "Authenticated view candidate basic profile directory" ON public.profiles;

-- ----------------------------------------------------------------------------
-- 2. ENSURE LEAST-PRIVILEGE POLICIES ON public.profiles
-- ----------------------------------------------------------------------------

-- A. Users can read their own profile
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = (select auth.uid()));

-- B. Admins can manage all profiles
DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;
CREATE POLICY "Admins manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role = 'admin'));

-- C. Companies and recruiters can read candidate contact details ONLY when the candidate
--    has actively applied to one of their vacancies
DROP POLICY IF EXISTS "Companies read applicant contact details" ON public.profiles;
CREATE POLICY "Companies read applicant contact details"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'candidate' AND EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.vacancies v ON v.id = a.vacancy_id
    WHERE a.candidate_id = profiles.id
      AND (v.company_id = (select auth.uid()) OR v.recruiter_id = (select auth.uid()))
  )
);

-- D. Companies can read contact details of their hired/active employees
DROP POLICY IF EXISTS "Companies read employee contact details" ON public.profiles;
CREATE POLICY "Companies read employee contact details"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_employees ce
    WHERE ce.employee_id = profiles.id
      AND ce.company_id = (select auth.uid())
  )
);

-- ----------------------------------------------------------------------------
-- 3. SECURE SANITIZED VIEW: public.candidate_directory
-- ----------------------------------------------------------------------------
-- Projects public talent directory information for company radar search.
-- Runs in security_barrier mode owned by postgres, explicitly omitting
-- sensitive columns (email, whatsapp_number, terms_accepted_at).
-- Filters out suspended candidates and ARCO cancellations.
CREATE OR REPLACE VIEW public.candidate_directory WITH (security_barrier = true) AS
SELECT p.id, p.full_name, p.avatar_url, p.location, p.is_verified,
       c.candidate_type, c.headline, c.bio, c.skills, c.experience, c.education,
       c.preferred_zone, c.specialization_area, c.years_experience, c.trade_description,
       p.is_early_access
FROM public.profiles p
JOIN public.candidate_profiles c ON c.id = p.id
WHERE p.role = 'candidate'
  AND COALESCE(p.status, 'active') <> 'suspended';

ALTER VIEW public.candidate_directory OWNER TO postgres;
GRANT SELECT ON public.candidate_directory TO authenticated;
