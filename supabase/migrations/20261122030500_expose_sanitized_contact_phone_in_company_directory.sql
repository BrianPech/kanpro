-- Migration: 20261122030500_expose_sanitized_contact_phone_in_company_directory.sql
-- Description: Fase B Bloque 1 (Adición B)
--   Expose sanitized public contact_phone on public.company_directory exclusively for
--   authenticated users (NULL for anon), restoring candidate discovery, vacancy detail,
--   and WhatsApp fallback without exposing sensitive fields of public.company_profiles.

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
  COALESCE(p.is_early_access, true) AS is_early_access,
  CASE
    WHEN (SELECT auth.uid()) IS NOT NULL
      THEN NULLIF(btrim(regexp_replace(COALESCE(cp.contact_phone, ''), '[^0-9+]', '', 'g')), '')
    ELSE NULL
  END AS contact_phone
FROM public.company_profiles cp
LEFT JOIN public.profiles p ON p.id = COALESCE(cp.owner_id, cp.id);

ALTER VIEW public.company_directory OWNER TO postgres;
GRANT SELECT ON public.company_directory TO anon, authenticated;
