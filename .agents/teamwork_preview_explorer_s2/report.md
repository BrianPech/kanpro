# Post-Hardening Forensic Security Audit Report
## Privilege Escalation, Staff Management, Lockout Protections & Commercial Subscription Bypass (R3 & R4)

**Date**: August 27, 2026  
**Auditor**: Lead Staff Management, Privilege Escalation & Commercial Bypass Security Explorer  
**Workspace**: `/Users/brianpech/Developer/Commercial/kanpro`  
**Classification**: STRICTLY CONFIDENTIAL — SECURITY AUDIT REPORT  
**Scope**: Requirements R3 (Staff Management, Privilege Escalation, Lockout & Unsafe Defaults) & R4 (Commercial Subscription Bypass, Gating & Direct RLS Mutations)

---

## 1. Executive Summary

This forensic audit evaluates the security architecture of the K'anPro platform following initial authorization hardening. While public-facing authentication hardening successfully prevents anonymous and newly registered users from injecting `role = 'admin'` via client metadata or OAuth query parameters (verified by the 93 passing unit tests), **critical vulnerabilities remain within internal administrative authorization boundaries, staff lifecycle management, database Row Level Security (RLS), and commercial billing gating**.

### Key Findings Summary:
1. **Flawed Root Equivalence (`profiles.role = 'admin'`)**: All internal administrative guards (`requireAdminAuth`, `requireAdmin`, `public.is_admin()`) only evaluate whether `profiles.role === 'admin'`. The system does **not** enforce sub-role hierarchy (`super_admin` vs `ops_admin` vs `support`) or granular permission checks in backend Server Actions or RLS policies.
2. **Horizontal and Vertical Privilege Escalation (P0)**: Any authenticated admin (including low-privilege `support` or `verification_admin`) can create new `super_admin` accounts, promote themselves or other admins to `super_admin`, assign all permissions, and demote, suspend, or delete existing `super_admin` accounts.
3. **Executive Lockout Vulnerability (P0)**: There is no atomic check or database constraint preventing the deletion, demotion, or suspension of the **last active `super_admin`**, exposing the platform to complete administrative decapitation.
4. **Dangerous Orphan Admin Default (P0)**: In `getAdminStaffMembers()`, if an admin profile lacks an entry in `public.admin_staff_members`, the application automatically defaults their sub-role to `"super_admin"` and grants **all 6 administrative permissions**.
5. **Commercial Subscription & Billing Bypass (P0)**:
   - The Server Action `updateSubscriptionPlan` allows any authenticated company user to arbitrarily self-assign the `"enterprise"` plan, extend subscription expiration by 30 days, increase featured job allowances, and create a fake invoice record marked `status = 'paid'` with zero payment verification.
   - The RLS policy `"Companies manage own profile"` on `public.company_profiles` permits authenticated companies to directly update `subscription_plan`, `subscription_status`, `credits_available`, and `verification_status` via the Supabase client SDK, completely bypassing backend validation.
6. **Insecure Administrative Impersonation (P1)**: The impersonation mechanism (`lib/auth/impersonation.ts`) permits any admin to impersonate other admins or `super_admin`s and relies on unsigned plaintext HTTP cookies.

---

## 2. Forensic Analysis of Staff Management & Privilege Escalation (R3)

### 2.1. Authorization Architecture & Guard Weakness

The administrative layer relies primarily on two guard implementations:

1. **`src/lib/auth/require-admin.ts`**:
```typescript
// Lines 35-49
const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

if (!profile || profile.role !== "admin") {
  // redirect
}
```
2. **`requireAdminAuth()` in `src/app/(dashboard)/dashboard/admin/staff/actions.ts`**:
```typescript
// Lines 8-30
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

**Forensic Evaluation**:
- `requireAdminAuth()` and `requireAdmin()` perform a binary check (`profile.role === 'admin'`).
- Neither guard validates `admin_staff_members.sub_role`, `admin_staff_members.status` (`active`, `suspended`, `inactive`), or `admin_staff_members.permissions`.
- Consequently, an administrator whose status is set to `'suspended'` in `admin_staff_members` retains **100% full access** to all administrative Server Actions and database operations as long as their `profiles.role` remains `'admin'`.

---

### 2.2. Audit of Staff Management Server Actions

#### A. `createAdminStaffMember` (`src/app/(dashboard)/dashboard/admin/staff/actions.ts:88-250`)
- **Guard**: `requireAdminAuth()` (checks only `profiles.role === 'admin'`).
- **Target Sub-role Validation**: **NONE**. The caller supplies `formData.subRole: AdminSubRole` and `formData.permissions: AdminPermissionKey[]`.
- **Privilege Escalation Vector**:
  1. A standard administrator (e.g. `sub_role = 'support'` or `sub_role = 'ops_admin'`) calls `createAdminStaffMember({ ..., subRole: 'super_admin', permissions: ['manage_users', 'manage_companies', 'system_settings'] })`.
  2. The function invokes `supabaseAdmin.auth.admin.createUser` and creates an authenticated user.
  3. It upserts `profiles` with `role = 'admin'` and upserts `admin_staff_members` with `sub_role = 'super_admin'`.
  4. Furthermore, if `cleanEmail` already exists and has `role === 'admin'` (lines 130-168), it silently updates that admin's sub-role and permissions to whatever the caller supplied.
- **Can a standard admin create a `super_admin`?**: **YES (CONFIRMED VULNERABILITY)**.

#### B. `updateAdminStaffMember` (`src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305`)
- **Guard**: `requireAdminAuth()`.
- **Target Profile Validation**: **NONE**.
- **Self-Escalation Check**: **NONE**. The function does not verify `profileId !== user.id`.
- **Privilege Escalation Vector**:
  1. An admin with low permissions (e.g., `support`) discovers their own `profileId` (or another admin's `profileId`).
  2. The admin calls `updateAdminStaffMember(self.id, { name, email, whatsappNumber, subRole: 'super_admin', department: 'Dirección General', permissions: ['manage_users', 'manage_companies', 'verify_documents', 'manage_vacancies', 'analytics_access', 'system_settings'], status: 'active' })`.
  3. `supabaseAdmin.from("admin_staff_members").upsert(...)` overwrites the staff record with `sub_role = 'super_admin'` and all permissions.
- **Can a standard admin promote themselves or another user to `super_admin`?**: **YES (CONFIRMED VULNERABILITY)**.

#### C. `toggleAdminStaffStatus` (`src/app/(dashboard)/dashboard/admin/staff/actions.ts:307-328`)
- **Guard**: `requireAdminAuth()`.
- **Target Sub-role Validation**: **NONE**.
- **Disabling Super Admins**:
  1. A standard admin calls `toggleAdminStaffStatus(superAdminProfileId, 'suspended')` or `'inactive'`.
  2. `supabaseAdmin.from("admin_staff_members").upsert({ profile_id: profileId, status: status })` updates the status.
  3. No check prevents targeting a `super_admin` or disabling the last active `super_admin`.
- **Can a standard admin disable a `super_admin`?**: **YES (CONFIRMED VULNERABILITY)**.

#### D. `deleteAdminStaffMember` (`src/app/(dashboard)/dashboard/admin/staff/actions.ts:330-354`)
```typescript
// Lines 330-354
export async function deleteAdminStaffMember(profileId: string) {
  const { user } = await requireAdminAuth();

  if (user.id === profileId) {
    throw new Error("No puede dar de baja su propio usuario administrador.");
  }

  const supabaseAdmin = createAdminClient();

  // Remove from admin_staff_members
  await supabaseAdmin.from("admin_staff_members").delete().eq("profile_id", profileId);

  // Downgrade profile role to candidate to revoke admin permissions safely
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: "candidate" })
    .eq("id", profileId);

  if (error) {
    throw new Error(`Error al dar de baja el acceso administrativo: ${error.message}`);
  }

  revalidatePath("/dashboard/admin/staff");
  return { success: true };
}
```
- **Self-Deletion**: Blocked by `if (user.id === profileId)`.
- **Cross-Admin / Super Admin Deletion**: Completely unrestricted. Any admin (e.g. Admin A) can pass the `profileId` of the primary `super_admin` (Admin B).
- The action deletes Admin B from `admin_staff_members` and downgrades Admin B's `profiles.role` to `'candidate'`.
- **Can a standard admin demote, disable, or delete a `super_admin`?**: **YES (CONFIRMED VULNERABILITY)**.

---

### 2.3. Self-Escalation vs. Self-Revocation Matrix

| Action | Function | Self-Mutation Allowed? | Risk & Consequence |
|---|---|---|---|
| Elevate Sub-Role to `super_admin` | `updateAdminStaffMember` | **YES** | A low-level admin elevates their own sub-role and grants themselves all permissions. |
| Assign Arbitrary Permissions | `updateAdminStaffMember` | **YES** | Admin grants themselves unassigned permissions (`system_settings`, `manage_users`). |
| Set Own Staff Status to Suspended | `toggleAdminStaffStatus` | **YES** | Admin sets own staff status to `'suspended'`. (However, `requireAdminAuth` still allows them in because it only checks `profiles.role`). |
| Self-Revoke Admin Role via `updateUserRole` | `updateUserRole` | **NO** (Blocked) | `if (userId === user.id && newRole !== "admin") throw ...` (Lines 33-35). |
| Self-Revoke Admin Role via `updateUserProfile` | `updateUserProfile` | **YES** (Vulnerable) | `updateUserProfile(user.id, { fullName, role: 'candidate' })` has **no** self-check and downgrades the caller's role! |
| Self-Ban / Self-Suspend Profile | `banUserAccount` | **NO** (Blocked) | `if (user.id === userId) throw ...` (`reports/actions.ts:138`). |
| Self-Delete Admin Staff Record | `deleteAdminStaffMember` | **NO** (Blocked) | `if (user.id === profileId) throw ...` (`staff/actions.ts:333`). |

---

## 3. Lockout Protections & Unsafe Defaults (R3)

### 3.1. The "Last Super Admin" Executive Lockout Defect

In all administrative operations that delete, downgrade, or suspend staff:
- `deleteAdminStaffMember(profileId)` (`staff/actions.ts:330`)
- `updateAdminStaffMember(profileId, { subRole, status, ... })` (`staff/actions.ts:252`)
- `toggleAdminStaffStatus(profileId, status)` (`staff/actions.ts:307`)
- `updateUserRole(userId, newRole)` (`users/actions.ts:30`)
- `updateUserProfile(userId, data)` (`users/actions.ts:92`)

**Forensic Finding**:
There is **zero atomic checking or count verification** of remaining active `super_admin` accounts. If an organization has 1 `super_admin` and 2 standard admins:
1. Standard Admin 1 calls `deleteAdminStaffMember(superAdmin.id)`.
2. The sole `super_admin` is deleted and demoted to `candidate`.
3. The platform is left with **0 `super_admin` accounts**.
4. Standard Admin 1 and Admin 2 still have `profiles.role = 'admin'`, but no user holds legitimate `super_admin` authority.

### 3.2. Race Conditions & Non-Atomic Staff Mutations

1. **Non-Transactional Multi-Table Mutations**:
   In `deleteAdminStaffMember`:
   - Step 1: `supabaseAdmin.from("admin_staff_members").delete().eq("profile_id", profileId)`
   - Step 2: `supabaseAdmin.from("profiles").update({ role: "candidate" }).eq("id", profileId)`
   If Step 1 succeeds and Step 2 fails (e.g. database timeout, network drop, process termination), the user becomes an **orphan admin** (a user with `profiles.role = 'admin'` but no row in `admin_staff_members`).
2. **Concurrent Deletions**:
   If two admins simultaneously trigger `deleteAdminStaffMember` targeting the last two `super_admin`s, both checks pass concurrently because there is no `SELECT ... FOR UPDATE` or database trigger preventing count drop below 1.

### 3.3. Dangerous Unsafe Fallback Default in `getAdminStaffMembers`

Inspect `getAdminStaffMembers` in `src/app/(dashboard)/dashboard/admin/staff/actions.ts:55-85`:

```typescript
// Lines 55-75
return (adminProfiles || []).map((p) => {
  const s = staffMap.get(p.id);
  return {
    id: s?.id || p.id,
    profileId: p.id,
    name: p.full_name || "Administrador K'anPro",
    email: p.email,
    whatsappNumber: p.whatsapp_number || "",
    subRole: (s?.sub_role as AdminSubRole) || "super_admin", // <--- UNSAFE DEFAULT
    department: s?.department || "Dirección General",
    permissions: (s?.permissions as AdminPermissionKey[]) || [
      "manage_users",
      "manage_companies",
      "verify_documents",
      "manage_vacancies",
      "analytics_access",
      "system_settings",
    ], // <--- UNSAFE DEFAULT (ALL PERMISSIONS GRANTED)
    status: (s?.status as AdminStaffStatus) || "active",
    ...
  };
});
```

**Forensic Evaluation**:
- When any user profile has `profiles.role = 'admin'` but is missing an associated record in `public.admin_staff_members` (due to orphan promotion, partial rollback failure, legacy migration, or direct SQL insert):
  - The UI and backend listing fallback to `subRole = "super_admin"`.
  - The permissions list falls back to **ALL 6 PERMISSIONS**.
- **Impact**: Fails *open* instead of *closed*. Any orphaned admin profile instantly inherits root-level `super_admin` representation and privileges.

### 3.4. User Signup Role Assignment Audit

Audited entry points:
1. **Direct Signup (`signUpCandidate`, `signUpCompany` in `auth-service.ts:60, 107`)**:
   - Sends `raw_user_meta_data: { role: 'candidate' | 'company' }`.
2. **Database Trigger `handle_new_user()` (`supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql:33-37`)**:
   ```sql
   IF raw_role_str = 'company' THEN
     assigned_role := 'company'::public.user_role;
   ELSE
     assigned_role := 'candidate'::public.user_role;
   END IF;
   ```
   - If an attacker sends `role: 'admin'`, `role: 'super_admin'`, or arbitrary strings, `handle_new_user()` sanitizes it and assigns `'candidate'`.
3. **OAuth Callback (`src/app/(auth)/auth/callback/route.ts:30-35`)**:
   - Explicitly rejects non-candidate/company roles:
   ```typescript
   const assignedRole: "candidate" | "company" =
     searchRole === "company" || searchRole === "candidate"
       ? searchRole
       : metaRole === "company" || metaRole === "candidate"
       ? metaRole
       : "candidate";
   ```
4. **Conclusion on Signup Defaults**: Public signup vectors are **properly hardened**. Public users cannot self-register directly as `admin`.

---

## 4. Commercial Subscription Bypass Audit (R4)

### 4.1. The `updateSubscriptionPlan` Server Action Bypass

Inspect `src/modules/company/actions/settings.ts:74-133`:

```typescript
// Lines 74-133
export async function updateSubscriptionPlan(companyId: string, plan: "basic" | "pro" | "enterprise") {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.")
  }

  // Determine allowance & price based on plan
  let featuredAllowance = 0
  let planPrice = 0
  let planName = "Plan Básico"

  if (plan === "pro") {
    featuredAllowance = 3
    planPrice = 1499.00
    planName = "Plan PRO Mensual"
  } else if (plan === "enterprise") {
    featuredAllowance = 10
    planPrice = 3999.00
    planName = "Plan Corporativo Mensual"
  }

  const periodEnd = new Date()
  periodEnd.setDate(periodEnd.getDate() + 30)

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

  if (updateErr) {
    console.error("Error updating subscription plan:", updateErr)
    throw new Error("No se pudo actualizar el plan de suscripción.")
  }

  // Create invoice record in DB if price > 0
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

  revalidatePath("/dashboard/company/settings")
  revalidatePath("/dashboard/company")
  revalidatePath("/dashboard/company/vacancies")

  return { success: true }
}
```

**Forensic Analysis**:
1. **Zero Gateway Integration**: No Stripe SDK, OpenPay SDK, or payment provider integration is invoked.
2. **Zero Webhook Validation**: No webhook event from a payment processor is verified.
3. **No Ownership Validation**: The code checks `if (!user)`, but does not even assert that `user.id === companyId`. An authenticated user could pass any `companyId`.
4. **Immediate Plan & Allowance Grant**: Sets `subscription_plan: "enterprise"`, `subscription_status: "active"`, and `featured_vacancies_allowance: 10`.
5. **Fake Invoice Fabrication**: Automatically inserts a row into `public.company_invoices` with `status: "paid"`, creating false accounting records.

---

### 4.2. Direct Supabase RLS Bypass on `public.company_profiles`

Inspect migration `supabase/migrations/20260814093811_harden_profile_privacy.sql:63-64`:

```sql
CREATE POLICY "Companies manage own profile" ON public.company_profiles FOR ALL TO authenticated
  USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));
```

**Forensic Analysis**:
- The RLS policy grants `FOR ALL` (including `UPDATE`) to authenticated users whose `id` matches `auth.uid()`.
- Unlike `public.profiles` (which restricts `role` updates in its policy `WITH CHECK (role = get_user_role())`), `public.company_profiles` has **no column restrictions**.
- Any company user with standard access can execute from the browser developer console or via curl:
```javascript
await supabase
  .from('company_profiles')
  .update({
    subscription_plan: 'enterprise',
    subscription_status: 'active',
    subscription_period_end: '2099-12-31T23:59:59Z',
    featured_vacancies_allowance: 9999,
    credits_available: 9999,
    verification_status: 'approved'
  })
  .eq('id', supabase.auth.user().id);
```
- PostgreSQL RLS evaluates `id = auth.uid()`, which is `TRUE`, and **allows the entire update**.
- **Impact**: Instant, unmetered, perpetual enterprise tier access and self-verification without spending a single cent.

---

### 4.3. Feature Gating Verification Mechanics

How do company features verify subscription tiers?

1. **Vacancy Limits (`src/modules/company/hooks/use-vacancy-manager.ts:60-76, 131-147`)**:
```typescript
// Lines 61-75
const plan = cp?.subscription_plan || "basic";
let maxAllowed = 3;
if (plan === "pro") maxAllowed = 15;
if (plan === "enterprise") maxAllowed = Infinity;

if (maxAllowed !== Infinity) {
  const { count: activeCount } = await supabase
    .from("vacancies")
    .select("id", { count: "exact", head: true })
    .eq("company_id", user.id)
    .eq("is_active", true);

  if ((activeCount || 0) >= maxAllowed) {
    throw new Error(`Has alcanzado el límite de ${maxAllowed} vacantes activas de tu Plan ${plan.toUpperCase()}...`);
  }
}
```
2. **Company Settings UI (`src/modules/company/components/company-settings-dialog.tsx:222-269, 970-1020`)**:
   - The user selects `"pro"` or `"enterprise"` from the UI tabs.
   - Clicking "Cambiar a este plan" directly invokes `updateSubscriptionPlan(accountInfo.id, newPlan)`.
   - The UI immediately displays the checkmark badge and unlocked quotas.
3. **Assessment**: Feature gating relies exclusively on `company_profiles.subscription_plan` in the database. Because `company_profiles.subscription_plan` can be modified by the client at will (via Server Action and direct RLS), **the platform's entire monetization model is completely bypassed**.

---

## 5. Direct Supabase RLS Adversarial Matrix (Admin & Staff)

Migration `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql` defines:

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

### Table-by-Table RLS Access by Administrative Sub-Roles

| Table | Policy Name | RLS Check | `super_admin` | `ops_admin` | `support` | `verification_admin` |
|---|---|---|---|---|---|---|
| `admin_staff_members` | "Admins can manage admin staff members" | `public.is_admin()` | FULL (CRUD) | FULL (CRUD) ⚠️ | FULL (CRUD) ⚠️ | FULL (CRUD) ⚠️ |
| `profiles` | "Admins manage all profiles" | `public.is_admin()` | FULL (CRUD) | FULL (CRUD) ⚠️ | FULL (CRUD) ⚠️ | FULL (CRUD) ⚠️ |
| `candidate_private_profiles` | "Admins manage candidate private identity" | `public.is_admin()` | FULL (CRUD) | FULL (CRUD) ⚠️ | FULL (CRUD) ⚠️ | FULL (CRUD) ⚠️ |
| `profile_documents` | "Admins can manage verification documents" | `public.is_admin()` | FULL (CRUD) | FULL (CRUD) ⚠️ | FULL (CRUD) ⚠️ | FULL (CRUD) ⚠️ |
| `company_invoices` | "Admins can manage all invoices" | `public.is_admin()` | FULL (CRUD) | FULL (CRUD) ⚠️ | FULL (CRUD) ⚠️ | FULL (CRUD) ⚠️ |
| `support_tickets` | "Admins manage all support tickets" | `public.is_admin()` | FULL (CRUD) | FULL (CRUD) | FULL (CRUD) | FULL (CRUD) |
| `vacancy_reports` | "Admins manage all vacancy reports" | `public.is_admin()` | FULL (CRUD) | FULL (CRUD) | FULL (CRUD) | FULL (CRUD) |

**Key Vulnerability Demonstration**:
An authenticated user with sub-role `support` can issue a direct REST request to Supabase PostgREST:
```http
PATCH /rest/v1/admin_staff_members?profile_id=eq.<support_user_uuid>
Authorization: Bearer <support_user_jwt>

{
  "sub_role": "super_admin",
  "permissions": ["manage_users", "manage_companies", "verify_documents", "manage_vacancies", "analytics_access", "system_settings"]
}
```
**Result**: Returns `200 OK`. The `support` user is now a full `super_admin` in the database.

---

## 6. Comprehensive Vulnerability Catalog

| ID | Title | Severity | Area | Status | Exploitability |
|---|---|---|---|---|---|
| **P0-01** | Commercial Subscription Arbitrary Self-Upgrade & Paid Invoice Generation | **P0 (Critical)** | Billing / Server Action | CONFIRMED | Trivial (1 click in UI or 1 API call) |
| **P0-02** | Direct RLS Column Mutation on `company_profiles` (Subscription, Quotas, Verification) | **P0 (Critical)** | Database / RLS | CONFIRMED | Trivial (Direct Supabase SDK call) |
| **P0-03** | Vertical Privilege Escalation from Standard Admin to `super_admin` via Server Actions | **P0 (Critical)** | RBAC / Server Action | CONFIRMED | Trivial (`updateAdminStaffMember`) |
| **P0-04** | Direct RLS Privilege Escalation on `admin_staff_members` & `profiles` | **P0 (Critical)** | Database / RLS | CONFIRMED | Trivial (Direct SDK call by any admin) |
| **P0-05** | Executive Lockout via Deletion, Demotion, or Disabling of Last `super_admin` | **P0 (Critical)** | Staff Lifecycle | CONFIRMED | Moderate (Admin deletes sole super_admin) |
| **P0-06** | Insecure Default Fallback Granting `super_admin` and All Permissions to Orphan Admins | **P0 (Critical)** | Staff Service | CONFIRMED | Inherent (Automatic fallback in `getAdminStaffMembers`) |
| **P1-01** | Unrestricted Admin Impersonation of `super_admin` with Unsigned Plaintext Cookies | **P1 (High)** | Impersonation | CONFIRMED | Low/Moderate (`startImpersonating`) |
| **P1-02** | Self-Revocation Hole via `updateUserProfile` | **P1 (High)** | User Management | CONFIRMED | Low (Admin accidentally or maliciously demotes self) |
| **P1-03** | Low-Privilege Admins (`support`, `content`) Access to Highly Sensitive PII (CURP, RFC, INE) | **P1 (High)** | Data Privacy / RLS | CONFIRMED | Trivial (Any admin views private profile data) |
| **P2-01** | Non-Atomic Staff Deletion / Creation Leading to Split-Brain Orphan States | **P2 (Medium)** | Database / Concurrency | CONFIRMED | Low (Triggered on network/process failure) |

---

## 7. Concrete Remediation & Defensive Implementation Roadmap

### 7.1. Database RLS Hardening (Postgres Migration)

1. **Restrict `company_profiles` updates**:
```sql
-- Separate company editable fields from billing / verification fields
DROP POLICY IF EXISTS "Companies manage own profile" ON public.company_profiles;

CREATE POLICY "Companies update own public profile fields"
  ON public.company_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND subscription_plan = (SELECT cp.subscription_plan FROM public.company_profiles cp WHERE cp.id = auth.uid())
    AND subscription_status = (SELECT cp.subscription_status FROM public.company_profiles cp WHERE cp.id = auth.uid())
    AND verification_status = (SELECT cp.verification_status FROM public.company_profiles cp WHERE cp.id = auth.uid())
    AND credits_available = (SELECT cp.credits_available FROM public.company_profiles cp WHERE cp.id = auth.uid())
  );
```

2. **Restrict `admin_staff_members` management exclusively to active `super_admin`s**:
```sql
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_staff_members s
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE s.profile_id = COALESCE(user_id, auth.uid())
      AND p.role = 'admin'::public.user_role
      AND s.sub_role = 'super_admin'
      AND s.status = 'active'
  );
$$;

DROP POLICY IF EXISTS "Admins can manage admin staff members" ON public.admin_staff_members;
CREATE POLICY "Only active super admins can manage staff members"
  ON public.admin_staff_members FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
```

3. **Atomic Trigger to Prevent Lockout of the Last `super_admin`**:
```sql
CREATE OR REPLACE FUNCTION public.prevent_last_super_admin_removal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  active_super_admin_count integer;
BEGIN
  -- Check if old row was an active super admin and is being demoted, disabled, or deleted
  IF (TG_OP = 'DELETE' AND OLD.sub_role = 'super_admin' AND OLD.status = 'active') OR
     (TG_OP = 'UPDATE' AND OLD.sub_role = 'super_admin' AND OLD.status = 'active' AND (NEW.sub_role <> 'super_admin' OR NEW.status <> 'active')) THEN
    
    SELECT COUNT(*) INTO active_super_admin_count
    FROM public.admin_staff_members
    WHERE sub_role = 'super_admin' AND status = 'active' AND profile_id <> OLD.profile_id;

    IF active_super_admin_count < 1 THEN
      RAISE EXCEPTION 'Operación denegada: No se puede eliminar, degradar o suspender al último super_admin activo del sistema.';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_protect_last_super_admin
  BEFORE UPDATE OR DELETE ON public.admin_staff_members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_super_admin_removal();
```

---

### 7.2. Server Actions Hardening

1. **Replace `requireAdminAuth` with Hierarchical `requireSuperAdminAuth` & Permission Validators**:
```typescript
export async function requireAdminStaffAuth(requiredPermission?: AdminPermissionKey) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data: staff } = await supabase
    .from("admin_staff_members")
    .select("sub_role, status, permissions")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!staff || staff.status !== "active") {
    throw new Error("Acceso denegado: Cuenta administrativa inactiva o suspendida.");
  }

  if (staff.sub_role !== "super_admin" && requiredPermission) {
    if (!staff.permissions?.includes(requiredPermission)) {
      throw new Error(`Acceso denegado: Requiere permiso ${requiredPermission}.`);
    }
  }

  return { user, staff };
}
```

2. **Secure `updateSubscriptionPlan` with Webhook or Service-Role Gateway Processing**:
   - Strip client ability to directly call `updateSubscriptionPlan` with arbitrary plan strings.
   - Introduce Stripe Checkout Session creation (`createStripeCheckoutSession(planId)`).
   - Only allow plan changes in the database via verified Stripe Webhook Handler (`/api/webhooks/stripe`) using `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET` and service-role database updates.

3. **Secure Impersonation (`src/lib/auth/impersonation.ts`)**:
   - Only allow `super_admin` to impersonate candidates and companies.
   - Strictly prohibit impersonating other `admin` or `super_admin` accounts:
     `if (targetProfile.role === 'admin') throw new Error('No se permite impersonar cuentas administrativas.');`
   - Sign impersonation cookies with HMAC-SHA256 using an environment secret `AUTH_SECRET`.

---

## 8. Conclusion

The K'anPro authorization system exhibits robust edge validation against external client injection during public registration. However, **internal authorization boundaries, staff hierarchy enforcement, database RLS, and commercial billing gating contain critical vulnerabilities (P0)** that permit:
1. Free, unrestricted self-promotion to `super_admin` by any admin.
2. Complete takeover and deletion of existing `super_admin`s.
3. System lockout by removing the last `super_admin`.
4. Free commercial subscription upgrades to `enterprise` tier and fake paid invoice generation.

Implementing the defensive migrations, hierarchical guard helpers, and payment gateway webhooks specified in Section 7 will fully harden the platform and align it with enterprise-grade RBAC standards.
