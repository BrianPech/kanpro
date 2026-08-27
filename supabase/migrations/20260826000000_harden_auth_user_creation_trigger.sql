-- ============================================================================
-- Migration: 20260826000000_harden_auth_user_creation_trigger.sql
-- Description: Security Hardening for handle_new_user() trigger (Requirement R1)
-- 
-- 1. Strips all ability to assign 'admin' role from raw_user_meta_data.
-- 2. Strictly enforces default to 'candidate' for all values other than 'company'.
-- 3. Protects existing 'admin' profiles from downgrade or overwrite on conflict.
-- 4. Retains birth_date parsing and sync to candidate_private_profiles.
-- 5. Sets immutable search_path = public, pg_temp for SECURITY DEFINER safety.
-- 6. Revokes public execute access to prevent PostgREST RPC exposure.
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
BEGIN
  raw_role_str := NEW.raw_user_meta_data->>'role';
  
  -- Strict assignment rule:
  -- Only 'company' yields 'company'::public.user_role.
  -- ALL other values (including 'admin', 'super_admin', NULL, empty or arbitrary)
  -- strictly default to 'candidate'::public.user_role.
  -- Elevating to 'admin' via user metadata is strictly prohibited.
  IF raw_role_str = 'company' THEN
    assigned_role := 'company'::public.user_role;
  ELSE
    assigned_role := 'candidate'::public.user_role;
  END IF;

  -- Insert profile or update non-role fields while preserving existing admin status
  INSERT INTO public.profiles (id, email, full_name, whatsapp_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario K’anPro'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', ''),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE
      WHEN public.profiles.role = 'admin'::public.user_role THEN public.profiles.role
      ELSE EXCLUDED.role
    END,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    whatsapp_number = COALESCE(NULLIF(EXCLUDED.whatsapp_number, ''), public.profiles.whatsapp_number),
    updated_at = NOW();
  
  -- Initialize specialized profile according to assigned role
  IF assigned_role = 'candidate' THEN
    -- Public candidate profile
    INSERT INTO public.candidate_profiles (id) VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;

    -- Extract and normalize birth_date for sensitive private profile
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

    -- Private candidate profile
    INSERT INTO public.candidate_private_profiles (id, birth_date)
    VALUES (NEW.id, parsed_birth_date)
    ON CONFLICT (id) DO UPDATE SET
      birth_date = COALESCE(EXCLUDED.birth_date, public.candidate_private_profiles.birth_date),
      updated_at = NOW();

  ELSIF assigned_role = 'company' THEN
    company_title := COALESCE(
      NEW.raw_user_meta_data->>'company_name',
      NEW.raw_user_meta_data->>'full_name',
      'Nueva Empresa'
    );
    INSERT INTO public.company_profiles (
      id, company_name, rfc, fiscal_address, industry
    ) VALUES (
      NEW.id,
      company_title,
      COALESCE(NEW.raw_user_meta_data->>'rfc', 'XAXX010101000'),
      COALESCE(NEW.raw_user_meta_data->>'fiscal_address', 'Mérida, Yucatán'),
      COALESCE(NEW.raw_user_meta_data->>'industry', 'General')
    )
    ON CONFLICT (id) DO UPDATE SET
      company_name = COALESCE(NULLIF(EXCLUDED.company_name, ''), public.company_profiles.company_name),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- Revoke execute permissions from client-accessible roles (prevents RPC invocation)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Recreate trigger on auth.users idempotently
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
