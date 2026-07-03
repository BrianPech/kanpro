create table public.services (
    id uuid default gen_random_uuid() primary key,
    professional_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text not null,
    price numeric not null,
    delivery_time text not null,
    category text,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.services enable row level security;

-- Políticas de lectura (Todos pueden ver los servicios)
create policy "Services are viewable by everyone" on public.services
    for select using (true);

-- Políticas de escritura (Solo el profesional puede gestionar sus servicios)
create policy "Professionals can insert their own services" on public.services
    for insert with check (auth.uid() = professional_id);

create policy "Professionals can update their own services" on public.services
    for update using (auth.uid() = professional_id);

create policy "Professionals can delete their own services" on public.services
    for delete using (auth.uid() = professional_id);
