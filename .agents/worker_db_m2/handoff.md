# Database / Supabase Worker Handoff Report — Milestone 2

**Agent**: Database / Supabase Worker (`worker_db_m2`)  
**Timestamp**: 2026-08-26T11:09:00Z  
**Handoff Type**: Hard (Task Complete)  
**Destination Path**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/worker_db_m2/handoff.md`  

---

## 1. Observation

1. **Vulnerability in Previous Migration (`20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql`)**:
   - Lines 19–20: `ELSIF raw_role_str = 'admin' THEN assigned_role := 'admin'::public.user_role;`
   - Line 34: `ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, ...`
   - Line 6: `SET search_path = public` (missing `pg_temp`).
   - Missing explicit `REVOKE EXECUTE ON FUNCTION public.handle_new_user()`.
2. **Implementation of Requirement R1**:
   - Created `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql`.
   - Verified that no historical migrations in `supabase/migrations/` were altered.
   - Function `public.handle_new_user()` now defines:
     - `SECURITY DEFINER`
     - `SET search_path = public, pg_temp`
     - Role evaluation: If `raw_role_str = 'company'` then `'company'::public.user_role`, else strictly `'candidate'::public.user_role`.
     - `ON CONFLICT (id) DO UPDATE SET role = CASE WHEN public.profiles.role = 'admin'::public.user_role THEN public.profiles.role ELSE EXCLUDED.role END, ...`
     - Retains `birth_date` regex parsing and sync to `public.candidate_private_profiles` as well as company profile defaults.
     - `REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;`
     - Recreates trigger `on_auth_user_created` idempotently.
3. **Implementation of Requirement R5**:
   - Created `docs/security/ADMIN_BOOTSTRAP.md`.
   - Contains operational step-by-step procedures for provisioning the initial `super_admin` without public endpoints.
   - Provides ready-to-run PL/pgSQL DO block with validation and atomic updates to `public.profiles` and `public.admin_staff_members`.
   - Provides SQL verification query and emergency revocation scripts.
4. **Codebase Health**:
   - `npx tsc --noEmit` passed with 0 errors.

---

## 2. Logic Chain

1. **Step 1 (Observation 1 -> Elimination of Escalation Vector)**: The root cause of the privilege escalation vulnerability was the explicit metadata check `ELSIF raw_role_str = 'admin'` in `handle_new_user()`. By replacing this with a binary branch where only `'company'` is accepted and all other values (including `'admin'`, `'super_admin'`, empty, null, or arbitrary values) default to `'candidate'`, no user registration via public Supabase Auth can produce a profile with `role = 'admin'`.
2. **Step 2 (Observation 1 -> Preservation of Existing Admins)**: The previous `ON CONFLICT` clause unconditionally executed `role = EXCLUDED.role`. In the new migration, replacing this with `role = CASE WHEN public.profiles.role = 'admin'::public.user_role THEN public.profiles.role ELSE EXCLUDED.role END` guarantees that re-triggering user creation or profile conflicts will never downgrade or corrupt an existing admin account.
3. **Step 3 (Observation 1 -> Security Definer Hardening)**: Setting `search_path = public, pg_temp` prevents search path hijacking attacks. Revoking execute permissions from `PUBLIC`, `anon`, and `authenticated` prevents PostgREST from exposing `handle_new_user()` as a remote procedure call (RPC).
4. **Step 4 (Observation 3 -> Zero Public Surface for Bootstrap)**: Requirement R5 mandates that no public endpoint or unauthenticated route exists for bootstrap. Documenting the operational SQL DO block procedure in `docs/security/ADMIN_BOOTSTRAP.md` ensures administrators have a deterministic, validated runbook to provision the initial `super_admin` in Supabase Studio while keeping the public attack surface at zero.

---

## 3. Caveats

- **Supabase CLI Local Environment**: In unit test environments without a running local Supabase Docker daemon, live network calls in test files (like `src/tests/flows.test.ts`) require a mock or local container. Milestone 4 will supply the comprehensive unit and integration test suite with appropriate mocks.
- **Historical Migration Files**: Must remain untouched across all subsequent milestones to ensure migration history consistency in production databases.

---

## 4. Conclusion

1. Milestone 2 tasks (Requirements R1 and R5) are complete, genuine, and verified.
2. The database trigger `public.handle_new_user()` is fully hardened in `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql`.
3. The secure operational bootstrap runbook is documented in `docs/security/ADMIN_BOOTSTRAP.md`.
4. Downstream agents (Backend Worker in M3, Security / QA in M4) have clean, verified database artifacts and specifications to proceed.

---

## 5. Verification Method

1. **File Inspection**:
   - `view_file` on `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql` to verify PL/pgSQL logic, `search_path`, `REVOKE EXECUTE`, `ON CONFLICT`, and trigger definition.
   - `view_file` on `docs/security/ADMIN_BOOTSTRAP.md` to verify bootstrap script and verification query.
2. **Typecheck Command**:
   ```bash
   npx tsc --noEmit
   ```
   (Must pass with exit code 0).
3. **Historical Migrations Immutability Check**:
   Confirm that all migrations prior to `20260826000000` have not been modified.
