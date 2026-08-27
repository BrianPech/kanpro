# Handoff Report: Milestone 1 - Backend Codebase & Security Exploration

**Milestone**: Milestone 1 - Survey & Security Audit Assessment  
**Agent**: Backend Codebase Explorer (`explorer_backend_m1`)  
**Recipient**: Orchestrator (`6cecd5f4-330f-445f-9d8e-dc58c11455a5`)  
**Status**: Hard Handoff (Investigation Complete)  
**Report Artifacts**:
- `analysis.md`: `/Users/brianpech/Developer/Commercial/kanpro/.agents/explorer_backend_m1/analysis.md`
- `BRIEFING.md`: `/Users/brianpech/Developer/Commercial/kanpro/.agents/explorer_backend_m1/BRIEFING.md`
- `DISPATCH.md`: `/Users/brianpech/Developer/Commercial/kanpro/.agents/explorer_backend_m1/DISPATCH.md`

---

## 1. Observation

1. **Staff Action Code & Anti-Patterns** (`src/app/(dashboard)/dashboard/admin/staff/actions.ts`):
   - In lines 109-120: Existing profiles with any role (`candidate` or `company`) are silently elevated to `admin` via `supabase.from("profiles").update({ role: "admin", ... })`.
   - In lines 123-132: Uses `supabase.auth.signUp()` with the SSR cookie client (`@/lib/supabase/server`), passing client metadata `{ role: "admin" }` to trigger database role assignment.
   - In lines 136, 138, 141: Uses `crypto.randomUUID()` when auth fails or when no password is provided, attempting to insert an unauthenticated UUID into `public.profiles`.
   - In `supabase/migrations/20260728000000_initial_schema.sql:27`, `public.profiles.id` defines a strict foreign key: `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`. Inserting a standalone `crypto.randomUUID()` violates `profiles_id_fkey`.
   - There is no compensatory rollback (`auth.admin.deleteUser()`) anywhere in `actions.ts`.

2. **Trigger Behavior** (`supabase/migrations/20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql`):
   - In lines 19-23: `handle_new_user()` checks `ELSIF raw_role_str = 'admin' THEN assigned_role := 'admin'::public.user_role;`, allowing public users to become admins by passing `data: { role: 'admin' }` to `supabase.auth.signUp()`.

3. **Supabase Client Architecture**:
   - `src/lib/supabase/client.ts`: Uses `@supabase/ssr` `createBrowserClient` with public anon key.
   - `src/lib/supabase/server.ts`: Uses `@supabase/ssr` `createServerClient` with cookies.
   - `src/lib/supabase/proxy.ts`: Uses `@supabase/ssr` `createServerClient` for middleware session refreshing.
   - `src/lib/supabase/admin.ts`: **Does not exist yet**. Service role client is not configured.

4. **Escalation in Callback and Session**:
   - `src/app/(auth)/auth/callback/route.ts:30-38`: Whitelist accepts `searchRole === "admin"` or `metaRole === "admin"` and assigns `role: "admin"` directly in `profiles`.
   - `src/modules/auth/services/dashboard-session.ts:13-33`: Evaluates `user.user_metadata?.role` first. If present, it skips the `profiles` table query entirely, allowing users who modify their client metadata to be treated as admins.
   - `src/lib/auth/require-admin.ts:42-44`: Falls back to `user.user_metadata?.role` if profile role is not loaded.

5. **Test Harness & Build Status**:
   - Running `npx tsc --noEmit` exits with status `0` (clean typecheck).
   - Running `npx vitest run` runs 6 test files (`geo.test.ts`, `formatters.test.ts`, `proxy.test.ts`, `candidate-profile.test.ts`, `vacancy-wizard.schema.test.ts` pass; `flows.test.ts` fails only due to local Supabase mock unavailability at port 54321).
   - Vitest config in `vitest.config.ts` supports node environment and `@` aliases.

---

## 2. Logic Chain

1. **Observation 1 & 2** demonstrate that admin creation currently relies on client-submitted `role: "admin"` metadata processed by `handle_new_user()`, or silent promotion of existing accounts.
2. Because any public caller can invoke `supabase.auth.signUp({ options: { data: { role: 'admin' } } })`, anyone can self-elevate to admin status unless `handle_new_user()` is stripped of admin assignment.
3. Therefore, removing `ELSIF raw_role_str = 'admin'` from `handle_new_user()` (Milestone 2) closes the public escalation vector.
4. However, after removing `admin` from `handle_new_user()`, `createAdminStaffMember` cannot rely on `signUp()`. It must use a privileged service-role client (`createAdminClient()`) calling `supabaseAdmin.auth.admin.createUser()` followed by explicit database promotion `UPDATE profiles SET role = 'admin'`.
5. Since `profiles.id` references `auth.users(id)`, `crypto.randomUUID()` causes database FK violations or orphaned profiles; the ID must strictly be `authData.user.id`.
6. If an existing `candidate` or `company` email is provided, silently converting them to `admin` violates least privilege and RBAC boundaries; the action must reject with a descriptive error.
7. If an unexpected error occurs during profile promotion or staff metadata insertion, an automated `try/catch` must execute `await supabaseAdmin.auth.admin.deleteUser(newUserId)` for newly created auth users to avoid orphan records.
8. Sanitizing `auth/callback/route.ts` and `dashboard-session.ts` ensures that even if user metadata is tampered with, `profiles.role` in Postgres remains the single source of truth.

---

## 3. Caveats

- **No Caveats**: All relevant files (`actions.ts`, `new-staff-form.tsx`, `callback/route.ts`, `dashboard-session.ts`, `require-admin.ts`, `server.ts`, `client.ts`, `proxy.ts`, SQL migrations, `vitest.config.ts`, `package.json`) were directly inspected and verified.

---

## 4. Conclusion

The security vulnerabilities and architectural gaps have been clearly mapped and isolated:
1. **M2 (Database Agent)**: Create a new idempotent SQL migration hardening `handle_new_user()` so that it strictly assigns `'company'` or `'candidate'`, never `'admin'`, and preserves `ON CONFLICT` safety.
2. **M3 (Backend Agent)**:
   - Create `src/lib/supabase/admin.ts` with `server-only`, `SUPABASE_SERVICE_ROLE_KEY`, and non-persisting session.
   - Refactor `createAdminStaffMember` to use `createAdminClient()`, eliminate `crypto.randomUUID()` and `signUp()`, reject existing candidate/company users, perform explicit promotion, and implement compensatory rollback.
   - Sanitize `src/app/(auth)/auth/callback/route.ts` and `src/modules/auth/services/dashboard-session.ts`.
3. **M4 (Testing Agent)**: Implement the 12 automated security tests in `src/tests/security-admin-creation.test.ts` using Vitest to verify all attack vectors and error paths are blocked.

---

## 5. Verification Method

To verify these findings independently:
1. **Type Check**:
   ```bash
   npx tsc --noEmit
   ```
2. **Test Runner**:
   ```bash
   npx vitest run
   ```
3. **Inspect Target Files**:
   - `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (lines 86-184)
   - `src/app/(auth)/auth/callback/route.ts` (lines 26-38)
   - `src/modules/auth/services/dashboard-session.ts` (lines 13-33)
   - `supabase/migrations/20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql` (lines 19-23)
   - `supabase/migrations/20260728000000_initial_schema.sql` (line 27)
