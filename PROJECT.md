# Project: K'anPro Admin Creation Security Hardening & Privilege Escalation Fix

## Architecture
- **Authentication & Database**: Supabase Auth (`auth.users`) + PostgreSQL Triggers (`public.handle_new_user()`) + Profiles table (`public.profiles`) + Admin Staff table (`public.admin_staff_members`).
- **Backend**: Next.js App Router Server Actions + Supabase Server SDK + Server-Only Supabase Admin Client (`src/lib/supabase/admin.ts`).
- **Security Invariant**:
  - `public.handle_new_user()` strictly creates `candidate` or `company` profiles only. Under no circumstances can metadata elevate a user to `admin`.
  - Elevation to `role = 'admin'` occurs strictly via authenticated admin execution of `createAdminStaffMember` using the privileged `createAdminClient()` (Service Role).
  - Compensatory rollback deletes newly created auth user if subsequent profile/staff steps fail.
  - `auth/callback` and `dashboard-session` rely strictly on `profiles.role` in the database, ignoring user metadata.

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | SQL Trigger Hardening (`handle_new_user`) | New idempotent migration stripping admin creation from trigger, preserving legitimate behavior and ON CONFLICT safety | M2 | R1 | DONE |
| 2 | Server-Only Admin Supabase Client | `src/lib/supabase/admin.ts` with `server-only`, strict env checks, non-persisting session | M3 | R2 | DONE |
| 3 | Refactor `createAdminStaffMember()` | Real `auth.users.id` UUID, explicit promotion, reject existing non-admin, compensatory rollback, preserve executor session | M3 | R3 | DONE |
| 4 | Sanitize `auth/callback` & `dashboard-session` | Disallow `admin` in callback, database role as sole source of truth in session | M3 | R4 | DONE |
| 5 | Document Secure Bootstrap Procedure | Operational guide in SQL Editor / Supabase Dashboard for first admin | M2 | R5 | DONE |
| 6 | 12 Automated Security Test Suite | Unit/Integration tests covering public signup, callback tampering, metadata attacks, RBAC, rollback, etc. | M4 | R4/AC | DONE |
| 7 | Quality & Security Verification | Typecheck, lint, build, audit veto check, zero key leakage | M4 | AC | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Survey & Security Audit Assessment | Initial analysis of codebase, schemas, auth flow, and vulnerability vectors | none | DONE |
| 2 | Database & SQL Migration | Design & verify idempotent migration for `handle_new_user()`, write bootstrap guide | M1 | DONE |
| 3 | Backend Implementation | Implement `src/lib/supabase/admin.ts`, refactor `actions.ts`, sanitize `auth/callback` and `dashboard-session` | M1, M2 | DONE |
| 4 | Security Test Suite & Full Verification | Implement 12 security test cases, execute tests, typecheck, lint, build, final forensic audit | M2, M3 | DONE |

## Interface Contracts
### `createAdminClient()` (`src/lib/supabase/admin.ts`)
- Returns a SupabaseClient configured with `SUPABASE_SERVICE_ROLE_KEY` and `{ persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }`.
- Throws meaningful configuration error if env vars are missing.
- Marked with `import "server-only";`.

### `createAdminStaffMember(formData: FormData)` (`src/app/(dashboard)/dashboard/admin/staff/actions.ts`)
- Requires authenticated admin (`requireAdminAuth`).
- Uses `createAdminClient()`.
- Validates user existence. If existing `candidate`/`company` -> returns `{ success: false, error: "..." }`.
- If new -> `supabaseAdmin.auth.admin.createUser()`, awaits base profile creation, updates `profiles` to `admin` and `is_verified: true`, inserts `admin_staff_members`.
- On failure -> compensatory rollback via `supabaseAdmin.auth.admin.deleteUser()`.

## Code Layout
- Migrations: `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql` (created & verified)
- Admin Client: `src/lib/supabase/admin.ts` (created & verified)
- Staff Actions: `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (refactored & verified)
- Auth Callback: `src/app/(auth)/auth/callback/route.ts` (sanitized & verified)
- Dashboard Session: `src/modules/auth/services/dashboard-session.ts` (sanitized & verified)
- Security Tests: `src/__tests__/security/admin-privilege-hardening.test.ts` & `src/tests/` (created & verified)
- Bootstrap Guide: `docs/security/ADMIN_BOOTSTRAP.md` (created & verified)
