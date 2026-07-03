-- Migration: Fix Connections Initiated By Check Constraint
-- Created: 2026-07-03

ALTER TABLE public.connections DROP CONSTRAINT IF EXISTS connections_initiated_by_check;
ALTER TABLE public.connections ADD CONSTRAINT connections_initiated_by_check CHECK (initiated_by IN ('candidate', 'recruiter', 'company'));
