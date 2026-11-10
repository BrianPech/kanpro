-- ==============================================================================
-- Migration: 20261112000000_harden_storage_cv_preview_signed_urls.sql
-- Description: Non-destructive RLS security policy addition on storage.objects.
-- Allows authenticated company users to generate signed URLs and read CV/documents
-- stored in the 'profile_documents' bucket for:
--   1. Active company employees.
--   2. Candidates with approved document access requests.
--   3. Candidates with applications to vacancies managed or owned by the company.
-- STRICT: NON-DESTRUCTIVE - Does NOT drop tables, alter schemas, or delete records.
-- ==============================================================================

DROP POLICY IF EXISTS "Companies can view applicant and employee documents storage" ON storage.objects;

CREATE POLICY "Companies can view applicant and employee documents storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile_documents'
    AND (
      -- Case 1: Active employee of the company
      EXISTS (
        SELECT 1 FROM public.company_employees e
        WHERE e.employee_id::text = (storage.foldername(name))[1]
          AND e.company_id = (SELECT auth.uid())
          AND e.status = 'active'
      )
      -- Case 2: Candidate with an approved document access request
      OR EXISTS (
        SELECT 1 FROM public.document_access_requests dar
        WHERE dar.company_id = (SELECT auth.uid())
          AND dar.candidate_id::text = (storage.foldername(name))[1]
          AND dar.status = 'approved'
      )
      -- Case 3: Candidate who applied to a vacancy owned or managed by the company
      OR EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.vacancies v ON v.id = a.vacancy_id
        WHERE a.candidate_id::text = (storage.foldername(name))[1]
          AND (v.company_id = (SELECT auth.uid()) OR v.recruiter_id = (SELECT auth.uid()))
      )
    )
  );
