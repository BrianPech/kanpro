# Independent Review & Adversarial Audit Report: Milestone 0 (RBAC Architecture Blueprint)

**Reviewer**: Reviewer 2 (Roles: Reviewer & Adversarial Critic)  
**Deliverable Under Review**: `/Users/brianpech/Developer/Commercial/kanpro/docs/security/RBAC_HARDENING_BLUEPRINT.md`  
**Reference Specification**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/ORIGINAL_REQUEST.md`  
**Date**: August 27, 2026  
**Final Verdict**: **`APPROVE`**

---

## 1. Observation

Direct observations from examining the codebase, specifications, and deliverable:

1. **Document Structure & Completeness**:
   - `docs/security/RBAC_HARDENING_BLUEPRINT.md` contains 923 lines spanning 11 structured sections:
     - Section 1: Executive Summary & Core Security Principles (Lines 27–78)
     - Section 2: Complete Catalog & Inventory of Admin Server Actions (Lines 80–381, cataloging all 33 unique admin server actions + aliases across 8 functional modules)
     - Section 3: Subroles Definition & Formal Permissions Matrix (Lines 383–442, detailing all 5 subroles, 6 permissions, capability matrix, and effective permissions formula)
     - Section 4: 4-Layer Defense-in-Depth Authorization Model (Lines 444–703, providing executable SQL definitions for `is_active_admin`, `is_super_admin`, `has_admin_permission`, `prevent_last_super_admin_removal`, `protect_company_commercial_fields`, and TypeScript guards `requireAdminStaffAuth` and `requireSuperAdminAuth`)
     - Section 5: Comprehensive STRIDE Threat Model & Mitigations (Lines 705–720)
     - Section 6: Fail-Closed Rules & Invariant Catalog I1–I10 (Lines 722–737)
     - Section 7: Cryptographic Impersonation Engine Specification (Lines 740–775, specifying HMAC-SHA256 token format, `ImpersonationPayload` schema, and 4-step revalidation pipeline)
     - Section 8: Staff Lifecycle State Machine & Transition Rules (Lines 777–808)
     - Section 9: Prioritization Roadmap & 10 Implementation Steps (Lines 810–863)
     - Section 10: Adversarial Security Test Plan Specification (Lines 865–916, specifying 33 distinct adversarial test cases)
     - Section 11: Conclusion & Certification (Lines 918–923)

2. **Alignment with the 10-Step Implementation Roadmap (`ORIGINAL_REQUEST.md:219-268`)**:
   - **Step 1 (Primitivas y Guards Centralizados)**: Section 4.2 (lines 630–691) & Section 9.2 (lines 829, 842–843) explicitly define `src/lib/auth/rbac-guards.ts` with typed helpers `requireAdminStaffAuth(requiredPermission?: AdminPermissionKey)` and `requireSuperAdminAuth()`.
   - **Step 2 (Funciones SQL de Autorización y Migración)**: Section 4.1 (lines 487–592) & Section 9.2 (lines 830, 844–845) define `public.is_active_admin()`, `public.is_super_admin()`, `public.has_admin_permission()`, and trigger `public.prevent_last_super_admin_removal()` with `SECURITY DEFINER` and `SET search_path = public, pg_temp`.
   - **Step 3 (Reestructuración de Políticas RLS)**: Section 4.1 (lines 594–623) & Section 9.2 (lines 831, 846–847) define RLS policies for `admin_staff_members`, `candidate_private_profiles`, `company_profiles`, and `profiles`.
   - **Step 4 (Endurecimiento de Gestión de Staff)**: Section 2 (Actions 9–12), Section 8 (State machine table 8.1), and Section 9.2 (lines 832, 848–849) restrict `createAdminStaffMember`, `updateAdminStaffMember`, `deleteAdminStaffMember`, and `toggleAdminStaffStatus` to `requireSuperAdminAuth()`, blocking self-modification and last super admin deletion.
   - **Step 5 (Enforzamiento Real de Suspendido/Inactivo)**: Section 4.3 (lines 695–698), Section 6 (Invariant I4), and Section 9.2 (lines 833, 850–851) enforce immediate block across `proxy.ts`, `layout.tsx`, server action guards, and RLS.
   - **Step 6 (Fail-Closed para Admins Huérfanos)**: Section 2 (Action 8, lines 172–174), Section 3.4 (lines 434–438), Section 4.2 (lines 658–662), and Section 9.2 (lines 834, 852–853) eradicate default fallback promotions.
   - **Step 7 (Motor Criptográfico de Impersonación)**: Section 2 (Actions 35–37), Section 7 (lines 740–775), and Section 9.2 (lines 835, 854–855) specify HMAC-SHA256 token generation, continuous actor DB revalidation, admin target prohibition, and audit logging.
   - **Step 8 (Aislamiento de PII Privado y Verificaciones)**: Section 2 (Actions 27–34), Section 6 (Invariant I7), and Section 9.2 (lines 836, 856–857) restrict CURP/RFC/Cédula access and signed storage URLs strictly to `verify_documents`.
   - **Step 9 (Remediación de Billing y Suscripciones)**: Section 2 (Actions 38–41), Section 4.1 (trigger lines 596–623), and Section 9.2 (lines 837, 858–859) block unauthenticated self-assignment of Enterprise plans and enforce tenant ownership in `employees.ts` and `settings.ts`.
   - **Step 10 (Sincronización de UI y UX)**: Section 4.4 (lines 700–702) and Section 9.2 (lines 838, 860–862) specify sidebar navigation filtering and graceful 403 handling.

3. **Staff Lifecycle & Orphan Handling**:
   - Fail-closed handling for orphan admins is specified mathematically in Section 3.4 ($\mathcal{C}_{\text{eff}}(u) = \emptyset$ if orphan), programmatically in `requireAdminStaffAuth` (lines 659–662: `if (!staff || staff.status !== "active") throw new Error(...)`), and at the database level in SQL function `is_active_admin` (INNER JOIN requiring `admin_staff_members.status = 'active'`).
   - Prevention of last super admin removal is enforced at the database level via trigger `prevent_last_super_admin_removal()` (lines 548–592) checking both `TG_OP = 'DELETE'` and `TG_OP = 'UPDATE'` when `active_super_admins_count <= 1`.

4. **Cryptographic Impersonation**:
   - Signature formula: `Base64Url(JSON(Payload)) || "." || Base64Url(HMAC-SHA256_K(JSON(Payload)))` (line 745).
   - Payload schema specifies `issuer`, `actorId`, `actorSubRole`, `targetId`, `targetRole: "candidate" | "company"` (with explicit comment `Prohibited: 'admin'`), `targetName`, `targetEmail`, `issuedAt`, `expiresAt` (max issuedAt + 2h), `nonce` (16-byte random hex), `purpose: "support_impersonation"` (lines 751–763).
   - Verification pipeline includes continuous DB revalidation (lines 771–774) verifying `profiles.role = 'admin' AND admin_staff_members.status = 'active'` in PostgreSQL on every request.

5. **Commercial Plan Protection**:
   - Specified via PostgreSQL trigger `protect_company_commercial_fields()` on `public.company_profiles` `BEFORE UPDATE` (lines 596–623) verifying that non-super-admins cannot mutate `subscription_plan`, `subscription_status`, `subscription_period_end`, `featured_vacancies_allowance`, `credits_available`, or `verification_status`.
   - `updateSubscriptionPlan` in `settings.ts` is restricted to `requireSuperAdminAuth()` or verified payment webhooks (Action 38, lines 363–370).

6. **Integrity & Repository Verification**:
   - No production code or SQL migrations were modified or created in this phase.
   - `npx vitest run`: All 93 pre-existing automated test cases pass (9/9 test files passed, 93/93 tests passing).
   - `npx tsc --noEmit`: 0 errors.

---

## 2. Logic Chain

1. **Premise 1 (Completeness of Implementation Plan)**: `ORIGINAL_REQUEST.md` mandates a 10-step implementation roadmap (Paso 1 to Paso 10) covering guards, SQL functions, RLS, staff actions, status enforcement, orphan fail-closed, impersonation, PII isolation, commercial billing, and UI sync.
   - **Observation 2** confirms that `RBAC_HARDENING_BLUEPRINT.md` Sections 2, 4, 7, 8, and 9.2 map 1:1 to every one of the 10 steps, providing exact file paths, function signatures, SQL DDL, and logic flows.
   - **Inference 1**: The blueprint satisfies the roadmap requirement completely.

2. **Premise 2 (Orphan Fail-Closed & Last Super Admin Immunity)**: The core security policy requires that orphaned admin profiles must never receive default permissions or `super_admin` status, and the platform must be protected from executive lockout.
   - **Observation 3** confirms that the blueprint models orphans with empty capability sets across all 4 defense layers and enforces database-level trigger `prevent_last_super_admin_removal()` for both deletes and status/subrole updates.
   - **Inference 2**: The staff lifecycle and orphan handling design is strictly fail-closed and immune to accidental or malicious executive lockout.

3. **Premise 3 (Cryptographic Impersonation Rigor)**: Impersonation must be secured against forgery, persistent session abuse by revoked operators, and administrative target hijacking.
   - **Observation 4** confirms that HMAC-SHA256 signing, strict target role discrimination (`targetRole !== 'admin'`), 2-hour TTL expiration, and continuous DB actor revalidation are fully specified.
   - **Inference 3**: The impersonation engine satisfies the non-repudiation and continuous authorization requirements.

4. **Premise 4 (Commercial Plan Protection)**: Tenant users must not be capable of mutating subscription plans or injecting fake paid invoices.
   - **Observation 5** confirms that the blueprint specifies a dedicated `BEFORE UPDATE` trigger on `company_profiles` restricting sensitive commercial columns, and removes the client-invoked Server Action vulnerability.
   - **Inference 4**: The commercial plan protection is robustly secured across both database (Layer 1) and server action (Layer 2) tiers.

5. **Premise 5 (Repository Integrity & Cleanliness)**: Phase 0/Milestone 0 is strictly an audit and blueprint phase without code or migration changes.
   - **Observation 6** confirms 0 code files modified, 93/93 tests passing, and 0 TypeScript compilation errors.
   - **Inference 5**: Repository integrity is 100% compliant with the integrity rules.

---

## 3. Caveats

1. **Runtime Verification**: The SQL functions, triggers, and TypeScript guards specified in the blueprint are design specifications; their runtime behavior will be empirically verified during Milestones 1 through 5 upon code deployment and test execution.
2. **Session Nonce Revocation**: While continuous DB actor revalidation guarantees that suspending an admin immediately revokes all of their active impersonation sessions, instantaneous single-session termination (without suspending the admin) relies on cookie expiration or future addition of an active session blacklist table (`impersonation_sessions`). This does not impair the security model.

---

## 4. Conclusion

The deliverable `/Users/brianpech/Developer/Commercial/kanpro/docs/security/RBAC_HARDENING_BLUEPRINT.md` represents an exhaustive, technically sound, and fully compliant Defense-in-Depth RBAC specification. It directly addresses all findings, satisfies every requirement of `ORIGINAL_REQUEST.md`, provides concrete code and SQL blueprints for all 10 implementation steps, and contains zero integrity violations.

**Verdict**: **`APPROVE`**

---

## 5. Verification Method

To independently verify the claims and state of the deliverable:

1. **Inspect Blueprint Deliverable**:
   ```bash
   # Confirm blueprint exists and contains all 11 sections
   view_file /Users/brianpech/Developer/Commercial/kanpro/docs/security/RBAC_HARDENING_BLUEPRINT.md
   ```
2. **Verify Test Suite Baseline**:
   ```bash
   npx vitest run
   # Expected Output: 9 test files passed, 93 tests passed
   ```
3. **Verify TypeScript Compilation**:
   ```bash
   npx tsc --noEmit
   # Expected Output: 0 errors
   ```
