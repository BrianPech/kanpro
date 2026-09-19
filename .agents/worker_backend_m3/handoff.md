# Handoff Report — Milestone 3: Backend Implementation

**Agent**: worker_backend_m3  
**Date**: 2026-08-26  
**Type**: Hard Handoff (Task Complete)  
**Target Milestone**: Milestone 3 - Backend Implementation (K'anPro Admin Creation Security Hardening)  

---

## 1. Observation

1. **Package Dependency**:
   - `server-only` was not present in `package.json`. Installed `server-only@0.0.1` via `pnpm add server-only`.
2. **Server-Only Admin Client (`src/lib/supabase/admin.ts`)**:
   - Created with `import "server-only";` at top.
   - Instantiates `createClient<Database>` using `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
   - Configures non-persisting session options:
     ```typescript
     auth: {
       persistSession: false,
       autoRefreshToken: false,
       detectSessionInUrl: false,
     }
     ```
   - Validates environment variables and throws controlled exception without leaking secrets.
3. **Staff Server Actions (`src/app/(dashboard)/dashboard/admin/staff/actions.ts`)**:
   - Verified executor authorization via `requireAdminAuth()`.
   - Replaced cookie-based `signUp()` and `crypto.randomUUID()` with `supabaseAdmin.auth.admin.createUser()`.
   - Integrated existing profile role collision check: if role is `candidate` or `company`, throws verbatim: `"Este correo ya está registrado como candidato o empresa. Para otorgar acceso administrativo, utilice un flujo explícito de promoción."` without mutating `profiles.role`.
   - Implemented compensatory rollback in `catch` block using `supabaseAdmin.auth.admin.deleteUser(targetProfileId)` on newly created users.
4. **Auth Callback Route (`src/app/(auth)/auth/callback/route.ts`)**:
   - Stripped `"admin"` from `searchRole` and `metaRole` resolution (lines 28–38). Only `"company"` or `"candidate"` can be assigned; all other inputs default to `"candidate"`.
5. **Dashboard Session Service (`src/modules/auth/services/dashboard-session.ts`)**:
   - Refactored `getDashboardSession()` to query `profiles.role` as the sole authority. Ignores client-manipulated `user_metadata.role === 'admin'`.
6. **Route Guard Helpers (`src/lib/auth/require-admin.ts` & `src/lib/supabase/proxy.ts`)**:
   - Enforced database `profiles.role === 'admin'` strictly without unverified metadata fallback.
7. **Verification Commands**:
   - `npx tsc --noEmit` -> Exited 0 (0 type errors).
   - `npx eslint` -> Exited 0 on all modified files and new tests.
   - `npx vitest run src/tests/admin-security-hardening.test.ts ...` -> 46 tests passed in 219ms.
   - `npm run build` -> Next.js 16.2.6 (Turbopack) successfully compiled all 48 routes.

---

## 2. Logic Chain

1. **Service Role Isolation**: Because `createAdminClient` requires `SUPABASE_SERVICE_ROLE_KEY`, placing `import "server-only";` ensures that if any client-side file imports it, the Next.js bundler rejects the build at compile-time. Setting `persistSession: false` guarantees that background service calls never mutate cookie headers.
2. **Authentic User Identity**: Prior to this change, `actions.ts` generated `crypto.randomUUID()` on error, which violated PostgreSQL foreign key constraint `profiles_id_fkey REFERENCES auth.users(id)`. By calling `supabaseAdmin.auth.admin.createUser()`, the identity is guaranteed to originate directly in `auth.users(id)`.
3. **Prevention of Silent Privilege Escalation**: Attackers could previously register a candidate account and later have an administrator add their email to staff without awareness, silently elevating them. Rejecting existing candidate/company accounts with a clear Spanish error protects account integrity.
4. **Compensatory Rollback**: If `createUser()` succeeds but subsequent profile promotion or staff metadata insertion fails (e.g. database network error), leaving an auth user causes the email to be locked. The compensatory rollback (`deleteUser`) cleans up the newly provisioned auth record.
5. **Authoritative Session Resolution**: In Next.js SSR, `user_metadata` can be mutated by users via client SDK calls (`supabase.auth.updateUser`). By querying `public.profiles.role` directly in `getDashboardSession`, `requireAdmin`, and `proxy.ts`, metadata injection attacks cannot grant admin access.

---

## 3. Caveats

- End-to-end live testing with real remote Supabase accounts requires active Supabase credentials with network connectivity. The 13 automated unit tests in `src/tests/admin-security-hardening.test.ts` thoroughly mock all SDK responses and verify all execution branches.
- The 12 security test cases for Milestone 4 will be implemented by the QA agent in `src/__tests__/security/admin-privilege-hardening.test.ts`.

---

## 4. Conclusion

All tasks for Milestone 3 (Requirements R2, R3, R4) are complete, strictly compliant with architecture rules and security invariants, free of type and lint errors, and verified by passing unit test suites and a successful Next.js production build.

---

## 5. Verification Method

1. **Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected*: Exits with code 0 (no errors).

2. **Linting**:
   ```bash
   npx eslint src/lib/supabase/admin.ts src/app/\(dashboard\)/dashboard/admin/staff/actions.ts src/app/\(auth\)/auth/callback/route.ts src/modules/auth/services/dashboard-session.ts src/lib/auth/require-admin.ts src/lib/supabase/proxy.ts src/modules/auth/services/auth-service.ts src/tests/admin-security-hardening.test.ts
   ```
   *Expected*: Exits with code 0 (no errors/warnings).

3. **Unit Tests**:
   ```bash
   npx vitest run src/tests/admin-security-hardening.test.ts src/tests/proxy.test.ts src/tests/formatters.test.ts src/tests/candidate-profile.test.ts src/modules/company/schemas/__tests__/vacancy-wizard.schema.test.ts
   ```
   *Expected*: All 46 tests pass.

4. **Production Build**:
   ```bash
   npm run build
   ```
   *Expected*: Turbopack successfully compiles all 48 routes.
