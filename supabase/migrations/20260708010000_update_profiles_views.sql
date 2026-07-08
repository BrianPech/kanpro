-- Migration: Update profiles_view and profiles_private to coalesce company phone and whatsapp details
-- Created: 2026-07-08

-- 1. Vista segura unificada para lectura en la API pública (LEFT JOIN obligatorios para Onboarding Express)
CREATE OR REPLACE VIEW public.profiles_view WITH (security_invoker = true) AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.location,
  p.avatar_url,
  p.is_approved,
  p.is_featured,
  p.is_validated,
  p.created_at,
  p.updated_at,
  c.headline,
  c.bio,
  c.skills,
  c.experience,
  c.education,
  c.portfolio_links,
  c.cv_url,
  c.constancia_url,
  c.category,
  c.birth_date,
  c.experience_summary,
  COALESCE(co.phone, public.get_candidate_masked_phone(p.id, auth.uid())) AS phone,
  COALESCE(co.whatsapp_number, public.get_candidate_masked_whatsapp(p.id, auth.uid())) AS whatsapp_number,
  c.show_phone,
  c.show_email,
  co.company_name,
  co.industry,
  co.company_size,
  co.description AS company_description,
  co.website_or_linkedin,
  co.logo_url
FROM public.profiles p
LEFT JOIN public.candidate_profiles c ON p.id = c.id
LEFT JOIN public.company_profiles co ON p.id = co.id;

-- 2. Vista de compatibilidad para profiles_private (LEFT JOIN y sin enmascaramiento para testing y fallbacks)
CREATE OR REPLACE VIEW public.profiles_private WITH (security_invoker = true) AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.location,
  p.avatar_url,
  p.is_approved,
  p.is_featured,
  p.is_validated,
  p.created_at,
  p.updated_at,
  c.headline,
  c.bio,
  c.skills,
  c.experience,
  c.education,
  c.portfolio_links,
  c.cv_url,
  c.constancia_url,
  c.category,
  c.birth_date,
  c.experience_summary,
  COALESCE(co.phone, c.phone) AS phone,
  COALESCE(co.whatsapp_number, c.whatsapp_number) AS whatsapp_number,
  c.show_phone,
  c.show_email,
  co.company_name,
  co.industry,
  co.company_size,
  co.description,
  co.website_or_linkedin,
  co.logo_url
FROM public.profiles p
LEFT JOIN public.candidate_profiles c ON p.id = c.id
LEFT JOIN public.company_profiles co ON p.id = co.id;
