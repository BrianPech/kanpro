-- Add missing fields to company_profiles for Fase 2
alter table public.company_profiles
add column if not exists logo_url text,
add column if not exists description text,
add column if not exists company_size text,
add column if not exists phone text;
