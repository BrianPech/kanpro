-- Migration: 20261122030000_harden_dossier_and_company_assets_storage_rls.sql
-- Description: Fase B Bloque 1 (Adición A / H1 + #5)
--   1. Add company_id column to public.profile_documents for strict multi-company isolation
--      of employee dossier documents and company verification documents.
--   2. Allow company owners/admins to upload & read employee dossier documents under
--      dossiers/{companyId}/{employeeOwnerId}/... in both public.profile_documents and storage.objects
--      without exposing candidates' personal documents.
--   3. Allow company owners/admins to manage company verification documents under
--      company_verification/{companyId}/... isolated per company_id.
--   4. Harden company_assets storage policies against non-UUID folder casts and enable SELECT
--      on company_assets so upsert: true succeeds when updating logos/banners.

-- ============================================================================
-- 1. ADD company_id TO public.profile_documents
-- ============================================================================

ALTER TABLE public.profile_documents
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.company_profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_profile_documents_company_id
  ON public.profile_documents(company_id);

-- ============================================================================
-- 2. RLS POLICIES ON public.profile_documents
-- ============================================================================

ALTER TABLE public.profile_documents ENABLE ROW LEVEL SECURITY;

-- Keep candidate personal document inserts/updates scoped to company_id IS NULL
DROP POLICY IF EXISTS "Owners can add own pending documents" ON public.profile_documents;
CREATE POLICY "Owners can add own pending documents"
  ON public.profile_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND status = 'pending'::public.verification_status
    AND company_id IS NULL
  );

DROP POLICY IF EXISTS "Owners can replace own documents as pending" ON public.profile_documents;
CREATE POLICY "Owners can replace own documents as pending"
  ON public.profile_documents
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    AND company_id IS NULL
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND status = 'pending'::public.verification_status
    AND company_id IS NULL
  );

-- H1: Company owners/admins can insert dossier documents for their active/company employees
DROP POLICY IF EXISTS "Company admins can upload dossier documents for own employees" ON public.profile_documents;
CREATE POLICY "Company admins can upload dossier documents for own employees"
  ON public.profile_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    split_part(file_url, '/', 1) = 'dossiers'
    AND CASE
      WHEN split_part(file_url, '/', 2) ~ '^[0-9a-fA-F-]{36}$' THEN
        (company_id IS NULL OR company_id = split_part(file_url, '/', 2)::uuid)
        AND (
          split_part(file_url, '/', 2) = (SELECT auth.uid())::text
          OR public.user_has_company_access(split_part(file_url, '/', 2)::uuid, ARRAY['owner', 'admin'])
        )
        AND EXISTS (
          SELECT 1
          FROM public.company_employees e
          WHERE e.company_id = split_part(file_url, '/', 2)::uuid
            AND e.employee_id = profile_documents.owner_id
        )
      ELSE false
    END
  );

-- H1: Company members can read ONLY dossier documents scoped to their company (never personal docs)
DROP POLICY IF EXISTS "Companies can view own uploaded dossier documents" ON public.profile_documents;
CREATE POLICY "Companies can view own uploaded dossier documents"
  ON public.profile_documents
  FOR SELECT
  TO authenticated
  USING (
    split_part(file_url, '/', 1) = 'dossiers'
    AND CASE
      WHEN split_part(file_url, '/', 2) ~ '^[0-9a-fA-F-]{36}$' THEN
        (company_id IS NULL OR company_id = split_part(file_url, '/', 2)::uuid)
        AND (
          split_part(file_url, '/', 2) = (SELECT auth.uid())::text
          OR public.user_has_company_access(split_part(file_url, '/', 2)::uuid)
        )
        AND EXISTS (
          SELECT 1
          FROM public.company_employees e
          WHERE e.company_id = split_part(file_url, '/', 2)::uuid
            AND e.employee_id = profile_documents.owner_id
        )
      ELSE false
    END
  );

-- #5: Multi-company verification documents scoped by company_id
DROP POLICY IF EXISTS "Company members can view own company verification documents" ON public.profile_documents;
CREATE POLICY "Company members can view own company verification documents"
  ON public.profile_documents
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL
    AND split_part(file_url, '/', 1) = 'company_verification'
    AND (
      company_id = (SELECT auth.uid())
      OR public.user_has_company_access(company_id)
    )
  );

DROP POLICY IF EXISTS "Company admins can insert own company verification documents" ON public.profile_documents;
CREATE POLICY "Company admins can insert own company verification documents"
  ON public.profile_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IS NOT NULL
    AND split_part(file_url, '/', 1) = 'company_verification'
    AND owner_id = (SELECT auth.uid())
    AND status = 'pending'::public.verification_status
    AND (
      company_id = (SELECT auth.uid())
      OR public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
    )
  );

DROP POLICY IF EXISTS "Company admins can update own company verification documents" ON public.profile_documents;
CREATE POLICY "Company admins can update own company verification documents"
  ON public.profile_documents
  FOR UPDATE
  TO authenticated
  USING (
    (
      company_id IS NOT NULL
      AND split_part(file_url, '/', 1) = 'company_verification'
      AND (
        company_id = (SELECT auth.uid())
        OR public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
      )
    )
    OR (
      company_id IS NULL
      AND owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    company_id IS NOT NULL
    AND split_part(file_url, '/', 1) = 'company_verification'
    AND owner_id = (SELECT auth.uid())
    AND status = 'pending'::public.verification_status
    AND (
      company_id = (SELECT auth.uid())
      OR public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
    )
  );

DROP POLICY IF EXISTS "Company admins can delete own company verification documents" ON public.profile_documents;
CREATE POLICY "Company admins can delete own company verification documents"
  ON public.profile_documents
  FOR DELETE
  TO authenticated
  USING (
    company_id IS NOT NULL
    AND split_part(file_url, '/', 1) = 'company_verification'
    AND (
      company_id = (SELECT auth.uid())
      OR public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
    )
  );

-- ============================================================================
-- 3. STORAGE POLICIES ON storage.objects (profile_documents & company_assets)
-- ============================================================================

-- H1: Company owners/admins manage employee dossier files in dossiers/{companyId}/{employeeId}/...
DROP POLICY IF EXISTS "Company admins manage employee dossier documents storage" ON storage.objects;
CREATE POLICY "Company admins manage employee dossier documents storage"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'profile_documents'
    AND (storage.foldername(name))[1] = 'dossiers'
    AND CASE
      WHEN (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$'
        AND (storage.foldername(name))[3] ~ '^[0-9a-fA-F-]{36}$'
      THEN (
        (
          (storage.foldername(name))[2] = (SELECT auth.uid())::text
          OR public.user_has_company_access(((storage.foldername(name))[2])::uuid, ARRAY['owner', 'admin'])
        )
        AND EXISTS (
          SELECT 1
          FROM public.company_employees e
          WHERE e.company_id = ((storage.foldername(name))[2])::uuid
            AND (
              e.employee_id::text = (storage.foldername(name))[3]
              OR e.id::text = (storage.foldername(name))[3]
            )
        )
      )
      ELSE false
    END
  )
  WITH CHECK (
    bucket_id = 'profile_documents'
    AND (storage.foldername(name))[1] = 'dossiers'
    AND CASE
      WHEN (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$'
        AND (storage.foldername(name))[3] ~ '^[0-9a-fA-F-]{36}$'
      THEN (
        (
          (storage.foldername(name))[2] = (SELECT auth.uid())::text
          OR public.user_has_company_access(((storage.foldername(name))[2])::uuid, ARRAY['owner', 'admin'])
        )
        AND EXISTS (
          SELECT 1
          FROM public.company_employees e
          WHERE e.company_id = ((storage.foldername(name))[2])::uuid
            AND (
              e.employee_id::text = (storage.foldername(name))[3]
              OR e.id::text = (storage.foldername(name))[3]
            )
        )
      )
      ELSE false
    END
  );

-- H1: Company members (including viewer/recruiter) can read dossier storage objects of their company
DROP POLICY IF EXISTS "Company members read employee dossier documents storage" ON storage.objects;
CREATE POLICY "Company members read employee dossier documents storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile_documents'
    AND (storage.foldername(name))[1] = 'dossiers'
    AND CASE
      WHEN (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$'
        AND (storage.foldername(name))[3] ~ '^[0-9a-fA-F-]{36}$'
      THEN (
        (
          (storage.foldername(name))[2] = (SELECT auth.uid())::text
          OR public.user_has_company_access(((storage.foldername(name))[2])::uuid)
        )
        AND EXISTS (
          SELECT 1
          FROM public.company_employees e
          WHERE e.company_id = ((storage.foldername(name))[2])::uuid
            AND (
              e.employee_id::text = (storage.foldername(name))[3]
              OR e.id::text = (storage.foldername(name))[3]
            )
        )
      )
      ELSE false
    END
  );

-- Employees can read signed URLs for their own dossier documents
DROP POLICY IF EXISTS "Employees read own dossier documents storage" ON storage.objects;
CREATE POLICY "Employees read own dossier documents storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile_documents'
    AND (storage.foldername(name))[1] = 'dossiers'
    AND (storage.foldername(name))[3] = (SELECT auth.uid())::text
  );

-- #5: Company owners/admins manage company verification files in company_verification/{companyId}/...
DROP POLICY IF EXISTS "Company admins manage company verification documents storage" ON storage.objects;
CREATE POLICY "Company admins manage company verification documents storage"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'profile_documents'
    AND (storage.foldername(name))[1] = 'company_verification'
    AND CASE
      WHEN (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$' THEN (
        (storage.foldername(name))[2] = (SELECT auth.uid())::text
        OR public.user_has_company_access(((storage.foldername(name))[2])::uuid, ARRAY['owner', 'admin'])
      )
      ELSE false
    END
  )
  WITH CHECK (
    bucket_id = 'profile_documents'
    AND (storage.foldername(name))[1] = 'company_verification'
    AND CASE
      WHEN (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$' THEN (
        (storage.foldername(name))[2] = (SELECT auth.uid())::text
        OR public.user_has_company_access(((storage.foldername(name))[2])::uuid, ARRAY['owner', 'admin'])
      )
      ELSE false
    END
  );

-- #5: Harden company_assets policies with safe UUID check and add public SELECT for upserts/assets
DROP POLICY IF EXISTS "Public read company assets" ON storage.objects;
CREATE POLICY "Public read company assets"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'company_assets');

DROP POLICY IF EXISTS "Companies Upload Assets" ON storage.objects;
CREATE POLICY "Companies Upload Assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company_assets'
    AND CASE
      WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' THEN (
        (SELECT auth.uid())::text = (storage.foldername(name))[1]
        OR public.user_has_company_access(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'admin', 'recruiter'])
      )
      ELSE false
    END
  );

DROP POLICY IF EXISTS "Companies Update Assets" ON storage.objects;
CREATE POLICY "Companies Update Assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company_assets'
    AND CASE
      WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' THEN (
        (SELECT auth.uid())::text = (storage.foldername(name))[1]
        OR public.user_has_company_access(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'admin', 'recruiter'])
      )
      ELSE false
    END
  )
  WITH CHECK (
    bucket_id = 'company_assets'
    AND CASE
      WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' THEN (
        (SELECT auth.uid())::text = (storage.foldername(name))[1]
        OR public.user_has_company_access(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'admin', 'recruiter'])
      )
      ELSE false
    END
  );

DROP POLICY IF EXISTS "Companies Delete Assets" ON storage.objects;
CREATE POLICY "Companies Delete Assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company_assets'
    AND CASE
      WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' THEN (
        (SELECT auth.uid())::text = (storage.foldername(name))[1]
        OR public.user_has_company_access(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'admin'])
      )
      ELSE false
    END
  );
