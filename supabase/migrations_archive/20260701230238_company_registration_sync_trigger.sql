-- Migration: Company Registration Sync Trigger
-- Created: 2026-07-01
-- Description: Automatically inserts a company profile into profiles_private when it registers in company_profiles.

-- 1. Create trigger function
CREATE OR REPLACE FUNCTION public.handle_company_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update the profile in profiles_private
  INSERT INTO public.profiles_private (
    id,
    full_name,
    role,
    location,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.company_name,
    'company',
    NEW.location,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    location = EXCLUDED.location,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create trigger
DROP TRIGGER IF EXISTS trigger_create_profile_on_company_signup ON public.company_profiles;
CREATE TRIGGER trigger_create_profile_on_company_signup
AFTER INSERT ON public.company_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_company_profile_insert();
