# Handoff Report: Database Migrations, RLS & PII Security Explorer

**Agent**: `teamwork_preview_explorer_s3` (Lead Database Migrations, RLS & PII Security Explorer)  
**Parent Task ID / Conversation**: `a09b02d6-0fe9-4a99-94b6-a064b81534c8`  
**Timestamp**: 2026-08-27T10:12:30Z  
**Handoff Type**: Hard (Task Complete)  

---

### 1. Observation

1. **Table RLS Status**: All 16 public tables (`profiles`, `candidate_profiles`, `candidate_private_profiles`, `company_profiles`, `company_employees`, `profile_documents`, `vacancies`, `applications`, `saved_vacancies`, `notifications`, `company_invoices`, `document_access_requests`, `admin_staff_members`, `support_tickets`, `support_ticket_messages`, `vacancy_reports`) have `ENABLE ROW LEVEL SECURITY` explicitly declared in `supabase/migrations/`.
2. **`public.is_admin()` Definition**:
   - Path: `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql`, lines 4–16.
   - Verbatim:
     ```sql
     CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
     RETURNS boolean
     LANGUAGE sql
     SECURITY DEFINER
     SET search_path = public
     STABLE
     AS $$
       SELECT EXISTS (
         SELECT 1
         FROM public.profiles
         WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'::public.user_role
       );
     $$;
     ```
3. **`admin_staff_members` RLS Policy**:
   - Path: `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql`, lines 82–86.
   - Verbatim:
     ```sql
     DROP POLICY IF EXISTS "Admins can manage admin staff members" ON public.admin_staff_members;
     CREATE POLICY "Admins can manage admin staff members"
       ON public.admin_staff_members FOR ALL TO authenticated
       USING (public.is_admin())
       WITH CHECK (public.is_admin());
     ```
4. **`candidate_private_profiles` RLS Policy**:
   - Path: `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql`, lines 52–56.
   - Verbatim:
     ```sql
     DROP POLICY IF EXISTS "Admins manage candidate private identity" ON public.candidate_private_profiles;
     CREATE POLICY "Admins manage candidate private identity"
       ON public.candidate_private_profiles FOR ALL TO authenticated
       USING (public.is_admin())
       WITH CHECK (public.is_admin());
     ```
5. **Permissive `profiles` Directory RLS Policy**:
   - Path: `supabase/migrations/20260815024555_fix_security_definer_views.sql`, lines 27–29.
   - Verbatim:
     ```sql
     DROP POLICY IF EXISTS "Authenticated view candidate basic profile directory" ON public.profiles;
     CREATE POLICY "Authenticated view candidate basic profile directory" ON public.profiles
       FOR SELECT TO authenticated USING (role = 'candidate' OR id = (select auth.uid()));
     ```
6. **`company_profiles` Self-Update Policy**:
   - Path: `supabase/migrations/20260814093811_harden_profile_privacy.sql`, lines 63–64.
   - Verbatim:
     ```sql
     CREATE POLICY "Companies manage own profile" ON public.company_profiles FOR ALL TO authenticated
       USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));
     ```
7. **Server Action Admin Guard**:
   - Path: `src/app/(dashboard)/dashboard/admin/staff/actions.ts`, lines 8–30 (`requireAdminAuth`), `src/lib/auth/require-admin.ts`, lines 24–56 (`requireAdmin`), `src/lib/supabase/proxy.ts`, lines 89–98.
   - In all files, only `profiles.role === 'admin'` is checked; `admin_staff_members.sub_role`, `permissions`, and `status` are never verified.
8. **Insecure Default Role Fallback**:
   - Path: `src/app/(dashboard)/dashboard/admin/staff/actions.ts`, lines 63–72.
   - If an admin profile lacks an `admin_staff_members` row, it defaults to `subRole: "super_admin"` and receives all 6 permissions.

---

### 2. Logic Chain

1. **Premise 1**: `public.is_admin()` relies entirely on `public.profiles.role = 'admin'`.
2. **Premise 2**: All administrative RLS policies across `admin_staff_members`, `candidate_private_profiles`, `profile_documents`, `company_invoices`, `support_tickets`, `vacancy_reports`, and `profiles` use `public.is_admin()`.
3. **Inference 1**: Any user with `profiles.role = 'admin'` is granted complete, unrestricted database access to read, insert, update, and delete all records in these tables via direct Supabase PostgREST queries, regardless of their assigned `sub_role` (e.g. `support`), their `permissions` list, or whether their status is marked `suspended` in `admin_staff_members`.
4. **Premise 3**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts` allows any admin validated by `requireAdminAuth()` to invoke `updateAdminStaffMember()`, `createAdminStaffMember()`, and `deleteAdminStaffMember()`.
5. **Inference 2**: Administrative privilege hierarchy is completely unenforced in both the application layer and database RLS. Low-tier admins can elevate themselves or create new `super_admin` accounts.
6. **Premise 4**: Policy `"Authenticated view candidate basic profile directory"` allows all `authenticated` users to select rows where `role = 'candidate'`.
7. **Inference 3**: Any logged-in user can query `public.profiles` to extract personal contact details (email, WhatsApp phone numbers) of all registered candidates, circumventing the redaction in `public.candidate_directory`.
8. **Premise 5**: Policy `"Companies manage own profile"` applies to `FOR ALL` operations on `public.company_profiles` without restricting column updates.
9. **Inference 4**: A company user can directly send an HTTP `PATCH` to `/rest/v1/company_profiles` to set `subscription_plan = 'enterprise'`, `subscription_status = 'active'`, and `credits_available = 999999`.

---

### 3. Caveats

1. **Direct API vs UI**: The frontend UI hides certain buttons based on props, but direct HTTP/SDK calls to Supabase PostgREST or Server Actions bypass UI-level visibility controls.
2. **PostgREST Column Grants**: If PostgreSQL column-level `REVOKE UPDATE (subscription_plan) ON company_profiles FROM authenticated` were in place, direct updates would fail; however, migration `20260731000000_fix_table_grants.sql` executed `GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated`, meaning column-level grants are currently unrestricted.

---

### 4. Conclusion

The current K'anPro database and authorization architecture exhibits critical privilege escalation, split-brain, and PII leakage risks:
- **P0 Critical**: `profiles.role = 'admin'` grants root power across database RLS and Server Actions. Sub-roles and permissions in `admin_staff_members` are decorative metadata with zero enforcement.
- **P0 Critical**: `status = 'suspended'` does not revoke dashboard access, Server Action execution, or direct RLS database mutations.
- **P1 High**: Candidate private PII (CURP, RFC, Cédula) is accessible to all admin sub-roles without permission checks. Candidate contact PII (email, phone) is queryable by all authenticated users.
- **P1 High**: Companies can manipulate their subscription status and platform credits directly via Supabase PostgREST due to permissive RLS on `company_profiles`.

---

### 5. Verification Method

To independently verify these findings:
1. **Inspect SQL Functions & Policies**:
   ```bash
   grep -n -C 5 "is_admin" supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql
   grep -n -C 5 "Authenticated view candidate basic profile directory" supabase/migrations/20260815024555_fix_security_definer_views.sql
   grep -n -C 5 "Companies manage own profile" supabase/migrations/20260814093811_harden_profile_privacy.sql
   ```
2. **Inspect Server Action Guards**:
   ```bash
   grep -n -C 5 "requireAdminAuth" src/app/\(dashboard\)/dashboard/admin/staff/actions.ts
   grep -n -C 5 "requireAdmin" src/lib/auth/require-admin.ts
   ```
3. **Execute Static Type & Security Tests**:
   ```bash
   npm run test
   ```
   *(All 93/93 unit/security tests pass with 0 TypeScript and 0 ESLint errors).*
