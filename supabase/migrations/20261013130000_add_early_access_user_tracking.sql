-- ============================================================================
-- Migration: 20261013130000_add_early_access_user_tracking.sql
-- Description:
--   1. Adds is_early_access column to public.profiles to permanently track
--      and recognize users (both companies and candidates) who tested the
--      platform during the initial Early Access / Beta Testing period.
--   2. Updates public.handle_new_user() trigger function to default new users
--      to is_early_access = true.
--   3. Updates candidate_directory and company_directory views to expose
--      the is_early_access flag.
-- ============================================================================

-- 1. Add is_early_access column to public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_early_access boolean NOT NULL DEFAULT true;

-- 2. Index for filtering and analytics
CREATE INDEX IF NOT EXISTS idx_profiles_is_early_access
ON public.profiles(is_early_access);

-- 3. Ensure all existing profiles are marked as early access testers
UPDATE public.profiles
SET is_early_access = true
WHERE is_early_access IS NULL;

-- 4. Update handle_new_user() to persist is_early_access
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

  -- Determine early access status (default true during beta/early access)
  early_access_flag := COALESCE((NEW.raw_user_meta_data->>'is_early_access')::boolean, true);

  -- Insert profile or update non-role fields while preserving existing admin status
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

-- 5. Expose is_early_access in candidate_directory view
CREATE OR REPLACE VIEW public.candidate_directory WITH (security_barrier = true, security_invoker = true) AS
SELECT p.id, p.full_name, p.avatar_url, p.location, p.is_verified,
       c.candidate_type, c.headline, c.bio, c.skills, c.experience, c.education,
       c.preferred_zone, c.specialization_area, c.years_experience, c.trade_description,
       p.is_early_access
FROM public.profiles p
JOIN public.candidate_profiles c ON c.id = p.id
WHERE p.role = 'candidate';

-- 6. Expose is_early_access in company_directory view
CREATE OR REPLACE VIEW public.company_directory WITH (security_barrier = true, security_invoker = true) AS
SELECT cp.id, cp.company_name, cp.industry, cp.company_size, cp.description, cp.logo_url, cp.banner_url,
       cp.website_url, cp.social_links, cp.verification_status,
       COALESCE(p.is_early_access, true) AS is_early_access
FROM public.company_profiles cp
LEFT JOIN public.profiles p ON p.id = cp.id;

GRANT SELECT ON public.company_directory TO anon, authenticated;
GRANT SELECT ON public.candidate_directory TO authenticated;
