# CHALLENGER 1 HANDOFF REPORT — MILESTONE 0 (RBAC ARCHITECTURE BLUEPRINT)

**Agent**: Challenger 1 (Milestone 0)  
**Date**: August 27, 2026  
**Document Reviewed**: `/Users/brianpech/Developer/Commercial/kanpro/docs/security/RBAC_HARDENING_BLUEPRINT.md`  
**Verdict**: **`REQUEST_CHANGES`** (Mandatory Security Hardening Amendments for Blueprint v1.1)

---

## 1. Observation

### 1.1 Baseline Verification Results
- **Vitest Automated Suite**: `npx vitest run` executed with code 0. Result: `9 passed (9)`, `93 passed (93)`, duration `321ms`.
- **TypeScript Typecheck**: `npx tsc --noEmit` executed with code 0 (0 compilation errors).
- **Integrity Status**: Read-only integrity preserved; 0 production or migration files modified.

### 1.2 Codebase & Blueprint Observations

1. **Trigger `prevent_last_super_admin_removal()` Placement** (`docs/security/RBAC_HARDENING_BLUEPRINT.md:589-592`):
   ```sql
   CREATE TRIGGER trg_prevent_last_super_admin_removal
   BEFORE UPDATE OR DELETE ON public.admin_staff_members
   FOR EACH ROW EXECUTE FUNCTION public.prevent_last_super_admin_removal();
   ```
   *Direct Observation*: The trigger is attached exclusively to `public.admin_staff_members`. It is **NOT** attached to `public.profiles`.
   In `src/app/(dashboard)/dashboard/admin/users/actions.ts:30-52` (`updateUserRole`) and `src/app/(dashboard)/dashboard/admin/staff/actions.ts:344` (`deleteAdminStaffMember`), mutations are made directly to `public.profiles.role` (`UPDATE profiles SET role = 'candidate'`).

2. **Trigger `protect_company_commercial_fields()` Service-Role Handling** (`docs/security/RBAC_HARDENING_BLUEPRINT.md:596-618`):
   ```sql
   IF NOT public.is_super_admin(auth.uid()) THEN
     IF (OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan) ... THEN
       RAISE EXCEPTION 'Acceso denegado: Modificación de campos comerciales...'
     END IF;
   END IF;
   ```
   *Direct Observation*: In Supabase background jobs, database webhooks (e.g. Stripe webhook handler), or backend scripts executing via `service_role`, `auth.uid()` evaluates to `NULL`. Function `public.is_super_admin(NULL)` evaluates to `FALSE`. Consequently, legitimate server-side webhook updates to `subscription_plan` or `credits_available` will be blocked by this trigger with code `42501`.

3. **Impersonation Continuous Revalidation Target Check** (`docs/security/RBAC_HARDENING_BLUEPRINT.md:767-774`):
   ```
   Step 4: Continuous Database Revalidation: Query PostgreSQL for the actorId:
   Assert: profiles.role = 'admin' AND admin_staff_members.status = 'active'
   ```
   *Direct Observation*: Step 4 only checks the `actorId` in PostgreSQL. It does not query or assert that `target.role != 'admin'` at request time. If a candidate/company is promoted to `admin` after an impersonation token is issued, an admin can use the unexpired token (up to 2h TTL) to impersonate an active administrator.

4. **Concurrency Race Condition in Super Admin Count** (`docs/security/RBAC_HARDENING_BLUEPRINT.md:558-563`):
   ```sql
   SELECT COUNT(*) INTO active_super_admins_count
   FROM public.admin_staff_members s
   JOIN public.profiles p ON p.id = s.profile_id
   WHERE s.sub_role = 'super_admin' AND s.status = 'active' AND p.role = 'admin'::public.user_role;
   ```
   *Direct Observation*: In PostgreSQL `READ COMMITTED` isolation mode, two concurrent transactions demoting two different super admins (when total count = 2) will both read `COUNT(*) = 2` simultaneously. Neither query locks the rows (`FOR UPDATE`) or takes an advisory lock, allowing both transactions to commit, reducing active super admins to 0.

5. **Signature / Parameter Discrepancy in `toggleCompanyVerification`** (`docs/security/RBAC_HARDENING_BLUEPRINT.md:146` vs `src/app/(dashboard)/dashboard/admin/reports/actions.ts:166`):
   - Blueprint: `toggleCompanyVerification(companyId: string, status: "approved" | "rejected" | "pending")`
   - Codebase: `toggleCompanyVerification(companyId: string, isVerified: boolean)`

---

## 2. Logic Chain

1. **Logic for Loophole L1 (Trigger Bypass via `profiles.role`)**:
   - Invariant I3 states: *"reject any database transaction (`DELETE`, `UPDATE sub_role`, `UPDATE status`, or `UPDATE profiles.role`) that would leave the system with 0 active `super_admin` accounts."*
   - Observation 1 demonstrates the trigger is attached ONLY to `admin_staff_members`.
   - If an actor mutates `public.profiles.role` from `'admin'` to `'candidate'` for the sole active super admin, `admin_staff_members` trigger does not fire.
   - SQL helper `is_super_admin()` checks `p.role = 'admin'`. Since `p.role` is now `'candidate'`, `is_super_admin()` returns `FALSE`.
   - *Inference*: System reaches 0 active super admins, causing an irreversible executive lockout without triggering the safeguard.

2. **Logic for Loophole L2 (Service Role Webhook Breakage in `company_profiles`)**:
   - Webhook endpoints process subscription activations via Supabase admin service role where `auth.uid()` is `NULL`.
   - Observation 2 demonstrates `IF NOT public.is_super_admin(auth.uid())` runs when `auth.uid() IS NULL`, evaluating to `NOT FALSE` = `TRUE`.
   - *Inference*: Legitimate billing webhooks updating `subscription_plan` or `credits_available` will crash with a PostgreSQL exception `42501`, breaking commercial billing workflows.

3. **Logic for Loophole L3 (Impersonation Target Promotion Race)**:
   - Impersonation tokens have a 2-hour TTL.
   - Observation 3 shows Step 4 checks only `actorId` in database revalidation.
   - If User X is a candidate at $T_0$ (token issued), and promoted to `super_admin` at $T_1$, the actor holding the token at $T_2$ ($T_1 < T_2 < T_0 + 2\text{h}$) passes signature and actor checks.
   - *Inference*: Violates Invariant I6 ("strictly prohibit targets with `role = 'admin'"`).

4. **Logic for Loophole L4 (Concurrent Demotion Race Condition)**:
   - When exactly 2 super admins exist, two simultaneous requests to demote Admin A and Admin B execute in parallel transactions under `READ COMMITTED`.
   - Observation 4 shows `SELECT COUNT(*)` executes without row locks (`FOR UPDATE`).
   - Both transactions read `count = 2`, evaluate `2 <= 1` as false, and both commit.
   - *Inference*: Active super admin count becomes 0, violating Invariant I3.

---

## 3. Caveats

- **No Code Modifications**: As mandated by Milestone 0 constraints, no source code, SQL migrations, or schemas were altered.
- **PostgreSQL Environment**: Observations on row locking and trigger behaviors reflect PostgreSQL standard transaction semantics (`READ COMMITTED` snapshot behavior).
- **Scope**: The 33 admin actions inventory in Section 2 is verified to be 100% complete against the physical files in `src/app/(dashboard)/dashboard/admin/`.

---

## 4. Conclusion & Required Blueprint Amendments

The blueprint `RBAC_HARDENING_BLUEPRINT.md` is technically solid, comprehensive, and well-structured, but requires **5 specific hardening amendments** before Milestone 1 implementation begins:

### Mandatory Amendments for Blueprint v1.1:

1. **Amend Trigger Invariant I3**:
   - Define a dual-trigger architecture:
     a) `trg_prevent_last_super_admin_removal` on `admin_staff_members` (UPDATE, DELETE).
     b) `trg_prevent_last_super_admin_profile_demotion` on `profiles` (UPDATE OF role, DELETE) that asserts target is not the last active super admin.
   - Add row-locking (`PERFORM 1 FROM public.admin_staff_members WHERE sub_role = 'super_admin' AND status = 'active' FOR UPDATE;`) inside the trigger to serialize concurrent demotions.

2. **Amend Commercial Trigger `protect_company_commercial_fields()`**:
   - Update condition to respect service-role / webhook contexts where `auth.uid() IS NULL`:
     ```sql
     IF (auth.uid() IS NOT NULL) AND (NOT public.is_super_admin(auth.uid())) THEN
     ```

3. **Amend Impersonation Continuous Revalidation Pipeline (Section 7.3 Step 4)**:
   - Add mandatory target revalidation query in Step 4:
     ```typescript
     // Query database for target current role
     const { data: targetProfile } = await supabase
       .from("profiles")
       .select("role")
       .eq("id", payload.targetId)
       .single();
     if (!targetProfile || targetProfile.role === "admin") {
       throw new Error("Impersonación inválida: El usuario objetivo es un administrador.");
     }
     ```

4. **Clarify Impersonation Token HMAC Input Format (Section 7.1)**:
   - Standardize signing over `Base64Url(JSON(Payload))` (UTF-8 bytes) to avoid JSON whitespace/formatting discrepancies across environments.

5. **Sync Action Parameter Types in Catalog**:
   - Align `toggleCompanyVerification` signature to `(companyId: string, isVerified: boolean)` and `toggleProfileVerification` to `(profileId: string, isValidated: boolean)`.

---

## 5. Verification Method

To independently verify this report and baseline health:
```bash
# 1. Run full test suite (must pass 93/93)
npx vitest run

# 2. Run TypeScript compiler check (must exit 0)
npx tsc --noEmit

# 3. Inspect trigger specification in blueprint
grep -n -A 35 "CREATE OR REPLACE FUNCTION public.prevent_last_super_admin_removal" docs/security/RBAC_HARDENING_BLUEPRINT.md

# 4. Inspect commercial trigger in blueprint
grep -n -A 25 "CREATE OR REPLACE FUNCTION public.protect_company_commercial_fields" docs/security/RBAC_HARDENING_BLUEPRINT.md
```
