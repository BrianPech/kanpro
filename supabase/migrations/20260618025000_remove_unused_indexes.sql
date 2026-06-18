-- Drop unused and redundant indexes to optimize write operations and cache memory

-- 1. Table: public.vacancies
drop index if exists public.vacancies_company_status_idx;
drop index if exists public.vacancies_category_idx;
drop index if exists public.vacancies_location_idx;

-- 2. Table: public.profiles
drop index if exists public.profiles_role_is_approved_idx;

-- 3. Table: public.applications
drop index if exists public.applications_candidate_id_idx;
drop index if exists public.applications_vacancy_id_idx;
drop index if exists public.applications_status_idx;
