# Comprehensive Auth, Middleware & RBAC Security Survey Report

**Project**: K'anPro (Commercial/kanpro)  
**Date**: 2026-08-27  
**Author**: Auth & Middleware Explorer (`teamwork_preview_explorer_survey_2`)  
**Scope**: Authentication flow, session resolution, proxy/middleware routing, layout guards, staff lifecycle, orphan admin behavior, suspended account enforcement, impersonation cryptographic engine, UI synchronization, and 403 error UX.

---

## 1. Executive Summary & Critical Findings Matrix

This security investigation audited the complete authentication, session resolution, proxy/middleware, impersonation, and administrative UI lifecycle of K'anPro. The audit reveals that the current platform operates under a **flat "admin = root" paradigm** where granular RBAC fields (`sub_role`, `permissions`, and `status`) are largely informational and lack backend, middleware, and database-level enforcement.

| ID | Vulnerability / Architectural Gap | Affected Files & Lines | Severity | Impact |
|---|---|---|---|---|
| **GAP-01** | **Bypass of Suspended/Inactive Admin Status in Proxy & Layout** | `src/lib/supabase/proxy.ts:89-105`, `src/lib/auth/require-admin.ts:35-56`, `src/app/(dashboard)/dashboard/admin/layout.tsx:13` | **P0 (Critical)** | A suspended admin (`status = 'suspended'`) retains unrestricted access to `/dashboard/admin*` and all administrative pages. |
| **GAP-02** | **Orphan Admin Fallback to Super Admin & Full Privileges** | `src/app/(dashboard)/dashboard/admin/staff/actions.ts:63-74` | **P0 (Critical)** | An admin profile without a row in `admin_staff_members` automatically receives `sub_role = 'super_admin'`, all 6 permissions, and `status = 'active'`. |
| **GAP-03** | **Unrestricted Horizontal & Vertical Admin Escalation** | `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-328`, `src/app/(dashboard)/dashboard/admin/users/actions.ts:30-52` | **P0 (Critical)** | Any admin (e.g. `support`) can call `updateAdminStaffMember` to grant themselves `super_admin` with all permissions, or promote any user to admin via `updateUserRole`. |
| **GAP-04** | **Unprotected Staff Deletion & Last Super Admin Lockout** | `src/app/(dashboard)/dashboard/admin/staff/actions.ts:330-354`, `supabase/migrations/20260812000000_admin_staff_management.sql:28-35` | **P0 (Critical)** | An ordinary admin can delete or demote the last `super_admin` in the system, causing total executive lockout. |
| **GAP-05** | **Plaintext / Unsigned Impersonation Cookies & Admin Target Impersonation** | `src/lib/auth/impersonation.ts:56-96`, `src/modules/admin/components/users-data-table.tsx:371-385` | **P0 (Critical)** | Impersonation cookies are unsigned plaintext without HMAC-SHA256. Furthermore, admins can impersonate other admins or `super_admin`s (`targetProfile.role === 'admin'`). |
| **GAP-06** | **Missing Continuous Revalidation & Actor Revocation for Impersonation** | `src/lib/auth/impersonation.ts:119-161`, `src/components/providers/impersonation-provider.tsx:12-24` | **P1 (High)** | If an admin initiates impersonation and is subsequently suspended, the active impersonation session continues to operate for up to 2 hours without actor liveness checks. |
| **GAP-07** | **PostgreSQL RLS Permissiveness via Flat `public.is_admin()`** | `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:4-16, 82-86`, `supabase/migrations/20260814093811_harden_profile_privacy.sql:33-36` | **P0 (Critical)** | PostgreSQL RLS uses `public.is_admin()` which only checks `profiles.role = 'admin'`. Any admin (even `support` or `suspended`) can execute direct SDK mutations (`INSERT/UPDATE/DELETE`) on `admin_staff_members` and read candidate PII. |
| **GAP-08** | **PII Leakage in Candidate Verifications without `verify_documents`** | `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:393-397` | **P1 (High)** | `getCandidateVerifications` exposes CURP, RFC, and Cédula Profesional to any admin without checking `verify_documents` permission. |
| **GAP-09** | **Commercial Plan Bypass & Tenant Isolation Defect** | `src/modules/company/actions/settings.ts:74-133`, `src/modules/company/actions/employees.ts:9-93` | **P0 (Critical)** | `updateSubscriptionPlan` allows any authenticated user to assign `'enterprise'` plan for any `companyId` and inserts fake `'paid'` invoices without payment gateway verification or tenant ownership checks (`user.id === companyId`). |
| **GAP-10** | **UI Synchronization Gaps & Missing Permission-Based Navigation** | `src/modules/admin/components/app-sidebar.tsx:40-95`, `src/modules/admin/components/staff-data-table.tsx:494-502`, `src/modules/admin/components/users-data-table.tsx:721-778` | **P2 (Medium)** | The admin sidebar and action buttons unconditionally render direct links to Staff management, System Settings, User Role promotion, and Impersonation for all subroles. |

---

## 2. Authentication Flow & Session Resolution Deep-Dive

### 2.1 Route Entrypoint & Proxy Interception (`src/proxy.ts`)

Next.js 16 routes incoming HTTP traffic through `src/proxy.ts` (configured with standard path matchers excluding `_next/static`, `_next/image`, `favicon.ico`, and image assets):

```typescript
// src/proxy.ts:4-6
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}
```

### 2.2 Session Update & Role Determination (`src/lib/supabase/proxy.ts`)

`updateSession(request: NextRequest)` in `src/lib/supabase/proxy.ts` performs the following steps:
1. **User Authentication**: Calls `const { data: { user } } = await supabase.auth.getUser()`.
2. **Unauthenticated Redirects**: If `!user` and the route is protected (`/dashboard*`, `/account*`, `/candidate*`, `/company*`), redirects to `/login?redirectTo=<target>`.
3. **Database Profile Lookup**:
   ```typescript
   // src/lib/supabase/proxy.ts:89-93
   const { data: profile } = await supabase
     .from('profiles')
     .select('role')
     .eq('id', user.id)
     .maybeSingle()
   ```
4. **Role Computation**:
   ```typescript
   // src/lib/supabase/proxy.ts:96-105
   let role: UserRole = 'candidate'
   if (profile?.role) {
     role = profile.role as UserRole
   } else {
     const metaRole = user.user_metadata?.role
     if (metaRole === 'company') {
       role = 'company'
     }
   }
   ```
5. **Dashboard Routing & Boundary Check**:
   - Computes `roleDashboard`: `/dashboard/admin`, `/dashboard/company`, or `/dashboard/candidate`.
   - Protects `/dashboard/admin`: `if (pathname.startsWith('/dashboard/admin') && role !== 'admin') -> redirect(roleDashboard)`.
   - Protects `/dashboard/company`: `if (pathname.startsWith('/dashboard/company') && role !== 'company' && role !== 'admin') -> redirect(roleDashboard)`.
   - Protects `/dashboard/candidate`: `if (pathname.startsWith('/dashboard/candidate') && role !== 'candidate' && role !== 'admin') -> redirect(roleDashboard)`.

#### Critical Gaps Identified in Proxy:
- **No `admin_staff_members` Verification**: The proxy only checks `profiles.role === 'admin'`. It never verifies whether the admin has an active staff record.
- **Suspended Admin Bypass**: If an admin's account is suspended in `admin_staff_members.status = 'suspended'`, `proxy.ts` still observes `profiles.role === 'admin'` and allows full access to `/dashboard/admin*`.
- **Admins Can Browse Company/Candidate Dashboards Unrestricted**: Lines 152-169 explicitly allow any admin (`role === 'admin'`) to access `/dashboard/company/*` and `/dashboard/candidate/*` without entering an audited impersonation session.
- **Zero Impersonation Cookie Awareness**: `proxy.ts` does not check, validate, or sync impersonation state.

---

## 3. Layout Guards & Server-Side Helpers

### 3.1 Admin Layout Guard (`src/app/(dashboard)/dashboard/admin/layout.tsx`)

```typescript
// src/app/(dashboard)/dashboard/admin/layout.tsx:8-14
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  ...
}
```

### 3.2 `requireAdmin()` Implementation (`src/lib/auth/require-admin.ts`)

```typescript
// src/lib/auth/require-admin.ts:24-56
export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Strict enforcement: profile MUST exist in database and have role === 'admin'
  if (!profile || profile.role !== "admin") {
    const fallbackRole = profile?.role === "company" ? "company" : "candidate";
    redirect(
      fallbackRole === "company"
        ? "/dashboard/company"
        : "/dashboard/candidate/discovery"
    );
  }

  return {
    user,
    role: "admin",
    profile,
  };
}
```

#### Flaws Identified in Layout Guards:
1. `requireAdmin()` only validates `profiles.role === 'admin'`.
2. It returns `{ user, role: "admin", profile }` without returning `sub_role`, `permissions`, or `status`.
3. An admin marked as `status = 'suspended'` or `status = 'inactive'` passes `requireAdmin()` without error.
4. An orphan admin profile (no row in `admin_staff_members`) passes `requireAdmin()` without error.

---

## 4. Inlined Server Action Authorization & Staff Lifecycle

### 4.1 Inlined `requireAdminAuth()` Duplication

Every administrative Server Action file duplicates an inlined helper:
- `src/app/(dashboard)/dashboard/admin/staff/actions.ts:8-30`
- `src/app/(dashboard)/dashboard/admin/reports/actions.ts:11-33`
- `src/app/(dashboard)/dashboard/admin/support/actions.ts:16-38`
- `src/app/(dashboard)/dashboard/admin/users/actions.ts:6-28`
- `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:101-123`
- `src/app/(dashboard)/dashboard/admin/actions.ts:6-25`

```typescript
// Pattern duplicated in 6 action files:
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

### 4.2 Split-Brain / Unsafe Default Fallback in `getAdminStaffMembers`

In `src/app/(dashboard)/dashboard/admin/staff/actions.ts:55-85`:
```typescript
return (adminProfiles || []).map((p) => {
  const s = staffMap.get(p.id);
  return {
    id: s?.id || p.id,
    profileId: p.id,
    name: p.full_name || "Administrador K'anPro",
    email: p.email,
    whatsappNumber: p.whatsapp_number || "",
    subRole: (s?.sub_role as AdminSubRole) || "super_admin", // ⚠️ CRITICAL: Defaults orphan to super_admin!
    department: s?.department || "Dirección General",
    permissions: (s?.permissions as AdminPermissionKey[]) || [
      "manage_users",
      "manage_companies",
      "verify_documents",
      "manage_vacancies",
      "analytics_access",
      "system_settings",
    ], // ⚠️ CRITICAL: Defaults orphan to ALL permissions!
    status: (s?.status as AdminStaffStatus) || "active", // ⚠️ CRITICAL: Defaults orphan to active!
    notes: s?.notes || "Personal registrado",
    avatar: p.avatar_url || "",
    ...
  };
});
```
**Impact**: If any profile is set to `role = 'admin'` (or created via legacy DB scripts without an `admin_staff_members` row), the system treats them as an active `super_admin` with total administrative authority.

### 4.3 Privilege Escalation Vectors (Cases A–G Analysis)

1. **Case A: Low-level admin creates a `super_admin`**:
   - `createAdminStaffMember` in `staff/actions.ts:88` only calls `requireAdminAuth()`.
   - A `support` staff member can create a new user with `subRole: 'super_admin'` and all permissions.
2. **Case B: Low-level admin promotes themselves (Self-Escalation)**:
   - `updateAdminStaffMember` in `staff/actions.ts:252` only calls `requireAdminAuth()`.
   - A `support` staff member with `profileId = self.id` can invoke `updateAdminStaffMember(self.id, { subRole: 'super_admin', permissions: ALL_PERMISSIONS, status: 'active' })`.
3. **Case C: Low-level admin modifies another admin**:
   - No hierarchy comparison between `actor.subRole` and `target.subRole`. Any admin can edit any other admin.
4. **Case D: Low-level admin suspends or reactivates admins**:
   - `toggleAdminStaffStatus` in `staff/actions.ts:307` allows any admin to suspend or activate any other admin, including `super_admin`s.
5. **Case E: Deletion / Demotion of the Last Super Admin**:
   - `deleteAdminStaffMember` in `staff/actions.ts:330` only checks `user.id === profileId` (cannot delete self).
   - If there is only 1 `super_admin` (Admin A) and 1 `support` admin (Admin B), Admin B can call `deleteAdminStaffMember(Admin A.id)`. This deletes Admin A's staff record and demotes them to `candidate`, leaving 0 active super admins in the system.
6. **Case F: Arbitrary User Promotion to Admin via `users/actions.ts`**:
   - `updateUserRole(userId, "admin")` in `users/actions.ts:30` only requires `requireAdminAuth()`.
   - Any admin can convert any candidate or company into an `admin`.
7. **Case G: Direct SDK Mutation via RLS**:
   - `public.admin_staff_members` RLS policy: `USING (public.is_admin()) WITH CHECK (public.is_admin())`.
   - Since `public.is_admin()` returns `true` for all `profiles.role = 'admin'`, any admin can bypass Server Actions entirely and execute direct `supabase.from('admin_staff_members').update(...)` queries.

---

## 5. Impersonation Mechanism Forensic Audit (`src/lib/auth/impersonation.ts`)

### 5.1 Current Implementation State

The current impersonation system consists of:
- `src/lib/auth/impersonation.ts`
- `src/components/providers/impersonation-provider.tsx`
- `src/components/shared/impersonation-banner.tsx`
- Trigger buttons in `users-data-table.tsx:371`, `support-tools-drawer.tsx:278`, and `ticket-workbench.tsx:453`

### 5.2 Forensic Vulnerability Analysis

```typescript
// src/lib/auth/impersonation.ts:52-87
const cookieStore = await cookies();
const maxAge = 60 * 60 * 2; // 2 hours

cookieStore.set("kanpro_impersonate_user_id", targetProfile.id, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge,
});

cookieStore.set("kanpro_impersonate_user_name", targetProfile.full_name || "Usuario", {
  httpOnly: false,
  ...
});

cookieStore.set("kanpro_impersonate_user_email", targetProfile.email || "", {
  httpOnly: false,
  ...
});

cookieStore.set("kanpro_impersonate_user_role", targetProfile.role || "candidate", {
  httpOnly: false,
  ...
});
```

#### Critical Impersonation Deficiencies:
1. **No Cryptographic Signing (HMAC-SHA256)**: Cookies store raw plaintext IDs and names. There is zero cryptographic proof that the cookie was generated by the server.
2. **Admin-on-Admin Impersonation Permitted**:
   ```typescript
   // src/lib/auth/impersonation.ts:91-96
   const redirectUrl =
     targetProfile.role === "company"
       ? "/dashboard/company"
       : targetProfile.role === "admin"
       ? "/dashboard/admin" // ⚠️ Permitted!
       : "/dashboard/candidate";
   ```
   An admin can impersonate another admin or a `super_admin`, inherit their identity in the UI, and bypass session accountability.
3. **No Actor Binding in Cookie**: The cookie only stores `targetUserId`. It does not record `actorUserId`. When requests are processed, the system cannot verify which specific admin initiated the session.
4. **No Revalidation of Actor Status**: In `getImpersonationState()` (lines 119-161), the system checks if the current request user is an admin, but does not check if their `admin_staff_members.status === 'active'`. If an admin is suspended after starting an impersonation session, the impersonation session continues to work.
5. **No Nonce / Revocation Identifier**: Sessions cannot be revoked on-demand without deleting the cookie on the client side.

---

## 6. UI Synchronization & UX Audit

### 6.1 Admin App Sidebar (`src/modules/admin/components/app-sidebar.tsx`)

The sidebar hardcodes navigation items into static lists without filtering by the active user's permissions or subrole:
- `/dashboard/admin` (Dashboard Central)
- `/dashboard/admin/verifications` (Verificación de Expedientes) $\to$ requires `verify_documents`
- `/dashboard/admin/reports` (Moderación y Reportes) $\to$ requires `manage_vacancies` or `ops_admin`
- `/dashboard/admin/support` (Soporte Técnico & Tickets) $\to$ requires `manage_users` or `support`
- `/dashboard/admin/users` (Directorio de Usuarios) $\to$ requires `manage_users`
- `/dashboard/admin/staff` (Administradores & Staff) $\to$ requires `super_admin`
- `/dashboard/admin/settings` (Configuración del Sistema) $\to$ requires `system_settings` / `super_admin`

All items are displayed unconditionally to all admins. When a low-level admin clicks on an item, they either see UI for actions they should not have, or experience raw backend errors when submitting actions.

### 6.2 Data Tables & Modals
- `staff-data-table.tsx`: "Dar de Alta Personal", "Permisos", and "Dar de Baja Personal" buttons are visible to all users.
- `users-data-table.tsx`: "Cambiar Rol de Usuario" allows selecting "Administrador (Acceso Total al Panel)".
- `support-tools-drawer.tsx`: Direct credits adjustment and verification toggle buttons are visible to all admins.

### 6.3 403 / Unauthenticated UX
Currently, unauthorized actions throw generic JavaScript `Error("Acceso denegado...")`, which triggers toast notifications. There are no structured HTTP 403 Forbidden views, no dedicated access-denied error boundary (`error.tsx`), and no permission-aware disabled states for action buttons.

---

## 7. Recommended Defense-in-Depth Architecture

To remediate all identified vulnerabilities, the system must enforce RBAC across four continuous layers:

```
┌────────────────────────────────────────────────────────┐
│ Layer 4: UI & Navigation (UX only — never security)    │
│  - Permission-aware sidebar & button rendering         │
│  - Graceful 403 Forbidden boundaries                   │
├────────────────────────────────────────────────────────┤
│ Layer 3: Routing & Middleware                          │
│  - Next.js proxy.ts / layout guards                    │
│  - Active status validation & fail-closed redirects    │
├────────────────────────────────────────────────────────┤
│ Layer 2: Server Actions & Centralized Helpers          │
│  - requireAdminStaffAuth(requiredPermission)           │
│  - requireSuperAdminAuth()                             │
│  - Cryptographic HMAC-SHA256 Impersonation Engine      │
├────────────────────────────────────────────────────────┤
│ Layer 1: PostgreSQL RLS & Database Triggers            │
│  - public.is_active_admin(user_id)                     │
│  - public.is_super_admin(user_id)                      │
│  - public.has_admin_permission(perm_key, user_id)      │
│  - Trigger prevent_last_super_admin_removal()          │
│  - Trigger prevent_company_subscription_tampering()    │
└────────────────────────────────────────────────────────┘
```

### 7.1 Proposed Centralized RBAC Guard (`src/lib/auth/rbac-guards.ts`)

```typescript
export type AdminPermissionKey =
  | "manage_users"
  | "manage_companies"
  | "verify_documents"
  | "manage_vacancies"
  | "analytics_access"
  | "system_settings";

export type AdminSubRole =
  | "super_admin"
  | "ops_admin"
  | "content_admin"
  | "verification_admin"
  | "support";

export interface AuthenticatedAdminStaff {
  user: User;
  profile: { id: string; email: string; full_name: string; role: "admin" };
  staff: {
    id: string;
    subRole: AdminSubRole;
    department: string;
    permissions: AdminPermissionKey[];
    status: "active" | "inactive" | "suspended";
  };
}

/**
 * Validates active admin session, verifies status = 'active',
 * and checks required permission (with super_admin bypass).
 */
export async function requireAdminStaffAuth(
  requiredPermission?: AdminPermissionKey
): Promise<AuthenticatedAdminStaff>;

/**
 * Strictly requires sub_role = 'super_admin' and status = 'active'.
 */
export async function requireSuperAdminAuth(): Promise<AuthenticatedAdminStaff>;
```

### 7.2 Proposed Cryptographic Impersonation Token Model (`src/lib/auth/impersonation.ts`)

```typescript
export interface ImpersonationPayload {
  issuer: "kanpro_auth";
  actorId: string;
  actorSubRole: AdminSubRole;
  targetId: string;
  targetRole: "candidate" | "company";
  targetName: string;
  targetEmail: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
  purpose: "support_impersonation";
}

export interface ImpersonationToken {
  payload: ImpersonationPayload;
  signature: string; // HMAC-SHA256
}
```

#### Impersonation Validation Invariants:
1. `targetRole !== 'admin'` (Admin target strictly prohibited).
2. `actorId !== targetId` (Self-impersonation prohibited).
3. Cryptographic signature must match using server secret.
4. `expiresAt > Date.now()` (Maximum 2 hours TTL).
5. Actor user must be re-verified against PostgreSQL on every evaluation: `profiles.role = 'admin'` AND `admin_staff_members.status = 'active'`.
6. Impersonated session is restricted to read-only or logged audit trail; impersonator cannot execute administrative staff mutations.

---

## 8. Summary of Action Items for Implementation Phase

1. **PostgreSQL Migrations**:
   - Implement `is_active_admin`, `is_super_admin`, and `has_admin_permission`.
   - Attach trigger `prevent_last_super_admin_removal()`.
   - Update RLS policies on `admin_staff_members`, `candidate_private_profiles`, `company_profiles`, and `profile_documents`.
2. **Server-Side Guards**:
   - Create `src/lib/auth/rbac-guards.ts`.
   - Replace inlined `requireAdminAuth` across all 6 administrative action files.
   - Restrict `staff/actions.ts` exclusively to `requireSuperAdminAuth()`.
3. **Cryptographic Impersonation**:
   - Implement HMAC-SHA256 signing and verification in `src/lib/auth/impersonation.ts`.
   - Enforce actor liveness and prohibit admin targets.
4. **Proxy & Routing**:
   - Update `src/lib/supabase/proxy.ts` to check `admin_staff_members.status` and fail closed for suspended/orphan admins.
5. **UI & Navigation**:
   - Sync `app-sidebar.tsx` and data tables to render items conditionally based on calculated effective permissions.
   - Provide clean 403 Forbidden feedback.
