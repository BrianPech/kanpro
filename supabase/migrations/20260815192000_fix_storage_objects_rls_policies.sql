-- Migration: Fix storage.objects RLS policies for avatars, company_assets and profile_documents
-- Ensures SELECT, INSERT, UPDATE, DELETE permissions are properly granted for uploads and public assets

-- 1. Public SELECT for public buckets (avatars, company_assets)
DROP POLICY IF EXISTS "Public Select Avatars" ON storage.objects;
CREATE POLICY "Public Select Avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public Select Company Assets" ON storage.objects;
CREATE POLICY "Public Select Company Assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'company_assets');

-- 2. Users manage own avatars (photos, logos, banners)
DROP POLICY IF EXISTS "Users Upload Own Avatar" ON storage.objects;
CREATE POLICY "Users Upload Own Avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    (select auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users Update Own Avatar" ON storage.objects;
CREATE POLICY "Users Update Own Avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    (select auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    (select auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users Delete Own Avatar" ON storage.objects;
CREATE POLICY "Users Delete Own Avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- 3. Companies manage own assets
DROP POLICY IF EXISTS "Companies Upload Assets" ON storage.objects;
CREATE POLICY "Companies Upload Assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company_assets' AND
    (select auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Companies Update Assets" ON storage.objects;
CREATE POLICY "Companies Update Assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'company_assets' AND
    (select auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'company_assets' AND
    (select auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Companies Delete Assets" ON storage.objects;
CREATE POLICY "Companies Delete Assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'company_assets' AND
    (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- 4. Users select own profile documents
DROP POLICY IF EXISTS "Users Select Own Profile Documents" ON storage.objects;
CREATE POLICY "Users Select Own Profile Documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'profile_documents' AND
    (select auth.uid())::text = (storage.foldername(name))[1]
  );
