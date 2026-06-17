-- Optimize profiles table for Candidate CV digital premium and admin validation
alter table public.profiles
add column if not exists experience jsonb default '[]'::jsonb,
add column if not exists education jsonb default '[]'::jsonb,
add column if not exists cv_url text,
add column if not exists constancia_url text,
add column if not exists is_approved boolean default false not null,
add column if not exists is_featured boolean default false not null,
add column if not exists show_phone boolean default false not null,
add column if not exists show_email boolean default false not null,
add column if not exists email text;

-- Create applications table to track job placement and hiring success
create table if not exists public.applications (
    id uuid default gen_random_uuid() primary key,
    candidate_id uuid references public.profiles(id) on delete cascade not null,
    vacancy_id uuid references public.vacancies(id) on delete cascade not null,
    status text default 'Pendiente' not null check (status in ('Pendiente', 'En revisión', 'Preseleccionado', 'Contratado', 'Descartado')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(candidate_id, vacancy_id)
);

-- Enable RLS on applications
alter table public.applications enable row level security;

-- Drop policies if they already exist
drop policy if exists "Candidates can view their own applications" on public.applications;
drop policy if exists "Candidates can submit applications" on public.applications;
drop policy if exists "Candidates can withdraw applications" on public.applications;
drop policy if exists "Companies can view applications for their vacancies" on public.applications;
drop policy if exists "Companies can update application status" on public.applications;
drop policy if exists "Admins can view all applications" on public.applications;
drop policy if exists "Admins can update applications" on public.applications;
drop policy if exists "Admins can delete applications" on public.applications;

-- RLS Policies for applications
create policy "Candidates can view their own applications" on public.applications
    for select using (auth.uid() = candidate_id);

create policy "Candidates can submit applications" on public.applications
    for insert with check (auth.uid() = candidate_id);

create policy "Candidates can withdraw applications" on public.applications
    for delete using (auth.uid() = candidate_id and status != 'Contratado');

create policy "Companies can view applications for their vacancies" on public.applications
    for select using (exists (
        select 1 from public.vacancies v 
        where v.id = vacancy_id and v.company_id = auth.uid()
    ));

create policy "Companies can update application status" on public.applications
    for update using (exists (
        select 1 from public.vacancies v 
        where v.id = vacancy_id and v.company_id = auth.uid()
    )) with check (exists (
        select 1 from public.vacancies v 
        where v.id = vacancy_id and v.company_id = auth.uid()
    ));

create policy "Admins can view all applications" on public.applications
    for select using (exists (
        select 1 from public.admin_profiles a
        where a.id = auth.uid()
    ));

create policy "Admins can update applications" on public.applications
    for update using (exists (
        select 1 from public.admin_profiles a
        where a.id = auth.uid()
    ));

create policy "Admins can delete applications" on public.applications
    for delete using (exists (
        select 1 from public.admin_profiles a
        where a.id = auth.uid()
    ));

-- Create trigger for updated_at on applications
create trigger set_applications_updated_at
  before update on public.applications
  for each row
  execute function public.handle_profile_updated_at();

-- Database performance indexes
create index if not exists profiles_role_is_approved_idx
  on public.profiles (role, is_approved);

create index if not exists applications_candidate_id_idx
  on public.applications (candidate_id);

create index if not exists applications_vacancy_id_idx
  on public.applications (vacancy_id);

create index if not exists applications_status_idx
  on public.applications (status);
