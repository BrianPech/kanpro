# Handoff Report: Security & Authentication Audit (Milestone 1)

**From**: Security / Auth Auditor (`explorer_security_m1`)  
**To**: Orchestrator (`parent`), Database Agent, Backend Agent, QA Agent  
**Date**: 2026-08-26  
**Status**: Task Complete (Hard Handoff)  

---

## 1. Observation

Direct observations and evidence from the codebase:

1. **`supabase/migrations/20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql` (Lines 15–23, 33–37)**:
   ```sql
   raw_role_str := NEW.raw_user_meta_data->>'role';
   
   IF raw_role_str = 'company' THEN
     assigned_role := 'company'::public.user_role;
   ELSIF raw_role_str = 'admin' THEN
     assigned_role := 'admin'::public.user_role;
   ELSE
     assigned_role := 'candidate'::public.user_role;
   END IF;
   ```
   Verbatim observation: `handle_new_user()` directly assigns `'admin'::public.user_role` if `NEW.raw_user_meta_data->>'role'` equals `'admin'`.

2. **`src/app/(auth)/auth/callback/route.ts` (Lines 29–38, 54)**:
   ```typescript
   const assignedRole =
     searchRole === "admin" ||
     searchRole === "company" ||
     searchRole === "candidate"
       ? searchRole
       : metaRole === "admin" ||
         metaRole === "company" ||
         metaRole === "candidate"
       ? metaRole
       : "candidate";

   const { error: upsertErr } = await supabase.from("profiles").upsert({
     id: data.user.id,
     ...,
     role: assignedRole,
   });
   ```
   Verbatim observation: If a user profile has no role at callback time, `searchRole === 'admin'` from URL query params or `metaRole === 'admin'` from metadata assigns `role: "admin"` and writes it to `public.profiles`.

3. **`src/modules/auth/services/dashboard-session.ts` (Lines 13–34)**:
   ```typescript
   let metaRole = user.user_metadata?.role as "company" | "candidate" | "admin" | undefined;
   let metaFullName = user.user_metadata?.full_name;

   if (!metaRole || !metaFullName) {
     const { data: profile } = await supabase
       .from('profiles')
       .select('role, full_name')
       .eq('id', user.id)
       .maybeSingle();
     ...
   }
   role = metaRole || "candidate";
   ```
   Verbatim observation: `user_metadata.role` takes precedence over database `profiles.role`. If `user_metadata.role` is present, `profiles` is never queried, and `role` evaluates directly to `metaRole`.

4. **`src/lib/auth/require-admin.ts` (Lines 42–45)**:
   ```typescript
   const effectiveRole = (profile?.role ||
     user.user_metadata?.role ||
     "candidate") as UserRole;

   if (effectiveRole !== "admin") { ... }
   ```
   Verbatim observation: If `profile?.role` is null/undefined, `effectiveRole` falls back to `user.user_metadata?.role`.

5. **`src/app/(dashboard)/dashboard/admin/staff/actions.ts` (Lines 109–160)**:
   ```typescript
   if (existingProfile) {
     targetProfileId = existingProfile.id;
     // Upgrade profile to admin
     await supabase.from("profiles").update({ role: "admin", ... }).eq("id", targetProfileId);
   } else {
     if (formData.password && formData.password.trim().length >= 6) {
       const { data: authData, error: authErr } = await supabase.auth.signUp({ ... });
       targetProfileId = authData.user?.id || crypto.randomUUID();
     } else {
       targetProfileId = crypto.randomUUID();
     }
     await supabase.from("profiles").upsert({ id: targetProfileId, ... });
   }
   ```
   Verbatim observation: Existing candidate/company users are silently promoted to `admin`. New users are created via client-scoped `supabase.auth.signUp()`, with fallback to `crypto.randomUUID()` which violates `profiles.id REFERENCES auth.users(id)`.

6. **Environment Variable & Secret Exposure Audit**:
   - `grep_search` across `src/` confirmed `SUPABASE_SERVICE_ROLE_KEY` is not referenced in any frontend client component (`"use client"`).
   - `node -e "require.resolve('server-only')"` failed with `MODULE_NOT_FOUND`. The package `server-only` is not yet installed in `package.json`.
   - `src/lib/supabase/admin.ts` does not exist yet.

---

## 2. Logic Chain

1. **Premise 1**: Any user can pass arbitrary JSON in `user_metadata` during public registration (`supabase.auth.signUp({ options: { data: { role: 'admin' } } })`) or update it later via `supabase.auth.updateUser({ data: { role: 'admin' } })`.
2. **From Observation 1**: Because `handle_new_user()` reads `NEW.raw_user_meta_data->>'role'` and sets `assigned_role := 'admin'`, any anonymous user registering with `{ data: { role: "admin" } }` receives a profile with `role = 'admin'` in the database.
3. **From Observation 2**: Because `auth/callback/route.ts` permits `searchRole === "admin"` or `metaRole === "admin"`, an attacker authenticating via OAuth or Magic Link with `?role=admin` is provisioned as an admin in `public.profiles`.
4. **From Observation 3 & 4**: Because `dashboard-session.ts` and `require-admin.ts` prioritize or fall back to `user_metadata.role`, a candidate altering their metadata via the browser API can spoof an admin session.
5. **From Observation 5**: In `createAdminStaffMember`, using `auth.signUp()` mutates the active administrator's session, using `crypto.randomUUID()` violates foreign key constraints against `auth.users(id)`, and existing non-admin profiles are silently overwritten to `admin`.
6. **From Observation 6**: Creating `src/lib/supabase/admin.ts` requires `server-only` to guarantee boundary isolation, but `server-only` must first be added to `package.json`.
7. **Conclusion**: Eliminating these privilege escalation vectors requires:
   - A new idempotent SQL migration hardening `handle_new_user()` and protecting `ON CONFLICT` roles.
   - Installation of `server-only` and creation of `src/lib/supabase/admin.ts`.
   - Complete refactoring of `createAdminStaffMember` with Service Role, user existence checks, real UUIDs, and compensatory rollback.
   - Sanitization of `auth/callback`, `dashboard-session.ts`, `require-admin.ts`, and `proxy.ts`.
   - Implementation and verification of the 12 automated security tests.

---

## 3. Caveats

- **Third-Party OAuth Metadata**: When users sign in with Google or LinkedIn, providers may supply metadata fields such as `name` or `picture`. Sanitizing `auth/callback` must only sanitize authorization claims (`role`), while preserving display attributes (`full_name`, `avatar_url`).
- **Existing Database Migrations**: Historical migrations in `supabase/migrations/` must NOT be edited directly. All schema changes must be applied via a new migration file.
- **Local Database Environment**: Full execution of database tests requires a running local Supabase instance or valid test database environment variables.

---

## 4. Conclusion

The codebase currently contains critical privilege escalation vectors and architectural defects in staff provisioning. 

A clear, actionable remediation blueprint has been formulated and documented in `analysis.md`:
- **Database Agent (Milestone 2)**: Author new migration for `handle_new_user()` stripping admin creation, ensuring `ON CONFLICT` safety, and document `docs/security/ADMIN_BOOTSTRAP.md`.
- **Backend Agent (Milestone 3)**: Add `server-only`, create `src/lib/supabase/admin.ts`, refactor `createAdminStaffMember` with compensatory rollback and rejection of existing candidate/company profiles, and sanitize all auth verification points (`auth/callback`, `dashboard-session.ts`, `require-admin.ts`, `proxy.ts`).
- **QA Agent (Milestone 4)**: Implement the 12 automated test cases in `src/__tests__/security/admin-privilege-hardening.test.ts` according to the exact specifications in `analysis.md`.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify `handle_new_user` vulnerability**:
   Inspect line 19 of `supabase/migrations/20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql`.
2. **Verify `auth/callback` vulnerability**:
   Inspect lines 30–38 of `src/app/(auth)/auth/callback/route.ts`.
3. **Verify `dashboard-session.ts` vulnerability**:
   Inspect lines 13–34 of `src/modules/auth/services/dashboard-session.ts`.
4. **Verify `createAdminStaffMember` flaws**:
   Inspect lines 109–160 of `src/app/(dashboard)/dashboard/admin/staff/actions.ts`.
5. **Verify `server-only` missing dependency**:
   Run `node -e "require.resolve('server-only')"` in project root.
6. **Verify Security Test Suite Execution**:
   Once implemented in Milestone 4, execute:
   ```bash
   npx vitest run src/__tests__/security/admin-privilege-hardening.test.ts
   ```
