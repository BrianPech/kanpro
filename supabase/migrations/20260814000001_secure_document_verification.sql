-- Private verification files and least-privilege access for the review workflow.
-- Apply with your normal Supabase migration process before deploying the UI changes.

UPDATE storage.buckets
SET public = false
WHERE id = 'profile_documents';

-- Convert records created by the old public-URL implementation to object
-- paths before the bucket is made private. New uploads already store a path.
UPDATE public.profile_documents
SET file_url = regexp_replace(file_url, '^.*/profile_documents/', '')
WHERE file_url ~ '/storage/v1/object/public/profile_documents/';

-- A document owner can upload, replace (which resets its status to pending), or delete
-- their own documents, but can never self-approve a document.
DROP POLICY IF EXISTS "Users can manage own documents" ON public.profile_documents;
CREATE POLICY "Owners can read own documents"
  ON public.profile_documents FOR SELECT TO authenticated
  USING (owner_id = (select auth.uid()));
CREATE POLICY "Owners can add own pending documents"
  ON public.profile_documents FOR INSERT TO authenticated
  WITH CHECK (owner_id = (select auth.uid()) AND status = 'pending');
CREATE POLICY "Owners can replace own documents as pending"
  ON public.profile_documents FOR UPDATE TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()) AND status = 'pending');
CREATE POLICY "Owners can delete own documents"
  ON public.profile_documents FOR DELETE TO authenticated
  USING (owner_id = (select auth.uid()));

-- Administrators can inspect and dictate verification records. The application
-- still checks the admin role in every server action as a second control.
CREATE POLICY "Admins can manage verification documents"
  ON public.profile_documents FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) AND p.role = 'admin'
  ));

-- Explicit consent is required. A company only sees the exact document types
-- selected by the candidate in an approved request.
DROP POLICY IF EXISTS "Companies can view applicant documents" ON public.profile_documents;
DROP POLICY IF EXISTS "Authorized companies can view candidate documents" ON public.profile_documents;
CREATE POLICY "Authorized companies can view requested candidate documents"
  ON public.profile_documents FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_access_requests dar
    WHERE dar.company_id = (select auth.uid())
      AND dar.candidate_id = profile_documents.owner_id
      AND dar.status = 'approved'
      AND profile_documents.doc_type::text = ANY (dar.requested_documents)
  ));

-- The bucket remains private. Owners and administrators may read only the
-- objects required to create signed URLs; no bucket-wide public read exists.
DROP POLICY IF EXISTS "Public Read Profile Documents Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read profile documents storage" ON storage.objects;
CREATE POLICY "Admins can read profile documents storage"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'profile_documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );
