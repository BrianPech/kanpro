alter table public.professional_profiles
add column avatar_url text,
add column headline text,
add column bio text,
add column hourly_rate numeric,
add column skills text[],
add column phone text;
