-- ============================================================================
-- K'anPro Migration: 20260915000000_fix_supabase_linter_advisors.sql
-- Purpose: Resolve Supabase Security & Performance Linter Advisors
-- ============================================================================

-- 1. SECURITY: Fix mutable search_path in trigger function
ALTER FUNCTION public.handle_vacancies_updated_at() SET search_path = public;

-- 2. SECURITY: Prevent public bucket file enumeration on storage.objects
-- Public buckets (avatars, company_assets) already allow direct asset download via public URLs.
-- Dropping broad SELECT policies on storage.objects prevents listing/enumerating bucket contents.
DROP POLICY IF EXISTS "Public Select Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Select Company Assets" ON storage.objects;

-- 3. SECURITY: Revoke execution on internal trigger function from public/authenticated users
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4. SECURITY: Harden is_admin and get_user_role to only inspect the caller's own identity
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'::public.user_role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = (SELECT auth.uid());
$$;

-- 5. PERFORMANCE: Drop duplicate index on company_employees (company_id, status)
DROP INDEX IF EXISTS public.idx_company_employees_company;

-- 6. PERFORMANCE: Add covering indexes for foreign keys to prevent sequential scans
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_sender_id 
  ON public.support_ticket_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to 
  ON public.support_tickets(assigned_to);

CREATE INDEX IF NOT EXISTS idx_vacancy_reports_reporter_id 
  ON public.vacancy_reports(reporter_id);
