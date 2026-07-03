-- Add useful detail fields to vacancies without breaking the current creation flow
alter table public.vacancies
add column if not exists location text,
add column if not exists category text,
add column if not exists seniority text,
add column if not exists contract_type text,
add column if not exists employment_type text,
add column if not exists vacancies_count integer not null default 1,
add column if not exists application_deadline date,
add column if not exists benefits text[],
add column if not exists salary_min numeric(12,2),
add column if not exists salary_max numeric(12,2),
add column if not exists currency text not null default 'USD';

create index if not exists vacancies_company_status_idx
  on public.vacancies (company_id, status);

create index if not exists vacancies_category_idx
  on public.vacancies (category);

create index if not exists vacancies_location_idx
  on public.vacancies (location);