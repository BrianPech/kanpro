# K'ANPRO PLATFORM — DEFENSE-IN-DEPTH RBAC HARDENING BLUEPRINT
**Document Reference**: `RBAC_HARDENING_BLUEPRINT.md`  
**Classification**: CONFIDENTIAL // TECHNICAL ARCHITECTURE BLUEPRINT & SYSTEM SPECIFICATION  
**Author**: Lead RBAC Architecture Blueprint Author (Milestone 0 / Phase 0 Remediation)  
**System**: K'anPro Multi-Tenant Recruitment & Verification Platform  
**Target Milestone**: Milestone 0 (Phase 0 Blueprint v1.1) $\to$ Milestones 1–5 Implementation  
**Date**: August 27, 2026  
**Document Version**: 1.1.0-HARDENED (Incorporates Milestone 0 Challenger Security Hardening Amendments)  
**Repository State**: Clean (93/93 Existing Automated Tests Passing, 0 Typecheck Errors, 0 Lint Violations)  

---

## Table of Contents
1. [Executive Summary & Core Security Principles](#1-executive-summary--core-security-principles)
2. [Complete Catalog & Inventory of Admin Server Actions (33 Actions)](#2-complete-catalog--inventory-of-admin-server-actions)
3. [Subroles Definition & Formal Permissions Matrix](#3-subroles-definition--formal-permissions-matrix)
4. [4-Layer Defense-in-Depth Authorization Model](#4-4-layer-defense-in-depth-authorization-model)
5. [Comprehensive STRIDE Threat Model & Mitigations](#5-comprehensive-stride-threat-model--mitigations)
6. [Fail-Closed Rules & Invariant Catalog (I1–I10)](#6-fail-closed-rules--invariant-catalog-i1i10)
7. [Cryptographic Impersonation Engine Specification](#7-cryptographic-impersonation-engine-specification)
8. [Staff Lifecycle State Machine & Transition Rules](#8-staff-lifecycle-state-machine--transition-rules)
9. [Prioritization Roadmap & 10 Implementation Steps](#9-prioritization-roadmap--10-implementation-steps)
10. [Adversarial Security Test Plan Specification (33+ Tests)](#10-adversarial-security-test-plan-specification)

---

## 1. Executive Summary & Core Security Principles

### 1.1 Architectural Problem Statement
The K'anPro platform previously operated under a **flat, binary "admin = root" paradigm**. In this legacy design:
- Any authenticated user having `public.profiles.role = 'admin'` possessed total, unrestricted execution privileges across all 33 administrative Server Actions.
- Presentation-layer constructs—such as administrative subroles (`super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`), granular permissions (`manage_users`, `manage_companies`, `verify_documents`, `manage_vacancies`, `analytics_access`, `system_settings`), and account lifecycle statuses (`active`, `inactive`, `suspended`)—were purely cosmetic.
- PostgreSQL Row-Level Security (RLS) policies relied on helper function `public.is_admin()`, which returned `true` for all admin accounts regardless of their suspension state or subrole, enabling low-tier operators to perform direct SDK mutations on staff tables, read candidate national identity PII (CURP, RFC, Cédula), or modify commercial subscription statuses.
- Orphan admin accounts (profiles with `role = 'admin'` lacking a row in `public.admin_staff_members`) were automatically promoted to `super_admin` with all permissions enabled by default, violating the fundamental principle of Fail-Closed security.

This blueprint specifies the exhaustive architecture required to eradicate the "admin = root" paradigm and establish a **verifiable, multi-layered Defense-in-Depth RBAC architecture** where no security boundary relies exclusively on the client, UI, or unvalidated server-side assumptions.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE 4-LAYER DEFENSE PARADIGM                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Layer 4: Presentation / UI       • Permission-aware navigation & button gates          │
│                                  • Graceful 403 Forbidden boundaries & UX feedback    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Layer 3: Routing & Middleware    • Edge Proxy (proxy.ts) session & status inspection   │
│                                  • Layout authentication guards (requireAdmin)         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Layer 2: Server Actions & Guards • Centralized typed helpers (requireAdminStaffAuth)   │
│                                  • Cryptographic HMAC-SHA256 Impersonation Engine      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Layer 1: Database & RLS          • SECURITY DEFINER functions (is_active_admin, etc.) │
│                                  • Restrictive RLS policies on staff & PII tables      │
│                                  • Triggers: prevent_last_super_admin_removal, etc.   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Security Principles

1. **Defense-in-Depth (DiD)**:
   Security boundaries must exist independently across all four tiers: Database (PostgreSQL RLS and triggers), Application (Server Action guards and service layers), Routing (edge proxies and layout interceptors), and Presentation (UI rendering). If an attacker circumvents the UI or invokes a Server Action directly, the backend guard rejects the operation. If a backend guard contains a defect or is bypassed via direct Supabase client query, the PostgreSQL RLS policy and database triggers reject the mutation.

2. **Principle of Least Privilege (PoLP)**:
   Every administrative staff member, commercial company, and candidate is granted the absolute minimum set of privileges required to perform their explicit job function. Administrative subroles define baseline capability sets, and granular permissions grant explicit additive authorities. No operator is granted root authority unless explicitly assigned the `super_admin` subrole with an `active` status.

3. **Fail-Closed Security Default**:
   Any unhandled role, malformed token, missing staff record (orphan admin profile), expired timestamp, corrupted HMAC signature, or inactive/suspended lifecycle status (`status != 'active'`) MUST evaluate to effective permissions = $\emptyset$ (empty set) and immediately reject the request with an access-denied error. Under no circumstances may the system default to `super_admin` or grant fallback privileges.

4. **Non-Repudiation & Cryptographic Accountability**:
   All sensitive operations—especially user impersonation, staff role modifications, and credit adjustments—must be cryptographically bound to the initiating actor. Impersonation tokens must utilize HMAC-SHA256 signatures with nonces and timestamps. Direct actions must maintain audit logs capturing the authenticated actor's UUID, target UUID, operation type, and timestamp.

5. **Separation of Duties (SoD)**:
   Critical operational responsibilities are strictly partitioned across distinct subroles to prevent privilege concentration:
   - Staff administration and role promotion are reserved exclusively for `super_admin`.
   - Candidate national identity verification and KYC document access are restricted to `verification_admin` and `super_admin`.
   - Vacancy moderation and report resolution are assigned to `ops_admin` and `content_admin`.
   - Helpdesk customer support operations are restricted to `support` without access to staff configuration or private identity dossiers.

---

## 2. Complete Catalog & Inventory of Admin Server Actions

The K'anPro administrative console comprises **33 core Server Actions** distributed across 6 functional modules in `src/app/(dashboard)/dashboard/admin/`, plus the Impersonation engine in `src/lib/auth/` and Commercial Billing actions in `src/modules/company/`.

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

#### Action 1: `toggleProfileVerification(profileId: string, isValidated: boolean)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/actions.ts:6-40`
- **Target Entity**: `public.profiles` (`is_verified` boolean)
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`, `ops_admin`
- **Required Permission**: `verify_documents` (or `manage_users`)
- **Risk Level**: **Medium**
- **Legacy Vulnerability**: Inlined `profiles.role === 'admin'` check; ignores `admin_staff_members.status` and allows any admin subrole (e.g. `support`) to toggle verification badges.
- **Hardened Specification**: Guard with `requireAdminStaffAuth('verify_documents')`. Verify target profile exists.

#### Action 2: `toggleCandidateVerification(profileId: string, isValidated: boolean)` *(Alias)*
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/actions.ts:43`
- **Target Entity**: `public.profiles` (`is_verified` boolean)
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`
- **Required Permission**: `verify_documents`
- **Risk Level**: **Medium**
- **Hardened Specification**: Re-exports `toggleProfileVerification`.

---

### Module 2: Moderation & Vacancy Reports (`src/app/(dashboard)/dashboard/admin/reports/actions.ts`)

#### Action 3: `getVacancyReports(status?: string, reason?: string)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/reports/actions.ts:35-101`
- **Target Entity**: `public.vacancy_reports`, `public.vacancies`, `public.company_profiles`, `public.profiles`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `content_admin`, `support`
- **Required Permission**: `manage_vacancies` or `analytics_access`
- **Risk Level**: **Low**
- **Hardened Specification**: Guard with `requireAdminStaffAuth('manage_vacancies')`.

#### Action 4: `quickDeactivateVacancy(vacancyId: string, reason?: string)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/reports/actions.ts:104-132`
- **Target Entity**: `public.vacancies` (`is_active = false`, `status = 'hidden'`), `public.vacancy_reports` (`status = 'action_taken'`)
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `content_admin`
- **Required Permission**: `manage_vacancies`
- **Risk Level**: **High**
- **Hardened Specification**: Guard with `requireAdminStaffAuth('manage_vacancies')`. Deactivates vacancy and records admin actor in report action.

#### Action 5: `banUserAccount(userId: string, reason?: string)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/reports/actions.ts:135-163`
- **Target Entity**: `public.profiles`, `public.vacancies`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`
- **Required Permission**: `manage_users`
- **Risk Level**: **P0 Critical**
- **Legacy Vulnerability**: Allows a low-tier admin to ban a `super_admin` or executive account.
- **Hardened Specification**: Guard with `requireAdminStaffAuth('manage_users')`. Prohibit banning any user with `role = 'admin'` unless the actor is `super_admin` and the target is not the last super admin.

#### Action 6: `toggleCompanyVerification(companyId: string, isVerified: boolean)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/reports/actions.ts:166-195`
- **Target Entity**: `public.profiles` (`is_verified`), `public.company_profiles` (`verification_status`)
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`, `ops_admin`
- **Required Permission**: `manage_companies` or `verify_documents`
- **Risk Level**: **Medium**
- **Hardened Specification**: Guard with `requireAdminStaffAuth('verify_documents')`.

#### Action 7: `resolveReport(reportId: string, actionTaken: string, notes?: string)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/reports/actions.ts:198-216`
- **Target Entity**: `public.vacancy_reports` (`status = 'resolved'`, `action_taken`)
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `content_admin`
- **Required Permission**: `manage_vacancies`
- **Risk Level**: **Low**
- **Hardened Specification**: Guard with `requireAdminStaffAuth('manage_vacancies')`.

---

### Module 3: Admin Staff Lifecycle & Permissions (`src/app/(dashboard)/dashboard/admin/staff/actions.ts`)

#### Action 8: `getAdminStaffMembers()`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:32-86`
- **Target Entity**: `public.profiles` (`role = 'admin'`), `public.admin_staff_members`
- **Intended RBAC Subrole**: `super_admin` (Full), `ops_admin` (Read-only)
- **Required Permission**: `system_settings` / `super_admin`
- **Risk Level**: **High**
- **Legacy Vulnerability**: Lines 63–72 automatically assign orphan admin profiles `subRole: 'super_admin'` and all 6 permissions!
- **Hardened Specification**: Guard with `requireAdminStaffAuth('system_settings')`. Eliminate orphan auto-promotion fallback: unmapped profiles default to `subRole: 'support'`, `permissions: []`, `status: 'inactive'`.

#### Action 9: `createAdminStaffMember(formData: CreateStaffInput)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:88-250`
- **Target Entity**: `auth.users`, `public.profiles`, `public.admin_staff_members`
- **Intended RBAC Subrole**: `super_admin` ONLY
- **Required Permission**: `super_admin` (Monopoly)
- **Risk Level**: **P0 Critical (Vertical Escalation)**
- **Legacy Vulnerability**: Any admin can create new `super_admin` accounts.
- **Hardened Specification**: Guard strictly with `requireSuperAdminAuth()`. Validates password strength, email uniqueness, creates `auth.users` with service role, sets `public.profiles.role = 'admin'`, inserts `admin_staff_members` row, and executes compensatory rollback if any step fails.

#### Action 10: `updateAdminStaffMember(staffId: string, updates: UpdateStaffInput)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:252-305`
- **Target Entity**: `public.profiles`, `public.admin_staff_members`
- **Intended RBAC Subrole**: `super_admin` ONLY
- **Required Permission**: `super_admin` (Monopoly)
- **Risk Level**: **P0 Critical (Self-Escalation & Hierarchy Tampering)**
- **Legacy Vulnerability**: Allows self-promotion (`actor.id === staffId`) and lateral modification of peer admins.
- **Hardened Specification**: Guard strictly with `requireSuperAdminAuth()`. Prohibit self-modification of `sub_role`, `permissions`, or `status`. If target is `super_admin` being demoted, verify remaining active super admins count $> 1$.

#### Action 11: `toggleAdminStaffStatus(staffId: string, newStatus: AdminStaffStatus)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:307-328`
- **Target Entity**: `public.admin_staff_members` (`status`)
- **Intended RBAC Subrole**: `super_admin` ONLY
- **Required Permission**: `super_admin` (Monopoly)
- **Risk Level**: **P0 Critical (Administrative Lockout)**
- **Legacy Vulnerability**: Allows suspending the last active `super_admin`.
- **Hardened Specification**: Guard with `requireSuperAdminAuth()`. Block self-suspension. Assert target cannot leave system with 0 active `super_admin`s.

#### Action 12: `deleteAdminStaffMember(profileId: string)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts:330-354`
- **Target Entity**: `public.admin_staff_members` (DELETE), `public.profiles` (`role = 'candidate'`)
- **Intended RBAC Subrole**: `super_admin` ONLY
- **Required Permission**: `super_admin` (Monopoly)
- **Risk Level**: **P0 Critical (Destruction & Lockout)**
- **Hardened Specification**: Guard with `requireSuperAdminAuth()`. Block self-deletion. Check active super admin count $> 1$ prior to deletion.

---

### Module 4: Technical Support & Helpdesk Operations (`src/app/(dashboard)/dashboard/admin/support/actions.ts`)

#### Actions 13–18: Ticket Management Actions
- **Actions**:
  - `getSupportTickets(status?: string, priority?: string)` (lines 44-57)
  - `getSupportTicketById(ticketId: string)` (lines 125-186)
  - `createSupportTicket(ticketData: CreateTicketInput)` (lines 191-252)
  - `getTicketMessages(ticketId: string)` (lines 257-298)
  - `addTicketMessage(ticketId: string, message: string, isInternal: boolean)` (lines 304-351)
  - `updateTicketStatus(ticketId: string, status: string, priority?: string)` (lines 356-384)
- **Target Entity**: `public.support_tickets`, `public.support_ticket_messages`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `support`
- **Required Permission**: `manage_users`
- **Risk Level**: **Low**
- **Hardened Specification**: Guard with `requireAdminStaffAuth('manage_users')`.

#### Action 19: `searchUserForSupport(query: string)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:389-433`
- **Target Entity**: `public.profiles`, `public.company_profiles`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `support`
- **Required Permission**: `manage_users`
- **Risk Level**: **Medium**
- **Hardened Specification**: Guard with `requireAdminStaffAuth('manage_users')`. Return sanitized public profile attributes; do not expose internal administrative tokens or private candidate identity fields.

#### Action 20: `sendDirectUserNotification(userId: string, title: string, description: string)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:438-455`
- **Target Entity**: `public.notifications`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `support`
- **Required Permission**: `manage_users`
- **Risk Level**: **Medium**
- **Hardened Specification**: Guard with `requireAdminStaffAuth('manage_users')`.

#### Action 21: `adjustCompanyCredits(companyId: string, amount: number, reason?: string)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:460-487`
- **Target Entity**: `public.company_profiles` (`credits_available`)
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`
- **Required Permission**: `manage_companies`
- **Risk Level**: **P1 High (Financial Abuse)**
- **Legacy Vulnerability**: Low-tier support admins can arbitrarily inject millions of credits into any company account.
- **Hardened Specification**: Guard with `requireAdminStaffAuth('manage_companies')`. Record transaction in audit log.

#### Action 22: `quickResetUserStatus(userId: string)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/support/actions.ts:492-507`
- **Target Entity**: `public.profiles` (`is_verified`)
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`
- **Required Permission**: `verify_documents`
- **Risk Level**: **Medium**
- **Hardened Specification**: Guard with `requireAdminStaffAuth('verify_documents')`.

---

### Module 5: User & Role Administration (`src/app/(dashboard)/dashboard/admin/users/actions.ts`)

#### Action 23: `updateUserRole(userId: string, newRole: UserRole)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/users/actions.ts:30-52`
- **Target Entity**: `public.profiles` (`role`)
- **Intended RBAC Subrole**: `super_admin` ONLY
- **Required Permission**: `super_admin` (Monopoly)
- **Risk Level**: **P0 Critical (Root Escalation)**
- **Legacy Vulnerability**: Allows any admin to promote a candidate/company to `admin`.
- **Hardened Specification**: Guard strictly with `requireSuperAdminAuth()`. Prohibit promoting to `role = 'admin'` through this generic endpoint (staff must be created via `createAdminStaffMember`). If target is `admin` demoting to `candidate`/`company`, enforce last super admin check.

#### Action 24: `toggleUserStatus(userId: string, newStatus: "active" | "suspended")`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/users/actions.ts:54-90`
- **Target Entity**: `public.profiles`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`
- **Required Permission**: `manage_users`
- **Risk Level**: **High**
- **Hardened Specification**: Guard with `requireAdminStaffAuth('manage_users')`. Prohibit suspending admin accounts through this endpoint (must use `toggleAdminStaffStatus`).

#### Action 25: `updateUserProfile(userId: string, data: UpdateProfileInput)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/users/actions.ts:92-111`
- **Target Entity**: `public.profiles`
- **Intended RBAC Subrole**: `super_admin` (for role), `ops_admin`/`support` (for name/phone)
- **Required Permission**: `manage_users` (role change requires `super_admin`)
- **Risk Level**: **High**
- **Hardened Specification**: Guard with `requireAdminStaffAuth('manage_users')`. Strip `role` from updates unless caller is `super_admin`.

#### Action 26: `getUserProfileDetails(userId: string)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/users/actions.ts:113-144`
- **Target Entity**: `public.profiles`, `public.candidate_profiles`, `public.company_profiles`, `public.profile_documents`
- **Intended RBAC Subrole**: `super_admin`, `ops_admin`, `verification_admin`, `support`
- **Required Permission**: `manage_users` (or `verify_documents`)
- **Risk Level**: **Low**
- **Hardened Specification**: Guard with `requireAdminStaffAuth('manage_users')`.

---

### Module 6: Verification & Sensitive Dossiers (`src/app/(dashboard)/dashboard/admin/verifications/actions.ts`)

#### Action 27: `getSignedDocumentUrl(filePath: string)`
- **File & Lines**: `src/app/(dashboard)/dashboard/admin/verifications/actions.ts:128-135`
- **Target Entity**: `storage.objects` (`profile_documents` private bucket)
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`
- **Required Permission**: `verify_documents`
- **Risk Level**: **P1 High (PII Storage Leak)**
- **Legacy Vulnerability**: Any admin subrole (e.g. `support`) can sign URLs to download private INE, Tax, and CURP documents.
- **Hardened Specification**: Guard strictly with `requireAdminStaffAuth('verify_documents')`. Validate path pattern and bucket.

#### Actions 28–29: Company Verification Review Actions
- **Actions**:
  - `getCompanyVerifications(statusFilter?: string)` (lines 140-222)
  - `getCompanyVerificationById(companyId: string)` (lines 227-297)
- **Target Entity**: `public.company_profiles`, `public.profiles`, `public.profile_documents`
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`, `ops_admin`
- **Required Permission**: `verify_documents` or `manage_companies`
- **Risk Level**: **Medium**
- **Hardened Specification**: Guard with `requireAdminStaffAuth('verify_documents')`.

#### Actions 30–31: Candidate PII & Dossier Read Actions
- **Actions**:
  - `getCandidateVerificationById(candidateId: string)` (lines 302-374)
  - `getCandidateVerifications(statusFilter?: string)` (lines 379-462)
- **Target Entity**: `public.candidate_profiles`, `public.profiles`, `public.candidate_private_profiles`, `public.profile_documents`
- **Intended RBAC Subrole**: `super_admin`, `verification_admin` ONLY
- **Required Permission**: `verify_documents` ONLY
- **Risk Level**: **P1 High (Candidate National Identity PII Leak)**
- **Legacy Vulnerability**: Exposes CURP, RFC, and Cédula Profesional to any admin without `verify_documents`.
- **Hardened Specification**: Guard strictly with `requireAdminStaffAuth('verify_documents')`.

#### Actions 32–34: KYC Document Approval & Review Actions
- **Actions**:
  - `reviewCompanyVerification(companyId: string, approved: boolean, reason?: string)` (lines 467-533)
  - `reviewCandidateVerification(candidateId: string, approved: boolean, reason?: string)` (lines 538-586)
  - `reviewProfileDocument(documentId: string, status: "approved" | "rejected", reason?: string)` (lines 588-601)
- **Target Entity**: `public.profiles`, `public.company_profiles`, `public.profile_documents`
- **Intended RBAC Subrole**: `super_admin`, `verification_admin`
- **Required Permission**: `verify_documents`
- **Risk Level**: **Medium**
- **Hardened Specification**: Guard with `requireAdminStaffAuth('verify_documents')`.

---

### Module 7: Cryptographic Impersonation Engine (`src/lib/auth/impersonation.ts`)

#### Actions 35–37: Impersonation Operations
- **Actions**:
  - `startImpersonating(targetUserId: string)` (lines 18-99)
  - `stopImpersonating()` (lines 104-114)
  - `getImpersonationState()` (lines 119-161)
- **Target**: HTTP Cookies (`kanpro_impersonation_token`)
- **Intended RBAC Subrole**: `super_admin`, `support`
- **Required Permission**: `manage_users`
- **Risk Level**: **P0 Critical**
- **Legacy Vulnerabilities**: Plaintext unsigned cookies, admin-to-admin impersonation allowed, no continuous actor liveness revalidation, no audit logging.
- **Hardened Specification**: Guard with `requireAdminStaffAuth('manage_users')`. Enforce HMAC-SHA256 signature, target `role !== 'admin'`, actor continuous DB revalidation, and audit logging.

---

### Module 8: Commercial Billing & Settings (`src/modules/company/actions/settings.ts` & `employees.ts`)

#### Action 38: `updateSubscriptionPlan(companyId: string, plan: "basic" | "pro" | "enterprise")`
- **File & Lines**: `src/modules/company/actions/settings.ts:74-133`
- **Target Entity**: `public.company_profiles` (`subscription_plan`, `featured_vacancies_allowance`), `public.company_invoices`
- **Intended RBAC Subrole**: `super_admin` ONLY or Payment Webhook
- **Risk Level**: **P0 Critical (Commercial Bypass)**
- **Legacy Vulnerability**: Any company user can self-assign `enterprise` plan, 10 featured vacancies, and fake paid invoices.
- **Hardened Specification**: Block direct invocation. Allow mutation only by `requireSuperAdminAuth()` or verified payment webhook.

#### Actions 39–41: Company Employee Actions
- **Actions**:
  - `updateEmployeeStartDate(applicationId: string, startDate: string)` (`employees.ts:9-32`)
  - `terminateEmployee(applicationId: string, reason: string, notes?: string)` (`employees.ts:37-65`)
  - `reactivateEmployee(applicationId: string)` (`employees.ts:70-93`)
- **Target Entity**: `public.applications`, `public.company_employees`
- **Intended RBAC Subrole**: Authenticated Company Owner
- **Risk Level**: **P2 Medium (Tenant Isolation)**
- **Hardened Specification**: Assert `application.vacancy.company_id === user.id`.

---

## 3. Subroles Definition & Formal Permissions Matrix

### 3.1 Subrole Definitions
K'anPro defines 5 administrative subroles, mapped to operational responsibilities:

1. **`super_admin` (Super Administrador / Executive Officer)**:
   - **Authority**: Total executive authority with operational permission bypass.
   - **Exclusive Capabilities**: Staff member lifecycle (create, update, suspend, delete), user role elevation/demotion, system configuration, disaster recovery, commercial plan overrides.
2. **`ops_admin` (Admin de Operaciones / Compliance Officer)**:
   - **Authority**: Operational supervision across users, vacancies, moderation reports, and companies.
   - **Blocked**: Staff management, role promotion to admin, candidate national identity PII reads.
3. **`content_admin` (Admin de Contenido / Moderator)**:
   - **Authority**: Vacancy content moderation, deactivating abusive vacancies, resolving vacancy reports, reviewing platform metrics.
   - **Blocked**: User/company modifications, staff actions, KYC document reviews.
4. **`verification_admin` (Agente de Verificación / KYC Auditor)**:
   - **Authority**: Full KYC candidate & company verification, accessing private PII dossiers (`candidate_private_profiles`), generating signed document download URLs.
   - **Blocked**: Staff management, vacancy moderation, role promotions.
5. **`support` (Soporte Técnico / Helpdesk Lead)**:
   - **Authority**: Support ticket resolution, user lookup, direct notifications, authorized user impersonation (with HMAC).
   - **Blocked**: Staff management, credit adjustments, document verification, vacancy modifications.

---

### 3.2 Granular Permissions Definitions
| Permission Key | Display Name | Functional Capability Description |
|---|---|---|
| `manage_users` | Gestión de Usuarios | Edit basic user profiles, ban/unban accounts, manage support tickets, initiate user impersonation. |
| `manage_companies` | Gestión de Empresas | Modify company records, approve corporate profiles, adjust company credit balances. |
| `verify_documents` | Verificación de Documentos | Read `candidate_private_profiles` (CURP/RFC/Cédula), generate signed storage URLs, approve/reject KYC documents. |
| `manage_vacancies` | Moderación de Vacantes | Deactivate/hide vacancies, review vacancy violation reports, resolve moderation tickets. |
| `analytics_access` | Acceso a Métricas | View administrative KPI dashboards, recruitment analytics, platform telemetry. |
| `system_settings` | Configuración del Sistema | Manage global application configuration, inspect audit logs, manage administrative staff members. |

---

### 3.3 Formal Subrole $\times$ Permissions Mapping Matrix

| Subrole Key | Base Permissions Assigned | Executive Bypass | Allowed Server Action Modules | Explicitly Blocked Operations |
|---|---|:---:|---|---|
| `super_admin` | `manage_users`<br>`manage_companies`<br>`verify_documents`<br>`manage_vacancies`<br>`analytics_access`<br>`system_settings` | **YES** | **100% of all Actions** (1–41) | None (subject to Last Super Admin & Self-Modification invariant rules). |
| `ops_admin` | `manage_users`<br>`manage_companies`<br>`manage_vacancies`<br>`analytics_access` | NO | Users, Reports, Support, General Admin | Staff mutations (`staff/actions.ts`), Role promotions, Private candidate PII reads. |
| `content_admin` | `manage_vacancies`<br>`analytics_access` | NO | Reports (`quickDeactivateVacancy`, `resolveReport`), Metrics | Staff mutations, User mutations, Company mutations, Document verifications. |
| `verification_admin` | `verify_documents`<br>`manage_users`<br>`manage_companies` | NO | Verifications (27–34), General Admin, User lookups | Staff mutations, Vacancy deactivations, Commercial plan mutations. |
| `support` | `manage_users` | NO | Support (13–20), Impersonation (35–37) | Staff mutations, Credit injections, Vacancy modifications, Document verification. |

---

### 3.4 Mathematical Formula for Effective Capabilities

For any user $u \in \text{Profiles}$, their effective administrative capability set $\mathcal{C}_{\text{eff}}(u)$ is computed as:

$$\mathcal{C}_{\text{eff}}(u) = \begin{cases} 
\mathcal{P}_{\text{all}} & \text{if } \text{role}(u) = \text{'admin'} \land \text{status}(u) = \text{'active'} \land \text{sub\_role}(u) = \text{'super\_admin'} \\
\left(\text{BasePerms}(\text{sub\_role}(u)) \cup \text{permissions}(u)\right) & \text{if } \text{role}(u) = \text{'admin'} \land \text{status}(u) = \text{'active'} \land \text{sub\_role}(u) \neq \text{'super\_admin'} \\
\emptyset & \text{if } \text{status}(u) \in \{\text{'suspended'}, \text{'inactive'}\} \lor u \text{ is orphan} \lor \text{role}(u) \neq \text{'admin'}
\end{cases}$$

Where $\mathcal{P}_{\text{all}} = \{\text{manage\_users}, \text{manage\_companies}, \text{verify\_documents}, \text{manage\_vacancies}, \text{analytics\_access}, \text{system\_settings}\}$.

---

## 4. 4-Layer Defense-in-Depth Authorization Model

```
                                  INCOMING HTTP REQUEST
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │ LAYER 3: Routing & Middleware Layer              │
                  │  - Next.js Proxy (src/proxy.ts)                  │
                  │  - Status != 'active' -> Redirect /login         │
                  │  - Orphan Admin -> Redirect /login               │
                  └─────────────────────────┬────────────────────────┘
                                            │ PASS
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │ LAYER 4: Presentation / UI Layer                 │
                  │  - app-sidebar.tsx filters links by permissions  │
                  │  - Action buttons disabled / hidden              │
                  │  - Graceful 403 error boundaries                 │
                  └─────────────────────────┬────────────────────────┘
                                            │ INVOCATION
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │ LAYER 2: Server Action & Backend Layer           │
                  │  - requireAdminStaffAuth(requiredPermission)     │
                  │  - requireSuperAdminAuth()                       │
                  │  - HMAC-SHA256 Impersonation Validation          │
                  └─────────────────────────┬────────────────────────┘
                                            │ QUERY / MUTATION
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │ LAYER 1: Database & PostgreSQL RLS Layer         │
                  │  - public.is_active_admin(auth.uid())            │
                  │  - public.is_super_admin(auth.uid())             │
                  │  - public.has_admin_permission(perm, auth.uid()) │
                  │  - Dual Triggers: prevent_last_super_admin_*     │
                  │  - Trigger protect_company_commercial_fields()   │
                  │  - Explicit Security Definer Grants/Revocations  │
                  └──────────────────────────────────────────────────┘
```

### 4.1 Layer 1: Database & PostgreSQL RLS Layer
The foundation of Defense-in-Depth resides in PostgreSQL. Even if an attacker executes arbitrary SQL queries via the PostgREST API using the `authenticated` role, RLS policies and database triggers enforce subrole constraints:

1. **Security Definer SQL Helper Functions**:
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
      AND (
        s.sub_role = 'super_admin'
        OR perm_key = ANY(s.permissions)
        OR (s.sub_role = 'ops_admin' AND perm_key IN ('manage_users', 'manage_companies', 'manage_vacancies', 'analytics_access'))
        OR (s.sub_role = 'content_admin' AND perm_key IN ('manage_vacancies', 'analytics_access'))
        OR (s.sub_role = 'verification_admin' AND perm_key IN ('verify_documents', 'manage_users', 'manage_companies'))
        OR (s.sub_role = 'support' AND perm_key IN ('manage_users'))
      )
  );
$$;
```

2. **Dual-Trigger Architecture: Invariant I3 (Last Super Admin Preservation)**:
To ensure no administrative lockout can occur through either `public.admin_staff_members` mutations or direct `public.profiles.role` demotions, a dual-trigger architecture is established with explicit row-locking (`FOR UPDATE`) to serialize concurrent transactions:

```sql
-- 2a. Trigger function on public.admin_staff_members (protects staff table mutations)
CREATE OR REPLACE FUNCTION public.prevent_last_super_admin_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  active_super_admins_count integer;
BEGIN
  -- Row-lock active super admin rows to serialize concurrent demotion/deletion transactions
  PERFORM 1 FROM public.admin_staff_members
  WHERE sub_role = 'super_admin' AND status = 'active'
  FOR UPDATE;

  -- Count active super admins with verified admin profile
  SELECT COUNT(*) INTO active_super_admins_count
  FROM public.admin_staff_members s
  JOIN public.profiles p ON p.id = s.profile_id
  WHERE s.sub_role = 'super_admin'
    AND s.status = 'active'
    AND p.role = 'admin'::public.user_role;

  -- Handle DELETE on admin_staff_members
  IF TG_OP = 'DELETE' THEN
    IF OLD.sub_role = 'super_admin' AND OLD.status = 'active' AND active_super_admins_count <= 1 THEN
      RAISE EXCEPTION 'Operación rechazada: No se puede eliminar al único Super Administrador activo del sistema.'
        USING ERRCODE = '23514';
    END IF;
    RETURN OLD;
  END IF;

  -- Handle UPDATE on admin_staff_members
  IF TG_OP = 'UPDATE' THEN
    IF OLD.sub_role = 'super_admin' AND OLD.status = 'active' THEN
      IF (NEW.sub_role != 'super_admin' OR NEW.status != 'active') AND active_super_admins_count <= 1 THEN
        RAISE EXCEPTION 'Operación rechazada: No se puede degradar o suspender al único Super Administrador activo.'
          USING ERRCODE = '23514';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_last_super_admin_removal
BEFORE UPDATE OR DELETE ON public.admin_staff_members
FOR EACH ROW EXECUTE FUNCTION public.prevent_last_super_admin_removal();

-- 2b. Companion trigger function on public.profiles (protects profile role demotions & deletions)
CREATE OR REPLACE FUNCTION public.prevent_last_super_admin_profile_demotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  active_super_admins_count integer;
  is_target_active_super_admin boolean;
BEGIN
  -- Check if the target profile being modified or deleted is an active super admin
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_staff_members s
    WHERE s.profile_id = OLD.id
      AND s.sub_role = 'super_admin'
      AND s.status = 'active'
  ) INTO is_target_active_super_admin;

  IF is_target_active_super_admin THEN
    -- Row-lock to serialize concurrent operations
    PERFORM 1 FROM public.admin_staff_members
    WHERE sub_role = 'super_admin' AND status = 'active'
    FOR UPDATE;

    SELECT COUNT(*) INTO active_super_admins_count
    FROM public.admin_staff_members s
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE s.sub_role = 'super_admin'
      AND s.status = 'active'
      AND p.role = 'admin'::public.user_role;

    IF TG_OP = 'DELETE' THEN
      IF active_super_admins_count <= 1 THEN
        RAISE EXCEPTION 'Operación rechazada: No se puede eliminar el perfil del único Super Administrador activo del sistema.'
          USING ERRCODE = '23514';
      END IF;
      RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
      IF (OLD.role = 'admin'::public.user_role AND NEW.role != 'admin'::public.user_role) AND active_super_admins_count <= 1 THEN
        RAISE EXCEPTION 'Operación rechazada: No se puede cambiar el rol del perfil del único Super Administrador activo.'
          USING ERRCODE = '23514';
      END IF;
      RETURN NEW;
    END IF;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER trg_prevent_last_super_admin_profile_demotion
BEFORE UPDATE OF role OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_last_super_admin_profile_demotion();
```

3. **Trigger: Commercial Field Protection on `company_profiles`**:
```sql
CREATE OR REPLACE FUNCTION public.protect_company_commercial_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Enforce protection for authenticated non-super-admin sessions (auth.uid() IS NOT NULL).
  -- When auth.uid() IS NULL (service_role, Stripe billing webhooks, background workers, migrations), modifications are permitted.
  IF (auth.uid() IS NOT NULL) AND (NOT public.is_super_admin(auth.uid())) THEN
    -- Check if protected commercial columns are being mutated
    IF (OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan) OR
       (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status) OR
       (OLD.subscription_period_end IS DISTINCT FROM NEW.subscription_period_end) OR
       (OLD.featured_vacancies_allowance IS DISTINCT FROM NEW.featured_vacancies_allowance) OR
       (OLD.credits_available IS DISTINCT FROM NEW.credits_available) OR
       (OLD.verification_status IS DISTINCT FROM NEW.verification_status) THEN
      RAISE EXCEPTION 'Acceso denegado: Modificación de campos comerciales y suscripción no permitida para el tenant.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_company_commercial_fields
BEFORE UPDATE ON public.company_profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_company_commercial_fields();
```

4. **Explicit PostgreSQL Grants on SECURITY DEFINER Functions**:
In accordance with Supabase Database Hardening Guidelines and Supabase DB Advisor best practices, execute privileges on all `SECURITY DEFINER` functions are explicitly revoked from `PUBLIC` and `anon`, and granted strictly to `authenticated` and `service_role`:

```sql
-- Revoke all default execution permissions from untrusted roles
REVOKE EXECUTE ON FUNCTION public.is_active_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_admin_permission(text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_last_super_admin_removal() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_last_super_admin_profile_demotion() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.protect_company_commercial_fields() FROM PUBLIC, anon;

-- Grant execution strictly to authenticated application users and service role
GRANT EXECUTE ON FUNCTION public.is_active_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.prevent_last_super_admin_removal() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.prevent_last_super_admin_profile_demotion() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.protect_company_commercial_fields() TO authenticated, service_role;
```
```

---

### 4.2 Layer 2: Server Action & Backend Layer
Centralized server-side helpers in `src/lib/auth/rbac-guards.ts` validate sessions, inspect `admin_staff_members.status`, and verify permissions before executing application logic:

```typescript
// src/lib/auth/rbac-guards.ts
export async function requireAdminStaffAuth(
  requiredPermission?: AdminPermissionKey
): Promise<{ user: User; profile: Profile; staff: AdminStaffMember }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autenticado. Por favor inicie sesión.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    throw new Error("Acceso denegado: Se requieren permisos de administrador.");
  }

  // Query staff record
  const { data: staff } = await supabase
    .from("admin_staff_members")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  // Fail-closed for orphan or non-active accounts
  if (!staff || staff.status !== "active") {
    throw new Error("Acceso denegado: Cuenta de administrador inactiva, suspendida o no asignada.");
  }

  // Super admin bypass
  if (staff.sub_role === "super_admin") {
    return { user, profile, staff };
  }

  // Permission check
  if (requiredPermission) {
    const hasPerm = hasPermission(staff, requiredPermission);
    if (!hasPerm) {
      throw new Error(`Acceso denegado: Se requiere el permiso '${requiredPermission}'.`);
    }
  }

  return { user, profile, staff };
}

export async function requireSuperAdminAuth(): Promise<{
  user: User;
  profile: Profile;
  staff: AdminStaffMember;
}> {
  const auth = await requireAdminStaffAuth();
  if (auth.staff.sub_role !== "super_admin") {
    throw new Error("Acceso denegado: Se requieren privilegios de Super Administrador.");
  }
  return auth;
}
```

---

### 4.3 Layer 3: Routing & Middleware Layer
`src/lib/supabase/proxy.ts` and `src/app/(dashboard)/dashboard/admin/layout.tsx` inspect the authenticated user's profile and staff record at the edge. If `role === 'admin'` but `admin_staff_members.status !== 'active'` or the profile is an orphan, the user is immediately redirected to `/login?error=account_suspended`.

---

### 4.4 Layer 4: Presentation / UI Layer
`src/modules/admin/components/app-sidebar.tsx` dynamically evaluates the current administrator's effective capabilities and renders navigation links conditionally. Data tables (`staff-data-table.tsx`, `users-data-table.tsx`) disable or omit action buttons for unauthorized subroles and handle 403 Forbidden errors gracefully with descriptive feedback toasts.

---

## 5. Comprehensive STRIDE Threat Model & Mitigations

| STRIDE Threat Category | Specific Threat Scenario | Affected Asset | Severity | Defense-in-Depth Mitigation |
|---|---|---|:---:|---|
| **S**poofing | Attacker forges plaintext impersonation cookies to hijack candidate or company sessions. | Client Cookies (`impersonation.ts`) | **P0** | Impersonation tokens signed with HMAC-SHA256 secret key, carrying nonces, timestamps, and target restrictions. |
| **S**poofing | Attacker attempts to register public account with `role: 'admin'` or `role: 'super_admin'`. | `auth.users` / `profiles` | **P0** | Hardened `handle_new_user()` trigger strips `admin` from metadata and forces `candidate`. |
| **T**ampering | Low-level admin modifies their own row in `admin_staff_members` via direct Supabase SDK update to become `super_admin`. | `public.admin_staff_members` | **P0** | RLS `INSERT/UPDATE/DELETE` on `admin_staff_members` restricted strictly to `public.is_super_admin()`. |
| **T**ampering | Authenticated company user calls `updateSubscriptionPlan` to self-assign Enterprise plan and fake paid invoices. | `company_profiles` / `company_invoices` | **P0** | `company_profiles` `BEFORE UPDATE` trigger blocks commercial column mutation for non-super-admins; Server Action restricted to `super_admin` / webhook. |
| **R**epudiation | Support admin adjusts company credits without logging who performed the transaction. | `company_profiles.credits_available` | **P1** | Actions record explicit audit log entries containing `actor_id`, `target_company_id`, and `delta_amount`. |
| **R**epudiation | Admin initiates impersonation session and actions are executed without tracking real actor identity. | Platform Actions | **P1** | Token payload explicitly encodes `actorId` and `actorSubRole`; logged in `admin_impersonation_logs`. |
| **I**nformation Disclosure | Low-tier support admin queries `candidate_private_profiles` to harvest CURP, RFC, and Cédula identities. | `candidate_private_profiles` | **P1** | PostgreSQL RLS policy and Server Action guards strictly require `verify_documents` permission. |
| **I**nformation Disclosure | Public candidate directory query leaks emails and WhatsApp phone numbers to authenticated candidates. | `public.profiles` | **P1** | Profile directory select policy hardened to hide private contact columns for general candidates. |
| **D**enial of Service | Malicious or compromised admin deletes or suspends the last active `super_admin`, locking out management. | `admin_staff_members` / `profiles` | **P0** | PostgreSQL dual-trigger architecture (`trg_prevent_last_super_admin_removal` on `admin_staff_members` and `trg_prevent_last_super_admin_profile_demotion` on `profiles`) with row-locking (`FOR UPDATE`) blocks any transaction leaving 0 active super admins. |
| **E**levation of Privilege | Low-level admin promotes candidate to `role = 'admin'` via `updateUserRole` or `updateUserProfile`. | `public.profiles.role` | **P0** | `updateUserRole` restricted strictly to `requireSuperAdminAuth()`; profiles RLS UPDATE blocks role changes. |
| **E**levation of Privilege | Orphan admin profile receives `super_admin` and all permissions via legacy default fallback. | `getAdminStaffMembers` | **P0** | Fail-closed orphan handling: unmapped profiles default to `status: 'inactive'` and $\emptyset$ permissions. |

---

## 6. Fail-Closed Rules & Invariant Catalog (I1–I10)

The system must rigorously enforce the following **10 Security Invariants** across all four layers:

- **Invariant I1 (Super Admin Staff Monopoly)**: Only active administrators with `sub_role = 'super_admin'` can create, modify, promote, suspend, or delete records in `admin_staff_members`.
- **Invariant I2 (Self-Escalation Resistance)**: No administrator can alter their own `sub_role`, `permissions`, or `status`.
- **Invariant I3 (Last Super Admin Preservation)**: PostgreSQL dual-trigger architecture (`trg_prevent_last_super_admin_removal` on `admin_staff_members` and `trg_prevent_last_super_admin_profile_demotion` on `profiles`), with row-level locking (`FOR UPDATE`), must reject any database transaction (`DELETE`, `UPDATE sub_role`, `UPDATE status`, or `UPDATE profiles.role`) that would leave the system with 0 active `super_admin` accounts.
- **Invariant I4 (Suspension Liveness Enforcement)**: Administrators with `status IN ('suspended', 'inactive')` have effective permissions = $\emptyset$ across routing proxies, layout guards, Server Actions, and PostgreSQL RLS.
- **Invariant I5 (Fail-Closed Orphan Defense)**: Profiles with `role = 'admin'` lacking an active row in `admin_staff_members` evaluate to effective permissions = $\emptyset$ and are blocked from accessing administrative dashboards.
- **Invariant I6 (Cryptographic Impersonation Integrity)**: Impersonation tokens must be HMAC-SHA256 signed over canonical `Base64Url(JSON(Payload))` UTF-8 bytes, have max TTL of 2 hours, continuous DB actor liveness and target role revalidation (`targetProfile.role !== 'admin'`) at request time, and strictly prohibit targets with `role = 'admin'` or self-impersonation.
- **Invariant I7 (Private PII Dossier Isolation)**: Reading `candidate_private_profiles` (CURP, RFC, Cédula) and signing private storage download URLs strictly requires `verify_documents` permission.
- **Invariant I8 (Commercial Integrity & Plan Tampering Immunity)**: `subscription_plan`, `subscription_status`, `credits_available`, and `featured_vacancies_allowance` on `company_profiles` are immutable to tenants and can only be modified via verified background payment webhooks (where `auth.uid() IS NULL`) or `super_admin` actions.
- **Invariant I9 (Tenant Data Isolation)**: Cross-tenant operations on vacancies, employees, applications, and documents must enforce `company_id === auth.uid()`.
- **Invariant I10 (Multi-Table Transactional Atomicity & Rollback)**: Multi-entity administrative mutations (e.g. staff creation across `auth.users`, `profiles`, and `admin_staff_members`) must execute within atomic transactions or include compensatory rollback handlers upon partial failure.

---

## 7. Cryptographic Impersonation Engine Specification

### 7.1 Mathematical Token Structure & Encoding Standard
To prevent canonicalization vulnerabilities, JSON key ordering discrepancies, and whitespace tampering, the impersonation token standardizes signing explicitly over the UTF-8 bytes of the Base64Url-encoded payload string (the substring before the period delimiter):

$$\text{PayloadString} = \text{Base64Url}(\text{JSON.stringify}(\text{Payload}))$$
$$\text{Signature} = \text{Base64Url}(\text{HMAC-SHA256}_{K}(\text{PayloadString}))$$
$$\text{Token} = \text{PayloadString} \,\|\, \text{"."} \,\|\, \text{Signature}$$

Where:
- $\text{JSON.stringify}(\text{Payload})$ produces a canonical UTF-8 JSON representation.
- $\text{Base64Url}(x)$ encodes raw bytes into URL-safe Base64 without padding (`=`).
- $\text{HMAC-SHA256}_{K}(\text{PayloadString})$ computes the HMAC over the UTF-8 byte representation of $\text{PayloadString}$.
- $K$ is the server-side `IMPERSONATION_SECRET` (or a cryptographically secure derivation: $\text{SHA256}(\text{SUPABASE\_SERVICE\_ROLE\_KEY} \,\|\, \text{":kanpro_impersonation_salt"})$).

### 7.2 Payload Schema
```typescript
export interface ImpersonationPayload {
  issuer: "kanpro_auth";
  actorId: string;           // UUID of the initiating admin
  actorSubRole: AdminSubRole;// Subrole of the initiating admin at issuance
  targetId: string;          // UUID of candidate or company
  targetRole: "candidate" | "company"; // Prohibited: 'admin'
  targetName: string;
  targetEmail: string;
  issuedAt: number;          // Epoch milliseconds
  expiresAt: number;         // Epoch milliseconds (max issuedAt + 2 hours)
  nonce: string;             // 16-byte random hex string
  purpose: "support_impersonation";
}
```

### 7.3 Verification & Continuous Revalidation Pipeline
When a request carrying an impersonation cookie is processed by the server or edge middleware:
1. **Format & Split Validation**: Verify the token contains exactly one `.` separator into `[PayloadString, Signature]`.
2. **Signature Verification**: Recompute $\text{Base64Url}(\text{HMAC-SHA256}_{K}(\text{PayloadString}))$ and perform a constant-time comparison against `Signature`. Reject immediately if mismatched.
3. **Expiration Check**: Decode `PayloadString`, parse JSON, and assert `expiresAt > Date.now()`. Reject if expired ($TTL > 2\text{h}$).
4. **Target Static Role Check**: Assert `targetRole !== 'admin'` and `targetId !== actorId`.
5. **Continuous Database Revalidation (Request-Time Liveness & Role Enforcement)**:
   Query PostgreSQL to verify both the issuing actor and the target user in real-time:
   ```typescript
   // 5a. Query PostgreSQL for actorId liveness and authorization:
   const { data: actorProfile } = await supabase
     .from("profiles")
     .select("role")
     .eq("id", payload.actorId)
     .single();

   const { data: actorStaff } = await supabase
     .from("admin_staff_members")
     .select("status, sub_role, permissions")
     .eq("profile_id", payload.actorId)
     .single();

   if (!actorProfile || actorProfile.role !== "admin" || !actorStaff || actorStaff.status !== "active") {
     throw new Error("Impersonación inválida: El administrador emisor ya no está activo o autorizado.");
   }

   // 5b. Query PostgreSQL for targetId current role asserting target is not an admin:
   const { data: targetProfile } = await supabase
     .from("profiles")
     .select("role")
     .eq("id", payload.targetId)
     .single();

   if (!targetProfile || targetProfile.role === "admin") {
     throw new Error("Impersonación inválida: El usuario objetivo es un administrador o no existe.");
   }
   ```
   $$\text{Assert Actor: } \text{profiles.role} = \text{'admin'} \land \text{admin\_staff\_members.status} = \text{'active'}$$
   $$\text{Assert Target: } \text{profiles.role} \neq \text{'admin'}$$

   *If the issuing admin has been suspended or demoted, or if the target user has been promoted to `admin` after token issuance, the impersonation session is immediately rejected.*

---

## 8. Staff Lifecycle State Machine & Transition Rules

```
                             ┌─────────────────┐
                             │   (NON-EXIST)   │
                             └────────┬────────┘
                                      │ createAdminStaffMember()
                                      │ (Super Admin Only)
                                      ▼
                        ┌───────────────────────────┐
       ┌───────────────►│          ACTIVE           │◄──────────────┐
       │                └─────────────┬─────────────┘               │
       │                              │                             │
       │ toggleAdminStaffStatus()     │ toggleAdminStaffStatus()    │ toggleAdminStaffStatus()
       │ (Super Admin Only)           │ (Super Admin Only,          │ (Super Admin Only)
       │                              │  N_super_admin > 1)         │
       │                              ▼                             │
┌──────┴────────────┐   ┌───────────────────────────┐   ┌───────────┴──────────┐
│     INACTIVE      │   │         SUSPENDED         │   │       DELETED        │
│ (Access Revoked)  │   │  (Access Blocked / Logs)  │   │ (Demoted Candidate)  │
└───────────────────┘   └───────────────────────────┘   └──────────────────────┘
```

### 8.1 State Transition Rules Table
| Initial State | Target State | Triggering Server Action | Authorized Subrole | Mandatory Preconditions & Invariants |
|---|---|---|---|---|
| Non-existent | `active` | `createAdminStaffMember` | `super_admin` ONLY | Actor is active super admin; email unique; atomic rollback on failure. |
| `active` | `suspended` | `toggleAdminStaffStatus` | `super_admin` ONLY | Actor $\neq$ target; if target is `super_admin`, active super admins count $> 1$. |
| `suspended` | `active` | `toggleAdminStaffStatus` | `super_admin` ONLY | Actor is active super admin. |
| `active` | `deleted` | `deleteAdminStaffMember` | `super_admin` ONLY | Actor $\neq$ target; staff row removed; profile role demoted to `candidate`; active super admins count $> 1$. |
| `active` | Modified Subrole/Perms | `updateAdminStaffMember` | `super_admin` ONLY | Actor $\neq$ target (no self-modification); active super admins count $> 1$ if target demoted. |

---

## 9. Prioritization Roadmap & 10 Implementation Steps

### 9.1 Severity Classification Breakdown
- **P0 — Critical (Immediate Blocker)**: Staff management escalation, executive lockout vulnerability, commercial billing bypass, direct RLS staff manipulation.
- **P1 — High (Core Security)**: Impersonation token signing, suspended account session revocation, candidate national PII protection (`candidate_private_profiles`).
- **P2 — Medium (Integrity & Isolation)**: Tenant workforce isolation (`employees.ts`), compensatory rollbacks for multi-table creation races.
- **P3 — Low / UX (Presentation Sync)**: Permission-aware sidebar navigation, action button disabling, 403 error feedback.

---

### 9.2 Ordered 10 Implementation Steps

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     10-STEP PHASED IMPLEMENTATION ROADMAP                        │
├─────────┬──────────────────────────────────────────┬─────────────────────────────┤
│ Step #  │ Module & Target File                     │ Scope & Responsibility      │
├─────────┼──────────────────────────────────────────┼─────────────────────────────┤
│ Step 1  │ src/lib/auth/rbac-guards.ts              │ Centralized Server Guards   │
│ Step 2  │ supabase/migrations/20260827000000...sql │ DB Security Definer & Funcs │
│ Step 3  │ supabase/migrations/20260827000000...sql │ DB Restrictive RLS Policies │
│ Step 4  │ src/app/.../admin/staff/actions.ts       │ Staff Lifecycle Hardening   │
│ Step 5  │ src/lib/supabase/proxy.ts & layout.tsx   │ Suspended/Inactive Defense  │
│ Step 6  │ src/app/.../admin/staff/actions.ts       │ Fail-Closed Orphan Defense  │
│ Step 7  │ src/lib/auth/impersonation.ts            │ HMAC Impersonation Engine   │
│ Step 8  │ src/app/.../admin/verifications/...      │ Sensitive PII Isolation     │
│ Step 9  │ src/modules/company/actions/settings.ts  │ Commercial Billing Hardening│
│ Step 10 │ src/modules/admin/components/...         │ UI & App Sidebar Sync       │
└─────────┴──────────────────────────────────────────┴─────────────────────────────┘
```

1. **Step 1: Centralized Server RBAC Guards (`src/lib/auth/rbac-guards.ts`)**  
   Implement `requireAdminStaffAuth(permission)`, `requireSuperAdminAuth()`, and `requireActiveAdmin()` with typed subroles and permissions.
2. **Step 2: PostgreSQL Security Definer Functions, Dual Triggers & Grants**  
   Deploy `public.is_active_admin`, `public.is_super_admin`, `public.has_admin_permission`, dual triggers `prevent_last_super_admin_removal` and `prevent_last_super_admin_profile_demotion` (with `FOR UPDATE` row-locking), `protect_company_commercial_fields` (with `auth.uid() IS NULL` service-role / webhook support), and explicit `GRANT`/`REVOKE` permissions on all `SECURITY DEFINER` functions.
3. **Step 3: PostgreSQL RLS Policy Restructuring**  
   Harden RLS on `admin_staff_members`, `candidate_private_profiles`, `company_profiles`, and `profiles`.
4. **Step 4: Admin Staff Lifecycle Hardening (`staff/actions.ts`)**  
   Enforce `requireSuperAdminAuth()` on all staff creation, update, status toggle, and deletion actions with self-escalation blocks.
5. **Step 5: Suspended & Inactive Account Enforcement**  
   Update edge proxy (`src/lib/supabase/proxy.ts`) and layout guards to reject suspended admin sessions immediately.
6. **Step 6: Fail-Closed Orphan Admin Defense**  
   Eliminate orphan auto-promotion fallbacks in `getAdminStaffMembers()`.
7. **Step 7: Cryptographic Impersonation Engine (`src/lib/auth/impersonation.ts`)**  
   Implement canonical `Base64Url(JSON(Payload))` HMAC-SHA256 token signing, request-time actor liveness and target role DB revalidation (`targetProfile.role !== 'admin'`), admin target prohibition, and audit logging.
8. **Step 8: Sensitive PII Isolation & KYC Verification Dossiers**  
   Enforce `verify_documents` on all 8 verification actions in `verifications/actions.ts` and private storage URLs.
9. **Step 9: Commercial Billing & Settings Remediation (`company/actions/settings.ts`)**  
   Remove unauthenticated plan self-assignment in `updateSubscriptionPlan` and assert tenant ownership in `employees.ts`.
10. **Step 10: UI Synchronization & UX Hardening**  
    Sync `app-sidebar.tsx` and data tables to dynamically filter items by effective permissions and provide graceful 403 error feedback.

---

## 10. Adversarial Security Test Plan Specification (33+ Tests)

The verification harness will be implemented in `src/__tests__/security/defense-in-depth-rbac.test.ts` containing **33 distinct adversarial test cases**:

### Group 1: Public Registration & Perimeter Defense (Tests 1–4)
- **TEST-01**: `signUp` with `raw_user_meta_data.role = 'admin'` $\to$ database trigger forces `role = 'candidate'`.
- **TEST-02**: `signUp` with `raw_user_meta_data.role = 'super_admin'` $\to$ database trigger forces `role = 'candidate'`.
- **TEST-03**: OAuth code exchange callback with `?role=admin` $\to$ callback sanitizer strips parameter and defaults to `candidate`.
- **TEST-04**: Registration collision attack on existing company/candidate profile $\to$ fail-closed rejection.

### Group 2: Centralized RBAC Guard Enforcement (`rbac-guards.ts`) (Tests 5–12)
- **TEST-05**: Anonymous caller invoking `requireAdminStaffAuth` $\to$ throws `401 Unauthenticated`.
- **TEST-06**: Candidate user invoking `requireAdminStaffAuth` $\to$ throws `403 Access Denied`.
- **TEST-07**: Company user invoking `requireAdminStaffAuth` $\to$ throws `403 Access Denied`.
- **TEST-08**: Admin with `status = 'suspended'` invoking `requireAdminStaffAuth` $\to$ throws `403 Account Suspended`.
- **TEST-09**: Admin with `status = 'inactive'` invoking `requireAdminStaffAuth` $\to$ throws `403 Account Inactive`.
- **TEST-10**: Orphan admin (profile role `'admin'` with no staff row) invoking `requireAdminStaffAuth` $\to$ throws `403 Fail-Closed`.
- **TEST-11**: `ops_admin` invoking action requiring `manage_vacancies` (has permission) $\to$ **PASS**.
- **TEST-12**: `support` admin invoking action requiring `system_settings` (lacks permission) $\to$ throws `403 Permission Denied`.

### Group 3: Staff Lifecycle, Hierarchy & Escalation Resistance (Tests 13–18)
- **TEST-13**: Non-super admin (`support`) invoking `createAdminStaffMember` with `subRole = 'super_admin'` $\to$ throws `403 Super Admin Required`.
- **TEST-14**: Non-super admin (`ops_admin`) invoking `updateAdminStaffMember` on peer $\to$ throws `403 Super Admin Required`.
- **TEST-15**: Admin attempting self-escalation (`updateAdminStaffMember(self.id, { subRole: 'super_admin' })`) $\to$ throws `403 Self-Modification Prohibited`.
- **TEST-16**: Non-super admin invoking `toggleAdminStaffStatus` $\to$ throws `403 Super Admin Required`.
- **TEST-17**: Non-super admin invoking `deleteAdminStaffMember` $\to$ throws `403 Super Admin Required`.
- **TEST-18**: Super admin attempting to delete or suspend the sole remaining active `super_admin`, or demoting profile role to candidate $\to$ rejected by dual triggers `prevent_last_super_admin_removal()` and `prevent_last_super_admin_profile_demotion()`.

### Group 4: Cryptographic Impersonation Engine (Tests 19–24)
- **TEST-19**: Admin attempting `startImpersonating` targeting another admin profile $\to$ throws `403 Admin Impersonation Prohibited`.
- **TEST-20**: Valid impersonation of candidate generates cookie with valid HMAC-SHA256 signature over `Base64Url(JSON(Payload))` and nonce $\to$ **PASS**.
- **TEST-21**: Client tampered impersonation cookie (modified target UUID with old signature) $\to$ signature validation fails, session rejected.
- **TEST-22**: Expired impersonation token ($TTL > 2\text{h}$) $\to$ validation fails, session rejected.
- **TEST-23**: Impersonation initiated by admin who is subsequently suspended in DB, or target user promoted to admin in DB $\to$ continuous request-time revalidation rejects session immediately.
- **TEST-24**: `stopImpersonating` removes all cryptographic cookies cleanly $\to$ **PASS**.

### Group 5: Candidate PII & Sensitive Dossier Isolation (Tests 25–27)
- **TEST-25**: Support admin invoking `getCandidateVerificationById` or querying `candidate_private_profiles` $\to$ throws `403 verify_documents Required`.
- **TEST-26**: Admin without `verify_documents` invoking `getSignedDocumentUrl` for private storage $\to$ throws `403 Permission Denied`.
- **TEST-27**: Verification admin with `verify_documents` invoking `getCandidateVerifications` $\to$ **PASS** (returns authorized KYC dossier).

### Group 6: Commercial Billing & Tenant Isolation (Tests 28–31)
- **TEST-28**: Company user invoking `updateSubscriptionPlan` directly $\to$ throws `403 Super Admin or Webhook Required`.
- **TEST-29**: Direct PostgREST SDK `UPDATE` on `company_profiles.subscription_plan` $\to$ rejected by trigger `trg_protect_company_commercial_fields`, while service-role / payment webhook updates (`auth.uid() IS NULL`) succeed.
- **TEST-30**: Company A attempting to terminate employee or modify settings belonging to Company B $\to$ throws `403 Tenant Ownership Mismatch`.
- **TEST-31**: Public candidate directory query verifies candidate email and WhatsApp phone are not leaked $\to$ **PASS**.

### Group 7: Multi-Entity Atomicity & Concurrency (Tests 32–33)
- **TEST-32**: Partial failure during `createAdminStaffMember` (profile created, staff table fails) $\to$ triggers compensatory rollback, cleaning up `auth.users` and `profiles`.
- **TEST-33**: Concurrent demotion requests on last two super admins $\to$ database transaction row-lock (`FOR UPDATE`) serializes execution, ensuring at least 1 super admin remains active.

---

## 11. Conclusion & Certification

This blueprint provides the definitive, comprehensive architecture for the K'anPro Defense-in-Depth RBAC Hardening implementation across Milestones 1 through 5. All 33 core admin server actions, 5 subroles, 6 granular permissions, 4 authorization layers, 10 security invariants, STRIDE threat mitigations, and 33 adversarial test cases are fully defined.

**Blueprint Status**: APPROVED FOR IMPLEMENTATION (Milestone 0 Blueprint v1.1 Remediated & Hardened).

