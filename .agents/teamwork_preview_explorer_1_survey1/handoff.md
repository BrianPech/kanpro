# Handoff Report — Explorer 1 (Server Actions & Auth Auditor)

**Target Repository**: K'anPro (`/Users/brianpech/Developer/Commercial/kanpro`)  
**Auditor**: Explorer 1 (Server Actions & Auth Auditor)  
**Date**: 2026-08-27  
**Artifact**: `.agents/teamwork_preview_explorer_1_survey1/server_actions_audit.md`

---

## 1. Observation

Direct code observations from the repository inspection:

1. **Local Authorization Guards in Admin Server Actions**:
   - In `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (lines 8–30), `reports/actions.ts` (lines 11–33), `support/actions.ts` (lines 16–38), `users/actions.ts` (lines 6–28), and `verifications/actions.ts` (lines 101–123), the authorization helper is implemented verbatim as:
     ```typescript
     async function requireAdminAuth() {
       const supabase = await createClient();
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error("No autenticado. Por favor inicie sesión.");
       const { data: profile } = await supabase
         .from("profiles")
         .select("role")
         .eq("id", user.id)
         .maybeSingle();
       if (!profile || profile.role !== "admin") {
         throw new Error("Acceso denegado: Se requieren permisos de administrador.");
       }
       return { supabase, user };
     }
     ```
   - **Line Observation**: The query only selects `role` from `public.profiles`. It never queries `public.admin_staff_members`, never checks `sub_role`, never checks `permissions`, and never checks `status === 'active'`.

2. **Unrestricted Staff Management with Service Role Client**:
   - In `src/app/(dashboard)/dashboard/admin/staff/actions.ts`:
     - `createAdminStaffMember` (lines 88–250): Uses `createAdminClient()`. Any caller passing `requireAdminAuth()` can pass `subRole: "super_admin"` and `permissions: [...]` to create new super administrators.
     - `updateAdminStaffMember` (lines 252–305): Uses `createAdminClient()`. Any caller passing `requireAdminAuth()` can update any target `profileId` (including their own) to `sub_role: "super_admin"` with all permissions.
     - `deleteAdminStaffMember` (lines 330–354): Checks only `if (user.id === profileId) throw ...`. Allows deleting any other admin profile, updating their `profiles.role` to `"candidate"`.

3. **Orphan Profile Admin Elevation**:
   - In `src/app/(dashboard)/dashboard/admin/users/actions.ts`:
     - `updateUserRole` (lines 30–52): Executes `supabase.from("profiles").update({ role: newRole }).eq("id", userId)`. Promotes any user to `role: "admin"` without touching `admin_staff_members`.
     - `updateUserProfile` (lines 92–111): Executes `supabase.from("profiles").update({ full_name, role }).eq("id", userId)`.

4. **PostgreSQL RLS Policies & Helper Functions**:
   - In `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql`:
     - Function `public.is_admin()` (lines 4–16):
       ```sql
       CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
       RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
         SELECT EXISTS (
           SELECT 1 FROM public.profiles
           WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'::public.user_role
         );
       $$;
       ```
     - Policy on `public.admin_staff_members` (lines 82–86):
       ```sql
       CREATE POLICY "Admins can manage admin staff members"
         ON public.admin_staff_members FOR ALL TO authenticated
         USING (public.is_admin()) WITH CHECK (public.is_admin());
       ```
   - Any user whose `profiles.role = 'admin'` has direct PostgreSQL table access to INSERT, UPDATE, DELETE in `admin_staff_members` and `profiles`.

5. **Company Subscription Self-Upgrade Bypass**:
   - In `src/modules/company/actions/settings.ts` (lines 74–133):
     - `updateSubscriptionPlan(companyId, plan)` mutates `company_profiles` directly and inserts an invoice marked `status: "paid"` into `company_invoices` without verifying payment or webhook callbacks.

6. **Admin-on-Admin Impersonation**:
   - In `src/lib/auth/impersonation.ts` (lines 18–99):
     - `startImpersonating(targetUserId)` permits `targetProfile.role === "admin"` and writes unsigned cookie `kanpro_impersonate_user_id`.

---

## 2. Logic Chain

1. **From Observation 1**: Because `requireAdminAuth()` and `requireAdmin()` only evaluate `profiles.role === 'admin'`, any authenticated user with `profiles.role = 'admin'` satisfies all backend server-side guards across all administrative modules.
2. **From Observation 2 & Logic Step 1**: In `staff/actions.ts`, the functions execute using `createAdminClient()`, which bypasses RLS completely. Because `createAdminStaffMember` and `updateAdminStaffMember` take `subRole` and `permissions` directly from the client payload without evaluating the caller's own `sub_role` or permissions, any admin can create or upgrade accounts to `super_admin` (Escalation Cases A, B, C).
3. **From Observation 2 & Logic Step 1**: In `deleteAdminStaffMember`, the only guard is checking that `user.id !== profileId`. Therefore, an admin with `sub_role = 'support'` can call `deleteAdminStaffMember(targetSuperAdminId)` and demote the director to `candidate` (Escalation Case D).
4. **From Observation 3 & Logic Step 1**: When `updateUserRole` in `users/actions.ts` promotes a user to `admin`, it only modifies `profiles.role`. Because `admin_staff_members` is not updated, an "orphan admin" is created who retains full administrative power while being invisible to staff management filters (Escalation Case E).
5. **From Observation 4**: In PostgreSQL, `public.is_admin()` evaluates only `profiles.role = 'admin'`. Therefore, direct Supabase SDK queries from an admin browser bypass Server Action logic and have unrestricted write access to `admin_staff_members` and `profiles` (Escalation Case F).
6. **From Observation 5**: `updateSubscriptionPlan` sets `subscription_status = 'active'` and generates paid invoices with no server-side payment authority, enabling arbitrary free tier escalation.
7. **From Observation 6**: `startImpersonating` does not restrict target accounts by role or enforce cryptographic session binding, enabling admin impersonation (Escalation Case G).

---

## 3. Caveats

- **Scope Boundary**: This investigation was strictly read-only. No source files, tests, SQL migrations, or configs were modified.
- **Client Components**: Frontend UI components were inspected for authorization logic and references, but styling details and client-side UI hooks that do not handle authorization were excluded from security findings.
- **Third-Party Services**: External payment webhooks (e.g. Stripe) and Resend SMTP email delivery were analyzed based on repository configuration and code structure without sending external network requests.

---

## 4. Conclusion

1. The current authorization model in K'anPro is strictly **binary** (`profiles.role = 'admin'` vs non-admin). The granular permissions and subroles visible in the UI are purely decorative and carry **zero enforcement authority** at the Server Action or database RLS layer.
2. Multiple **P0 Critical vulnerabilities** exist allowing horizontal and vertical privilege escalation, unauthorized super_admin creation, executive administrative lockout, and commercial subscription bypass.
3. A granular RBAC architecture must be introduced to bind Server Action guards and PostgreSQL RLS functions to `admin_staff_members.sub_role`, `admin_staff_members.permissions`, and `admin_staff_members.status === 'active'`.

---

## 5. Verification Method

To independently verify all findings and validate system integrity:

1. **Verify Integrity of Test Suite (93/93 PASS)**:
   ```bash
   pnpm test
   ```
2. **Verify TypeScript Strict Compilation (0 Errors)**:
   ```bash
   pnpm exec tsc --noEmit
   ```
3. **Verify ESLint Validation (0 Errors)**:
   ```bash
   pnpm lint
   ```
4. **Inspect Generated Audit Report**:
   - View `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_1_survey1/server_actions_audit.md`
   - Inspect specific code references in `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (lines 88–354) and `src/app/(dashboard)/dashboard/admin/users/actions.ts` (lines 30–111).
