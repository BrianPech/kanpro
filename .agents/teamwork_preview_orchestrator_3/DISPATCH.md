## 2026-08-27T10:42:13Z

You are the Project Orchestrator for the Defense-in-Depth RBAC Hardening implementation for K'anPro.

Your assigned working directory is:
/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_orchestrator_3

The project root is:
/Users/brianpech/Developer/Commercial/kanpro

Read the latest user request in:
/Users/brianpech/Developer/Commercial/kanpro/.agents/ORIGINAL_REQUEST.md
(section timestamp: 2026-08-27T10:41:05Z)

Your mission and deliverables:
1. Phase 0 — Blueprint de Arquitectura RBAC:
   - Generate exhaustive blueprint at `docs/security/RBAC_HARDENING_BLUEPRINT.md` before modifying code or executing migrations.
   - Must cover inventory of all 33 admin server actions, formal RBAC matrix by subrole, authorization model, defense-in-depth layers, fail-closed rules, staff lifecycle, STRIDE threat model, P0-P3 prioritization.
2. Phase 1 — 10-Step Implementation:
   - Paso 1: `src/lib/auth/rbac-guards.ts` (centralized server guards: `requireAdminStaffAuth`, `requireSuperAdminAuth`, `requireActiveAdmin`).
   - Paso 2: SQL migration with SECURITY DEFINER functions (`is_active_admin`, `is_super_admin`, `has_admin_permission`, trigger `prevent_last_super_admin_removal`).
   - Paso 3: PostgreSQL RLS restructuring (`admin_staff_members`, `candidate_private_profiles`, `company_profiles` BEFORE UPDATE trigger/policy against subscription bypass, `profiles` directory leak fix).
   - Paso 4: Staff actions hardening in `staff/actions.ts` (super_admin-only, no self-escalation, prevent last super_admin removal).
   - Paso 5: Suspended/inactive account enforcement in proxy, layout guards, server actions, and RLS.
   - Paso 6: Fail-closed for orphan admins without `admin_staff_members` rows.
   - Paso 7: Cryptographic HMAC-SHA256 impersonation engine in `src/lib/auth/impersonation.ts` with continuous revalidation, actor active check, admin target prohibition.
   - Paso 8: PII isolation & verification in `verifications/actions.ts` (`verify_documents` permission required).
   - Paso 9: Subscription & billing remediation in `company/actions/settings.ts` (no unauthenticated enterprise self-assignment, companyId ownership checks).
   - Paso 10: UI & UX synchronization (`app-sidebar.tsx`, modals, clean 403 handling).
3. Acceptance Criteria & Test Verification:
   - Implement adversarial test suite (minimum 33 mandatory test cases).
   - Ensure all 93 pre-existing tests pass 100% without modification or relaxed assertions.
   - Ensure new adversarial test suite passes 100%.
   - Typecheck (`tsc --noEmit`) passes with 0 errors.
   - ESLint passes with 0 errors.
   - Production build `next build --webpack` succeeds.
   - Deliver `docs/security/RBAC_HARDENING_BLUEPRINT.md` and `docs/security/RBAC_HARDENING_FINAL_AUDIT.md`.
