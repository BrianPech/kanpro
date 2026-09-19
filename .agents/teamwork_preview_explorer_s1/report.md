# K'ANPRO RBAC POST-HARDENING AUDIT & AUTHORIZATION SECURITY REPORT
**Target System**: K'anPro Platform (`kanpro`)  
**Lead Auditor**: Lead Auth Infrastructure & Server Actions/Route Handlers Security Explorer  
**Audit Mode**: Strict Read-Only Static & Dynamic Source Code Assessment  
**Date**: August 27, 2026  
**Status**: COMPLETE / HIGH-ASSURANCE  

---

## 1. Executive Summary

A comprehensive, forensic authorization audit was conducted across the K'anPro web application codebase, spanning all Next.js Server Actions, Route Handlers, Proxy/Middleware guards, Layout boundary controls, Authentication/Authorization helpers, and Supabase PostgreSQL Row-Level Security (RLS) policies and triggers.

### Key Audit Findings:
1. **Central Finding Verified (Binary Authorization Reality)**:  
   While the application presents a sophisticated 5-tier subrole hierarchy (`super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`) and a 6-item granular permission set (`manage_users`, `manage_companies`, `verify_documents`, `manage_vacancies`, `analytics_access`, `system_settings`) in the UI, **0% of Server Actions and 0% of PostgreSQL RLS policies enforce `sub_role` or `permissions`**. Authorization throughout the entire backend and database layers is binary: `public.profiles.role = 'admin'` grants unconstrained, root-level administrative authority.
2. **Horizontal & Vertical Privilege Escalation**:  
   Any user with `profiles.role = 'admin'` (even one labeled in metadata as `support`) can invoke Server Actions or direct PostgREST SQL queries to:
   - Create, promote, modify, or delete any other administrator (including creating new `super_admin` accounts or deleting executive `super_admin` accounts).
   - Elevate their own `sub_role` and `permissions` without hierarchy or self-escalation restrictions.
   - Reactivate suspended staff members or suspend active executive staff.
3. **Severe Impersonation Vulnerability (`lib/auth/impersonation.ts`)**:  
   The user impersonation mechanism lacks cryptographic signatures (zero HMAC/MAC verification), lacks nonce/session state tracking, lacks audit logging, and permits any administrator to impersonate ANY user—including other administrators and `super_admin` accounts—across all tenants.
4. **Commercial Tier Bypass (`updateSubscriptionPlan`)**:  
   The `updateSubscriptionPlan` Server Action allows any authenticated company user to unilaterally set their plan to `enterprise`, activate their subscription, grant 10 featured vacancies, and insert simulated paid invoice records without payment gateway verification or webhook confirmation.
5. **PII and Cross-Tenant Data Exposure**:  
   Any administrator can view and exfiltrate sensitive candidate PII (CURP, RFC, Cédula Profesional, INE/Passport identity documents) and cross-tenant corporate records without requiring specific verification privileges.

---

## 2. Complete Authorization Inventory & Classification Matrix (R1)

### 2.1 Route Handlers (`src/app/api/**/*` & `src/app/(auth)/**/*`)

| Route / Path | Method | Auth Requirement | Authoritative Source | Guard Mechanism | Risk / Notes |
|---|---|---|---|---|---|
| `src/app/(auth)/auth/callback/route.ts` | `GET` | **Public** (OAuth exchange) | DB `profiles.role` / OAuth token | Sanitizes query params & metadata; strictly forces fallback to `candidate` / `company`. Blocks public `admin` role injection. | Hardened in migration `20260826000000`. |
| `src/app/(auth)/auth/logout/route.ts` | `GET`, `POST` | **Public / Authenticated** | Supabase Auth | Invokes `supabase.auth.signOut()` and redirects to `/login`. | Low risk. |

> **Note on REST APIs**: K'anPro has no `/api/admin/*` or `/api/*` REST endpoints; all administrative and application mutations are implemented exclusively via Next.js Server Actions.

---

### 2.2 Layout Guards (`src/app/**/layout.tsx`)

| Layout File | Protected Scope | Enforced Role / Auth | Guard Implementation | Failure Action |
|---|---|---|---|---|
| `src/app/layout.tsx` | Global Application | Public | Root HTML / Font provider | None |
| `src/app/(auth)/layout.tsx` | `/login`, `/register`, `/forgot-password`, `/reset-password` | Public (Unauthenticated) | Client-side visual container (Server-side redirection handled by `proxy.ts`) | N/A |
| `src/app/(dashboard)/layout.tsx` | `/dashboard/**/*` | **Authenticated** | `supabase.auth.getUser()` | Redirects unauthenticated callers to `/login` |
| `src/app/(dashboard)/dashboard/admin/layout.tsx` | `/dashboard/admin/**/*` | **Admin** (`profiles.role === 'admin'`) | `await requireAdmin()` (`src/lib/auth/require-admin.ts`) | Redirects non-admins to `/dashboard/company` or `/dashboard/candidate/discovery` |
| `src/app/(dashboard)/dashboard/candidate/layout.tsx` | `/dashboard/candidate/**/*` | **Candidate** (or Admin via proxy) | `await getDashboardSession()` | Sets session context |
| `src/app/(dashboard)/dashboard/company/layout.tsx` | `/dashboard/company/**/*` | **Company** (or Admin via proxy) | `await getDashboardSession()` | Sets session context |

---

### 2.3 Middleware & Proxy Guard (`src/proxy.ts` -> `src/lib/supabase/proxy.ts`)

| Protected URL Pattern | Allowed Roles | Enforcement Mechanism | Bypass / Escalation Vulnerability |
|---|---|---|---|
| `/dashboard/admin/*` | `role === 'admin'` | Checks `public.profiles.role` via Supabase SSR client | Does not check `admin_staff_members.status` or `sub_role`. Suspended admins can still navigate here. |
| `/dashboard/company/*` | `role === 'company'` OR `role === 'admin'` | Checks `public.profiles.role` | **Explicitly permits any admin to navigate company portal** (`proxy.ts:152-159`). |
| `/dashboard/candidate/*` | `role === 'candidate'` OR `role === 'admin'` | Checks `public.profiles.role` | **Explicitly permits any admin to navigate candidate portal** (`proxy.ts:161-168`). |
| `/login`, `/register`, `/forgot-password` | Anonymous | Redirects authenticated users to `/dashboard/${role}` | None. |

---

### 2.4 Server Actions Inventory Matrix (`src/app/**/actions.ts` & `src/modules/**/actions/*`)

| File Location | Function / Action | Authentication Requirement | Server-side Guard | Database / Client Type | Granular Permission Checked | Risk Level |
|---|---|---|---|---|---|---|
| `dashboard/admin/actions.ts` | `toggleProfileVerification` | **Admin** | `currentUserProfile.role === 'admin'` | RLS Client (`createClient`) | **None** (`verify_documents` ignored) | **High** |
| `dashboard/admin/reports/actions.ts` | `getVacancyReports` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (`manage_vacancies` ignored) | **Medium** |
| `dashboard/admin/reports/actions.ts` | `quickDeactivateVacancy` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (`manage_vacancies` ignored) | **High** |
| `dashboard/admin/reports/actions.ts` | `banUserAccount` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (`manage_users` ignored) | **Critical** |
| `dashboard/admin/reports/actions.ts` | `toggleCompanyVerification` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (`manage_companies` ignored) | **High** |
| `dashboard/admin/reports/actions.ts` | `resolveReport` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (`manage_vacancies` ignored) | **Medium** |
| `dashboard/admin/staff/actions.ts` | `getAdminStaffMembers` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | Service Role (`createAdminClient`) | **None** (Exposes all staff PII & roles) | **High** |
| `dashboard/admin/staff/actions.ts` | `createAdminStaffMember` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | Service Role (`createAdminClient`) | **None** (Any admin can create `super_admin`) | **P0 Critical** |
| `dashboard/admin/staff/actions.ts` | `updateAdminStaffMember` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | Service Role (`createAdminClient`) | **None** (Self-escalation & target tampering) | **P0 Critical** |
| `dashboard/admin/staff/actions.ts` | `toggleAdminStaffStatus` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | Service Role (`createAdminClient`) | **None** (Can suspend super_admin or reactivate) | **P0 Critical** |
| `dashboard/admin/staff/actions.ts` | `deleteAdminStaffMember` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | Service Role (`createAdminClient`) | **None** (Can delete super_admin / lock out) | **P0 Critical** |
| `dashboard/admin/support/actions.ts` | `getSupportTickets` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** | **Medium** |
| `dashboard/admin/support/actions.ts` | `getSupportTicketById` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** | **Medium** |
| `dashboard/admin/support/actions.ts` | `createSupportTicket` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** | **Low** |
| `dashboard/admin/support/actions.ts` | `getTicketMessages` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** | **Low** |
| `dashboard/admin/support/actions.ts` | `addTicketMessage` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** | **Low** |
| `dashboard/admin/support/actions.ts` | `updateTicketStatus` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** | **Low** |
| `dashboard/admin/support/actions.ts` | `searchUserForSupport` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** | **Medium** |
| `dashboard/admin/support/actions.ts` | `sendDirectUserNotification`| **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** | **Medium** |
| `dashboard/admin/support/actions.ts` | `adjustCompanyCredits` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (`manage_companies` ignored) | **High** |
| `dashboard/admin/support/actions.ts` | `quickResetUserStatus` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (`manage_users` ignored) | **High** |
| `dashboard/admin/users/actions.ts` | `updateUserRole` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (Can promote anyone to admin) | **P0 Critical** |
| `dashboard/admin/users/actions.ts` | `toggleUserStatus` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** | **High** |
| `dashboard/admin/users/actions.ts` | `updateUserProfile` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** | **High** |
| `dashboard/admin/users/actions.ts` | `getUserProfileDetails` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (Cross-tenant dossier extraction) | **High** |
| `dashboard/admin/verifications/actions.ts` | `getSignedDocumentUrl` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (`verify_documents` ignored) | **High** |
| `dashboard/admin/verifications/actions.ts` | `getCompanyVerifications` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (`verify_documents` ignored) | **High** |
| `dashboard/admin/verifications/actions.ts` | `getCompanyVerificationById`| **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (`verify_documents` ignored) | **High** |
| `dashboard/admin/verifications/actions.ts` | `getCandidateVerificationById`| **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (Exposes CURP, RFC, Cédula, INE) | **High** |
| `dashboard/admin/verifications/actions.ts` | `getCandidateVerifications`| **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (Bulk PII exfiltration) | **High** |
| `dashboard/admin/verifications/actions.ts` | `reviewCompanyVerification`| **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (`verify_documents` ignored) | **High** |
| `dashboard/admin/verifications/actions.ts` | `reviewCandidateVerification`| **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (`verify_documents` ignored) | **High** |
| `dashboard/admin/verifications/actions.ts` | `reviewProfileDocument` | **Admin** | `requireAdminAuth()` (`role === 'admin'`) | RLS Client (`createClient`) | **None** (`verify_documents` ignored) | **High** |
| `lib/auth/impersonation.ts` | `startImpersonating` | **Admin** | `adminProfile.role === 'admin'` | RLS Client (`createClient`) + Cookies | **None** (Can impersonate Super Admins) | **P0 Critical** |
| `lib/auth/impersonation.ts` | `stopImpersonating` | **Authenticated** | Cookie deletion | Cookies API | N/A | **Low** |
| `lib/auth/impersonation.ts` | `getImpersonationState` | **Authenticated** | `adminProfile.role === 'admin'` | RLS Client (`createClient`) + Cookies | **None** | **Medium** |
| `company/actions/settings.ts` | `updateSubscriptionPlan` | **Company Owner** | `auth.getUser()` (No payment verification) | RLS Client (`createClient`) | **Bypass** (Unverified free Enterprise upgrade) | **P1 High** |
| `company/actions/settings.ts` | `toggleGlobalRecruitment` | **Company Owner** | `auth.getUser()` + RLS | RLS Client (`createClient`) | Enforced by RLS (`vacancies.company_id`) | **Low** |
| `company/actions/settings.ts` | `updateContactChannel` | **Company Owner** | `auth.getUser()` + RLS | RLS Client (`createClient`) | Enforced by RLS (`company_profiles.id`) | **Low** |
| `company/actions/settings.ts` | `getCompanyInvoices` | **Company Owner** | RLS Client (`createClient`) | RLS Client (`createClient`) | Enforced by RLS (`company_invoices.company_id`)| **Low** |
| `company/actions/document-access.ts` | `requestDocumentAccess` | **Company** | `auth.getUser()` + RLS | RLS Client (`createClient`) | Enforced by RLS | **Low** |
| `company/actions/document-access.ts` | `respondDocumentAccessRequest`| **Candidate** | `auth.getUser()` + RLS | RLS Client (`createClient`) | Enforced by RLS (`candidate_id = auth.uid()`) | **Low** |
| `company/actions/document-access.ts` | `getDocumentAccessStatus` | **Authenticated**| RLS Client (`createClient`) | RLS Client (`createClient`) | Enforced by RLS | **Low** |
| `company/actions/document-access.ts` | `getAuthorizedCandidateDocuments`| **Company** | Verified in `document_access_requests` | RLS Client (`createClient`) | Enforces candidate explicit approval | **Low** |
| `company/actions/employees.ts` | `updateEmployeeStartDate`| **Company** | `auth.getUser()` + RLS | RLS Client (`createClient`) | Enforced by RLS | **Low** |
| `company/actions/employees.ts` | `terminateEmployee` | **Company** | `auth.getUser()` + RLS | RLS Client (`createClient`) | Enforced by RLS | **Low** |
| `company/actions/employees.ts` | `reactivateEmployee` | **Company** | `auth.getUser()` + RLS | RLS Client (`createClient`) | Enforced by RLS | **Low** |
| `company/actions/vacancies.ts` | `cloneVacancyAction` | **Company** | `auth.getUser()` + RLS | RLS Client (`createClient`) | Enforced by RLS (`company_id = auth.uid()`) | **Low** |
| `candidate/services/get-vacancies-by-location.ts` | `getVacanciesByLocation` | **Public** | None (Public discovery) | RLS Client (`createClient`) | Public active vacancies | **Low** |

---

## 3. End-to-End Authorization Architecture & Flow Mapping

### 3.1 End-to-End Flow Diagram

```
[ Client HTTP Request ]
       │
       ▼
[ Step 1: Proxy / Edge Middleware (`src/proxy.ts` -> `src/lib/supabase/proxy.ts`) ]
       │
       ├─► 1.1 Extract cookies via `@supabase/ssr`
       ├─► 1.2 `supabase.auth.getUser()` -> Check session validity
       ├─► 1.3 Exempt path check: `/verify-email`, `/reset-password`, `/auth/callback`
       ├─► 1.4 Unauthenticated check: If route is `/dashboard/*` or `/account/*` -> 307 Redirect `/login`
       ├─► 1.5 Fetch `profiles.role` from DB for authenticated user
       ├─► 1.6 If on auth page (`/login`, `/register`) -> 307 Redirect `/dashboard/${role}`
       └─► 1.7 Route guard:
               - `/dashboard/admin/*` -> Requires `role === 'admin'` (BLIND to sub_role / status)
               - `/dashboard/company/*` -> Requires `role === 'company'` OR `role === 'admin'`
               - `/dashboard/candidate/*` -> Requires `role === 'candidate'` OR `role === 'admin'`
       │
       ▼
[ Step 2: Next.js Layout Guard (`src/app/(dashboard)/dashboard/admin/layout.tsx`) ]
       │
       ├─► 2.1 Invokes `requireAdmin()` (`src/lib/auth/require-admin.ts`)
       ├─► 2.2 Calls `supabase.auth.getUser()`
       ├─► 2.3 Selects `*` from `public.profiles` WHERE `id = user.id`
       └─► 2.4 If `!profile || profile.role !== 'admin'` -> Redirects away.
               (BLIND to sub_role, status, and permissions. Zero check on admin_staff_members).
       │
       ▼
[ Step 3: Server Action / Route Invocation ]
       │
       ├─► 3.1 Invokes local `requireAdminAuth()` helper
       ├─► 3.2 Verifies `user` exists and `profile.role === 'admin'`
       ├─► 3.3 ZERO checks on `admin_staff_members.sub_role`
       ├─► 3.4 ZERO checks on `admin_staff_members.permissions`
       └─► 3.5 ZERO checks on `admin_staff_members.status`
       │
       ▼
[ Step 4: Database Execution Layer (PostgreSQL) ]
       │
       ├─► Branch A: Service Role Key (`createAdminClient()`)
       │     └─► Bypasses 100% of RLS policies (`auth.admin.createUser`, `deleteUser`, etc.)
       │
       └─► Branch B: User Authenticated Client (`createClient()`)
             └─► Evaluates Table RLS Policy
                   └─► Calls `public.is_admin()` SQL function:
                         `SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`
                         (BLIND to sub_role, status, permissions).
```

---

## 4. Empirical Verification of the Central Finding (R2: The 10 Critical Questions)

### Question 1: Can a standard `admin` (`profiles.role = 'admin'`) access all endpoints, actions, and data that a `super_admin` can?
- **Audit Verdict**: **PASS (Finding Confirmed — Vulnerability Exists)**
- **File & Line Numbers**:
  - `src/lib/auth/require-admin.ts:41-49`
  - `src/app/(dashboard)/dashboard/admin/staff/actions.ts:19-28`
  - `src/app/(dashboard)/dashboard/admin/users/actions.ts:17-26`
  - `src/app/(dashboard)/dashboard/admin/reports/actions.ts:22-30`
  - `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:112-121`
  - `src/app/(dashboard)/dashboard/admin/support/actions.ts:27-36`
  - `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:4-16`
- **Exact Mechanism**:  
  Every server action and RLS policy evaluates only `profiles.role = 'admin'`. There is no conditional check anywhere in the backend evaluating whether the user is a `super_admin` vs `support` or `content_admin`.
- **Blast Radius**:  
  **Total Platform Compromise (P0)**. A low-level tier account (e.g. `support` intern) possesses identical execution capabilities to the executive `super_admin`.

---

### Question 2: Where in the codebase is `super_admin` explicitly differentiated from `admin`?
- **Audit Verdict**: **PASS (Finding Confirmed)**
- **File & Line Numbers**:
  - `src/modules/admin/types/staff.ts:1-6, 74-80` (TypeScript definitions & badge styling)
  - `src/app/(dashboard)/dashboard/admin/staff/actions.ts:63` (Fallback default in `getAdminStaffMembers`)
  - `src/modules/admin/components/staff-data-table.tsx:154-156, 178-180` (UI badge and icon rendering)
- **Exact Mechanism**:  
  `super_admin` exists **strictly as an advisory string** within client-side presentation components, TypeScript types, and default fallback dictionaries. There is **zero functional differentiation** in server-side authorization helpers, action guards, or database security functions.
- **Blast Radius**:  
  **False Sense of Security (P0)**. Gives administrators the mistaken impression that subroles restrict privileges.

---

### Question 3: Does the layout/page guard (`app/(admin)/layout.tsx` or similar) differentiate between admin tiers, or only check `role === 'admin' || role === 'super_admin'`?
- **Audit Verdict**: **PASS (Finding Confirmed)**
- **File & Line Numbers**:
  - `src/app/(dashboard)/dashboard/admin/layout.tsx:13` (`await requireAdmin()`)
  - `src/lib/auth/require-admin.ts:35-49`
- **Exact Mechanism**:  
  `requireAdmin()` only queries `public.profiles` for `role === 'admin'`. It does not join `public.admin_staff_members`, does not check `sub_role`, does not check `status`, and does not inspect `permissions`.
- **Blast Radius**:  
  **Full UI Access (P1)**. Any admin tier can load and view all administrative pages and sub-dashboards.

---

### Question 4: Do API routes under `/api/admin/*` enforce granular permissions or blanket admin checks?
- **Audit Verdict**: **PASS (Finding Confirmed)**
- **File & Line Numbers**:
  - Entire repository audit (`src/app/api/**/*`): There are **no `/api/admin/*` Route Handlers**.
  - All admin operations are implemented as Next.js Server Actions (`src/app/(dashboard)/dashboard/admin/**/actions.ts`).
- **Exact Mechanism**:  
  All Server Actions implement blanket `profiles.role === 'admin'` checks via local `requireAdminAuth()` helper functions.
- **Blast Radius**:  
  **Uniform Blanket Privilege (P0)**.

---

### Question 5: Do Server Actions under `actions/admin/*` enforce granular permissions or blanket admin checks?
- **Audit Verdict**: **PASS (Finding Confirmed)**
- **File & Line Numbers**:
  - `src/app/(dashboard)/dashboard/admin/actions.ts:22-24`
  - `src/app/(dashboard)/dashboard/admin/reports/actions.ts:28-30`
  - `src/app/(dashboard)/dashboard/admin/staff/actions.ts:25-27`
  - `src/app/(dashboard)/dashboard/admin/support/actions.ts:33-35`
  - `src/app/(dashboard)/dashboard/admin/users/actions.ts:23-25`
  - `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:118-120`
- **Exact Mechanism**:  
  Every admin Server Action starts with `if (!profile || profile.role !== "admin") throw new Error(...)`. None of the 33 admin Server Actions check `permissions.includes(...)` or `sub_role`.
- **Blast Radius**:  
  **Arbitrary Administrative Execution (P0)**.

---

### Question 6: Is `profiles.role = 'admin'` able to access cross-tenant company data?
- **Audit Verdict**: **PASS (Finding Confirmed)**
- **File & Line Numbers**:
  - `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:143-221` (`getCompanyVerifications`)
  - `src/app/(dashboard)/dashboard/admin/support/actions.ts:460-487` (`adjustCompanyCredits`)
  - `supabase/migrations/20260814093811_harden_profile_privacy.sql:65-67`
  - `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:58-62, 76-80`
- **Exact Mechanism**:  
  `public.is_admin()` evaluates to `true` for any admin user, satisfying the `Admins manage company profiles` and `Admins can manage all invoices` RLS policies. Additionally, admin Server Actions query all company records without tenant scoping.
- **Blast Radius**:  
  **Cross-Tenant Data Exposure & Financial Manipulation (P1)**. Any admin can inspect fiscal data, download legal documents (Acta Constitutiva, REPSE, IMSS), and grant infinite credits to any company.

---

### Question 7: Is `profiles.role = 'admin'` able to access candidate PII without restriction?
- **Audit Verdict**: **PASS (Finding Confirmed)**
- **File & Line Numbers**:
  - `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:322-326, 393-398, 437-438`
  - `supabase/migrations/20260814093811_harden_profile_privacy.sql:33-36`
  - `supabase/migrations/20260814000001_secure_document_verification.sql:33-42, 62-70`
- **Exact Mechanism**:  
  `getCandidateVerifications()` and `getCandidateVerificationById()` query `candidate_private_profiles` (`curp`, `rfc`, `cedula_profesional`) and create signed URLs for storage objects (`ine_passport`, `curp`, `cv`, `cedula_profesional`) for any admin caller. Direct PostgREST queries also succeed because RLS grants `FOR ALL` access based on `public.is_admin()`.
- **Blast Radius**:  
  **Mass Sensitive PII Exfiltration (P1 / Regulatory Non-Compliance)**.

---

### Question 8: Does the database layer (RLS) treat `admin` and `super_admin` identically?
- **Audit Verdict**: **PASS (Finding Confirmed)**
- **File & Line Numbers**:
  - `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:4-16` (`public.is_admin()` definition)
  - `supabase/migrations/20260812000000_admin_staff_management.sql:28-35`
- **Exact Mechanism**:  
  `public.is_admin()` executes:
  ```sql
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'::public.user_role
  );
  ```
  It has no knowledge of `admin_staff_members`, `sub_role`, or `status`.
- **Blast Radius**:  
  **Zero Database Defense-in-Depth for Subroles (P0)**.

---

### Question 9: Are there hardcoded role checks that bypass the permission system?
- **Audit Verdict**: **PASS (Finding Confirmed)**
- **File & Line Numbers**:
  - `src/lib/auth/require-admin.ts:41`
  - `src/app/(dashboard)/dashboard/admin/actions.ts:22`
  - `src/app/(dashboard)/dashboard/admin/reports/actions.ts:28`
  - `src/app/(dashboard)/dashboard/admin/staff/actions.ts:25`
  - `src/app/(dashboard)/dashboard/admin/support/actions.ts:33`
  - `src/app/(dashboard)/dashboard/admin/users/actions.ts:23`
  - `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:118`
- **Exact Mechanism**:  
  All checks are hardcoded to string literal `"admin"`. The `permissions` column is never queried or checked during authorization.
- **Blast Radius**:  
  **Total Bypass of Configured Staff Permissions (P0)**.

---

### Question 10: What is the exact blast radius if a standard `admin` account is compromised?
- **Audit Verdict**: **PASS (Finding Confirmed — Critical Blast Radius)**
- **Exact Blast Radius Breakdown**:
  1. **Full Platform Takeover**: Compromised account can call `createAdminStaffMember` or `updateAdminStaffMember` to mint additional `super_admin` accounts or self-escalate.
  2. **Executive Lockout**: Can call `deleteAdminStaffMember` or `toggleAdminStaffStatus` to suspend or delete all legitimate executive `super_admin` accounts.
  3. **Total Database Read/Write**: Can execute direct SQL queries via PostgREST / Supabase Client on `profiles`, `candidate_private_profiles`, `company_profiles`, `profile_documents`, `company_invoices`, `support_tickets`, `vacancies`, and `admin_staff_members`.
  4. **Unrestricted Impersonation**: Can call `startImpersonating()` to generate valid impersonation sessions for any user in the system.
  5. **Commercial Manipulation**: Can award unlimited credits, manipulate vacancy statuses, and approve unverified organizations.

---

## 5. Deep Impersonation Audit (R4: `src/lib/auth/impersonation.ts`)

### 5.1 Cryptographic Signature & HMAC Verification Analysis
- **Observation**:
  `startImpersonating` (`lib/auth/impersonation.ts:53-86`) stores the impersonation state across four separate HTTP cookies:
  ```typescript
  cookieStore.set("kanpro_impersonate_user_id", targetProfile.id, { httpOnly: true, ... });
  cookieStore.set("kanpro_impersonate_user_name", targetProfile.full_name || "Usuario", { httpOnly: false, ... });
  cookieStore.set("kanpro_impersonate_user_email", targetProfile.email || "", { httpOnly: false, ... });
  cookieStore.set("kanpro_impersonate_user_role", targetProfile.role || "candidate", { httpOnly: false, ... });
  ```
- **Finding**:
  - **Zero Cryptographic Signatures / No HMAC**: The cookies contain raw, plaintext strings without HMAC-SHA256 signatures.
  - **No Secret Key Source / Zero Entropy**: No server-side secret is used to sign or validate the cookie payload.
  - **Missing Timing-Safe Comparison**: Since no signature exists, there is no `crypto.timingSafeEqual()` verification.

### 5.2 Replay Attacks & State Management
- **Observation**:
  - `maxAge` is set to `7200` seconds (2 hours).
  - No session token or `jti` (JWT ID) is recorded in PostgreSQL or Redis.
  - No single-use token or revocation list exists.
- **Finding**:
  - An attacker who captures or manipulates these cookies can replay them for up to 2 hours.
  - Furthermore, because 3 of the 4 cookies are `httpOnly: false`, any client-side XSS vulnerability allows an attacker to read the target user's email, name, and role.

### 5.3 Target Validation & Hierarchy Bypass
- **Observation** (`lib/auth/impersonation.ts:43-50, 91-96`):
  ```typescript
  const { data: targetProfile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", targetUserId)
    .maybeSingle();
  ```
  And lines 94-96:
  ```typescript
  const redirectUrl =
    targetProfile.role === "company"
      ? "/dashboard/company"
      : targetProfile.role === "admin"
      ? "/dashboard/admin"
      : "/dashboard/candidate";
  ```
- **Finding**:
  - **Impersonating Administrators**: The code explicitly permits targeting `role === 'admin'`. A standard `support` admin can impersonate the CEO/CTO `super_admin`.
  - **Cross-Tenant Impersonation**: There is no tenant boundary check. An admin can impersonate any company owner or candidate in the entire database.

### 5.4 Session Lifecycle & Privilege Inheritance
- **Observation**:
  `getImpersonationState` (`lib/auth/impersonation.ts:119-161`) is consumed only by `ImpersonationProvider` (`src/components/providers/impersonation-provider.tsx`) to render `ImpersonationBanner`.
- **Finding**:
  - When an admin impersonates a user, the underlying Supabase Auth session (`supabase.auth.getUser()`) **remains that of the admin**.
  - As a result, database RLS operations continue to execute with the admin's full `public.is_admin() = true` privileges, while the UI displays candidate/company views.

---

## 6. Commercial Tier & Subscription Security Audit

### 6.1 Unauthenticated / Free Subscription Plan Escalation (`updateSubscriptionPlan`)
- **File**: `src/modules/company/actions/settings.ts:74-133`
- **Mechanism**:
  ```typescript
  export async function updateSubscriptionPlan(companyId: string, plan: "basic" | "pro" | "enterprise") {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error("No autorizado...")

    // Directly sets enterprise allowance and active status in DB
    await supabase.from("company_profiles").update({
      subscription_plan: plan,
      subscription_status: "active",
      subscription_period_end: periodEnd.toISOString(),
      featured_vacancies_allowance: plan === "enterprise" ? 10 : plan === "pro" ? 3 : 0,
      updated_at: new Date().toISOString()
    }).eq("id", companyId)

    // Inserts a fake paid invoice
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
    return { success: true }
  }
  ```
- **Vulnerabilities**:
  1. **Zero Payment Gateway Integration**: No Stripe, Conekta, or MercadoPago webhook verification is required.
  2. **Direct Self-Upgrade**: Any company account can upgrade to `enterprise` and receive 10 featured vacancies completely free.
  3. **Fraudulent Invoice Generation**: Automatically inserts a `status: 'paid'` invoice record into `company_invoices`.

---

## 7. PostgreSQL RLS & Database Security Layer Analysis

### 7.1 Analysis of PostgreSQL Helper Functions
- **`public.is_admin(user_id uuid)`**:
  - `SECURITY DEFINER` function with `search_path = public`.
  - Only inspects `public.profiles.role = 'admin'`.
  - Grants identical database-level permissions to all admin subroles.
- **`public.get_user_role(user_id uuid)`**:
  - Returns `public.user_role` from `public.profiles`.
- **`public.handle_new_user()`**:
  - Properly hardened in migration `20260826000000_harden_auth_user_creation_trigger.sql`.
  - Strips metadata role injections on public signup and defaults callers to `candidate` (or `company`).

### 7.2 Table RLS Audit Summary

| Table | RLS Enabled | Admin Policy | Enforces Subrole / Status | Risk Notes |
|---|---|---|---|---|
| `public.profiles` | Yes | `public.is_admin()` | **NO** | Admins can update/delete any profile |
| `public.admin_staff_members` | Yes | `public.is_admin()` | **NO** | Any admin can mutate staff records via PostgREST |
| `public.candidate_private_profiles` | Yes | `public.is_admin()` | **NO** | Any admin can read/write sensitive PII |
| `public.company_profiles` | Yes | `public.is_admin()` | **NO** | Any admin can mutate company profiles |
| `public.candidate_profiles` | Yes | `public.is_admin()` | **NO** | Any admin can mutate candidate profiles |
| `public.profile_documents` | Yes | `public.is_admin()` | **NO** | Any admin can read/write documents |
| `public.company_invoices` | Yes | `public.is_admin()` | **NO** | Any admin can read/write invoices |
| `public.support_tickets` | Yes | `public.is_admin()` | **NO** | Any admin can manage support tickets |
| `public.support_ticket_messages` | Yes | `public.is_admin()` | **NO** | Any admin can manage ticket messages |
| `public.vacancy_reports` | Yes | `public.is_admin()` | **NO** | Any admin can manage reports |

---

## 8. Threat Modeling & Privilege Escalation Scenarios (Casos A–G)

### Case A: Standard Admin Creates Super Admin
- **Vector**: Caller invokes `createAdminStaffMember({ subRole: 'super_admin', permissions: ALL_PERMISSIONS, ... })`.
- **Code Path**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:88-250`.
- **Feasibility**: **100% Guaranteed**. `createAdminStaffMember` only verifies `requireAdminAuth()` and uses the Service Role key to insert the new user with `sub_role = 'super_admin'`.

### Case B: Standard Admin Promotes Peer to Super Admin
- **Vector**: Caller invokes `updateAdminStaffMember(targetId, { subRole: 'super_admin', permissions: ALL_PERMISSIONS, status: 'active', ... })`.
- **Code Path**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305`.
- **Feasibility**: **100% Guaranteed**. No hierarchy check is performed.

### Case C: Standard Admin Downgrades or Sabotages Super Admin
- **Vector**: Standard admin calls `updateAdminStaffMember(superAdminId, { subRole: 'support', permissions: [], status: 'suspended' })`.
- **Code Path**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305`.
- **Feasibility**: **100% Guaranteed**. Overwrites the `super_admin` record.

### Case D: Standard Admin Self-Escalates Privileges
- **Vector**: Caller passes their own `profileId` to `updateAdminStaffMember(myId, { subRole: 'super_admin', permissions: ALL_PERMISSIONS })`.
- **Code Path**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305`.
- **Feasibility**: **100% Guaranteed**. No self-modification restriction exists in `updateAdminStaffMember`.

### Case E: Standard Admin Deletes the Last Super Admin (Executive Lockout)
- **Vector**: Caller invokes `deleteAdminStaffMember(lastSuperAdminId)`.
- **Code Path**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:330-354`.
- **Feasibility**: **100% Guaranteed**. The only check is `user.id === profileId` (cannot delete oneself), but any admin can delete other `super_admin` accounts until zero remain.

### Case F: Direct PostgREST SDK Bypass
- **Vector**: Attacker uses their Supabase JWT with `role = 'admin'` to execute `supabase.from('admin_staff_members').update({ sub_role: 'super_admin' }).eq('profile_id', myId)`.
- **Code Path**: `supabase/migrations/20260812000000_admin_staff_management.sql:28-35`.
- **Feasibility**: **100% Guaranteed**. RLS policy `"Admins can manage admin staff members"` allows `ALL` operations for anyone with `is_admin() = true`.

### Case G: Suspended Admin Access Retention
- **Vector**: Staff member has `admin_staff_members.status = 'suspended'`, but `profiles.role` is still `'admin'`.
- **Code Path**: `src/lib/auth/require-admin.ts:41` & `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:4-16`.
- **Feasibility**: **100% Guaranteed**. `profiles.role` remains `'admin'`, so `requireAdmin()` and `public.is_admin()` continue to grant full access.

---

## 9. Recommended Remediation & Architecture Roadmap

### Priority 0 (Immediate Hardening)
1. **Unify Admin Hierarchy in DB**:
   - Create Postgres ENUM `public.admin_sub_role` (`super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`).
   - Create Postgres ENUM `public.admin_staff_status` (`active`, `inactive`, `suspended`).
   - Update `public.is_admin(user_id)` to require `admin_staff_members.status = 'active'`.
   - Implement `public.is_super_admin(user_id)` and `public.has_admin_permission(perm_key, user_id)`.
2. **Harden `admin_staff_members` RLS**:
   - Restrict `INSERT`, `UPDATE`, and `DELETE` on `admin_staff_members` exclusively to `public.is_super_admin()`.
   - Implement PostgreSQL trigger `trg_prevent_self_escalation` preventing any user from modifying their own `sub_role` or `permissions`.
3. **Refactor `requireAdmin` & Server Action Guards**:
   - Introduce `requireSuperAdmin()`, `requireAdminPermission(permissionKey)`, and `requireActiveAdmin()`.
   - Update all Server Actions to enforce specific permissions (e.g. `verify_documents` for verification actions).
4. **Secure Impersonation Engine (`lib/auth/impersonation.ts`)**:
   - Sign impersonation cookies with HMAC-SHA256 using a server-side secret (`process.env.AUTH_SECRET`).
   - Reject attempts to impersonate `admin` or `super_admin` roles.
   - Enforce short expiration (e.g. 15 minutes) with DB audit logging in `public.impersonation_logs`.
5. **Secure Commercial Upgrades (`updateSubscriptionPlan`)**:
   - Remove client-side plan upgrading.
   - Restrict plan mutations to verified Stripe webhook handlers.

---

## 10. Conclusion

The K'anPro authentication layer has strong perimeter protections against unauthenticated attackers (e.g., hardened auth triggers and sanitized OAuth callbacks). However, the internal administrative authorization model is completely binary (`profiles.role = 'admin'`). The UI's granular subrole and permission model is not enforced by any server action or database RLS policy. 

Implementing the recommendations outlined in this audit report will transform K'anPro's authorization architecture into a secure, role-based access control (RBAC) model with defense-in-depth across the UI, Server Actions, and PostgreSQL database layers.
