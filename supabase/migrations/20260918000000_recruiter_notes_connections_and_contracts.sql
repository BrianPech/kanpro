-- ============================================================================
-- Migration: 20260918000000_recruiter_notes_connections_and_contracts.sql
-- Purpose: Add recruiter notes, ratings, interview details to applications,
--          create public.connections table for WhatsApp candidate contact tracking,
--          create public.company_contracts table for hiring formalization,
--          and create notify_candidate_contact RPC function.
--
-- STRICT GUARANTEE: Non-destructive migration. Preserves all existing rows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENRICH public.applications TABLE WITH RECRUITER FIELDS
-- ----------------------------------------------------------------------------
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS interview_details jsonb,
  ADD COLUMN IF NOT EXISTS hired_at timestamptz;

-- Index on application status and rating for fast filtering
CREATE INDEX IF NOT EXISTS idx_applications_rating ON public.applications (vacancy_id, rating);
CREATE INDEX IF NOT EXISTS idx_applications_hired_at ON public.applications (hired_at) WHERE hired_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. CREATE public.connections TABLE (CANDIDATE <-> COMPANY WHATSAPP INTERACTION)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.connections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recruiter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vacancy_id uuid REFERENCES public.vacancies(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'contacted',
    initiated_by text NOT NULL DEFAULT 'company' CHECK (initiated_by IN ('candidate', 'company', 'recruiter')),
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance indexes for connections
CREATE INDEX IF NOT EXISTS idx_connections_candidate ON public.connections (candidate_id);
CREATE INDEX IF NOT EXISTS idx_connections_recruiter ON public.connections (recruiter_id);
CREATE INDEX IF NOT EXISTS idx_connections_vacancy ON public.connections (vacancy_id);

-- Enable RLS on connections
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connections
DROP POLICY IF EXISTS "Users can view own connections" ON public.connections;
CREATE POLICY "Users can view own connections" ON public.connections
    FOR SELECT
    USING (
        candidate_id = (SELECT auth.uid()) OR 
        recruiter_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "Users can create connections" ON public.connections;
CREATE POLICY "Users can create connections" ON public.connections
    FOR INSERT
    WITH CHECK (
        candidate_id = (SELECT auth.uid()) OR 
        recruiter_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "Users can update own connections" ON public.connections;
CREATE POLICY "Users can update own connections" ON public.connections
    FOR UPDATE
    USING (
        candidate_id = (SELECT auth.uid()) OR 
        recruiter_id = (SELECT auth.uid())
    );

-- ----------------------------------------------------------------------------
-- 3. RPC FUNCTION: notify_candidate_contact
-- ----------------------------------------------------------------------------
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.notify_candidate_contact(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.notify_candidate_contact(uuid, text, text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. CREATE public.company_contracts TABLE (FORMAL EMPLOYMENT CONTRACTS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_contracts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    employee_id uuid REFERENCES public.company_employees(id) ON DELETE CASCADE,
    candidate_id uuid REFERENCES public.candidate_profiles(id) ON DELETE SET NULL,
    application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
    folio text NOT NULL,
    job_title text NOT NULL,
    department text NOT NULL,
    contract_type text NOT NULL,
    template_type text NOT NULL DEFAULT 'indeterminado',
    start_date date NOT NULL,
    end_date date,
    salary numeric(10,2) NOT NULL,
    payment_frequency text NOT NULL DEFAULT 'quincenal',
    company_signed boolean NOT NULL DEFAULT true,
    company_signature_url text,
    employee_signed boolean NOT NULL DEFAULT false,
    employee_signature_url text,
    status text NOT NULL DEFAULT 'vigente',
    notes text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance indexes for company_contracts
CREATE INDEX IF NOT EXISTS idx_company_contracts_company ON public.company_contracts (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_contracts_employee ON public.company_contracts (employee_id);
CREATE INDEX IF NOT EXISTS idx_company_contracts_candidate ON public.company_contracts (candidate_id);
CREATE INDEX IF NOT EXISTS idx_company_contracts_status ON public.company_contracts (company_id, status);

-- Enable RLS on company_contracts
ALTER TABLE public.company_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_contracts
DROP POLICY IF EXISTS "Companies can manage own contracts" ON public.company_contracts;
CREATE POLICY "Companies can manage own contracts" ON public.company_contracts
    FOR ALL
    USING (company_id = (SELECT auth.uid()))
    WITH CHECK (company_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Employees can view own contracts" ON public.company_contracts;
CREATE POLICY "Employees can view own contracts" ON public.company_contracts
    FOR SELECT
    USING (
        candidate_id = (SELECT auth.uid()) OR
        employee_id IN (
            SELECT id FROM public.company_employees WHERE employee_id = (SELECT auth.uid())
        )
    );
