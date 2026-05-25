-- Create admin_profiles table
create table if not exists public.admin_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.admin_profiles enable row level security;

-- Policies
create policy "Users can view any admin profile"
  on public.admin_profiles for select
  using (true);

create policy "Users can update their own admin profile"
  on public.admin_profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own admin profile"
  on public.admin_profiles for insert
  with check (auth.uid() = id);

-- Trigger for updated_at
create or replace function public.handle_admin_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_admin_updated_at
  before update on public.admin_profiles
  for each row
  execute function public.handle_admin_updated_at();
