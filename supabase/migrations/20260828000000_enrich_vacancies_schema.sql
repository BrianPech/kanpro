-- ============================================================================
-- Migration: 20260828000000_enrich_vacancies_schema.sql
-- Enriched Vacancies Schema: Adds detailed scheduling, compensation frequency,
-- candidate qualifications, recruiter contact channels and lifecycle fields.
-- ============================================================================

-- 1. Standardize existing statuses before applying constraints
UPDATE public.vacancies 
SET status = 'Activa' 
WHERE status = 'published' AND is_active = true;

UPDATE public.vacancies 
SET status = 'Cerrada' 
WHERE status = 'published' AND is_active = false;

UPDATE public.vacancies
SET status = 'Activa'
WHERE status NOT IN ('Activa', 'Pausada', 'Cerrada', 'Borrador');

-- 2. Add enriched columns to vacancies
ALTER TABLE public.vacancies
  ADD COLUMN IF NOT EXISTS shift_schedule TEXT NOT NULL DEFAULT 'Matutino (Mañana)',
  ADD COLUMN IF NOT EXISTS positions_available INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_frequency TEXT NOT NULL DEFAULT 'quincenal',
  ADD COLUMN IF NOT EXISTS experience_required TEXT NOT NULL DEFAULT 'Sin experiencia previa',
  ADD COLUMN IF NOT EXISTS education_level TEXT NOT NULL DEFAULT 'Indistinto',
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT NOT NULL DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');

-- 3. Set proper column defaults
ALTER TABLE public.vacancies 
  ALTER COLUMN status SET DEFAULT 'Activa',
  ALTER COLUMN modality SET DEFAULT 'Presencial',
  ALTER COLUMN currency SET DEFAULT 'MXN';

-- 4. Add check constraints for data integrity
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vacancies_status_check') THEN
    ALTER TABLE public.vacancies
      ADD CONSTRAINT vacancies_status_check 
      CHECK (status IN ('Activa', 'Pausada', 'Cerrada', 'Borrador'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vacancies_payment_frequency_check') THEN
    ALTER TABLE public.vacancies
      ADD CONSTRAINT vacancies_payment_frequency_check 
      CHECK (payment_frequency IN ('semanal', 'quincenal', 'mensual'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vacancies_preferred_contact_method_check') THEN
    ALTER TABLE public.vacancies
      ADD CONSTRAINT vacancies_preferred_contact_method_check 
      CHECK (preferred_contact_method IN ('whatsapp', 'platform', 'both'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vacancies_positions_available_check') THEN
    ALTER TABLE public.vacancies
      ADD CONSTRAINT vacancies_positions_available_check 
      CHECK (positions_available > 0);
  END IF;
END $$;

-- 5. Trigger for automatic updated_at maintenance
CREATE OR REPLACE FUNCTION public.handle_vacancies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vacancies_updated_at ON public.vacancies;
CREATE TRIGGER trigger_vacancies_updated_at
  BEFORE UPDATE ON public.vacancies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_vacancies_updated_at();

-- 6. Performance indexes for vacancy queries and discovery
CREATE INDEX IF NOT EXISTS idx_vacancies_status_active ON public.vacancies(status, is_active);
CREATE INDEX IF NOT EXISTS idx_vacancies_category ON public.vacancies(category);
CREATE INDEX IF NOT EXISTS idx_vacancies_location_zone ON public.vacancies(location, zone);
CREATE INDEX IF NOT EXISTS idx_vacancies_salary ON public.vacancies(salary_min, salary_max);
CREATE INDEX IF NOT EXISTS idx_vacancies_created_at_desc ON public.vacancies(created_at DESC);

-- 7. Ensure role grants for service_role, authenticated and public discovery
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, service_role, authenticated;

-- Re-enforce anonymous public discovery
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
GRANT SELECT ON public.vacancies, public.company_directory TO anon;

