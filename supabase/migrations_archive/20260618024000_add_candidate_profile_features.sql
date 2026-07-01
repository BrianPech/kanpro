-- Add candidate profile features to public.profiles
alter table public.profiles
add column if not exists whatsapp_number text default '' not null,
add column if not exists experience_summary text default '' not null,
add column if not exists portfolio_links jsonb default '[]'::jsonb,
add column if not exists is_validated boolean default false not null;

-- Ensure RLS is enabled on public.profiles
alter table public.profiles enable row level security;

-- Drop existing Select policy on public.profiles to apply stricter authenticated check
drop policy if exists "Users can view any profile" on public.profiles;
drop policy if exists "Authenticated users can view any profile" on public.profiles;

-- Create policy allowing any authenticated user to view profiles
create policy "Authenticated users can view any profile"
  on public.profiles for select
  to authenticated
  using (true);

-- Ensure update policy allows only the profile owner to update
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Ensure insert policy allows user to insert their own profile during registration
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);
