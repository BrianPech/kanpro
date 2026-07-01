-- Create index on location for public.vacancies to speed up location-based search
create index if not exists vacancies_location_idx on public.vacancies (location);
