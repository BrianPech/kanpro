-- ==============================================================================
-- Migration: 20261013000000_database_normalization_and_audit_fixes.sql
-- Description:
--   1. Security: Hardens notify_candidate_contact with strict authentication & role checks,
--      converts to SECURITY INVOKER, and adds an RLS policy on notifications for company sends.
--   2. Performance: Fixes auth_rls_initplan in company_evaluations, company_payrolls,
--      company_payroll_items, and company_nom035_surveys by wrapping auth.uid() in (SELECT auth.uid()).
--   3. 3NF Normalization: Removes obsolete phantom columns (curp, rfc, birth_date, cedula_profesional)
--      from candidate_profiles (which already reside securely in candidate_private_profiles).
--   4. Domain Integrity: Adds check constraints for salary ranges, valid statuses, and date ordering.
--   5. 2NF Normalization: Creates and seeds master catalog tables (job_categories, work_zones,
--      skills_catalog) and links optional foreign keys on vacancies.
--   6. 1NF Normalization: Creates dedicated 1:N relational tables for candidate experiences,
--      educations, certifications, languages, and company branches with RLS.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Security Hardening & Notifications RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Companies can send notifications to candidates" ON public.notifications;
CREATE POLICY "Companies can send notifications to candidates"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('company', 'admin')
  )
);

CREATE OR REPLACE FUNCTION public.notify_candidate_contact(
  p_candidate_id uuid,
  p_vacancy_title text,
  p_company_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role IN ('company', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: only registered companies or admins can notify candidates';
  END IF;

  INSERT INTO public.notifications (user_id, title, description, type, is_read)
  VALUES (
    p_candidate_id,
    'Nueva propuesta de contacto',
    'La empresa ' || p_company_name || ' te ha contactado por WhatsApp sobre la vacante "' || p_vacancy_title || '".',
    'message',
    false
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_candidate_contact(uuid, text, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.notify_candidate_contact(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.notify_candidate_contact(uuid, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. Performance: Auth RLS InitPlan Optimization (Wrap auth.uid() with SELECT)
-- ------------------------------------------------------------------------------
-- company_evaluations
DROP POLICY IF EXISTS "Companies can delete their own evaluations" ON public.company_evaluations;
CREATE POLICY "Companies can delete their own evaluations"
ON public.company_evaluations
FOR DELETE
TO authenticated
USING (company_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Companies can insert evaluations" ON public.company_evaluations;
CREATE POLICY "Companies can insert evaluations"
ON public.company_evaluations
FOR INSERT
TO authenticated
WITH CHECK (company_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Companies can update their own evaluations" ON public.company_evaluations;
CREATE POLICY "Companies can update their own evaluations"
ON public.company_evaluations
FOR UPDATE
TO authenticated
USING (company_id = (SELECT auth.uid()))
WITH CHECK (company_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Companies can view their own evaluations" ON public.company_evaluations;
CREATE POLICY "Companies can view their own evaluations"
ON public.company_evaluations
FOR SELECT
TO authenticated
USING (company_id = (SELECT auth.uid()));

-- company_payrolls
DROP POLICY IF EXISTS "company_payrolls_company_access" ON public.company_payrolls;
CREATE POLICY "company_payrolls_company_access"
ON public.company_payrolls
FOR ALL
TO authenticated
USING (company_id = (SELECT auth.uid()))
WITH CHECK (company_id = (SELECT auth.uid()));

-- company_payroll_items
DROP POLICY IF EXISTS "company_payroll_items_company_access" ON public.company_payroll_items;
CREATE POLICY "company_payroll_items_company_access"
ON public.company_payroll_items
FOR ALL
TO authenticated
USING (company_id = (SELECT auth.uid()))
WITH CHECK (company_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "company_payroll_items_employee_read" ON public.company_payroll_items;
CREATE POLICY "company_payroll_items_employee_read"
ON public.company_payroll_items
FOR SELECT
TO authenticated
USING (employee_id IN (
  SELECT id FROM public.company_employees WHERE employee_id = (SELECT auth.uid())
));

-- company_nom035_surveys
DROP POLICY IF EXISTS "company_nom035_company_access" ON public.company_nom035_surveys;
CREATE POLICY "company_nom035_company_access"
ON public.company_nom035_surveys
FOR ALL
TO authenticated
USING (company_id = (SELECT auth.uid()))
WITH CHECK (company_id = (SELECT auth.uid()));

-- ------------------------------------------------------------------------------
-- 3. 3NF: Drop Obsolete Duplicate Columns in candidate_profiles
-- ------------------------------------------------------------------------------
ALTER TABLE public.candidate_profiles
  DROP COLUMN IF EXISTS curp CASCADE,
  DROP COLUMN IF EXISTS rfc CASCADE,
  DROP COLUMN IF EXISTS birth_date CASCADE,
  DROP COLUMN IF EXISTS cedula_profesional CASCADE;

-- ------------------------------------------------------------------------------
-- 4. Domain & Range Check Constraints
-- ------------------------------------------------------------------------------
-- Vacancies salary constraints
ALTER TABLE public.vacancies
  DROP CONSTRAINT IF EXISTS chk_vacancies_salary_range,
  ADD CONSTRAINT chk_vacancies_salary_range
  CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min);

ALTER TABLE public.vacancies
  DROP CONSTRAINT IF EXISTS chk_vacancies_positive_salary,
  ADD CONSTRAINT chk_vacancies_positive_salary
  CHECK ((salary_min IS NULL OR salary_min >= 0) AND (salary_max IS NULL OR salary_max >= 0));

-- Applications status constraint
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS chk_applications_status,
  ADD CONSTRAINT chk_applications_status
  CHECK (status IN (
    'Pendiente', 'En revisión', 'Preseleccionado', 'Entrevista', 'Contratado', 'Descartado',
    'applied', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn'
  ));

-- Company contracts status constraint
ALTER TABLE public.company_contracts
  DROP CONSTRAINT IF EXISTS chk_company_contracts_status,
  ADD CONSTRAINT chk_company_contracts_status
  CHECK (status IN (
    'vigente', 'en_firma', 'proximo_a_vencer', 'vencido', 'renovado',
    'finalizado', 'cancelado', 'borrador'
  ));

-- Company invoices status constraint
ALTER TABLE public.company_invoices
  DROP CONSTRAINT IF EXISTS chk_company_invoices_status,
  ADD CONSTRAINT chk_company_invoices_status
  CHECK (status IN ('paid', 'pending', 'cancelled', 'refunded'));

-- Company payrolls dates constraint
ALTER TABLE public.company_payrolls
  DROP CONSTRAINT IF EXISTS chk_company_payrolls_dates,
  ADD CONSTRAINT chk_company_payrolls_dates
  CHECK (end_date >= start_date);

-- Support tickets constraints
ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS chk_support_tickets_status,
  ADD CONSTRAINT chk_support_tickets_status
  CHECK (status IN (
    'abierto', 'en_proceso', 'en_progreso', 'resuelto', 'cerrado'
  ));

ALTER TABLE public.support_tickets
  DROP CONSTRAINT IF EXISTS chk_support_tickets_priority,
  ADD CONSTRAINT chk_support_tickets_priority
  CHECK (priority IN ('baja', 'media', 'alta', 'urgente'));

-- ------------------------------------------------------------------------------
-- 5. 2NF: Master Catalogs for Lookup Standardization
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.job_categories (name, slug)
VALUES
  ('Alimentos y Bebidas', 'alimentos-y-bebidas'),
  ('Hotelería y Turismo', 'hoteleria-y-turismo'),
  ('Mantenimiento y Limpieza', 'mantenimiento-y-limpieza'),
  ('Ventas y Comercio', 'ventas-y-comercio'),
  ('Administración y Operaciones', 'administracion-y-operaciones'),
  ('Atención al Cliente', 'atencion-al-cliente'),
  ('Logística y Transporte', 'logistica-y-transporte'),
  ('Salud y Belleza', 'salud-y-belleza'),
  ('Tecnología y Digital', 'tecnologia-y-digital'),
  ('Otro', 'otro')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.work_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL DEFAULT 'Mérida',
  state TEXT NOT NULL DEFAULT 'Yucatán',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.work_zones (name, city, state)
VALUES
  ('Centro Mérida', 'Mérida', 'Yucatán'),
  ('Norte / Altabrisa / Montecristo', 'Mérida', 'Yucatán'),
  ('Poniente / Caucel', 'Mérida', 'Yucatán'),
  ('Norte / Las Américas', 'Mérida', 'Yucatán'),
  ('Francisco de Montejo', 'Mérida', 'Yucatán'),
  ('Oriente / Kanasín', 'Kanasín', 'Yucatán'),
  ('Paseo de Montejo', 'Mérida', 'Yucatán'),
  ('Progreso / Costa', 'Progreso', 'Yucatán'),
  ('Playa del Carmen', 'Playa del Carmen', 'Quintana Roo'),
  ('Cancún / Zona Hotelera', 'Cancún', 'Quintana Roo'),
  ('Tulum', 'Tulum', 'Quintana Roo'),
  ('Valladolid', 'Valladolid', 'Yucatán'),
  ('Otra Zona', 'Mérida', 'Yucatán')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.skills_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vacancies
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.job_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES public.work_zones(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vacancies_category_id ON public.vacancies(category_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_zone_id ON public.vacancies(zone_id);

ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read job_categories" ON public.job_categories;
CREATE POLICY "Public read job_categories" ON public.job_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read work_zones" ON public.work_zones;
CREATE POLICY "Public read work_zones" ON public.work_zones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read skills_catalog" ON public.skills_catalog;
CREATE POLICY "Public read skills_catalog" ON public.skills_catalog FOR SELECT USING (true);

GRANT SELECT ON public.job_categories TO anon, authenticated;
GRANT SELECT ON public.work_zones TO anon, authenticated;
GRANT SELECT ON public.skills_catalog TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 6. 1NF: Relational Child Tables for Candidate and Company Sub-Entities
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidate_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  achievements TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_candidate_exp_dates CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_candidate_exp_candidate ON public.candidate_experiences(candidate_id);

CREATE TABLE IF NOT EXISTS public.candidate_educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_candidate_edu_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_candidate_edu_candidate ON public.candidate_educations(candidate_id);

CREATE TABLE IF NOT EXISTS public.candidate_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date DATE,
  credential_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_candidate_cert_candidate ON public.candidate_certifications(candidate_id);

CREATE TABLE IF NOT EXISTS public.candidate_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'básico',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, language)
);
CREATE INDEX IF NOT EXISTS idx_candidate_lang_candidate ON public.candidate_languages(candidate_id);

CREATE TABLE IF NOT EXISTS public.company_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  lat NUMERIC,
  lng NUMERIC,
  is_headquarters BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_branches_company ON public.company_branches(company_id);

-- Enable RLS on 1NF child tables
ALTER TABLE public.candidate_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates manage own experiences" ON public.candidate_experiences;
CREATE POLICY "Candidates manage own experiences"
  ON public.candidate_experiences FOR ALL TO authenticated
  USING (candidate_id = (SELECT auth.uid()))
  WITH CHECK (candidate_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Public read candidate experiences" ON public.candidate_experiences;
CREATE POLICY "Public read candidate experiences"
  ON public.candidate_experiences FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Candidates manage own educations" ON public.candidate_educations;
CREATE POLICY "Candidates manage own educations"
  ON public.candidate_educations FOR ALL TO authenticated
  USING (candidate_id = (SELECT auth.uid()))
  WITH CHECK (candidate_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Public read candidate educations" ON public.candidate_educations;
CREATE POLICY "Public read candidate educations"
  ON public.candidate_educations FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Candidates manage own certifications" ON public.candidate_certifications;
CREATE POLICY "Candidates manage own certifications"
  ON public.candidate_certifications FOR ALL TO authenticated
  USING (candidate_id = (SELECT auth.uid()))
  WITH CHECK (candidate_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Public read candidate certifications" ON public.candidate_certifications;
CREATE POLICY "Public read candidate certifications"
  ON public.candidate_certifications FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Candidates manage own languages" ON public.candidate_languages;
CREATE POLICY "Candidates manage own languages"
  ON public.candidate_languages FOR ALL TO authenticated
  USING (candidate_id = (SELECT auth.uid()))
  WITH CHECK (candidate_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Public read candidate languages" ON public.candidate_languages;
CREATE POLICY "Public read candidate languages"
  ON public.candidate_languages FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Companies manage own branches" ON public.company_branches;
CREATE POLICY "Companies manage own branches"
  ON public.company_branches FOR ALL TO authenticated
  USING (company_id = (SELECT auth.uid()))
  WITH CHECK (company_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Public read company branches" ON public.company_branches;
CREATE POLICY "Public read company branches"
  ON public.company_branches FOR SELECT TO anon, authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_experiences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_educations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_certifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_languages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_branches TO authenticated;
GRANT SELECT ON public.company_branches TO anon;

-- ------------------------------------------------------------------------------
-- 7. Automatic updated_at Triggers for Tables with updated_at Columns
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT c.table_name
    FROM information_schema.columns c
    LEFT JOIN information_schema.triggers t
      ON t.event_object_table = c.table_name
      AND t.trigger_schema = 'public'
      AND t.action_timing = 'BEFORE'
      AND t.event_manipulation = 'UPDATE'
    WHERE c.table_schema = 'public'
      AND c.column_name = 'updated_at'
      AND t.trigger_name IS NULL
  ) LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_%I_updated_at ON public.%I;
      CREATE TRIGGER trigger_%I_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
    ', r.table_name, r.table_name, r.table_name, r.table_name);
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 8. Storage Buckets Hardening (File Size Limits & MIME Types)
-- ------------------------------------------------------------------------------
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';

UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
WHERE id = 'company_assets';

UPDATE storage.buckets
SET file_size_limit = 15728640,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
WHERE id = 'profile_documents';
