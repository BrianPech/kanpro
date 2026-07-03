-- Migration: Create Company Module Tables and Privacy Protection
-- Created: 2026-07-01
-- Description: Acts as a DBA to update vacancies, create connections, enable RLS, and mask candidate contact phone details securely.

-----------------------------------------------------------
-- 1. MODIFICATION OF public.vacancies TABLE
-----------------------------------------------------------
-- Add new columns for Express Vacancies management
ALTER TABLE public.vacancies
ADD COLUMN IF NOT EXISTS recruiter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS zone text,
ADD COLUMN IF NOT EXISTS requirements text,
ADD COLUMN IF NOT EXISTS salary_range text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Backfill existing vacancies if any (set defaults/mapping)
UPDATE public.vacancies
SET
  recruiter_id = COALESCE(recruiter_id, company_id),
  requirements = COALESCE(requirements, description),
  salary_range = COALESCE(salary_range, salary),
  is_active = COALESCE(is_active, (status = 'Activa'));

-- Make recruiter_id and is_active NOT NULL after backfilling
ALTER TABLE public.vacancies ALTER COLUMN recruiter_id SET NOT NULL;
ALTER TABLE public.vacancies ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE public.vacancies ALTER COLUMN is_active SET NOT NULL;

-- Create sync trigger function to maintain backward/forward compatibility
CREATE OR REPLACE FUNCTION public.sync_vacancies_columns()
RETURNS trigger AS $$
BEGIN
  -- Sync recruiter_id / company_id
  IF NEW.recruiter_id IS NULL AND NEW.company_id IS NOT NULL THEN
    NEW.recruiter_id := NEW.company_id;
  ELSIF NEW.company_id IS NULL AND NEW.recruiter_id IS NOT NULL THEN
    NEW.company_id := NEW.recruiter_id;
  END IF;

  -- Sync is_active / status
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

  -- Sync requirements / description
  IF TG_OP = 'INSERT' OR NEW.requirements IS DISTINCT FROM OLD.requirements THEN
    NEW.description := COALESCE(NEW.requirements, '');
  ELSIF NEW.description IS DISTINCT FROM OLD.description THEN
    NEW.requirements := NEW.description;
  END IF;

  -- Sync salary_range / salary
  IF TG_OP = 'INSERT' OR NEW.salary_range IS DISTINCT FROM OLD.salary_range THEN
    NEW.salary := NEW.salary_range;
  ELSIF NEW.salary IS DISTINCT FROM OLD.salary THEN
    NEW.salary_range := NEW.salary;
  END IF;

  -- Sync location / zone
  IF TG_OP = 'INSERT' OR NEW.zone IS DISTINCT FROM OLD.zone THEN
    NEW.location := NEW.zone;
  ELSIF NEW.location IS DISTINCT FROM OLD.location THEN
    NEW.zone := NEW.location;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_vacancies_columns_trigger ON public.vacancies;
CREATE TRIGGER sync_vacancies_columns_trigger
BEFORE INSERT OR UPDATE ON public.vacancies
FOR EACH ROW EXECUTE FUNCTION public.sync_vacancies_columns();

-----------------------------------------------------------
-- 2. REFACTORING OF public.profiles TABLE TO A SECURED VIEW
-----------------------------------------------------------
-- Rename the original profiles table to profiles_private
ALTER TABLE public.profiles RENAME TO profiles_private;

-- Rename constraints and triggers automatically updated by Postgres,
-- but we make sure the private table RLS is still configured.
ALTER TABLE public.profiles_private ENABLE ROW LEVEL SECURITY;

-----------------------------------------------------------
-- 3. CREATION OF public.connections TABLE
-----------------------------------------------------------
-- Create the connections table referencing profiles_private
CREATE TABLE IF NOT EXISTS public.connections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id uuid REFERENCES public.profiles_private(id) ON DELETE CASCADE NOT NULL,
    recruiter_id uuid REFERENCES public.profiles_private(id) ON DELETE CASCADE NOT NULL,
    vacancy_id uuid REFERENCES public.vacancies(id) ON DELETE SET NULL,
    initiated_by text DEFAULT 'recruiter' NOT NULL CHECK (initiated_by IN ('candidate', 'recruiter')),
    status text DEFAULT 'contacted' NOT NULL CHECK (status IN ('contacted', 'hired', 'archived')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security on connections
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Grant permissions to connections table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO anon, authenticated, service_role;

-- Create index on candidate and recruiter ids for connections performance
CREATE INDEX IF NOT EXISTS connections_candidate_id_idx ON public.connections(candidate_id);
CREATE INDEX IF NOT EXISTS connections_recruiter_id_idx ON public.connections(recruiter_id);

-----------------------------------------------------------
-- 4. CREATE SECURE VIEW FOR public.profiles
-----------------------------------------------------------
-- Create the masked public.profiles view exposing candidates' phone number
-- only to authorized recruiters (those with connections) or if show_phone = true.
CREATE OR REPLACE VIEW public.profiles AS
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
  -- Masked phone column
  CASE
    -- 1. Owner can see their own phone
    WHEN auth.uid() = id THEN phone
    -- 2. Admins can see all phones
    WHEN EXISTS (
      SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()
    ) THEN phone
    -- 3. If candidate has show_phone = true
    WHEN show_phone = true THEN phone
    -- 4. If an active connection exists
    WHEN EXISTS (
      SELECT 1 FROM public.connections
      WHERE candidate_id = profiles_private.id AND recruiter_id = auth.uid()
    ) THEN phone
    ELSE NULL
  END AS phone,
  -- Masked whatsapp_number column
  CASE
    -- 1. Owner can see their own number
    WHEN auth.uid() = id THEN whatsapp_number
    -- 2. Admins can see all numbers
    WHEN EXISTS (
      SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()
    ) THEN whatsapp_number
    -- 3. If candidate has show_phone = true
    WHEN show_phone = true THEN whatsapp_number
    -- 4. If an active connection exists
    WHEN EXISTS (
      SELECT 1 FROM public.connections
      WHERE candidate_id = profiles_private.id AND recruiter_id = auth.uid()
    ) THEN whatsapp_number
    ELSE NULL
  END AS whatsapp_number
FROM public.profiles_private;

-- Grant standard API access to the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated, service_role;

-----------------------------------------------------------
-- 5. WRITE INSTEAD OF TRIGGERS FOR WRITING ON public.profiles VIEW
-----------------------------------------------------------
-- Insert trigger function
CREATE OR REPLACE FUNCTION public.handle_profiles_view_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Security check: only owner, admin or service role can insert
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger function
CREATE OR REPLACE FUNCTION public.handle_profiles_view_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Security check: only owner, admin or service role can update
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete trigger function
CREATE OR REPLACE FUNCTION public.handle_profiles_view_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Security check: only owner, admin or service role can delete
  IF auth.uid() <> OLD.id AND NOT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()) AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Permission denied to delete profile for another user';
  END IF;

  DELETE FROM public.profiles_private WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind triggers to view
DROP TRIGGER IF EXISTS insert_profiles_view ON public.profiles;
CREATE TRIGGER insert_profiles_view
INSTEAD OF INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profiles_view_insert();

DROP TRIGGER IF EXISTS update_profiles_view ON public.profiles;
CREATE TRIGGER update_profiles_view
INSTEAD OF UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profiles_view_update();

DROP TRIGGER IF EXISTS delete_profiles_view ON public.profiles;
CREATE TRIGGER delete_profiles_view
INSTEAD OF DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profiles_view_delete();

-----------------------------------------------------------
-- 6. RLS POLICIES FOR vacancies TABLE
-----------------------------------------------------------
-- Drop old policies
DROP POLICY IF EXISTS "Vacancies are viewable by everyone" ON public.vacancies;
DROP POLICY IF EXISTS "Companies can insert their own vacancies" ON public.vacancies;
DROP POLICY IF EXISTS "Companies can update their own vacancies" ON public.vacancies;
DROP POLICY IF EXISTS "Companies can delete their own vacancies" ON public.vacancies;

-- Public select for active vacancies, or recruiters viewing their own, or admin
CREATE POLICY "Read vacancies" ON public.vacancies
FOR SELECT
USING (
  is_active = true OR
  recruiter_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()
  )
);

-- Write policies limited to recruiters (company role) for their own vacancies
CREATE POLICY "Insert vacancies" ON public.vacancies
FOR INSERT TO authenticated
WITH CHECK (
  recruiter_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles_private
    WHERE id = auth.uid() AND role = 'company'
  )
);

CREATE POLICY "Update vacancies" ON public.vacancies
FOR UPDATE TO authenticated
USING (
  recruiter_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles_private
    WHERE id = auth.uid() AND role = 'company'
  )
)
WITH CHECK (
  recruiter_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles_private
    WHERE id = auth.uid() AND role = 'company'
  )
);

CREATE POLICY "Delete vacancies" ON public.vacancies
FOR DELETE TO authenticated
USING (
  recruiter_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles_private
    WHERE id = auth.uid() AND role = 'company'
  )
);

-----------------------------------------------------------
-- 7. RLS POLICIES FOR connections TABLE
-----------------------------------------------------------
-- Read connection details only if candidate or recruiter involved
CREATE POLICY "Read connections" ON public.connections
FOR SELECT TO authenticated
USING (
  candidate_id = auth.uid() OR recruiter_id = auth.uid()
);

-- Insert connections only by recruiters
CREATE POLICY "Insert connections" ON public.connections
FOR INSERT TO authenticated
WITH CHECK (
  recruiter_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles_private
    WHERE id = auth.uid() AND role = 'company'
  )
);

-- Update connections only by candidates or recruiters involved
CREATE POLICY "Update connections" ON public.connections
FOR UPDATE TO authenticated
USING (
  candidate_id = auth.uid() OR recruiter_id = auth.uid()
)
WITH CHECK (
  candidate_id = auth.uid() OR recruiter_id = auth.uid()
);

-- Fix: Grant privileges on public.notifications to anon, authenticated, and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon, authenticated, service_role;
