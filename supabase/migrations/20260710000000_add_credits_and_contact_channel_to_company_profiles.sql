-- Migration: Add credits_available and contact_channel to company_profiles
-- Created: 2026-07-10

ALTER TABLE public.company_profiles
ADD COLUMN IF NOT EXISTS credits_available integer DEFAULT 3 NOT NULL,
ADD COLUMN IF NOT EXISTS contact_channel text DEFAULT 'whatsapp' NOT NULL;
