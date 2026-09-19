# Technical Analysis Report: Backend Codebase & Security Architecture

**Milestone**: Milestone 1 - Survey & Security Audit Assessment  
**Agent**: Backend Codebase Explorer (`explorer_backend_m1`)  
**Date**: 2026-08-26  
**Target Project**: K'anPro Admin Creation Security Hardening  
**Target Working Directory**: `/Users/brianpech/Developer/Commercial/kanpro`

---

## 1. Executive Summary & Scope

A rigorous forensic audit of K'anPro's authentication, authorization, and staff provisioning backend was conducted to investigate critical privilege escalation vulnerabilities and architectural anti-patterns in the administrative onboarding pipeline.

### Core Security Invariants Established
1. `public.handle_new_user()` database trigger must **never** assign the `admin` role under any circumstance, regardless of metadata submitted in public registration.
2. Elevation to `profiles.role = 'admin'` must occur **exclusively** via authenticated administrators executing the privileged server action `createAdminStaffMember()` backed by a server-only Service Role client (`src/lib/supabase/admin.ts`).
3. User identities must **always** originate from Supabase Auth (`auth.users.id`). The use of `crypto.randomUUID()` to generate phantom profiles without auth accounts is prohibited.
4. If an existing `candidate` or `company` user exists with the requested email, `createAdminStaffMember()` must **reject** the request without altering the existing role.
5. If user creation succeeds in `auth.users` but subsequent database operations fail, an automated **compensatory rollback** (`auth.admin.deleteUser()`) must clean up the orphaned auth user.
6. `auth/callback` and `dashboard-session` must treat `public.profiles.role` as the **sole authority**, ignoring client-controlled metadata.

---

## 2. Forensic Codebase Inspection

### 2.1 Staff Actions (`src/app/(dashboard)/dashboard/admin/staff/actions.ts`)

#### Authorization Check (`requireAdminAuth`)
```typescript
// Lines 7-29
async function requireAdminAuth() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado. Por favor inicie sesión.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    throw new Error("Acceso denegado: Se requieren permisos de administrador.");
  }

  return { supabase, user };
}
```
- **Finding**: Uses the cookie-based SSR client (`@/lib/supabase/server`). Accurately checks `profiles.role === 'admin'`.
- **Limitation**: Returns `{ supabase, user }` where `supabase` is bound to the logged-in admin user. Running DML operations on auth or bypass-protected tables with this client relies on RLS policies rather than service-level authority.

#### Current `createAdminStaffMember` Flow (Lines 86-184)
```typescript
export async function createAdminStaffMember(formData: {
  name: string;
  email: string;
  password?: string;
  whatsappNumber: string;
  subRole: AdminSubRole;
  department: string;
  permissions: AdminPermissionKey[];
  notes?: string;
}) {
  const { supabase } = await requireAdminAuth();
  const cleanEmail = formData.email.trim().toLowerCase();

  // 1. Existing profile check
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", cleanEmail)
    .maybeSingle();

  let targetProfileId: string;

  if (existingProfile) {
    targetProfileId = existingProfile.id;
    // CRITICAL FLAW 1: Silently mutates candidate/company into admin
    await supabase
      .from("profiles")
      .update({
        role: "admin",
        full_name: formData.name,
        whatsapp_number: formData.whatsappNumber,
      })
      .eq("id", targetProfileId);
  } else {
    if (formData.password && formData.password.trim().length >= 6) {
      // CRITICAL FLAW 2: Uses cookie-based client for signUp() inside Server Action
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password.trim(),
        options: {
          data: {
            full_name: formData.name,
            role: "admin", // Relies on vulnerable trigger
          },
        },
      });

      if (authErr) {
        // CRITICAL FLAW 3: Fallback generates random UUID disconnected from auth.users
        targetProfileId = crypto.randomUUID();
      } else {
        targetProfileId = authData.user?.id || crypto.randomUUID();
      }
    } else {
      targetProfileId = crypto.randomUUID();
    }

    // Direct upsert with potential fake UUID
    const { error: insertProfileErr } = await supabase.from("profiles").upsert(
      {
        id: targetProfileId,
        email: cleanEmail,
        full_name: formData.name,
        whatsapp_number: formData.whatsappNumber,
        role: "admin",
        is_verified: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    ...
```

---

### 2.2 UI Form Contract (`src/modules/admin/components/new-staff-form.tsx`)
- Multi-step wizard (Steps 1 to 4):
  - **Step 1: Datos Personales**: `name`, `email`, `whatsappNumber`, `department`.
  - **Step 2: Credenciales**: `password`, `confirmPassword` (min 6 chars, equality checked).
  - **Step 3: Rol & Permisos**: `subRole`, `permissions` (`AdminPermissionKey[]`), `notes`.
  - **Step 4: Confirmación & Alta**: Displays live summary card and executes `createAdminStaffMember()`.
- Client submission call:
  ```typescript
  await createAdminStaffMember({
    name,
    email,
    password,
    whatsappNumber,
    subRole,
    department,
    permissions,
    notes,
  });
  ```
- **Conclusion**: The form already requires and validates `password` (min 6 chars). The backend refactor will maintain 100% contract compatibility without visual regressions.

---

### 2.3 Supabase Client Architecture Inspection

| Client Location | Constructor Function | Underlying Library | Purpose | Security Context |
|---|---|---|---|---|
| `src/lib/supabase/client.ts` | `createClient()` | `createBrowserClient` (`@supabase/ssr`) | Browser client components | Anon Key, uses browser cookies/localStorage |
| `src/lib/supabase/server.ts` | `createClient()` | `createServerClient` (`@supabase/ssr`) | Server Components, Server Actions | Anon Key, binds to `next/headers` cookies |
| `src/lib/supabase/proxy.ts` | `updateSession()` | `createServerClient` (`@supabase/ssr`) | Next.js Middleware/Proxy route guard | Anon Key, manages cookie refresh & redirects |
| `src/lib/supabase/admin.ts` | **DOES NOT EXIST YET** | `@supabase/supabase-js` `createClient` | Server-only administrative backend actions | Service Role Key, non-persisting session |

---

### 2.4 Related Vulnerability Vectors

#### A. Auth Callback Route (`src/app/(auth)/auth/callback/route.ts`)
- **Observed Code (Lines 26-38)**:
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
  ```
- **Vulnerability**: If a user navigates to `/auth/callback?role=admin` or registers with metadata `role: "admin"`, this route assigns `role: "admin"` directly in `profiles` and updates auth metadata.
- **Remediation**: Eliminate `'admin'` from whitelist. Accept only `'company'` or `'candidate'`.

#### B. Dashboard Session Service (`src/modules/auth/services/dashboard-session.ts`)
- **Observed Code (Lines 13-33)**:
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
- **Vulnerability**: If `user_metadata.role` is set to `"admin"` by the client via `supabase.auth.updateUser({ data: { role: 'admin' } })`, `dashboard-session` bypasses the database profile lookup and grants the user an admin dashboard view and plan.
- **Remediation**: Always query `profiles.role` as the primary truth.

#### C. Require Admin Helper (`src/lib/auth/require-admin.ts`)
- **Observed Code (Lines 42-45)**:
  ```typescript
  const effectiveRole = (profile?.role ||
    user.user_metadata?.role ||
    "candidate") as UserRole;
  ```
- **Vulnerability**: Fallback to `user.user_metadata?.role` can allow privilege escalation if profile is absent.
- **Remediation**: Strict enforcement `profile?.role === 'admin'`.

---

## 3. Detailed Inventory of Anti-Patterns in `createAdminStaffMember()`

### 1. `crypto.randomUUID()` Phantom Identities
- **Mechanism**: When `authErr` occurs or password is omitted, `actions.ts` generates a random UUID using Node/Web Crypto and inserts it into `public.profiles`.
- **Impact**:
  - `public.profiles.id` has a Foreign Key constraint `REFERENCES auth.users(id) ON DELETE CASCADE` (defined in `supabase/migrations/20260728000000_initial_schema.sql:27`).
  - In PostgreSQL, inserting a non-existent UUID violates `profiles_id_fkey` and throws an unhandled database exception.
  - If FK check were disabled, it creates orphan profiles with no authentication credentials.

### 2. Session Corruption via `supabase.auth.signUp()`
- **Mechanism**: The Server Action uses the cookie-bound client (`createServerClient`) and calls `signUp()`.
- **Impact**:
  - In Supabase SSR, `signUp()` modifies response cookies and auth storage.
  - This can corrupt the active session of the administrator creating the account or log them out unexpectedly.

### 3. Silent Role Elevation of Existing Non-Admin Users
- **Mechanism**: If an email matches an existing user profile with role `candidate` or `company`, the action executes `UPDATE profiles SET role = 'admin'`.
- **Impact**: Bypasses proper authorization lifecycle and elevates candidate or company accounts to full platform administrators without explicit verification.

### 4. Lack of Compensatory Rollback
- **Mechanism**: If `auth.admin.createUser()` succeeds in creating a user in `auth.users`, but subsequent profile promotion or `admin_staff_members` insert fails (due to validation, RLS, constraint, or network error), the operation terminates.
- **Impact**: Leaves orphaned users in `auth.users` that cannot log in or be recreated because the email is taken.

---

## 4. Technical Implementation Recommendations

### 4.1 Specification for `src/lib/supabase/admin.ts`
```typescript
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Creates a privileged server-only Supabase client using the Service Role Key.
 *
 * Security Invariants:
 * 1. Must never be imported in client components (enforced by "server-only").
 * 2. Operates without session persistence, cookie binding, or auto token refresh.
 * 3. Bypasses RLS to execute administrative operations (user provisioning, role elevation).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Admin Client Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
```

---

### 4.2 Specification for Refactored `createAdminStaffMember()`

```typescript
export async function createAdminStaffMember(formData: {
  name: string;
  email: string;
  password?: string;
  whatsappNumber: string;
  subRole: AdminSubRole;
  department: string;
  permissions: AdminPermissionKey[];
  notes?: string;
}) {
  // 1. Authorize calling admin via session client
  const { user: executorUser } = await requireAdminAuth();

  const cleanEmail = formData.email.trim().toLowerCase();
  const cleanName = formData.name.trim();
  const cleanPhone = formData.whatsappNumber.trim();
  const cleanPassword = formData.password?.trim();

  if (!cleanEmail || !cleanName) {
    throw new Error("Nombre y correo electrónico institucional son requeridos.");
  }

  // 2. Initialize privileged admin client
  const supabaseAdmin = createAdminClient();

  // 3. Inspect existing profile
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, email")
    .eq("email", cleanEmail)
    .maybeSingle();

  let targetUserId: string;
  let isNewAuthUser = false;

  if (existingProfile) {
    // 4. Reject existing candidates or companies
    if (existingProfile.role !== "admin") {
      throw new Error(
        `El usuario con el correo "${cleanEmail}" ya está registrado con el rol "${existingProfile.role}". No es posible convertirlo a administrador mediante este formulario.`
      );
    }
    targetUserId = existingProfile.id;

    // Update profile data for existing admin
    await supabaseAdmin
      .from("profiles")
      .update({
        full_name: cleanName,
        whatsapp_number: cleanPhone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId);
  } else {
    // 5. New user creation requires password
    if (!cleanPassword || cleanPassword.length < 6) {
      throw new Error("La contraseña para el nuevo administrador debe tener al menos 6 caracteres.");
    }

    // 6. Create user in Supabase Auth via Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        whatsapp_number: cleanPhone,
      },
    });

    if (authError || !authData.user) {
      throw new Error(`Error al registrar credenciales de administrador: ${authError?.message || "Desconocido"}`);
    }

    targetUserId = authData.user.id;
    isNewAuthUser = true;

    // 7. Transactional promotion with compensatory rollback
    try {
      // Explicitly elevate profile to admin role
      const { error: profileErr } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: targetUserId,
            email: cleanEmail,
            full_name: cleanName,
            whatsapp_number: cleanPhone,
            role: "admin",
            is_verified: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (profileErr) {
        throw new Error(`Error al promover perfil a administrador: ${profileErr.message}`);
      }

      // Upsert admin staff metadata
      const { error: staffErr } = await supabaseAdmin
        .from("admin_staff_members")
        .upsert(
          {
            profile_id: targetUserId,
            sub_role: formData.subRole,
            department: formData.department,
            permissions: formData.permissions,
            status: "active",
            notes: formData.notes || "Alta de personal administrativo",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "profile_id" }
        );

      if (staffErr) {
        throw new Error(`Error al registrar metadata de personal: ${staffErr.message}`);
      }
    } catch (operationError) {
      // 8. Compensatory Rollback: clean up auth user if created during this operation
      if (isNewAuthUser) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(targetUserId);
        } catch (rollbackErr) {
          console.error(`Rollback error deleting auth user ${targetUserId}:`, rollbackErr);
        }
      }
      throw operationError;
    }
  }

  // Update staff metadata if user was an existing admin
  if (!isNewAuthUser) {
    const { error: staffErr } = await supabaseAdmin
      .from("admin_staff_members")
      .upsert(
        {
          profile_id: targetUserId,
          sub_role: formData.subRole,
          department: formData.department,
          permissions: formData.permissions,
          notes: formData.notes || "Actualización de personal",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id" }
      );

    if (staffErr) {
      throw new Error(`Error al actualizar metadata de personal: ${staffErr.message}`);
    }
  }

  revalidatePath("/dashboard/admin/staff");
  return { success: true, profileId: targetUserId };
}
```

---

## 5. Test Harness & Security Test Suite Strategy

### Current Test Environment
- **Test Framework**: Vitest `4.1.10` configured in `vitest.config.ts`.
- **Node Environment**: Configured with `@` alias to `./src`.
- **Type Checking**: `npx tsc --noEmit` is currently passing with 0 errors.

### Implementation Plan for 12 Security Test Cases (Milestone 4)
File target: `src/tests/security-admin-creation.test.ts`

| Test # | Description | Verification Logic |
|---|---|---|
| **Test 1** | Public signup with `data: { role: "admin" }` | Mock or trigger test: Profile created in DB has `role === 'candidate'`. |
| **Test 2** | Public signup with `role: "super_admin"` | Profile created in DB has `role === 'candidate'`. |
| **Test 3** | Public signup with `role: "company"` | Profile created in DB has `role === 'company'`. |
| **Test 4** | Callback route with `?role=admin` | GET `/auth/callback?code=...&role=admin` never assigns `role: 'admin'`. |
| **Test 5** | Metadata modification `user_metadata.role = "admin"` | `getDashboardSession()` and `requireAdmin()` strictly use `profiles.role`. |
| **Test 6** | Anonymous caller invokes `createAdminStaffMember` | Rejected with "No autenticado". |
| **Test 7** | Candidate/Company user invokes `createAdminStaffMember` | Rejected with "Acceso denegado". |
| **Test 8** | Admin creates new staff member | Success, executor session unaffected. |
| **Test 9** | Real UUID parity check | `auth.users.id === profiles.id`, no `crypto.randomUUID()`. |
| **Test 10** | Database verification | Profile has `role === 'admin'` and record exists in `admin_staff_members`. |
| **Test 11** | Existing candidate email passed to `createAdminStaffMember` | Rejected with safe error; candidate role is preserved untouched. |
| **Test 12** | Compensatory rollback check | Injected database error triggers `supabaseAdmin.auth.admin.deleteUser()`. |
