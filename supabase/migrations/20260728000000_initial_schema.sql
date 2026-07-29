-- ============================================================================
-- K'ANPRO UNIFIED DATABASE SCHEMA MIGRATION
-- Migration: 20260728000000_initial_schema.sql
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONES Y ENUMS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('candidate', 'company', 'admin');
CREATE TYPE candidate_type AS ENUM ('trabajador', 'oficio', 'profesionista');
CREATE TYPE company_entity_type AS ENUM ('persona_fisica', 'persona_moral');
CREATE TYPE document_type AS ENUM (
  'ine_passport', 'curp', 'constancia_situacion_fiscal', 'proof_of_address',
  'cv', 'cedula_profesional', 'titulo_profesional', 'acta_constitutiva',
  'legal_power', 'legal_rep_id', 'imss_registry', 'repse', 'operating_license',
  'work_certificate', 'recommendation_letter', 'course_certificate', 'work_photo'
);
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE employee_status AS ENUM ('onboarding', 'active', 'suspended', 'terminated');

-- ============================================================================
-- 2. TABLA BASE DE PERFILES
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'candidate',
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  avatar_url TEXT,
  location TEXT DEFAULT 'Mérida, Yucatán',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. PERFILES DE CANDIDATOS
-- ============================================================================
CREATE TABLE public.candidate_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_type candidate_type NOT NULL DEFAULT 'trabajador',
  curp VARCHAR(18) UNIQUE,
  birth_date DATE,
  headline TEXT,
  bio TEXT,
  rfc VARCHAR(13),
  cedula_profesional TEXT,
  specialization_area TEXT,
  years_experience INT DEFAULT 0,
  trade_description TEXT,
  preferred_zone TEXT,
  skills TEXT[] DEFAULT '{}',
  languages JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  portfolio_links JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  job_alerts_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. PERFILES DE EMPRESAS
-- ============================================================================
CREATE TABLE public.company_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type company_entity_type NOT NULL DEFAULT 'persona_moral',
  company_name TEXT NOT NULL,
  legal_name TEXT,
  rfc VARCHAR(13) NOT NULL,
  fiscal_address TEXT NOT NULL,
  industry TEXT NOT NULL,
  company_size TEXT,
  description TEXT,
  legal_rep_name TEXT,
  corporate_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  branch_addresses JSONB DEFAULT '[]'::jsonb,
  imss_patronal_registry TEXT,
  repse_registry TEXT,
  logo_url TEXT,
  banner_url TEXT,
  credits_available INT NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 5.00,
  verification_status verification_status DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. PLANTILLA DE EMPLEADOS (B2B)
-- ============================================================================
CREATE TABLE public.company_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  department TEXT,
  employee_code TEXT,
  status employee_status NOT NULL DEFAULT 'onboarding',
  hire_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, employee_id)
);

-- ============================================================================
-- 6. EXPEDIENTE DIGITAL Y DOCUMENTOS
-- ============================================================================
CREATE TABLE public.profile_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doc_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  status verification_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. VACANTES Y POSTULACIONES
-- ============================================================================
CREATE TABLE public.vacancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  category TEXT NOT NULL,
  zone TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Mérida',
  modality TEXT NOT NULL DEFAULT 'Presencial',
  employment_type TEXT NOT NULL,
  salary_min NUMERIC(10,2),
  salary_max NUMERIC(10,2),
  currency VARCHAR(3) DEFAULT 'MXN',
  benefits TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vacancy_id UUID NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'applied',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vacancy_id, candidate_id)
);

CREATE TABLE public.saved_vacancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  vacancy_id UUID NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id, vacancy_id)
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  target_vacancy_id UUID REFERENCES public.vacancies(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. ÍNDICES DE ALTO RENDIMIENTO
-- ============================================================================
CREATE INDEX idx_vacancies_feed ON public.vacancies (is_active, status, zone, category);
CREATE INDEX idx_vacancies_salary ON public.vacancies (salary_min, salary_max);
CREATE INDEX idx_vacancies_skills_gin ON public.vacancies USING GIN (skills);
CREATE INDEX idx_vacancies_benefits_gin ON public.vacancies USING GIN (benefits);
CREATE INDEX idx_candidate_skills_gin ON public.candidate_profiles USING GIN (skills);
CREATE INDEX idx_profile_documents_owner ON public.profile_documents (owner_id, doc_type);
CREATE INDEX idx_company_employees_company ON public.company_employees (company_id, status);

-- ============================================================================
-- 9. HABILITAR ROW LEVEL SECURITY (RLS) Y POLÍTICAS
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profile basic info view" ON public.profiles FOR SELECT USING (true);

-- Candidate Profiles Policies
CREATE POLICY "Candidates can view own profile" ON public.candidate_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Candidates can update own profile" ON public.candidate_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Candidates can insert own profile" ON public.candidate_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Companies can view candidate profiles" ON public.candidate_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'company')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Company Profiles Policies
CREATE POLICY "Anyone can view company profiles" ON public.company_profiles FOR SELECT USING (true);
CREATE POLICY "Companies can update own profile" ON public.company_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Companies can insert own profile" ON public.company_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Company Employees Policies
CREATE POLICY "Companies can manage own employees" ON public.company_employees FOR ALL USING (
  company_id = auth.uid()
);
CREATE POLICY "Employees can view own employment record" ON public.company_employees FOR SELECT USING (
  employee_id = auth.uid()
);

-- Vacancies Policies
CREATE POLICY "Anyone can view active vacancies" ON public.vacancies FOR SELECT USING (is_active = true AND status = 'published');
CREATE POLICY "Companies can view all own vacancies" ON public.vacancies FOR SELECT USING (recruiter_id = auth.uid() OR company_id = auth.uid());
CREATE POLICY "Companies can insert vacancies" ON public.vacancies FOR INSERT WITH CHECK (recruiter_id = auth.uid() OR company_id = auth.uid());
CREATE POLICY "Companies can update own vacancies" ON public.vacancies FOR UPDATE USING (recruiter_id = auth.uid() OR company_id = auth.uid());
CREATE POLICY "Companies can delete own vacancies" ON public.vacancies FOR DELETE USING (recruiter_id = auth.uid() OR company_id = auth.uid());

-- Applications Policies
CREATE POLICY "Candidates can manage own applications" ON public.applications FOR ALL USING (candidate_id = auth.uid());
CREATE POLICY "Companies can view applications for their vacancies" ON public.applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.vacancies v
    WHERE v.id = vacancy_id AND (v.company_id = auth.uid() OR v.recruiter_id = auth.uid())
  )
);
CREATE POLICY "Companies can update application status for their vacancies" ON public.applications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.vacancies v
    WHERE v.id = vacancy_id AND (v.company_id = auth.uid() OR v.recruiter_id = auth.uid())
  )
);

-- Saved Vacancies Policies
CREATE POLICY "Candidates can manage saved vacancies" ON public.saved_vacancies FOR ALL USING (candidate_id = auth.uid());

-- Notifications Policies
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- Profile Documents Policies
CREATE POLICY "Users can manage own documents" ON public.profile_documents FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Companies can view applicant documents" ON public.profile_documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.vacancies v ON v.id = a.vacancy_id
    WHERE a.candidate_id = profile_documents.owner_id
    AND (v.company_id = auth.uid() OR v.recruiter_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.company_employees e
    WHERE e.employee_id = profile_documents.owner_id
    AND e.company_id = auth.uid()
  )
);

-- ============================================================================
-- 10. TRIGGER DE REGISTRO AUTOMÁTICO
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  assigned_role public.user_role;
BEGIN
  assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'candidate'::public.user_role);

  INSERT INTO public.profiles (id, email, full_name, whatsapp_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario K’anPro'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', ''),
    assigned_role
  );
  
  -- Inicializar perfil según el rol
  IF assigned_role = 'candidate' THEN
    INSERT INTO public.candidate_profiles (id) VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  ELSIF assigned_role = 'company' THEN
    INSERT INTO public.company_profiles (
      id, company_name, rfc, fiscal_address, industry
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Nueva Empresa'),
      COALESCE(NEW.raw_user_meta_data->>'rfc', 'XAXX010101000'),
      COALESCE(NEW.raw_user_meta_data->>'fiscal_address', 'Mérida, Yucatán'),
      COALESCE(NEW.raw_user_meta_data->>'industry', 'General')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Revocar la ejecución pública para proteger contra llamadas RPC expuestas en la API REST
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 11. CONFIGURACIÓN DE STORAGE BUCKETS Y POLÍTICAS DE STORAGE
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('profile_documents', 'profile_documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('company_assets', 'company_assets', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Nota: Los buckets públicos ('avatars', 'company_assets') sirven objetos vía su URL pública
-- sin requerir políticas SELECT en storage.objects que permitan listar todo el bucket.

CREATE POLICY "Users Upload Own Avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users Update Own Avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users Delete Own Avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Companies Upload Assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company_assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Companies Update Assets" ON storage.objects FOR UPDATE USING (bucket_id = 'company_assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Companies Delete Assets" ON storage.objects FOR DELETE USING (bucket_id = 'company_assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users Manage Own Profile Documents Storage" ON storage.objects FOR ALL USING (bucket_id = 'profile_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

