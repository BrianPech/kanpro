# BRIEFING — 2026-08-27T10:54:25Z

## Mission
Remediate and update `docs/security/RBAC_HARDENING_BLUEPRINT.md` to version 1.1 incorporating 6 hardening amendments identified by Challengers 1 & 2 for Milestone 0.

## 🔒 My Identity
- Archetype: implementer, qa, specialist
- Roles: implementer, qa, specialist
- Working directory: /Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_worker_m0_remediate
- Original parent: 2cc9893f-6efd-44ed-b85b-6f912ce3f931
- Milestone: Milestone 0 (Blueprint Remediation)

## 🔒 Key Constraints
- DO NOT CHEAT: Genuine implementation only.
- ZERO modifications to source code, migrations, or tests in this phase (only `docs/security/RBAC_HARDENING_BLUEPRINT.md` is updated).
- Incorporate all 6 mandatory hardening amendments.
- Preserve 100% test passing baseline (93/93) and 0 typecheck/lint errors.

## Current Parent
- Conversation ID: 2cc9893f-6efd-44ed-b85b-6f912ce3f931
- Updated: 2026-08-27T10:54:25Z

## Task Summary
- **What to build**: Update `docs/security/RBAC_HARDENING_BLUEPRINT.md` to v1.1 with:
  1. Dual-trigger architecture for Invariant I3 (`trg_prevent_last_super_admin_removal` on `admin_staff_members` and `trg_prevent_last_super_admin_profile_demotion` on `profiles`) + `FOR UPDATE` row-locking.
  2. Service-Role Webhook Handling for `protect_company_commercial_fields()` (`IF (auth.uid() IS NOT NULL) AND (NOT public.is_super_admin(auth.uid())) THEN ...`).
  3. Impersonation Continuous Revalidation (Section 7.3 Step 4) target role revalidation query (`targetProfile.role !== 'admin'`).
  4. HMAC Token Format & Encoding: Standardize signing over `Base64Url(JSON(Payload))` (UTF-8 bytes).
  5. Catalog Action Parameter Sync: `toggleCompanyVerification(companyId: string, isVerified: boolean)` and `toggleProfileVerification(profileId: string, isValidated: boolean)`.
  6. Explicit PostgreSQL Grants on SECURITY DEFINER functions for `authenticated` and `service_role` (and REVOKE from public, anon).
- **Success criteria**: Blueprint updated with surgical precision, test suite passes 93/93, tsc exits 0, handoff.md written.
- **Interface contracts**: PROJECT.md / ORIGINAL_REQUEST.md
- **Code layout**: `docs/security/RBAC_HARDENING_BLUEPRINT.md`

## Key Decisions Made
- Version bumped to 1.1.0-HARDENED.
- Retain all 17+ sections/table of contents structure and full catalog while updating affected code snippets, formulas, and test plans.

## Change Tracker
- **Files modified**: `docs/security/RBAC_HARDENING_BLUEPRINT.md`
- **Build status**: Vitest 93/93 pass, tsc 0 errors
- **Pending issues**: None

## Quality Status
- **Build/test result**: 93/93 pass
- **Lint status**: 0 errors
- **Tests added/modified**: None (Blueprint phase)

## Loaded Skills
- None required for doc editing.

## Artifact Index
- `/Users/brianpech/Developer/Commercial/kanpro/docs/security/RBAC_HARDENING_BLUEPRINT.md` — Updated v1.1 RBAC Blueprint
- `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_worker_m0_remediate/handoff.md` — Final handoff report
