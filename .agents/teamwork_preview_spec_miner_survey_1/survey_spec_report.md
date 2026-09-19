# Comprehensive Admin Actions & RBAC Specification Mining Report

**Project**: K'anPro — Defense-in-Depth RBAC Hardening  
**Target File**: `survey_spec_report.md`  
**Date**: 2026-08-27  
**Status**: Final Forensic & Specification Mining Document  
**Auditor**: Admin Actions Spec Miner (Teamwork Subagent)

---

## 1. Executive Summary

A comprehensive architectural and forensic inspection was performed across the entire K'anPro repository (`/Users/brianpech/Developer/Commercial/kanpro`) to locate, analyze, and catalog all **33 administrative Server Actions** across the 6 core admin action modules (`actions.ts`, `reports/actions.ts`, `staff/actions.ts`, `support/actions.ts`, `users/actions.ts`, `verifications/actions.ts`), along with associated privileged operations (Impersonation engine, Company billing/tenant actions, and PostgreSQL RLS security barriers).

### Key Architectural Findings:
1. **The "Admin = Root" Paradigm**: In the current implementation, every administrative Server Action relies exclusively on a monolithic check: `profiles.role === 'admin'`. There is **zero server-side enforcement** of administrative subroles (`ops_admin`, `content_admin`, `verification_admin`, `support`) or granular permission keys (`manage_users`, `manage_companies`, `verify_documents`, `manage_vacancies`, `analytics_access`, `system_settings`).
2. **Critical Privilege Escalation (Cases A–G)**: Any administrator with `profiles.role = 'admin'` (even a tier-1 `support` or `content_admin`) can:
   - Create new `super_admin` accounts via `createAdminStaffMember`.
   - Self-promote to `super_admin` and grant themselves all permissions via `updateAdminStaffMember`.
   - Demote, suspend, or delete other administrators, including the last active `super_admin` via `deleteAdminStaffMember` or `toggleAdminStaffStatus`.
   - Elevate any candidate or company to `role = 'admin'` via `updateUserRole` or `updateUserProfile`.
3. **Insecure Split-Brain Default**: In `getAdminStaffMembers()` (`staff/actions.ts:63-72`), orphan admin profiles (having `profiles.role = 'admin'` but no row in `admin_staff_members`) are automatically defaulted to `subRole: 'super_admin'` with all 6 permissions enabled, violating the Fail-Closed security invariant.
4. **Inactive / Suspended Account Bypass**: The `admin_staff_members.status` field (`'active' | 'inactive' | 'suspended'`) is stored as metadata but **is never verified in `requireAdminAuth()` or `requireAdmin()`**. A suspended administrator retains full execution access across all Server Actions and all PostgreSQL RLS policies.
5. **PII and Storage Object Leaks**: Sensitive candidate data in `candidate_private_profiles` (`curp`, `rfc`, `cedula_profesional`) and private signed URLs in storage are accessible to any administrator without checking the `verify_documents` permission.
6. **Commercial Plan Bypass**: In `modules/company/actions/settings.ts`, `updateSubscriptionPlan` allows any authenticated user to set `subscription_plan = 'enterprise'` with 10 featured vacancies and generate fake paid invoices without payment gateway validation.
7. **Unsigned Impersonation & Admin-to-Admin Impersonation**: `startImpersonating` in `lib/auth/impersonation.ts` sets un-signed, malleable cookies, allows impersonating `admin` users, and lacks continuous session revalidation.

---

## 2. Exhaustive Catalog of Admin Server Actions (33 Core Actions)

The 33 core admin server actions are organized by module below.

```
src/app/(dashboard)/dashboard/admin/
├── actions.ts                  (2 actions: 1 unique + 1 alias)
├── reports/actions.ts          (5 actions)
├── staff/actions.ts            (5 actions)
├── support/actions.ts          (10 actions)
├── users/actions.ts            (4 actions)
└── verifications/actions.ts    (8 actions)
                                ────────────────
                        Total:  34 actions (33 unique + 1 alias)
```

---

### Module 1: General Admin Operations (`src/app/(dashboard)/dashboard/admin/actions.ts`)

#### Action 1: `toggleProfileVerification`
- **File**: `src/app/(dashboard)/dashboard/admin/actions.ts:6-40`
- **Target Entity**: `public.profiles` (`is_verified` column)
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`, `ops_admin`
- **Required Permission**: `verify_documents` (or `manage_users`)
- **Current Auth Check**:
  ```ts
  const { data: currentUserProfile, error: profileErr } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profileErr || !currentUserProfile || currentUserProfile.role !== "admin") {
    throw new Error("Acceso denegado: Se requieren permisos de administrador.");
  }
  ```
- **Vulnerabilities & Missing Checks**:
  - Missing active status check (`admin_staff_members.status = 'active'`).
  - Missing orphan admin check (fail-closed).
  - Missing permission check (`verify_documents`). Any admin subrole (e.g. `support`) can toggle verification.

#### Action 2: `toggleCandidateVerification` (Alias)
- **File**: `src/app/(dashboard)/dashboard/admin/actions.ts:43`
- **Target Entity**: `public.profiles` (`is_verified`)
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`
- **Required Permission**: `verify_documents`
- **Current Auth Check**: Alias export of `toggleProfileVerification`.
- **Vulnerabilities**: Identical to `toggleProfileVerification`.

---

### Module 2: Moderation & Vacancy Reports (`src/app/(dashboard)/dashboard/admin/reports/actions.ts`)

#### Action 3: `getVacancyReports`
- **File**: `src/app/(dashboard)/dashboard/admin/reports/actions.ts:35-101`
- **Target Entity**: `public.vacancy_reports`, `public.vacancies`, `public.company_profiles`, `public.profiles`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `content_admin`, `support`
- **Required Permission**: `manage_vacancies` or `analytics_access`
- **Current Auth Check**: Helper `requireAdminAuth()` verifying `profiles.role === 'admin'`.
- **Vulnerabilities & Missing Checks**:
  - No verification of `admin_staff_members.status = 'active'`. Suspended admins can read all reports.
  - No permission check.

#### Action 4: `quickDeactivateVacancy`
- **File**: `src/app/(dashboard)/dashboard/admin/reports/actions.ts:104-132`
- **Target Entity**: `public.vacancies` (`is_active = false`, `status = 'hidden'`), `public.vacancy_reports` (`status = 'action_taken'`)
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `content_admin`
- **Required Permission**: `manage_vacancies`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**:
  - Missing `status = 'active'` check.
  - Missing permission check (`manage_vacancies`). A `support` or `verification_admin` can take down active vacancies without authorization.

#### Action 5: `banUserAccount`
- **File**: `src/app/(dashboard)/dashboard/admin/reports/actions.ts:135-163`
- **Target Entity**: `public.profiles` (`is_verified = false`, `location = 'SUSPENDIDO / BANEADO por ...'`), `public.vacancies` (`is_active = false`, `status = 'banned'`)
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`
- **Required Permission**: `manage_users`
- **Current Auth Check**: `requireAdminAuth()`. Checks `user.id !== userId` (self-ban check).
- **Vulnerabilities & Missing Checks**:
  - **Critical Horizontal Ban Vulnerability**: Does NOT verify if `userId` is another administrator. A low-level admin (`support`, `content_admin`) can ban a `super_admin`'s account.
  - Insecure status persistence: encodes ban state inside the `location` text column rather than a dedicated status field.
  - Missing `status = 'active'` check.

#### Action 6: `toggleCompanyVerification`
- **File**: `src/app/(dashboard)/dashboard/admin/reports/actions.ts:166-195`
- **Target Entity**: `public.profiles` (`is_verified`), `public.company_profiles` (`verification_status = 'approved' | 'pending'`)
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`, `ops_admin`
- **Required Permission**: `manage_companies` or `verify_documents`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**:
  - Missing `status = 'active'` check.
  - Any subrole can grant verified badge without checking company documents.

#### Action 7: `resolveReport`
- **File**: `src/app/(dashboard)/dashboard/admin/reports/actions.ts:198-216`
- **Target Entity**: `public.vacancy_reports` (`status`, `action_taken`)
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `content_admin`
- **Required Permission**: `manage_vacancies`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**:
  - Missing `status = 'active'` check.
  - Missing `manage_vacancies` permission validation.

---

### Module 3: Admin Staff Lifecycle & Permissions (`src/app/(dashboard)/dashboard/admin/staff/actions.ts`)

#### Action 8: `getAdminStaffMembers`
- **File**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:32-86`
- **Target Entity**: `public.profiles` (`role = 'admin'`), `public.admin_staff_members`
- **Intended RBAC Subrole**: `super_admin` (full management), `ops_admin` (read only)
- **Required Permission**: `system_settings` / `super_admin`
- **Current Auth Check**: `requireAdminAuth()`. Uses `createAdminClient()`.
- **Vulnerabilities & Missing Checks**:
  - **P0 CRITICAL — SPLIT-BRAIN AUTO-PROMOTION**: Lines 63–72:
    ```ts
    subRole: (s?.sub_role as AdminSubRole) || "super_admin",
    permissions: (s?.permissions as AdminPermissionKey[]) || [
      "manage_users", "manage_companies", "verify_documents",
      "manage_vacancies", "analytics_access", "system_settings",
    ],
    ```
    If an admin has no row in `admin_staff_members`, this action defaults them to `super_admin` with all 6 permissions.
  - Exposes staff personal details (whatsapp, emails) to all admin subroles.

#### Action 9: `createAdminStaffMember`
- **File**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:88-250`
- **Target Entity**: `auth.users`, `public.profiles`, `public.admin_staff_members`
- **Intended RBAC Subrole**: `super_admin` ONLY
- **Required Permission**: `super_admin`
- **Current Auth Check**: `requireAdminAuth()`. Uses `createAdminClient()`.
- **Vulnerabilities & Missing Checks**:
  - **P0 CRITICAL — VERTICAL ESCALATION (Case A & C)**: Any admin (including `support`, `content_admin`, `ops_admin`) can invoke this action and create a new user with `subRole: 'super_admin'` and arbitrary permissions.
  - No actor hierarchy check (`actor.subRole === 'super_admin'`).
  - No active status check (`actor.status === 'active'`). Suspended admins can spawn new admins.

#### Action 10: `updateAdminStaffMember`
- **File**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305`
- **Target Entity**: `public.profiles`, `public.admin_staff_members`
- **Intended RBAC Subrole**: `super_admin` ONLY
- **Required Permission**: `super_admin`
- **Current Auth Check**: `requireAdminAuth()`. Uses `createAdminClient()`.
- **Vulnerabilities & Missing Checks**:
  - **P0 CRITICAL — SELF-PROMOTION (Case B)**: An admin with `subRole: 'support'` can call `updateAdminStaffMember(self.id, { subRole: 'super_admin', permissions: ['all...'], status: 'active' })` to grant themselves root privileges.
  - **P0 CRITICAL — LATERAL/VERTICAL HIJACK (Case B & D)**: An admin can downgrade or alter permissions of other administrators or super administrators.
  - Missing `status = 'active'` check.

#### Action 11: `toggleAdminStaffStatus`
- **File**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:307-328`
- **Target Entity**: `public.admin_staff_members` (`status = 'active' | 'inactive' | 'suspended'`)
- **Intended RBAC Subrole**: `super_admin` ONLY
- **Required Permission**: `super_admin`
- **Current Auth Check**: `requireAdminAuth()`. Uses `createAdminClient()`.
- **Vulnerabilities & Missing Checks**:
  - **P0 CRITICAL — ADMINISTRATIVE LOCKOUT (Case E & F)**: A non-super admin can suspend the only active `super_admin` in the system, creating total lockout.
  - A suspended admin can toggle their own status back to `active`.
  - No check for caller `status = 'active'`.

#### Action 12: `deleteAdminStaffMember`
- **File**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:330-354`
- **Target Entity**: `public.admin_staff_members` (DELETE), `public.profiles` (`role = 'candidate'`)
- **Intended RBAC Subrole**: `super_admin` ONLY
- **Required Permission**: `super_admin`
- **Current Auth Check**: `requireAdminAuth()`. Checks `user.id !== profileId`.
- **Vulnerabilities & Missing Checks**:
  - **P0 CRITICAL — LAST SUPER ADMIN DESTRUCTION (Case E)**: Any admin can delete the last remaining `super_admin` in the database.
  - Any non-super admin can delete higher-tier admins.
  - Missing `status = 'active'` check.

---

### Module 4: Technical Support & Helpdesk Operations (`src/app/(dashboard)/dashboard/admin/support/actions.ts`)

#### Action 13: `getSupportTickets`
- **File**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:44-57`
- **Target Entity**: `public.support_tickets`, `public.profiles`, `public.support_ticket_messages`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `support`
- **Required Permission**: `manage_users` (or support access)
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**: Missing `status = 'active'` check.

#### Action 14: `getSupportTicketById`
- **File**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:125-186`
- **Target Entity**: `public.support_tickets`, `public.profiles`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `support`
- **Required Permission**: `manage_users` (or support access)
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**: Missing `status = 'active'` check.

#### Action 15: `createSupportTicket`
- **File**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:191-252`
- **Target Entity**: `public.support_tickets`, `public.support_ticket_messages`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `support`
- **Required Permission**: `manage_users`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**: Missing `status = 'active'` check.

#### Action 16: `getTicketMessages`
- **File**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:257-298`
- **Target Entity**: `public.support_ticket_messages`, `public.profiles`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `support`
- **Required Permission**: `manage_users`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**: Missing `status = 'active'` check.

#### Action 17: `addTicketMessage`
- **File**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:304-351`
- **Target Entity**: `public.support_ticket_messages`, `public.support_tickets`, `public.notifications`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `support`
- **Required Permission**: `manage_users`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**: Missing `status = 'active'` check.

#### Action 18: `updateTicketStatus`
- **File**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:356-384`
- **Target Entity**: `public.support_tickets` (`status`, `priority`)
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `support`
- **Required Permission**: `manage_users`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**: Missing `status = 'active'` check.

#### Action 19: `searchUserForSupport`
- **File**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:389-433`
- **Target Entity**: `public.profiles`, `public.company_profiles`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `support`, `verification_admin`
- **Required Permission**: `manage_users` or `manage_companies`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**:
  - Missing `status = 'active'` check.
  - Returns sensitive user contact info and company credits to any subrole without filtering.

#### Action 20: `sendDirectUserNotification`
- **File**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:438-455`
- **Target Entity**: `public.notifications`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `support`
- **Required Permission**: `manage_users`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**: Missing `status = 'active'` check; missing granular permission check.

#### Action 21: `adjustCompanyCredits`
- **File**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:460-487`
- **Target Entity**: `public.company_profiles` (`credits_available`)
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`
- **Required Permission**: `manage_companies` (or `system_settings`)
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**:
  - **P1 HIGH — FINANCIAL/CREDIT ABUSE**: Any admin subrole (including `support` or `content_admin`) can add arbitrary credits (`credits_available += N`) to any company without payment or supervisor authorization.
  - No audit log recorded.
  - Missing `status = 'active'` check.

#### Action 22: `quickResetUserStatus`
- **File**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:492-507`
- **Target Entity**: `public.profiles` (`is_verified`)
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`, `ops_admin`
- **Required Permission**: `verify_documents` or `manage_users`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**:
  - Bypasses document verification checklist (allows marking user verified without approving documents).
  - Missing `status = 'active'` check.

---

### Module 5: User & Role Administration (`src/app/(dashboard)/dashboard/admin/users/actions.ts`)

#### Action 23: `updateUserRole`
- **File**: `src/app/(dashboard)/dashboard/admin/users/actions.ts:30-52`
- **Target Entity**: `public.profiles` (`role = 'admin' | 'candidate' | 'company'`)
- **Intended RBAC Subrole**: `super_admin` ONLY
- **Required Permission**: `super_admin` / `system_settings`
- **Current Auth Check**: `requireAdminAuth()`. Checks `userId === user.id && newRole !== 'admin'`.
- **Vulnerabilities & Missing Checks**:
  - **P0 CRITICAL — PRIVILEGE ESCALATION TO ADMIN**: Any admin can promote any candidate or company to `role = 'admin'`. Combined with the orphan default bug in `getAdminStaffMembers`, this grants immediate root `super_admin` access!
  - Any admin can demote other administrators.
  - Missing `status = 'active'` check.

#### Action 24: `toggleUserStatus`
- **File**: `src/app/(dashboard)/dashboard/admin/users/actions.ts:54-90`
- **Target Entity**: `public.profiles` (`location`, `is_verified`)
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`
- **Required Permission**: `manage_users`
- **Current Auth Check**: `requireAdminAuth()`. Checks `userId === user.id && newStatus !== 'active'`.
- **Vulnerabilities & Missing Checks**:
  - Low-privilege admin can suspend other users or admins.
  - Encodes status in `location` column string instead of a dedicated status enum.
  - Missing `status = 'active'` check.

#### Action 25: `updateUserProfile`
- **File**: `src/app/(dashboard)/dashboard/admin/users/actions.ts:92-111`
- **Target Entity**: `public.profiles` (`full_name`, `role`)
- **Intended RBAC Subrole**: `super_admin` (for role), `ops_admin`/`support` (for name)
- **Required Permission**: `manage_users` (name) / `super_admin` (role)
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**:
  - Any admin can change any user's role to `'admin'` via user details form.
  - Missing `status = 'active'` check.

#### Action 26: `getUserProfileDetails`
- **File**: `src/app/(dashboard)/dashboard/admin/users/actions.ts:113-144`
- **Target Entity**: `public.profiles`, `public.candidate_profiles`, `public.company_profiles`, `public.profile_documents`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `verification_admin`, `support`
- **Required Permission**: `manage_users` or `verify_documents`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**:
  - Returns complete uploaded document records to any admin subrole.
  - Missing `status = 'active'` check.

---

### Module 6: Verification & Sensitive Dossiers (`src/app/(dashboard)/dashboard/admin/verifications/actions.ts`)

#### Action 27: `getSignedDocumentUrl`
- **File**: `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:128-135`
- **Target Entity**: `storage.objects` (`profile_documents` bucket)
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`
- **Required Permission**: `verify_documents`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**:
  - **P1 HIGH — PII STORAGE LEAK**: Any admin without `verify_documents` permission (e.g. `support`, `content_admin`) can generate signed URLs to download sensitive files (INE, CURP certificates, Tax Constancias, Cédulas).
  - Missing `status = 'active'` check.

#### Action 28: `getCompanyVerifications`
- **File**: `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:140-222`
- **Target Entity**: `public.company_profiles`, `public.profiles`, `public.profile_documents`
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`, `ops_admin`
- **Required Permission**: `manage_companies` or `verify_documents`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**: Missing `status = 'active'` check; missing permission check.

#### Action 29: `getCompanyVerificationById`
- **File**: `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:227-297`
- **Target Entity**: `public.company_profiles`, `public.profiles`, `public.profile_documents`
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`, `ops_admin`
- **Required Permission**: `manage_companies` or `verify_documents`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**: Missing `status = 'active'` check; missing permission check.

#### Action 30: `getCandidateVerificationById`
- **File**: `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:302-374`
- **Target Entity**: `public.candidate_profiles`, `public.profiles`, `public.candidate_private_profiles`, `public.profile_documents`
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`
- **Required Permission**: `verify_documents`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**:
  - **P1 HIGH — CANDIDATE PII EXPOSURE**: Directly reads `candidate_private_profiles` (`curp`, `rfc`, `cedula_profesional`) without requiring `verify_documents` permission.
  - Missing `status = 'active'` check.

#### Action 31: `getCandidateVerifications`
- **File**: `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:379-462`
- **Target Entity**: `public.candidate_profiles`, `public.profiles`, `public.candidate_private_profiles`, `public.profile_documents`
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`
- **Required Permission**: `verify_documents`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**:
  - **P1 HIGH — MASS PII EXPOSURE**: Performs bulk extraction of private candidate identities (`curp`, `rfc`, `cedula_profesional`) across the entire database for any admin.
  - Missing `status = 'active'` check.

#### Action 32: `reviewCompanyVerification`
- **File**: `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:467-533`
- **Target Entity**: `public.company_profiles` (`verification_status`), `public.profiles` (`is_verified`), `public.notifications`
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`, `ops_admin`
- **Required Permission**: `verify_documents`
- **Current Auth Check**: `requireAdminAuth()`. Checks that all documents are approved before granting badge.
- **Vulnerabilities & Missing Checks**: Missing permission check (`verify_documents`); missing `status = 'active'` check.

#### Action 33: `reviewCandidateVerification`
- **File**: `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:538-586`
- **Target Entity**: `public.profiles` (`is_verified`), `public.notifications`
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`
- **Required Permission**: `verify_documents`
- **Current Auth Check**: `requireAdminAuth()`. Checks document approval.
- **Vulnerabilities & Missing Checks**: Missing `verify_documents` permission check; missing `status = 'active'` check.

#### Action 34: `reviewProfileDocument`
- **File**: `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:588-601`
- **Target Entity**: `public.profile_documents` (`status = 'approved' | 'rejected'`, `rejection_reason`)
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`
- **Required Permission**: `verify_documents`
- **Current Auth Check**: `requireAdminAuth()`.
- **Vulnerabilities & Missing Checks**: Missing `verify_documents` check; missing `status = 'active'` check.

---

## 3. Related Privileged Actions & Modules

### Module 7: Impersonation Engine (`src/lib/auth/impersonation.ts`)

#### Action 35: `startImpersonating(targetUserId: string)`
- **File**: `src/lib/auth/impersonation.ts:18-99`
- **Target**: Client HTTP Cookies (`kanpro_impersonate_user_id`, etc.)
- **Intended RBAC Subrole**: `super_admin`, `support` (strictly authorized)
- **Required Permission**: `manage_users` (with super_admin policy)
- **Current Auth Check**: Checks `profiles.role === 'admin'`.
- **Vulnerabilities (P0 Critical)**:
  1. **Unsigned Plaintext Cookies**: Cookies lack HMAC-SHA256 signatures and cryptographic nonce.
  2. **Admin-to-Admin Impersonation**: Code in lines 90–96 explicitly handles `targetProfile.role === "admin"`, allowing a low-tier admin to impersonate a `super_admin`!
  3. **No Continuous Revalidation**: Session does not verify in proxy/middleware whether the issuing admin remains active or was suspended.
  4. **No Audit Logging**: No database audit trail of impersonation sessions.
  5. **Self-Impersonation Allowed**: No check that `user.id !== targetUserId`.

#### Action 36: `stopImpersonating()`
- **File**: `src/lib/auth/impersonation.ts:104-114`
- **Current Auth Check**: Deletes cookies.

#### Action 37: `getImpersonationState()`
- **File**: `src/lib/auth/impersonation.ts:119-161`
- **Current Auth Check**: Checks `profiles.role === 'admin'`. Does not check `admin_staff_members.status`.

---

### Module 8: Company Billing & Commercial Bypass (`src/modules/company/actions/settings.ts`)

#### Action 38: `updateSubscriptionPlan(companyId: string, plan: "basic" | "pro" | "enterprise")`
- **File**: `src/modules/company/actions/settings.ts:74-133`
- **Target Entity**: `public.company_profiles` (`subscription_plan`, `subscription_status`, `featured_vacancies_allowance`), `public.company_invoices`
- **Intended RBAC Subrole**: `super_admin` ONLY or Stripe Webhook
- **Current Auth Check**: Only checks `auth.getUser()`.
- **Vulnerabilities (P0 Critical — Commercial Bypass)**:
  1. **Self-Assigned Enterprise Plan**: Any authenticated company user can upgrade to `enterprise`, gain 10 featured vacancies, and insert a fake `'paid'` invoice without paying.
  2. **Cross-Tenant Mutation**: Does NOT assert `companyId === user.id`. Company A can alter the plan of Company B.

---

### Module 9: Company Workforce & Tenant Isolation (`src/modules/company/actions/employees.ts`)

#### Actions 39–41: `updateEmployeeStartDate`, `terminateEmployee`, `reactivateEmployee`
- **File**: `src/modules/company/actions/employees.ts:9-93`
- **Target Entity**: `public.applications` (`notes`, `status`)
- **Current Auth Check**: `auth.getUser()`.
- **Vulnerabilities (P2 Medium — Tenant Isolation)**:
  - Missing company ownership assertion (`application.vacancy.company_id === user.id`).

---

## 4. Formal RBAC Permissions Matrix

The formal mapping of administrative subroles to explicit permissions, default access sets, and protected Server Actions is defined as follows:

| Subrole Key | Subrole Label | Base Permissions Set | Executive Bypass | Allowed Server Actions Scope |
|---|---|---|:---:|---|
| `super_admin` | Super Administrador | `manage_users`, `manage_companies`, `verify_documents`, `manage_vacancies`, `analytics_access`, `system_settings` | **YES** | **100% of all Server Actions** (1–38), staff lifecycle, role promotions, system configuration. |
| `ops_admin` | Admin de Operaciones | `manage_users`, `manage_companies`, `manage_vacancies`, `analytics_access` | NO | User moderation, company approval, vacancy management, report resolution, support ticket management, analytics. **BLOCKED**: Staff management, role promotion to admin, private PII reading. |
| `content_admin` | Admin de Contenido | `manage_vacancies`, `analytics_access` | NO | Vacancy deactivation (`quickDeactivateVacancy`), vacancy report resolution (`resolveReport`), metrics inspection (`getAdminDashboardMetrics`). **BLOCKED**: User/company mutations, staff actions, verification actions. |
| `verification_admin` | Agente de Verificación | `verify_documents`, `manage_users`, `manage_companies` | NO | Dossier audits, document review (`reviewProfileDocument`, `reviewCandidateVerification`, `reviewCompanyVerification`), signed doc URLs (`getSignedDocumentUrl`), candidate private profile reads (`getCandidateVerificationById`). **BLOCKED**: Vacancy deactivation, staff management, role promotion. |
| `support` | Soporte Técnico | `manage_users` (limited) | NO | Support ticket operations (13–18), user search (`searchUserForSupport`), send direct notification (`sendDirectUserNotification`), controlled impersonation (with HMAC). **BLOCKED**: Staff mutations, credit adjustment, vacancy modifications, document verification, role changes. |

---

### Detailed Action $\times$ Permission Requirement Matrix

| # | Action Name | Module File | Required Subrole / Permission | Risk Level | Target Entity |
|---|---|---|---|:---:|---|
| 1 | `toggleProfileVerification` | `admin/actions.ts` | `verify_documents` | Medium | `public.profiles` |
| 2 | `toggleCandidateVerification` | `admin/actions.ts` | `verify_documents` | Medium | `public.profiles` |
| 3 | `getVacancyReports` | `reports/actions.ts` | `manage_vacancies` | Low | `public.vacancy_reports` |
| 4 | `quickDeactivateVacancy` | `reports/actions.ts` | `manage_vacancies` | High | `public.vacancies` |
| 5 | `banUserAccount` | `reports/actions.ts` | `manage_users` | **Critical** | `public.profiles`, `vacancies` |
| 6 | `toggleCompanyVerification` | `reports/actions.ts` | `manage_companies` | Medium | `public.company_profiles` |
| 7 | `resolveReport` | `reports/actions.ts` | `manage_vacancies` | Low | `public.vacancy_reports` |
| 8 | `getAdminStaffMembers` | `staff/actions.ts` | `super_admin` / `system_settings` | High | `public.admin_staff_members` |
| 9 | `createAdminStaffMember` | `staff/actions.ts` | `super_admin` ONLY | **P0 Critical** | `auth.users`, `admin_staff_members` |
| 10 | `updateAdminStaffMember` | `staff/actions.ts` | `super_admin` ONLY | **P0 Critical** | `public.admin_staff_members` |
| 11 | `toggleAdminStaffStatus` | `staff/actions.ts` | `super_admin` ONLY | **P0 Critical** | `public.admin_staff_members` |
| 12 | `deleteAdminStaffMember` | `staff/actions.ts` | `super_admin` ONLY | **P0 Critical** | `public.admin_staff_members` |
| 13 | `getSupportTickets` | `support/actions.ts` | `manage_users` (or support) | Low | `public.support_tickets` |
| 14 | `getSupportTicketById` | `support/actions.ts` | `manage_users` (or support) | Low | `public.support_tickets` |
| 15 | `createSupportTicket` | `support/actions.ts` | `manage_users` (or support) | Low | `public.support_tickets` |
| 16 | `getTicketMessages` | `support/actions.ts` | `manage_users` (or support) | Low | `public.support_ticket_messages` |
| 17 | `addTicketMessage` | `support/actions.ts` | `manage_users` (or support) | Low | `public.support_ticket_messages` |
| 18 | `updateTicketStatus` | `support/actions.ts` | `manage_users` (or support) | Low | `public.support_tickets` |
| 19 | `searchUserForSupport` | `support/actions.ts` | `manage_users` | Medium | `public.profiles` |
| 20 | `sendDirectUserNotification` | `support/actions.ts` | `manage_users` | Medium | `public.notifications` |
| 21 | `adjustCompanyCredits` | `support/actions.ts` | `manage_companies` / `super_admin` | High | `public.company_profiles` |
| 22 | `quickResetUserStatus` | `support/actions.ts` | `verify_documents` | Medium | `public.profiles` |
| 23 | `updateUserRole` | `users/actions.ts` | `super_admin` ONLY | **P0 Critical** | `public.profiles` |
| 24 | `toggleUserStatus` | `users/actions.ts` | `manage_users` | High | `public.profiles` |
| 25 | `updateUserProfile` | `users/actions.ts` | `manage_users` (role: `super_admin`) | High | `public.profiles` |
| 26 | `getUserProfileDetails` | `users/actions.ts` | `manage_users` | Low | `public.profiles` |
| 27 | `getSignedDocumentUrl` | `verifications/actions.ts` | `verify_documents` | High | `storage.objects` |
| 28 | `getCompanyVerifications` | `verifications/actions.ts` | `manage_companies` / `verify_documents` | Medium | `public.company_profiles` |
| 29 | `getCompanyVerificationById` | `verifications/actions.ts` | `manage_companies` / `verify_documents` | Medium | `public.company_profiles` |
| 30 | `getCandidateVerificationById` | `verifications/actions.ts` | `verify_documents` | **P1 High** | `candidate_private_profiles` |
| 31 | `getCandidateVerifications` | `verifications/actions.ts` | `verify_documents` | **P1 High** | `candidate_private_profiles` |
| 32 | `reviewCompanyVerification` | `verifications/actions.ts` | `verify_documents` | Medium | `public.company_profiles` |
| 33 | `reviewCandidateVerification` | `verifications/actions.ts` | `verify_documents` | Medium | `public.profiles` |
| 34 | `reviewProfileDocument` | `verifications/actions.ts` | `verify_documents` | Medium | `public.profile_documents` |
| 35 | `startImpersonating` | `lib/auth/impersonation.ts` | `super_admin` / `manage_users` | **P0 Critical** | Client Cookies |
| 36 | `stopImpersonating` | `lib/auth/impersonation.ts` | Authenticated Admin | Low | Client Cookies |
| 37 | `getImpersonationState` | `lib/auth/impersonation.ts` | Authenticated Admin | Low | Client Cookies |
| 38 | `updateSubscriptionPlan` | `company/actions/settings.ts`| `super_admin` / Webhook ONLY | **P0 Critical** | `company_profiles`, `invoices` |

---

## 5. Security Invariants Specification

To guarantee verifiable Defense-in-Depth, the following 8 invariants must be enforced across Server Actions, PostgreSQL RLS, and SQL triggers:

- **Invariant I1 (Super Admin Staff Monopoly)**: Only active administrators with `sub_role = 'super_admin'` can create, modify, promote, suspend, or delete records in `admin_staff_members`.
- **Invariant I2 (Self-Escalation Resistance)**: No administrator can alter their own `sub_role`, `permissions`, or `status`.
- **Invariant I3 (Last Super Admin Protection)**: Database trigger `prevent_last_super_admin_removal()` must reject any transaction that would leave the system with 0 active `super_admin` records (blocking `DELETE`, `UPDATE sub_role`, `UPDATE status`, or `UPDATE profiles.role`).
- **Invariant I4 (Liveness & Suspension Enforcement)**: Administrators with `status IN ('suspended', 'inactive')` or orphan profiles without an `admin_staff_members` record must evaluate to effective permissions = $\emptyset$ in both application helpers and PostgreSQL RLS functions (`is_active_admin()`, `is_super_admin()`).
- **Invariant I5 (Cryptographic Impersonation)**: Impersonation tokens must be HMAC-SHA256 signed, time-limited (max 2h), continuously revalidated against the database, and strictly forbid target users with `role = 'admin'`.
- **Invariant I6 (Private PII Dossier Isolation)**: Access to `candidate_private_profiles` (`curp`, `rfc`, `cedula_profesional`) and private signed storage URLs must strictly require the `verify_documents` permission.
- **Invariant I7 (Commercial Bypass Elimination)**: `subscription_plan`, `subscription_status`, `credits_available`, and `featured_vacancies_allowance` on `company_profiles` must be immutable to company users via RLS / `BEFORE UPDATE` trigger and can only be updated via validated payment webhooks or `super_admin` actions.
- **Invariant I8 (Cross-Tenant Isolation)**: Company operations on vacancies, employees, and applications must enforce `company_id === auth.uid()`.

---

## 6. Recommended Defense-in-Depth Specifications

### 6.1 Server-Side RBAC Guard Helpers (`src/lib/auth/rbac-guards.ts`)
Implement centralized server helpers to replace duplicated inlined checks:

1. `requireAdminStaffAuth(requiredPermission?: AdminPermissionKey)`:
   - Validates user authentication via `supabase.auth.getUser()`.
   - Validates `profiles.role === 'admin'`.
   - Queries `admin_staff_members` where `profile_id = user.id`.
   - Requires `status === 'active'`. (Fail closed if orphan or non-active).
   - If `sub_role === 'super_admin'`, grants immediate bypass.
   - Otherwise, checks if `requiredPermission` is included in effective `permissions` (union of subrole default permissions + assigned permissions).
   - Returns `{ user, profile, staffMember, effectivePermissions }`.

2. `requireSuperAdminAuth()`:
   - Validates active session + `profiles.role === 'admin'` + `admin_staff_members.status === 'active'` + `admin_staff_members.sub_role === 'super_admin'`.

3. `requireActiveAdmin()`:
   - Validates liveness and active status of administrator.

### 6.2 PostgreSQL RLS Functions & Security Definer Helpers
Migrate RLS checks from naive `profiles.role = 'admin'` to active staff verification:
```sql
CREATE OR REPLACE FUNCTION public.is_active_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.admin_staff_members s ON s.profile_id = p.id
    WHERE p.id = COALESCE(user_id, auth.uid())
      AND p.role = 'admin'::public.user_role
      AND s.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.admin_staff_members s ON s.profile_id = p.id
    WHERE p.id = COALESCE(user_id, auth.uid())
      AND p.role = 'admin'::public.user_role
      AND s.sub_role = 'super_admin'
      AND s.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_admin_permission(perm_key text, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.admin_staff_members s ON s.profile_id = p.id
    WHERE p.id = COALESCE(user_id, auth.uid())
      AND p.role = 'admin'::public.user_role
      AND s.status = 'active'
      AND (s.sub_role = 'super_admin' OR perm_key = ANY(s.permissions))
  );
$$;
```

---

## 7. Discovered Edge Cases Summary Table

| # | Feature / Action | Input / Scenario | Observed Vulnerability / Behavior |
|---|---|---|---|
| 1 | `getAdminStaffMembers` | Orphan admin (`profiles.role = 'admin'`, no row in `admin_staff_members`) | Automatically granted `subRole: 'super_admin'` and all 6 permissions (Fail-Open violation). |
| 2 | `createAdminStaffMember` | Low-tier admin (`support`) passes `subRole: 'super_admin'` | Successfully creates root super admin account without hierarchy check. |
| 3 | `updateAdminStaffMember` | Admin passes their own UUID and `subRole: 'super_admin'` | Self-elevation succeeds without barrier (Self-Escalation). |
| 4 | `deleteAdminStaffMember` | Admin deletes the sole active `super_admin` in system | Deletion succeeds, leaving system in permanent administrative lockout. |
| 5 | `toggleAdminStaffStatus` | Suspended admin executes action with existing session | Action succeeds because `requireAdminAuth` ignores `status = 'suspended'`. |
| 6 | `updateUserRole` | Admin elevates candidate to `role: 'admin'` | Succeeds; user becomes admin and inherits super_admin privileges via orphan fallback. |
| 7 | `getSignedDocumentUrl` | Admin with `sub_role = 'content_admin'` requests INE signed URL | Signed URL generated and returned; bypasses `verify_documents` permission. |
| 8 | `getCandidateVerifications` | Support admin reads all candidate records | Private CURP, RFC, and Cédula returned in cleartext without permission check. |
| 9 | `startImpersonating` | Admin targets another user with `role: 'admin'` | Cookies issued; admin successfully impersonates another admin. |
| 10 | `updateSubscriptionPlan` | Authenticated company passes `plan: 'enterprise'` | DB updated to Enterprise, credits/allowance increased, fake paid invoice created. |
| 11 | `adjustCompanyCredits` | Support admin adds 999,999 credits | Credits granted immediately with no supervisor check or audit log. |
| 12 | `banUserAccount` | Support admin passes UUID of `super_admin` | Super admin profile marked suspended and vacancies deactivated. |

---

## 8. Conclusion

This report provides the complete, authoritative specification mining foundation for the K'anPro Defense-in-Depth RBAC Hardening implementation. All 33 core admin server actions, 5 subroles, 6 granular permission keys, and associated security invariants have been fully cataloged with exact file references and line numbers.
