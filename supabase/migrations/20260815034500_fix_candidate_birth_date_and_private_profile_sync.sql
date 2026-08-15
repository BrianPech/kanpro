-- 1. Actualizar el trigger handle_new_user para sincronizar automáticamente birth_date en candidate_private_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_role_str text;
  assigned_role public.user_role;
  company_title text;
  raw_birth_date text;
  parsed_birth_date date;
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
    whatsapp_number = COALESCE(NULLIF(EXCLUDED.whatsapp_number, ''), public.profiles.whatsapp_number),
    updated_at = NOW();
  
  -- Inicializar perfil según el rol
  IF assigned_role = 'candidate' THEN
    INSERT INTO public.candidate_profiles (id) VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;

    -- Extraer y normalizar fecha de nacimiento
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

-- 2. Backfill para usuarios candidatos existentes que ya tenían birth_date en user_metadata
INSERT INTO public.candidate_private_profiles (id, birth_date)
SELECT
  u.id,
  CASE
    WHEN u.raw_user_meta_data->>'birth_date' ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN to_date(u.raw_user_meta_data->>'birth_date', 'DD/MM/YYYY')
    WHEN u.raw_user_meta_data->>'birth_date' ~ '^\d{4}-\d{2}-\d{2}$' THEN (u.raw_user_meta_data->>'birth_date')::date
    WHEN u.raw_user_meta_data->>'birth_date' IS NOT NULL AND u.raw_user_meta_data->>'birth_date' <> '' THEN (u.raw_user_meta_data->>'birth_date')::date
    ELSE NULL
  END
FROM auth.users u
WHERE (u.raw_user_meta_data->>'role' = 'candidate' OR u.raw_user_meta_data->>'role' IS NULL)
ON CONFLICT (id) DO UPDATE SET
  birth_date = COALESCE(public.candidate_private_profiles.birth_date, EXCLUDED.birth_date);
