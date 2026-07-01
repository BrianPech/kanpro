create table public.professional_profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  birth_date date not null,
  location text not null,
  category text not null,
  terms_accepted boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.professional_profiles enable row level security;

create policy "Users can view their own profile."
  on public.professional_profiles for select
  using ( auth.uid() = id );

create policy "Users can insert their own profile."
  on public.professional_profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.professional_profiles for update
  using ( auth.uid() = id );
