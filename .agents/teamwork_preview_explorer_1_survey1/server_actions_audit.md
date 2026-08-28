# Comprehensive Security Audit: Server Actions & Authentication Architecture

**Target Repository**: K'anPro (`/Users/brianpech/Developer/Commercial/kanpro`)  
**Auditor**: Explorer 1 (Server Actions & Auth Auditor)  
**Date**: August 27, 2026  
**Status**: Completed — Strictly Read-Only Audit

---

## 1. Executive Summary

This report delivers an exhaustive security audit of **100% of the Server Actions, route handlers, authorization helpers, database clients, and administrative operations** in the K'anPro platform.

### Key Audit Conclusions:
1. **Critical RBAC Decoupling**: The administrative UI displays a sophisticated 5-tier subrole hierarchy (`super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`) and a 6-permission granular matrix (`manage_users`, `manage_companies`, `verify_documents`, `manage_vacancies`, `analytics_access`, `system_settings`). However, **0% of Server Actions and PostgreSQL RLS policies enforce `sub_role` or `permissions`**. Authorization is strictly binary: `profiles.role = 'admin'` grants total, unrestricted access to all admin operations and database tables.
2. **Horizontal and Vertical Privilege Escalation (P0 Critical)**: Any user with `profiles.role = 'admin'` (regardless of assigned subrole or permissions) can create, modify, suspend, reactivate, or delete any other administrator, including promoting themselves or new accounts to `super_admin` with all permissions.
3. **Destructive Hostile Takeover Vulnerability (P0 Critical)**: The `deleteAdminStaffMember` action only checks `user.id === profileId` (preventing self-deletion), allowing any lower-tier admin (such as a support agent) to unilaterally revoke administrative access from all `super_admin` directorship accounts.
4. **Orphan Admin Profiles (P0 Critical)**: The `updateUserRole` and `updateUserProfile` actions in `users/actions.ts` update `profiles.role = 'admin'` directly without creating or linking a record in `admin_staff_members`, creating unmanaged "ghost administrators".
5. **Commercial Bypass in Company Settings (P0 Critical)**: The `updateSubscriptionPlan` action allows any company user to assign themselves the "Enterprise" tier, generate fake "paid" invoices, and receive 10 featured vacancies without payment gateway verification.
6. **Administrative Impersonation of Admins (P1 High)**: The `startImpersonating` action allows an administrator to initiate impersonation sessions targeting other administrators, using unsigned cookie payloads.

---

## 2. Inventory & Audit of Server Actions & Endpoints (100% Repository Coverage)

Below is the complete inventory of all 52 Server Actions, server functions, route handlers, and administrative operations identified across the codebase.

### Table Summary of Server Actions & Administrative Operations

| ID | File Path | Function / Operation Name | Auth Guard Mechanism | Database Client Used | Sub-role / Permission Checked? | Tables Touched & RLS Impact | Risk Level |
|---|---|---|---|---|---|---|---|
| **SA-01** | `app/(dashboard)/dashboard/admin/staff/actions.ts` | `getAdminStaffMembers` | Inlined `requireAdminAuth()` | `supabaseAdmin` (Service Role / Bypasses RLS) | ❌ Raw `profiles.role = 'admin'` only | `profiles`, `admin_staff_members` | **P2 Medium** |
| **SA-02** | `app/(dashboard)/dashboard/admin/staff/actions.ts` | `createAdminStaffMember` | Inlined `requireAdminAuth()` | `supabaseAdmin` (Service Role / Bypasses RLS) | ❌ Raw `profiles.role = 'admin'` only | `auth.users`, `profiles`, `admin_staff_members` | **P0 Critical** |
| **SA-03** | `app/(dashboard)/dashboard/admin/staff/actions.ts` | `updateAdminStaffMember` | Inlined `requireAdminAuth()` | `supabaseAdmin` (Service Role / Bypasses RLS) | ❌ Raw `profiles.role = 'admin'` only | `profiles`, `admin_staff_members` | **P0 Critical** |
| **SA-04** | `app/(dashboard)/dashboard/admin/staff/actions.ts` | `toggleAdminStaffStatus` | Inlined `requireAdminAuth()` | `supabaseAdmin` (Service Role / Bypasses RLS) | ❌ Raw `profiles.role = 'admin'` only | `admin_staff_members` | **P1 High** |
| **SA-05** | `app/(dashboard)/dashboard/admin/staff/actions.ts` | `deleteAdminStaffMember` | Inlined `requireAdminAuth()` | `supabaseAdmin` (Service Role / Bypasses RLS) | ❌ Raw `profiles.role = 'admin'` only | `admin_staff_members`, `profiles` | **P0 Critical** |
| **SA-06** | `app/(dashboard)/dashboard/admin/users/actions.ts` | `updateUserRole` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `profiles` | **P0 Critical** |
| **SA-07** | `app/(dashboard)/dashboard/admin/users/actions.ts` | `toggleUserStatus` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `profiles` | **P1 High** |
| **SA-08** | `app/(dashboard)/dashboard/admin/users/actions.ts` | `updateUserProfile` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `profiles` | **P0 Critical** |
| **SA-09** | `app/(dashboard)/dashboard/admin/users/actions.ts` | `getUserProfileDetails` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `profiles`, `candidate_profiles`, `company_profiles`, `profile_documents` | **P2 Medium** |
| **SA-10** | `app/(dashboard)/dashboard/admin/reports/actions.ts` | `getVacancyReports` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `vacancy_reports`, `vacancies`, `company_profiles`, `profiles` | **P3 Low** |
| **SA-11** | `app/(dashboard)/dashboard/admin/reports/actions.ts` | `quickDeactivateVacancy` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `vacancies`, `vacancy_reports` | **P2 Medium** |
| **SA-12** | `app/(dashboard)/dashboard/admin/reports/actions.ts` | `banUserAccount` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `profiles`, `vacancies` | **P1 High** |
| **SA-13** | `app/(dashboard)/dashboard/admin/reports/actions.ts` | `toggleCompanyVerification` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `profiles`, `company_profiles` | **P1 High** |
| **SA-14** | `app/(dashboard)/dashboard/admin/reports/actions.ts` | `resolveReport` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `vacancy_reports` | **P2 Medium** |
| **SA-15** | `app/(dashboard)/dashboard/admin/support/actions.ts` | `getSupportTickets` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `support_tickets`, `profiles`, `support_ticket_messages` | **P3 Low** |
| **SA-16** | `app/(dashboard)/dashboard/admin/support/actions.ts` | `getSupportTicketById` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `support_tickets`, `profiles` | **P3 Low** |
| **SA-17** | `app/(dashboard)/dashboard/admin/support/actions.ts` | `createSupportTicket` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `support_tickets`, `support_ticket_messages`, `profiles` | **P3 Low** |
| **SA-18** | `app/(dashboard)/dashboard/admin/support/actions.ts` | `getTicketMessages` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `support_ticket_messages`, `profiles` | **P3 Low** |
| **SA-19** | `app/(dashboard)/dashboard/admin/support/actions.ts` | `addTicketMessage` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `support_ticket_messages`, `support_tickets`, `notifications` | **P3 Low** |
| **SA-20** | `app/(dashboard)/dashboard/admin/support/actions.ts` | `updateTicketStatus` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `support_tickets` | **P3 Low** |
| **SA-21** | `app/(dashboard)/dashboard/admin/support/actions.ts` | `searchUserForSupport` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `profiles`, `company_profiles` | **P3 Low** |
| **SA-22** | `app/(dashboard)/dashboard/admin/support/actions.ts` | `sendDirectUserNotification` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `notifications` | **P2 Medium** |
| **SA-23** | `app/(dashboard)/dashboard/admin/support/actions.ts` | `adjustCompanyCredits` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `company_profiles` | **P1 High** |
| **SA-24** | `app/(dashboard)/dashboard/admin/support/actions.ts` | `quickResetUserStatus` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `profiles` | **P1 High** |
| **SA-25** | `app/(dashboard)/dashboard/admin/verifications/actions.ts` | `getSignedDocumentUrl` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `storage.objects` (signed URL) | **P2 Medium** |
| **SA-26** | `app/(dashboard)/dashboard/admin/verifications/actions.ts` | `getCompanyVerifications` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `company_profiles`, `profiles`, `profile_documents`, `storage.objects` | **P3 Low** |
| **SA-27** | `app/(dashboard)/dashboard/admin/verifications/actions.ts` | `getCompanyVerificationById` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `company_profiles`, `profiles`, `profile_documents`, `storage.objects` | **P3 Low** |
| **SA-28** | `app/(dashboard)/dashboard/admin/verifications/actions.ts` | `getCandidateVerificationById` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `candidate_profiles`, `profiles`, `candidate_private_profiles`, `profile_documents`, `storage.objects` | **P2 Medium** |
| **SA-29** | `app/(dashboard)/dashboard/admin/verifications/actions.ts` | `getCandidateVerifications` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `candidate_profiles`, `candidate_private_profiles`, `profiles`, `profile_documents`, `storage.objects` | **P2 Medium** |
| **SA-30** | `app/(dashboard)/dashboard/admin/verifications/actions.ts` | `reviewCompanyVerification` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `company_profiles`, `profile_documents`, `profiles`, `notifications` | **P2 Medium** |
| **SA-31** | `app/(dashboard)/dashboard/admin/verifications/actions.ts` | `reviewCandidateVerification` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `profiles`, `profile_documents`, `notifications` | **P2 Medium** |
| **SA-32** | `app/(dashboard)/dashboard/admin/verifications/actions.ts` | `reviewProfileDocument` | Inlined `requireAdminAuth()` | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `profile_documents` | **P2 Medium** |
| **SA-33** | `app/(dashboard)/dashboard/admin/actions.ts` | `toggleProfileVerification` / `toggleCandidateVerification` | Direct `profiles.role === 'admin'` check | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `profiles` | **P2 Medium** |
| **SA-34** | `lib/auth/impersonation.ts` | `startImpersonating` | Direct `profiles.role === 'admin'` check | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `profiles` (reads target and caller) | **P1 High** |
| **SA-35** | `lib/auth/impersonation.ts` | `stopImpersonating` | None (cookie deletion) | None | N/A | None | **INFO** |
| **SA-36** | `lib/auth/impersonation.ts` | `getImpersonationState` | Direct `profiles.role === 'admin'` check | User Client (`createClient()`) | ❌ Raw `profiles.role = 'admin'` only | `profiles` | **INFO** |
| **SA-37** | `modules/candidate/services/get-vacancies-by-location.ts` | `getVacanciesByLocation` | None (public catalog) | User Client (`createClient()`) | N/A | `vacancies`, `profiles`, `company_directory` | **INFO** |
| **SA-38** | `modules/company/actions/document-access.ts` | `requestDocumentAccess` | `auth.getUser()` session check | User Client (`createClient()`) | N/A | `document_access_requests`, `company_profiles`, `notifications` | **P3 Low** |
| **SA-39** | `modules/company/actions/document-access.ts` | `respondDocumentAccessRequest` | `auth.getUser()` + candidate equality | User Client (`createClient()`) | N/A | `document_access_requests` | **P3 Low** |
| **SA-40** | `modules/company/actions/document-access.ts` | `getDocumentAccessStatus` | Relies on RLS | User Client (`createClient()`) | N/A | `document_access_requests` | **P3 Low** |
| **SA-41** | `modules/company/actions/document-access.ts` | `getAuthorizedCandidateDocuments` | `auth.getUser()` + request status | User Client (`createClient()`) | N/A | `document_access_requests`, `profile_documents`, `storage.objects` | **P3 Low** |
| **SA-42** | `modules/company/actions/employees.ts` | `updateEmployeeStartDate` | `auth.getUser()` session check | User Client (`createClient()`) | N/A (Missing company ownership check in JS) | `applications` | **P2 Medium** |
| **SA-43** | `modules/company/actions/employees.ts` | `terminateEmployee` | `auth.getUser()` session check | User Client (`createClient()`) | N/A (Missing company ownership check in JS) | `applications` | **P2 Medium** |
| **SA-44** | `modules/company/actions/employees.ts` | `reactivateEmployee` | `auth.getUser()` session check | User Client (`createClient()`) | N/A (Missing company ownership check in JS) | `applications` | **P2 Medium** |
| **SA-45** | `modules/company/actions/settings.ts` | `toggleGlobalRecruitment` | `auth.getUser()` session check | User Client (`createClient()`) | N/A (Takes `companyId` param without equality check) | `vacancies` | **P2 Medium** |
| **SA-46** | `modules/company/actions/settings.ts` | `updateContactChannel` | `auth.getUser()` session check | User Client (`createClient()`) | N/A (Takes `companyId` param without equality check) | `company_profiles` | **P2 Medium** |
| **SA-47** | `modules/company/actions/settings.ts` | `updateSubscriptionPlan` | `auth.getUser()` session check | User Client (`createClient()`) | N/A (Commercial bypass / free self-upgrades) | `company_profiles`, `company_invoices` | **P0 Critical** |
| **SA-48** | `modules/company/actions/settings.ts` | `getCompanyInvoices` | Relies on RLS | User Client (`createClient()`) | N/A | `company_invoices` | **P3 Low** |
| **SA-49** | `modules/company/actions/vacancies.ts` | `revalidateVacancies` | None (Cache purge only) | None | N/A | None | **INFO** |
| **SA-50** | `modules/company/actions/vacancies.ts` | `cloneVacancyAction` | `auth.getUser()` + `company_id = user.id` | User Client (`createClient()`) | N/A | `vacancies` | **INFO** |
| **SA-51** | `app/(auth)/auth/callback/route.ts` | `GET (Auth Callback)` | OAuth Code exchange | User Client (`createClient()`) | Hardened (Blocks `role=admin`) | `profiles`, `candidate_profiles`, `company_profiles` | **INFO** |
| **SA-52** | `app/(auth)/auth/logout/route.ts` | `GET / POST (Auth Logout)` | None (Sign out) | User Client (`createClient()`) | N/A | Auth session | **INFO** |

---

## 3. Deep-Dive Analysis of Administrative Operations & Critical Vulnerabilities

### 3.1. Staff Management Vulnerabilities (`app/(dashboard)/dashboard/admin/staff/actions.ts`)

#### 1. `createAdminStaffMember` (Vulnerability: P0 Critical)
- **Code Path**: Lines 88–250
- **Mechanism**:
  - The guard `requireAdminAuth()` only tests `profiles.role === 'admin'`.
  - The function uses `supabaseAdmin = createAdminClient()` (Service Role Key), bypassing all RLS policies.
  - The function accepts `subRole: AdminSubRole` and `permissions: AdminPermissionKey[]` directly from the client.
- **Exploitation Impact**: A newly hired staff member assigned to `support` with zero permissions can invoke `createAdminStaffMember` with `subRole: "super_admin"` and `permissions: ["system_settings", "manage_users", ...]` to spawn secondary rogue super-admin accounts or upgrade other admins.

#### 2. `updateAdminStaffMember` (Vulnerability: P0 Critical)
- **Code Path**: Lines 252–305
- **Mechanism**:
  - Operates via Service Role client.
  - Updates both `profiles` and `admin_staff_members` for the target `profileId`.
  - No check ensures that caller `sub_role` outranks the target `sub_role`.
  - No check prevents self-escalation (`caller.id === profileId`).
- **Exploitation Impact**: Any administrator can escalate their own account to `super_admin`, grant themselves every permission key in `ALL_PERMISSIONS`, and reactivate suspended staff members.

#### 3. `deleteAdminStaffMember` (Vulnerability: P0 Critical)
- **Code Path**: Lines 330–354
- **Mechanism**:
  - Checks only: `if (user.id === profileId) throw new Error(...)`.
  - Executes `supabaseAdmin.from("admin_staff_members").delete().eq("profile_id", profileId)` and `supabaseAdmin.from("profiles").update({ role: "candidate" }).eq("id", profileId)`.
- **Exploitation Impact**: An insider or compromised admin account can iterate over all director/super_admin IDs and demote every super administrator to a candidate, permanently locking the executive team out of the administration portal.

---

### 3.2. User Management Vulnerabilities (`app/(dashboard)/dashboard/admin/users/actions.ts`)

#### 1. `updateUserRole` & `updateUserProfile` (Vulnerability: P0 Critical)
- **Code Path**: Lines 30–52 and Lines 92–111
- **Mechanism**:
  - Updates `profiles.role` to `'admin'`.
  - Does NOT create an entry in `admin_staff_members`.
  - Operates using the user-context client, which succeeds because `public.is_admin()` evaluates to `true` in PostgreSQL RLS.
- **Exploitation Impact**: Creates "Ghost Administrators" (profiles with `role = 'admin'` but no `admin_staff_members` metadata). These users bypass all staff directory auditing while having full access to all admin dashboards and backend actions.

---

### 3.3. Commercial Bypass in Company Settings (`modules/company/actions/settings.ts`)

#### 1. `updateSubscriptionPlan` (Vulnerability: P0 Critical)
- **Code Path**: Lines 74–133
- **Mechanism**:
  - Accepts `companyId` and `plan: "basic" | "pro" | "enterprise"`.
  - Directly mutates `company_profiles` setting `subscription_plan: plan`, `subscription_status: "active"`, `featured_vacancies_allowance: 10`.
  - Inserts an invoice into `company_invoices` marked `status: "paid"` without any Stripe / payment gateway callback, webhook validation, or server-side price verification.
- **Exploitation Impact**: Any registered company can immediately grant itself enterprise subscription privileges and featured vacancy quotas for free.

---

### 3.4. Impersonation Security Architecture (`lib/auth/impersonation.ts`)

#### 1. `startImpersonating` (Vulnerability: P1 High)
- **Code Path**: Lines 18–99
- **Mechanism**:
  - Checks caller `profiles.role === 'admin'`.
  - Target role redirection logic explicitly accommodates `targetProfile.role === 'admin' ? '/dashboard/admin' : ...`.
  - Stores `kanpro_impersonate_user_id` as an unencrypted, unsigned plain cookie value.
- **Vulnerability**:
  - An admin can impersonate another admin or a `super_admin`.
  - The cookie lacks cryptographic signature (HMAC token) linking it to the specific administrative session.

---

## 4. Analysis of Authorization Helpers & Framework Architecture

### 4.1. `requireAdmin()` in `src/lib/auth/require-admin.ts`
```typescript
export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    redirect(profile?.role === "company" ? "/dashboard/company" : "/dashboard/candidate/discovery");
  }

  return { user, role: "admin", profile };
}
```
**Step-by-Step Analysis & Weaknesses**:
1. Invokes `supabase.auth.getUser()`, which validates the JWT against Supabase Auth using the user session cookies.
2. Queries `profiles` table filtered by `user.id`.
3. Verifies `profile.role === 'admin'`.
4. **Weakness**: Does NOT join or query `admin_staff_members`. Returns `{ user, role: 'admin', profile }` with no knowledge of `sub_role`, `permissions`, or `status`. An administrator whose staff status is `"suspended"` will continue to be allowed into `/dashboard/admin/*` as long as `profiles.role` remains `'admin'`.

### 4.2. Inlined `requireAdminAuth()` in Action Files
In each of `reports/actions.ts`, `staff/actions.ts`, `support/actions.ts`, `users/actions.ts`, and `verifications/actions.ts`, a local copy of `requireAdminAuth()` is defined:
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
**Weakness**:
- Code duplication across 5 separate modules.
- Inconsistent return types (`{ supabase, user }` vs `{ user }`).
- Zero validation of `admin_staff_members.status`, `sub_role`, or specific permission keys.

### 4.3. `createAdminClient()` in `src/lib/supabase/admin.ts`
- Operates strictly server-side using `SUPABASE_SERVICE_ROLE_KEY`.
- Correctly configured with `persistSession: false`, `autoRefreshToken: false`.
- **Architectural Risk**: When called inside Server Actions (like `staff/actions.ts`), it completely bypasses RLS. If the calling Server Action does not perform exhaustive RBAC authorization before executing queries, the Service Role client will execute any arbitrary mutation requested.

### 4.4. `updateSession()` in `src/lib/supabase/proxy.ts`
- Evaluates routes during Next.js server requests.
- Queries `profiles.role` and enforces that non-admins cannot access `/dashboard/admin*`.
- **Weakness**: Does not differentiate sub-paths (e.g. `/dashboard/admin/staff` or `/dashboard/admin/settings`) based on `sub_role` or permissions.

---

## 5. Forensic Analysis: Admin $\to$ Super Admin Escalation Vectors (Casos A–G)

| Case | Attack Vector | Code Path & Vulnerability | Can RLS Block It? | Impact & Severity |
|---|---|---|---|---|
| **Caso A** | Admin creates a new `super_admin` | `staff/actions.ts:createAdminStaffMember` uses Service Role client without checking caller subrole. | ❌ NO (Service Role key bypasses all RLS). | **P0 Critical**: Complete horizontal and vertical creation of root accounts. |
| **Caso B** | Admin modifies subrole/permissions of another admin | `staff/actions.ts:updateAdminStaffMember` accepts arbitrary `subRole` and `permissions` for any `profileId`. | ❌ NO (Service Role key bypasses RLS). | **P0 Critical**: Any admin can demote a super_admin or elevate an accomplice. |
| **Caso C** | Admin self-escalates permissions / subrole | `staff/actions.ts:updateAdminStaffMember` has no self-mutation block. An admin passes their own `profileId`. | ❌ NO (Service Role key bypasses RLS). | **P0 Critical**: Instant self-promotion to `super_admin` with all permissions. |
| **Caso D** | Admin deletes / disables a `super_admin` | `staff/actions.ts:deleteAdminStaffMember` only checks `user.id === profileId`, allowing deletion of all other admins. | ❌ NO (Service Role key bypasses RLS). | **P0 Critical**: Hostile administrative lockout and destruction of executive access. |
| **Caso E** | Admin promotes candidate/company via `users/actions.ts` | `users/actions.ts:updateUserRole` updates `profiles.role = 'admin'`. | ❌ NO (RLS `public.is_admin()` allows all admins full UPDATE on `profiles`). | **P0 Critical**: Unaudited ghost admins created without staff records. |
| **Caso F** | Direct SDK manipulation from client browser | Client invokes `supabase.from('admin_staff_members').update({ sub_role: 'super_admin' })`. | ❌ NO (`20260815033000` RLS policy `Admins can manage admin staff members` uses `public.is_admin()`). | **P0 Critical**: Bypasses Server Actions entirely via direct PostgREST calls. |
| **Caso G** | Admin-on-Admin Impersonation | `lib/auth/impersonation.ts:startImpersonating` allows target profile to have `role === 'admin'`. | ❌ NO (Checks only that caller is an admin). | **P1 High**: Lower-tier admin impersonates executive staff with unsigned cookies. |

---

## 6. Real Role Semantics vs. UI Facade

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DATABASE LAYER                                       │
│                                                                                        │
│  public.profiles.role = 'admin'                                                        │
│  └── Grants ALL access via public.is_admin() in RLS & Server Actions.                  │
│                                                                                        │
│  public.admin_staff_members                                                            │
│  ├── sub_role: 'super_admin' | 'ops_admin' | 'content_admin' | ...   [PURELY INFORMATIVE]
│  ├── permissions: ['manage_users', 'verify_documents', ...]          [PURELY INFORMATIVE]
│  └── status: 'active' | 'inactive' | 'suspended'                     [NOT ENFORCED]    │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  BACKEND LOGIC LAYER                                   │
│                                                                                        │
│  requireAdminAuth() / requireAdmin()                                                   │
│  └── Checks ONLY: profile.role === 'admin'                                             │
│  └── Checks 'sub_role'? NO.                                                            │
│  └── Checks 'permissions'? NO.                                                         │
│  └── Checks 'status === active'? NO.                                                   │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND UI LAYER                                    │
│                                                                                        │
│  UI shows granular badges, permission counts, and subrole labels,                      │
│  BUT all sidebar links, actions, and buttons are accessible to ANY admin.              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Conclusion on Role & Permission Semantics**:
- `profiles.role = 'admin'` is the **sole source of authority** throughout the entire backend and database.
- `admin_staff_members.sub_role` and `admin_staff_members.permissions` are currently **cosmetic metadata**: they drive visual pills and badges in the UI, but enforce zero access boundaries in Server Actions or RLS.
- `admin_staff_members.status`: Setting a staff member to `"inactive"` or `"suspended"` updates the table, but the user continues to have full administrative access because neither the auth proxy, `requireAdmin()`, nor Server Actions verify `status === 'active'`.

---

## 7. Recommended RBAC Architecture & Invariant Blueprint

To transition from the current binary model to a robust, enterprise-grade RBAC architecture, the following design principles must be implemented in future phases:

### 7.1. Proposed Security Invariants
1. **Invariant I-1 (Staff Liveness & Verification)**: Every administrative request must verify that `admin_staff_members.status === 'active'`. Suspended or inactive staff members must be denied immediately.
2. **Invariant I-2 (Granular Permission Enforcement)**: Every Server Action and admin endpoint must enforce its required permission key (e.g. `manage_users`, `verify_documents`, `system_settings`) rather than checking raw `profiles.role === 'admin'`.
3. **Invariant I-3 (Super Admin Hierarchy Protection)**: Only an active `super_admin` may create, update, elevate, suspend, or delete another staff member. Lower-tier subroles cannot modify staff accounts.
4. **Invariant I-4 (Self-Escalation Prevention)**: No administrator may alter their own `sub_role`, `permissions`, or `status`.
5. **Invariant I-5 (Impersonation Scoping)**: Administrators can only impersonate candidates or companies; impersonation of other administrators is strictly forbidden.
6. **Invariant I-6 (RLS Parity with PostgreSQL Functions)**: PostgreSQL RLS policies must check helper functions that validate subroles and permissions (e.g. `public.has_permission('verify_documents')`), preventing direct SDK bypass.
7. **Invariant I-7 (Payment & Commercial Integrity)**: Subscription upgrades in `settings.ts` must require cryptographically verified webhook signatures from the payment provider.

---

## 8. Summary of Findings by Priority

- **P0 Critical (5 Findings)**:
  - Unrestricted Staff Creation & Escalation to Super Admin (`staff/actions.ts:createAdminStaffMember`).
  - Unrestricted Self-Escalation & Subrole/Permission Mutation (`staff/actions.ts:updateAdminStaffMember`).
  - Hostile Takeover & Unrestricted Super Admin Deletion (`staff/actions.ts:deleteAdminStaffMember`).
  - Ghost Administrator Creation via Role Updating (`users/actions.ts:updateUserRole` & `updateUserProfile`).
  - Commercial Bypass / Free Subscription Upgrade (`modules/company/actions/settings.ts:updateSubscriptionPlan`).
- **P1 High (5 Findings)**:
  - Admin-on-Admin Impersonation (`lib/auth/impersonation.ts:startImpersonating`).
  - Unrestricted Account Suspension of Admins (`users/actions.ts:toggleUserStatus`).
  - Unchecked Staff Status Toggling (`staff/actions.ts:toggleAdminStaffStatus`).
  - Arbitrary Account Banning without Moderation Permission (`reports/actions.ts:banUserAccount`).
  - Direct Financial Credit Adjustment without Permission (`support/actions.ts:adjustCompanyCredits`).
- **P2 Medium (12 Findings)**:
  - PII & Sensitive Document Exposure to all Admin Subroles (`verifications/actions.ts`, `users/actions.ts`).
  - Inactive / Suspended Staff Bypass of Layout & Route Guards (`proxy.ts`, `require-admin.ts`).
  - Missing Company ID Ownership Check in Employee Actions (`employees.ts`).
  - Missing Company ID Ownership Check in Global Recruitment Toggle (`settings.ts`).
  - Unrestricted Document Signing and Badge Granting across all Admin Tiers.
- **P3 Low & INFO (30 Findings)**:
  - Read queries, cache revalidations, public vacancy search, and properly hardened auth callback handlers.

---
*End of Server Actions & Auth Security Audit Report.*
