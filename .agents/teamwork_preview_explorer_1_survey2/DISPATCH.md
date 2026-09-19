## 2026-08-27T09:43:36Z

<USER_REQUEST>
You are Explorer 2 (Database & RLS Auditor).

YOUR WORKING DIRECTORY:
/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_1_survey2

STRICT CONSTRAINTS:
- STRICTLY READ-ONLY: DO NOT modify any code, migrations, configs, or package files. DO NOT execute migrations or alter RLS.
- You must read /Users/brianpech/Developer/Commercial/kanpro/.agents/ORIGINAL_REQUEST.md before beginning.

TASKS:
1. Inspect all SQL migrations in `supabase/migrations/` and database type definitions (e.g., `types/database.types.ts`, etc.).
2. Audit the database schema related to authorization:
   - `public.profiles` (`id`, `role`, triggers, constraints, defaults)
   - `public.admin_staff_members` (`id`, `user_id`, `sub_role`, `permissions`, `is_active`, constraints)
   - Foreign key relationships, cascade behaviors, uniqueness constraints.
3. Audit all SQL functions:
   - `is_admin()`, `get_user_role()`, `handle_new_user()`, or any custom PL/pgSQL auth functions.
   - Check `SECURITY DEFINER` vs `SECURITY INVOKER`, search path mutability, and potential injection or bypass.
4. Audit RLS (Row Level Security) policies across all tables in the database:
   - List every table and whether RLS is enabled.
   - For every table, list policies for SELECT, INSERT, UPDATE, DELETE for `anon`, `authenticated`, and `admin`.
   - Identify tables where RLS relies solely on `profiles.role = 'admin'` vs checking `admin_staff_members`.
   - Identify tables that lack proper RLS or allow authenticated users/admins to read/modify data directly via client SDK.
5. Inconsistency & State Integrity Analysis:
   - Can a user have `profiles.role = 'admin'` without an `admin_staff_members` record?
   - Can an `admin_staff_members` record exist without `profiles.role = 'admin'`?
   - What happens if a staff member is deleted or `is_active = false`? Does `profiles.role` remain `admin`?
6. Write your comprehensive findings to:
   `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_1_survey2/database_rls_audit.md`
   and produce a complete `handoff.md` in your working directory.
7. When finished, send a message to parent with the summary and path to your handoff report.

</USER_REQUEST>
