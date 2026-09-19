# Handoff Report — Auth & Middleware Explorer (Survey 2)

**Agent**: Auth & Middleware Explorer (`teamwork_preview_explorer_survey_2`)  
**Parent**: Orchestrator (`2cc9893f-6efd-44ed-b85b-6f912ce3f931`)  
**Date**: 2026-08-27  
**Artifact**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_survey_2/survey_auth_report.md`

---

## 1. Observation

1. **Proxy Interception & Role Resolution**:
   - In `src/proxy.ts:4-6`, incoming requests invoke `updateSession(request)` from `src/lib/supabase/proxy.ts`.
   - In `src/lib/supabase/proxy.ts:89-105`, role resolution strictly checks `profiles.role` from `public.profiles`.
   - In `src/lib/supabase/proxy.ts:145-169`, any user with `profiles.role === 'admin'` is granted access to `/dashboard/admin*`, `/dashboard/company*`, and `/dashboard/candidate*`. `admin_staff_members.status` is never queried or verified.
2. **Layout Guards**:
   - `src/app/(dashboard)/dashboard/admin/layout.tsx:13` calls `await requireAdmin()`.
   - In `src/lib/auth/require-admin.ts:35-49`, `requireAdmin()` queries `public.profiles` for `role === 'admin'`. It does NOT query `public.admin_staff_members`, does not check `sub_role`, `permissions`, or whether `status === 'active'`.
3. **Orphan Admin Fallback & Staff Metadata**:
   - In `src/app/(dashboard)/dashboard/admin/staff/actions.ts:55-75`, `getAdminStaffMembers()` maps admin profiles against `admin_staff_members`. If no record is found (`s === undefined`), it defaults to:
     - `subRole: "super_admin"`
     - `department: "Dirección General"`
     - `permissions: ["manage_users", "manage_companies", "verify_documents", "manage_vacancies", "analytics_access", "system_settings"]`
     - `status: "active"`
4. **Server Action Duplication & Lack of Hierarchy Enforcement**:
   - Inlined `requireAdminAuth()` is duplicated in 6 action files: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:8-30`, `reports/actions.ts:11-33`, `support/actions.ts:16-38`, `users/actions.ts:6-28`, `verifications/actions.ts:101-123`, and `admin/actions.ts:6-25`.
   - All check only `profiles.role === 'admin'`.
   - In `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305`, `updateAdminStaffMember` allows any admin to update any staff member (including self-escalation to `super_admin`).
   - In `src/app/(dashboard)/dashboard/admin/staff/actions.ts:330-354`, `deleteAdminStaffMember` allows an admin to delete a `super_admin` so long as `user.id !== profileId`, with no check for remaining active super admins.
   - In `src/app/(dashboard)/dashboard/admin/users/actions.ts:30-52`, `updateUserRole` allows any admin to elevate any user to `admin`.
5. **Impersonation Architecture**:
   - In `src/lib/auth/impersonation.ts:52-87`, impersonation state is stored in 4 plaintext cookies (`kanpro_impersonate_user_id`, `kanpro_impersonate_user_name`, `kanpro_impersonate_user_email`, `kanpro_impersonate_user_role`) without HMAC-SHA256 signatures, nonces, or issued timestamps.
   - In `src/lib/auth/impersonation.ts:91-96`, impersonation allows targeting users with `role === 'admin'`.
   - In `src/lib/auth/impersonation.ts:119-161`, `getImpersonationState()` does not verify actor liveness against `admin_staff_members.status` or validate that the actor session is unrevoked.
6. **PostgreSQL RLS Policies**:
   - In `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:4-16`, `public.is_admin()` checks `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')`.
   - In lines 82-86, `public.admin_staff_members` RLS policy is `FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())`. Any admin (even `support` or `suspended`) can execute direct Supabase SDK mutations on `admin_staff_members`.
7. **Commercial Plan Bypass**:
   - In `src/modules/company/actions/settings.ts:74-133`, `updateSubscriptionPlan` sets `subscription_plan: 'enterprise'` and creates paid invoice records without checking `user.id === companyId` or verifying payment gateway webhooks.
8. **UI Synchronization**:
   - In `src/modules/admin/components/app-sidebar.tsx:40-95`, navigation items are hardcoded and rendered unconditionally for all admin roles.
   - In `src/modules/admin/components/staff-data-table.tsx:494-502` and `src/modules/admin/components/users-data-table.tsx:371-385`, actions for staff onboarding, role promotion, and impersonation are displayed unconditionally.
9. **Test Suite Baseline**:
   - Executed `npx vitest run`: 9 test files passed, 93/93 tests passed in 276ms.

---

## 2. Logic Chain

1. **Premise**: Current authorization boundaries in Next.js (`proxy.ts`, `requireAdmin`, and inlined `requireAdminAuth`) and PostgreSQL (`public.is_admin()`) exclusively evaluate `public.profiles.role = 'admin'`.
2. **Inference 1 (Lifecycle & Account Status)**: Because `admin_staff_members.status` is never queried by `proxy.ts`, layout guards, Server Actions, or PostgreSQL RLS, suspending an admin (`status = 'suspended'`) does not revoke access at any level.
3. **Inference 2 (Split-Brain / Orphan Escalation)**: Because `getAdminStaffMembers()` assigns `subRole: 'super_admin'`, `status: 'active'`, and all 6 permissions when no `admin_staff_members` row exists, creating an admin profile through any side-channel or legacy migration instantly yields root privileges in the staff management UI.
4. **Inference 3 (Horizontal & Vertical Escalation)**: Because `updateAdminStaffMember`, `createAdminStaffMember`, and `updateUserRole` only require `profiles.role = 'admin'`, any low-level admin (`support`, `content_admin`) can promote themselves or others to `super_admin`.
5. **Inference 4 (Impersonation Security Defect)**: Because cookies lack HMAC-SHA256 cryptographic signatures and allow `targetProfile.role === 'admin'`, an attacker with cookie access or a malicious admin can impersonate other administrators without actor binding or liveness revalidation.
6. **Inference 5 (Defense-in-Depth Necessity)**: To eliminate the flat "admin = root" paradigm, security controls must be enforced simultaneously in PostgreSQL (RLS & functions), Backend (`rbac-guards.ts`), Middleware (`proxy.ts`), and UI (`app-sidebar.tsx`).

---

## 3. Caveats

- **Existing Tests**: All 93 existing tests pass against current behavior. Refactoring `requireAdminAuth` to enforce strict permissions will require new adversarial tests without breaking existing test assertions.
- **Database Schema**: The table `public.admin_staff_members` already contains `sub_role`, `department`, `permissions`, and `status`. No destructive table recreation is required; only helper functions, RLS policies, and triggers need to be introduced/updated.
- **No Code Modifications**: Per strict audit rules, zero production code or SQL migrations were modified during this investigation.

---

## 4. Conclusion

1. The current authorization architecture suffers from a single-point-of-failure flat role check (`profiles.role = 'admin'`).
2. `admin_staff_members.status`, `sub_role`, and `permissions` are functionally bypassed across routing, layouts, actions, and database policies.
3. The platform requires immediate Defense-in-Depth hardening across 5 core areas:
   - **Database**: PostgreSQL functions `is_active_admin()`, `is_super_admin()`, `has_admin_permission()`, and trigger `prevent_last_super_admin_removal()`.
   - **Backend**: Centralized `src/lib/auth/rbac-guards.ts` enforcing `requireAdminStaffAuth(perm)` and `requireSuperAdminAuth()`.
   - **Middleware & Layout**: Updating `proxy.ts` and `dashboard/admin/layout.tsx` to validate active staff status.
   - **Impersonation**: Implementing HMAC-SHA256 signed tokens, prohibiting admin targets, and enforcing continuous actor revalidation.
   - **UI**: Synchronizing `app-sidebar.tsx` and action tables with computed effective capabilities.

---

## 5. Verification Method

1. **Inspect Survey Report**:
   ```bash
   cat /Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_survey_2/survey_auth_report.md
   ```
2. **Verify Existing Test Suite Baseline**:
   ```bash
   npx vitest run
   ```
   *Expected Output*: 9 test files passed, 93/93 tests passed.
3. **Verify Static Code Observations**:
   - Inspect proxy role check: `src/lib/supabase/proxy.ts` lines 89–105, 145–169.
   - Inspect orphan fallback: `src/app/(dashboard)/dashboard/admin/staff/actions.ts` lines 55–85.
   - Inspect impersonation cookies: `src/lib/auth/impersonation.ts` lines 52–96.
   - Inspect RLS policy: `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql` lines 4–16, 82–86.
