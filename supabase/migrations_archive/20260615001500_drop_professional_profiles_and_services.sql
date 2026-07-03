-- Drop professional profiles and services tables as part of removing independent professionals module
drop table if exists public.services cascade;
drop table if exists public.professional_profiles cascade;
