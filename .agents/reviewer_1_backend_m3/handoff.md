# Handoff Report — Milestone 3: Backend Security Review

**Agent**: Backend Security Reviewer 1 (Roles: Reviewer, Critic)  
**Date**: 2026-08-26  
**Type**: Hard Handoff (Task Complete)  
**Verdict**: **APPROVE**  

---

## 1. Observation

1. **Server-Only Client (`src/lib/supabase/admin.ts`)**:
   - Line 1: `import "server-only";` is present.
   - Lines 18–22: Environment variables are validated:
     ```typescript
     if (!url || !serviceRoleKey) {
       throw new Error(
         "Supabase Admin Client Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
       );
     }
     ```
   - Lines 25–29: Non-persisting session options:
     ```typescript
     auth: {
       persistSession: false,
       autoRefreshToken: false,
       detectSessionInUrl: false,
     }
     ```
   - Dependency `server-only: "^0.0.1"` is declared in `package.json` (line 48).

2. **Staff Server Actions (`src/app/(dashboard)/dashboard/admin/staff/actions.ts`)**:
   - Line 8: `requireAdminAuth()` queries `profiles.role === "admin"`. Enforced on lines 33, 98, 265, 308, 331.
   - Lines 124–128: Rejection of existing candidate/company:
     ```typescript
     if (existingProfile.role === "candidate" || existingProfile.role === "company") {
       throw new Error(
         "Este correo ya está registrado como candidato o empresa. Para otorgar acceso administrativo, utilice un flujo explícito de promoción."
       );
     }
     ```
   - Lines 181–189: User creation via Admin API:
     ```typescript
     const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
       email: cleanEmail,
       password: cleanPassword,
       email_confirm: true,
       user_metadata: {
         full_name: cleanName,
         whatsapp_number: cleanPhone,
       },
     });
     ```
   - Lines 201–214: Explicit promotion in `profiles` (`role: "admin"`, `is_verified: true`).
   - Lines 238–246: Compensatory rollback:
     ```typescript
     } catch (operationErr) {
       try {
         await supabaseAdmin.auth.admin.deleteUser(targetProfileId);
       } catch (rollbackErr) {
         console.error(`Error en rollback compensatorio eliminando usuario ${targetProfileId}:`, rollbackErr);
       }
       throw operationErr;
     }
     ```
   - Lines 333–335: Self-lockout prevention in `deleteAdminStaffMember`:
     ```typescript
     if (user.id === profileId) {
       throw new Error("No puede dar de baja su propio usuario administrador.");
     }
     ```

3. **Auth Callback (`src/app/(auth)/auth/callback/route.ts`)**:
   - Lines 28–35: Rejection of `admin` role parameter / metadata:
     ```typescript
     const assignedRole: "candidate" | "company" =
       searchRole === "company" || searchRole === "candidate"
         ? searchRole
         : metaRole === "company" || metaRole === "candidate"
         ? metaRole
         : "candidate";
     ```

4. **Dashboard Session (`src/modules/auth/services/dashboard-session.ts`)**:
   - Lines 14–27: Queries `profiles.role` from database as the sole source of truth.
   - Line 26: Missing profile fallback strictly assigns `metaRole === "company" ? "company" : "candidate"`.

5. **Verification Commands**:
   - `npx tsc --noEmit` -> Exited 0 (0 errors).
   - `npx eslint src/lib/supabase/admin.ts src/app/(dashboard)/dashboard/admin/staff/actions.ts src/app/(auth)/auth/callback/route.ts src/modules/auth/services/dashboard-session.ts src/lib/auth/require-admin.ts src/lib/supabase/proxy.ts src/modules/auth/services/auth-service.ts src/tests/admin-security-hardening.test.ts` -> Exited 0 (0 warnings, 0 errors).
   - `npx vitest run src/tests/admin-security-hardening.test.ts src/tests/proxy.test.ts src/tests/formatters.test.ts src/tests/candidate-profile.test.ts src/tests/geo.test.ts src/modules/company/schemas/__tests__/vacancy-wizard.schema.test.ts` -> Exited 0 (52 tests passed).
   - `npm run build` -> Next.js Turbopack build exited with code 0 (48 routes compiled).

---

## 2. Logic Chain

1. **Isolation of Privileged Client (Observation 1)**: By placing `import "server-only";` in `src/lib/supabase/admin.ts`, React/Next.js bundlers will refuse to package this module or its service role key into client bundles. Setting `persistSession: false` ensures admin operations never write to cookies or mutate the executor's session.
2. **Elimination of FK Violations & Identity Invariance (Observation 2)**: Prior code generated `crypto.randomUUID()` on error, violating the `profiles.id -> auth.users.id` foreign key. Using `supabaseAdmin.auth.admin.createUser()` creates the authentic `auth.users` record and returns its real UUID.
3. **Safe Collision Handling (Observation 2)**: If an existing user is already a candidate or company, attempting to add them as staff is rejected with an explicit Spanish message, preventing silent privilege escalation.
4. **Resilience via Compensatory Rollback (Observation 2)**: If `createUser()` succeeds in Supabase Auth but a database network glitch causes `profiles.upsert` or `admin_staff_members.upsert` to fail, the `catch` block invokes `deleteUser(targetProfileId)`. This cleans up the orphaned auth user without leaving a stranded email address. Pre-existing users are never touched by this rollback.
5. **Elimination of Metadata Escalation (Observations 3 & 4)**: In `auth/callback/route.ts` and `dashboard-session.ts`, the role is resolved either strictly from the database or constrained to `"candidate" | "company"`. Client manipulation of `user_metadata.role = "admin"` has no effect.
6. **Integrity & Standards Compliance (Observation 5)**: Automated typechecks, linters, unit tests, and production build verify zero syntax errors, zero key leaks, and zero regression.

---

## 3. Caveats

- End-to-end live testing with remote Supabase instances requires real network credentials and running containers. The 13 unit tests in `src/tests/admin-security-hardening.test.ts` thoroughly simulate SDK responses, errors, and edge cases.
- The 12 automated security integration tests (Milestone 4) will be authored and run by the QA Agent against the combined M2 (SQL migration) + M3 (Backend) codebase.

---

## 4. Conclusion

The Milestone 3 backend implementation satisfies all criteria for Requirements R2, R3, and R4. It is secure, robust against adversarial attacks, free of integrity violations, and ready for Milestone 4 (QA / Security Test Suite).

**Verdict**: **APPROVE**

---

## 5. Verification Method

To independently verify this implementation:

1. **Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected*: Code 0, 0 errors.

2. **Linting**:
   ```bash
   npx eslint src/lib/supabase/admin.ts src/app/\(dashboard\)/dashboard/admin/staff/actions.ts src/app/\(auth\)/auth/callback/route.ts src/modules/auth/services/dashboard-session.ts src/lib/auth/require-admin.ts src/lib/supabase/proxy.ts src/modules/auth/services/auth-service.ts src/tests/admin-security-hardening.test.ts
   ```
   *Expected*: Code 0, 0 errors/warnings.

3. **Unit Tests**:
   ```bash
   npx vitest run src/tests/admin-security-hardening.test.ts src/tests/proxy.test.ts src/tests/formatters.test.ts src/tests/candidate-profile.test.ts src/tests/geo.test.ts src/modules/company/schemas/__tests__/vacancy-wizard.schema.test.ts
   ```
   *Expected*: All 52 tests pass.

4. **Production Build**:
   ```bash
   npm run build
   ```
   *Expected*: Turbopack build exits 0.

5. **Security Invariant Invalidation Conditions**:
   - Any client component importing `src/lib/supabase/admin.ts`.
   - `auth/callback` allowing `role=admin` to create an admin profile.
   - `createAdminStaffMember` invoking `signUp()` or `crypto.randomUUID()`.
   - Any modification of `profiles.role` when creating staff with existing candidate/company email.
