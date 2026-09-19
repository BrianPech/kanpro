# FORENSIC FINDINGS & ADVERSARIAL SCENARIOS AUDIT REPORT (R5)
**Project**: K'anPro Platform — Post-Hardening RBAC Security Audit  
**Author**: Lead Forensic Findings & Adversarial Scenarios Analyst (`teamwork_preview_explorer_s4`)  
**Audit Scope**: Empirical Forensic Re-evaluation of Findings F-01 through F-22 & 12 Adversarial Attack Scenarios (A through L)  
**Date**: August 27, 2026  
**Integrity Mode**: Read-Only (Empirical Verification & Static/Dynamic Code Analysis)  

---

## 1. Executive Summary

A comprehensive post-hardening forensic security audit was conducted on the K'anPro platform codebase, specifically evaluating the authorization architecture, administrative subroles (`super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`), Row Level Security (RLS) enforcement, Server Actions, impersonation safeguards, and commercial subscription flows.

### Core Audit Outcomes:
1. **Historical Findings Status (F-01 through F-22)**:
   - **CONFIRMED VULNERABLE**: **17 findings** (F-01, F-02, F-03, F-04, F-05, F-06, F-07, F-08, F-09, F-10, F-11, F-12, F-15, F-16, F-17, F-18, F-19).
   - **PARTIALLY FIXED (DB-Mitigated / App Gap)**: **2 findings** (F-13, F-14).
   - **FIXED / HARDENED (INFO)**: **3 findings** (F-20, F-21, F-22).
   - **FALSE POSITIVES / NOT VERIFIABLE**: **0**.
2. **Adversarial Scenarios (A through L)**:
   - **BLOCKED**: 4 Scenarios (Scenario A: Anonymous access, Scenario B: Candidate cross-tenant, Scenario D: Company escalation to admin, Scenario K: JWT vs DB role desync).
   - **MITIGATED (RLS Enforced, App Gaps)**: 1 Scenario (Scenario C: Cross-company tenant data access).
   - **FEASIBLE (Critical / High Exploits)**: 7 Scenarios (Scenario E: Admin-to-SuperAdmin escalation, Scenario F: SuperAdmin lockout/deletion, Scenario G: Admin impersonation hijacking, Scenario H: Admin cookie forgery, Scenario I: Commercial subscription bypass, Scenario J: Sensitive PII harvesting by non-verification staff, Scenario L: Concurrency race condition on staff mutations).

### Overarching Security Posture:
While public entrypoints and external authentication boundaries have been hardened (preventing unauthenticated or candidate role spoofing during signup/OAuth), the internal administrative domain remains essentially **flat / monolithic**. Because `profiles.role = 'admin'` serves as a universal "root" key across Server Actions (`requireAdminAuth`) and PostgreSQL RLS (`public.is_admin()`), administrative subroles and granular permissions operate purely as cosmetic UI metadata. Immediate implementation of Defense-in-Depth RBAC (Option B) is essential.

---

## 2. Forensic Re-evaluation of Historical Findings F-01 through F-22

| Finding ID | Title | Severity | Status | Primary File & Line Anchor | Core Mechanism / Root Cause |
|---|---|---|---|---|---|
| **F-01** | Unrestricted Staff Creation & Escalation to Super Admin | **P0 Critical** | `CONFIRMED` | `src/app/(dashboard)/dashboard/admin/staff/actions.ts:88-250` | Any admin subrole can create root Super Admin accounts using Service Role client |
| **F-02** | Unchecked Staff Mutation & Privilege Elevation | **P0 Critical** | `CONFIRMED` | `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305` | Any admin can modify subrole and permissions of peer admins |
| **F-03** | Self-Escalation to Super Admin | **P0 Critical** | `CONFIRMED` | `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305` | Lower-tier admin can update their own profile ID to `super_admin` |
| **F-04** | Hostile Takeover & Super Admin Deletion | **P0 Critical** | `CONFIRMED` | `src/app/(dashboard)/dashboard/admin/staff/actions.ts:330-354` | Lower-tier admin can delete/demote executive Super Admins to candidate role |
| **F-05** | Direct PostgREST RLS Exploitation on Staff Table | **P0 Critical** | `CONFIRMED` | `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:82-86` | Permissive `is_admin()` policy allows direct client SDK updates to `admin_staff_members` |
| **F-06** | Commercial Subscription Plan Bypass | **P0 Critical** | `CONFIRMED` | `src/modules/company/actions/settings.ts:74-133` | Company user can self-assign Enterprise subscription and fake paid invoices without payment gateway verification |
| **F-07** | Admin-on-Admin Impersonation | **P1 High** | `CONFIRMED` | `src/lib/auth/impersonation.ts:18-99` | Admins can impersonate other admins; cookies lack HMAC cryptographic signature |
| **F-08** | Inactive / Suspended Staff Access Retention | **P1 High** | `CONFIRMED` | `src/app/(dashboard)/dashboard/admin/staff/actions.ts:307-328` | Suspended staff status is decoupled from `profiles.role` and ignored by all guards |
| **F-09** | Unrestricted Account Banning | **P1 High** | `CONFIRMED` | `src/app/(dashboard)/dashboard/admin/reports/actions.ts:135-163` | Any admin subrole can ban user accounts and purge company vacancies |
| **F-10** | Direct Financial Credit Adjustment without Guard | **P1 High** | `CONFIRMED` | `src/app/(dashboard)/dashboard/admin/support/actions.ts:460-487` | Any admin can arbitrarily grant balance credits to company profiles |
| **F-11** | Auto-Escalation of Orphan Admins to Super Admin | **P1 High** | `CONFIRMED` | `src/app/(dashboard)/dashboard/admin/staff/actions.ts:55-85` | Missing `admin_staff_members` records default to `super_admin` with all 6 permissions |
| **F-12** | Candidate Private PII Exposure | **P2 Medium** | `CONFIRMED` | `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:321-326` | CURP, RFC, and Cédula readable by all admin tiers without `verify_documents` permission |
| **F-13** | Missing Company Ownership Check in Employee Management | **P2 Medium** | `PARTIALLY FIXED` | `src/modules/company/actions/employees.ts:9-93` | Mitigated at DB by RLS, but Server Actions lack application-layer company ownership assertions |
| **F-14** | Missing Company Ownership Check in Global Recruitment | **P2 Medium** | `PARTIALLY FIXED` | `src/modules/company/actions/settings.ts:12-37` | Mitigated at DB by RLS on vacancies, but Server Action accepts arbitrary `companyId` |
| **F-15** | Unrestricted Legal Document Verification | **P2 Medium** | `CONFIRMED` | `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:467-601` | Any admin tier can sign URLs and approve corporate fiscal dossiers |
| **F-16** | Incomplete Search Path in Legacy Functions | **P2 Medium** | `CONFIRMED` | `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:8,23` | `is_admin()` and `get_user_role()` use `SET search_path = public` omitting `pg_temp` |
| **F-17** | Internal Ticket Note Exposure | **P3 Low** | `CONFIRMED` | `src/app/(dashboard)/dashboard/admin/support/actions.ts:106,174,287` | All admin tiers can read internal support notes regardless of assignment |
| **F-18** | Unconditional Navigation Display | **P3 Low** | `CONFIRMED` | `src/modules/admin/components/app-sidebar.tsx:40-95` | `AppSidebar` renders all admin modules to all staff tiers |
| **F-19** | Duplicate Inlined Authorization Helpers | **P3 Low** | `CONFIRMED` | 5 action files across `src/app/(dashboard)/dashboard/admin/` | Redundant inlined copies of `requireAdminAuth()` across action files |
| **F-20** | Auth Callback Hardening | **INFO** | `FIXED` | `src/app/(auth)/auth/callback/route.ts:28-36` | OAuth callback and trigger reject public admin role assignment |
| **F-21** | Storage Bucket Folder Security | **INFO** | `FIXED` | `supabase/migrations/20260815192000_fix_storage_objects_rls_policies.sql:14-71` | Avatar and company asset buckets enforce strict folder-based user isolation |
| **F-22** | Public Vacancy Search | **INFO** | `FIXED` | `supabase/migrations/20260815024555_fix_security_definer_views.sql:5-34` | Directory views use `security_barrier = true, security_invoker = true` safely |

---

### Detailed Forensic Profiles: F-01 through F-22

#### Finding F-01: Unrestricted Staff Creation & Escalation to Super Admin
- **Status**: `CONFIRMED`
- **Severity**: **P0 (Critical)**
- **Target File & Lines**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:88-250`
- **Root Cause**: The function `createAdminStaffMember` uses `requireAdminAuth()` (which only checks `profiles.role === 'admin'`). There is no check verifying that the calling user possesses `subRole === 'super_admin'`. Using the service role admin client (`createAdminClient().auth.admin.createUser`), any lower-tier admin (such as a support agent or content moderator) can provision new administrative accounts with `subRole = 'super_admin'` and all permissions enabled.
- **Proof of Vulnerability**: Lines 98 (`await requireAdminAuth()`) and lines 220-234 insert the caller-provided `formData.subRole` without hierarchy validation.
- **Residual Risk**: Complete system compromise via rogue account provisioning.

#### Finding F-02: Unchecked Staff Mutation & Privilege Elevation
- **Status**: `CONFIRMED`
- **Severity**: **P0 (Critical)**
- **Target File & Lines**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305`
- **Root Cause**: `updateAdminStaffMember` does not verify caller authorization or subrole hierarchy before mutating a target staff member's `sub_role`, `permissions`, and `status`.
- **Proof of Vulnerability**: Lines 265 (`await requireAdminAuth()`) and lines 283-301 execute an upsert into `admin_staff_members` using `createAdminClient()` directly applying `formData.subRole` and `formData.permissions`.
- **Residual Risk**: Horizontal and vertical privilege escalation between administrators.

#### Finding F-03: Self-Escalation to Super Admin
- **Status**: `CONFIRMED`
- **Severity**: **P0 (Critical)**
- **Target File & Lines**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305`
- **Root Cause**: `updateAdminStaffMember` lacks an anti-self-modification invariant check (`if (profileId === user.id)`). A support admin can pass their own profile ID as `profileId` and elevate themselves to `super_admin`.
- **Proof of Vulnerability**: Contrast `deleteAdminStaffMember` (which checks `if (user.id === profileId)` on line 333) with `updateAdminStaffMember` which contains no self-check.
- **Residual Risk**: Instant privilege elevation from least-privileged operator to root Super Admin.

#### Finding F-04: Hostile Takeover & Super Admin Deletion
- **Status**: `CONFIRMED`
- **Severity**: **P0 (Critical)**
- **Target File & Lines**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:330-354`
- **Root Cause**: `deleteAdminStaffMember` allows any admin to delete any other admin (including executive Super Admins) and demote their profile role to `'candidate'`. It does not verify that the caller is a `super_admin`, nor does it verify that the target is not a `super_admin`, nor does it guard against deleting the last remaining Super Admin.
- **Proof of Vulnerability**: Lines 330-354 only check `if (user.id === profileId)`. A rogue support admin can delete all executive director accounts.
- **Residual Risk**: Permanent denial of administrative service (executive lockout).

#### Finding F-05: Direct PostgREST RLS Exploitation on Staff Table
- **Status**: `CONFIRMED`
- **Severity**: **P0 (Critical)**
- **Target File & Lines**: `supabase/migrations/20260812000000_admin_staff_management.sql:28-35` and `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:82-86`
- **Root Cause**: The RLS policy on `public.admin_staff_members` is:
  ```sql
  CREATE POLICY "Admins can manage admin staff members"
    ON public.admin_staff_members FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  ```
  And `GRANT ALL ON public.admin_staff_members TO authenticated;`. Since `public.is_admin()` evaluates to `TRUE` for all users with `profiles.role = 'admin'`, any admin user can directly mutate `admin_staff_members` via the Supabase client SDK from the browser, completely bypassing Next.js Server Actions.
- **Proof of Vulnerability**: The SQL definition evaluates only `is_admin()`, granting full table mutation rights to all admin tiers.
- **Residual Risk**: Frontend and Server Action guards can be bypassed via direct PostgREST HTTP calls.

#### Finding F-06: Commercial Subscription Plan Bypass
- **Status**: `CONFIRMED`
- **Severity**: **P0 (Critical)**
- **Target File & Lines**: `src/modules/company/actions/settings.ts:74-133`
- **Root Cause**: `updateSubscriptionPlan(companyId, plan)` directly sets `subscription_plan: plan`, `subscription_status: 'active'`, and `featured_vacancies_allowance: 10` in `company_profiles`, and creates a fake paid invoice record in `company_invoices` with `status: 'paid'`. It does not verify any payment gateway signature, Stripe webhook, or transaction receipt.
- **Proof of Vulnerability**: Lines 100-126 execute database updates and invoice insertions directly without third-party payment confirmation.
- **Residual Risk**: 100% loss of SaaS subscription revenue and unmetered abuse of premium recruitment slots.

#### Finding F-07: Admin-on-Admin Impersonation
- **Status**: `CONFIRMED`
- **Severity**: **P1 (High)**
- **Target File & Lines**: `src/lib/auth/impersonation.ts:18-99`
- **Root Cause**:
  1. `startImpersonating` does not restrict target user roles; lines 94-96 explicitly accommodate `targetProfile.role === 'admin'`.
  2. Cookies (`kanpro_impersonate_user_id`, `kanpro_impersonate_user_role`, etc.) are written as raw plaintext without HMAC cryptographic signature.
- **Proof of Vulnerability**: Lines 56-86 set unsigned cookies and line 94 routes admin impersonation directly to `/dashboard/admin`.
- **Residual Risk**: Account takeover of executive administrators and unauthorized session hijacking.

#### Finding F-08: Inactive / Suspended Staff Access Retention
- **Status**: `CONFIRMED`
- **Severity**: **P1 (High)**
- **Target File & Lines**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:307-328`
- **Root Cause**: `toggleAdminStaffStatus` updates `admin_staff_members.status`, but does not alter `profiles.role` or revoke Supabase Auth sessions. Because all Server Actions and RLS policies rely solely on `profiles.role === 'admin'` or `public.is_admin()`, suspended admins retain 100% operational and database access.
- **Proof of Vulnerability**: `requireAdminAuth` in all action files never queries `admin_staff_members.status`.
- **Residual Risk**: Terminated or rogue employees retain full administrative capability after administrative suspension.

#### Finding F-09: Unrestricted Account Banning
- **Status**: `CONFIRMED`
- **Severity**: **P1 (High)**
- **Target File & Lines**: `src/app/(dashboard)/dashboard/admin/reports/actions.ts:135-163`
- **Root Cause**: `banUserAccount` relies only on `requireAdminAuth()`. Any admin subrole (e.g. support, verification) can permanently ban users and deactivate all vacancies of any company without moderation authority.
- **Proof of Vulnerability**: Line 136 checks only `requireAdminAuth()`.
- **Residual Risk**: Unauthorized business disruption and denial of service for commercial clients.

#### Finding F-10: Direct Financial Credit Adjustment without Guard
- **Status**: `CONFIRMED`
- **Severity**: **P1 (High)**
- **Target File & Lines**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:460-487`
- **Root Cause**: `adjustCompanyCredits` allows any admin tier to grant arbitrary job posting credits to any company profile without financial permissions or auditing.
- **Proof of Vulnerability**: Lines 460-487 mutate `company_profiles.credits_available` after basic `requireAdminAuth()`.
- **Residual Risk**: Unauthorized balance distribution and financial leakage.

#### Finding F-11: Auto-Escalation of Orphan Admins to Super Admin
- **Status**: `CONFIRMED`
- **Severity**: **P1 (High)**
- **Target File & Lines**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:55-85`
- **Root Cause**: In `getAdminStaffMembers()`, if an admin profile in `profiles` lacks a corresponding row in `admin_staff_members`, the code defaults to:
  `subRole: "super_admin"` and assigns all 6 permissions (`manage_users`, `manage_companies`, `verify_documents`, `manage_vacancies`, `analytics_access`, `system_settings`).
- **Proof of Vulnerability**: Lines 63 and 65-72 assign root fallback privileges to uninitialized/orphaned admin accounts.
- **Residual Risk**: Accidental or deliberate orphan admin creation instantly yields root authority.

#### Finding F-12: Candidate Private PII Exposure
- **Status**: `CONFIRMED`
- **Severity**: **P2 (Medium)**
- **Target File & Lines**: `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:321-326, 393-398` and `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:52-56`
- **Root Cause**: `getCandidateVerifications` and `getCandidateVerificationById` fetch CURP, RFC, and Cédula Profesional from `candidate_private_profiles` for any admin user, without checking for the `verify_documents` permission. RLS policy on `candidate_private_profiles` permits all admins via `public.is_admin()`.
- **Proof of Vulnerability**: Lines 321-326 in `verifications/actions.ts` and line 55 in `20260815033000_fix_rls_infinite_recursion_profiles.sql`.
- **Residual Risk**: Regulatory non-compliance under Mexican Data Privacy Law (LFPDPPP).

#### Finding F-13: Missing Company Ownership Check in Employee Management
- **Status**: `PARTIALLY FIXED`
- **Severity**: **P2 (Medium)**
- **Target File & Lines**: `src/modules/company/actions/employees.ts:9-93`
- **Root Cause**: `updateEmployeeStartDate`, `terminateEmployee`, and `reactivateEmployee` check `!user` but omit application-layer verification that `applicationId` belongs to the caller's company.
- **Defense Status**: Mitigated at the PostgreSQL level because the user's client is bound by RLS on `applications`. However, lack of application-level defense-in-depth is an architectural risk.
- **Residual Risk**: Exposure to IDOR if RLS policies are altered.

#### Finding F-14: Missing Company Ownership Check in Global Recruitment
- **Status**: `PARTIALLY FIXED`
- **Severity**: **P2 (Medium)**
- **Target File & Lines**: `src/modules/company/actions/settings.ts:12-37`
- **Root Cause**: `toggleGlobalRecruitment` accepts an arbitrary `companyId` and executes an update without validating `user.id === companyId` in TypeScript.
- **Defense Status**: Mitigated at the DB level by RLS on `vacancies` (`company_id = auth.uid()`), but application returns success even if 0 rows are updated.
- **Residual Risk**: Architectural inconsistency and lack of defensive gating.

#### Finding F-15: Unrestricted Legal Document Verification
- **Status**: `CONFIRMED`
- **Severity**: **P2 (Medium)**
- **Target File & Lines**: `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:128-135, 467-601`
- **Root Cause**: Any admin subrole can sign URLs for documents in storage, approve/reject corporate fiscal dossiers, and verify candidate legal files without having the `verify_documents` permission.
- **Proof of Vulnerability**: All review functions in `verifications/actions.ts` rely solely on `requireAdminAuth()`.
- **Residual Risk**: Improper approval/rejection of sensitive fiscal/legal compliance dossiers.

#### Finding F-16: Incomplete Search Path in Legacy Functions
- **Status**: `CONFIRMED`
- **Severity**: **P2 (Medium)**
- **Target File & Lines**: `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:8,23`
- **Root Cause**: `public.is_admin()` and `public.get_user_role()` declare `SET search_path = public` omitting `pg_temp`.
- **Proof of Vulnerability**: `SET search_path = public` allows `pg_temp` lookup precedence in PostgreSQL.
- **Residual Risk**: Search path hijacking / schema confusion in multi-tenant PostgreSQL setups.

#### Finding F-17: Internal Ticket Note Exposure
- **Status**: `CONFIRMED`
- **Severity**: **P3 (Low)**
- **Target File & Lines**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:106, 174, 287`
- **Root Cause**: Support ticket internal notes (`is_internal_note: true`) are displayed to all admin subroles unconditionally.
- **Proof of Vulnerability**: `getSupportTickets` and `getTicketMessages` format internal notes without checking assignment or support role.
- **Residual Risk**: Leakage of internal staff deliberations to non-support personnel.

#### Finding F-18: Unconditional Navigation Display
- **Status**: `CONFIRMED`
- **Severity**: **P3 (Low)**
- **Target File & Lines**: `src/modules/admin/components/app-sidebar.tsx:40-95`
- **Root Cause**: `AppSidebar` renders links to all administrative modules (Staff, Reports, Users, Verifications, Support, Settings) to all staff regardless of subrole or permissions.
- **Proof of Vulnerability**: Static navigation sections array rendered unconditionally in `app-sidebar.tsx`.
- **Residual Risk**: UI confusion and exposure of administrative attack surfaces to low-tier operators.

#### Finding F-19: Duplicate Inlined Authorization Helpers
- **Status**: `CONFIRMED`
- **Severity**: **P3 (Low)**
- **Target File & Lines**: Duplicated in `staff/actions.ts:8`, `reports/actions.ts:11`, `support/actions.ts:16`, `users/actions.ts:6`, `verifications/actions.ts:101`
- **Root Cause**: Inlined copy-pasted implementations of `requireAdminAuth()` across 5 Server Action files.
- **Proof of Vulnerability**: Identical function definitions across multiple dashboard action files.
- **Residual Risk**: Code divergence, inconsistent security fixes, and maintenance debt.

#### Finding F-20 (INFO): Auth Callback Hardening
- **Status**: `FIXED`
- **Severity**: **INFO**
- **Target File & Lines**: `src/app/(auth)/auth/callback/route.ts:28-36` and `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql`
- **Root Cause / Hardening**: OAuth callback and SQL trigger `handle_new_user()` strictly reject public role spoofing (`role = 'admin'` or `'super_admin'`) and coerce roles strictly to `'candidate'` or `'company'`.
- **Proof of Fix**: Verified by Tests 1, 2, and 4 of `src/__tests__/security/admin-privilege-hardening.test.ts`.
- **Residual Risk**: None.

#### Finding F-21 (INFO): Storage Bucket Folder Security
- **Status**: `FIXED`
- **Severity**: **INFO**
- **Target File & Lines**: `supabase/migrations/20260815192000_fix_storage_objects_rls_policies.sql:14-71`
- **Root Cause / Hardening**: Storage policies enforce folder isolation via `(select auth.uid())::text = (storage.foldername(name))[1]`.
- **Proof of Fix**: Migration SQL policy definition.
- **Residual Risk**: None.

#### Finding F-22 (INFO): Public Vacancy Search
- **Status**: `FIXED`
- **Severity**: **INFO**
- **Target File & Lines**: `supabase/migrations/20260814093811_harden_profile_privacy.sql:83-102` and `20260815024555_fix_security_definer_views.sql:5-34`
- **Root Cause / Hardening**: Public directory views `company_directory` and `candidate_directory` use `security_barrier = true, security_invoker = true` and expose only public non-sensitive fields.
- **Proof of Fix**: Security invoker and barrier configuration in database views.
- **Residual Risk**: None.

---

## 3. Forensic Analysis of 12 Adversarial Attack Scenarios (A through L)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ADVERSARIAL ATTACK SCENARIOS EVALUATION MATRIX                  │
├──────┬──────────────────────────────────────────────────────────┬───────────┬──────────┤
│ ID   │ Scenario Title                                           │ Status    │ Risk     │
├──────┼──────────────────────────────────────────────────────────┼───────────┼──────────┤
│ **A**│ Anonymous unauthenticated attacker accessing admin       │ BLOCKED   │ None     │
│ **B**│ Candidate attempting cross-tenant candidate/job mutation │ BLOCKED   │ None     │
│ **C**│ Company member attempting cross-company data access      │ MITIGATED │ Low (App)│
│ **D**│ Company member attempting privilege escalation to admin  │ BLOCKED   │ None     │
│ **E**│ Standard Admin attempting Super Admin privilege escal.   │ FEASIBLE  │ CRITICAL │
│ **F**│ Standard Admin attempting last Super Admin lockout/del.  │ FEASIBLE  │ CRITICAL │
│ **G**│ Compromised Admin leveraging impersonation to hijack     │ FEASIBLE  │ HIGH     │
│ **H**│ User forging impersonation HMAC tokens                   │ FEASIBLE* │ HIGH     │
│ **I**│ Company user executing commercial subscription plan byp. │ FEASIBLE  │ CRITICAL │
│ **J**│ Malicious user harvesting candidate sensitive PII (CURP) │ FEASIBLE* │ HIGH     │
│ **K**│ Split-brain attack on JWT vs DB profile role synch.      │ BLOCKED   │ Low (DB) │
│ **L**│ Concurrency race condition on admin staff management     │ FEASIBLE  │ MEDIUM   │
└──────┴──────────────────────────────────────────────────────────┴───────────┴──────────┘
*Note: Scenario H is feasible for authenticated admins due to unsigned cookies. Scenario J is feasible for non-verification admins.
```

---

### Scenario A: Anonymous Unauthenticated Attacker Accessing Protected Endpoints
- **Preconditions**: Attacker possesses no authenticated session, cookies, or Supabase JWT token.
- **Step-by-Step Attack Vector**:
  1. Attacker sends HTTP GET requests to `/dashboard/admin`, `/dashboard/admin/staff`, `/dashboard/company`.
  2. The Next.js proxy/middleware and page layouts execute `requireAdmin()` (`src/lib/auth/require-admin.ts`) or `getDashboardSession()`.
  3. `supabase.auth.getUser()` returns `user = null`.
  4. The guard immediately executes `redirect("/login")`.
  5. Attacker attempts to invoke Server Actions directly via POST requests (e.g. `createAdminStaffMember`, `getAdminStaffMembers`).
  6. The Server Action guard `requireAdminAuth()` executes `supabase.auth.getUser()`, detects `user = null`, and throws `Error("No autenticado. Por favor inicie sesión.")`.
- **Feasibility**: **BLOCKED**
- **Exact Code Mechanism & Lines**:
  - `src/lib/auth/require-admin.ts:31-33`
  - `src/app/(dashboard)/dashboard/admin/staff/actions.ts:15-17`
  - `src/lib/supabase/proxy.ts`
- **Residual Risk & Recommendations**: Fully protected. No residual risk.

---

### Scenario B: Candidate User Attempting Cross-Tenant Candidate or Job Data Manipulation
- **Preconditions**: Attacker has a valid authenticated session with `profiles.role = 'candidate'`.
- **Step-by-Step Attack Vector**:
  1. Attacker attempts to modify another candidate's private profile or delete another candidate's application via direct PostgREST SDK.
  2. PostgreSQL RLS on `candidate_private_profiles` (`id = auth.uid()`) and `applications` (`candidate_id = auth.uid()`) blocks cross-tenant reads and writes.
  3. Attacker attempts to invoke administrative Server Actions (`staff`, `reports`, `verifications`).
  4. Server Action `requireAdminAuth()` checks `profile.role !== "admin"` and throws `Error("Acceso denegado: Se requieren permisos de administrador.")`.
- **Feasibility**: **BLOCKED**
- **Exact Code Mechanism & Lines**:
  - `supabase/migrations/20260814093811_harden_profile_privacy.sql:29-32`
  - `src/app/(dashboard)/dashboard/admin/staff/actions.ts:25-27`
  - `src/__tests__/security/admin-privilege-hardening.test.ts:327-372` (Test 7)
- **Residual Risk & Recommendations**: Boundary between candidate and other tenants is firmly enforced.

---

### Scenario C: Company Member Attempting Unauthorized Cross-Company Tenant Data Access
- **Preconditions**: Attacker is an authenticated company user representing Company X (`id = compX`), attempting to access or modify data of Company Y (`id = compY`).
- **Step-by-Step Attack Vector**:
  1. Attacker calls Server Actions `toggleGlobalRecruitment(compY, true)` or `updateEmployeeStartDate(appY, date)`.
  2. The Server Action checks `!user` (passes because user is authenticated), but fails to verify in application code that `user.id === companyId`.
  3. The action executes a database query using the caller's Supabase client.
  4. PostgreSQL RLS on `vacancies` and `applications` evaluates policy `v.company_id = auth.uid()`. Since `compY != compX`, PostgREST updates 0 rows.
  5. The Server Action receives 0 affected rows but returns `{ success: true }`.
- **Feasibility**: **MITIGATED (Blocked at DB level by RLS; Application-level logic gap)**
- **Exact Code Mechanism & Lines**:
  - `src/modules/company/actions/settings.ts:12-37`
  - `src/modules/company/actions/employees.ts:9-93`
- **Residual Risk & Recommendations**: Add explicit application-level assertion `if (companyId !== user.id) throw new Error("No autorizado")` for complete defense-in-depth.

---

### Scenario D: Company Member Attempting Privilege Escalation to Company Owner/Admin
- **Preconditions**: Authenticated company user attempting to escalate their account role to platform `admin`.
- **Step-by-Step Attack Vector**:
  1. Attacker sends a direct PostgREST `PATCH /rest/v1/profiles` payload `{"role": "admin"}`.
  2. PostgreSQL RLS policy `"Users update own profile without role changes"` on `public.profiles` checks:
     `WITH CHECK (id = auth.uid() AND (role = public.get_user_role() OR public.is_admin()))`.
  3. Since the current role in the database is `'company'`, changing `role` to `'admin'` violates the `WITH CHECK` constraint, and the transaction is aborted by PostgreSQL.
  4. Attacker attempts to call `createAdminStaffMember` or `updateUserRole`; `requireAdminAuth()` rejects with authorization error.
- **Feasibility**: **BLOCKED**
- **Exact Code Mechanism & Lines**:
  - `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:46-50`
  - `src/app/(dashboard)/dashboard/admin/staff/actions.ts:25-27`
- **Residual Risk & Recommendations**: RLS policy effectively prevents self-promotion by non-admins.

---

### Scenario E: Standard Admin Attempting Platform-Level Super Admin Privilege Escalation
- **Preconditions**: Attacker possesses a valid authenticated session with `profiles.role = 'admin'` and a lower-tier subrole (e.g. `sub_role = 'support'` or `ops_admin`).
- **Step-by-Step Attack Vector**:
  1. Attacker invokes `updateAdminStaffMember(self.id, { subRole: 'super_admin', permissions: ['manage_users', 'manage_companies', 'verify_documents', 'manage_vacancies', 'analytics_access', 'system_settings'], status: 'active' })`.
  2. `updateAdminStaffMember` executes `requireAdminAuth()`, which passes because `profiles.role === 'admin'`.
  3. The action does NOT check whether the caller is a `super_admin` and does NOT block self-modification (`profileId === user.id`).
  4. The action uses `createAdminClient()` (Service Role) to upsert the attacker's record in `admin_staff_members` with `sub_role = 'super_admin'` and all permissions.
  5. *Alternative Vector*: Attacker issues direct PostgREST SDK call: `supabase.from('admin_staff_members').update({ sub_role: 'super_admin' }).eq('profile_id', self.id)`. The policy `USING (public.is_admin())` evaluates to `TRUE`, allowing the update.
- **Feasibility**: **FEASIBLE (CRITICAL VULNERABILITY)**
- **Exact Code Mechanism & Lines**:
  - `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305`
  - `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:82-86`
- **Residual Risk & Recommendations**: Implement `requireSuperAdmin()` guard, enforce Invariant I3 (anti-self-escalation), and restrict `admin_staff_members` RLS to `is_super_admin()`.

---

### Scenario F: Standard Admin Attempting Last Super Admin Lockout / Deletion
- **Preconditions**: Attacker has an active admin session (`profiles.role = 'admin'`, e.g. `support`). Target is the executive `super_admin`.
- **Step-by-Step Attack Vector**:
  1. Attacker calls `deleteAdminStaffMember(targetSuperAdminProfileId)`.
  2. The function checks `if (user.id === profileId)` (passes, as caller is a different user).
  3. The function does NOT verify caller's subrole, target's subrole, or the count of remaining active Super Admins.
  4. The action uses `createAdminClient()` to delete the target from `admin_staff_members` and downgrade `profiles.role` to `'candidate'`.
  5. The platform executive is stripped of admin access, leaving zero Super Admins on the platform.
- **Feasibility**: **FEASIBLE (CRITICAL VULNERABILITY)**
- **Exact Code Mechanism & Lines**:
  - `src/app/(dashboard)/dashboard/admin/staff/actions.ts:330-354`
- **Residual Risk & Recommendations**: Enforce that only active `super_admin` can delete staff, prevent deleting `super_admin` targets by non-super_admins, and install a database trigger enforcing a minimum quorum of 1 active `super_admin`.

---

### Scenario G: Compromised Admin Leveraging Impersonation to Hijack Super Admin or Company Accounts
- **Preconditions**: Attacker has compromised any admin account (`profiles.role = 'admin'`). Target is a `super_admin` or specific company.
- **Step-by-Step Attack Vector**:
  1. Attacker calls `startImpersonating(targetSuperAdminId)` in `src/lib/auth/impersonation.ts`.
  2. `startImpersonating` validates `adminProfile.role === 'admin'` (passes).
  3. `startImpersonating` does NOT check if `targetProfile.role === 'admin'`; lines 94-96 explicitly accommodate admin targets.
  4. Plaintext unsigned cookies `kanpro_impersonate_user_id`, `kanpro_impersonate_user_role` are set in the response.
  5. The attacker is redirected to `/dashboard/admin` operating under the context of the targeted Super Admin.
- **Feasibility**: **FEASIBLE (HIGH VULNERABILITY)**
- **Exact Code Mechanism & Lines**:
  - `src/lib/auth/impersonation.ts:18-99`
- **Residual Risk & Recommendations**: Enforce Invariant I6: explicitly reject `targetProfile.role === 'admin'`, restrict impersonation initiation to `super_admin` and `support`, and sign cookies with HMAC SHA-256 tokens.

---

### Scenario H: Unauthenticated / Authenticated User Forging Impersonation HMAC Tokens
- **Preconditions**: Attacker seeks to inject arbitrary `kanpro_impersonate_user_id` cookies to hijack user sessions.
- **Step-by-Step Attack Vector**:
  1. Attacker observes that impersonation cookies (`kanpro_impersonate_user_id`) contain raw UUIDs with zero HMAC signature or encryption.
  2. *Case 1 (Unauthenticated/Candidate)*: Attacker sets `kanpro_impersonate_user_id=victim-id`. When `getImpersonationState()` executes, it queries `public.profiles.select("role").eq("id", auth.uid())`. Since the caller is not an admin, it returns `{ isImpersonating: false }`. (Blocked for non-admins).
  3. *Case 2 (Authenticated Admin)*: Attacker is a support admin who sets `kanpro_impersonate_user_id=super_admin_id`. `getImpersonationState()` verifies caller is an admin and accepts the forged cookie ID without verifying cryptographic authenticity.
- **Feasibility**: **FEASIBLE for Admins; BLOCKED for Non-Admins**
- **Exact Code Mechanism & Lines**:
  - `src/lib/auth/impersonation.ts:56-86, 120-160`
- **Residual Risk & Recommendations**: Replace plaintext cookies with cryptographically signed HMAC SHA-256 tokens containing signed actor, target, timestamp, and signature verified via `process.env.AUTH_SECRET`.

---

### Scenario I: Company User Executing Commercial Subscription Plan Bypass (Free Tier to Enterprise)
- **Preconditions**: Attacker has an authenticated company account on the Free/Basic plan.
- **Step-by-Step Attack Vector**:
  1. Attacker invokes Server Action `updateSubscriptionPlan(self.companyId, 'enterprise')` from `src/modules/company/actions/settings.ts`.
  2. The action checks `!user` (passes because user is authenticated).
  3. The action executes `supabase.from("company_profiles").update({ subscription_plan: 'enterprise', subscription_status: 'active', featured_vacancies_allowance: 10, ... }).eq("id", companyId)`.
  4. RLS on `company_profiles` allows the company owner to update their own profile row.
  5. The action inserts an invoice into `company_invoices` with `amount: 3999.00`, `status: 'paid'`.
  6. The company profile is instantly converted to Enterprise tier with 10 featured vacancies and valid invoice receipts without paying any fee.
- **Feasibility**: **FEASIBLE (CRITICAL COMMERCIAL VULNERABILITY)**
- **Exact Code Mechanism & Lines**:
  - `src/modules/company/actions/settings.ts:74-133`
- **Residual Risk & Recommendations**: Remove client-callable plan upgrade actions. All subscription state mutations must be triggered exclusively by cryptographically validated Stripe payment webhooks (Invariant I7).

---

### Scenario J: Malicious User Exploiting RLS Bypass to Harvest Candidate Sensitive PII (CURP/RFC/Cedula)
- **Preconditions**:
  - Case 1: Attacker is a standard company or candidate.
  - Case 2: Attacker is a low-tier admin (e.g. `support` or `content_admin`).
- **Step-by-Step Attack Vector**:
  - *Case 1 (Non-admin)*: Attacker queries `candidate_private_profiles` via PostgREST SDK. Policy `"Candidates manage own private identity"` restricts queries to `id = auth.uid()`. Cross-candidate queries return 0 rows. (Blocked).
  - *Case 2 (Low-tier Admin)*: Attacker with `profiles.role = 'admin'` queries `supabase.from('candidate_private_profiles').select('*')` via SDK or calls `getCandidateVerifications()`. The policy `"Admins manage candidate private identity"` evaluates `public.is_admin()`, which returns `TRUE`.
  - Attacker successfully dumps all candidate private records (CURP, RFC, Cédula Profesional, birth dates).
- **Feasibility**: **FEASIBLE for Non-Verification Admins; BLOCKED for Non-Admins**
- **Exact Code Mechanism & Lines**:
  - `supabase/migrations/20260814093811_harden_profile_privacy.sql:33-36`
  - `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql:52-56`
  - `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:321-326, 393-398`
- **Residual Risk & Recommendations**: Enforce Invariant I8: restrict RLS and Server Action access on `candidate_private_profiles` to `has_admin_permission('verify_documents')` or `is_super_admin()`.

---

### Scenario K: Split-Brain Attack Exploiting JWT vs DB Profile Role Synchronization Lag
- **Preconditions**: Attacker held an admin role that was demoted to candidate in `profiles`, but holds an unexpired JWT token claiming `role = 'admin'`.
- **Step-by-Step Attack Vector**:
  1. Attacker sends requests using the stale JWT to administrative routes or Server Actions.
  2. `requireAdmin()` and `requireAdminAuth()` execute `supabase.auth.getUser()`, followed immediately by `supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()`.
  3. The database returns `role = 'candidate'`.
  4. The guard overrides any JWT metadata claims and rejects the request with an authorization error.
  5. *Note on Inactive Staff*: If the user's status in `admin_staff_members` was changed to `'suspended'` while `profiles.role` remains `'admin'`, the request SUCCEEDS because the guards do not verify `admin_staff_members.status`.
- **Feasibility**: **BLOCKED for `profiles.role` desync; FEASIBLE for `admin_staff_members.status` desync**
- **Exact Code Mechanism & Lines**:
  - `src/lib/auth/require-admin.ts:35-49`
  - `src/__tests__/security/admin-privilege-hardening.test.ts:234-278` (Test 5)
- **Residual Risk & Recommendations**: Extend `requireAdminAuth` and `requireAdmin` to check `admin_staff_members.status === 'active'` atomically.

---

### Scenario L: Concurrency Race Condition on Admin Staff Management and State Mutations
- **Preconditions**: Two simultaneous concurrent administrative requests modifying the same staff member or executing rapid state transitions.
- **Step-by-Step Attack Vector**:
  1. Admin 1 calls `deleteAdminStaffMember(targetId)` while Admin 2 calls `updateAdminStaffMember(targetId, { subRole: 'super_admin', ... })`.
  2. Request 1 deletes the row from `admin_staff_members` and sets `profiles.role = 'candidate'`.
  3. Request 2 concurrently executes `supabaseAdmin.from("admin_staff_members").upsert(...)` and updates `profiles` without row locking or transactional isolation.
  4. The database is left in a corrupted split state: `admin_staff_members` has an active record for `targetId`, while `profiles.role` may be `'candidate'` (or vice-versa), creating an orphan or desynchronized account.
- **Feasibility**: **FEASIBLE (MODERATE CONCURRENCY RISK)**
- **Exact Code Mechanism & Lines**:
  - `src/app/(dashboard)/dashboard/admin/staff/actions.ts:88-250, 252-305, 330-354`
- **Residual Risk & Recommendations**: Encapsulate multi-table staff mutations in PostgreSQL `SECURITY DEFINER` stored procedures (RPCs) using explicit row-level locking (`SELECT ... FOR UPDATE`).

---

## 4. Synthesis & Recommended Remediation Roadmap

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          SYSTEMIC REMEDIATION ROADMAP (PHASED)                         │
├───────┬──────────────────────┬─────────────────────────────────────────────────────────┤
│ Phase │ Priority             │ Scope of Technical Remediations                         │
├───────┼──────────────────────┼─────────────────────────────────────────────────────────┤
│ **1** │ **P0 Immediate**     │ • Implement `requireSuperAdmin()` guard on Staff CRUD   │
│       │ (Day 1–2)            │ • Fix RLS on `admin_staff_members` to `is_super_admin()`│
│       │                      │ • Enforce anti-self-escalation in `updateStaffMember`   │
│       │                      │ • Remove client-side `updateSubscriptionPlan` action    │
├───────┼──────────────────────┼─────────────────────────────────────────────────────────┤
│ **2** │ **P1 Critical Fix**  │ • Cryptographically sign impersonation cookies (HMAC)   │
│       │ (Day 3–4)            │ • Block admin-on-admin impersonation in backend         │
│       │                      │ • Enforce `admin_staff_members.status = 'active'` check │
│       │                      │ • Fix safe fallback defaults for orphan admins          │
│       │                      │ • Guard `banUserAccount` and `adjustCompanyCredits`     │
├───────┼──────────────────────┼─────────────────────────────────────────────────────────┤
│ **3** │ **P2 Granular RBAC** │ • Restrict `candidate_private_profiles` to verification │
│       │ (Day 5–6)            │ • Enforce `verify_documents` permission check           │
│       │                      │ • Patch `SET search_path = public, pg_temp` in SQL funcs│
│       │                      │ • Add company ownership validation in company actions   │
├───────┼──────────────────────┼─────────────────────────────────────────────────────────┤
│ **4** │ **P3 Cleanup & UI**  │ • Centralize `requireAdminAuth` in a single helper      │
│       │ (Day 7)              │ • Filter `AppSidebar` navigation by user capabilities   │
│       │                      │ • Filter internal support notes by assigned staff       │
└───────┴──────────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 5. Verification & Test Suite Execution

All 93 automated tests in the test suite pass with 100% success rate:
- **Test Files**: 9 passed (9)
- **Tests Total**: 93 passed (93)
- **Command**: `npx vitest run`
- **Output Status**: `PASS` (0 failures, 0 regressions)

```
Test Files  9 passed (9)
     Tests  93 passed (93)
  Duration  364ms
```

### Forensic Analyst Sign-off
**Analyst**: Lead Forensic Findings & Adversarial Scenarios Analyst  
**Verification Hash**: `RBAC-FORENSIC-R5-20260827-050744`  
**Status**: AUDIT COMPLETE — FULL REPORT READY