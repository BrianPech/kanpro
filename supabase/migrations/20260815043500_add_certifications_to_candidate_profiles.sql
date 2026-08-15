-- Migration: Add certifications column to candidate_profiles table
ALTER TABLE public.candidate_profiles 
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.candidate_profiles.certifications IS 'Technical certifications, diplomas and credentials (name, issuer, date, url).';
