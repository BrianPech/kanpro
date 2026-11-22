-- Migration: 20261122022000_harden_profile_documents_rls.sql
-- Description: Fase A (#3) — Close profile_documents RLS leak reintroduced by 20261117000000.
--   Restricts company SELECT access on public.profile_documents strictly to:
--     1. Applicant CV documents (doc_type = 'cv') when the candidate applied to the company's vacancy.
--     2. Explicitly approved documents listed in document_access_requests.requested_documents
--        for an active approved request (status = 'approved' AND rejected_at IS NULL).

ALTER TABLE public.profile_documents ENABLE ROW LEVEL SECURITY;

-- Drop all legacy and overly permissive company SELECT policies
DROP POLICY IF EXISTS "Companies can view applicant documents" ON public.profile_documents;
DROP POLICY IF EXISTS "Authorized companies can view candidate documents" ON public.profile_documents;
DROP POLICY IF EXISTS "Authorized companies can view requested candidate documents" ON public.profile_documents;
DROP POLICY IF EXISTS "Authorized companies and employers can view candidate documents" ON public.profile_documents;

-- 1. Companies can view ONLY the CV of candidates who applied to their vacancies
DROP POLICY IF EXISTS "Companies can view applicant CV documents" ON public.profile_documents;
CREATE POLICY "Companies can view applicant CV documents"
  ON public.profile_documents
  FOR SELECT
  TO authenticated
  USING (
    doc_type = 'cv'::public.document_type
    AND EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.vacancies v ON v.id = a.vacancy_id
      WHERE a.candidate_id = profile_documents.owner_id
        AND (
          v.company_id = (SELECT auth.uid())
          OR v.recruiter_id = (SELECT auth.uid())
          OR public.user_has_company_access(v.company_id)
        )
    )
  );

-- 2. Companies can view ONLY explicitly approved documents matching requested_documents
DROP POLICY IF EXISTS "Authorized companies can view approved requested documents" ON public.profile_documents;
CREATE POLICY "Authorized companies can view approved requested documents"
  ON public.profile_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.document_access_requests dar
      WHERE dar.candidate_id = profile_documents.owner_id
        AND dar.status = 'approved'
        AND dar.rejected_at IS NULL
        AND (profile_documents.doc_type)::text = ANY (dar.requested_documents)
        AND (
          dar.company_id = (SELECT auth.uid())
          OR public.user_has_company_access(dar.company_id)
        )
    )
  );
