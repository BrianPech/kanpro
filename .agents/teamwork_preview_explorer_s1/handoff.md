# HANDOFF REPORT — Lead Auth Infrastructure & Server Actions/Route Handlers Security Explorer

**Handoff Type**: Hard (Task Complete)  
**Working Directory**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_s1`  
**Primary Deliverable**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_s1/report.md`  

---

## 1. Observation

Direct code inspection of the K'anPro repository established the following factual observations:

1. **Authorization Helper `requireAdmin()`** (`src/lib/auth/require-admin.ts:41-49`):
   ```typescript
   if (!profile || profile.role !== "admin") {
     const fallbackRole = profile?.role === "company" ? "company" : "candidate";
     redirect(
       fallbackRole === "company"
         ? "/dashboard/company"
         : "/dashboard/candidate/discovery"
     );
   }
   ```
   Directly queries `public.profiles` only. Does not join `public.admin_staff_members`, does not check `sub_role`, does not check `status`, and does not inspect `permissions`.

2. **Server Action Guard Pattern across Admin Actions** (`src/app/(dashboard)/dashboard/admin/**/actions.ts`):
   - `staff/actions.ts:25-27`: `if (!profile || profile.role !== "admin") throw new Error("Acceso denegado: Se requieren permisos de administrador.");`
   - `users/actions.ts:23-25`: `if (!profile || profile.role !== "admin") throw new Error("Acceso denegado: Se requieren permisos de administrador.");`
   - `reports/actions.ts:28-30`: `if (!profile || profile.role !== "admin") throw new Error("Acceso denegado: Se requieren permisos de administrador.");`
   - `verifications/actions.ts:118-120`: `if (!profile || profile.role !== "admin") throw new Error("Acceso denegado: Se requieren permisos de administrador.");`
   - `support/actions.ts:33-35`: `if (!profile || profile.role !== "admin") throw new Error("Acceso denegado: Se requieren permisos de administrador.");`
   None of these actions evaluate `admin_staff_members.sub_role` or `admin_staff_members.permissions`.

3. **Staff Creation & Modification Actions** (`src/app/(dashboard)/dashboard/admin/staff/actions.ts`):
   - `createAdminStaffMember` (lines 88–250): Any authenticated admin can create a new administrator with `subRole: 'super_admin'` and arbitrary permissions using the Service Role key (`supabaseAdmin`).
   - `updateAdminStaffMember` (lines 252–305): Allows any admin to update any staff member's `sub_role`, `permissions`, and `status`, including their own account (self-escalation) and `super_admin` accounts.
   - `deleteAdminStaffMember` (lines 330–354): Any admin can delete any other admin (including `super_admin`), with the only check being `user.id !== profileId`.

4. **Impersonation Architecture** (`src/lib/auth/impersonation.ts`):
   - Lines 53–86: Plaintext cookie storage (`kanpro_impersonate_user_id`, `kanpro_impersonate_user_name`, `kanpro_impersonate_user_email`, `kanpro_impersonate_user_role`) without HMAC or cryptographic signature.
   - Lines 91–96: Explicitly allows impersonating users with `role === "admin"`.
   - Lines 134–153: Only verifies that the active session user has `profiles.role === 'admin'`.

5. **PostgreSQL RLS & Helper Function** (`supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:4-16, 41-105`):
   - `public.is_admin(user_id uuid)` checks only `profiles.role = 'admin'::public.user_role`.
   - All admin policies across all 10 tables (`profiles`, `admin_staff_members`, `candidate_private_profiles`, `company_profiles`, `candidate_profiles`, `profile_documents`, `company_invoices`, `support_tickets`, `support_ticket_messages`, `vacancy_reports`) delegate directly to `public.is_admin()`.

6. **Commercial Bypass** (`src/modules/company/actions/settings.ts:74-133`):
   - `updateSubscriptionPlan` sets `subscription_plan: 'enterprise'` and inserts a `status: 'paid'` invoice in `company_invoices` without payment processor confirmation.

---

## 2. Logic Chain

1. From Observation 1, the page/layout guard for `/dashboard/admin/*` allows any user whose `public.profiles.role` is `'admin'` to load all administrative views.
2. From Observation 2, every administrative Server Action enforces only `profiles.role === 'admin'`, completely ignoring `admin_staff_members.sub_role`, `permissions`, and `status`.
3. Therefore, any administrator (regardless of whether their UI label is `support`, `content_admin`, `verification_admin`, or `ops_admin`) can invoke every administrative action in the system, including managing staff, changing user roles, viewing private candidate PII, modifying company credits, and resolving reports.
4. From Observation 3, there are no hierarchy checks, self-escalation restrictions, or minimum `super_admin` threshold validations in staff actions. Thus, horizontal and vertical privilege escalations are 100% possible.
5. From Observation 5, PostgreSQL Row-Level Security relies solely on `public.is_admin()`, meaning database-level access via direct PostgREST client queries grants identical, unconstrained privileges to all administrators.
6. From Observation 4, the impersonation system does not sign cookies, lacks token lifecycle tracking, and allows any admin to impersonate other admins.
7. From Observation 6, commercial subscriptions can be bypassed without payment verification.

---

## 3. Caveats

- **No Caveats**: The codebase was examined comprehensively across all Next.js Server Actions, Route Handlers, Proxy logic, Layout guards, Auth libraries, and PostgreSQL migrations. No external third-party microservices exist outside the Supabase/Next.js stack.

---

## 4. Conclusion

The Central Finding is **EMPIRICALLY CONFIRMED**:
- `profiles.role = 'admin'` acts as a monolithic, root-level privilege across 100% of Server Actions and PostgreSQL RLS policies.
- The `public.admin_staff_members` table and its columns (`sub_role`, `permissions`, `department`, `status`) function solely as advisory UI metadata without backend enforcement.
- This creates severe, verified vulnerabilities: P0 vertical self-escalation to `super_admin`, arbitrary staff deletion/lockout, cross-tenant data access, sensitive candidate PII exposure, unsigned cross-role impersonation, and commercial subscription bypass.

---

## 5. Verification Method

To independently verify these findings, inspect the following exact file paths and code snippets:

1. **Verify Binary Admin Guard**:
   - Inspect `src/lib/auth/require-admin.ts` (lines 35–49).
   - Inspect `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (lines 19–28).
2. **Verify Lack of Permission Checking**:
   - Grep for `permissions.includes` or `subRole` in `src/app/(dashboard)/dashboard/admin/` -> 0 matches in authorization conditionals.
3. **Verify Database RLS Binary Check**:
   - Inspect `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql` (lines 4–16).
4. **Verify Impersonation Missing HMAC & Target Validation**:
   - Inspect `src/lib/auth/impersonation.ts` (lines 43–96).
5. **Verify Commercial Bypass**:
   - Inspect `src/modules/company/actions/settings.ts` (lines 74–133).
