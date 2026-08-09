-- ============================================================================
-- Migration: 20260805000002_fix_profile_documents_storage.sql
-- Ensure profile_documents storage bucket is public and RLS policies allow read/write
-- ============================================================================

-- Make profile_documents storage bucket public so publicUrl works for previews and documents
UPDATE storage.buckets
SET public = true
WHERE id = 'profile_documents';

-- Ensure storage policies exist
DROP POLICY IF EXISTS "Public Read Profile Documents Storage" ON storage.objects;
DROP POLICY IF EXISTS "Users Manage Own Profile Documents Storage" ON storage.objects;

-- Allow users to manage (INSERT, UPDATE, DELETE, SELECT) their own files in profile_documents
CREATE POLICY "Users Manage Own Profile Documents Storage"
ON storage.objects FOR ALL
USING (bucket_id = 'profile_documents' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'profile_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to profile_documents bucket files
CREATE POLICY "Public Read Profile Documents Storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_documents');
