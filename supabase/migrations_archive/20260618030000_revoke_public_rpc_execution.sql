-- Revoke direct public execution on SECURITY DEFINER updated_at triggers

-- 1. Revoke from PUBLIC role (anon and authenticated)
revoke execute on function public.handle_admin_updated_at() from public;
revoke execute on function public.handle_company_updated_at() from public;
revoke execute on function public.handle_profile_updated_at() from public;
revoke execute on function public.handle_vacancies_updated_at() from public;
