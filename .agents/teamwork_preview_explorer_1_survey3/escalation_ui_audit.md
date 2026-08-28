# K'anPro RBAC Security Audit: Admin UI Semantics & Privilege Escalation Analysis (Cases A–G)

**Target System**: K'anPro Platform Authorization Architecture  
**Auditor**: Explorer 3 (Escalation & UI Semantic Auditor)  
**Date**: 2026-08-27  
**Status**: Comprehensive Forensic Report (Read-Only Investigation)  
**Scope**: Admin UI Components, Frontend Navigation, Permission Semantics, Server Actions, PostgREST RLS Policies, and Escalation Vectors A through G.

---

## 1. Executive Summary

A forensic audit of the K'anPro administrative subsystem revealed a critical architectural disconnect between the frontend representation of role-based access control (RBAC) and backend/database authorization enforcement:

1. **The `permissions` Array is Pure UI Theater**: The granular permission flags (`manage_users`, `manage_companies`, `verify_documents`, `manage_vacancies`, `analytics_access`, `system_settings`) and `sub_role` values (`super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`) exist exclusively as informational display metadata. Not a single Server Action or API route verifies granular permissions or subroles prior to executing administrative mutations.
2. **Binary Backend & Database Guard**: All server-side guards (`requireAdmin()`, `requireAdminAuth()`, `is_admin()`) operate on a coarse binary check: `public.profiles.role === 'admin'`. Any authenticated user holding this base role possesses unconstrained operational authority over the entire platform.
3. **Pervasive Privilege Escalation (Cases A–G Vulnerable)**: Any low-level administrator (such as a junior `support` agent) can unilaterally promote themselves or others to `super_admin`, create new `super_admin` accounts with arbitrary credentials, strip privileges from superior administrators, deactivate or delete `super_admin` profiles, and execute raw mutations directly through the Supabase browser SDK due to permissive RLS policies.
4. **Dangerous Default Fallback in Split-Brain Model**: If an admin profile exists in `public.profiles` without a corresponding metadata record in `public.admin_staff_members`, the system automatically defaults their role to `super_admin` and grants all 6 granular permissions (`staff/actions.ts:63-72`).

---

## 2. Admin Frontend UI & Component Audit

### 2.1 Component & Route Hierarchy

| Route | Page / Component | Primary Server Action Imports | Authorization Check |
|---|---|---|---|
| `/dashboard/admin` | `app/(dashboard)/dashboard/admin/page.tsx` | `toggleProfileVerification` (`admin/actions.ts`) | `requireAdmin()` in `layout.tsx` |
| `/dashboard/admin/staff` | `app/(dashboard)/dashboard/admin/staff/page.tsx`, `StaffDataTable` (`modules/admin/components/staff-data-table.tsx`) | `getAdminStaffMembers`, `toggleAdminStaffStatus`, `deleteAdminStaffMember` (`staff/actions.ts`) | `requireAdmin()` in `layout.tsx` + `requireAdminAuth()` in action |
| `/dashboard/admin/staff/new` | `app/(dashboard)/dashboard/admin/staff/new/page.tsx`, `NewStaffFormClient` (`modules/admin/components/new-staff-form.tsx`) | `createAdminStaffMember` (`staff/actions.ts`) | `requireAdmin()` in `layout.tsx` + `requireAdminAuth()` in action |
| `/dashboard/admin/users` | `app/(dashboard)/dashboard/admin/users/page.tsx`, `UsersDataTable` (`modules/admin/components/users-data-table.tsx`) | `updateUserRole`, `toggleUserStatus`, `updateUserProfile` (`users/actions.ts`), `startImpersonating` (`lib/auth/impersonation.ts`) | `requireAdmin()` in `layout.tsx` + `requireAdminAuth()` in action |
| `/dashboard/admin/verifications` | `app/(dashboard)/dashboard/admin/verifications/page.tsx`, `VerificationWorkbenchClient` (`modules/admin/components/verification-workbench.tsx`) | `getCompanyVerifications`, `getCandidateVerifications`, `reviewCompanyVerification`, `reviewCandidateVerification`, `reviewProfileDocument` (`verifications/actions.ts`) | `requireAdmin()` in `layout.tsx` + `requireAdminAuth()` in action |
| `/dashboard/admin/reports` | `app/(dashboard)/dashboard/admin/reports/page.tsx`, `ReportsDataTable` (`modules/admin/components/reports-data-table.tsx`) | `getVacancyReports`, `quickDeactivateVacancy`, `banUserAccount`, `toggleCompanyVerification`, `resolveReport` (`reports/actions.ts`) | `requireAdmin()` in `layout.tsx` + `requireAdminAuth()` in action |
| `/dashboard/admin/support` | `app/(dashboard)/dashboard/admin/support/page.tsx`, `TicketWorkbenchClient` (`modules/admin/components/ticket-workbench.tsx`) | `getSupportTickets`, `createSupportTicket`, `addTicketMessage`, `updateTicketStatus`, `adjustCompanyCredits`, `sendDirectUserNotification` (`support/actions.ts`) | `requireAdmin()` in `layout.tsx` + `requireAdminAuth()` in action |
| `/dashboard/admin/settings` | `app/(dashboard)/dashboard/admin/settings/page.tsx`, `SettingsDialog` (`modules/admin/components/settings-dialog.tsx`) | None (Client-side mock state / toast notifications) | `requireAdmin()` in `layout.tsx` |

### 2.2 Navigation & Layout Inspection (`AppSidebar`)

**Source File**: `src/modules/admin/components/app-sidebar.tsx` (Lines 40–95)

```typescript
// All navigation sections are statically defined and rendered unconditionally
const sections = [
  {
    label: "General",
    items: [{ title: "Dashboard Central", url: "/dashboard/admin", icon: LayoutDashboard }],
  },
  {
    label: "Operaciones & Moderación",
    items: [
      { title: "Verificación de Expedientes", url: "/dashboard/admin/verifications", icon: BadgeCheck },
      { title: "Moderación y Reportes", url: "/dashboard/admin/reports", icon: ShieldAlert },
      { title: "Soporte Técnico & Tickets", url: "/dashboard/admin/support", icon: Headphones },
    ],
  },
  {
    label: "Comunidad & Accesos",
    items: [
      { title: "Directorio de Usuarios", url: "/dashboard/admin/users", icon: Users },
      { title: "Administradores & Staff", url: "/dashboard/admin/staff", icon: ShieldCheck },
    ],
  },
];
```

**Key Finding**: The sidebar contains **zero conditional rendering**. Every user who passes `requireAdmin()` (`profiles.role === 'admin'`) sees the complete navigation structure, including "Administradores & Staff", "Directorio de Usuarios", "Verificación de Expedientes", and "Moderación y Reportes".

---

## 3. Semantic Audit of the `permissions` Array & Subroles

### 3.1 Definition vs Functional Reality

In `src/modules/admin/types/staff.ts`:
- **Subroles Defined**: `super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`.
- **Permissions Defined**: `manage_users`, `manage_companies`, `verify_documents`, `manage_vacancies`, `analytics_access`, `system_settings`.
- **Role Defaults**: `SUB_ROLE_LABELS` maps default permission lists to each subrole.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE AUTHORIZATION GAP                                   │
├───────────────────────────────────────────┬─────────────────────────────────────────────┤
│ Frontend / UI Conception                  │ Backend & Database Reality                  │
├───────────────────────────────────────────┼─────────────────────────────────────────────┤
│ Subrole: support                          │ profiles.role === 'admin'                   │
│ Permissions: ['manage_users', 'verify_...']│ Subrole: IGNORED in Server Actions          │
│ Expectation: Can only view support/docs   │ Permissions: IGNORED in Server Actions      │
│ Restriction: Cannot create super_admins   │ Reality: Can execute ANY Server Action &    │
│ Restriction: Cannot modify system roles   │          can mutate ANY database table      │
└───────────────────────────────────────────┴─────────────────────────────────────────────┘
```

### 3.2 Discrepancy Matrix: UI Intent vs Backend Enforcement

| Operation | UI Permission Intent | Backend Guard in Code | Actual Backend Verification | Discrepancy Severity |
|---|---|---|---|---|
| **Create New Staff / Admin** | Implicitly `super_admin` | `staff/actions.ts:88` `requireAdminAuth()` | Only checks `profile.role === 'admin'` | **CRITICAL**: Any subrole can create staff |
| **Assign `super_admin` Subrole** | `super_admin` only | `staff/actions.ts:88, 252` `requireAdminAuth()` | Only checks `profile.role === 'admin'` | **CRITICAL**: Any subrole can grant `super_admin` |
| **Grant All Permissions** | `super_admin` only | `staff/actions.ts:88, 252` `requireAdminAuth()` | Only checks `profile.role === 'admin'` | **CRITICAL**: Any subrole can grant all permissions |
| **Demote / Delete Admin** | `super_admin` only | `staff/actions.ts:330` `requireAdminAuth()` | Checks `user.id !== profileId`, ignores subrole | **CRITICAL**: `support` can delete `super_admin` |
| **Promote User to Admin** | `super_admin` / `manage_users` | `users/actions.ts:30` `requireAdminAuth()` | Only checks `profile.role === 'admin'` | **CRITICAL**: Any subrole can promote any user |
| **Ban User Account** | `manage_users` | `reports/actions.ts:135` `requireAdminAuth()` | Only checks `profile.role === 'admin'` | **HIGH**: Any subrole can ban users/companies |
| **Adjust Company Credits** | `manage_companies` | `support/actions.ts:460` `requireAdminAuth()` | Only checks `profile.role === 'admin'` | **HIGH**: Any subrole can grant credits |
| **Approve Fiscal Expediente** | `verify_documents` | `verifications/actions.ts:467` `requireAdminAuth()` | Only checks `profile.role === 'admin'` | **MEDIUM**: Any subrole can approve legal docs |
| **Deactivate Vacancy** | `manage_vacancies` | `reports/actions.ts:104` `requireAdminAuth()` | Only checks `profile.role === 'admin'` | **MEDIUM**: Any subrole can deactivate vacancies |
| **Impersonate Account** | `manage_users` / `super_admin` | `lib/auth/impersonation.ts:18` | Only checks `profile.role === 'admin'` | **CRITICAL**: Any subrole can impersonate anyone |

---

## 4. Deep Forensic Analysis of Escalation Scenarios (Cases A to G)

### Case A: An `admin` creating a new `super_admin` staff member

- **Technical Vector**: Server Action `createAdminStaffMember` in `src/app/(dashboard)/dashboard/admin/staff/actions.ts:88-250`, triggered via `NewStaffFormClient` (`src/modules/admin/components/new-staff-form.tsx`) or `CreateStaffModal` (`src/modules/admin/components/staff-modal.tsx`).
- **Code Execution Trace**:
  1. `createAdminStaffMember(formData)` is invoked at `staff/actions.ts:88`.
  2. Guard check at `staff/actions.ts:98`: `await requireAdminAuth()`.
  3. `requireAdminAuth()` (`staff/actions.ts:8-30`) queries `public.profiles` for `user.id` and verifies `profile.role === 'admin'`. It does **not** check `admin_staff_members.sub_role`.
  4. System initializes privileged service-role client: `const supabaseAdmin = createAdminClient()` (`staff/actions.ts:109`).
  5. User is created in Supabase Auth via `supabaseAdmin.auth.admin.createUser({ email, password, ... })` (`staff/actions.ts:181`).
  6. Profile is elevated via `supabaseAdmin.from("profiles").upsert({ id: targetProfileId, role: "admin", ... })` (`staff/actions.ts:201-213`).
  7. Metadata is persisted via `supabaseAdmin.from("admin_staff_members").upsert({ profile_id: targetProfileId, sub_role: formData.subRole, permissions: formData.permissions, ... })` (`staff/actions.ts:221-235`).
- **Pre-conditions**: Caller has active session with `public.profiles.role = 'admin'` (e.g. subrole `support` or `content_admin`).
- **Attack Payload**:
  ```typescript
  await createAdminStaffMember({
    name: "Rogue Super Admin",
    email: "rogue-super@kanpro.com",
    password: "AttackerPassword123!",
    whatsappNumber: "+529990001122",
    subRole: "super_admin",
    department: "Dirección General",
    permissions: [
      "manage_users", "manage_companies", "verify_documents",
      "manage_vacancies", "analytics_access", "system_settings"
    ],
    notes: "Unauthorized super_admin creation"
  });
  ```
- **Outcome**: A brand new user account is provisioned in Supabase Auth, assigned `profiles.role = 'admin'`, and recorded in `admin_staff_members` with `sub_role = 'super_admin'` and all permissions.
- **Defense Status**: **VULNERABLE (Critical / P0)**. There is zero validation that the creator possesses `super_admin` privileges.

---

### Case B: An `admin` promoting an existing staff member (or themselves) to `super_admin`

- **Technical Vector**: Server Action `updateAdminStaffMember` in `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305` and `updateUserRole` in `src/app/(dashboard)/dashboard/admin/users/actions.ts:30-52`.
- **Code Execution Trace**:
  1. `updateAdminStaffMember(profileId, formData)` is called at `staff/actions.ts:252`.
  2. Guard `requireAdminAuth()` (`staff/actions.ts:265`) only validates `profile.role === 'admin'`.
  3. `supabaseAdmin.from("admin_staff_members").upsert({ profile_id: profileId, sub_role: formData.subRole, permissions: formData.permissions, ... })` (`staff/actions.ts:285-298`) updates the database with `sub_role: 'super_admin'` using the service-role client.
- **Pre-conditions**: Caller has `public.profiles.role = 'admin'`. Target user exists.
- **Attack Payload**:
  ```typescript
  await updateAdminStaffMember("00000000-0000-0000-0000-000000000000", {
    name: "Promoted Staff",
    email: "staff@kanpro.com",
    whatsappNumber: "+529991234567",
    subRole: "super_admin",
    department: "Dirección General",
    permissions: [
      "manage_users", "manage_companies", "verify_documents",
      "manage_vacancies", "analytics_access", "system_settings"
    ],
    status: "active"
  });
  ```
- **Outcome**: An existing staff member with restricted subrole (`support`) is elevated to `super_admin` with full system access.
- **Defense Status**: **VULNERABLE (Critical / P0)**. No hierarchical promotion restriction exists.

---

### Case C: An `admin` modifying permissions or `sub_role` of another administrator

- **Technical Vector**: Server Action `updateAdminStaffMember` in `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305` and UI component `EditStaffModal` in `src/modules/admin/components/staff-modal.tsx:408-785`.
- **Code Execution Trace**:
  1. `updateAdminStaffMember(targetAdminId, formData)` is called.
  2. `requireAdminAuth()` executes and passes for any admin caller.
  3. The action executes `supabaseAdmin.from("admin_staff_members").upsert(...)` against `targetAdminId`.
  4. There is no comparison between the caller's hierarchical level and the target's hierarchical level.
- **Pre-conditions**: Caller is an admin (e.g. `sub_role: 'support'`); target is a peer admin or a superior (`super_admin`).
- **Attack Payload**:
  ```typescript
  // Support agent strips permissions from the Chief Technology Officer / Super Admin
  await updateAdminStaffMember(victimSuperAdminProfileId, {
    name: "Target Super Admin",
    email: "cto@kanpro.com",
    whatsappNumber: "+529991112233",
    subRole: "support", // Downgrade subrole
    department: "Atención al Usuario",
    permissions: [], // Strip all permissions
    status: "inactive", // Deactivate account
    notes: "Unauthorized administrative sabotage"
  });
  ```
- **Outcome**: A subordinate admin successfully alters, downgrades, or locks out a superior `super_admin`.
- **Defense Status**: **VULNERABLE (Critical / P0)**. Complete lack of rank/hierarchy enforcement.

---

### Case D: An `admin` modifying their own permissions or `sub_role` (self-escalation)

- **Technical Vector**: Server Action `updateAdminStaffMember` in `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305`.
- **Code Execution Trace**:
  1. In `staff/actions.ts:252`, `updateAdminStaffMember(profileId, formData)` accepts any `profileId`.
  2. Unlike `deleteAdminStaffMember` (which contains `if (user.id === profileId) throw ...`), `updateAdminStaffMember` contains **no check** preventing self-modification.
  3. An admin caller passes their own `user.id` as `profileId` with `subRole: 'super_admin'` and all permissions.
  4. `supabaseAdmin.from("admin_staff_members").upsert(...)` executes and updates the caller's record.
- **Pre-conditions**: Caller is a low-privilege admin (`sub_role: 'support'`).
- **Attack Payload**:
  ```typescript
  const { data: { user } } = await supabase.auth.getUser();
  await updateAdminStaffMember(user.id, {
    name: "Self-Escalating Agent",
    email: user.email,
    whatsappNumber: "+529991234567",
    subRole: "super_admin",
    department: "Dirección General",
    permissions: [
      "manage_users", "manage_companies", "verify_documents",
      "manage_vacancies", "analytics_access", "system_settings"
    ],
    status: "active"
  });
  ```
- **Outcome**: Immediate self-escalation from `support` to `super_admin`.
- **Defense Status**: **VULNERABLE (Critical / P0)**.

---

### Case E: An `admin` deleting or deactivating a `super_admin`

- **Technical Vector**:
  1. `deleteAdminStaffMember(profileId)` in `src/app/(dashboard)/dashboard/admin/staff/actions.ts:330-354`.
  2. `toggleAdminStaffStatus(profileId, 'suspended')` in `src/app/(dashboard)/dashboard/admin/staff/actions.ts:307-328`.
  3. `updateUserRole(userId, 'candidate')` in `src/app/(dashboard)/dashboard/admin/users/actions.ts:30-52`.
- **Code Execution Trace**:
  1. In `deleteAdminStaffMember`:
     ```typescript
     // staff/actions.ts:331-348
     const { user } = await requireAdminAuth();
     if (user.id === profileId) {
       throw new Error("No puede dar de baja su propio usuario administrador.");
     }
     const supabaseAdmin = createAdminClient();
     await supabaseAdmin.from("admin_staff_members").delete().eq("profile_id", profileId);
     await supabaseAdmin.from("profiles").update({ role: "candidate" }).eq("id", profileId);
     ```
  2. The code only checks that the caller is not deleting *themselves* (`user.id === profileId`).
  3. It does **not** check whether `profileId` belongs to a `super_admin` or whether the caller has the authority to delete administrators.
- **Pre-conditions**: Caller is an admin with `user.id != targetSuperAdminProfileId`.
- **Attack Payload**:
  ```typescript
  await deleteAdminStaffMember(targetSuperAdminProfileId);
  ```
- **Outcome**: The `super_admin` is purged from `admin_staff_members` and their profile in `public.profiles` is demoted to `role = 'candidate'`, completely revoking their administrative access.
- **Defense Status**: **VULNERABLE (Critical / P0)**.

---

### Case F: Direct manipulation via Supabase browser client SDK (bypassing Server Actions)

- **Technical Vector**: Direct client-side calls using `@supabase/supabase-js` from the browser console, communicating directly with PostgREST using the anon key and user JWT session token.
- **Code Execution Trace & RLS Policy Analysis**:
  1. Inspect Migration `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql`:
     - Lines 41–45:
       ```sql
       CREATE POLICY "Admins manage all profiles"
         ON public.profiles FOR ALL TO authenticated
         USING (public.is_admin())
         WITH CHECK (public.is_admin());
       ```
     - Lines 82–86:
       ```sql
       CREATE POLICY "Admins can manage admin staff members"
         ON public.admin_staff_members FOR ALL TO authenticated
         USING (public.is_admin())
         WITH CHECK (public.is_admin());
       ```
  2. Inspect Helper Function `public.is_admin()` (`20260815033000_...sql:4-16`):
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
  3. Under PostgreSQL RLS evaluation:
     - `is_admin()` evaluates to `TRUE` for **any** user whose `profiles.role = 'admin'`.
     - The policy grants `FOR ALL` (SELECT, INSERT, UPDATE, DELETE) with `USING (public.is_admin())` and `WITH CHECK (public.is_admin())`.
     - PostgreSQL RLS enforces **no restrictions** based on `sub_role`, `permissions`, `auth.uid() = profile_id`, or target row attributes.
- **Pre-conditions**: Authenticated user session with `profiles.role = 'admin'`.
- **Attack Payload (Browser Console)**:
  ```javascript
  // 1. Direct self-escalation in admin_staff_members
  await supabase
    .from('admin_staff_members')
    .update({
      sub_role: 'super_admin',
      permissions: ['manage_users', 'manage_companies', 'verify_documents', 'manage_vacancies', 'analytics_access', 'system_settings']
    })
    .eq('profile_id', supabase.auth.user().id);

  // 2. Direct promotion of external user in public.profiles
  await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', targetCandidateUserId);

  // 3. Direct deletion of super_admin profile
  await supabase
    .from('profiles')
    .delete()
    .eq('id', victimSuperAdminId);
  ```
- **Outcome**: The database allows all updates, insertions, and deletions unconditionally because `is_admin()` is satisfied.
- **Defense Status**: **VULNERABLE (Critical / P0)**. Server Action hardening alone is insufficient without corresponding RLS policy restructuring.

---

### Case G: Cross-tenant / orphan / state desynchronization escalation vectors

- **Technical Vector**: Schema dual-table divergence between `public.profiles` (`role`) and `public.admin_staff_members` (`sub_role`, `permissions`), coupled with unsafe default fallback logic in query actions.
- **Forensic Evidence & Code Execution Trace**:
  1. **Dual-Table Divergence (Split-Brain)**:
     - Authentication and authorization guards (`requireAdmin`, `is_admin`) check only `profiles.role = 'admin'`.
     - Staff metadata (`sub_role`, `permissions`) lives in `admin_staff_members`.
     - There is no foreign key trigger or database constraint ensuring consistency between the two tables.
  2. **The Unsafe Default Fallback Vector**:
     - In `src/app/(dashboard)/dashboard/admin/staff/actions.ts:55-85`:
       ```typescript
       // staff/actions.ts:55-73
       return (adminProfiles || []).map((p) => {
         const s = staffMap.get(p.id);
         return {
           id: s?.id || p.id,
           profileId: p.id,
           name: p.full_name || "Administrador K'anPro",
           email: p.email,
           whatsappNumber: p.whatsapp_number || "",
           subRole: (s?.sub_role as AdminSubRole) || "super_admin", // ⚠️ CRITICAL FALLBACK
           department: s?.department || "Dirección General",
           permissions: (s?.permissions as AdminPermissionKey[]) || [ // ⚠️ CRITICAL FALLBACK
             "manage_users",
             "manage_companies",
             "verify_documents",
             "manage_vacancies",
             "analytics_access",
             "system_settings",
           ],
           status: (s?.status as AdminStaffStatus) || "active",
           // ...
         };
       });
       ```
     - If an administrator profile is created or promoted in `public.profiles` (via SQL migration, manual DBA insert, or `updateUserRole`) without an entry in `admin_staff_members`, the system **automatically falls back to `subRole = 'super_admin'` and grants ALL 6 permissions**.
  3. **Desynchronized Demotion Vector**:
     - If `updateUserRole(userId, 'candidate')` is executed in `users/actions.ts:30-52`, `profiles.role` becomes `'candidate'`, but their record in `admin_staff_members` is **retained**.
     - If that user is later promoted back to `admin`, they automatically re-inherit their previous staff metadata, potentially bypassing new onboarding constraints.
- **Pre-conditions**: Database state where a user has `profiles.role = 'admin'` but no row in `admin_staff_members`, or vice versa.
- **Outcome**: Ghost admin profiles are granted `super_admin` and total permissions by default; orphaned staff records cause persistent privilege retention.
- **Defense Status**: **VULNERABLE (High / P1)**.

---

## 5. Summary Findings & Risk Classification

| Finding ID | Risk Level | Component / Area | Description |
|---|---|---|---|
| **F-01** | **P0 Critical** | Server Actions / Staff | Any admin can create a new `super_admin` via `createAdminStaffMember` (Case A). |
| **F-02** | **P0 Critical** | Server Actions / Staff | Any admin can promote staff/themselves to `super_admin` via `updateAdminStaffMember` (Cases B & D). |
| **F-03** | **P0 Critical** | Server Actions / Staff | Any admin can alter permissions or subrole of superior admins via `updateAdminStaffMember` (Case C). |
| **F-04** | **P0 Critical** | Server Actions / Staff | Any admin can delete/demote a `super_admin` via `deleteAdminStaffMember` (Case E). |
| **F-05** | **P0 Critical** | Database / RLS Policies | `is_admin()` enables full CRUD on `profiles` and `admin_staff_members` via browser SDK (Case F). |
| **F-06** | **P0 Critical** | Authorization Core | `requireAdmin()` and `requireAdminAuth()` lack subrole and granular permission checks. |
| **F-07** | **P1 High** | Server Actions / Staff | `getAdminStaffMembers` defaults orphan admins to `super_admin` with all permissions (Case G). |
| **F-08** | **P1 High** | Server Actions / Users | `updateUserRole` promotes any user to `admin` without `super_admin` authorization. |
| **F-09** | **P1 High** | Impersonation Service | `startImpersonating` allows any admin subrole to impersonate arbitrary candidates, companies, or admins. |
| **F-10** | **P2 Medium** | Frontend Navigation | `AppSidebar` displays all administrative modules unconditionally to all subroles. |

---

## 6. Recommendations for Architecture & Remediation

1. **Unified Hierarchical Guard**: Implement `requireSuperAdmin()` and `requirePermission(permKey)` helpers in `src/lib/auth/require-admin.ts` that query both `profiles` and `admin_staff_members`.
2. **Strict Server Action Gating**:
   - `createAdminStaffMember`, `updateAdminStaffMember`, `deleteAdminStaffMember`, and `updateUserRole` must be strictly restricted to `super_admin`.
   - Actions modifying other modules (verifications, reports, support, credit adjustments) must enforce their corresponding `permissions` flag.
3. **Database RLS Hardening**:
   - Restrict `public.admin_staff_members` and `public.profiles` updates/deletes to users where `public.is_super_admin()` evaluates to `TRUE`.
   - Prevent self-updates to `sub_role` and `permissions` columns via SQL `BEFORE UPDATE` trigger or strict RLS `WITH CHECK` clauses.
4. **Eliminate Unsafe Default Fallbacks**:
   - In `getAdminStaffMembers()`, if no `admin_staff_members` record exists, default to `subRole: 'ops_admin'` or require explicit profile assignment rather than granting `super_admin` and all permissions.
5. **Database Integrity Constraints**:
   - Add database triggers to keep `profiles.role` and `admin_staff_members` in sync (e.g. deleting `admin_staff_members` on role downgrade).
