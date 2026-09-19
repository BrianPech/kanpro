# Adversarial Challenge Report — Milestone 2: SQL Trigger Hardening

**Target**: `public.handle_new_user()` in `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql`  
**Challenger**: SQL Logic Challenger 1 (Archetype: empirical-challenger / Roles: critic, specialist)  
**Date**: 2026-08-26  
**Verdict**: **APPROVE**  

---

## Challenge Summary

**Overall risk assessment**: **LOW** (Residual risk is minimal and strictly confined; security invariants are proven robust against all tested adversarial vectors).

The hardened PL/pgSQL function `public.handle_new_user()` completely closes the P0/P1 privilege escalation vulnerability. No combination of user metadata, casing, nested JSON, SQL injection, or conflict states allows unauthorized elevation to `admin` or downgrade of existing administrative staff.

---

## Challenges & Attack Vectors Evaluated

### Challenge 1: Metadata Poisoning & Privilege Escalation (CRITICAL Severity Vector)
- **Assumption challenged**: Can an attacker pass metadata payloads (`role: "admin"`, `"super_admin"`, `"ADMIN"`, nested objects, arrays, or SQL injection) during public signup (`signUp`) to obtain `profiles.role = 'admin'`?
- **Attack scenario**:
  - Attacker submits `signUp({ email, password, options: { data: { role: "admin" } } })`.
  - Attacker submits variations: `"role": "super_admin"`, `"role": "ADMIN"`, `"role": "Admin"`, `"role": "  company  "`, `"role": {"admin": true}`, `"role": ["admin", "company"]`, `"role": "admin'; DROP TABLE profiles; --"`.
- **Empirical result**: **BLOCKED / IMMUNE**.
  - PL/pgSQL strict assignment:
    ```sql
    IF raw_role_str = 'company' THEN
      assigned_role := 'company'::public.user_role;
    ELSE
      assigned_role := 'candidate'::public.user_role;
    END IF;
    ```
  - Exact string match `'company'` is required to receive `'company'`.
  - Every other payload (including `'admin'`, `'super_admin'`, title/upper case, nested structures, and SQLi) unconditionally evaluates to `'candidate'`.
  - Elevation to `'admin'` is impossible through `handle_new_user()`.
- **Verdict**: PASS

---

### Challenge 2: Privilege Downgrade via ON CONFLICT (HIGH Severity Vector)
- **Assumption challenged**: If an existing administrator triggers `handle_new_user()` again (e.g. re-registering, OAuth identity linking, or manual upsert), could their `role = 'admin'` be overwritten or downgraded to `'candidate'` or `'company'`?
- **Attack scenario**:
  - An admin user with `id = <UUID>` and `profiles.role = 'admin'` triggers `handle_new_user()` with metadata `role = 'candidate'` or `role = 'company'`.
- **Empirical result**: **BLOCKED / IMMUNE**.
  - `ON CONFLICT (id) DO UPDATE` explicitly guards existing admin roles:
    ```sql
    role = CASE
      WHEN public.profiles.role = 'admin'::public.user_role THEN public.profiles.role
      ELSE EXCLUDED.role
    END
    ```
  - When `public.profiles.role` is `'admin'`, the CASE statement returns `public.profiles.role` (preserving `'admin'`).
  - Empirical execution confirmed that both candidate and company upsert payloads leave `profiles.role = 'admin'` unchanged.
- **Verdict**: PASS

---

### Challenge 3: Data Wiping on Profile Conflict (MEDIUM Severity Vector)
- **Assumption challenged**: If an existing profile is updated on conflict, could blank/empty metadata wipe existing `full_name`, `whatsapp_number`, `birth_date`, or `company_name`?
- **Attack scenario**:
  - Existing profile has `whatsapp_number = '9991112233'` and `full_name = 'Original Name'`.
  - Subsequent trigger execution passes empty strings `""` or `NULL` in metadata.
- **Empirical result**: **PROTECTED / IMMUNE**.
  - `public.profiles`:
    `full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name)`
    `whatsapp_number = COALESCE(NULLIF(EXCLUDED.whatsapp_number, ''), public.profiles.whatsapp_number)`
  - `public.candidate_private_profiles`:
    `birth_date = COALESCE(EXCLUDED.birth_date, public.candidate_private_profiles.birth_date)`
  - `public.company_profiles`:
    `company_name = COALESCE(NULLIF(EXCLUDED.company_name, ''), public.company_profiles.company_name)`
  - Empirical execution confirmed that existing populated fields are preserved when empty/null values arrive in conflict updates.
- **Verdict**: PASS

---

### Challenge 4: Date Parsing Crash & DoS via Malformed `birth_date` (MEDIUM Severity Vector)
- **Assumption challenged**: Can malformed, out-of-range, or malicious date strings in `birth_date` crash `handle_new_user()`, aborting legitimate user signups or causing unhandled database exceptions?
- **Attack scenario**:
  - Attacker or user supplies invalid dates: `'32/01/2000'`, `'15/13/2000'`, `'29/02/2021'` (non-leap year), `'2020-13-01'`, `'hello_world'`, `"' OR '1'='1"`, `""`, `'   '`, `'1700000000'`, `'SELECT now()'`.
- **Empirical result**: **HANDLED / IMMUNE**.
  - All date parsing operations are wrapped in an explicit PL/pgSQL block with exception handling:
    ```sql
    BEGIN
      IF raw_birth_date ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
        parsed_birth_date := to_date(raw_birth_date, 'DD/MM/YYYY');
      ELSIF raw_birth_date ~ '^\d{4}-\d{2}-\d{2}$' THEN
        parsed_birth_date := raw_birth_date::date;
      ELSE
        parsed_birth_date := raw_birth_date::date;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      parsed_birth_date := NULL;
    END;
    ```
  - Valid dates (`25/12/1990`, `1/1/2000`, `2020-02-29`, `1990-05-15T00:00:00.000Z`, `1990/12/25`) parse accurately.
  - Invalid / malicious dates safely default to `NULL` without raising exceptions or failing transaction commits.
- **Verdict**: PASS

---

### Challenge 5: SECURITY DEFINER Search Path Hijacking & RPC Exposure (HIGH Severity Vector)
- **Assumption challenged**: Can an attacker hijack `search_path` in `SECURITY DEFINER` execution (CVE-2018-1058 / CWE-426) or invoke `handle_new_user()` directly via PostgREST RPC (`/rest/v1/rpc/handle_new_user`)?
- **Attack scenario**:
  - Attacker creates malicious objects in temporary schemas or calls `handle_new_user` directly with crafted parameters.
- **Empirical result**: **PROTECTED / IMMUNE**.
  - Function header explicitly sets `SET search_path = public, pg_temp;`.
  - Schema configuration verified in `pg_proc.proconfig`: `["search_path=public, pg_temp"]`.
  - Direct execution permissions are explicitly revoked:
    - `has_function_privilege('anon', 'public.handle_new_user()', 'execute')` = `false`
    - `has_function_privilege('authenticated', 'public.handle_new_user()', 'execute')` = `false`
    - `has_function_privilege('public', 'public.handle_new_user()', 'execute')` = `false`
- **Verdict**: PASS

---

### Challenge 6: Compensatory Rollback & Cascade Deletion Lifecycle (MEDIUM Severity Vector)
- **Assumption challenged**: When backend compensatory rollback deletes a newly created user via `auth.admin.deleteUser(newUserId)`, are all dependent profile records (`profiles`, `candidate_profiles`, `candidate_private_profiles`, `company_profiles`, `admin_staff_members`) cleanly deleted without leaving orphan records or violating foreign keys?
- **Empirical result**: **VERIFIED / CLEAN**.
  - All profile tables declare `ON DELETE CASCADE` referencing their respective parent foreign keys:
    - `profiles(id) REFERENCES auth.users(id) ON DELETE CASCADE`
    - `candidate_profiles(id) REFERENCES profiles(id) ON DELETE CASCADE`
    - `candidate_private_profiles(id) REFERENCES profiles(id) ON DELETE CASCADE`
    - `company_profiles(id) REFERENCES profiles(id) ON DELETE CASCADE`
    - `admin_staff_members(profile_id) REFERENCES profiles(id) ON DELETE CASCADE`
  - Empirical test: Deleting test `auth.users` row cascaded and removed all corresponding records in `profiles`, `candidate_profiles`, and `candidate_private_profiles` with zero orphans.
- **Verdict**: PASS

---

## Stress Test Results

| Test ID | Scenario Description | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|---|
| **ST-1.1** | `raw_user_meta_data: {"role": "admin"}` | `profiles.role = 'candidate'` | `profiles.role = 'candidate'` | **PASS** |
| **ST-1.2** | `raw_user_meta_data: {"role": "super_admin"}` | `profiles.role = 'candidate'` | `profiles.role = 'candidate'` | **PASS** |
| **ST-1.3** | `raw_user_meta_data: {"role": "ADMIN"}` | `profiles.role = 'candidate'` | `profiles.role = 'candidate'` | **PASS** |
| **ST-1.4** | `raw_user_meta_data: {"role": "Admin"}` | `profiles.role = 'candidate'` | `profiles.role = 'candidate'` | **PASS** |
| **ST-1.5** | `raw_user_meta_data: {"role": "company"}` | `profiles.role = 'company'`, company profile created | `profiles.role = 'company'`, `company_profiles` row inserted | **PASS** |
| **ST-1.6** | `raw_user_meta_data: {"role": null}` | `profiles.role = 'candidate'` | `profiles.role = 'candidate'` | **PASS** |
| **ST-1.7** | `raw_user_meta_data = NULL` | `profiles.role = 'candidate'` | `profiles.role = 'candidate'` | **PASS** |
| **ST-1.8** | `raw_user_meta_data: {"role": ""}` | `profiles.role = 'candidate'` | `profiles.role = 'candidate'` | **PASS** |
| **ST-1.9** | `raw_user_meta_data: {"role": "  company  "}` | `profiles.role = 'candidate'` | `profiles.role = 'candidate'` | **PASS** |
| **ST-1.10** | `raw_user_meta_data: {"role": {"admin": true}}` | `profiles.role = 'candidate'` | `profiles.role = 'candidate'` | **PASS** |
| **ST-1.11** | `raw_user_meta_data: {"role": ["admin", "company"]}` | `profiles.role = 'candidate'` | `profiles.role = 'candidate'` | **PASS** |
| **ST-1.12** | SQLi payload in `role` and `full_name` | `profiles.role = 'candidate'`, no injection | `profiles.role = 'candidate'`, text escaped safely | **PASS** |
| **ST-1.13** | `raw_user_meta_data: ["admin"]` (JSON array root) | `profiles.role = 'candidate'` | `profiles.role = 'candidate'` | **PASS** |
| **ST-1.14** | `raw_user_meta_data: "admin"` (JSON string root) | `profiles.role = 'candidate'` | `profiles.role = 'candidate'` | **PASS** |
| **ST-1.15** | `raw_user_meta_data: 12345` (JSON number root) | `profiles.role = 'candidate'` | `profiles.role = 'candidate'` | **PASS** |
| **ST-2.1** | Existing admin conflict with `role = 'candidate'` | `profiles.role` stays `'admin'` | `profiles.role` remains `'admin'` | **PASS** |
| **ST-2.2** | Existing admin conflict with `role = 'company'` | `profiles.role` stays `'admin'` | `profiles.role` remains `'admin'` | **PASS** |
| **ST-2.3** | Existing candidate conflict with `role = 'company'` | `profiles.role` updates to `'company'` | `profiles.role` updated to `'company'` | **PASS** |
| **ST-2.4** | Conflict with empty `whatsapp_number` on existing profile | Preserves existing `whatsapp_number` | Retained existing phone `9991112233` | **PASS** |
| **ST-2.5** | Conflict with empty `company_name` on company profile | Preserves existing `company_name` | Retained existing company name | **PASS** |
| **ST-2.6** | Conflict with NULL `birth_date` on candidate private profile | Preserves existing `birth_date` | Retained existing `birth_date` | **PASS** |
| **ST-2.7** | Conflict with new valid `birth_date` | Updates `birth_date` | Updated to new `birth_date` | **PASS** |
| **ST-3.1** | `birth_date: "25/12/1990"` (DD/MM/YYYY) | `1990-12-25` | `1990-12-25` | **PASS** |
| **ST-3.2** | `birth_date: "01/01/2000"` (DD/MM/YYYY) | `2000-01-01` | `2000-01-01` | **PASS** |
| **ST-3.3** | `birth_date: "1/1/2000"` (D/M/YYYY) | `2000-01-01` | `2000-01-01` | **PASS** |
| **ST-3.4** | `birth_date: "5/11/1998"` (D/MM/YYYY) | `1998-11-05` | `1998-11-05` | **PASS** |
| **ST-3.5** | `birth_date: "15/4/1993"` (DD/M/YYYY) | `1993-04-15` | `1993-04-15` | **PASS** |
| **ST-3.6** | `birth_date: "1990-12-25"` (YYYY-MM-DD) | `1990-12-25` | `1990-12-25` | **PASS** |
| **ST-3.7** | `birth_date: "2020-02-29"` (Leap year YYYY-MM-DD) | `2020-02-29` | `2020-02-29` | **PASS** |
| **ST-3.8** | `birth_date: "29/02/2020"` (Leap year DD/MM/YYYY) | `2020-02-29` | `2020-02-29` | **PASS** |
| **ST-3.9** | `birth_date: "1990-05-15T00:00:00.000Z"` (ISO 8601) | `1990-05-15` | `1990-05-15` | **PASS** |
| **ST-3.10** | `birth_date: "1990/12/25"` (Slashed ISO) | `1990-12-25` | `1990-12-25` | **PASS** |
| **ST-3.11** | `birth_date: "32/01/2000"` (Invalid day) | `NULL`, no exception | `NULL` | **PASS** |
| **ST-3.12** | `birth_date: "15/13/2000"` (Invalid month) | `NULL`, no exception | `NULL` | **PASS** |
| **ST-3.13** | `birth_date: "29/02/2021"` (Invalid leap year DD/MM/YYYY) | `NULL`, no exception | `NULL` | **PASS** |
| **ST-3.14** | `birth_date: "2021-02-29"` (Invalid leap year YYYY-MM-DD) | `NULL`, no exception | `NULL` | **PASS** |
| **ST-3.15** | `birth_date: "2020-13-01"` (Invalid month YYYY-MM-DD) | `NULL`, no exception | `NULL` | **PASS** |
| **ST-3.16** | `birth_date: "hello_world"` | `NULL`, no exception | `NULL` | **PASS** |
| **ST-3.17** | `birth_date: "' OR '1'='1"` | `NULL`, no exception | `NULL` | **PASS** |
| **ST-3.18** | `birth_date: ""` | `NULL`, no exception | `NULL` | **PASS** |
| **ST-3.19** | `birth_date: "   "` | `NULL`, no exception | `NULL` | **PASS** |
| **ST-3.20** | `birth_date: "1700000000"` | `NULL`, no exception | `NULL` | **PASS** |
| **ST-3.21** | `birth_date: "SELECT now()"` | `NULL`, no exception | `NULL` | **PASS** |
| **ST-3.22** | `birth_date: "0000-00-00"` | `NULL`, no exception | `NULL` | **PASS** |
| **ST-4.1** | RPC execution by `anon` | Denied (`has_function_privilege = false`) | `false` | **PASS** |
| **ST-4.2** | RPC execution by `authenticated` | Denied (`has_function_privilege = false`) | `false` | **PASS** |
| **ST-4.3** | `SECURITY DEFINER` search_path | Immutable `public, pg_temp` | `["search_path=public, pg_temp"]` | **PASS** |
| **ST-5.1** | Cascade delete on user removal | All child profiles deleted | All child profile rows deleted (0 orphans) | **PASS** |

---

## Unchallenged Areas

- **Backend Service Role Elevation (`createAdminStaffMember`)**: Out of scope for M2 DB Challenger (handled in M3 backend review and M4 end-to-end security test suite).
- **Client Form Visual Rendering**: Out of scope for database trigger review.

---

## Conclusion & Recommendation

The SQL migration `20260826000000_harden_auth_user_creation_trigger.sql` is **APPROVED** without reservations. It fully satisfies Requirement R1, eliminates the privilege escalation vulnerability, guarantees admin non-downgrade on conflict, handles all edge cases and malformed inputs gracefully, and conforms to Supabase and PostgreSQL security best practices.
