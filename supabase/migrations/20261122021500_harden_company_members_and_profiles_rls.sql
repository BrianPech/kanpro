-- Migration: 20261122021500_harden_company_members_and_profiles_rls.sql
-- Description: Fase A (#1 & #2) — Harden multi-company RLS on company_members and company_profiles.
--   1. Prevent arbitrary users from self-inserting into company_members for victim companies.
--      Self-insertion as 'owner' now requires matching company_profiles.owner_id = auth.uid().
--   2. Enforce owner_id = auth.uid() when inserting into company_profiles and remove legacy
--      FOR ALL policy that allowed bypassing owner_id validation on INSERT.
--   3. Restrict company_profiles SELECT to owners/members (plus super-admins), removing
--      the public USING (true) policy while keeping public.company_directory publicly readable
--      as a security_barrier view owned by postgres.

-- ============================================================================
-- 1. HARDEN RLS ON public.company_members
-- ============================================================================

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view memberships of companies they belong to" ON public.company_members;
CREATE POLICY "Users can view memberships of companies they belong to"
  ON public.company_members FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR company_id IN (SELECT public.get_user_company_ids())
  );

DROP POLICY IF EXISTS "Owners and admins can manage company members" ON public.company_members;
CREATE POLICY "Owners and admins can manage company members"
  ON public.company_members FOR ALL
  TO authenticated
  USING (public.user_has_company_access(company_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.user_has_company_access(company_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Users can insert membership for companies they own" ON public.company_members;
CREATE POLICY "Users can insert membership for companies they own"
  ON public.company_members FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      user_id = (SELECT auth.uid())
      AND role = 'owner'
      AND EXISTS (
        SELECT 1
        FROM public.company_profiles cp
        WHERE cp.id = company_members.company_id
          AND (
            cp.owner_id = (SELECT auth.uid())
            OR (cp.owner_id IS NULL AND cp.id = (SELECT auth.uid()))
          )
      )
    )
    OR public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

-- ============================================================================
-- 2. HARDEN RLS ON public.company_profiles
-- ============================================================================

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- Remove public read policy and legacy FOR ALL policy (which bypassed owner_id check on INSERT)
DROP POLICY IF EXISTS "Public read company profiles for directory" ON public.company_profiles;
DROP POLICY IF EXISTS "Companies manage own profile" ON public.company_profiles;

DROP POLICY IF EXISTS "Company members and owners can view own profile" ON public.company_profiles;
CREATE POLICY "Company members and owners can view own profile"
  ON public.company_profiles FOR SELECT
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR id = (SELECT auth.uid())
    OR public.user_has_company_access(id)
  );

DROP POLICY IF EXISTS "Companies can insert own profile" ON public.company_profiles;
CREATE POLICY "Companies can insert own profile"
  ON public.company_profiles FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Companies can update own profile" ON public.company_profiles;
CREATE POLICY "Companies can update own profile"
  ON public.company_profiles FOR UPDATE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR id = (SELECT auth.uid())
    OR public.user_has_company_access(id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    OR id = (SELECT auth.uid())
    OR public.user_has_company_access(id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Company owners can delete own profile" ON public.company_profiles;
CREATE POLICY "Company owners can delete own profile"
  ON public.company_profiles FOR DELETE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR id = (SELECT auth.uid())
    OR public.user_has_company_access(id, ARRAY['owner'])
  );

-- ============================================================================
-- 3. KEEP public.company_directory PUBLICLY READABLE (SANITIZED PROJECTION)
-- ============================================================================

CREATE OR REPLACE VIEW public.company_directory
  WITH (security_barrier = true, security_invoker = false) AS
SELECT
  cp.id,
  cp.company_name,
  cp.industry,
  cp.company_size,
  cp.description,
  cp.logo_url,
  cp.banner_url,
  cp.website_url,
  cp.social_links,
  cp.verification_status,
  COALESCE(p.is_early_access, true) AS is_early_access
FROM public.company_profiles cp
LEFT JOIN public.profiles p ON p.id = COALESCE(cp.owner_id, cp.id);

ALTER VIEW public.company_directory OWNER TO postgres;
GRANT SELECT ON public.company_directory TO anon, authenticated;
