# BRIEFING — 2026-08-27T10:46:00Z

## Mission
Investigate Supabase/PostgreSQL database schema, RLS policies, SQL helper functions, billing/subscription flows, and test harness infrastructure for Defense-in-Depth RBAC Hardening in K'anPro.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_survey_3
- Original parent: 2cc9893f-6efd-44ed-b85b-6f912ce3f931
- Milestone: Preview Survey 3 (Database & Test Harness)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify application code / migrations
- Strictly explore and document PostgreSQL schemas, RLS policies, SQL functions, billing flows, and test harness
- Document all findings with exact file paths, line numbers, and evidence

## Current Parent
- Conversation ID: 2cc9893f-6efd-44ed-b85b-6f912ce3f931
- Updated: 2026-08-27T10:46:00Z

## Investigation State
- **Explored paths**: `supabase/migrations/` (all 19 migration files), `src/modules/company/actions/` (`settings.ts`, `employees.ts`, `vacancies.ts`, `document-access.ts`), `src/app/(dashboard)/dashboard/admin/` (`staff/actions.ts`, `verifications/actions.ts`, `users/actions.ts`, `support/actions.ts`, `reports/actions.ts`, `actions.ts`), `vitest.config.ts`, `package.json`, and all 9 test suites (`src/tests/*`, `src/__tests__/*`, `src/modules/company/schemas/__tests__/*`).
- **Key findings**:
  1. PostgreSQL RLS policies rely entirely on `public.is_admin()`, creating a flat "admin = root" paradigm granting full access on all tables regardless of sub_role, status, or permissions.
  2. `company_profiles` has an unconstrained `UPDATE` policy (`id = auth.uid()`), allowing companies to self-upgrade to enterprise and adjust credit limits directly via the Supabase client.
  3. `updateSubscriptionPlan` in `settings.ts` lacks tenant ownership assertions (`companyId === user.id`) and payment verification, generating free paid invoices.
  4. Test suite has 9 files with 93 tests in Vitest (all 93 passing). Mocking patterns for Supabase clients and Next.js server utilities are fully documented.
- **Unexplored areas**: None for this survey scope.

## Key Decisions Made
- Completed survey report in `survey_db_test_report.md`
- Prepared 5-component handoff report in `handoff.md`

## Artifact Index
- survey_db_test_report.md — Comprehensive database & test harness report
- handoff.md — 5-component handoff report
