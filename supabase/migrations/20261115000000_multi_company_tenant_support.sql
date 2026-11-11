-- Migration: 20261115000000_multi_company_tenant_support.sql
-- Description: Multi-Company Organization support (1 User -> N Companies) without data loss
-- Preserves all existing company_profiles, vacancies, employees, payroll, contracts and documents.

-- ============================================================================
-- 1. DESACOPLAR CONSTRAINT 1:1 EN company_profiles.id Y AGREGAR owner_id
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'company_profiles'
          AND constraint_type = 'FOREIGN KEY'
    ) LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.key_column_usage
            WHERE constraint_name = r.constraint_name
              AND column_name = 'id'
              AND table_name = 'company_profiles'
        ) THEN
            EXECUTE 'ALTER TABLE public.company_profiles DROP CONSTRAINT ' || quote_ident(r.constraint_name);
        END IF;
    END LOOP;
END $$;

-- Permitir que las nuevas empresas generen su propio UUID
ALTER TABLE public.company_profiles 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Agregar columna owner_id referenciando al usuario creador en public.profiles
ALTER TABLE public.company_profiles 
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_company_profiles_owner_id ON public.company_profiles(owner_id);

-- ============================================================================
-- 2. CREACIÓN DE LA TABLA company_members
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'recruiter', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);

-- ============================================================================
-- 3. BACKFILL DE DATOS EXISTENTES (CERO PÉRDIDA DE DATOS)
-- ============================================================================

-- Para empresas existentes donde owner_id es nulo, el owner es el usuario con el mismo id
UPDATE public.company_profiles
SET owner_id = id
WHERE owner_id IS NULL;

-- Insertar membresías como 'owner' para todas las empresas existentes
INSERT INTO public.company_members (company_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM public.company_profiles
WHERE owner_id IS NOT NULL
ON CONFLICT (company_id, user_id) DO NOTHING;

-- ============================================================================
-- 4. FUNCIONES HELPER DE ACCESO MULTITENANT (SECURITY DEFINER)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_has_company_access(
  cid UUID,
  required_roles TEXT[] DEFAULT ARRAY['owner', 'admin', 'recruiter', 'viewer']
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = cid
      AND user_id = (SELECT auth.uid())
      AND role = ANY(required_roles)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.user_has_company_access(UUID, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_company_access(UUID, TEXT[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_company_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT company_id FROM public.company_members WHERE user_id = (SELECT auth.uid());
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_company_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_company_ids() TO authenticated;

-- ============================================================================
-- 5. POLÍTICAS RLS EN company_members Y company_profiles
-- ============================================================================

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view memberships of companies they belong to" ON public.company_members;
CREATE POLICY "Users can view memberships of companies they belong to"
  ON public.company_members FOR SELECT
  USING (
    user_id = (SELECT auth.uid()) OR
    company_id IN (SELECT public.get_user_company_ids())
  );

DROP POLICY IF EXISTS "Owners and admins can manage company members" ON public.company_members;
CREATE POLICY "Owners and admins can manage company members"
  ON public.company_members FOR ALL
  USING (public.user_has_company_access(company_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.user_has_company_access(company_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Users can insert membership for companies they own" ON public.company_members;
CREATE POLICY "Users can insert membership for companies they own"
  ON public.company_members FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

-- Actualizar RLS en company_profiles
DROP POLICY IF EXISTS "Companies can update own profile" ON public.company_profiles;
CREATE POLICY "Companies can update own profile"
  ON public.company_profiles FOR UPDATE
  USING (
    public.user_has_company_access(id, ARRAY['owner', 'admin']) OR 
    (SELECT auth.uid()) = id
  );

DROP POLICY IF EXISTS "Companies can insert own profile" ON public.company_profiles;
CREATE POLICY "Companies can insert own profile"
  ON public.company_profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================================
-- 6. ACTUALIZACIÓN DE POLÍTICAS RLS EN TABLAS OPERATIVAS (VACANTES, EMPLEADOS, ETC.)
-- ============================================================================

-- Vacantes
DROP POLICY IF EXISTS "Companies can view all own vacancies" ON public.vacancies;
CREATE POLICY "Companies can view all own vacancies" ON public.vacancies
  FOR SELECT USING (
    recruiter_id = (SELECT auth.uid()) OR 
    company_id = (SELECT auth.uid()) OR 
    public.user_has_company_access(company_id)
  );

DROP POLICY IF EXISTS "Companies can insert vacancies" ON public.vacancies;
CREATE POLICY "Companies can insert vacancies" ON public.vacancies
  FOR INSERT WITH CHECK (
    recruiter_id = (SELECT auth.uid()) OR 
    company_id = (SELECT auth.uid()) OR 
    public.user_has_company_access(company_id, ARRAY['owner', 'admin', 'recruiter'])
  );

DROP POLICY IF EXISTS "Companies can update own vacancies" ON public.vacancies;
CREATE POLICY "Companies can update own vacancies" ON public.vacancies
  FOR UPDATE USING (
    recruiter_id = (SELECT auth.uid()) OR 
    company_id = (SELECT auth.uid()) OR 
    public.user_has_company_access(company_id, ARRAY['owner', 'admin', 'recruiter'])
  );

DROP POLICY IF EXISTS "Companies can delete own vacancies" ON public.vacancies;
CREATE POLICY "Companies can delete own vacancies" ON public.vacancies
  FOR DELETE USING (
    recruiter_id = (SELECT auth.uid()) OR 
    company_id = (SELECT auth.uid()) OR 
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

-- Empleados
DROP POLICY IF EXISTS "Companies can view employees" ON public.company_employees;
CREATE POLICY "Companies can view employees" ON public.company_employees
  FOR SELECT USING (
    company_id = (SELECT auth.uid()) OR 
    public.user_has_company_access(company_id) OR
    employee_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Companies can insert employees" ON public.company_employees;
CREATE POLICY "Companies can insert employees" ON public.company_employees
  FOR INSERT WITH CHECK (
    company_id = (SELECT auth.uid()) OR 
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Companies can update employees" ON public.company_employees;
CREATE POLICY "Companies can update employees" ON public.company_employees
  FOR UPDATE USING (
    company_id = (SELECT auth.uid()) OR 
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Companies can delete employees" ON public.company_employees;
CREATE POLICY "Companies can delete employees" ON public.company_employees
  FOR DELETE USING (
    company_id = (SELECT auth.uid()) OR 
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

-- Storage (company_assets)
DROP POLICY IF EXISTS "Companies Upload Assets" ON storage.objects;
CREATE POLICY "Companies Upload Assets" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company_assets' AND (
    (SELECT auth.uid())::text = (storage.foldername(name))[1] OR
    public.user_has_company_access(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'admin', 'recruiter'])
  )
);

DROP POLICY IF EXISTS "Companies Update Assets" ON storage.objects;
CREATE POLICY "Companies Update Assets" ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company_assets' AND (
    (SELECT auth.uid())::text = (storage.foldername(name))[1] OR
    public.user_has_company_access(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'admin', 'recruiter'])
  )
);

DROP POLICY IF EXISTS "Companies Delete Assets" ON storage.objects;
CREATE POLICY "Companies Delete Assets" ON storage.objects FOR DELETE
USING (
  bucket_id = 'company_assets' AND (
    (SELECT auth.uid())::text = (storage.foldername(name))[1] OR
    public.user_has_company_access(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'admin'])
  )
);

-- ============================================================================
-- 7. ACTUALIZACIÓN DEL TRIGGER handle_new_user()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  raw_role_str text;
  assigned_role public.user_role;
  company_title text;
  raw_birth_date text;
  parsed_birth_date date;
  early_access_flag boolean;
BEGIN
  raw_role_str := NEW.raw_user_meta_data->>'role';
  
  -- Strict assignment rule:
  IF raw_role_str = 'company' THEN
    assigned_role := 'company'::public.user_role;
  ELSE
    assigned_role := 'candidate'::public.user_role;
  END IF;

  early_access_flag := COALESCE((NEW.raw_user_meta_data->>'is_early_access')::boolean, true);

  -- Insert profile or update non-role fields
  INSERT INTO public.profiles (id, email, full_name, whatsapp_number, role, is_early_access)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario K’anPro'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', ''),
    assigned_role,
    early_access_flag
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE
      WHEN public.profiles.role = 'admin'::public.user_role THEN public.profiles.role
      ELSE EXCLUDED.role
    END,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    whatsapp_number = COALESCE(NULLIF(EXCLUDED.whatsapp_number, ''), public.profiles.whatsapp_number),
    updated_at = NOW();
  
  -- Specialized profile creation
  IF assigned_role = 'candidate' THEN
    INSERT INTO public.candidate_profiles (id) VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;

    raw_birth_date := NEW.raw_user_meta_data->>'birth_date';
    IF raw_birth_date IS NOT NULL AND raw_birth_date <> '' THEN
      BEGIN
        IF raw_birth_date ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
          parsed_birth_date := to_date(raw_birth_date, 'DD/MM/YYYY');
        ELSIF raw_birth_date ~ '^\d{4}-\d{2}-\d{2}$' THEN
          parsed_birth_date := raw_birth_date::date;
        ELSE
          parsed_birth_date := raw_birth_date::date;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        parsed_birth_date := NULL;
      END;
    ELSE
      parsed_birth_date := NULL;
    END IF;

    INSERT INTO public.candidate_private_profiles (id, birth_date)
    VALUES (NEW.id, parsed_birth_date)
    ON CONFLICT (id) DO UPDATE SET
      birth_date = COALESCE(EXCLUDED.birth_date, public.candidate_private_profiles.birth_date),
      updated_at = NOW();

  ELSIF assigned_role = 'company' THEN
    -- Si el registro envía información explícita de empresa (retrocompatibilidad con formularios previos)
    IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL AND NEW.raw_user_meta_data->>'company_name' <> '' THEN
      company_title := NEW.raw_user_meta_data->>'company_name';
      
      INSERT INTO public.company_profiles (
        id, owner_id, company_name, rfc, fiscal_address, industry
      ) VALUES (
        NEW.id,
        NEW.id,
        company_title,
        COALESCE(NEW.raw_user_meta_data->>'rfc', 'XAXX010101000'),
        COALESCE(NEW.raw_user_meta_data->>'fiscal_address', 'Mérida, Yucatán'),
        COALESCE(NEW.raw_user_meta_data->>'industry', 'General')
      )
      ON CONFLICT (id) DO UPDATE SET
        company_name = COALESCE(NULLIF(EXCLUDED.company_name, ''), public.company_profiles.company_name),
        owner_id = COALESCE(public.company_profiles.owner_id, NEW.id),
        updated_at = NOW();

      INSERT INTO public.company_members (company_id, user_id, role)
      VALUES (NEW.id, NEW.id, 'owner')
      ON CONFLICT (company_id, user_id) DO NOTHING;
    END IF;
    -- Si no viene company_name, el usuario sólo queda en profiles y dará de alta su empresa en el panel
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
