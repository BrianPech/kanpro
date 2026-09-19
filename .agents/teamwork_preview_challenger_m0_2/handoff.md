# CHALLENGER 2 HANDOFF REPORT — MILESTONE 0 (RBAC ARCHITECTURE BLUEPRINT)

**Agent**: Challenger 2 (Milestone 0)  
**Roles**: critic, specialist  
**Working Directory**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_challenger_m0_2`  
**Document Reviewed**: `/Users/brianpech/Developer/Commercial/kanpro/docs/security/RBAC_HARDENING_BLUEPRINT.md`  
**Verdict**: **`REQUEST_CHANGES`** (Mandatory Security Hardening Amendments for Blueprint v1.1)

---

## 1. Observation

### 1.1 Baseline System Verification
- **Automated Vitest Test Suite**: Executed `npx vitest run`.
  - Result: 9 test files passed, 93 tests passed (93/93, 100%), duration ~296ms.
- **TypeScript Static Analysis**: Executed `npx tsc --noEmit`.
  - Result: Exit code 0, 0 compilation/type errors.
- **Repository Integrity**: Read-only mode strictly respected; zero modifications to production code, migrations, or tests.

### 1.2 Direct Observations on Blueprint & Codebase

1. **Trigger `prevent_last_super_admin_removal()` Scope & Target Table** (`docs/security/RBAC_HARDENING_BLUEPRINT.md:589-592`):
   ```sql
   CREATE TRIGGER trg_prevent_last_super_admin_removal
   BEFORE UPDATE OR DELETE ON public.admin_staff_members
   FOR EACH ROW EXECUTE FUNCTION public.prevent_last_super_admin_removal();
   ```
   - *Observation*: The trigger is created exclusively on `public.admin_staff_members`. No corresponding trigger is specified for `public.profiles`.
   - In `src/app/(dashboard)/dashboard/admin/users/actions.ts:30-52` (`updateUserRole`) and `src/app/(dashboard)/dashboard/admin/staff/actions.ts:344` (`deleteAdminStaffMember`), mutations update `public.profiles.role` directly.

2. **Trigger `protect_company_commercial_fields()` in Service-Role Context** (`docs/security/RBAC_HARDENING_BLUEPRINT.md:596-618`):
   ```sql
   IF NOT public.is_super_admin(auth.uid()) THEN
     IF (OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan) ... THEN
       RAISE EXCEPTION 'Acceso denegado: Modificación de campos comerciales y suscripción no permitida para el tenant.'
         USING ERRCODE = '42501';
     END IF;
   END IF;
   ```
   - *Observation*: When background workers, migrations, or Stripe billing webhooks invoke Supabase using the service role (`SUPABASE_SERVICE_ROLE_KEY` / `createAdminClient()`), `auth.uid()` evaluates to `NULL`.
   - Function `public.is_super_admin(NULL)` returns `FALSE`. Consequently, `NOT FALSE` evaluates to `TRUE`, causing the trigger to reject legitimate server-side billing webhooks with SQL error `42501`.

3. **Concurrency Race Condition in Last Super Admin Count** (`docs/security/RBAC_HARDENING_BLUEPRINT.md:558-563`):
   ```sql
   SELECT COUNT(*) INTO active_super_admins_count
   FROM public.admin_staff_members s
   JOIN public.profiles p ON p.id = s.profile_id
   WHERE s.sub_role = 'super_admin'
     AND s.status = 'active'
     AND p.role = 'admin'::public.user_role;
   ```
   - *Observation*: Under PostgreSQL default `READ COMMITTED` isolation level, two concurrent transactions attempting to demote or suspend two distinct super admins (when total active count = 2) will both execute `SELECT COUNT(*)` without row locks (`FOR UPDATE`) or transaction advisory locks. Both transactions read `count = 2`, evaluate `2 <= 1` as false, and both commit, reducing active super admins to 0.

4. **Impersonation Continuous Revalidation Missing Target Re-Check** (`docs/security/RBAC_HARDENING_BLUEPRINT.md:767-774`):
   ```
   Step 4: Continuous Database Revalidation: Query PostgreSQL for the actorId:
   Assert: profiles.role = 'admin' AND admin_staff_members.status = 'active'
   ```
   - *Observation*: Continuous validation only queries `actorId`. It does not query or assert that `target.role != 'admin'` in the database at request time. An unexpired token (up to 2h TTL) issued for a candidate who is subsequently elevated to admin would allow ongoing administrative impersonation.

5. **SQL vs TypeScript Permission Resolution Parity** (`docs/security/RBAC_HARDENING_BLUEPRINT.md:434-440` vs lines 524-544):
   - Blueprint Section 3.4 defines: $\mathcal{C}_{\text{eff}}(u) = \text{BasePerms}(\text{sub\_role}(u)) \cup \text{permissions}(u)$.
   - SQL `has_admin_permission(perm_key)` checks: `s.sub_role = 'super_admin' OR perm_key = ANY(s.permissions)`.
   - *Observation*: If `admin_staff_members.permissions` contains an empty array `{}` or only custom overrides, SQL RLS will evaluate `has_admin_permission` to `FALSE` for standard base permissions (e.g. `verify_documents` for a `verification_admin`), while TypeScript `hasPermission` would evaluate to `TRUE`.

6. **Missing Security Definer Grants / Revocations** (`docs/security/RBAC_HARDENING_BLUEPRINT.md:488-544`):
   - *Observation*: `is_active_admin`, `is_super_admin`, and `has_admin_permission` are declared `SECURITY DEFINER` in `public` without explicit `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC, anon; GRANT EXECUTE ... TO authenticated;`, violating Supabase DB advisor security standards.

---

## 2. Logic Chain

1. **Logic for Loophole L1 (Lockout via `profiles.role` bypass)**:
   - *From Observation 1*: Invariant I3 mandates preventing any operation that leaves 0 active super admins. The trigger is attached ONLY to `admin_staff_members`.
   - If an actor mutates `public.profiles.role` from `'admin'` to `'candidate'` for the sole active super admin, `trg_prevent_last_super_admin_removal` on `admin_staff_members` does not fire.
   - Helper `is_super_admin()` checks `p.role = 'admin'`. Because `p.role` is `'candidate'`, `is_super_admin()` returns `FALSE`.
   - *Conclusion*: Total active super admins becomes 0 without triggering database error, causing irreversible management lockout.

2. **Logic for Loophole L2 (Billing Webhook Crash in `company_profiles`)**:
   - *From Observation 2*: Webhooks process payments via `createAdminClient()` where `auth.uid()` is `NULL`.
   - The expression `IF NOT public.is_super_admin(auth.uid())` becomes `IF NOT FALSE` $\to$ `TRUE`.
   - *Conclusion*: Legitimate Stripe webhooks attempting to update `subscription_plan` or `credits_available` will crash with error `42501`.

3. **Logic for Loophole L3 (Race Condition on Last Super Admin Demotion)**:
   - *From Observation 3*: Two parallel HTTP requests demoting Super Admin 1 and Super Admin 2 execute concurrently.
   - Under `READ COMMITTED`, each transaction reads uncommitted state `count = 2`.
   - Neither query uses `FOR UPDATE` or advisory locks, allowing both demotions to commit.
   - *Conclusion*: System reaches 0 active super admins, violating Invariant I3.

4. **Logic for Loophole L4 (Impersonation Target Role Promotion Race)**:
   - *From Observation 4*: Impersonation tokens have a 2-hour TTL.
   - Continuous revalidation only checks `actorId` liveness.
   - If target candidate is promoted to `admin` during the 2-hour window, the active token allows unauthorized impersonation of an administrator, violating Invariant I6.

5. **Logic for Loophole L5 (Layer 1 / Layer 2 Permission Divergence)**:
   - *From Observation 5*: If `admin_staff_members.permissions` does not contain the materialized union of base permissions + custom permissions, PostgreSQL RLS (`has_admin_permission`) will block database queries while TypeScript Server Action guards (`hasPermission`) permit execution, creating subtle and unpredictable runtime authorization failures.

---

## 3. Caveats

- **No Code Modifications**: Review was strictly non-destructive and read-only.
- **Scope Completeness**: All 33 administrative Server Actions across 8 modules were verified and matched against physical repository files.
- **Contract Assumptions**: Analysis assumes standard PostgreSQL `READ COMMITTED` snapshot semantics and Supabase JWT auth claims lifecycle.

---

## 4. Conclusion & Required Blueprint Amendments

The blueprint `RBAC_HARDENING_BLUEPRINT.md` establishes a strong, thorough Defense-in-Depth architecture, but contains **6 specific vulnerabilities/contract gaps** that must be amended before implementation begins:

### Mandatory Amendments for Blueprint v1.1:

1. **Dual-Trigger Protection for Invariant I3**:
   - Attach a companion trigger `trg_prevent_last_super_admin_profile_demotion` on `public.profiles` (`BEFORE UPDATE OF role OR DELETE ON public.profiles`) ensuring no profile associated with an active `super_admin` can be demoted or deleted if `active_super_admins_count <= 1`.
   - Include row-locking (`PERFORM 1 FROM public.admin_staff_members WHERE sub_role = 'super_admin' AND status = 'active' FOR UPDATE;`) or transaction advisory locks to serialize concurrent demotions.

2. **Fix Service-Role Handling in `protect_company_commercial_fields`**:
   - Update trigger condition to allow service-role / webhook updates where `auth.uid() IS NULL`:
     ```sql
     IF (auth.uid() IS NOT NULL) AND (NOT public.is_super_admin(auth.uid())) THEN
     ```

3. **Enforce Target Role Revalidation in Impersonation Engine (Section 7.3 Step 4)**:
   - Add mandatory target profile lookup during continuous revalidation to assert `target.role != 'admin'`.

4. **Materialize Full Permission Sets or Align SQL `has_admin_permission`**:
   - Explicitly specify that `admin_staff_members.permissions` in PostgreSQL must ALWAYS store the complete, authoritative set of effective permissions (BasePerms + additions), OR update SQL `has_admin_permission` to resolve base permissions by subrole.

5. **Canonicalize HMAC Token Signing Input (Section 7.1)**:
   - Standardize signing over `Base64Url(JSON.stringify(payload))` (the string before the dot) to eliminate JSON key serialization discrepancies.

6. **Add Explicit Security Definer Grants & Revocations (Section 4.1)**:
   - Add `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC, anon; GRANT EXECUTE ... TO authenticated, service_role;` for all helper functions.

---

## 5. Verification Method

To independently verify these findings and confirm baseline health:
```bash
# 1. Run Vitest automated test suite (must pass 93/93)
npx vitest run

# 2. Run TypeScript compiler check (must exit code 0)
npx tsc --noEmit

# 3. Inspect trigger implementations in blueprint
grep -n -A 35 "CREATE OR REPLACE FUNCTION public.prevent_last_super_admin_removal" docs/security/RBAC_HARDENING_BLUEPRINT.md
grep -n -A 25 "CREATE OR REPLACE FUNCTION public.protect_company_commercial_fields" docs/security/RBAC_HARDENING_BLUEPRINT.md

# 4. Inspect impersonation revalidation pipeline in blueprint
grep -n -A 20 "7.3 Verification & Continuous Revalidation Pipeline" docs/security/RBAC_HARDENING_BLUEPRINT.md
```
