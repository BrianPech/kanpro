-- Migration: Enforce storage bucket size limits and allowed MIME types to maximize 1 GB free tier capacity
-- avatars / company_assets: 1 MB limit (WebP compressed avatars/logos/banners are ~25-80 KB)
-- profile_documents: 2 MB limit (PDFs and WebP compressed ID/fiscal documents)

UPDATE storage.buckets
SET
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
WHERE id IN ('avatars', 'company_assets');

UPDATE storage.buckets
SET
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
WHERE id = 'profile_documents';
