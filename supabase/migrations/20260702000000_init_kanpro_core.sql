-- Migration: Unificación y Consolidación Inicial de K'anPro Core
-- Created: 2026-07-02
-- Description: Inicializa todo el esquema limpio, triggers y RLS del ecosistema K'anPro en un solo archivo.

-----------------------------------------------------------
-- 0. LIMPIEZA DE OBJETOS PREVIOS (CASCADE)
-----------------------------------------------------------
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP VIEW IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.connections CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.vacancies CASCADE;
DROP TABLE IF EXISTS public.admin_profiles CASCADE;
DROP TABLE IF EXISTS public.company_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles_private CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;

DROP FUNCTION IF EXISTS public.handle_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.get_candidate_masked_phone CASCADE;
DROP FUNCTION IF EXISTS public.get_candidate_masked_whatsapp CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created CASCADE;
DROP FUNCTION IF EXISTS public.notify_candidate_contact CASCADE;

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
-- 2. TABLAS FÍSICAS PRINCIPALES
-----------------------------------------------------------

-- 2.1. Tabla privada de perfiles centrales
CREATE TABLE IF NOT EXISTS public.profiles_private (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('candidate', 'company', 'admin')),
  bio text,
  phone text,
  whatsapp_number text DEFAULT '' NOT NULL,
  location text,
  skills text[],
  avatar_url text,
  headline text,
  category text,
  birth_date date,
  experience jsonb DEFAULT '[]'::jsonb,
  education jsonb DEFAULT '[]'::jsonb,
  cv_url text,
  constancia_url text,
  is_approved boolean DEFAULT false NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  show_phone boolean DEFAULT false NOT NULL,
  show_email boolean DEFAULT false NOT NULL,
  email text,
  portfolio_links jsonb DEFAULT '[]'::jsonb,
  is_validated boolean DEFAULT false NOT NULL,
  experience_summary text DEFAULT '' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2. Tabla de información extendida de empresas
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  company_name text NOT NULL,
  industry text,
  website_or_linkedin text,
  location text,
  logo_url text,
  description text,
  phone text,
  company_size text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3. Tabla de información de administradores
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text NOT NULL,
  email text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.4. Tabla de vacantes (con soporte de compatibilidad y campos express)
CREATE TABLE IF NOT EXISTS public.vacancies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recruiter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  requirements text,
  modality text NOT NULL, -- Remoto, Híbrido, Presencial
  salary text,
  salary_range text,
  skills text[],
  status text DEFAULT 'Activa' NOT NULL, -- Activa, Pausada, Cerrada
  is_active boolean DEFAULT true NOT NULL,
  location text,
  zone text,
  category text,
  seniority text,
  contract_type text,
  employment_type text,
  vacancies_count integer DEFAULT 1,
  application_deadline date,
  benefits text[],
  salary_min numeric,
  salary_max numeric,
  currency text DEFAULT 'USD',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.5. Tabla de postulaciones
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid REFERENCES public.profiles_private(id) ON DELETE CASCADE NOT NULL,
  vacancy_id uuid REFERENCES public.vacancies(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'Pendiente' NOT NULL CHECK (status IN ('Pendiente', 'En revisión', 'Preseleccionado', 'Contratado', 'Descartado')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(candidate_id, vacancy_id)
);

-- 2.6. Tabla de conexiones (Métrica norte de clics a WhatsApp)
CREATE TABLE IF NOT EXISTS public.connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid REFERENCES public.profiles_private(id) ON DELETE CASCADE NOT NULL,
  recruiter_id uuid REFERENCES public.profiles_private(id) ON DELETE CASCADE NOT NULL,
  vacancy_id uuid REFERENCES public.vacancies(id) ON DELETE SET NULL,
  initiated_by text DEFAULT 'recruiter' NOT NULL CHECK (initiated_by IN ('candidate', 'recruiter', 'company')),
  status text DEFAULT 'contacted' NOT NULL CHECK (status IN ('contacted', 'hired', 'archived')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.7. Tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL, -- application_status, system, message
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.8. Tabla de mensajes de soporte
CREATE TABLE IF NOT EXISTS public.contact_messages (
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
  FROM public.profiles_private
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
  FROM public.profiles_private
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

-- Vista segura centralizada expuesta a la API pública
CREATE OR REPLACE VIEW public.profiles WITH (security_invoker = true) AS
SELECT
  id,
  full_name,
  role,
  bio,
  location,
  skills,
  avatar_url,
  headline,
  category,
  birth_date,
  created_at,
  updated_at,
  experience,
  education,
  cv_url,
  constancia_url,
  is_approved,
  is_featured,
  show_email,
  email,
  portfolio_links,
  is_validated,
  experience_summary,
  show_phone,
  public.get_candidate_masked_phone(id, auth.uid()) AS phone,
  public.get_candidate_masked_whatsapp(id, auth.uid()) AS whatsapp_number
FROM public.profiles_private;

-----------------------------------------------------------
-- 4. TRIGGERS Y AUTOMATIZACIONES DE BASE DE DATOS
-----------------------------------------------------------

-- 4.1. Trigger para actualización automática de updated_at
CREATE TRIGGER set_profiles_private_updated_at BEFORE UPDATE ON public.profiles_private FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_company_profiles_updated_at BEFORE UPDATE ON public.company_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_admin_profiles_updated_at BEFORE UPDATE ON public.admin_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_vacancies_updated_at BEFORE UPDATE ON public.vacancies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4.2. Trigger automático al crear un usuario en auth.users (Fail-Safe Inicial)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_full_name text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'candidate');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario K’anPro');

  INSERT INTO public.profiles_private (id, full_name, role, email, created_at, updated_at)
  VALUES (NEW.id, v_full_name, v_role, NEW.email, now(), now())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4.3. Trigger de sincronización de perfiles extendidos (Empresas y Administradores)
CREATE OR REPLACE FUNCTION public.sync_profile_from_company()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles_private (id, full_name, role, location, created_at, updated_at)
  VALUES (NEW.id, NEW.company_name, 'company', NEW.location, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    location = EXCLUDED.location,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_create_profile_on_company_signup
  AFTER INSERT OR UPDATE ON public.company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_company();

CREATE OR REPLACE FUNCTION public.sync_profile_from_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles_private (id, full_name, role, email, created_at, updated_at)
  VALUES (NEW.id, NEW.full_name, 'admin', NEW.email, NEW.created_at, NEW.updated_at)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_create_profile_on_admin_signup
  AFTER INSERT OR UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_admin();

-- 4.4. Trigger de compatibilidad de columnas para vacantes
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
  IF TG_OP = 'INSERT' OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    IF NEW.is_active THEN
      NEW.status := 'Activa';
    ELSE
      NEW.status := 'Pausada';
    END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'Activa' THEN
      NEW.is_active := true;
    ELSE
      NEW.is_active := false;
    END IF;
  END IF;

  -- Sincronizar description / requirements
  IF TG_OP = 'INSERT' OR NEW.requirements IS DISTINCT FROM OLD.requirements THEN
    NEW.description := COALESCE(NEW.requirements, '');
  ELSIF NEW.description IS DISTINCT FROM OLD.description THEN
    NEW.requirements := NEW.description;
  END IF;

  -- Sincronizar salary / salary_range
  IF TG_OP = 'INSERT' OR NEW.salary_range IS DISTINCT FROM OLD.salary_range THEN
    NEW.salary := NEW.salary_range;
  ELSIF NEW.salary IS DISTINCT FROM OLD.salary THEN
    NEW.salary_range := NEW.salary;
  END IF;

  -- Sincronizar location / zone
  IF TG_OP = 'INSERT' OR NEW.zone IS DISTINCT FROM OLD.zone THEN
    NEW.location := NEW.zone;
  ELSIF NEW.location IS DISTINCT FROM OLD.location THEN
    NEW.zone := NEW.location;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sync_vacancies_columns_trigger
  BEFORE INSERT OR UPDATE ON public.vacancies
  FOR EACH ROW EXECUTE FUNCTION public.sync_vacancies_columns();

-- 4.5. Trigger de notificaciones para postulaciones
CREATE OR REPLACE FUNCTION public.handle_application_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_vacancy_title text;
  v_company_id uuid;
  v_company_name text;
  v_candidate_id uuid;
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

    INSERT INTO public.notifications (user_id, title, description, type, is_read)
    VALUES (
      NEW.candidate_id,
      'Actualización de postulación',
      'La empresa ' || coalesce(v_company_name, 'Empresa') || ' ha actualizado el estado de tu postulación para "' || coalesce(v_vacancy_title, 'Vacante') || '" a "' || NEW.status || '".',
      'application_status',
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_application_status_update
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_application_notification();

-- 4.6. Triggers INSTEAD OF para permitir escrituras en la vista pública profiles
CREATE OR REPLACE FUNCTION public.handle_profiles_view_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() <> NEW.id AND NOT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()) AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Permission denied to insert profile for another user';
  END IF;

  INSERT INTO public.profiles_private (
    id, full_name, role, bio, phone, location, skills, avatar_url,
    headline, category, birth_date, created_at, updated_at,
    experience, education, cv_url, constancia_url, is_approved,
    is_featured, show_phone, show_email, email, portfolio_links,
    is_validated, experience_summary, whatsapp_number
  ) VALUES (
    NEW.id, NEW.full_name, NEW.role, NEW.bio, NEW.phone, NEW.location, NEW.skills, NEW.avatar_url,
    NEW.headline, NEW.category, NEW.birth_date, COALESCE(NEW.created_at, now()), COALESCE(NEW.updated_at, now()),
    COALESCE(NEW.experience, '[]'::jsonb), COALESCE(NEW.education, '[]'::jsonb), NEW.cv_url, NEW.constancia_url, COALESCE(NEW.is_approved, false),
    COALESCE(NEW.is_featured, false), COALESCE(NEW.show_phone, false), COALESCE(NEW.show_email, false), NEW.email, COALESCE(NEW.portfolio_links, '[]'::jsonb),
    COALESCE(NEW.is_validated, false), COALESCE(NEW.experience_summary, ''), COALESCE(NEW.whatsapp_number, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER insert_profiles_view
  INSTEAD OF INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profiles_view_insert();

CREATE OR REPLACE FUNCTION public.handle_profiles_view_update()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() <> OLD.id AND NOT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()) AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Permission denied to update profile for another user';
  END IF;

  UPDATE public.profiles_private SET
    full_name = COALESCE(NEW.full_name, full_name),
    role = COALESCE(NEW.role, role),
    bio = NEW.bio,
    phone = NEW.phone,
    location = NEW.location,
    skills = NEW.skills,
    avatar_url = NEW.avatar_url,
    headline = NEW.headline,
    category = NEW.category,
    birth_date = NEW.birth_date,
    updated_at = now(),
    experience = COALESCE(NEW.experience, experience),
    education = COALESCE(NEW.education, education),
    cv_url = NEW.cv_url,
    constancia_url = NEW.constancia_url,
    is_approved = COALESCE(NEW.is_approved, is_approved),
    is_featured = COALESCE(NEW.is_featured, is_featured),
    show_phone = COALESCE(NEW.show_phone, show_phone),
    show_email = COALESCE(NEW.show_email, show_email),
    email = NEW.email,
    portfolio_links = COALESCE(NEW.portfolio_links, portfolio_links),
    is_validated = COALESCE(NEW.is_validated, is_validated),
    experience_summary = COALESCE(NEW.experience_summary, experience_summary),
    whatsapp_number = COALESCE(NEW.whatsapp_number, whatsapp_number)
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_profiles_view
  INSTEAD OF UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profiles_view_update();

CREATE OR REPLACE FUNCTION public.handle_profiles_view_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() <> OLD.id AND NOT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()) AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Permission denied to delete profile for another user';
  END IF;

  DELETE FROM public.profiles_private WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER delete_profiles_view
  INSTEAD OF DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profiles_view_delete();

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
  INSERT INTO public.notifications (user_id, title, description, type, is_read)
  VALUES (
    p_candidate_id,
    'Nueva propuesta de contacto',
    'La empresa ' || p_company_name || ' te ha contactado por WhatsApp sobre la vacante "' || p_vacancy_title || '".',
    'message',
    false
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
ALTER TABLE public.profiles_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 7.1. Políticas para profiles_private
CREATE POLICY "Select profiles_private" ON public.profiles_private FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert profiles_private" ON public.profiles_private FOR INSERT TO authenticated, anon WITH CHECK (id = auth.uid());
CREATE POLICY "Update profiles_private" ON public.profiles_private FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Delete profiles_private" ON public.profiles_private FOR DELETE TO authenticated USING (id = auth.uid());

-- 7.2. Políticas para company_profiles
CREATE POLICY "Select company_profiles" ON public.company_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert company_profiles" ON public.company_profiles FOR INSERT TO authenticated, anon WITH CHECK (id = auth.uid());
CREATE POLICY "Update company_profiles" ON public.company_profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- 7.3. Políticas para admin_profiles
CREATE POLICY "Select admin_profiles" ON public.admin_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert admin_profiles" ON public.admin_profiles FOR INSERT TO authenticated, anon WITH CHECK (id = auth.uid());
CREATE POLICY "Update admin_profiles" ON public.admin_profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- 7.4. Políticas para vacancies (Seguridad estricta de Empresas)
CREATE POLICY "Select vacancies" ON public.vacancies FOR SELECT TO authenticated USING (
  is_active = true OR recruiter_id = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "Insert vacancies" ON public.vacancies FOR INSERT TO authenticated WITH CHECK (
  recruiter_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles_private WHERE id = auth.uid() AND role = 'company')
);
CREATE POLICY "Update vacancies" ON public.vacancies FOR UPDATE TO authenticated USING (
  recruiter_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles_private WHERE id = auth.uid() AND role = 'company')
);
CREATE POLICY "Delete vacancies" ON public.vacancies FOR DELETE TO authenticated USING (
  recruiter_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles_private WHERE id = auth.uid() AND role = 'company')
);

-- 7.5. Políticas para applications (Consolidadas)
CREATE POLICY "Select applications" ON public.applications FOR SELECT TO authenticated USING (
  candidate_id = auth.uid() OR vacancy_id IN (SELECT id FROM public.vacancies WHERE recruiter_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "Insert applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (candidate_id = auth.uid());
CREATE POLICY "Update applications" ON public.applications FOR UPDATE TO authenticated USING (
  vacancy_id IN (SELECT id FROM public.vacancies WHERE recruiter_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
);
CREATE POLICY "Delete applications" ON public.applications FOR DELETE TO authenticated USING (
  (candidate_id = auth.uid() AND status != 'Contratado') OR EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid())
);

-- 7.6. Políticas para connections (Métrica norte)
CREATE POLICY "Select connections" ON public.connections FOR SELECT TO authenticated USING (candidate_id = auth.uid() OR recruiter_id = auth.uid());
CREATE POLICY "Insert connections" ON public.connections FOR INSERT TO authenticated WITH CHECK (
  recruiter_id = auth.uid() AND EXISTS (SELECT 1 FROM public.profiles_private WHERE id = auth.uid() AND role = 'company')
);
CREATE POLICY "Update connections" ON public.connections FOR UPDATE TO authenticated USING (candidate_id = auth.uid() OR recruiter_id = auth.uid());

-- 7.7. Políticas para notifications
CREATE POLICY "Select notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Update notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 7.8. Políticas para contact_messages (Abierta para inserción)
CREATE POLICY "Insert contact_messages" ON public.contact_messages FOR INSERT WITH CHECK (
  name IS NOT NULL AND length(trim(name)) > 0 AND
  email IS NOT NULL AND length(trim(email)) > 4 AND
  message IS NOT NULL AND length(trim(message)) > 0
);
CREATE POLICY "Select contact_messages" ON public.contact_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()));

-----------------------------------------------------------
-- 8. ÍNDICES DE RENDIMIENTO Y OPTIMIZACIÓN
-----------------------------------------------------------
CREATE INDEX IF NOT EXISTS profiles_role_is_approved_idx ON public.profiles_private (role, is_approved);
CREATE INDEX IF NOT EXISTS vacancies_recruiter_id_idx ON public.vacancies (recruiter_id);
CREATE INDEX IF NOT EXISTS vacancies_location_idx ON public.vacancies (location);
CREATE INDEX IF NOT EXISTS vacancies_is_active_idx ON public.vacancies (is_active);
CREATE INDEX IF NOT EXISTS applications_candidate_id_idx ON public.applications (candidate_id);
CREATE INDEX IF NOT EXISTS applications_vacancy_id_idx ON public.applications (vacancy_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON public.applications (status);
CREATE INDEX IF NOT EXISTS connections_candidate_id_idx ON public.connections (candidate_id);
CREATE INDEX IF NOT EXISTS connections_recruiter_id_idx ON public.connections (recruiter_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx ON public.notifications (user_id, is_read);
