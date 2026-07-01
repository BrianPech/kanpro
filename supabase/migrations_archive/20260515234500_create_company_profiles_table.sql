-- Create company_profiles table
create table if not exists public.company_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  company_name text not null,
  industry text,
  website_or_linkedin text,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.company_profiles enable row level security;

-- Policies
create policy "Users can view any company profile"
  on public.company_profiles for select
  using (true);

create policy "Users can update their own company profile"
  on public.company_profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own company profile"
  on public.company_profiles for insert
  with check (auth.uid() = id);

-- Trigger for updated_at
create or replace function public.handle_company_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_company_updated_at
  before update on public.company_profiles
  for each row
  execute function public.handle_company_updated_at();
