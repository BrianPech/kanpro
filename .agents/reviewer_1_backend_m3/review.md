# Independent Quality & Adversarial Security Review: Milestone 3

**Reviewer**: Backend Security Reviewer 1 (Roles: Reviewer, Critic)  
**Date**: 2026-08-26  
**Target Milestone**: Milestone 3 - Backend Implementation (K'anPro Admin Creation Security Hardening)  
**Verdict**: **APPROVE**  

---

## 1. Executive Review Summary

This review provides an independent, evidence-based quality and adversarial security assessment of the backend implementation delivered for Milestone 3 (Requirements R2, R3, and R4).

All core security invariants have been verified:
1. **R2 (Server-Only Admin Client)**: `src/lib/supabase/admin.ts` strictly enforces server-only execution (`import "server-only";`), configures non-persisting sessions, and validates environment variables securely without secret leakage.
2. **R3 (Refactored `createAdminStaffMember`)**: `src/app/(dashboard)/dashboard/admin/staff/actions.ts` enforces admin authorization (`requireAdminAuth`), generates real `auth.users.id` identities via `supabaseAdmin.auth.admin.createUser()`, prevents FK constraint violations, explicitly rejects collision with existing candidate/company accounts with a descriptive Spanish error, promotes profiles explicitly to admin role, and implements compensatory rollback (`deleteUser`) strictly scoped to newly created users on downstream database failure.
3. **R4 (Sanitized Callback & Session Services)**: `src/app/(auth)/auth/callback/route.ts` rejects any attempt to pass `admin` in query params or metadata. `src/modules/auth/services/dashboard-session.ts`, `src/lib/auth/require-admin.ts`, and `src/lib/supabase/proxy.ts` strictly query `profiles.role` in the database as the sole source of truth, remaining completely immune to client-side metadata tampering.
4. **Integrity Verification**: No hardcoded test outputs, no facade implementations, no shortcuts, and zero secrets leaked.
5. **Quality Verification**: `npx tsc --noEmit` passed with 0 errors, ESLint passed with 0 warnings/errors, all 52 unit tests passed, and `npm run build` compiled successfully.

---

## 2. Requirement-by-Requirement Findings & Evidence

### 2.1 Requirement R2: Server-Only Admin Client (`src/lib/supabase/admin.ts`)
- **Observation**:
  - `import "server-only";` is present at line 1.
  - `package.json` includes `server-only: "^0.0.1"`.
  - `createAdminClient()` validates `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, throwing a generic error without exposing secret values.
  - Configures `auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }`.
  - Client is instantiated fresh and never persists tokens to global headers or cookies.
  - Grep verification confirms `createAdminClient` and `SUPABASE_SERVICE_ROLE_KEY` are never imported by client components or exposed to browser bundles.
- **Verdict**: **PASS (R2 Compliant)**

### 2.2 Requirement R3: Staff Actions Refactoring & Rollback (`src/app/(dashboard)/dashboard/admin/staff/actions.ts`)
- **Observation**:
  - **Authorization**: `requireAdminAuth()` is enforced as the first step in all staff actions (`getAdminStaffMembers`, `createAdminStaffMember`, `updateAdminStaffMember`, `toggleAdminStaffStatus`, `deleteAdminStaffMember`). It verifies both active user session and `profiles.role === 'admin'`.
  - **Authentic Identity**: Removed all calls to `supabase.auth.signUp()` and `crypto.randomUUID()`. New staff users are provisioned via `supabaseAdmin.auth.admin.createUser()`, yielding authentic `authData.user.id` matching `auth.users(id)`.
  - **Collision & Safe Rejection**: Checks existing profiles by email:
    - If existing user is `candidate` or `company`: throws error `"Este correo ya está registrado como candidato o empresa. Para otorgar acceso administrativo, utilice un flujo explícito de promoción."` without modifying `profiles.role`.
    - If existing user is `admin`: updates profile fields and upserts `admin_staff_members`.
  - **Explicit Promotion**: Uses `supabaseAdmin.from('profiles').upsert({ id: targetProfileId, role: 'admin', is_verified: true, ... }, { onConflict: 'id' })` and inserts into `admin_staff_members`.
  - **Compensatory Rollback**: Scoped to the `try/catch` block of new user creation. If profile upsert or staff metadata insertion fails, `await supabaseAdmin.auth.admin.deleteUser(targetProfileId)` deletes the newly created auth user. Existing accounts are never deleted.
  - **Session Preservation**: Uses `createAdminClient()` with `persistSession: false`, leaving the admin executor's session cookies untouched.
  - **Password Secrecy**: Minimum 6-character validation is enforced. The password is passed only to `createUser()` and is never stored in `profiles`, `admin_staff_members`, logs, or action return values.
  - **Self-Lockout Prevention**: `deleteAdminStaffMember` prevents an admin from deleting their own staff account (`user.id === profileId`).
- **Verdict**: **PASS (R3 Compliant)**

### 2.3 Requirement R4: Sanitized Callback & Session Services
- **Observation**:
  - **Auth Callback (`src/app/(auth)/auth/callback/route.ts`)**:
    - Lines 28–38: `assignedRole` accepts only `"candidate" | "company"`. Any query param or `user_metadata.role` containing `"admin"` or any other string defaults to `"candidate"`.
    - Open redirect protection: checks relative path syntax (`startsWith('/') && !startsWith('//')`) and URL origin matching.
  - **Dashboard Session (`src/modules/auth/services/dashboard-session.ts`)**:
    - `getDashboardSession()` queries `profiles.role` from the database.
    - If an attacker manipulates client-side `user_metadata.role = 'admin'`, `getDashboardSession()` ignores it and returns their true database role (`candidate` or `company`).
    - Fallback when profile record is missing only allows `"company"`, never `"admin"`.
  - **Admin Route Guard (`src/lib/auth/require-admin.ts`)**:
    - Checks `profile?.role === 'admin'` in database. Non-admins are redirected immediately to `/dashboard/candidate/discovery` or `/dashboard/company`.
  - **Proxy Middleware (`src/lib/supabase/proxy.ts`)**:
    - Checks database `profiles.role`. Metadata cannot grant access to `/dashboard/admin`.
  - **Client Hook & UI (`use-user-session.ts`, `nav-user.tsx`)**:
    - Sanitized to resolve roles from database `profiles.role`.
- **Verdict**: **PASS (R4 Compliant)**

---

## 3. Adversarial Stress Testing & Attack Analysis

| # | Attack Scenario / Edge Case | System Behavior | Result |
|---|-----------------------------|-----------------|--------|
| 1 | Attacker submits `signUp({ data: { role: "admin" } })` | Trigger (M2) and Callback (M3) force role to `candidate`. | **PASS (Immune)** |
| 2 | Attacker executes OAuth with `?role=admin` in callback URL | `auth/callback/route.ts` evaluates `assignedRole` to `candidate`. | **PASS (Immune)** |
| 3 | Authenticated Candidate edits `user_metadata.role = "admin"` via client SDK | `getDashboardSession()`, `requireAdmin()`, and `proxy.ts` query `profiles.role` in DB. Metadata ignored. | **PASS (Immune)** |
| 4 | Candidate attempts to execute `createAdminStaffMember` Server Action directly | `requireAdminAuth()` inspects DB role, sees `candidate`, and throws `"Acceso denegado"`. | **PASS (Immune)** |
| 5 | Admin attempts to create staff using an existing candidate's email | Action detects existing profile with `role === 'candidate'` and rejects with descriptive error; candidate role is not mutated. | **PASS (Immune)** |
| 6 | Database failure during profile promotion after Auth user creation | `catch` block invokes `deleteUser(targetProfileId)` to rollback orphaned auth user. | **PASS (Immune)** |
| 7 | Client component tries to import `createAdminClient` | `import "server-only";` triggers Next.js compilation error during build. | **PASS (Immune)** |
| 8 | Password exposure in database / logs / response | Password is only consumed by `auth.admin.createUser`; never stored in tables or logged. | **PASS (Immune)** |
| 9 | Admin attempts to delete own account | `deleteAdminStaffMember` blocks with `"No puede dar de baja su propio usuario administrador."` | **PASS (Immune)** |

---

## 4. Integrity & Anti-Pattern Audit

- **Hardcoded test outputs**: None found.
- **Dummy or facade implementations**: None found; all clients and actions execute full logical operations.
- **Bypass / shortcuts**: No backdoors or unverified bypasses.
- **Secret key leakage**: Zero occurrences of secret keys in client bundles, public routes, or error logs.

---

## 5. Build & Test Verification Summary

1. `npx tsc --noEmit` -> **0 errors** (PASSED)
2. `npx eslint ...` -> **0 errors, 0 warnings** (PASSED)
3. `npx vitest run src/tests/admin-security-hardening.test.ts ...` -> **52 passed** (PASSED)
4. `npm run build` -> Next.js Turbopack build succeeded with 0 errors (PASSED)

---

## 6. Final Verdict

**Verdict**: **APPROVE**  
The Milestone 3 backend implementation meets all architectural invariants, security requirements, and quality standards.
