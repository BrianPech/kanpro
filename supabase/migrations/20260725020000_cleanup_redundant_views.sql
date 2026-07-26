-- Migration: Cleanup Redundant Mobile Views for Clean Supabase Studio UI
-- Created: 2026-07-25
-- Description: Drops helper views (mobile_candidate_profiles_view, mobile_vacancies_view) to keep Supabase Studio clean and rely directly on physical tables candidate_profiles and vacancies.

DROP VIEW IF EXISTS public.mobile_candidate_profiles_view CASCADE;
DROP VIEW IF EXISTS public.mobile_vacancies_view CASCADE;
