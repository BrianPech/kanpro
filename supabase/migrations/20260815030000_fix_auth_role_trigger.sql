-- Fix handle_new_user function to properly handle user roles and profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  raw_role_str text;
  assigned_role public.user_role;
  company_title text;
BEGIN
  raw_role_str := NEW.raw_user_meta_data->>'role';
  
  IF raw_role_str = 'company' THEN
    assigned_role := 'company'::public.user_role;
  ELSIF raw_role_str = 'admin' THEN
    assigned_role := 'admin'::public.user_role;
  ELSE
    assigned_role := 'candidate'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, whatsapp_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario K’anPro'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', ''),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    updated_at = NOW();
  
  -- Inicializar perfil según el rol
  IF assigned_role = 'candidate' THEN
    INSERT INTO public.candidate_profiles (id) VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
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

-- Fix any inconsistent profile roles where auth metadata says company/admin but profiles says candidate
UPDATE public.profiles p
SET role = (u.raw_user_meta_data->>'role')::public.user_role
FROM auth.users u
WHERE p.id = u.id
  AND u.raw_user_meta_data->>'role' IN ('company', 'admin')
  AND p.role <> (u.raw_user_meta_data->>'role')::public.user_role;

-- Ensure company_profiles entries exist for all company profiles
INSERT INTO public.company_profiles (id, company_name, rfc, fiscal_address, industry)
SELECT p.id, COALESCE(p.full_name, 'Nueva Empresa'), 'XAXX010101000', 'Mérida, Yucatán', 'General'
FROM public.profiles p
WHERE p.role = 'company'
ON CONFLICT (id) DO NOTHING;

-- Ensure candidate_profiles entries exist for all candidate profiles
INSERT INTO public.candidate_profiles (id)
SELECT p.id
FROM public.profiles p
WHERE p.role = 'candidate'
ON CONFLICT (id) DO NOTHING;
