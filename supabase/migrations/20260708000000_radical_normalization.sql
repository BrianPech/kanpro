-- Migration: Radical Normalization and Clean Slate
-- Created: 2026-07-08
-- Description: Destroys the old schema and recreates a strictly normalized (1NF, 2NF, 3NF) database with proper indexing, RLS, triggers, and compatibility views.

-----------------------------------------------------------
-- 0. DESTRUCCIÓN CONTROLADA (HARD RESET)
-----------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS trigger_create_profile_on_company_signup ON public.company_profiles CASCADE;
DROP TRIGGER IF EXISTS trigger_create_profile_on_admin_signup ON public.admin_profiles CASCADE;

-- profiles was a VIEW in previous migration
DROP VIEW IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- profiles_private was a TABLE in previous migration
DROP TABLE IF EXISTS public.profiles_private CASCADE;
DROP VIEW IF EXISTS public.profiles_private CASCADE;

DROP VIEW IF EXISTS public.profiles_view CASCADE;

DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.connections CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.vacancies CASCADE;
DROP TABLE IF EXISTS public.admin_profiles CASCADE;
DROP TABLE IF EXISTS public.company_profiles CASCADE;
DROP TABLE IF EXISTS public.candidate_profiles CASCADE;

DROP FUNCTION IF EXISTS public.handle_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.get_candidate_masked_phone CASCADE;
DROP FUNCTION IF EXISTS public.get_candidate_masked_whatsapp CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_auth_user CASCADE;
DROP FUNCTION IF EXISTS public.sync_profile_from_company CASCADE;
DROP FUNCTION IF EXISTS public.sync_profile_from_admin CASCADE;
DROP FUNCTION IF EXISTS public.sync_vacancies_columns CASCADE;
DROP FUNCTION IF EXISTS public.handle_application_notification CASCADE;
DROP FUNCTION IF EXISTS public.notify_candidate_contact CASCADE;
DROP FUNCTION IF EXISTS public.handle_profiles_view_insert CASCADE;
DROP FUNCTION IF EXISTS public.handle_profiles_view_update CASCADE;
DROP FUNCTION IF EXISTS public.handle_profiles_view_delete CASCADE;
DROP FUNCTION IF EXISTS public.handle_profiles_private_insert CASCADE;
DROP FUNCTION IF EXISTS public.handle_profiles_private_update CASCADE;
DROP FUNCTION IF EXISTS public.handle_profiles_private_delete CASCADE;

-----------------------------------------------------------
-- 1. EXTENSIONES Y FUNCIONES DE SOPORTE COMUNES
-----------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función helper para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-----------------------------------------------------------
-- 2. TABLAS FÍSICAS PRINCIPALES (TRÍADA SAGRADA)
-----------------------------------------------------------

-- 2.1. Tabla base de perfiles centrales (1:1 con auth.users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text NOT NULL,
  email text,
  role text NOT NULL CHECK (role IN ('candidate', 'company', 'admin')),
  location text,
  avatar_url text,
  is_approved boolean DEFAULT false NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  is_validated boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2. Tabla de información extendida de candidatos (1:1 con profiles)
CREATE TABLE public.candidate_profiles (
  id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  headline text,
  bio text,
  skills text[], -- Array nativo para 1NF
  experience jsonb DEFAULT '[]'::jsonb,
  education jsonb DEFAULT '[]'::jsonb,
  portfolio_links jsonb DEFAULT '[]'::jsonb,
  cv_url text,
  constancia_url text,
  category text,
  birth_date date,
  experience_summary text DEFAULT ''::text NOT NULL,
  phone text,
  whatsapp_number text DEFAULT ''::text NOT NULL,
  show_phone boolean DEFAULT false NOT NULL,
  show_email boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3. Tabla de información extendida de empresas (1:1 con profiles)
CREATE TABLE public.company_profiles (
  id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  company_name text NOT NULL,
  industry text,
  website_or_linkedin text,
  logo_url text,
  description text,
  phone text,
  company_size text,
  whatsapp_number text DEFAULT ''::text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.4. Tabla de información de administradores (1:1 con profiles)
CREATE TABLE public.admin_profiles (
  id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text NOT NULL,
  email text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.5. Tabla de vacantes
CREATE TABLE public.vacancies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE NOT NULL,
  recruiter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  requirements text,
  modality text NOT NULL CHECK (modality IN ('Remoto', 'Híbrido', 'Presencial')),
  salary text, -- Sincronizado por trigger
  salary_range text, -- Sincronizado por trigger
  skills text[],
  status text DEFAULT 'Activa' NOT NULL CHECK (status IN ('Activa', 'Pausada', 'Cerrada')),
  is_active boolean DEFAULT true NOT NULL,
  location text NOT NULL, -- geolocalizado por ciudad para el radar
  zone text, -- zona de trabajo
  category text,
  seniority text,
  contract_type text,
  employment_type text,
  benefits text[],
  salary_min numeric(10,2), -- exact numeric type
  salary_max numeric(10,2), -- exact numeric type
  currency text DEFAULT 'USD' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.6. Tabla de postulaciones
CREATE TABLE public.applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vacancy_id uuid REFERENCES public.vacancies(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'Pendiente' NOT NULL CHECK (status IN ('Pendiente', 'En revisión', 'Preseleccionado', 'Contratado', 'Descartado')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(candidate_id, vacancy_id)
);

-- 2.7. Tabla de conexiones (Métrica norte de clics a WhatsApp)
CREATE TABLE public.connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recruiter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vacancy_id uuid REFERENCES public.vacancies(id) ON DELETE SET NULL,
  initiated_by text DEFAULT 'recruiter' NOT NULL CHECK (initiated_by IN ('candidate', 'recruiter', 'company')),
  status text DEFAULT 'contacted' NOT NULL CHECK (status IN ('contacted', 'hired', 'archived')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.8. Tabla de notificaciones (Preparada para particionado por tiempo en el futuro)
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL, -- application_status, system, message
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id, created_at) -- composite PK to allow horizontal partitioning on created_at
);

-- 2.9. Tabla de mensajes de soporte
CREATE TABLE public.contact_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-----------------------------------------------------------
-- 3. VISTAS SEGURAS Y ENMASCARAMIENTO DE PRIVACIDAD
-----------------------------------------------------------

-- Funciones helper SECURITY DEFINER para enmascarar información de contacto de candidatos
CREATE OR REPLACE FUNCTION public.get_candidate_masked_phone(p_candidate_id uuid, p_viewer_id uuid)
RETURNS text AS $$
DECLARE
  v_phone text;
  v_show_phone boolean;
BEGIN
  SELECT phone, show_phone INTO v_phone, v_show_phone
  FROM public.candidate_profiles
  WHERE id = p_candidate_id;

  -- 1. El dueño puede ver su propio teléfono
  IF p_viewer_id = p_candidate_id THEN
    RETURN v_phone;
  END IF;

  -- 2. Los administradores pueden ver todos los teléfonos
  IF EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE id = p_viewer_id
  ) THEN
    RETURN v_phone;
  END IF;

  -- 3. Si el candidato configuró su privacidad como pública
  IF v_show_phone = true THEN
    RETURN v_phone;
  END IF;

  -- 4. Si existe una conexión activa (clic de reclutador a WhatsApp)
  IF EXISTS (
    SELECT 1 FROM public.connections
    WHERE candidate_id = p_candidate_id AND recruiter_id = p_viewer_id
  ) THEN
    RETURN v_phone;
  END IF;

  -- Por defecto: Oculto
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_candidate_masked_whatsapp(p_candidate_id uuid, p_viewer_id uuid)
RETURNS text AS $$
DECLARE
  v_whatsapp text;
  v_show_phone boolean;
BEGIN
  SELECT whatsapp_number, show_phone INTO v_whatsapp, v_show_phone
  FROM public.candidate_profiles
  WHERE id = p_candidate_id;

  IF p_viewer_id = p_candidate_id THEN
    RETURN v_whatsapp;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE id = p_viewer_id
  ) THEN
    RETURN v_whatsapp;
  END IF;

  IF v_show_phone = true THEN
    RETURN v_whatsapp;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.connections
    WHERE candidate_id = p_candidate_id AND recruiter_id = p_viewer_id
  ) THEN
    RETURN v_whatsapp;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Vista segura unificada para lectura en la API pública (LEFT JOIN obligatorios para Onboarding Express)
CREATE OR REPLACE VIEW public.profiles_view WITH (security_invoker = true) AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.location,
  p.avatar_url,
  p.is_approved,
  p.is_featured,
  p.is_validated,
  p.created_at,
  p.updated_at,
  c.headline,
  c.bio,
  c.skills,
  c.experience,
  c.education,
  c.portfolio_links,
  c.cv_url,
  c.constancia_url,
  c.category,
  c.birth_date,
  c.experience_summary,
  public.get_candidate_masked_phone(p.id, auth.uid()) AS phone,
  public.get_candidate_masked_whatsapp(p.id, auth.uid()) AS whatsapp_number,
  c.show_phone,
  c.show_email,
  co.company_name,
  co.industry,
  co.company_size,
  co.description AS company_description,
  co.website_or_linkedin,
  co.logo_url
FROM public.profiles p
LEFT JOIN public.candidate_profiles c ON p.id = c.id
LEFT JOIN public.company_profiles co ON p.id = co.id;

-- Vista de compatibilidad para profiles_private (LEFT JOIN y sin enmascaramiento para testing y fallbacks)
CREATE OR REPLACE VIEW public.profiles_private WITH (security_invoker = true) AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.location,
  p.avatar_url,
  p.is_approved,
  p.is_featured,
  p.is_validated,
  p.created_at,
  p.updated_at,
  c.headline,
  c.bio,
  c.skills,
  c.experience,
  c.education,
  c.portfolio_links,
  c.cv_url,
  c.constancia_url,
  c.category,
  c.birth_date,
  c.experience_summary,
  c.phone,
  c.whatsapp_number,
  c.show_phone,
  c.show_email,
  co.company_name,
  co.industry,
  co.company_size,
  co.description,
  co.website_or_linkedin,
  co.logo_url
FROM public.profiles p
LEFT JOIN public.candidate_profiles c ON p.id = c.id
LEFT JOIN public.company_profiles co ON p.id = co.id;

-----------------------------------------------------------
-- 4. TRIGGERS Y AUTOMATIZACIONES DE BASE DE DATOS
-----------------------------------------------------------

-- 4.1. Trigger para actualización automática de updated_at
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_candidate_profiles_updated_at BEFORE UPDATE ON public.candidate_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_company_profiles_updated_at BEFORE UPDATE ON public.company_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_admin_profiles_updated_at BEFORE UPDATE ON public.admin_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_vacancies_updated_at BEFORE UPDATE ON public.vacancies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4.2. Trigger automático al crear un usuario en auth.users (Fail-Safe Onboarding: Ubicación NULL)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_full_name text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'candidate');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario K’anPro');

  -- Inserta ÚNICAMENTE en la tabla base de profiles con ubicación en NULL
  INSERT INTO public.profiles (id, full_name, role, email, location, created_at, updated_at)
  VALUES (NEW.id, v_full_name, v_role, NEW.email, NULL, now(), now())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4.3. Trigger de compatibilidad de columnas para vacantes (Evita anomalies y formatea salarios)
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

  -- Sincronizar salary / salary_range a partir de salary_min y salary_max
  IF NEW.salary_min IS NOT NULL OR NEW.salary_max IS NOT NULL THEN
    IF NEW.salary_min IS NOT NULL AND NEW.salary_max IS NOT NULL THEN
      NEW.salary := NEW.currency || ' ' || to_char(NEW.salary_min, 'FM999,999,999') || ' - ' || to_char(NEW.salary_max, 'FM999,999,999');
    ELSIF NEW.salary_min IS NOT NULL THEN
      NEW.salary := NEW.currency || ' ' || to_char(NEW.salary_min, 'FM999,999,999');
    ELSE
      NEW.salary := NEW.currency || ' ' || to_char(NEW.salary_max, 'FM999,999,999');
    END IF;
  ELSE
    NEW.salary := NULL;
  END IF;
  NEW.salary_range := NEW.salary;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sync_vacancies_columns_trigger
  BEFORE INSERT OR UPDATE ON public.vacancies
  FOR EACH ROW EXECUTE FUNCTION public.sync_vacancies_columns();

-- 4.4. Trigger de notificaciones para postulaciones
CREATE OR REPLACE FUNCTION public.handle_application_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_vacancy_title text;
  v_company_id uuid;
  v_company_name text;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Obtener título de la vacante e ID de la empresa
    SELECT title, company_id INTO v_vacancy_title, v_company_id
    FROM public.vacancies
    WHERE id = NEW.vacancy_id;

    -- Obtener nombre de la empresa
    IF (v_company_id IS NOT NULL) THEN
      SELECT company_name INTO v_company_name
      FROM public.company_profiles
      WHERE id = v_company_id;
    END IF;

    INSERT INTO public.notifications (user_id, title, description, type, is_read, created_at)
    VALUES (
      NEW.candidate_id,
      'Actualización de postulación',
      'La empresa ' || coalesce(v_company_name, 'Empresa') || ' ha actualizado el estado de tu postulación para "' || coalesce(v_vacancy_title, 'Vacante') || '" a "' || NEW.status || '".',
      'application_status',
      false,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_application_status_update
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_application_notification();

-- 4.5. Triggers INSTEAD OF para permitir escrituras ordenadas en la vista profiles_private (para compatibilidad de tests)
CREATE OR REPLACE FUNCTION public.handle_profiles_private_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Insert en tabla base profiles primero
  INSERT INTO public.profiles (id, full_name, email, role, location, avatar_url, is_approved, is_featured, is_validated, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.full_name, 'Usuario K’anPro'),
    NEW.email,
    COALESCE(NEW.role, 'candidate'),
    NEW.location,
    COALESCE(NEW.avatar_url, NEW.logo_url),
    COALESCE(NEW.is_approved, false),
    COALESCE(NEW.is_featured, false),
    COALESCE(NEW.is_validated, false),
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    location = COALESCE(EXCLUDED.location, public.profiles.location),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    is_approved = EXCLUDED.is_approved,
    is_featured = EXCLUDED.is_featured,
    is_validated = EXCLUDED.is_validated,
    updated_at = now();

  -- 2. Insert en tabla de extensión correspondiente segundo
  IF COALESCE(NEW.role, 'candidate') = 'candidate' THEN
    INSERT INTO public.candidate_profiles (
      id, headline, bio, skills, experience, education, portfolio_links,
      cv_url, constancia_url, category, birth_date, experience_summary,
      phone, whatsapp_number, show_phone, show_email, created_at, updated_at
    ) VALUES (
      NEW.id, NEW.headline, NEW.bio, NEW.skills, NEW.experience, NEW.education, NEW.portfolio_links,
      NEW.cv_url, NEW.constancia_url, NEW.category, NEW.birth_date, COALESCE(NEW.experience_summary, ''),
      NEW.phone, COALESCE(NEW.whatsapp_number, ''), COALESCE(NEW.show_phone, false), COALESCE(NEW.show_email, false),
      COALESCE(NEW.created_at, now()), COALESCE(NEW.updated_at, now())
    ) ON CONFLICT (id) DO UPDATE SET
      headline = EXCLUDED.headline,
      bio = EXCLUDED.bio,
      skills = EXCLUDED.skills,
      experience = EXCLUDED.experience,
      education = EXCLUDED.education,
      portfolio_links = EXCLUDED.portfolio_links,
      cv_url = EXCLUDED.cv_url,
      constancia_url = EXCLUDED.constancia_url,
      category = EXCLUDED.category,
      birth_date = EXCLUDED.birth_date,
      experience_summary = COALESCE(EXCLUDED.experience_summary, ''),
      phone = EXCLUDED.phone,
      whatsapp_number = COALESCE(EXCLUDED.whatsapp_number, ''),
      show_phone = COALESCE(EXCLUDED.show_phone, false),
      show_email = COALESCE(EXCLUDED.show_email, false),
      updated_at = now();
  ELSIF NEW.role = 'company' THEN
    INSERT INTO public.company_profiles (
      id, company_name, industry, website_or_linkedin, logo_url, description, phone, company_size, whatsapp_number, created_at, updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.company_name, NEW.full_name),
      NEW.industry,
      NEW.website_or_linkedin,
      COALESCE(NEW.logo_url, NEW.avatar_url),
      COALESCE(NEW.description, NEW.bio),
      NEW.phone,
      NEW.company_size,
      COALESCE(NEW.whatsapp_number, ''),
      COALESCE(NEW.created_at, now()),
      COALESCE(NEW.updated_at, now())
    ) ON CONFLICT (id) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      industry = EXCLUDED.industry,
      website_or_linkedin = EXCLUDED.website_or_linkedin,
      logo_url = EXCLUDED.logo_url,
      description = EXCLUDED.description,
      phone = EXCLUDED.phone,
      company_size = EXCLUDED.company_size,
      whatsapp_number = COALESCE(EXCLUDED.whatsapp_number, ''),
      updated_at = now();
  ELSIF NEW.role = 'admin' THEN
    INSERT INTO public.admin_profiles (
      id, full_name, email, created_at, updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.full_name, 'Admin'),
      NEW.email,
      COALESCE(NEW.created_at, now()),
      COALESCE(NEW.updated_at, now())
    ) ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER insert_profiles_private_view
  INSTEAD OF INSERT ON public.profiles_private
  FOR EACH ROW EXECUTE FUNCTION public.handle_profiles_private_insert();

CREATE OR REPLACE FUNCTION public.handle_profiles_private_update()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Actualizar la tabla base profiles primero
  UPDATE public.profiles SET
    full_name = COALESCE(NEW.full_name, full_name),
    email = COALESCE(NEW.email, email),
    role = COALESCE(NEW.role, role),
    location = NEW.location,
    avatar_url = COALESCE(NEW.avatar_url, NEW.logo_url, avatar_url),
    is_approved = COALESCE(NEW.is_approved, is_approved),
    is_featured = COALESCE(NEW.is_featured, is_featured),
    is_validated = COALESCE(NEW.is_validated, is_validated),
    updated_at = now()
  WHERE id = OLD.id;

  -- 2. Actualizar la tabla de extensión correspondiente segundo
  IF OLD.role = 'candidate' THEN
    INSERT INTO public.candidate_profiles (
      id, headline, bio, skills, experience, education, portfolio_links,
      cv_url, constancia_url, category, birth_date, experience_summary,
      phone, whatsapp_number, show_phone, show_email, updated_at
    ) VALUES (
      OLD.id, NEW.headline, NEW.bio, NEW.skills, NEW.experience, NEW.education, NEW.portfolio_links,
      NEW.cv_url, NEW.constancia_url, NEW.category, NEW.birth_date, COALESCE(NEW.experience_summary, ''),
      NEW.phone, COALESCE(NEW.whatsapp_number, ''), COALESCE(NEW.show_phone, false), COALESCE(NEW.show_email, false),
      now()
    ) ON CONFLICT (id) DO UPDATE SET
      headline = COALESCE(EXCLUDED.headline, candidate_profiles.headline),
      bio = COALESCE(EXCLUDED.bio, candidate_profiles.bio),
      skills = COALESCE(EXCLUDED.skills, candidate_profiles.skills),
      experience = COALESCE(EXCLUDED.experience, candidate_profiles.experience),
      education = COALESCE(EXCLUDED.education, candidate_profiles.education),
      portfolio_links = COALESCE(EXCLUDED.portfolio_links, candidate_profiles.portfolio_links),
      cv_url = COALESCE(EXCLUDED.cv_url, candidate_profiles.cv_url),
      constancia_url = COALESCE(EXCLUDED.constancia_url, candidate_profiles.constancia_url),
      category = COALESCE(EXCLUDED.category, candidate_profiles.category),
      birth_date = COALESCE(EXCLUDED.birth_date, candidate_profiles.birth_date),
      experience_summary = COALESCE(EXCLUDED.experience_summary, candidate_profiles.experience_summary, ''),
      phone = COALESCE(EXCLUDED.phone, candidate_profiles.phone),
      whatsapp_number = COALESCE(EXCLUDED.whatsapp_number, candidate_profiles.whatsapp_number, ''),
      show_phone = COALESCE(EXCLUDED.show_phone, candidate_profiles.show_phone, false),
      show_email = COALESCE(EXCLUDED.show_email, candidate_profiles.show_email, false),
      updated_at = now();
  ELSIF OLD.role = 'company' THEN
    INSERT INTO public.company_profiles (
      id, company_name, website_or_linkedin, logo_url, description, phone, company_size, whatsapp_number, industry, updated_at
    ) VALUES (
      OLD.id,
      COALESCE(NEW.company_name, NEW.full_name),
      NEW.website_or_linkedin,
      COALESCE(NEW.logo_url, NEW.avatar_url),
      COALESCE(NEW.description, NEW.bio),
      NEW.phone,
      NEW.company_size,
      COALESCE(NEW.whatsapp_number, ''),
      NEW.industry,
      now()
    ) ON CONFLICT (id) DO UPDATE SET
      company_name = COALESCE(EXCLUDED.company_name, company_profiles.company_name),
      industry = COALESCE(EXCLUDED.industry, company_profiles.industry),
      website_or_linkedin = COALESCE(EXCLUDED.website_or_linkedin, company_profiles.website_or_linkedin),
      logo_url = COALESCE(EXCLUDED.logo_url, company_profiles.logo_url),
      description = COALESCE(EXCLUDED.description, company_profiles.description),
      phone = COALESCE(EXCLUDED.phone, company_profiles.phone),
      company_size = COALESCE(EXCLUDED.company_size, company_profiles.company_size),
      whatsapp_number = COALESCE(EXCLUDED.whatsapp_number, company_profiles.whatsapp_number, ''),
      updated_at = now();
  ELSIF OLD.role = 'admin' THEN
    INSERT INTO public.admin_profiles (
      id, full_name, email, updated_at
    ) VALUES (
      OLD.id,
      COALESCE(NEW.full_name, OLD.full_name),
      COALESCE(NEW.email, OLD.email),
      now()
    ) ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_profiles_private_view
  INSTEAD OF UPDATE ON public.profiles_private
  FOR EACH ROW EXECUTE FUNCTION public.handle_profiles_private_update();

CREATE OR REPLACE FUNCTION public.handle_profiles_private_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER delete_profiles_private_view
  INSTEAD OF DELETE ON public.profiles_private
  FOR EACH ROW EXECUTE FUNCTION public.handle_profiles_private_delete();

-----------------------------------------------------------
-- 5. RPC METRICAS Y NOTIFICACIONES
-----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_candidate_contact(
  p_candidate_id uuid,
  p_vacancy_title text,
  p_company_name text
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, description, type, is_read, created_at)
  VALUES (
    p_candidate_id,
    'Nueva propuesta de contacto',
    'La empresa ' || p_company_name || ' te ha contactado por WhatsApp sobre la vacante "' || p_vacancy_title || '".',
    'message',
    false,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-----------------------------------------------------------
-- 6. PERMISOS Y PRIVILEGIOS DE ACCESO (ROLES API)
-----------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.notify_candidate_contact(uuid, text, text) TO authenticated;

-----------------------------------------------------------
-- 7. SEGURIDAD Y POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-----------------------------------------------------------

-- Habilitar RLS en todas las tablas físicas del esquema
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 7.1. Políticas para profiles (base)
CREATE POLICY "Select profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert profiles" ON public.profiles FOR INSERT TO authenticated, anon WITH CHECK (id = auth.uid());
CREATE POLICY "Update profiles" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Delete profiles" ON public.profiles FOR DELETE TO authenticated USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7.2. Políticas para candidate_profiles
CREATE POLICY "Select candidate_profiles" ON public.candidate_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert candidate_profiles" ON public.candidate_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Update candidate_profiles" ON public.candidate_profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Delete candidate_profiles" ON public.candidate_profiles FOR DELETE TO authenticated USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7.3. Políticas para company_profiles
CREATE POLICY "Select company_profiles" ON public.company_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert company_profiles" ON public.company_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Update company_profiles" ON public.company_profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Delete company_profiles" ON public.company_profiles FOR DELETE TO authenticated USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7.4. Políticas para admin_profiles
CREATE POLICY "Select admin_profiles" ON public.admin_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert admin_profiles" ON public.admin_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Update admin_profiles" ON public.admin_profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Delete admin_profiles" ON public.admin_profiles FOR DELETE TO authenticated USING (id = auth.uid());

-- 7.5. Políticas para vacancies (Seguridad estricta de Empresas)
CREATE POLICY "Select vacancies" ON public.vacancies FOR SELECT TO authenticated USING (
  status = 'Activa' OR recruiter_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Insert vacancies" ON public.vacancies FOR INSERT TO authenticated WITH CHECK (
  recruiter_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'company')
);
CREATE POLICY "Update vacancies" ON public.vacancies FOR UPDATE TO authenticated USING (
  recruiter_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'company')
);
CREATE POLICY "Delete vacancies" ON public.vacancies FOR DELETE TO authenticated USING (
  recruiter_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7.6. Políticas para applications (Consolidadas)
CREATE POLICY "Select applications" ON public.applications FOR SELECT TO authenticated USING (
  candidate_id = auth.uid() OR vacancy_id IN (SELECT id FROM public.vacancies WHERE recruiter_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Insert applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (candidate_id = auth.uid());
CREATE POLICY "Update applications" ON public.applications FOR UPDATE TO authenticated USING (
  vacancy_id IN (SELECT id FROM public.vacancies WHERE recruiter_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Delete applications" ON public.applications FOR DELETE TO authenticated USING (
  (candidate_id = auth.uid() AND status != 'Contratado') OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7.7. Políticas para connections (Métrica norte simétrica)
CREATE POLICY "Select connections" ON public.connections FOR SELECT TO authenticated USING (candidate_id = auth.uid() OR recruiter_id = auth.uid());
CREATE POLICY "Insert connections" ON public.connections FOR INSERT TO authenticated WITH CHECK (
  (auth.uid() = candidate_id) OR
  (auth.uid() = recruiter_id)
);
CREATE POLICY "Update connections" ON public.connections FOR UPDATE TO authenticated USING (candidate_id = auth.uid() OR recruiter_id = auth.uid());

-- 7.8. Políticas para notifications
CREATE POLICY "Select notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Update notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 7.9. Políticas para contact_messages (Abierta para inserción)
CREATE POLICY "Insert contact_messages" ON public.contact_messages FOR INSERT WITH CHECK (
  name IS NOT NULL AND length(trim(name)) > 0 AND
  email IS NOT NULL AND length(trim(email)) > 4 AND
  message IS NOT NULL AND length(trim(message)) > 0
);
CREATE POLICY "Select contact_messages" ON public.contact_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-----------------------------------------------------------
-- 8. ÍNDICES DE RENDIMIENTO Y OPTIMIZACIÓN (RADAR / FILTERS)
-----------------------------------------------------------
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_location_idx ON public.profiles (location);
CREATE INDEX IF NOT EXISTS vacancies_company_id_idx ON public.vacancies (company_id);
CREATE INDEX IF NOT EXISTS vacancies_recruiter_id_idx ON public.vacancies (recruiter_id);
CREATE INDEX IF NOT EXISTS vacancies_location_idx ON public.vacancies (location);
CREATE INDEX IF NOT EXISTS vacancies_zone_idx ON public.vacancies (zone);
CREATE INDEX IF NOT EXISTS vacancies_is_active_idx ON public.vacancies (is_active);
CREATE INDEX IF NOT EXISTS vacancies_status_idx ON public.vacancies (status);
CREATE INDEX IF NOT EXISTS applications_candidate_id_idx ON public.applications (candidate_id);
CREATE INDEX IF NOT EXISTS applications_vacancy_id_idx ON public.applications (vacancy_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON public.applications (status);
CREATE INDEX IF NOT EXISTS connections_candidate_id_idx ON public.connections (candidate_id);
CREATE INDEX IF NOT EXISTS connections_recruiter_id_idx ON public.connections (recruiter_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
