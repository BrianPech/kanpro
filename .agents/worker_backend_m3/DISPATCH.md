## 2026-08-26T11:13:20Z

You are the Backend Worker for Milestone 3 of the K'anPro Admin Creation Security Hardening project.

Working Directory: /Users/brianpech/Developer/Commercial/kanpro/.agents/worker_backend_m3/
All your coordination metadata must be written only inside your working directory.

Mandatory files to read:
1. /Users/brianpech/Developer/Commercial/kanpro/.agents/ORIGINAL_REQUEST.md
2. /Users/brianpech/Developer/Commercial/kanpro/PROJECT.md
3. /Users/brianpech/Developer/Commercial/kanpro/.agents/explorer_backend_m1/analysis.md
4. /Users/brianpech/Developer/Commercial/kanpro/.agents/explorer_security_m1/analysis.md
5. /Users/brianpech/Developer/Commercial/kanpro/.agents/skills/supabase/SKILL.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks:
1. Requirement R2 (Server-Only Admin Supabase Client):
   - Install `server-only` if not yet installed in `package.json` (`npm install server-only`).
   - Create `src/lib/supabase/admin.ts`:
     - Must include `import "server-only";` at top.
     - Instantiate Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
     - Configure with:
       ```typescript
       auth: {
         persistSession: false,
         autoRefreshToken: false,
         detectSessionInUrl: false,
       }
       ```
     - Validate environment variables strictly and fail gracefully without revealing secrets.
     - Export `createAdminClient()`.

2. Requirement R3 (Refactor `createAdminStaffMember` and Staff Actions):
   - In `src/app/(dashboard)/dashboard/admin/staff/actions.ts`:
     - Eliminate all usage of `supabase.auth.signUp()` and `crypto.randomUUID()`. Identity must always originate in `auth.users.id`.
     - Ensure executor authorization via `requireAdminAuth`.
     - Initialize admin client via `createAdminClient()`.
     - Query user existence:
       - If existing user has `role === 'admin'`: permit updating their `admin_staff_members` record.
       - If existing user has `role === 'candidate'` or `role === 'company'`: REJECT with a descriptive error message: "Este correo ya está registrado como candidato o empresa. Para otorgar acceso administrativo, utilice un flujo explícito de promoción." Do NOT modify `profiles.role` or promote silently.
       - If user does not exist: create with `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: formData.name } })`.
       - Explicitly promote: `UPDATE profiles SET role = 'admin', is_verified = true WHERE id = authData.user.id`.
       - Insert/upsert `admin_staff_members` record (`profile_id`, `sub_role`, `department`, `permissions`, `status`, `notes`).
       - Compensatory Rollback: If user was newly created by this operation and subsequent `profiles` promotion or `admin_staff_members` insertion fails, execute `await supabaseAdmin.auth.admin.deleteUser(newUserId)` in `catch`. Never delete pre-existing users.
       - Session & Cookie preservation: never use client `signUp()`; executor session remains intact.
       - Password handling: never log or expose passwords.
       - Preserve UI & form contract with `new-staff-form.tsx`.

3. Requirement R4 (Sanitize `auth/callback` and `dashboard-session`):
   - In `src/app/(auth)/auth/callback/route.ts`:
     - Remove any whitelist or fallback that permits `admin`.
     - Only accept `candidate` or `company` from search params / metadata; all other values default to `candidate`.
   - In `src/modules/auth/services/dashboard-session.ts`:
     - `public.profiles.role` must be the ONLY source of truth for administrative access.
     - Prohibit trusting `user_metadata.role === 'admin'`.
   - In `src/lib/auth/require-admin.ts` and `src/lib/supabase/proxy.ts`:
     - Ensure `profiles.role === 'admin'` from database is strictly required without unverified metadata fallback.

4. Verify implementation:
   - Run `npx tsc --noEmit` and confirm 0 type errors.
   - Run linter and confirm 0 lint errors.

5. Deliverables:
   - Write `changes.md` and `handoff.md` in `/Users/brianpech/Developer/Commercial/kanpro/.agents/worker_backend_m3/`.
   - Send message to orchestrator when completed.
