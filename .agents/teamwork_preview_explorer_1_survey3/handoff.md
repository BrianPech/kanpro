# Handoff Report: Explorer 3 (Escalation & UI Semantic Auditor)

## 1. Observation

1. **Admin Guard Implementation (`src/lib/auth/require-admin.ts:24-56`)**:
   - `requireAdmin()` extracts `user` from `supabase.auth.getUser()`, queries `profiles.role` from `public.profiles`, and redirects if `profile.role !== "admin"`.
   - It does not query `admin_staff_members`, does not check `sub_role`, and does not inspect the `permissions` array.
2. **Server Action Guard Implementation (`src/app/(dashboard)/dashboard/admin/staff/actions.ts:8-30` and all other admin actions)**:
   - `requireAdminAuth()` verbatim:
     ```typescript
     const { data: profile } = await supabase
       .from("profiles")
       .select("role")
       .eq("id", user.id)
       .maybeSingle();

     if (!profile || profile.role !== "admin") {
       throw new Error("Acceso denegado: Se requieren permisos de administrador.");
     }
     ```
   - No Server Action in the entire codebase validates `sub_role` or checks whether a specific permission key (e.g. `manage_users`, `verify_documents`) is present in `admin_staff_members.permissions`.
3. **Staff Creation & Modification Actions (`src/app/(dashboard)/dashboard/admin/staff/actions.ts`)**:
   - `createAdminStaffMember` (lines 88–250): Any authenticated caller with `profiles.role === 'admin'` can specify `subRole: 'super_admin'` and all permissions in `formData`, creating a new `super_admin` in auth and database.
   - `updateAdminStaffMember` (lines 252–305): Allows any admin to update any staff member (including other admins, super admins, or themselves) to `subRole: 'super_admin'` and grant all permissions.
   - `deleteAdminStaffMember` (lines 330–354): Only checks `if (user.id === profileId) throw ...`. Any admin can delete/demote a `super_admin`.
   - `getAdminStaffMembers` fallback (lines 63–72): Defaults missing staff records to `subRole: "super_admin"` and assigns all 6 permissions.
4. **User Role Mutation Action (`src/app/(dashboard)/dashboard/admin/users/actions.ts:30-52`)**:
   - `updateUserRole(userId, newRole)`: Any admin can promote any candidate or company to `role: 'admin'`, or demote any other admin to `role: 'candidate'`.
5. **Database RLS Policies (`supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql`)**:
   - `public.is_admin()` helper function (lines 4–16) returns `true` for any `profiles.role = 'admin'`.
   - Policies `"Admins manage all profiles"` on `public.profiles` (lines 41–45) and `"Admins can manage admin staff members"` on `public.admin_staff_members` (lines 82–86) grant `FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())`.
   - Any admin can execute direct CRUD via Supabase browser client SDK against both tables.
6. **Frontend UI Navigation (`src/modules/admin/components/app-sidebar.tsx:40-86`)**:
   - Static menu array renders all routes (`/dashboard/admin/staff`, `/dashboard/admin/users`, `/dashboard/admin/verifications`, `/dashboard/admin/reports`, `/dashboard/admin/support`) unconditionally for all admins.

---

## 2. Logic Chain

1. **Premise 1**: The application frontend defines granular roles (`super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`) and 6 granular permissions (`manage_users`, `manage_companies`, `verify_documents`, `manage_vacancies`, `analytics_access`, `system_settings`) (Obs 1, Obs 3).
2. **Premise 2**: All Server-side guards (`requireAdmin`, `requireAdminAuth`) and Database RLS policies (`is_admin()`) evaluate only `profiles.role === 'admin'` without inspecting `sub_role` or `permissions` (Obs 1, Obs 2, Obs 5).
3. **Inference 1 (UI Semantic Illusion)**: The `permissions` array and `sub_role` hierarchy are purely cosmetic UI display items. A user with `sub_role: 'support'` and empty `permissions: []` has identical server-side and database-level capabilities to a `super_admin` with full permissions (Premise 1, Premise 2).
4. **Inference 2 (Escalation Vulnerability Cases A–E)**: Because `staff/actions.ts` and `users/actions.ts` lack hierarchy and self-modification checks, any admin can create new super admins (Case A), promote users/themselves to super admin (Cases B & D), modify permissions/subroles of other admins (Case C), and delete/demote existing super admins (Case E) (Obs 3, Obs 4).
5. **Inference 3 (SDK Bypass Vulnerability Case F)**: Because RLS policies on `profiles` and `admin_staff_members` allow all operations when `is_admin()` is true, an authenticated admin can bypass Server Actions entirely and execute raw SQL/PostgREST mutations using the Supabase client SDK from the browser console (Obs 5).
6. **Inference 4 (Orphan Default Escalation Case G)**: In `staff/actions.ts:63-72`, when an admin profile lacks an `admin_staff_members` entry, the code defaults `subRole` to `'super_admin'` and grants all permissions, causing silent escalation for orphaned or manually inserted profiles (Obs 3).

---

## 3. Caveats

- **Scope Boundary**: This audit investigated the admin dashboard frontend routes, components, Server Actions, and Supabase SQL migrations in repository `kanpro`.
- **Integrity Compliance**: No production code, tests, migrations, or dependencies were altered during this read-only investigation.
- **Third-Party Integrations**: External auth provider configurations (e.g. Supabase Auth Dashboard settings in cloud) were evaluated based on the local SQL triggers and client SDK configurations.

---

## 4. Conclusion

1. The current authorization model is strictly binary (`admin` vs non-admin). Granular permissions and subroles are non-functional metadata that provide no security boundary.
2. All seven escalation scenarios (Cases A through G) are currently **VULNERABLE** at the Server Action and/or Database RLS layer.
3. A robust RBAC remediation requires:
   - Introducing server-side helpers (`requireSuperAdmin`, `requirePermission`) that validate `admin_staff_members`.
   - Restricting staff management and role promotion Server Actions to `super_admin`.
   - Hardening RLS policies and SQL functions (`is_super_admin()`) to prevent direct PostgREST manipulation.
   - Eliminating the unsafe default fallback in `getAdminStaffMembers()`.

Full technical details, code traces, and risk classifications are documented in:
`/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_1_survey3/escalation_ui_audit.md`

---

## 5. Verification Method

To independently verify the observations and findings in this report:

1. **Inspect Admin Guard**:
   - View `src/lib/auth/require-admin.ts:35-49` to confirm that only `profiles.role === 'admin'` is checked.
2. **Inspect Server Action Guards**:
   - View `src/app/(dashboard)/dashboard/admin/staff/actions.ts:8-30` and lines 88–354 to confirm that `createAdminStaffMember`, `updateAdminStaffMember`, and `deleteAdminStaffMember` do not enforce `super_admin` authority.
3. **Inspect RLS Policies**:
   - View `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:4-16, 41-45, 82-86` to confirm that `public.is_admin()` grants unrestricted CRUD to any admin.
4. **Inspect Unsafe Fallback**:
   - View `src/app/(dashboard)/dashboard/admin/staff/actions.ts:63-72` to verify that unmapped admin profiles default to `subRole: "super_admin"` with all permissions.
5. **Run Existing Test Suite (Zero Regressions)**:
   - Run `pnpm test` or `npx vitest run` to verify that all 93 tests pass (100% PASS rate).
