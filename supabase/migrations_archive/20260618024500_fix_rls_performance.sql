-- Fix RLS Performance (auth_rls_initplan) and Permissive Policies (multiple_permissive_policies)

---------------------------------------------------------
-- 1. Table public.profiles
---------------------------------------------------------
-- Drop old policies
drop policy if exists "Authenticated users can view any profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;

-- Create optimized policies
create policy "Authenticated users can view any profile"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()));

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));


---------------------------------------------------------
-- 2. Table public.company_profiles
---------------------------------------------------------
-- Drop old policies
drop policy if exists "Users can view any company profile" on public.company_profiles;
drop policy if exists "Users can update their own company profile" on public.company_profiles;
drop policy if exists "Users can insert their own company profile" on public.company_profiles;

-- Create optimized policies
create policy "Users can view any company profile"
  on public.company_profiles for select
  to authenticated
  using (true);

create policy "Users can update their own company profile"
  on public.company_profiles for update
  to authenticated
  using (id = (select auth.uid()));

create policy "Users can insert their own company profile"
  on public.company_profiles for insert
  to authenticated
  with check (id = (select auth.uid()));


---------------------------------------------------------
-- 3. Table public.vacancies
---------------------------------------------------------
-- Drop old policies
drop policy if exists "Vacancies are viewable by everyone" on public.vacancies;
drop policy if exists "Companies can insert their own vacancies" on public.vacancies;
drop policy if exists "Companies can update their own vacancies" on public.vacancies;
drop policy if exists "Companies can delete their own vacancies" on public.vacancies;

-- Create optimized policies
create policy "Vacancies are viewable by everyone"
  on public.vacancies for select
  to authenticated
  using (true);

create policy "Companies can insert their own vacancies"
  on public.vacancies for insert
  to authenticated
  with check (company_id = (select auth.uid()));

create policy "Companies can update their own vacancies"
  on public.vacancies for update
  to authenticated
  using (company_id = (select auth.uid()));

create policy "Companies can delete their own vacancies"
  on public.vacancies for delete
  to authenticated
  using (company_id = (select auth.uid()));


---------------------------------------------------------
-- 4. Table public.contact_messages
---------------------------------------------------------
-- Drop old policies
drop policy if exists "Anyone can insert contact messages" on public.contact_messages;
drop policy if exists "Admins can view all messages" on public.contact_messages;
drop policy if exists "Admins can update messages" on public.contact_messages;
drop policy if exists "Admins can delete messages" on public.contact_messages;

-- Create optimized policies
create policy "Anyone can insert contact messages"
  on public.contact_messages for insert
  with check (true);

create policy "Admins can view all messages"
  on public.contact_messages for select
  to authenticated
  using (exists (
    select 1 from public.admin_profiles
    where id = (select auth.uid())
  ));

create policy "Admins can update messages"
  on public.contact_messages for update
  to authenticated
  using (exists (
    select 1 from public.admin_profiles
    where id = (select auth.uid())
  ));

create policy "Admins can delete messages"
  on public.contact_messages for delete
  to authenticated
  using (exists (
    select 1 from public.admin_profiles
    where id = (select auth.uid())
  ));


---------------------------------------------------------
-- 5. Table public.admin_profiles
---------------------------------------------------------
-- Drop old policies
drop policy if exists "Users can view any admin profile" on public.admin_profiles;
drop policy if exists "Users can update their own admin profile" on public.admin_profiles;
drop policy if exists "Users can insert their own admin profile" on public.admin_profiles;

-- Create optimized policies
create policy "Users can view any admin profile"
  on public.admin_profiles for select
  to authenticated
  using (true);

create policy "Users can update their own admin profile"
  on public.admin_profiles for update
  to authenticated
  using (id = (select auth.uid()));

create policy "Users can insert their own admin profile"
  on public.admin_profiles for insert
  to authenticated
  with check (id = (select auth.uid()));


---------------------------------------------------------
-- 6. Table public.applications (CONSOLIDATED)
---------------------------------------------------------
-- Drop old permissive policies
drop policy if exists "Candidates can view their own applications" on public.applications;
drop policy if exists "Candidates can submit applications" on public.applications;
drop policy if exists "Candidates can withdraw applications" on public.applications;
drop policy if exists "Companies can view applications for their vacancies" on public.applications;
drop policy if exists "Companies can update application status" on public.applications;
drop policy if exists "Admins can view all applications" on public.applications;
drop policy if exists "Admins can update applications" on public.applications;
drop policy if exists "Admins can delete applications" on public.applications;

-- Drop any potential previous consolidations
drop policy if exists "Manage applications read access" on public.applications;
drop policy if exists "Manage applications insert access" on public.applications;
drop policy if exists "Manage applications update access" on public.applications;
drop policy if exists "Manage applications delete access" on public.applications;

-- Create single optimized consolidated policies per action
create policy "Manage applications read access"
  on public.applications for select
  to authenticated
  using (
    (candidate_id = (select auth.uid())) OR
    (vacancy_id in (select id from public.vacancies where company_id = (select auth.uid()))) OR
    (exists (select 1 from public.admin_profiles where id = (select auth.uid())))
  );

create policy "Manage applications insert access"
  on public.applications for insert
  to authenticated
  with check (
    candidate_id = (select auth.uid())
  );

create policy "Manage applications update access"
  on public.applications for update
  to authenticated
  using (
    (vacancy_id in (select id from public.vacancies where company_id = (select auth.uid()))) OR
    (exists (select 1 from public.admin_profiles where id = (select auth.uid())))
  )
  with check (
    (vacancy_id in (select id from public.vacancies where company_id = (select auth.uid()))) OR
    (exists (select 1 from public.admin_profiles where id = (select auth.uid())))
  );

create policy "Manage applications delete access"
  on public.applications for delete
  to authenticated
  using (
    ((candidate_id = (select auth.uid())) AND (status != 'Contratado')) OR
    (exists (select 1 from public.admin_profiles where id = (select auth.uid())))
  );
