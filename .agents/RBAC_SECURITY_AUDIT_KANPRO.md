# Master Technical Report: Comprehensive RBAC Security Audit & Authorization Architecture

**Platform**: K'anPro Platform (`kanpro`)  
**Document Classification**: Enterprise Security Architecture & Forensic Audit  
**Author**: RBAC Architecture & Security Report Specialist  
**Target Repository**: `/Users/brianpech/Developer/Commercial/kanpro`  
**Date**: August 27, 2026  
**Status**: Formal Master Deliverable — Zero Production Code Modified (Phase 0 Audit & Blueprint)  

---

## 1. Executive Summary

### 1.1 Context and Scope
K'anPro is a modern talent and recruitment marketplace built on **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security, Storage)**. The platform provides specialized portals for Candidates, Companies, and Platform Administrators.

This master audit provides a forensic evaluation of the platform's authentication and authorization architecture, covering **100% of Server Actions (52 operations)**, all **19 database migrations and 16 tables**, **3 Storage buckets**, **client and server guards**, **frontend navigation components**, and **role escalation attack surfaces**.

### 1.2 Core Audit Conclusions & Security Posture
1. **Critical Authorization Decoupling (The "UI Facade")**:
   The administrative dashboard presents a 5-tier subrole hierarchy (`super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`) and a 6-permission capability matrix (`manage_users`, `manage_companies`, `verify_documents`, `manage_vacancies`, `analytics_access`, `system_settings`). However, **0% of Server Actions and 0% of PostgreSQL RLS policies enforce `sub_role` or `permissions`**. Authorization throughout the entire platform is strictly binary: `public.profiles.role = 'admin'` grants unconstrained, root-level administrative authority.
2. **Pervasive Vertical and Horizontal Privilege Escalation (Cases A–G)**:
   Any user possessing the base `admin` role (e.g., a junior customer support agent with an empty permissions array) can:
   - Create new `super_admin` accounts with arbitrary credentials (`staff/actions.ts:createAdminStaffMember`).
   - Elevate their own account or peer accounts to `super_admin` and grant all permissions (`staff/actions.ts:updateAdminStaffMember`).
   - Unilaterally demote or delete executive `super_admin` profiles, causing a hostile lockout (`staff/actions.ts:deleteAdminStaffMember`).
   - Bypass Server Actions entirely to mutate `admin_staff_members` and `profiles` directly via the browser client SDK, because PostgreSQL RLS checks only `is_admin()`.
3. **Split-Brain State Inconsistency & Auto-Escalation**:
   The database maintains identity in `public.profiles` (`role`) and staff metadata in `public.admin_staff_members` (`sub_role`, `permissions`, `status`). When an administrator is created or promoted without an `admin_staff_members` entry, `getAdminStaffMembers()` automatically synthesizes an active `super_admin` record with all 6 permissions, silently auto-escalating uninitialized accounts.
4. **Ineffective Staff Deactivation**:
   Toggling an administrator's status to `'inactive'` or `'suspended'` updates only `admin_staff_members.status`. Because `profiles.role` remains `'admin'`, the suspended user retains full access to all Server Actions and all RLS-protected database tables.
5. **Commercial Subscription Bypass**:
   The `updateSubscriptionPlan` Server Action allows any company user to self-assign the "Enterprise" tier and generate fake "paid" invoices without payment gateway verification.
6. **Overall Risk Verdict**:
   The system currently exhibits a **High-Risk Vulnerability Profile** in administrative access controls. Remediation requires implementing a **Defense-in-Depth Hybrid RBAC Architecture (Option B)** across Database Enums/RLS, Server Helpers, Server Actions, and UI components.

---

## 2. Current Authorization Architecture

### 2.1 Layered Authorization Breakdown
The platform implements a 5-layer authorization topology:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              1. NETWORK & ROUTE MIDDLEWARE                             │
│  src/lib/supabase/proxy.ts -> updateSession()                                          │
│  - Refreshes Supabase Auth session cookies.                                            │
│  - Checks profiles.role. Blocks non-admins from /dashboard/admin*.                     │
│  - Does NOT inspect sub_role, permissions, or admin_staff_members.status.              │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          2. SERVER COMPONENT LAYOUT GUARD                              │
│  src/lib/auth/require-admin.ts -> requireAdmin()                                       │
│  - Invoked in src/app/(dashboard)/dashboard/admin/layout.tsx.                          │
│  - Queries profiles table: SELECT * FROM profiles WHERE id = user.id.                  │
│  - Verifies profile.role === 'admin'.                                                  │
│  - Does NOT query admin_staff_members (blind to sub_role, permissions, status).        │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          3. SERVER ACTION INLINED GUARDS                               │
│  requireAdminAuth() duplicated across 5 action files                                   │
│  - Verifies auth.getUser() and SELECT role FROM profiles WHERE id = user.id.           │
│  - If profile.role !== 'admin', throws Error("Acceso denegado").                       │
│  - Zero validation of sub_role, permissions, or status.                                │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        │                                   │
                        ▼                                   ▼
┌───────────────────────────────────────────────┐ ┌──────────────────────────────────────┐
│        4A. SERVICE ROLE ACCESS                │ │        4B. USER CONTEXT ACCESS       │
│  src/lib/supabase/admin.ts                    │ │  src/lib/supabase/server.ts          │
│  - createAdminClient() (Service Role Key)     │ │  - createClient() (User Session JWT) │
│  - Bypasses 100% of PostgreSQL RLS.           │ │  - Evaluated against PostgreSQL RLS. │
│  - Used in staff/actions.ts for all CRUD.     │ │  - Used in users, reports, support.  │
└───────────────────────┬───────────────────────┘ └──────────────────┬───────────────────┘
                        │                                            │
                        └─────────────────┬──────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          5. DATABASE ROW LEVEL SECURITY (RLS)                          │
│  public.is_admin() -> SELECT EXISTS(SELECT 1 FROM profiles WHERE role = 'admin')       │
│  - 10 Admin RLS policies evaluate USING (public.is_admin()).                           │
│  - ZERO RLS policies inspect public.admin_staff_members.                               │
│  - Full table CRUD permitted via direct browser SDK if profiles.role = 'admin'.        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 End-to-End Request Flow Traces

#### Trace 1: Staff Creation / Elevation via Server Action (Service Role Bypass)
```
[Admin Browser (Role: Support)]
       │
       ▼ (1) Calls createAdminStaffMember({ subRole: 'super_admin', permissions: ALL })
[Next.js Server Action: staff/actions.ts]
       │
       ├─► (2) Calls inlined requireAdminAuth()
       │        └─► Supabase Auth: Valid JWT token for caller
       │        └─► Database Query: SELECT role FROM profiles WHERE id = caller.id
       │        └─► Result: role = 'admin' (Check PASSES)
       │
       ├─► (3) Initializes createAdminClient() [SERVICE_ROLE_KEY]
       │
       ├─► (4) Executes supabaseAdmin.auth.admin.createUser()
       │        └─► User provisioned in auth.users
       │
       ├─► (5) Executes supabaseAdmin.from('profiles').upsert({ role: 'admin' })
       │        └─► RLS BYPASSED. Profile updated to admin.
       │
       └─► (6) Executes supabaseAdmin.from('admin_staff_members').upsert({ sub_role: 'super_admin' })
                └─► RLS BYPASSED. Target account becomes full Super Admin.
```

#### Trace 2: Direct PostgREST Request via Browser Client SDK (RLS Bypass)
```
[Admin Browser (Role: Support)]
       │
       ▼ (1) Executes: supabase.from('admin_staff_members').update({ sub_role: 'super_admin' }).eq('profile_id', myId)
[PostgREST Endpoint: /rest/v1/admin_staff_members]
       │
       ├─► (2) Authenticates JWT token -> auth.uid() = caller.id
       │
       ├─► (3) Evaluates PostgreSQL Policy: "Admins can manage admin staff members"
       │        └─► Policy: USING (public.is_admin()) WITH CHECK (public.is_admin())
       │        └─► Function public.is_admin() executes:
       │              SELECT EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
       │        └─► Result: TRUE
       │
       └─► (4) PostgreSQL executes UPDATE unconditionally.
                └─► Result: 200 OK. Caller self-escalated to Super Admin without touching Server Actions.
```

---

## 3. Roles and Subroles

### 3.1 Taxonomy Comparison: Real Code vs Schema vs UI
The platform exhibits a split taxonomy across database schemas, TypeScript interfaces, and user interfaces:

| Dimension | `public.profiles.role` | `public.admin_staff_members.sub_role` | `admin_staff_members.permissions` | `admin_staff_members.status` |
|---|---|---|---|---|
| **Storage Location** | `public.profiles` | `public.admin_staff_members` | `public.admin_staff_members` | `public.admin_staff_members` |
| **Database Type** | `ENUM ('candidate', 'company', 'admin')` | `TEXT` (Default: `'ops_admin'`) | `TEXT[]` (Default: `'{}'`) | `TEXT` (Default: `'active'`) |
| **Check Constraints** | None (Enum bounded) | None (Any string accepted) | None (Any array accepted) | None (Any string accepted) |
| **UI Representations** | Main Portal Router | Badges: Super Admin, Ops, Content, Verification, Support | Checkboxes: 6 permission keys | Status Pills: Activo, Inactivo, Suspendido |
| **Enforced in Server Actions?** | **YES** (`role === 'admin'`) | ❌ **NO** (0% checked) | ❌ **NO** (0% checked) | ❌ **NO** (0% checked) |
| **Enforced in PostgreSQL RLS?** | **YES** (`is_admin()`) | ❌ **NO** (0% checked) | ❌ **NO** (0% checked) | ❌ **NO** (0% checked) |
| **Real System Authority** | **100% (Total Root Authority)** | **0% (Pure Decorative Metadata)** | **0% (Pure Decorative Metadata)** | **0% (Pure Decorative Metadata)** |

### 3.2 Subrole Catalog & Defined Responsibilities in UI
Defined in `src/modules/admin/types/staff.ts` (lines 14–48):

```typescript
export type AdminSubRole =
  | "super_admin"
  | "ops_admin"
  | "content_admin"
  | "verification_admin"
  | "support";

export type AdminPermissionKey =
  | "manage_users"
  | "manage_companies"
  | "verify_documents"
  | "manage_vacancies"
  | "analytics_access"
  | "system_settings";
```

1. **`super_admin` (Dirección General)**:
   - *Intended Scope*: Full platform control, administrative staff management, billing, system configuration.
   - *Assigned Defaults in UI*: All 6 permissions.
2. **`ops_admin` (Operaciones)**:
   - *Intended Scope*: Company verification, vacancy approval, user status moderation.
   - *Assigned Defaults in UI*: `manage_users`, `manage_companies`, `manage_vacancies`, `analytics_access`.
3. **`content_admin` (Contenido & Vacantes)**:
   - *Intended Scope*: Job vacancy moderation, category curation, report resolution.
   - *Assigned Defaults in UI*: `manage_vacancies`, `manage_companies`.
4. **`verification_admin` (Verificación & Cumplimiento)**:
   - *Intended Scope*: Identity validation (CURP, RFC, Cédula), document review, company legal documents.
   - *Assigned Defaults in UI*: `verify_documents`, `manage_users`, `manage_companies`.
5. **`support` (Mesa de Ayuda)**:
   - *Intended Scope*: Ticket management, user communication, dispute assistance.
   - *Assigned Defaults in UI*: `manage_users`.

### 3.3 Status Flags Analysis
In `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (lines 307–328):
```typescript
export async function toggleAdminStaffStatus(
  profileId: string,
  status: AdminStaffStatus
): Promise<{ success: boolean; error?: string }> {
  await requireAdminAuth();
  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("admin_staff_members")
    .update({ status })
    .eq("profile_id", profileId);
  return { success: true };
}
```
**Critical Vulnerability**: Setting `status: "suspended"` or `"inactive"` modifies only the `admin_staff_members` table. `profiles.role` remains `'admin'`.
- `proxy.ts:updateSession()` allows the user to access `/dashboard/admin/*`.
- `requireAdmin()` in `layout.tsx` allows the layout to render.
- `requireAdminAuth()` in all Server Actions passes.
- `public.is_admin()` in RLS returns `true`.
- **Outcome**: A suspended administrator retains 100% read and write capability across the system.

### 3.4 Inconsistent and Split-Brain States
1. **Orphan Admin Profiles (State 1)**: `profiles.role = 'admin'` with NO `admin_staff_members` entry.
   - *Cause*: Created via `users/actions.ts:updateUserRole(userId, 'admin')` or raw database insertion.
   - *Exploit / Failure*: When queried by `staff/actions.ts:getAdminStaffMembers` (lines 63–74), the missing staff record triggers the default fallback:
     ```typescript
     subRole: (s?.sub_role as AdminSubRole) || "super_admin",
     department: s?.department || "Dirección General",
     permissions: (s?.permissions as AdminPermissionKey[]) || [
       "manage_users", "manage_companies", "verify_documents",
       "manage_vacancies", "analytics_access", "system_settings"
     ],
     status: (s?.status as AdminStaffStatus) || "active"
     ```
   - **Impact**: Any orphaned admin profile is automatically synthesized as an active Super Admin with all permissions in the administrative UI.
2. **Zombie Staff Metadata (State 2)**: `admin_staff_members` entry exists with `profiles.role != 'admin'`.
   - *Cause*: User demoted via `users/actions.ts:updateUserRole(adminId, 'candidate')` without deleting the staff record.
   - *Impact*: Inactive in RLS/Actions, but creates a unique constraint conflict on `profile_id` if re-promoted, preserving stale permissions.

---

## 4. Privilege Inventory

Exhaustive inventory of all **52 Server Actions, route handlers, and administrative operations** across the K'anPro codebase.

| ID | File Path | Function / Operation Name | Current Auth Guard | Database Client | Granular Check? | Tables Touched & RLS Impact | Risk Level |
|---|---|---|---|---|:---:|---|:---:|
| **SA-01** | `admin/staff/actions.ts` | `getAdminStaffMembers` | Inlined `requireAdminAuth()` | `supabaseAdmin` (Service Role) | ❌ None | `profiles`, `admin_staff_members` | **P2 Medium** |
| **SA-02** | `admin/staff/actions.ts` | `createAdminStaffMember` | Inlined `requireAdminAuth()` | `supabaseAdmin` (Service Role) | ❌ None | `auth.users`, `profiles`, `admin_staff_members` | **P0 Critical** |
| **SA-03** | `admin/staff/actions.ts` | `updateAdminStaffMember` | Inlined `requireAdminAuth()` | `supabaseAdmin` (Service Role) | ❌ None | `profiles`, `admin_staff_members` | **P0 Critical** |
| **SA-04** | `admin/staff/actions.ts` | `toggleAdminStaffStatus` | Inlined `requireAdminAuth()` | `supabaseAdmin` (Service Role) | ❌ None | `admin_staff_members` | **P1 High** |
| **SA-05** | `admin/staff/actions.ts` | `deleteAdminStaffMember` | Inlined `requireAdminAuth()` | `supabaseAdmin` (Service Role) | ❌ None | `admin_staff_members`, `profiles` | **P0 Critical** |
| **SA-06** | `admin/users/actions.ts` | `updateUserRole` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `profiles` | **P0 Critical** |
| **SA-07** | `admin/users/actions.ts` | `toggleUserStatus` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `profiles` | **P1 High** |
| **SA-08** | `admin/users/actions.ts` | `updateUserProfile` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `profiles` | **P0 Critical** |
| **SA-09** | `admin/users/actions.ts` | `getUserProfileDetails` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `profiles`, `candidate_profiles`, `company_profiles`, `profile_documents` | **P2 Medium** |
| **SA-10** | `admin/reports/actions.ts` | `getVacancyReports` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `vacancy_reports`, `vacancies`, `company_profiles`, `profiles` | **P3 Low** |
| **SA-11** | `admin/reports/actions.ts` | `quickDeactivateVacancy` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `vacancies`, `vacancy_reports` | **P2 Medium** |
| **SA-12** | `admin/reports/actions.ts` | `banUserAccount` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `profiles`, `vacancies` | **P1 High** |
| **SA-13** | `admin/reports/actions.ts` | `toggleCompanyVerification` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `profiles`, `company_profiles` | **P1 High** |
| **SA-14** | `admin/reports/actions.ts` | `resolveReport` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `vacancy_reports` | **P2 Medium** |
| **SA-15** | `admin/support/actions.ts` | `getSupportTickets` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `support_tickets`, `profiles`, `support_ticket_messages` | **P3 Low** |
| **SA-16** | `admin/support/actions.ts` | `getSupportTicketById` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `support_tickets`, `profiles` | **P3 Low** |
| **SA-17** | `admin/support/actions.ts` | `createSupportTicket` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `support_tickets`, `support_ticket_messages`, `profiles` | **P3 Low** |
| **SA-18** | `admin/support/actions.ts` | `getTicketMessages` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `support_ticket_messages`, `profiles` | **P3 Low** |
| **SA-19** | `admin/support/actions.ts` | `addTicketMessage` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `support_ticket_messages`, `support_tickets`, `notifications` | **P3 Low** |
| **SA-20** | `admin/support/actions.ts` | `updateTicketStatus` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `support_tickets` | **P3 Low** |
| **SA-21** | `admin/support/actions.ts` | `searchUserForSupport` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `profiles`, `company_profiles` | **P3 Low** |
| **SA-22** | `admin/support/actions.ts` | `sendDirectUserNotification` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `notifications` | **P2 Medium** |
| **SA-23** | `admin/support/actions.ts` | `adjustCompanyCredits` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `company_profiles` | **P1 High** |
| **SA-24** | `admin/support/actions.ts` | `quickResetUserStatus` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `profiles` | **P1 High** |
| **SA-25** | `admin/verifications/actions.ts` | `getSignedDocumentUrl` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `storage.objects` (private bucket) | **P2 Medium** |
| **SA-26** | `admin/verifications/actions.ts` | `getCompanyVerifications` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `company_profiles`, `profiles`, `profile_documents` | **P3 Low** |
| **SA-27** | `admin/verifications/actions.ts` | `getCompanyVerificationById` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `company_profiles`, `profiles`, `profile_documents` | **P3 Low** |
| **SA-28** | `admin/verifications/actions.ts` | `getCandidateVerificationById` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `candidate_profiles`, `candidate_private_profiles`, `profile_documents` | **P2 Medium** |
| **SA-29** | `admin/verifications/actions.ts` | `getCandidateVerifications` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `candidate_profiles`, `candidate_private_profiles`, `profile_documents` | **P2 Medium** |
| **SA-30** | `admin/verifications/actions.ts` | `reviewCompanyVerification` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `company_profiles`, `profile_documents`, `profiles`, `notifications` | **P2 Medium** |
| **SA-31** | `admin/verifications/actions.ts` | `reviewCandidateVerification` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `profiles`, `profile_documents`, `notifications` | **P2 Medium** |
| **SA-32** | `admin/verifications/actions.ts` | `reviewProfileDocument` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ None | `profile_documents` | **P2 Medium** |
| **SA-33** | `dashboard/admin/actions.ts` | `toggleProfileVerification` | Direct `role === 'admin'` check | User Client (`createClient()`) | ❌ None | `profiles` | **P2 Medium** |
| **SA-34** | `lib/auth/impersonation.ts` | `startImpersonating` | Direct `role === 'admin'` check | User Client (`createClient()`) | ❌ None | `profiles` (reads target and caller) | **P1 High** |
| **SA-35** | `lib/auth/impersonation.ts` | `stopImpersonating` | Cookie clearing | None | N/A | None | **INFO** |
| **SA-36** | `lib/auth/impersonation.ts` | `getImpersonationState` | Direct `role === 'admin'` check | User Client (`createClient()`) | ❌ None | `profiles` | **INFO** |
| **SA-37** | `candidate/services/get-vacancies` | `getVacanciesByLocation` | None (Public Catalog) | User Client (`createClient()`) | N/A | `vacancies`, `profiles`, `company_directory` | **INFO** |
| **SA-38** | `company/actions/document-access.ts` | `requestDocumentAccess` | `auth.getUser()` check | User Client (`createClient()`) | N/A | `document_access_requests`, `company_profiles` | **P3 Low** |
| **SA-39** | `company/actions/document-access.ts` | `respondDocumentAccessRequest` | `auth.getUser()` + candidate check | User Client (`createClient()`) | N/A | `document_access_requests` | **P3 Low** |
| **SA-40** | `company/actions/document-access.ts` | `getDocumentAccessStatus` | Relies on RLS | User Client (`createClient()`) | N/A | `document_access_requests` | **P3 Low** |
| **SA-41** | `company/actions/document-access.ts` | `getAuthorizedCandidateDocuments` | `auth.getUser()` + access status | User Client (`createClient()`) | N/A | `document_access_requests`, `profile_documents` | **P3 Low** |
| **SA-42** | `company/actions/employees.ts` | `updateEmployeeStartDate` | `auth.getUser()` check | User Client (`createClient()`) | N/A | `applications` | **P2 Medium** |
| **SA-43** | `company/actions/employees.ts` | `terminateEmployee` | `auth.getUser()` check | User Client (`createClient()`) | N/A | `applications` | **P2 Medium** |
| **SA-44** | `company/actions/employees.ts` | `reactivateEmployee` | `auth.getUser()` check | User Client (`createClient()`) | N/A | `applications` | **P2 Medium** |
| **SA-45** | `company/actions/settings.ts` | `toggleGlobalRecruitment` | `auth.getUser()` check | User Client (`createClient()`) | N/A | `vacancies` | **P2 Medium** |
| **SA-46** | `company/actions/settings.ts` | `updateContactChannel` | `auth.getUser()` check | User Client (`createClient()`) | N/A | `company_profiles` | **P2 Medium** |
| **SA-47** | `company/actions/settings.ts` | `updateSubscriptionPlan` | `auth.getUser()` check | User Client (`createClient()`) | N/A | `company_profiles`, `company_invoices` | **P0 Critical** |
| **SA-48** | `company/actions/settings.ts` | `getCompanyInvoices` | Relies on RLS | User Client (`createClient()`) | N/A | `company_invoices` | **P3 Low** |
| **SA-49** | `company/actions/vacancies.ts` | `revalidateVacancies` | None (Cache purge) | None | N/A | None | **INFO** |
| **SA-50** | `company/actions/vacancies.ts` | `cloneVacancyAction` | `auth.getUser()` + company equality | User Client (`createClient()`) | N/A | `vacancies` | **INFO** |
| **SA-51** | `auth/callback/route.ts` | `GET (Auth Callback)` | OAuth Code Exchange | User Client (`createClient()`) | N/A | `profiles`, `candidate_profiles`, `company_profiles` | **INFO** |
| **SA-52** | `auth/logout/route.ts` | `GET / POST (Auth Logout)` | Session Signout | User Client (`createClient()`) | N/A | Auth Session | **INFO** |

---

## 5. Server Action Audit

### 5.1 Analysis of Authorization Guards
Admin Server Actions across 5 subdirectories define a local copy of `requireAdminAuth()`:

```typescript
// Duplicated in staff/actions.ts:8-30, reports/actions.ts:11-33, support/actions.ts:16-38, users/actions.ts:6-28, verifications/actions.ts:101-123
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

**Flaws Identified**:
1. **Architectural Duplication**: 5 separate implementations of the exact same function with minor return signature inconsistencies.
2. **Missing Metadata Verification**: The guard never queries `public.admin_staff_members`. It is unaware of `sub_role`, `permissions`, and `status`.
3. **No Active Status Check**: A user marked `status = 'suspended'` passes `requireAdminAuth()` without hindrance.

### 5.2 Service Role (`createAdminClient`) Risks in `staff/actions.ts`
The file `src/app/(dashboard)/dashboard/admin/staff/actions.ts` uses `createAdminClient()` (instantiated with `SUPABASE_SERVICE_ROLE_KEY`) for all mutating operations:
- `createAdminStaffMember` (lines 88–250)
- `updateAdminStaffMember` (lines 252–305)
- `toggleAdminStaffStatus` (lines 307–328)
- `deleteAdminStaffMember` (lines 330–354)

**The Blast Radius**: When `createAdminClient()` is used, PostgreSQL Row Level Security is completely bypassed. The sole security boundary is the TypeScript code in the Server Action itself. Because the Server Action checks only `requireAdminAuth()` (binary admin check), any administrator can invoke these functions to perform arbitrary mutations across `auth.users`, `public.profiles`, and `public.admin_staff_members`.

### 5.3 Parameter Tampering and Validation Gaps
1. **`staff/actions.ts:createAdminStaffMember` & `updateAdminStaffMember`**:
   Accept `formData.subRole` and `formData.permissions` directly from the client without checking whether the caller's rank permits granting those privileges.
2. **`modules/company/actions/settings.ts:updateSubscriptionPlan`**:
   Accepts `companyId` and `plan: "basic" | "pro" | "enterprise"`. Mutates `company_profiles.subscription_plan` directly and creates a fake invoice marked `status = 'paid'` without verifying payment gateway webhook signatures.
3. **`modules/company/actions/settings.ts:toggleGlobalRecruitment` & `updateContactChannel`**:
   Accept `companyId` as an argument without checking `user.id === companyId` in TypeScript (partially protected by RLS if user client is used, but represents poor defense-in-depth).

---

## 6. RLS & SQL Function Audit

### 6.1 Audit of PostgreSQL Authorization Functions

#### 1. `public.is_admin(user_id uuid DEFAULT auth.uid())`
* **Source**: Migration `20260815033000_fix_rls_infinite_recursion_profiles.sql` (lines 4–16)
* **SQL Definition**:
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
* **Security Definer & Search Path**:
  - `SECURITY DEFINER` correctly avoids infinite recursion when reading `public.profiles`.
  - `SET search_path = public` omits `pg_temp`. Recommendation: Hardened search path should be `SET search_path = public, pg_temp`.
* **Vulnerability**:
  - Evaluates authorization **purely on `profiles.role = 'admin'`**.
  - Does NOT check `admin_staff_members.status = 'active'`.
  - Does NOT check `admin_staff_members.sub_role`.
  - Grants root-level bypass on all RLS policies referencing `public.is_admin()`.

#### 2. `public.get_user_role(user_id uuid DEFAULT auth.uid())`
* **Source**: Migration `20260815033000_fix_rls_infinite_recursion_profiles.sql` (lines 19–29)
* **SQL Definition**:
  ```sql
  CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
  RETURNS public.user_role
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  STABLE
  AS $$
    SELECT role
    FROM public.profiles
    WHERE id = COALESCE(user_id, auth.uid());
  $$;
  ```
* **Analysis**: Prevents regular users from modifying their own `role` on UPDATE, but permits administrators to change any user's role via `WITH CHECK (role = public.get_user_role() OR public.is_admin())`.

#### 3. `public.handle_new_user()` Trigger Function
* **Source**: Migration `20260826000000_harden_auth_user_creation_trigger.sql` (lines 13–121)
* **Hardening Verification**:
  - Sets `search_path = public, pg_temp`.
  - Explicitly prevents user metadata role injection: if `raw_user_meta_data->>'role'` is `'admin'`, it defaults to `'candidate'`.
  - Execution revoked from `PUBLIC`, `anon`, and `authenticated`.
  - **Verdict**: Successfully hardened against unauthenticated role elevation at registration.

### 6.2 Table RLS Matrix (All 16 Tables)

| Table | RLS Active | `anon` Access | `authenticated` (Regular) | `admin` Access (`is_admin()`) | Solely `profiles.role`? | Key Finding |
|---|:---:|---|---|---|:---:|---|
| `public.profiles` | **YES** | None | SELECT: Own / Directory<br>UPDATE: Own (no role change) | **ALL**: `"Admins manage all profiles"` | **YES** | Any admin can elevate users to `role = 'admin'` via client SDK. |
| `public.admin_staff_members` | **YES** | None | None | **ALL**: `"Admins can manage admin staff members"` | **YES** | **CRITICAL**: Any admin can update their own row to `super_admin` via SDK. |
| `public.candidate_profiles` | **YES** | None | SELECT: Own / Directory<br>INSERT/UPDATE: Own | **ALL**: `"Admins manage candidate profiles"` | **YES** | All admins have unconstrained CRUD. |
| `public.candidate_private_profiles` | **YES** | None | ALL: Own (`id = auth.uid()`) | **ALL**: `"Admins manage candidate private identity"` | **YES** | Sensitive PII (CURP, RFC) readable by all admin tiers without `verify_documents`. |
| `public.company_profiles` | **YES** | SELECT: Directory | SELECT: Directory<br>ALL: Own (`id = auth.uid()`) | **ALL**: `"Admins manage company profiles"` | **YES** | Any admin can modify credits, verification, and subscriptions. |
| `public.company_employees` | **YES** | None | ALL: Company (`company_id = auth.uid()`)<br>SELECT: Employee | None explicit (relies on service role) | N/A | Properly isolated between employer and employee. |
| `public.profile_documents` | **YES** | None | SELECT: Owner / Approved Company<br>INSERT/UPDATE/DELETE: Owner | **ALL**: `"Admins can manage verification documents"` | **YES** | Any admin can view/approve documents via SDK without permission checks. |
| `public.vacancies` | **YES** | SELECT: Published | SELECT: Published / Own<br>ALL: Own recruiter/company | None explicit in SQL migrations | N/A | Admin user client cannot update vacancies of other companies. |
| `public.applications` | **YES** | None | ALL: Candidate<br>SELECT/UPDATE: Recruiter | None explicit in SQL migrations | N/A | Candidate/Company isolated. |
| `public.saved_vacancies` | **YES** | None | ALL: Candidate (`candidate_id = auth.uid()`) | None | N/A | Candidate isolated. |
| `public.notifications` | **YES** | None | ALL: Target user (`user_id = auth.uid()`) | None explicit | N/A | Admin inserting notifications requires service role. |
| `public.company_invoices` | **YES** | None | SELECT: Company (`company_id = auth.uid()`) | **ALL**: `"Admins can manage all invoices"` | **YES** | All admins can manage invoices. |
| `public.document_access_requests` | **YES** | None | INSERT/SELECT: Company<br>SELECT/UPDATE: Candidate | None explicit | N/A | Properly isolated to candidate consent flow. |
| `public.support_tickets` | **YES** | None | SELECT/INSERT: Creator (`user_id = auth.uid()`) | **ALL**: `"Admins manage all support tickets"` | **YES** | All admins can view/edit all tickets. |
| `public.support_ticket_messages` | **YES** | None | SELECT: Creator on non-internal notes | **ALL**: `"Admins manage all support ticket messages"` | **YES** | All admins can read/write internal notes and user messages. |
| `public.vacancy_reports` | **YES** | None | INSERT: Authenticated | **ALL**: `"Admins manage all vacancy reports"` | **YES** | All admins have full moderation power. |

### 6.3 Storage Buckets RLS Policy Audit
- **`avatars` (Public)**: Users restricted to their own folder (`(select auth.uid())::text = (storage.foldername(name))[1]`). **Secure.**
- **`company_assets` (Public)**: Companies restricted to their own root folder. **Secure.**
- **`profile_documents` (Private)**: Private bucket. Owner can read/write; any user with `profiles.role = 'admin'` can generate signed URLs or read files directly.

---

## 7. Permission System Audit

### 7.1 Semantic Authority vs UI Decorative Display
A comprehensive audit of the codebase reveals that the `permissions` array stored in `public.admin_staff_members.permissions` is **completely non-functional**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE PERMISSION DISCREPANCY                                │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│ Visual Representation in Frontend UI      │ Actual Enforcement in Backend & Database   │
├───────────────────────────────────────────┼────────────────────────────────────────────┤
│ • Badges display assigned permissions     │ • 0 Server Actions check permissions array │
│ • Checkboxes allow toggling 6 permissions │ • 0 RLS policies check permissions array   │
│ • Roles have default permission sets      │ • Any admin can execute ANY admin action   │
│ • AppSidebar displays all modules         │ • Any admin can mutate ANY admin table     │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

### 7.2 UI Discrepancy Matrix

| Administrative Domain | UI Permission Required | Intended Subrole | Actual Guard in Server Action | Actual RLS Policy | Security Discrepancy |
|---|---|---|---|---|---|
| **Staff Provisioning** | `system_settings` | `super_admin` | `requireAdminAuth()` (binary) | `is_admin()` (binary) | **CRITICAL**: Support can create super admins |
| **Staff Modification** | `system_settings` | `super_admin` | `requireAdminAuth()` (binary) | `is_admin()` (binary) | **CRITICAL**: Support can elevate self/others |
| **Staff Deletion / Lockout** | `system_settings` | `super_admin` | `requireAdminAuth()` (binary) | `is_admin()` (binary) | **CRITICAL**: Support can delete super admins |
| **User Role Mutation** | `manage_users` | `super_admin` | `requireAdminAuth()` (binary) | `is_admin()` (binary) | **CRITICAL**: Support can make any user admin |
| **Company Credit Adjustment** | `manage_companies` | `ops_admin`, `super_admin` | `requireAdminAuth()` (binary) | `is_admin()` (binary) | **HIGH**: Support can grant arbitrary credits |
| **Account Banning** | `manage_users` | `ops_admin`, `super_admin` | `requireAdminAuth()` (binary) | `is_admin()` (binary) | **HIGH**: Any admin can ban users |
| **Fiscal Expediente Review** | `verify_documents` | `verification_admin` | `requireAdminAuth()` (binary) | `is_admin()` (binary) | **MEDIUM**: Any admin can approve legal docs |
| **Private PII Inspection** | `verify_documents` | `verification_admin` | `requireAdminAuth()` (binary) | `is_admin()` (binary) | **MEDIUM**: Any admin can inspect CURP/RFC |
| **Vacancy Deactivation** | `manage_vacancies` | `content_admin`, `ops_admin` | `requireAdminAuth()` (binary) | `is_admin()` (binary) | **MEDIUM**: Any admin can take down jobs |

---

## 8. Admin $\to$ Super Admin Escalation Analysis (Cases A through G)

### Case A: An `admin` creating a new `super_admin` staff member
- **Vulnerability Location**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (`createAdminStaffMember`, lines 88–250).
- **Execution Trace**:
  1. Caller (e.g. `sub_role: 'support'`) submits form data containing `subRole: 'super_admin'` and all 6 permissions.
  2. Guard `requireAdminAuth()` (line 98) verifies `profiles.role === 'admin'`. Check passes.
  3. Action initializes `supabaseAdmin = createAdminClient()` (Service Role Key, bypassing RLS).
  4. `supabaseAdmin.auth.admin.createUser()` creates user in Supabase Auth (line 181).
  5. `supabaseAdmin.from("profiles").upsert({ role: "admin" })` sets profile role (lines 201–213).
  6. `supabaseAdmin.from("admin_staff_members").upsert({ sub_role: formData.subRole, permissions: formData.permissions })` persists root privileges (lines 221–235).
- **Preconditions**: Authenticated session with `profiles.role = 'admin'`.
- **Payload**:
  ```json
  {
    "name": "Rogue Super Admin",
    "email": "rogue@kanpro.com",
    "password": "Password123!",
    "whatsappNumber": "+529991234567",
    "subRole": "super_admin",
    "department": "Dirección General",
    "permissions": ["manage_users", "manage_companies", "verify_documents", "manage_vacancies", "analytics_access", "system_settings"],
    "status": "active"
  }
  ```
- **Outcome**: A new unconstrained Super Admin account is provisioned.
- **Defense Status**: **VULNERABLE (P0 Critical)**.

---

### Case B: An `admin` promoting another existing staff member to `super_admin`
- **Vulnerability Location**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (`updateAdminStaffMember`, lines 252–305).
- **Execution Trace**:
  1. Caller (e.g. `sub_role: 'support'`) passes target `profileId` of an accomplice along with `subRole: 'super_admin'`.
  2. Guard `requireAdminAuth()` (line 265) validates `profiles.role === 'admin'`.
  3. Service Role client updates `public.admin_staff_members` setting `sub_role: 'super_admin'` and granting all permissions (lines 285–298).
- **Preconditions**: Caller is an admin; target user exists in staff table.
- **Payload**: `updateAdminStaffMember(targetProfileId, { subRole: 'super_admin', permissions: ALL_PERMISSIONS })`.
- **Outcome**: Target account promoted to Super Admin.
- **Defense Status**: **VULNERABLE (P0 Critical)**.

---

### Case C: An `admin` modifying permissions or `sub_role` of another administrator (Sabotage / Downgrade)
- **Vulnerability Location**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (`updateAdminStaffMember`, lines 252–305).
- **Execution Trace**:
  1. Caller (e.g. `sub_role: 'support'`) passes target `profileId` belonging to the executive `super_admin` (e.g. CTO/CEO).
  2. Caller sets `subRole: 'support'`, `permissions: []`, and `status: 'inactive'`.
  3. Action executes without comparing caller rank against target rank.
  4. Service Role client mutates the executive's staff record.
- **Preconditions**: Caller is an admin; target is a superior `super_admin`.
- **Payload**: `updateAdminStaffMember(victimSuperAdminId, { subRole: 'support', permissions: [], status: 'inactive' })`.
- **Outcome**: Superior administrator's metadata is stripped and marked inactive.
- **Defense Status**: **VULNERABLE (P0 Critical)**.

---

### Case D: An `admin` modifying their own permissions or `sub_role` (Self-Escalation)
- **Vulnerability Location**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (`updateAdminStaffMember`, lines 252–305).
- **Execution Trace**:
  1. Unlike `deleteAdminStaffMember` (which checks `user.id === profileId`), `updateAdminStaffMember` contains **no self-modification check**.
  2. Caller passes their own `user.id` as `profileId` with `subRole: 'super_admin'` and all permissions.
  3. Action executes `supabaseAdmin.from("admin_staff_members").upsert(...)` against caller's row.
- **Preconditions**: Caller has active session with `profiles.role = 'admin'`.
- **Payload**: `updateAdminStaffMember(callerUserId, { subRole: 'super_admin', permissions: ALL_PERMISSIONS, status: 'active' })`.
- **Outcome**: Immediate vertical self-escalation to root Super Admin.
- **Defense Status**: **VULNERABLE (P0 Critical)**.

---

### Case E: An `admin` deleting or deactivating a `super_admin` (Executive Lockout)
- **Vulnerability Location**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (`deleteAdminStaffMember`, lines 330–354).
- **Execution Trace**:
  1. In `deleteAdminStaffMember`:
     ```typescript
     const { user } = await requireAdminAuth();
     if (user.id === profileId) {
       throw new Error("No puede dar de baja su propio usuario administrador.");
     }
     const supabaseAdmin = createAdminClient();
     await supabaseAdmin.from("admin_staff_members").delete().eq("profile_id", profileId);
     await supabaseAdmin.from("profiles").update({ role: "candidate" }).eq("id", profileId);
     ```
  2. The code checks ONLY that caller does not delete themselves (`user.id !== profileId`).
  3. It does NOT check whether target `profileId` is a `super_admin`.
  4. It executes `profiles.update({ role: 'candidate' })` using the Service Role client.
- **Preconditions**: Caller is an admin; target is a `super_admin` (`user.id != profileId`).
- **Payload**: `deleteAdminStaffMember(victimSuperAdminId)`.
- **Outcome**: Executive Super Admin is demoted to a candidate, permanently locking them out of the administrative dashboard.
- **Defense Status**: **VULNERABLE (P0 Critical)**.

---

### Case F: Direct manipulation via Supabase browser client SDK (RLS Bypass)
- **Vulnerability Location**: PostgreSQL RLS Policy `"Admins can manage admin staff members"` in migration `20260815033000_fix_rls_infinite_recursion_profiles.sql` (lines 82–86).
- **Execution Trace**:
  1. Attacker opens browser developer console on `/dashboard/admin`.
  2. Attacker invokes `@supabase/supabase-js` client directly against PostgREST:
     ```javascript
     await supabase
       .from('admin_staff_members')
       .update({ sub_role: 'super_admin', permissions: ['manage_users', 'manage_companies', 'verify_documents', 'manage_vacancies', 'analytics_access', 'system_settings'] })
       .eq('profile_id', supabase.auth.user().id);
     ```
  3. PostgREST evaluates RLS policy: `USING (public.is_admin()) WITH CHECK (public.is_admin())`.
  4. `public.is_admin()` checks `SELECT EXISTS(SELECT 1 FROM profiles WHERE role = 'admin')` $\to$ returns `TRUE`.
  5. Mutation succeeds with HTTP 200 OK, completely bypassing Server Actions.
- **Preconditions**: User session with `profiles.role = 'admin'`.
- **Outcome**: Arbitrary database modification without server-side validation.
- **Defense Status**: **VULNERABLE (P0 Critical)**.

---

### Case G: State desynchronization & auto-escalation of orphan admin profiles
- **Vulnerability Location**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (`getAdminStaffMembers`, lines 55–85) & `src/app/(dashboard)/dashboard/admin/users/actions.ts` (`updateUserRole`, lines 30–52).
- **Execution Trace**:
  1. Admin elevates a user via `updateUserRole(userId, 'admin')`.
  2. `public.profiles.role` is set to `'admin'`, but no record is created in `public.admin_staff_members`.
  3. When staff directory loads, `getAdminStaffMembers()` iterates over admin profiles.
  4. Finding no staff record (`staffMap.get(p.id) === undefined`), it defaults `subRole` to `"super_admin"` and assigns all 6 permissions.
- **Preconditions**: User has `profiles.role = 'admin'` without `admin_staff_members` row.
- **Outcome**: Uninitialized/orphaned admin profiles silently receive full Super Admin authority.
- **Defense Status**: **VULNERABLE (P1 High)**.

---

## 9. Other Findings

### 9.1 Classification Structure
Vulnerabilities and findings are categorized following standard industry risk severity guidelines (P0 Critical, P1 High, P2 Medium, P3 Low, INFO):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              VULNERABILITY SUMMARY BREAKDOWN                           │
├───────────────────┬────────┬───────────────────────────────────────────────────────────┤
│ Severity          │ Count  │ Core Risk Focus                                           │
├───────────────────┼────────┼───────────────────────────────────────────────────────────┤
│ **P0 Critical**   │ 6      │ Root Privilege Escalation, Lockout, Commercial Bypass     │
│ **P1 High**       │ 5      │ Admin Impersonation, Ineffective Deactivation, Banning    │
│ **P2 Medium**     │ 5      │ PII Exposure, Unscoped Company Settings/Employees         │
│ **P3 Low**        │ 3      │ Internal Ticket Privacy, UI Route Overexposure            │
│ **INFO**          │ 3      │ Hardened Auth Triggers, Storage Isolation Verification    │
└───────────────────┴────────┴───────────────────────────────────────────────────────────┘
```

### 9.2 Complete Finding Catalog

#### P0 Critical
1. **F-01: Unrestricted Staff Creation & Escalation to Super Admin**: `staff/actions.ts:createAdminStaffMember` allows any admin to create root Super Admin accounts using the Service Role client (Case A).
2. **F-02: Unchecked Staff Mutation & Privilege Elevation**: `staff/actions.ts:updateAdminStaffMember` allows any admin to promote peers to Super Admin (Case B).
3. **F-03: Self-Escalation to Super Admin**: `staff/actions.ts:updateAdminStaffMember` lacks self-modification checks, enabling instant self-elevation (Case D).
4. **F-04: Hostile Takeover & Super Admin Deletion**: `staff/actions.ts:deleteAdminStaffMember` allows lower-tier admins to demote executive Super Admins to candidates (Case E).
5. **F-05: Direct PostgREST RLS Exploitation on Staff Table**: Permissive `is_admin()` policy allows direct client SDK updates to `admin_staff_members` (Case F).
6. **F-06: Commercial Subscription Plan Bypass**: `modules/company/actions/settings.ts:updateSubscriptionPlan` allows company users to grant themselves free Enterprise subscriptions and paid invoices without payment verification.

#### P1 High
7. **F-07: Admin-on-Admin Impersonation**: `lib/auth/impersonation.ts:startImpersonating` allows admins to impersonate other admins using unsigned cookie values.
8. **F-08: Inactive / Suspended Staff Access Retention**: `staff/actions.ts:toggleAdminStaffStatus` updates only staff metadata; suspended admins retain 100% platform access.
9. **F-09: Unrestricted Account Banning**: `reports/actions.ts:banUserAccount` allows any admin subrole to ban companies or candidates without moderation permissions.
10. **F-10: Direct Financial Credit Adjustment without Guard**: `support/actions.ts:adjustCompanyCredits` allows any admin to grant balance credits to companies.
11. **F-11: Auto-Escalation of Orphan Admins to Super Admin**: `staff/actions.ts:getAdminStaffMembers` defaults missing staff records to Super Admin with all permissions (Case G).

#### P2 Medium
12. **F-12: Candidate Private PII Exposure**: `candidate_private_profiles` (CURP, RFC, Cédula) is readable by all admin tiers via `is_admin()` without `verify_documents` permission.
13. **F-13: Missing Company Ownership Check in Employee Management**: `modules/company/actions/employees.ts` (`terminateEmployee`, `reactivateEmployee`) validates session but omits company ownership assertion in application code.
14. **F-14: Missing Company Ownership Check in Global Recruitment**: `modules/company/actions/settings.ts:toggleGlobalRecruitment` accepts arbitrary `companyId` argument.
15. **F-15: Unrestricted Legal Document Verification**: Any admin tier can sign URLs and approve corporate fiscal dossiers.
16. **F-16: Incomplete Search Path in Legacy Functions**: `public.is_admin()` and `public.get_user_role()` use `SET search_path = public` omitting `pg_temp`.

#### P3 Low & INFO
17. **F-17: Internal Ticket Note Exposure**: All admin tiers can read internal support notes regardless of support assignment.
18. **F-18: Unconditional Navigation Display**: `AppSidebar` renders all admin modules to all staff tiers.
19. **F-19: Duplicate Inlined Authorization Helpers**: Redundant copies of `requireAdminAuth()` across 5 files.
20. **F-20 (INFO): Auth Callback Hardening**: `auth/callback/route.ts` and `handle_new_user()` correctly block external registration role spoofing.
21. **F-21 (INFO): Storage Bucket Folder Security**: Avatar and company asset buckets enforce strict folder-based user isolation.
22. **F-22 (INFO): Public Vacancy Search**: Catalog search functions operate safely in read-only mode without sensitive data leakage.

---

## 10. Recommended RBAC Architecture

### 10.1 Comparative Architectural Evaluation

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          ARCHITECTURAL OPTIONS COMPARISON                              │
├──────────────────────┬────────────────────────┬────────────────────────────────────────┤
│ Option A: Minimal    │ Option B: Recommended  │ Option C: Scalable (ABAC / Engine)     │
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ • Inlined Action     │ • Defense-in-Depth     │ • External Policy Engine (CASL/Cerbos) │
│   checks in TS.      │   Hybrid RBAC.         │ • Dynamic Policy / Attribute Tables.   │
│ • No DB enum change. │ • DB Enums + Triggers. │ • Dynamic Tenant-Level Roles.          │
│ • Single helper.     │ • Granular RLS Funcs.  │                                        │
│                      │ • Typed Action Guards. │                                        │
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ Complexity: Low      │ Complexity: Moderate   │ Complexity: Very High                  │
│ Security: Fragile    │ Security: Robust/Full  │ Security: Enterprise                   │
│ DB Impact: None      │ DB Impact: Controlled  │ DB Impact: Heavy Schema Redesign       │
│ Perf Overhead: Low   │ Perf Overhead: Minimal │ Perf Overhead: High (Policy Eval)      │
└──────────────────────┴────────────────────────┴────────────────────────────────────────┘
```

#### Detailed Trade-off Analysis

| Evaluation Criteria | Option A: Minimal RBAC | Option B: Recommended RBAC (Defense-in-Depth) | Option C: Scalable RBAC (ABAC / Policy Engine) |
|---|---|---|---|
| **Architecture Concept** | TypeScript-only guards in Server Actions; leaves RLS binary (`is_admin()`). | Synchronized DB Enums, SQL RLS functions, DB triggers, and typed Server Action guards. | Dynamic policy tables (`roles`, `permissions`, `role_permissions`) with runtime ABAC evaluator. |
| **Protection Against SDK Bypass (Case F)** | ❌ **FAIL**: Browser SDK can still directly mutate database tables via permissive RLS. | ✅ **PASS**: PostgreSQL RLS functions (`is_super_admin()`, `has_admin_permission()`) enforce boundaries at the database engine. | ✅ **PASS**: Fine-grained database-level policy mapping. |
| **Staff Invariant Enforcement (I1–I10)** | ⚠️ Partial (App layer only). | ✅ **Full**: Enforced at both Application and Database layers via triggers. | ✅ Full: Enforced via policy rules. |
| **Development & Migration Effort** | 1–2 days | 4–6 days | 3–4 weeks |
| **Performance & Latency** | Near zero overhead. | Negligible overhead (indexed single-row lookups in SQL functions). | Added query latency on every action for dynamic policy resolution. |
| **Maintainability & Type Safety** | Low (error-prone, duplicated checks). | High (centralized TypeScript types generated directly from Postgres schema). | Moderate (requires managing policy sync across tiers). |
| **Recommendation Verdict** | **REJECTED** (Fails security invariant I5; vulnerable to SDK bypass). | **SELECTED (RECOMMENDED)** (Optimal balance of security, performance, and simplicity). | **DEFERRED** (Over-engineering for current platform scale). |

### 10.2 Blueprint for Option B (Recommended Architecture)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                  PROPOSED OPTION B: DEFENSE-IN-DEPTH RBAC TOPOLOGY                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                   DATABASE LAYER                                       │
│  1. Enum: public.admin_sub_role ('super_admin', 'ops_admin', 'content_admin', ...)      │
│  2. Enum: public.admin_permission ('manage_users', 'manage_companies', ...)            │
│  3. Table: public.admin_staff_members (typed sub_role, status, permissions)            │
│  4. Functions: public.is_super_admin(), public.has_admin_permission(perm_key)          │
│  5. Triggers: prevent_self_escalation(), sync_admin_profile_status()                   │
│  6. RLS: admin_staff_members restricted to is_super_admin(); tables check permissions  │
├─────────────────────────────────────────┬──────────────────────────────────────────────┤
│                                         │                                              │
│                                         ▼                                              │
│                             SERVER-SIDE APPLICATION LAYER                              │
│  1. Central Guard: requireAdminAuth({ requiredPermission, allowedSubRoles })          │
│  2. Specialized Helpers: requireSuperAdmin(), requireStaffActive()                     │
│  3. Safe Fallback: Missing staff row defaults to 'support' (least privilege)           │
│  4. Commercial Payment Webhook Verification: HMAC SHA-256 for subscription upgrades    │
├─────────────────────────────────────────┬──────────────────────────────────────────────┤
│                                         │                                              │
│                                         ▼                                              │
│                                  FRONTEND UI LAYER                                     │
│  1. Session Context: AdminRoleContext (exposes subRole, permissions, hasPermission)   │
│  2. AppSidebar: Conditional navigation rendering based on capabilities                 │
│  3. UI Action Gating: Modals, buttons, and bulk actions hidden/disabled if unauthorized │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Security Invariants

Formal mathematical and logical definitions of system security invariants:

### **Invariant I1: Staff Liveness & Active Status Invariant**
$$\forall u \in \text{Users}, \quad \text{AuthorizeAdmin}(u) \iff \Big( \text{profiles.role}(u) = \text{'admin'} \;\land\; \exists s \in \text{admin\_staff\_members} \text{ s.t. } s.\text{profile\_id} = u.\text{id} \;\land\; s.\text{status} = \text{'active'} \Big)$$
*Rationale*: No administrative request or database query shall succeed if the user's staff record is missing, inactive, or suspended.

### **Invariant I2: Super Admin Monopolistic Hierarchy Invariant**
$$\forall u_{\text{actor}}, u_{\text{target}} \in \text{Users}, \quad \text{CanMutateStaff}(u_{\text{actor}}, u_{\text{target}}) \implies \Big( \text{sub\_role}(u_{\text{actor}}) = \text{'super\_admin'} \;\land\; \text{status}(u_{\text{actor}}) = \text{'active'} \Big)$$
*Rationale*: Only an active Super Admin can create, modify, suspend, reactivate, or delete administrative staff members.

### **Invariant I3: Anti-Self-Escalation Invariant**
$$\forall u \in \text{Users}, \quad \neg \text{CanModifyOwnRoleOrPermissions}(u)$$
$$\forall u \in \text{Users}, \quad \text{UpdateStaff}(u_{\text{actor}}, u_{\text{target}}, \Delta_{\text{privileges}}) \implies u_{\text{actor}} \neq u_{\text{target}}$$
*Rationale*: An administrator can never alter their own subrole, permissions array, or status, preventing rogue self-elevation.

### **Invariant I4: Granular Action Authorization Invariant**
$$\forall a \in \text{AdminActions}, \quad \text{Execute}(u, a) \implies \Big( \text{RequiredPermission}(a) \in \text{permissions}(u) \;\lor\; \text{sub\_role}(u) = \text{'super\_admin'} \Big)$$
*Rationale*: Every Server Action must verify the specific permission key mapped to its operation.

### **Invariant I5: Direct Database SDK Parity Invariant**
$$\forall q \in \text{PostgRESTQueries}, \quad \text{RLS\_Permit}(u, q) \iff \text{ServerGuard\_Permit}(u, q)$$
*Rationale*: PostgreSQL RLS policies must mirror Server Action permissions, ensuring that bypassing the Next.js backend via direct browser SDK calls is impossible.

### **Invariant I6: Impersonation Safety Boundary Invariant**
$$\forall u_{\text{admin}}, u_{\text{target}} \in \text{Users}, \quad \text{Impersonate}(u_{\text{admin}}, u_{\text{target}}) \implies \Big( \text{profiles.role}(u_{\text{target}}) \in \{\text{'candidate'}, \text{'company'}\} \;\land\; \text{sub\_role}(u_{\text{admin}}) \in \{\text{'super\_admin'}, \text{'support'}\} \Big)$$
*Rationale*: Administrators can only impersonate candidates or companies; impersonating other administrators is strictly prohibited. Impersonation cookies must be cryptographically signed HMAC tokens.

### **Invariant I7: Commercial & Financial Integrity Invariant**
$$\forall c \in \text{Companies}, \quad \text{SetSubscription}(c, \text{tier}) \implies \text{VerifyPaymentSignature}(\text{webhook\_payload})$$
*Rationale*: Subscription upgrades and credit grants must be cryptographically authenticated by payment provider webhooks.

### **Invariant I8: Least Privilege PII Access Invariant**
$$\forall u \in \text{Users}, \quad \text{ReadPrivatePII}(u, \text{candidate}) \implies \Big( \text{'verify\_documents'} \in \text{permissions}(u) \;\lor\; \text{sub\_role}(u) = \text{'super\_admin'} \Big)$$
*Rationale*: Access to sensitive candidate identity data (CURP, RFC, Cédula) is restricted strictly to authorized verification officers.

### **Invariant I9: State Consistency & Zero Ghost Admin Invariant**
$$\forall u \in \text{Profiles}, \quad \text{profiles.role}(u) = \text{'admin'} \iff \exists s \in \text{admin\_staff\_members} \text{ s.t. } s.\text{profile\_id} = u.\text{id}$$
*Rationale*: A database trigger must ensure that promoting a user to admin creates a staff record, and demoting an admin deletes or archives the staff record.

### **Invariant I10: Non-Repudiation & Audit Logging Invariant**
$$\forall \text{mut} \in \text{AdminMutations}, \quad \text{Execute}(\text{mut}) \implies \text{InsertAuditLog}(\text{actor\_id}, \text{action\_type}, \text{target\_id}, \text{timestamp}, \text{payload})$$
*Rationale*: All administrative mutations must generate an immutable audit log row recording actor, timestamp, and changes.

---

## 12. Proposed Permission Matrix

The following matrix defines the granular capability mapping across all 5 administrative subroles and platform domains:

| Resource Domain / Operation | Required Permission | `super_admin` | `ops_admin` | `content_admin` | `verification_admin` | `support` |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Staff: Create New Admin Staff** | `system_settings` (Super Admin Only) | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ❌ DENY | ❌ DENY |
| **Staff: Update Subrole / Permissions** | `system_settings` (Super Admin Only) | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ❌ DENY | ❌ DENY |
| **Staff: Toggle Status (Suspend/Active)** | `system_settings` (Super Admin Only) | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ❌ DENY | ❌ DENY |
| **Staff: Delete Staff / Demote Admin** | `system_settings` (Super Admin Only) | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ❌ DENY | ❌ DENY |
| **Staff: View Staff Directory** | None (All Active Staff) | ✅ **ALLOW** | ✅ **ALLOW** | ✅ **ALLOW** | ✅ **ALLOW** | ✅ **ALLOW** |
| **Users: Promote / Demote Role** | `system_settings` (Super Admin Only) | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ❌ DENY | ❌ DENY |
| **Users: Toggle User Status (Suspend)** | `manage_users` | ✅ **ALLOW** | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ❌ DENY |
| **Users: View User Directory & Profiles** | `manage_users` | ✅ **ALLOW** | ✅ **ALLOW** | ❌ DENY | ✅ **ALLOW** | ✅ **ALLOW** |
| **Users: Ban User Account** | `manage_users` | ✅ **ALLOW** | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ❌ DENY |
| **Verifications: View Expedientes** | `verify_documents` | ✅ **ALLOW** | ✅ **ALLOW** | ❌ DENY | ✅ **ALLOW** | ❌ DENY |
| **Verifications: View Private PII (CURP/RFC)**| `verify_documents` | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ✅ **ALLOW** | ❌ DENY |
| **Verifications: Sign / Download Docs** | `verify_documents` | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ✅ **ALLOW** | ❌ DENY |
| **Verifications: Approve/Reject Document**| `verify_documents` | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ✅ **ALLOW** | ❌ DENY |
| **Verifications: Toggle Company Verified** | `manage_companies` | ✅ **ALLOW** | ✅ **ALLOW** | ❌ DENY | ✅ **ALLOW** | ❌ DENY |
| **Moderation: View Vacancy Reports** | `manage_vacancies` | ✅ **ALLOW** | ✅ **ALLOW** | ✅ **ALLOW** | ❌ DENY | ❌ DENY |
| **Moderation: Deactivate Vacancy** | `manage_vacancies` | ✅ **ALLOW** | ✅ **ALLOW** | ✅ **ALLOW** | ❌ DENY | ❌ DENY |
| **Moderation: Resolve Report** | `manage_vacancies` | ✅ **ALLOW** | ✅ **ALLOW** | ✅ **ALLOW** | ❌ DENY | ❌ DENY |
| **Support: View Support Tickets** | `manage_users` / Support Scope | ✅ **ALLOW** | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ✅ **ALLOW** |
| **Support: Reply Ticket / Add Notes** | Support Scope | ✅ **ALLOW** | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ✅ **ALLOW** |
| **Support: Adjust Company Credits** | `manage_companies` + Financial Role | ✅ **ALLOW** | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ❌ DENY |
| **Commercial: View Invoices & Revenue** | `analytics_access` | ✅ **ALLOW** | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ❌ DENY |
| **Commercial: Change Company Plan** | `system_settings` (Super Admin Only)| ✅ **ALLOW** | ❌ DENY | ❌ DENY | ❌ DENY | ❌ DENY |
| **Impersonation: Impersonate Candidate** | `manage_users` + Support Scope | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ❌ DENY | ✅ **ALLOW** |
| **Impersonation: Impersonate Company** | `manage_companies` + Support Scope | ✅ **ALLOW** | ❌ DENY | ❌ DENY | ❌ DENY | ✅ **ALLOW** |
| **Impersonation: Impersonate Admin** | **FORBIDDEN BY INVARIANT I6** | 🚫 **BLOCK** | 🚫 **BLOCK**| 🚫 **BLOCK** | 🚫 **BLOCK** | 🚫 **BLOCK** |

---

## 13. Threat Model

### 13.1 STRIDE Threat Analysis

| STRIDE Category | Threat Description | Vulnerable Assets | Current Risk | Mitigated State (Option B) |
|---|---|---|:---:|---|
| **Spoofing** | Attacker crafts unsigned impersonation cookies to impersonate administrators. | Admin sessions, `lib/auth/impersonation.ts` | **P1 High** | Cryptographically signed HMAC tokens; admin target impersonation blocked by Invariant I6. |
| **Tampering** | Low-privilege admin updates `admin_staff_members` or `profiles` via browser SDK. | `public.admin_staff_members`, `public.profiles` | **P0 Critical** | PostgreSQL RLS restricted to `is_super_admin()`; anti-self-escalation trigger. |
| **Repudiation** | Rogue admin deletes super admin or bans companies without leaving audit trail. | Platform configuration, company accounts | **P1 High** | Immutable `admin_audit_logs` table capturing all mutations (Invariant I10). |
| **Information Disclosure** | Support agent reads sensitive candidate PII (CURP, RFC, Cédula) and confidential PDFs. | `candidate_private_profiles`, `profile_documents` bucket | **P2 Medium** | PII and document signing restricted to `verify_documents` permission (Invariant I8). |
| **Denial of Service** | Rogue admin demotes all Super Admins to candidates, locking out management. | Executive accounts, platform administration | **P0 Critical** | Monopolistic Super Admin hierarchy (Invariant I2); last-admin protection trigger. |
| **Elevation of Privilege** | Support agent calls `createAdminStaffMember` or `updateAdminStaffMember` to gain Super Admin. | Supabase Auth, staff directory | **P0 Critical** | Centralized `requireSuperAdmin()` guard; RLS enforcement (Invariants I2, I3). |

### 13.2 Threat Actors & Attack Vectors
1. **Malicious Insider / Compromised Support Account**:
   - *Goal*: Gain full administrative access, steal candidate identity data, or sabotage company accounts.
   - *Attack Path*: Invokes `updateAdminStaffMember(self.id, { subRole: 'super_admin' })` $\to$ gains root access.
2. **Malicious Recruiter / Company User**:
   - *Goal*: Avoid paying subscription fees while posting unlimited featured vacancies.
   - *Attack Path*: Invokes `updateSubscriptionPlan(companyId, 'enterprise')` directly $\to$ upgrades plan for free.
3. **External Adversary with Stolen JWT Session**:
   - *Goal*: Execute direct PostgREST mutations from the browser console.
   - *Attack Path*: Sends `PATCH /rest/v1/profiles` to set `role = 'admin'` $\to$ succeeds due to permissive RLS.

### 13.3 Attack Tree Diagram

```
                              [Root: Hostile Platform Takeover]
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                   │
          [Direct PostgREST Exploitation]                      [Server Action Exploitation]
                    │                                                   │
         ┌──────────┴──────────┐                             ┌──────────┴──────────┐
         │                     │                             │                     │
   [Update RLS on        [Elevate Role in              [Call createAdmin-    [Call updateAdmin-
  admin_staff_members]      profiles]                   StaffMember]          StaffMember]
         │                     │                             │                     │
   (Passes is_admin)     (Passes is_admin)             (Passes require-      (Passes require-
         │                     │                          AdminAuth)            AdminAuth)
         ▼                     ▼                             ▼                     ▼
  [Self-Escalation       [Create Ghost Admin]         [Spawn Rogue Super    [Elevate Account
    to Super Admin]                                        Admin]              to Super Admin]
```

---

## 14. Phased Implementation Plan

Comprehensive 8-Phase roadmap designed for zero downtime and backward compatibility:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          8-PHASE IMPLEMENTATION ROADMAP                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Database Schema & Migration Foundation (Enums, Tables, Triggers, Functions)   │
│ Phase 2: Server-Side Authorization Helpers & Context Typing                            │
│ Phase 3: Administrative Server Action Refactoring (All 33 Admin Actions)               │
│ Phase 4: Database Row Level Security (RLS) Restructuring (All 16 Tables)               │
│ Phase 5: Frontend UI, Sidebar & Component Capability Gating                            │
│ Phase 6: Adversarial Security Test Suite Implementation (16+ Tests)                    │
│ Phase 7: Data Migration, Orphan Reconciliation & Historical Backfill                   │
│ Phase 8: Post-Deployment Verification & Forensic Security Sign-Off                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Phase Specifications

#### Phase 1: Database Schema & Migration Foundation
- **Deliverables**:
  - Create ENUM `public.admin_sub_role` (`'super_admin'`, `'ops_admin'`, `'content_admin'`, `'verification_admin'`, `'support'`).
  - Create ENUM `public.admin_permission` (`'manage_users'`, `'manage_companies'`, `'verify_documents'`, `'manage_vacancies'`, `'analytics_access'`, `'system_settings'`).
  - Create `public.admin_audit_logs` table (`id`, `actor_id`, `action`, `target_id`, `old_values`, `new_values`, `created_at`).
  - Implement SQL helper functions:
    - `public.is_admin(user_id uuid DEFAULT auth.uid())`: Checks active status in `admin_staff_members`.
    - `public.is_super_admin(user_id uuid DEFAULT auth.uid())`: Checks `sub_role = 'super_admin'` and `status = 'active'`.
    - `public.has_admin_permission(perm text, user_id uuid DEFAULT auth.uid())`: Checks permission presence and active status.
  - Implement database triggers:
    - `trg_prevent_self_escalation`: Blocks users from updating their own `sub_role` or `permissions`.
    - `trg_sync_profile_admin_role`: Automatically creates/archives staff records on profile role changes.

#### Phase 2: Server-Side Authorization Helpers & Context Typing
- **Deliverables**:
  - Implement centralized `src/lib/auth/admin-guards.ts`:
    - `requireAdminAuth(options?: { requiredPermission?: AdminPermission; allowedSubRoles?: AdminSubRole[] })`
    - `requireSuperAdmin()`
    - `requirePermission(permission: AdminPermission)`
  - Safe default handling: Any admin profile lacking a staff record resolves to `support` with empty permissions (Least Privilege).
  - Cryptographic impersonation helper in `lib/auth/impersonation.ts` using HMAC tokens.

#### Phase 3: Administrative Server Action Refactoring
- **Deliverables**:
  - Refactor `staff/actions.ts`: Restrict `createAdminStaffMember`, `updateAdminStaffMember`, `deleteAdminStaffMember`, and `toggleAdminStaffStatus` strictly to `requireSuperAdmin()`.
  - Refactor `users/actions.ts`: Restrict `updateUserRole` to `requireSuperAdmin()`; protect user status toggles with `manage_users`.
  - Refactor `verifications/actions.ts`: Enforce `verify_documents` on document downloads and reviews.
  - Refactor `reports/actions.ts`: Enforce `manage_vacancies` and `manage_users`.
  - Refactor `support/actions.ts`: Enforce financial role on `adjustCompanyCredits`.
  - Refactor `modules/company/actions/settings.ts`: Remove unauthenticated subscription self-upgrades; enforce webhook verification.

#### Phase 4: Database Row Level Security (RLS) Restructuring
- **Deliverables**:
  - Restructure `public.admin_staff_members` RLS: SELECT permitted for active staff; INSERT, UPDATE, DELETE restricted strictly to `public.is_super_admin()`.
  - Restructure `public.candidate_private_profiles` RLS: Admin access restricted to `public.has_admin_permission('verify_documents')`.
  - Restructure `public.company_profiles` RLS: Admin modification restricted to `public.has_admin_permission('manage_companies')`.
  - Restructure `public.profiles` role update policy: Restricted to `public.is_super_admin()`.

#### Phase 5: Frontend UI, Sidebar & Component Capability Gating
- **Deliverables**:
  - Create `AdminCapabilityProvider` context wrapping `/dashboard/admin/*`.
  - Update `src/modules/admin/components/app-sidebar.tsx` to conditionally filter menu items based on caller permissions.
  - Disable or hide "Nuevo Administrador", "Editar", and "Dar de Baja" buttons for non-super-admins.
  - Implement clean "403 Acceso Denegado" error boundaries.

#### Phase 6: Adversarial Security Test Suite Implementation
- **Deliverables**:
  - Implement full 16+ test suite in `src/tests/rbac-adversarial.test.ts`.
  - Validate all escalation attack vectors (Cases A through G).

#### Phase 7: Data Migration, Orphan Reconciliation & Historical Backfill
- **Deliverables**:
  - Execute idempotent SQL migration script reconciling existing admin profiles.
  - Assign first initial administrator to `super_admin`; backfill legacy staff records.
  - Verify zero orphaned records remain.

#### Phase 8: Post-Deployment Verification & Forensic Sign-Off
- **Deliverables**:
  - Execute complete test suite (100% PASS).
  - Verify zero TypeScript and ESLint regressions.
  - Validate security invariants against live staging database.

---

## 15. Proposed RBAC Test Matrix

The proposed test suite specifies **18 adversarial test cases** covering all escalation vectors, permission checks, and database boundaries:

| Test ID | Target Attack Vector | Actor Persona | Target Resource / Action | Attack Payload / Action | Expected Result | Invariant Verified |
|---|---|---|---|---|---|:---:|
| **TS-01** | Staff Creation Escalation (Case A) | `support` Admin | `createAdminStaffMember` | `{ subRole: 'super_admin', permissions: ALL }` | ❌ **403 Forbidden / Error** | I2, I4 |
| **TS-02** | Peer Subrole Elevation (Case B) | `support` Admin | `updateAdminStaffMember` | Target: Peer Admin, `subRole: 'super_admin'` | ❌ **403 Forbidden / Error** | I2, I4 |
| **TS-03** | Super Admin Downgrade Sabotage (Case C) | `ops_admin` | `updateAdminStaffMember` | Target: Super Admin, `subRole: 'support'` | ❌ **403 Forbidden / Error** | I2 |
| **TS-04** | Self-Escalation to Super Admin (Case D) | `support` Admin | `updateAdminStaffMember` | Target: Self User ID, `subRole: 'super_admin'` | ❌ **403 Forbidden / Error** | I3 |
| **TS-05** | Super Admin Lockout / Deletion (Case E) | `support` Admin | `deleteAdminStaffMember` | Target: Super Admin User ID | ❌ **403 Forbidden / Error** | I2 |
| **TS-06** | Direct SDK Mutation on Staff Table (Case F) | `support` Admin | PostgREST `admin_staff_members` | `UPDATE admin_staff_members SET sub_role = 'super_admin'` | ❌ **RLS Access Denied (0 rows)**| I5 |
| **TS-07** | Direct SDK Mutation on Profiles Role (Case F) | `ops_admin` | PostgREST `profiles` | `UPDATE profiles SET role = 'admin' WHERE id = target` | ❌ **RLS Access Denied (0 rows)**| I2, I5 |
| **TS-08** | Orphan Admin Auto-Escalation (Case G) | Unmapped Admin | `getAdminStaffMembers` | Fetch staff list with orphan profile in DB | ✅ **Defaults to 'support' (Least Priv)** | I1, I9 |
| **TS-09** | Inactive Staff Server Action Access | Suspended Admin | `getSupportTickets` | Call any admin Server Action while `status='suspended'` | ❌ **403 Forbidden / Session Expired** | I1 |
| **TS-10** | Inactive Staff Direct Database Query | Suspended Admin | PostgREST `support_tickets` | `SELECT * FROM support_tickets` while suspended | ❌ **RLS Access Denied (Empty / Error)** | I1, I5 |
| **TS-11** | User Promotion via User Actions | `ops_admin` | `updateUserRole` | `{ userId: candidateId, newRole: 'admin' }` | ❌ **403 Forbidden / Super Admin Only** | I2, I4 |
| **TS-12** | Unauthorized Private PII Access | `support` Admin | `getCandidateVerificationById` | Read private identity (CURP/RFC) without permission | ❌ **403 Forbidden / PII Redacted** | I8 |
| **TS-13** | Unauthorized Legal Document Approval | `content_admin`| `reviewCompanyVerification` | Approve fiscal dossier without `verify_documents` | ❌ **403 Forbidden / Error** | I4 |
| **TS-14** | Unauthorized Vacancy Deactivation | `support` Admin | `quickDeactivateVacancy` | Deactivate vacancy without `manage_vacancies` | ❌ **403 Forbidden / Error** | I4 |
| **TS-15** | Unauthorized Company Credit Adjustment | `support` Admin | `adjustCompanyCredits` | Grant $1,000 balance without financial authorization | ❌ **403 Forbidden / Error** | I4, I7 |
| **TS-16** | Commercial Self-Subscription Bypass | Regular Company| `updateSubscriptionPlan` | Direct request `{ plan: 'enterprise' }` | ❌ **403 Forbidden / Signature Required** | I7 |
| **TS-17** | Admin-on-Admin Impersonation | `support` Admin | `startImpersonating` | Target: Super Admin User ID | ❌ **403 Forbidden / Blocked by I6** | I6 |
| **TS-18** | Legitimate Super Admin Staff Operations | `super_admin` | `createAdminStaffMember` | `{ subRole: 'ops_admin', permissions: ['manage_users'] }` | ✅ **200 OK / Staff Created** | I2 |

---

## 16. Migration & Compatibility Risks

### 16.1 Zero-Downtime Migration Strategy
To execute the transition without interrupting ongoing operations:
1. **Additive Schema Expansion**: Create new types and columns with nullable defaults before applying strict constraints.
2. **Backfill Execution**: Populate `admin_staff_members` for all existing admin profiles, designating the primary executive account as `super_admin` and operational accounts as `ops_admin`.
3. **Dual-Guard Compatibility Window**: Server helpers temporarily support legacy callers during the rolling deployment of Next.js server containers.
4. **Constraint Enforcement**: Apply NOT NULL, ENUM types, and strict RLS policies after all application code is active.

### 16.2 Backward Compatibility & Rollback Strategy
- **Candidate & Company Workflows**: 100% of candidate discovery, application submission, and company candidate search flows remain completely unaffected (zero schema changes to `applications` or `candidate_profiles`).
- **Rollback Mechanism**: If a critical regression occurs in Phase 4, the database migration script provides an immediate rollback to the legacy `public.is_admin()` definition without data loss.

---

## 17. Final Recommendation & Conclusion

### 17.1 Strategic Summary
The K'anPro platform authorization model currently suffers from a fundamental architectural flaw: a sophisticated visual RBAC hierarchy superimposed over a completely binary backend and database guard. This creates critical vulnerabilities allowing lower-tier administrators to unilaterally seize super-administrative control, delete executive accounts, bypass commercial billing, and access sensitive PII.

### 17.2 Final Verdict
- **Architecture Selected**: **Option B (Defense-in-Depth Hybrid RBAC)** is unanimously recommended. It provides complete protection against all 7 escalation vectors (Cases A–G) and satisfies all 10 security invariants (I1–I10) at minimal performance cost and zero downtime.
- **Immediate Next Steps**:
  1. Authorize Phase 1 Database Migration & SQL Helper Functions.
  2. Implement Phase 2 & 3 Server-side Guards and Action Refactoring.
  3. Deploy Phase 6 Adversarial Test Suite to guarantee zero regressions.

---
*End of Master Technical Report — RBAC Security Audit & Architecture (K'anPro).*
