-- Migration: Mobile App Schema Fusion & Database Optimization
-- Created: 2026-07-25
-- Description: Fuses candidate mobile application entity requirements into the normalized Supabase database.
-- Adds missing columns, saved_vacancies table, performance indexes, RLS policies, and mobile-optimized views.

-----------------------------------------------------------
-- 1. EXTEND EXISTING PHYSICAL TABLES (ADD MISSING COLUMNS)
-----------------------------------------------------------

-- 1.1 Candidate profiles extensions
ALTER TABLE public.candidate_profiles
ADD COLUMN IF NOT EXISTS cv_filename TEXT,
ADD COLUMN IF NOT EXISTS cv_file_size TEXT,
ADD COLUMN IF NOT EXISTS cv_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS job_alerts_enabled BOOLEAN DEFAULT true NOT NULL;

-- 1.2 Vacancies extensions
ALTER TABLE public.vacancies
ADD COLUMN IF NOT EXISTS category_icon TEXT DEFAULT 'work_rounded' NOT NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[] NOT NULL,
ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT false NOT NULL;

-- 1.3 Applications extensions
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS step_index INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- 1.4 Notifications extensions
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS target_vacancy_id UUID REFERENCES public.vacancies(id) ON DELETE SET NULL;

-- Update notifications type constraint to support mobile types ('job_alert', 'application_update', 'profile_tip', 'system', 'application_status', 'message')
DO $$
BEGIN
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('job_alert', 'application_update', 'profile_tip', 'system', 'application_status', 'message'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-----------------------------------------------------------
-- 2. CREATE SAVED_VACANCIES TABLE (BOOKMARKS)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vacancy_id UUID NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(candidate_id, vacancy_id)
);

-----------------------------------------------------------
-- 3. HIGH-PERFORMANCE MOBILE VIEWS
-----------------------------------------------------------

-- 3.1 mobile_vacancies_view: Flattened view joining company details for fast mobile feed rendering
CREATE OR REPLACE VIEW public.mobile_vacancies_view WITH (security_invoker = true) AS
SELECT
  v.id,
  v.title,
  COALESCE(cp.company_name, 'Empresa Confidencial') AS company_name,
  COALESCE(cp.logo_url, NULL) AS company_logo_url,
  v.location,
  CAST(COALESCE(v.salary_min, 0) AS INTEGER) AS salary_min,
  CAST(COALESCE(v.salary_max, 0) AS INTEGER) AS salary_max,
  COALESCE(v.employment_type, 'Tiempo Completo') AS employment_type,
  v.category_icon,
  v.description,
  v.tags,
  v.is_promoted,
  v.company_id,
  v.recruiter_id,
  v.status,
  v.is_active,
  v.created_at,
  v.updated_at
FROM public.vacancies v
LEFT JOIN public.company_profiles cp ON v.company_id = cp.id;

-- 3.2 mobile_candidate_profiles_view: Single payload view for candidate profile screen
CREATE OR REPLACE VIEW public.mobile_candidate_profiles_view WITH (security_invoker = true) AS
SELECT
  p.id,
  p.full_name,
  p.email,
  COALESCE(c.phone, c.whatsapp_number, '') AS phone_number,
  p.avatar_url,
  c.bio,
  c.skills,
  json_build_object(
    'url', c.cv_url,
    'filename', c.cv_filename,
    'size_bytes', c.cv_file_size,
    'updated_at', c.cv_updated_at
  ) AS cv_file,
  c.job_alerts_enabled,
  p.created_at,
  p.updated_at
FROM public.profiles p
INNER JOIN public.candidate_profiles c ON p.id = c.id;

-----------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-----------------------------------------------------------
ALTER TABLE public.saved_vacancies ENABLE ROW LEVEL SECURITY;

-- saved_vacancies RLS Policies
DROP POLICY IF EXISTS "Candidates can view their saved vacancies" ON public.saved_vacancies;
CREATE POLICY "Candidates can view their saved vacancies" ON public.saved_vacancies
  FOR SELECT TO authenticated USING (candidate_id = auth.uid());

DROP POLICY IF EXISTS "Candidates can save vacancies" ON public.saved_vacancies;
CREATE POLICY "Candidates can save vacancies" ON public.saved_vacancies
  FOR INSERT TO authenticated WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS "Candidates can delete their saved vacancies" ON public.saved_vacancies;
CREATE POLICY "Candidates can delete their saved vacancies" ON public.saved_vacancies
  FOR DELETE TO authenticated USING (candidate_id = auth.uid());

-----------------------------------------------------------
-- 5. GRANTS & PERMISSIONS
-----------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_vacancies TO anon, authenticated, service_role;
GRANT SELECT ON public.mobile_vacancies_view TO anon, authenticated, service_role;
GRANT SELECT ON public.mobile_candidate_profiles_view TO anon, authenticated, service_role;

-----------------------------------------------------------
-- 6. PERFORMANCE INDEXES (2NF/3NF OPTIMIZATION)
-----------------------------------------------------------
CREATE INDEX IF NOT EXISTS saved_vacancies_candidate_id_idx ON public.saved_vacancies (candidate_id);
CREATE INDEX IF NOT EXISTS saved_vacancies_vacancy_id_idx ON public.saved_vacancies (vacancy_id);
CREATE INDEX IF NOT EXISTS vacancies_is_promoted_idx ON public.vacancies (is_promoted) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
