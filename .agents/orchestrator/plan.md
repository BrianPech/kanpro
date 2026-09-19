# Execution Plan: K'anPro Admin Creation Security Hardening

## Phase 1: Survey & Security Assessment (Milestone 1)
- Dispatch 3 parallel exploratory agents:
  1. `teamwork_preview_explorer` (Security / Auth Auditor): Deep dive into escalation vectors, `auth/callback/route.ts`, `dashboard-session.ts`, env vars, RLS policies, and test requirements.
  2. `teamwork_preview_spec_miner` (Database / Supabase Inspector): Deep dive into `handle_new_user()`, historical migrations in `supabase/migrations/`, real tables (`profiles`, `candidate_profiles`, `candidate_private_profiles`, `company_profiles`, `admin_staff_members`), enums, triggers, and constraints.
  3. `teamwork_preview_explorer` (Backend Flow Analyst): Deep dive into `src/app/(dashboard)/dashboard/admin/staff/actions.ts`, `new-staff-form.tsx`, session management, auth client imports, and test harness setup (vitest/jest).

## Phase 2: Database Migration & Schema Hardening (Milestone 2)
- Worker (`teamwork_preview_worker` with supabase domain skills):
  - Generate new idempotent SQL migration for `handle_new_user()` conforming to R1.
  - Create secure bootstrap documentation (`ADMIN_BOOTSTRAP.md`) conforming to R5.
- Verification:
  - Reviewer verifies SQL semantics, ON CONFLICT behavior, enums, timestamps, and bootstrap steps.

## Phase 3: Backend Implementation (Milestone 3)
- Worker (`teamwork_preview_worker`):
  - Implement `src/lib/supabase/admin.ts` (R2).
  - Refactor `createAdminStaffMember()` (R3) with real UUID, explicit promotion, rejection of existing non-admin, compensatory rollback, and executor session preservation.
  - Sanitize `src/app/(auth)/auth/callback/route.ts` and `src/modules/auth/services/dashboard-session.ts` (R4).
- Verification:
  - Reviewer & Challenger verify implementation correctness, security, session integrity, and rollback.

## Phase 4: Automated Testing & End-to-End Verification (Milestone 4)
- Worker / Test Writer (`teamwork_preview_test_writer` or `teamwork_preview_worker`):
  - Implement 12 automated security tests matching Acceptance Criteria.
  - Execute test suite, run `tsc --noEmit`, run linter, run build.
- Reviewer + Challenger + Forensic Auditor:
  - Reviewer reviews code quality & test coverage.
  - Challenger stress-tests edge cases.
  - Forensic Auditor (`teamwork_preview_auditor`) performs binary integrity audit.
- Orchestrator Final Report & Synthesis.
