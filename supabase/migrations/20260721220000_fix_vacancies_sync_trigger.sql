-- Migration: Fix vacancies sync trigger and salary columns compatibility
-- Created at: 2026-07-21T22:00:00-05:00

-- 1. Asegurar que si las columnas legacy salary / salary_range existen, permitan valores NULOS y no bloqueen la inserción
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'vacancies' AND column_name = 'salary'
  ) THEN
    ALTER TABLE public.vacancies ALTER COLUMN salary DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'vacancies' AND column_name = 'salary_range'
  ) THEN
    ALTER TABLE public.vacancies ALTER COLUMN salary_range DROP NOT NULL;
  END IF;
END $$;

-- 2. Actualizar función Trigger para eliminar referencias a columnas de salario obsoletas
CREATE OR REPLACE FUNCTION public.sync_vacancies_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sincronizar recruiter_id / company_id
  IF NEW.recruiter_id IS NULL AND NEW.company_id IS NOT NULL THEN
    NEW.recruiter_id := NEW.company_id;
  ELSIF NEW.company_id IS NULL AND NEW.recruiter_id IS NOT NULL THEN
    NEW.company_id := NEW.recruiter_id;
  END IF;

  -- Sincronizar is_active / status
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'Activa' THEN
      NEW.is_active := true;
    ELSE
      NEW.is_active := false;
    END IF;
  ELSIF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    IF NEW.is_active THEN
      NEW.status := 'Activa';
    ELSE
      NEW.status := 'Pausada';
    END IF;
  END IF;

  -- Sincronizar description / requirements
  IF TG_OP = 'INSERT' OR NEW.requirements IS DISTINCT FROM OLD.requirements THEN
    NEW.description := COALESCE(NEW.requirements, '');
  ELSIF NEW.description IS DISTINCT FROM OLD.description THEN
    NEW.requirements := NEW.description;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
