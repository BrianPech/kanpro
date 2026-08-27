# Adversarial Challenge Report — Milestone 2: Bootstrap & RBAC Integrity

- **Target**: `docs/security/ADMIN_BOOTSTRAP.md` & `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql`
- **Challenger**: Bootstrap & RBAC Challenger 2 (`challenger_2_db_m2`)
- **Date**: 2026-08-26T11:11:00Z
- **Verdict**: **APPROVE**

---

## Challenge Summary

**Overall risk assessment**: **LOW** (Robust, fail-safe, and zero public attack surface)

---

## Adversarial Challenges & Stress Tests

### Challenge 1: Public Exposure & Unauthenticated Attack Surface
- **Assumption Challenged**: The bootstrap guide might introduce or recommend a convenience API route, Server Action, or PostgREST RPC function to initialize the super administrator.
- **Attack Scenario**: An unauthenticated attacker discovers an initialization endpoint (`/api/admin/bootstrap` or an unprotected PostgREST RPC) and triggers it with their own credentials to elevate their privileges to `admin`.
- **Empirical Findings**:
  - `docs/security/ADMIN_BOOTSTRAP.md` explicitly avoids any HTTP endpoints or public APIs.
  - Section 1.1 states: *"No existe ningún endpoint HTTP público, ruta de API ni Server Action desprotegida capaz de otorgar el rol `admin`."*
  - The procedure requires executing the SQL DO block strictly within Supabase Studio SQL Editor (or direct `psql` connection authenticated as `postgres` or `service_role`).
  - Migration `20260826000000_harden_auth_user_creation_trigger.sql` explicitly revokes public execute access:
    ```sql
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
    ```
- **Blast Radius**: None. Attack surface is strictly zero on external network boundaries.
- **Verdict**: **PASS**

---

### Challenge 2: Transactional Atomicity & Partial State Failure
- **Assumption Challenged**: A partial failure during the DO block execution could leave a user in `public.profiles` with `role = 'admin'` without a corresponding record in `public.admin_staff_members`, or leave inconsistent state.
- **Attack / Failure Scenario**: An error occurs during the insertion into `public.admin_staff_members` (e.g., constraint error, invalid array element), leaving the profile promoted to `admin` without staff metadata or RBAC permissions.
- **Empirical Findings**:
  - In PostgreSQL, a `DO $$ ... $$;` block is executed within an implicit single transaction block.
  - Any unhandled exception (whether raised by `RAISE EXCEPTION` or a SQL constraint violation) immediately aborts and rolls back all statements within the block.
  - Furthermore, `public.profiles.id` references `auth.users(id) ON DELETE CASCADE` and `public.admin_staff_members.profile_id` references `public.profiles(id) ON DELETE CASCADE`. Foreign key integrity is maintained across all operations.
- **Blast Radius**: None. Operations are all-or-nothing (atomic).
- **Verdict**: **PASS**

---

### Challenge 3: Non-Existent Target UUID in `auth.users`
- **Assumption Challenged**: An operator might execute the bootstrap script with an incorrect, malformed, or non-existent UUID, creating phantom records in `public.profiles` or `public.admin_staff_members`.
- **Attack / Failure Scenario**: Running the DO block with a typo in the UUID creates orphaned records in `public.profiles`.
- **Empirical Findings**:
  - Step 1 of the DO block performs an explicit pre-flight validation check:
    ```sql
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
      RAISE EXCEPTION 'Error de Validación: El UUID % no existe en auth.users. Cree el usuario en Supabase Auth primero.', target_user_id;
    END IF;
    ```
  - If the UUID does not exist in `auth.users`, the transaction is aborted with a clear diagnostic message prior to any writes.
  - Even if this check were omitted, PostgreSQL's foreign key constraint `public.profiles.id REFERENCES auth.users(id)` would reject the insert and roll back the transaction.
  - If a malformed string is provided for `target_user_id`, PostgreSQL fails at type cast time (`'<USER_UUID>'::uuid`) before statement execution.
- **Blast Radius**: None. Fail-fast error reporting without partial data creation.
- **Verdict**: **PASS**

---

### Challenge 4: Multiple Executions & Idempotency
- **Assumption Challenged**: Re-running the bootstrap script on an already-bootstrapped administrator might cause duplicate key errors (`23505`) or overwrite custom changes unpredictably.
- **Attack / Failure Scenario**: Running the script twice triggers a unique constraint violation on `public.profiles(id)` or `public.admin_staff_members(profile_id)`.
- **Empirical Findings**:
  - `public.profiles` insertion utilizes:
    ```sql
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin'::public.user_role,
      is_verified = true,
      full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
      email = EXCLUDED.email,
      updated_at = NOW();
    ```
  - `public.admin_staff_members` insertion utilizes:
    ```sql
    ON CONFLICT (profile_id) DO UPDATE SET
      sub_role = EXCLUDED.sub_role,
      department = EXCLUDED.department,
      status = EXCLUDED.status,
      permissions = EXCLUDED.permissions,
      notes = EXCLUDED.notes,
      updated_at = NOW();
    ```
  - `public.admin_staff_members.profile_id` has a unique constraint (`profile_id UUID UNIQUE NOT NULL`), ensuring `ON CONFLICT (profile_id)` correctly resolves to an update.
  - Repeated executions safely refresh the administrative profile and staff credentials without throwing errors or corrupting data.
- **Blast Radius**: None. Completely idempotent.
- **Verdict**: **PASS**

---

### Challenge 5: Schema Consistency, Types, Sub-Roles, and Permissions
- **Assumption Challenged**: The values hardcoded in the bootstrap script (enums, arrays, strings) might diverge from the actual database schema or application TypeScript definitions.
- **Empirical Verification**:
  1. **Role Enum**:
     - DB definition (`20260728000000_initial_schema.sql`): `CREATE TYPE user_role AS ENUM ('candidate', 'company', 'admin');`
     - Bootstrap Script: `'admin'::public.user_role` -> **MATCH**
  2. **Sub-Role & Department**:
     - TypeScript definition (`src/modules/admin/types/staff.ts`):
       - `AdminSubRole = "super_admin" | "ops_admin" | "content_admin" | "verification_admin" | "support"`
       - `STAFF_DEPARTMENTS`: includes `{ value: "Dirección General", label: "Dirección General / Directiva" }`
     - Bootstrap Script: `sub_role = 'super_admin'`, `department = 'Dirección General'` -> **MATCH**
  3. **Status**:
     - TypeScript definition: `AdminStaffStatus = "active" | "inactive" | "suspended"`
     - Bootstrap Script: `status = 'active'` -> **MATCH**
  4. **Permissions Array**:
     - TypeScript definition:
       ```typescript
       export const ALL_PERMISSIONS = [
         "manage_users", "manage_companies", "verify_documents",
         "manage_vacancies", "analytics_access", "system_settings"
       ];
       ```
     - Bootstrap Script:
       ```sql
       ARRAY[
         'manage_users',
         'manage_companies',
         'verify_documents',
         'manage_vacancies',
         'analytics_access',
         'system_settings'
       ]::text[]
       ```
       -> **EXACT MATCH** (All 6 core permissions included).
  5. **Verification Query**:
     - The verification query in Step 4 accurately joins `public.profiles` and `public.admin_staff_members` on `p.id = s.profile_id` using exact column names (`profile_role`, `is_verified`, `sub_role`, `department`, `staff_status`, `permissions`).
  6. **Contingency / Revocation Script**:
     - Section 4 provides clean revocation queries setting `status = 'suspended'` in `admin_staff_members` and `role = 'candidate'` in `profiles`.
- **Blast Radius**: None. 100% type and schema compliance.
- **Verdict**: **PASS**

---

## Stress Test Results

| Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|
| Public attack surface evaluation | No HTTP/API endpoints or unauthenticated RPCs exposed | Zero public surface; strictly manual SQL Editor runbook | **PASS** |
| Transactional failure resilience | Atomicity maintained; no orphan or partially initialized rows | Postgres DO block executes in a single transaction; rolls back completely on any error | **PASS** |
| Non-existent UUID evaluation | Error raised; zero state mutations | Throws `RAISE EXCEPTION` and halts | **PASS** |
| Multiple executions (Idempotency) | No duplicate key exceptions; clean idempotent update | `ON CONFLICT` on `id` and `profile_id` handles re-runs smoothly | **PASS** |
| Schema & RBAC type consistency | Enums, permissions, sub-roles match DB and TypeScript types | 100% matched with `src/modules/admin/types/staff.ts` & SQL schemas | **PASS** |
| TypeScript Project Compilation | 0 type errors | `npx tsc --noEmit` exited with code 0 | **PASS** |

---

## Unchallenged Areas

- **Backend Server Actions & M3 Components**: Implementation of `createAdminClient()` and `createAdminStaffMember()` will be formally audited and tested during Milestone 3 and Milestone 4.

---

## Final Recommendation

The documentation and SQL procedure provided in `docs/security/ADMIN_BOOTSTRAP.md` are robust, secure, and production-ready.
**Verdict**: **APPROVE** (Proceed to Milestone 3).
