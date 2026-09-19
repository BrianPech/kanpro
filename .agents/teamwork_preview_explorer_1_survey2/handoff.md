# Handoff Report — Explorer 2 (Database & RLS Auditor)

## 1. Observation

1. **SQL Migrations & Schema**:
   - `supabase/migrations/20260728000000_initial_schema.sql` (lines 11, 26–38):
     - `CREATE TYPE user_role AS ENUM ('candidate', 'company', 'admin');` (No `super_admin` in database enum).
     - `CREATE TABLE public.profiles ( id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, role user_role NOT NULL DEFAULT 'candidate', ... );`
   - `supabase/migrations/20260812000000_admin_staff_management.sql` (lines 6–35):
     - `CREATE TABLE IF NOT EXISTS public.admin_staff_members ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, sub_role TEXT NOT NULL DEFAULT 'ops_admin', department TEXT DEFAULT 'Operaciones', permissions TEXT[] DEFAULT '{}', status TEXT NOT NULL DEFAULT 'active', ... );`
     - Policy: `CREATE POLICY "Admins can manage admin staff members" ON public.admin_staff_members FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = (SELECT auth.uid()) AND public.profiles.role = 'admin'));`
     - Grants: `GRANT ALL ON public.admin_staff_members TO authenticated;`
   - `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql` (lines 4–105):
     - `CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid()) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'::public.user_role); $$;`
     - `CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid()) RETURNS public.user_role LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$ SELECT role FROM public.profiles WHERE id = COALESCE(user_id, auth.uid()); $$;`
     - Every administrative RLS policy across `public.profiles`, `candidate_private_profiles`, `company_profiles`, `candidate_profiles`, `profile_documents`, `company_invoices`, `admin_staff_members`, `support_tickets`, `support_ticket_messages`, `vacancy_reports` uses `USING (public.is_admin()) WITH CHECK (public.is_admin())`.
   - `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql` (lines 13–121):
     - Trigger function `handle_new_user()` strictly strips `role = 'admin'` from `NEW.raw_user_meta_data`, defaulting non-company registrations to `'candidate'`. Sets `search_path = public, pg_temp`, and revokes execute from public/anon/authenticated.

2. **Server Actions Authorization Verification**:
   - `src/app/(dashboard)/dashboard/admin/staff/actions.ts`:
     - Line 19–27: `requireAdminAuth()` checks `SELECT role FROM profiles WHERE id = user.id`. If `profile.role !== "admin"`, throws error. Does not check `admin_staff_members` table, `sub_role`, or `permissions`.
     - Lines 55–84 (`getAdminStaffMembers()`): For any profile with `role = 'admin'`, if no `admin_staff_members` record is found, it falls back to: `subRole = "super_admin"`, `department = "Dirección General"`, `permissions = ["manage_users", "manage_companies", "verify_documents", "manage_vacancies", "analytics_access", "system_settings"]`, and `status = "active"`.
     - Lines 307–328 (`toggleAdminStaffStatus()`): Updates `admin_staff_members.status = status`, but leaves `profiles.role` as `'admin'`.
     - Lines 330–354 (`deleteAdminStaffMember()`): Deletes `admin_staff_members` and updates `profiles.role = 'candidate'`.
   - `src/app/(dashboard)/dashboard/admin/users/actions.ts`:
     - Lines 30–52 (`updateUserRole()`): Updates `profiles.role = newRole` directly without touching `admin_staff_members`.

3. **Verification Command Executions**:
   - `npx vitest run`: 9 passed test files, 93 passed tests (0 failures).
   - `npx tsc --noEmit`: 0 errors.

---

## 2. Logic Chain

1. **Premise 1**: All database RLS policies for admin operations evaluate `public.is_admin()`, which queries only `public.profiles.role = 'admin'`.
2. **Premise 2**: `public.admin_staff_members` grants `ALL` privileges to `authenticated` users who satisfy `public.is_admin()`.
3. **Inference 1 (Horizontal/Vertical Privilege Escalation)**: Any authenticated user with `profiles.role = 'admin'` (regardless of whether their `sub_role` is `support`, `verification_admin`, or `ops_admin`, and regardless of their assigned `permissions` array) can send a direct REST/GraphQL/SDK `UPDATE` query to `public.admin_staff_members` to set their own `sub_role = 'super_admin'` and `permissions = ['manage_users', 'manage_companies', 'verify_documents', 'manage_vacancies', 'analytics_access', 'system_settings']`.
4. **Inference 2 (Deactivation Ineffectiveness)**: When an administrator is toggled to `'inactive'` or `'suspended'` in `toggleAdminStaffStatus`, only `admin_staff_members.status` is updated. Because `profiles.role` remains `'admin'`, `public.is_admin()` returns `true`, and `requireAdminAuth()` in Server Actions succeeds. Thus, deactivated administrators retain 100% of their operational capabilities and database access.
5. **Inference 3 (Orphan Admin Auto-Escalation)**: When a user is given `profiles.role = 'admin'` via `updateUserRole` without a corresponding `admin_staff_members` row, the server action `getAdminStaffMembers` synthesizes a `super_admin` record with all permissions, exposing full Directiva privileges to uninitialized admin accounts.

---

## 3. Caveats

- **No Caveats**. All 19 migration files in `supabase/migrations/`, archived migrations in `supabase/migrations_archive/`, database types in `src/types/supabase.ts` and `src/modules/admin/types/`, and all administrative Server Actions were inspected. No active database migrations or production files were modified during this investigation.

---

## 4. Conclusion

The current database and RLS architecture has a fundamental disconnect between coarse identity (`public.profiles.role = 'admin'`) and granular metadata (`public.admin_staff_members`):
- `permissions` and `sub_role` are purely informational UI concepts that carry **no authority at the PostgreSQL/RLS layer**.
- Lower-tier administrators (`support`, `ops_admin`, etc.) have the exact same database-level power as `super_admin`, and can self-escalate via direct SDK calls to `admin_staff_members` or `profiles`.
- Deactivating staff in `admin_staff_members` does not revoke database access.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify RLS Policy on `admin_staff_members`**:
   Inspect `supabase/migrations/20260812000000_admin_staff_management.sql` (line 28) and `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql` (lines 82–86) to confirm policy relies on `public.is_admin()`.
2. **Verify `is_admin()` definition**:
   Inspect `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql` (lines 4–16) to confirm it queries only `public.profiles`.
3. **Verify Orphan Admin Fallback**:
   Inspect `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (lines 63–74) to confirm fallback to `"super_admin"` and all 6 permissions.
4. **Verify Deactivation Logic**:
   Inspect `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (lines 307–328) to confirm only `admin_staff_members` is updated while `profiles` is untouched.
5. **Run Existing Test Suite & Typecheck**:
   ```bash
   npx vitest run
   npx tsc --noEmit
   ```
   Both commands execute cleanly with 93/93 tests passing and 0 TypeScript errors.
