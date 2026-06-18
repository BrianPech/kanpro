-- Fix Security Vulnerabilities: Mutable Search Path on Triggers & Always True RLS Policies

---------------------------------------------------------
-- 1. Hardening of Trigger Functions (Search Path Injection)
---------------------------------------------------------

-- public.handle_profile_updated_at()
create or replace function public.handle_profile_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
security definer
set search_path = public;

-- public.handle_company_updated_at()
create or replace function public.handle_company_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
security definer
set search_path = public;

-- public.handle_vacancies_updated_at()
create or replace function public.handle_vacancies_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
security definer
set search_path = public;

-- public.handle_admin_updated_at()
create or replace function public.handle_admin_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
security definer
set search_path = public;


---------------------------------------------------------
-- 2. Hardening of Open Insertion Policy (public.contact_messages)
---------------------------------------------------------
drop policy if exists "Anyone can insert contact messages" on public.contact_messages;

create policy "Anyone can insert contact messages"
  on public.contact_messages
  for insert
  with check (
    name is not null and length(trim(name)) > 0 and
    email is not null and length(trim(email)) > 4 and
    message is not null and length(trim(message)) > 0
  );
