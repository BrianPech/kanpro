create table public.contact_messages (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    email text not null,
    subject text,
    message text not null,
    is_read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.contact_messages enable row level security;

-- Todos los usuarios autenticados pueden insertar mensajes
create policy "Anyone can insert contact messages" on public.contact_messages
    for insert with check (true);

-- Solo admins pueden ver los mensajes
create policy "Admins can view all messages" on public.contact_messages
    for select using (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Solo admins pueden actualizar mensajes (marcar como leídos)
create policy "Admins can update messages" on public.contact_messages
    for update using (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Solo admins pueden eliminar mensajes
create policy "Admins can delete messages" on public.contact_messages
    for delete using (
        auth.jwt() ->> 'role' = 'admin'
    );
