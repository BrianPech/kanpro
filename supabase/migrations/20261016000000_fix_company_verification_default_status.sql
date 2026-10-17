-- ============================================================================
-- Migration: 20261016000000_fix_company_verification_default_status.sql
-- Description:
-- 1. Remove DEFAULT 'pending' from public.company_profiles.verification_status
--    so newly registered companies are NOT automatically set to 'pending' before
--    uploading verification documents or submitting for review.
-- 2. Set default to NULL (unsubmitted).
-- 3. Clean up existing company profiles that were automatically assigned 'pending'
--    without having submitted any documents in public.profile_documents.
-- ============================================================================

-- 1. Remove the 'pending' default on company_profiles.verification_status
ALTER TABLE public.company_profiles 
  ALTER COLUMN verification_status DROP DEFAULT;

-- 2. Set default to NULL (unsubmitted)
ALTER TABLE public.company_profiles 
  ALTER COLUMN verification_status SET DEFAULT NULL;

-- 3. Reset verification_status to NULL for any company that has 'pending' status
--    but has zero uploaded documents in profile_documents.
UPDATE public.company_profiles cp
SET verification_status = NULL
WHERE cp.verification_status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM public.profile_documents pd WHERE pd.owner_id = cp.id
  );
