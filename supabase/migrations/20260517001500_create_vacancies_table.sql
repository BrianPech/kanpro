create table public.vacancies (
    id uuid default gen_random_uuid() primary key,
    company_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text not null,
    modality text not null, -- Remoto, Híbrido, Presencial
    salary text,
    skills text[], -- Array of skills
    status text default 'Activa' not null, -- Activa, Pausada
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.vacancies enable row level security;

-- Políticas de lectura (Todos pueden ver las vacantes)
create policy "Vacancies are viewable by everyone" on public.vacancies
    for select using (true);

-- Políticas de escritura (Solo la empresa puede gestionar sus vacantes)
create policy "Companies can insert their own vacancies" on public.vacancies
    for insert with check (auth.uid() = company_id);

create policy "Companies can update their own vacancies" on public.vacancies
    for update using (auth.uid() = company_id);

create policy "Companies can delete their own vacancies" on public.vacancies
    for delete using (auth.uid() = company_id);

-- Trigger for updated_at
create or replace function public.handle_vacancies_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_vacancies_updated_at
  before update on public.vacancies
  for each row
  execute function public.handle_vacancies_updated_at();
