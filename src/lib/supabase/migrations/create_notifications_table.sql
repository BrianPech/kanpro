-- 1. Create notifications table
create table public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text not null,
    type text not null, -- application_status, system, message
    is_read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create index on user_id and is_read to optimize notification counts
create index if not exists notifications_user_id_is_read_idx on public.notifications (user_id, is_read);

-- 3. Enable RLS
alter table public.notifications enable row level security;

-- 4. Create RLS policies with subquery optimization
create policy "Users can view their own notifications"
on public.notifications for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update their own notifications"
on public.notifications for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- 5. Trigger on public.applications status update
create or replace function public.handle_application_notification()
returns trigger as $$
declare
  v_vacancy_title text;
  v_company_id uuid;
  v_company_name text;
begin
  -- Trigger only when status changes
  if (old.status is distinct from new.status) then
    -- Fetch vacancy title and company ID
    select title, company_id into v_vacancy_title, v_company_id
    from public.vacancies
    where id = new.vacancy_id;

    -- Fetch company name
    if (v_company_id is not null) then
      select company_name into v_company_name
      from public.company_profiles
      where id = v_company_id;
    end if;

    insert into public.notifications (user_id, title, description, type, is_read)
    values (
      new.candidate_id,
      'Actualización de postulación',
      'La empresa ' || coalesce(v_company_name, 'Empresa') || ' ha actualizado el estado de tu postulación para "' || coalesce(v_vacancy_title, 'Vacante') || '" a "' || new.status || '".',
      'application_status',
      false
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_application_status_update
  after update of status on public.applications
  for each row
  execute function public.handle_application_notification();

-- 6. RPC function to allow company users to notify candidate contact without general INSERT policy
create or replace function public.notify_candidate_contact(
  p_candidate_id uuid,
  p_vacancy_title text,
  p_company_name text
)
returns void as $$
begin
  insert into public.notifications (user_id, title, description, type, is_read)
  values (
    p_candidate_id,
    'Nueva propuesta de contacto',
    'La empresa ' || p_company_name || ' te ha contactado por WhatsApp sobre la vacante "' || p_vacancy_title || '".',
    'message',
    false
  );
end;
$$ language plpgsql security definer;

-- Revoke public execution and grant to authenticated
revoke all on function public.notify_candidate_contact(uuid, text, text) from public;
grant execute on function public.notify_candidate_contact(uuid, text, text) to authenticated;
