-- ============================================================================
-- Migration: 20260805000001_document_access_requests.sql
-- Candidate Document Access Request and Authorization Flow
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.document_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    requested_documents TEXT[] NOT NULL DEFAULT ARRAY['curp', 'rfc', 'ine'],
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.document_access_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Companies can create document requests" ON public.document_access_requests;
DROP POLICY IF EXISTS "Companies can view their document requests" ON public.document_access_requests;
DROP POLICY IF EXISTS "Candidates can view their document requests" ON public.document_access_requests;
DROP POLICY IF EXISTS "Candidates can update their document requests" ON public.document_access_requests;

-- RLS Policies for document_access_requests
CREATE POLICY "Companies can create document requests"
    ON public.document_access_requests FOR INSERT
    WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Companies can view their document requests"
    ON public.document_access_requests FOR SELECT
    USING (auth.uid() = company_id);

CREATE POLICY "Candidates can view their document requests"
    ON public.document_access_requests FOR SELECT
    USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates can update their document requests"
    ON public.document_access_requests FOR UPDATE
    USING (auth.uid() = candidate_id);

-- RLS Policy on profile_documents for authorized companies
DROP POLICY IF EXISTS "Authorized companies can view candidate documents" ON public.profile_documents;

CREATE POLICY "Authorized companies can view candidate documents"
    ON public.profile_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.document_access_requests dar
            WHERE dar.company_id = auth.uid()
              AND dar.candidate_id = profile_documents.owner_id
              AND dar.status = 'approved'
        )
    );
