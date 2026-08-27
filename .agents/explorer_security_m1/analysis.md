# Comprehensive Security and Authentication Audit Report
**Milestone 1 — K'anPro Admin Creation Security Hardening & Privilege Escalation Remediation**

- **Auditor**: Security / Auth Auditor (`explorer_security_m1`)
- **Date**: 2026-08-26
- **Status**: COMPLETED
- **Classification**: CRITICAL (P0 / P1 Vulnerability Assessment)

---

## 1. Executive Summary

A comprehensive architectural and code-level security audit was conducted on the K'anPro authentication, authorization, and administrative onboarding infrastructure. 

The audit identified multiple critical **P0/P1 Privilege Escalation Vulnerabilities** that allow an unauthenticated or public user to elevate their account privileges to `admin` through:
1. Client-supplied `user_metadata` in public signups via the PostgreSQL trigger `public.handle_new_user()`.
2. URL search parameters and user metadata in `src/app/(auth)/auth/callback/route.ts`.
3. Client-controlled metadata precedence in `src/modules/auth/services/dashboard-session.ts` and `src/lib/auth/require-admin.ts`.
4. Flawed identity provisioning, session corruption, and silent role promotion in `src/app/(dashboard)/dashboard/admin/staff/actions.ts`.

### Core Security Invariants Established
- **Invariant 1 (Database Invariant)**: `public.handle_new_user()` is strictly restricted to assigning `candidate` or `company` roles. Under no circumstances can metadata from `auth.users` grant `admin` privileges.
- **Invariant 2 (Sole Source of Truth)**: `public.profiles.role` in PostgreSQL is the single source of truth for authorization decisions across the system. `user_metadata` MUST NEVER be trusted for role evaluation.
- **Invariant 3 (Isolated Administrative Elevation)**: Promotion to `profiles.role = 'admin'` occurs exclusively via authenticated admin execution of server-side actions utilizing a dedicated, server-only Supabase Service Role client (`createAdminClient`).
- **Invariant 4 (Identity Integrity & Rollback)**: Administrative staff identities MUST originate directly from Supabase Auth (`auth.users.id`). If downstream profile or metadata creation fails during creation, a compensatory rollback MUST delete the newly created auth user to avoid orphan records.
- **Invariant 5 (Zero Secret Leakage)**: `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the client, browser bundle, error messages, logs, or client-side hooks.

---

## 2. Forensic Analysis of Vulnerability Vectors

### Vector 1: Public Privilege Escalation via `public.handle_new_user()` (P0)
- **Location**: `supabase/migrations/20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql` (Lines 15–23, 33–37).
- **Vulnerability Mechanism**:
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
  Because `NEW.raw_user_meta_data` is populated directly from the client during `supabase.auth.signUp({ options: { data: { role: 'admin' } } })`, any anonymous user can register directly with `role = 'admin'`.
- **Secondary Risk (Role Degradation / Overwrite)**:
  `ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role` overwrites existing profile roles without checking if the current role is already `admin`.
- **Required Fix**:
  - Remove `ELSIF raw_role_str = 'admin'` entirely.
  - Strict rule: If `raw_role_str = 'company'` then `'company'`, else `'candidate'`.
  - In `ON CONFLICT (id) DO UPDATE SET`, protect existing `admin` roles:
    `role = CASE WHEN public.profiles.role = 'admin' THEN 'admin'::public.user_role ELSE EXCLUDED.role END`.

---

### Vector 2: Privilege Escalation via OAuth / Magic Link Callback (P0)
- **Location**: `src/app/(auth)/auth/callback/route.ts` (Lines 27–58, 86–96).
- **Vulnerability Mechanism**:
  ```typescript
  if (!role) {
    const metaRole = data.user.user_metadata?.role;
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

    await supabase.from("profiles").upsert({
      id: data.user.id,
      ...,
      role: assignedRole
    });
  ```
  If a user signs in via OAuth/Magic Link before their profile exists, an attacker appending `?role=admin` to the callback URL or possessing `role: "admin"` in OAuth metadata is immediately granted `admin` in `public.profiles`.
- **Required Fix**:
  - Completely remove `"admin"` from `searchRole` and `metaRole` whitelists.
  - Map only `"company"` (if explicitly requested and valid) or default to `"candidate"`.

---

### Vector 3: Client Metadata Precedence in Session Authorization (P1)
- **Location**: `src/modules/auth/services/dashboard-session.ts` (Lines 12–34).
- **Vulnerability Mechanism**:
  ```typescript
  let metaRole = user.user_metadata?.role as "company" | "candidate" | "admin" | undefined;
  if (!metaRole || !metaFullName) {
    const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
    ...
  }
  role = metaRole || "candidate";
  ```
  Because `metaRole` is evaluated before querying `public.profiles`, any authenticated user who calls `supabase.auth.updateUser({ data: { role: 'admin' } })` from the browser console receives `role: "admin"` in `getDashboardSession()`. The database is never queried.
- **Required Fix**:
  - Query `public.profiles.role` as the primary and authoritative value.
  - Completely ignore `user.user_metadata?.role` for role resolution.

---

### Vector 4: Fallback Vulnerabilities in Route Guards and Helpers (P1)
- **Location**:
  - `src/lib/auth/require-admin.ts` (Lines 42–45):
    ```typescript
    const effectiveRole = (profile?.role || user.user_metadata?.role || "candidate") as UserRole;
    ```
  - `src/lib/supabase/proxy.ts` (Lines 89–98):
    ```typescript
    let role: UserRole = (user.user_metadata?.role as UserRole) || 'candidate';
    ```
  - `src/modules/auth/hooks/use-user-session.ts` (Lines 31–36, 68):
    ```typescript
    let userRole: UserRole = (currentUser.user_metadata?.role as UserRole) || "candidate";
    ```
- **Vulnerability Mechanism**:
  If the `profiles` query fails, returns null, or has a race condition, the application falls back to `user.user_metadata?.role`. An attacker who set `user_metadata.role = 'admin'` passes the `requireAdmin()` check.
- **Required Fix**:
  - Ensure fallback defaults strictly to `"candidate"`. Never accept `"admin"` from metadata under any condition.

---

### Vector 5: Flawed Staff Provisioning in `createAdminStaffMember` (P0 / Architecture)
- **Location**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (Lines 86–184).
- **Vulnerabilities Identified**:
  1. **Unintended Role Promotion**: If `createAdminStaffMember` is called with an email matching an existing candidate or company profile, lines 112–119 execute `UPDATE profiles SET role = 'admin'`, silently promoting them without validation.
  2. **Session Hijacking / Mutation**: Lines 123–132 invoke `supabase.auth.signUp()` using the active admin's session client. In Supabase SSR, `auth.signUp()` can mutate or corrupt the caller's session cookies.
  3. **Fake UUID Generation & Foreign Key Violations**: Lines 136, 141 generate `crypto.randomUUID()` and attempt to insert it into `public.profiles (id, ...)`. Because `public.profiles.id` has a foreign key constraint `REFERENCES auth.users(id) ON DELETE CASCADE`, inserting a fake UUID causes database constraint failure.
  4. **Lack of Service Role Client**: Operates with standard user-scoped client rather than a server-only Service Role client.
  5. **Lack of Compensatory Rollback**: If `auth.admin.createUser` succeeds but database insertion fails, the newly created auth user is left orphaned.
- **Required Fix**:
  - Refactor to use `createAdminClient()` (`src/lib/supabase/admin.ts`).
  - Reject existing candidate/company emails with a descriptive, safe error.
  - Create user with `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })`.
  - Use real `authData.user.id` for all downstream operations.
  - Implement compensatory rollback (`supabaseAdmin.auth.admin.deleteUser(newUserId)`) on failure.

---

## 3. Environment Variables & Secret Key Audit

### Audit Checklist & Findings
| Item | Status | Finding / Evidence |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` in browser bundles | **SECURE (Verified)** | No client component (`"use client"`) imports or references `SUPABASE_SERVICE_ROLE_KEY`. |
| Client imports of `@/lib/supabase/server` | **SECURE (Verified)** | All `@/lib/supabase/server` imports are located in Server Components, Route Handlers, and Server Actions. |
| `.env*` Git Exposure | **SECURE (Verified)** | `.gitignore` contains `.env*` (Line 34). No secrets committed. |
| `src/lib/supabase/admin.ts` Status | **PENDING CREATION (M3)** | File not yet created. Must be created with `import "server-only";` and strict env validation. |
| `server-only` package in `package.json` | **ACTION REQUIRED** | Package `server-only` is not currently in `package.json`. Backend Agent must install `server-only` before importing it. |

---

## 4. Row Level Security (RLS) & Schema Assessment

### Table-by-Table Policy Audit
1. **`public.profiles`**:
   - `Admins manage all profiles`: `USING (public.is_admin()) WITH CHECK (public.is_admin())` — **SECURE**.
   - `Users update own profile without role changes`: `USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()) AND (role = public.get_user_role() OR public.is_admin()))` — **SECURE**.
   - `Users read own profile`: `USING (id = (select auth.uid()))` — **SECURE**.
   - Anonymous access: Revoked.
2. **`public.admin_staff_members`**:
   - RLS enabled: `ALTER TABLE public.admin_staff_members ENABLE ROW LEVEL SECURITY;`.
   - `Admins can manage admin staff members`: `USING (public.is_admin()) WITH CHECK (public.is_admin())` — **SECURE**.
   - Non-admins and anonymous users have 0 rows visibility / modification.
3. **`public.candidate_profiles` & `public.company_profiles`**:
   - Full RLS protection enabled with ownership checks and `is_admin()` bypass for verified administrators.
4. **Helper Functions**:
   - `public.is_admin()` and `public.get_user_role()` are `SECURITY DEFINER` and query `public.profiles` directly, bypassing RLS recursion without reading untrusted metadata.

---

## 5. Security Test Specifications (12 Required Test Cases)

### Test Suite Structure: `src/__tests__/security/admin-privilege-hardening.test.ts`

```typescript
describe("K'anPro Security Hardening Test Suite (12 Core Invariants)", () => { ... });
```

#### Test 1: Public Registration with `role: "admin"`
- **Target**: `supabase.auth.signUp()` + `handle_new_user()` trigger.
- **Payload**: `{ email, password, options: { data: { role: "admin", full_name: "Attacker Admin" } } }`.
- **Expected Outcome**: Profile created with `profiles.role === 'candidate'`.
- **Assertion**:
  ```typescript
  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).single();
  expect(profile?.role).toBe("candidate");
  ```

#### Test 2: Public Registration with `role: "super_admin"`
- **Target**: `supabase.auth.signUp()` + `handle_new_user()` trigger.
- **Payload**: `{ email, password, options: { data: { role: "super_admin" } } }`.
- **Expected Outcome**: Profile created with `profiles.role === 'candidate'`.
- **Assertion**: `expect(profile?.role).toBe("candidate");`.

#### Test 3: Public Registration with `role: "company"`
- **Target**: `supabase.auth.signUp()` + `handle_new_user()` trigger.
- **Payload**: `{ email, password, options: { data: { role: "company", company_name: "Empresa Legítima" } } }`.
- **Expected Outcome**: Profile created with `profiles.role === 'company'`, and record created in `company_profiles`.
- **Assertion**:
  ```typescript
  expect(profile?.role).toBe("company");
  const { data: company } = await supabaseAdmin.from("company_profiles").select("id").eq("id", userId).single();
  expect(company).toBeDefined();
  ```

#### Test 4: Auth Callback with `?role=admin`
- **Target**: `src/app/(auth)/auth/callback/route.ts`.
- **Payload**: GET request with `code` and `searchParams: ?role=admin`.
- **Expected Outcome**: Profile role is assigned as `'candidate'`, redirection goes to `/dashboard/candidate`, and no administrative permissions are granted.
- **Assertion**:
  ```typescript
  expect(profile?.role).toBe("candidate");
  expect(redirectUrl).toContain("/dashboard/candidate");
  ```

#### Test 5: Post-registration `user_metadata.role = "admin"` Tampering
- **Target**: `src/modules/auth/services/dashboard-session.ts`.
- **Payload**: Candidate user calls `supabase.auth.updateUser({ data: { role: "admin" } })`.
- **Expected Outcome**: `getDashboardSession()` queries `profiles.role` and returns `role: "candidate"`.
- **Assertion**:
  ```typescript
  const session = await getDashboardSession();
  expect(session.role).toBe("candidate");
  expect(session.plan).not.toBe("Administrador");
  ```

#### Test 6: Anonymous Execution of `createAdminStaffMember`
- **Target**: `createAdminStaffMember` Server Action.
- **Context**: Unauthenticated request (no session / no user).
- **Expected Outcome**: Rejection with unauthorized error.
- **Assertion**:
  ```typescript
  await expect(createAdminStaffMember(validStaffData)).rejects.toThrow(/No autenticado/i);
  ```

#### Test 7: Candidate / Company Execution of `createAdminStaffMember`
- **Target**: `createAdminStaffMember` Server Action.
- **Context**: Authenticated session with `profiles.role = 'candidate'` or `'company'`.
- **Expected Outcome**: Rejection with forbidden error.
- **Assertion**:
  ```typescript
  await expect(createAdminStaffMember(validStaffData)).rejects.toThrow(/permisos de administrador/i);
  ```

#### Test 8: Authenticated Admin Creates Staff with Session Intact
- **Target**: `createAdminStaffMember` Server Action.
- **Context**: Authenticated admin session.
- **Expected Outcome**: Success `{ success: true, profileId: string }`. Admin session remains active.
- **Assertion**:
  ```typescript
  const result = await createAdminStaffMember(validStaffData);
  expect(result.success).toBe(true);
  expect(result.profileId).toBeDefined();
  // Verify admin session is unaffected
  const { data: { user } } = await adminSupabaseClient.auth.getUser();
  expect(user?.id).toBe(adminUserId);
  ```

#### Test 9: Real UUID Linkage (`auth.users.id === profiles.id`)
- **Target**: `createAdminStaffMember`.
- **Expected Outcome**: `auth.users.id` matches `profiles.id` exactly. Zero FK errors.
- **Assertion**:
  ```typescript
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(result.profileId);
  const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("id", result.profileId).single();
  expect(authUser.user?.id).toBe(profile?.id);
  ```

#### Test 10: Promotion to `profiles.role = 'admin'` and `admin_staff_members`
- **Target**: `createAdminStaffMember`.
- **Expected Outcome**: `profiles.role === 'admin'`, `profiles.is_verified === true`, and `admin_staff_members` row created with specified sub-role, department, permissions, status `'active'`.
- **Assertion**:
  ```typescript
  const { data: profile } = await supabaseAdmin.from("profiles").select("role, is_verified").eq("id", result.profileId).single();
  expect(profile?.role).toBe("admin");
  expect(profile?.is_verified).toBe(true);

  const { data: staff } = await supabaseAdmin.from("admin_staff_members").select("*").eq("profile_id", result.profileId).single();
  expect(staff?.sub_role).toBe(validStaffData.subRole);
  expect(staff?.status).toBe("active");
  ```

#### Test 11: Collision with Existing Candidate/Company Profile
- **Target**: `createAdminStaffMember` with existing candidate/company email.
- **Precondition**: User exists in DB with `profiles.role = 'candidate'`.
- **Expected Outcome**: Rejection with safe error message. Profile role remains `'candidate'`.
- **Assertion**:
  ```typescript
  await expect(createAdminStaffMember({ ...validStaffData, email: existingCandidateEmail }))
    .rejects.toThrow(/ya existe.*promoción/i);

  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("email", existingCandidateEmail).single();
  expect(profile?.role).toBe("candidate");
  ```

#### Test 12: Compensatory Rollback on Failure
- **Target**: `createAdminStaffMember` failure simulation (e.g. invalid DB constraint or mocked staff insertion failure).
- **Expected Outcome**: Catch block triggers `supabaseAdmin.auth.admin.deleteUser(newUserId)`. No orphan auth user remains.
- **Assertion**:
  ```typescript
  // Trigger failure during staff metadata creation
  await expect(createAdminStaffMember(failingPayload)).rejects.toThrow();

  // Verify auth user was deleted
  const { data: authLookup } = await supabaseAdmin.auth.admin.getUserById(attemptedUserId);
  expect(authLookup.user).toBeNull();
  ```

---

## 6. Implementation Guidelines for Subsequent Milestones

### Milestone 2: Database Agent
1. **Migration File**: Create a new migration `supabase/migrations/<timestamp>_harden_handle_new_user_security.sql`.
2. **Idempotent Trigger Definition**:
   - Re-declare `public.handle_new_user()` with `SECURITY DEFINER` and `SET search_path = public, auth, pg_temp;`.
   - Ensure strict mapping: only `'company'` if `raw_role_str = 'company'`, otherwise `'candidate'`.
   - In `ON CONFLICT (id) DO UPDATE SET`:
     `role = CASE WHEN public.profiles.role = 'admin' THEN 'admin'::public.user_role ELSE EXCLUDED.role END`
   - Preserve `candidate_private_profiles` (with birth_date parsing) and `company_profiles` creation.
3. **Bootstrap Documentation**: Create `docs/security/ADMIN_BOOTSTRAP.md` detailing the secure manual SQL provisioning of the initial `super_admin`.

### Milestone 3: Backend Agent
1. **Add `server-only`**: Install dependency via `pnpm add server-only`.
2. **Implement `src/lib/supabase/admin.ts`**:
   - `import "server-only";`
   - Validate `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY`.
   - Return Supabase client with non-persisting session.
3. **Refactor `src/app/(dashboard)/dashboard/admin/staff/actions.ts`**:
   - Remove `auth.signUp` and `crypto.randomUUID()`.
   - Check existing user role: if candidate/company, reject. If admin, update staff metadata.
   - Use `supabaseAdmin.auth.admin.createUser()`.
   - Update `profiles` to `admin` and `is_verified: true`.
   - Insert `admin_staff_members`.
   - Wrap in `try/catch` with compensatory rollback (`supabaseAdmin.auth.admin.deleteUser(newUserId)`).
4. **Sanitize `src/app/(auth)/auth/callback/route.ts`**:
   - Disallow `'admin'` from `searchRole` and `metaRole`.
5. **Sanitize `src/modules/auth/services/dashboard-session.ts`**:
   - Always query `profiles.role` first. Ignore `user_metadata.role`.
6. **Sanitize `src/lib/auth/require-admin.ts` & `src/lib/supabase/proxy.ts`**:
   - Remove fallback to `user_metadata.role`.

### Milestone 4: QA / Testing Agent
1. Implement the 12 automated test cases in `src/__tests__/security/admin-privilege-hardening.test.ts`.
2. Execute `vitest run src/__tests__/security/admin-privilege-hardening.test.ts`.
3. Run project typecheck (`tsc --noEmit`), lint (`npm run lint`), and build (`npm run build`).
4. Validate zero regressions across existing flows (`src/tests/flows.test.ts`).
