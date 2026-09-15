-- Migration: Add notes column to public.applications
-- Used by recruiters and company HR to maintain internal application notes

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS notes text;
