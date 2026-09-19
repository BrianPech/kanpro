# Handoff Report — Lead Staff Management, Privilege Escalation & Commercial Bypass Security Explorer

**Date**: 2026-08-27  
**Agent**: `teamwork_preview_explorer_s2`  
**Working Directory**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_s2`  
**Scope**: Requirements R3 (Staff Management, Privilege Escalation, Lockout & Unsafe Defaults) & R4 (Commercial Subscription Bypass & Direct RLS Bypass)  
**Primary Deliverable**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_s2/report.md`

---

## 1. Observation

### Observation 1.1: Admin Guard Equivalence to Root
- File: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:8-30`
- Line content:
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
- Observation: Only `profiles.role === 'admin'` is evaluated. No check exists for `admin_staff_members.sub_role`, `admin_staff_members.status`, or `admin_staff_members.permissions`.

### Observation 1.2: Vertical Privilege Escalation to Super Admin
- File: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:88-250` (`createAdminStaffMember`) and `252-305` (`updateAdminStaffMember`).
- In `updateAdminStaffMember`: Accepts arbitrary `formData.subRole` (e.g. `'super_admin'`) and `formData.permissions` without checking caller sub-role or prohibiting self-mutation (`profileId === user.id`).
- In `createAdminStaffMember`: Any admin can create a new `super_admin` or update an existing admin's sub-role to `'super_admin'` (lines 148-164).

### Observation 1.3: Super Admin Deletion, Demotion, Disabling & Lockout
- File: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:330-354` (`deleteAdminStaffMember`):
```typescript
export async function deleteAdminStaffMember(profileId: string) {
  const { user } = await requireAdminAuth();
  if (user.id === profileId) {
    throw new Error("No puede dar de baja su propio usuario administrador.");
  }
  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.from("admin_staff_members").delete().eq("profile_id", profileId);
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: "candidate" })
    .eq("id", profileId);
...
```
- Observation: Any admin can delete any other admin (including a `super_admin`), and there is zero check on whether the deleted admin is the last active `super_admin`.

### Observation 1.4: Insecure Default Fallback to Super Admin for Orphan Admins
- File: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:63-73`:
```typescript
subRole: (s?.sub_role as AdminSubRole) || "super_admin",
department: s?.department || "Dirección General",
permissions: (s?.permissions as AdminPermissionKey[]) || [
  "manage_users",
  "manage_companies",
  "verify_documents",
  "manage_vacancies",
  "analytics_access",
  "system_settings",
],
status: (s?.status as AdminStaffStatus) || "active",
```
- Observation: If an admin profile has no record in `admin_staff_members`, it defaults to `"super_admin"` with all 6 permissions.

### Observation 1.5: Commercial Subscription Bypass Server Action
- File: `src/modules/company/actions/settings.ts:74-133` (`updateSubscriptionPlan`):
```typescript
export async function updateSubscriptionPlan(companyId: string, plan: "basic" | "pro" | "enterprise") {
  ...
  const { error: updateErr } = await supabase
    .from("company_profiles")
    .update({
      subscription_plan: plan,
      subscription_status: "active",
      subscription_period_end: periodEnd.toISOString(),
      featured_vacancies_allowance: featuredAllowance,
      updated_at: new Date().toISOString()
    } as any)
    .eq("id", companyId)
  ...
  if (planPrice > 0) {
    await supabase.from("company_invoices").insert({
      company_id: companyId,
      plan_name: planName,
      amount: planPrice,
      currency: "MXN",
      status: "paid",
      payment_method: "Tarjeta / Suscripción Activa"
    })
  }
```
- Observation: Arbitrary plan updates are applied without payment provider (Stripe) verification or webhook callbacks, and a fake paid invoice is generated.

### Observation 1.6: Direct RLS Bypass on `company_profiles`
- File: `supabase/migrations/20260814093811_harden_profile_privacy.sql:63-64`:
```sql
CREATE POLICY "Companies manage own profile" ON public.company_profiles FOR ALL TO authenticated
  USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));
```
- Observation: Authenticated companies have unrestricted UPDATE access to all columns on their row, allowing direct mutation of `subscription_plan`, `credits_available`, and `verification_status`.

---

## 2. Logic Chain

1. **Premise 1**: All administrative Server Actions and RLS policies rely on `profiles.role === 'admin'` via `requireAdminAuth` or `public.is_admin()`. (Obs 1.1)
2. **Premise 2**: Since no sub-role hierarchy or permission check is enforced in `requireAdminAuth`, all sub-roles (`support`, `verification_admin`, `ops_admin`, `super_admin`) execute actions with identical root authority. (Obs 1.1)
3. **Inference 1**: Therefore, a `support` admin can execute `createAdminStaffMember` or `updateAdminStaffMember` with `subRole: 'super_admin'`, escalating vertically without restriction. (Obs 1.2)
4. **Premise 3**: `deleteAdminStaffMember` and `toggleAdminStaffStatus` only prevent self-deletion (`profileId === user.id`) but contain no hierarchy validation or remaining `super_admin` count checks. (Obs 1.3)
5. **Inference 2**: Therefore, any standard admin can delete, demote, or suspend any `super_admin`, and deleting the last remaining `super_admin` causes permanent executive lockout. (Obs 1.3)
6. **Premise 4**: `getAdminStaffMembers` provides a fallback to `"super_admin"` with all permissions for orphan admins. (Obs 1.4)
7. **Inference 3**: Any failed rollback, partial deletion, or orphan admin creation automatically grants root `super_admin` capabilities. (Obs 1.4)
8. **Premise 5**: `updateSubscriptionPlan` applies plan changes and generates paid invoices with no payment gateway verification, and the `company_profiles` RLS policy grants companies full UPDATE authority over their row. (Obs 1.5, Obs 1.6)
9. **Inference 4**: Therefore, any company user can self-upgrade to the `enterprise` tier for free via Server Action or direct client SDK calls, completely bypassing commercial monetization gating. (Obs 1.5, Obs 1.6)

---

## 3. Caveats

- **No Caveats**. The codebase was thoroughly inspected across all Server Actions (`app/(dashboard)/dashboard/admin/**/*`, `modules/company/actions/*`), helper libraries (`lib/auth/*`, `lib/supabase/*`), and database migration definitions (`supabase/migrations/*`).
- Live Stripe webhook endpoints were searched across the repository; none exist in the codebase.

---

## 4. Conclusion

The audit identifies six Critical (P0) and three High (P1) vulnerabilities:
1. **P0-01**: Commercial Subscription Self-Upgrade & Fake Invoice Generation (`updateSubscriptionPlan`).
2. **P0-02**: Direct RLS Column Mutation on `company_profiles` (`subscription_plan`, `credits_available`, `verification_status`).
3. **P0-03**: Vertical Privilege Escalation to `super_admin` via `updateAdminStaffMember` and `createAdminStaffMember`.
4. **P0-04**: Direct RLS Privilege Escalation on `admin_staff_members` and `profiles` via `public.is_admin()`.
5. **P0-05**: Executive Lockout via Deletion, Demotion, or Disabling of the Last `super_admin`.
6. **P0-06**: Insecure Default Fallback Granting Full `super_admin` Privileges to Orphan Admins.
7. **P1-01**: Unrestricted Admin Impersonation of `super_admin` with Unsigned Plaintext Cookies (`impersonation.ts`).
8. **P1-02**: Self-Revocation Hole in `updateUserProfile`.
9. **P1-03**: Low-Privilege Admins (`support`) Access to Sensitive Candidate PII (CURP, RFC, Cédula) and Storage Documents.

---

## 5. Verification Method

To independently verify these findings:
1. **Inspect Code Locations**:
   - `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (lines 8-30, 63-73, 88-250, 252-305, 330-354)
   - `src/modules/company/actions/settings.ts` (lines 74-133)
   - `supabase/migrations/20260814093811_harden_profile_privacy.sql` (lines 63-64)
   - `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql` (lines 4-16, 82-86)
2. **Run Test Suite**:
   - Command: `pnpm vitest run`
   - Result: 93/93 tests pass (confirming existing tests cover external signup validation but not sub-role isolation or subscription gating).
3. **Report Document**:
   - Full detailed findings, code snippets, impact, and remediation code provided in `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_s2/report.md`.
