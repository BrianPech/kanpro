-- ============================================================================
-- Migration: 20260731000001_company_profile_fields.sql
-- Add address_details and operation_hours to company_profiles
-- ============================================================================

ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS address_details TEXT,
ADD COLUMN IF NOT EXISTS operation_hours TEXT;
