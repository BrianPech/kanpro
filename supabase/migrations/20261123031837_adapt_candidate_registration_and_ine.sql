-- ============================================================================
-- Migration: Adapt Candidate Registration & INE Extraction Fields (Additive)
-- Non-destructive incremental migration for candidate INE onboarding & address
-- ============================================================================

-- 1. Add INE metadata and structured address columns to candidate_private_profiles
ALTER TABLE public.candidate_private_profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS elector_key text,
  ADD COLUMN IF NOT EXISTS ine_validity_year smallint,
  ADD COLUMN IF NOT EXISTS ine_qr_payload text,
  ADD COLUMN IF NOT EXISTS address_postal_code varchar(10),
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_municipality text,
  ADD COLUMN IF NOT EXISTS address_neighborhood text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_exterior_number text,
  ADD COLUMN IF NOT EXISTS address_interior_number text,
  ADD COLUMN IF NOT EXISTS ine_verified_at timestamp with time zone;

-- 2. Performance index for postal code lookups
CREATE INDEX IF NOT EXISTS idx_candidate_private_profiles_postal_code
  ON public.candidate_private_profiles (address_postal_code)
  WHERE address_postal_code IS NOT NULL;

-- 3. Idempotent RLS check (existing policies already allow candidates to manage own row)
ALTER TABLE public.candidate_private_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Ensure private profile_documents bucket exists with safe limits (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_documents',
  'profile_documents',
  false,
  2097152,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
