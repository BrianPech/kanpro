-- Migration: Add Public Companies View & Mobile Rating/Verification Fields
-- Created: 2026-07-25
-- Description: Adds rating, is_verified to company_profiles and creates public.companies view matching mobile Flutter spec.

-----------------------------------------------------------
-- 1. EXTEND COMPANY_PROFILES TABLE
-----------------------------------------------------------
ALTER TABLE public.company_profiles
ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 4.8 NOT NULL,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true NOT NULL;

-----------------------------------------------------------
-- 2. CREATE PUBLIC COMPANIES VIEW (MATCHING FLUTTER JSON SPEC)
-----------------------------------------------------------
CREATE OR REPLACE VIEW public.companies WITH (security_invoker = true) AS
SELECT
  cp.id,
  cp.company_name AS name,
  cp.logo_url,
  cp.banner_url,
  cp.industry,
  COALESCE(p.location, 'Playa del Carmen, Q. Roo') AS location,
  COALESCE(cp.address_details, '') AS address,
  COALESCE(cp.description, '') AS description,
  COALESCE(cp.website_or_linkedin, '') AS website_url,
  COALESCE(cp.company_size, '100 - 500 empleados') AS employee_count_range,
  cp.rating,
  cp.is_verified,
  CAST(COALESCE(v_count.active_vacancies_count, 0) AS INTEGER) AS active_vacancies_count,
  cp.created_at
FROM public.company_profiles cp
LEFT JOIN public.profiles p ON cp.id = p.id
LEFT JOIN (
  SELECT company_id, COUNT(*) AS active_vacancies_count
  FROM public.vacancies
  WHERE is_active = true
  GROUP BY company_id
) v_count ON cp.id = v_count.company_id;

-----------------------------------------------------------
-- 3. PERMISSIONS & RLS POLICIES
-----------------------------------------------------------
-- Ensure company_profiles has public select access for candidates & visitors
DROP POLICY IF EXISTS "Select company_profiles" ON public.company_profiles;
CREATE POLICY "Select company_profiles" ON public.company_profiles
  FOR SELECT TO authenticated, anon USING (true);

-- Grant access on companies view
GRANT SELECT ON public.companies TO anon, authenticated, service_role;
