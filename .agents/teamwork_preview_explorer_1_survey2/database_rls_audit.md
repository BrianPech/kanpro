# Comprehensive Database & RLS Authorization Security Audit

**Target System**: K'anPro (Next.js 16 + Supabase / PostgreSQL)  
**Auditor**: Explorer 2 (Database & RLS Auditor)  
**Date**: 2026-08-27  
**Scope**: All SQL migrations in `supabase/migrations/`, schema definitions, SQL functions/triggers, Row Level Security (RLS) policies, and database state integrity.

---

## 1. Executive Summary & Database Authorization Topology

The K'anPro database authorization model is currently split between a coarse database-level role (`public.profiles.role`) and an unintegrated, informational metadata table (`public.admin_staff_members`).

### Key Findings
1. **RLS Authorization Blindspot**: Every single administrative RLS policy across the database relies strictly on `public.is_admin()`, which checks **only** `public.profiles.role = 'admin'`. Row Level Security has **zero visibility** into `admin_staff_members`, `sub_role`, `permissions`, or `status`.
2. **Direct Client SDK Privilege Escalation**: Because `public.admin_staff_members` has an RLS policy of `FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())` and has `GRANT ALL TO authenticated`, **any user with `profiles.role = 'admin'` can directly modify `admin_staff_members` via the Supabase client SDK** (e.g. promoting themselves to `super_admin` or assigning all permissions).
3. **Inactive/Suspended Staff Still Have Full Admin DB Access**: Setting `status = 'inactive'` or `status = 'suspended'` on `admin_staff_members` updates only the metadata row. `profiles.role` remains `'admin'`. Consequently, `is_admin()` returns `true`, and deactivated administrators retain full read/write access to all admin-restricted tables in the database.
4. **Orphan & Inconsistent Admin States**:
   - A user can be promoted to `profiles.role = 'admin'` via `updateUserRole` in `users/actions.ts` without creating a row in `admin_staff_members`. In the UI (`staff/actions.ts`), this orphan admin is automatically defaulted to `super_admin` with all 6 permissions.
   - A user whose profile is changed to `'candidate'` retains an orphaned `admin_staff_members` row.
5. **SQL Functions Security**:
   - `handle_new_user()` was successfully hardened in `20260826000000_harden_auth_user_creation_trigger.sql` against signup metadata role manipulation, sets `search_path = public, pg_temp`, and revokes public execution.
   - `is_admin()` and `get_user_role()` use `SET search_path = public` (omitting `pg_temp`), and are `SECURITY DEFINER STABLE` functions.

---

## 2. Database Schema Audit Related to Authorization

### 2.1 Table: `public.profiles`

* **Definition**: `supabase/migrations/20260728000000_initial_schema.sql` (lines 26–38)
* **Modifications**:
  - `20260814093811_harden_profile_privacy.sql`
  - `20260815024555_fix_security_definer_views.sql`
  - `20260815030000_fix_auth_role_trigger.sql`
  - `20260815033000_fix_rls_infinite_recursion_profiles.sql`
  - `20260826000000_harden_auth_user_creation_trigger.sql`
* **Schema**:
  ```sql
  CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'candidate',
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    avatar_url TEXT,
    location TEXT DEFAULT 'Mérida, Yucatán',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```
* **Enum `public.user_role`**: `'candidate'`, `'company'`, `'admin'`.  
  *Note*: There is **no** `super_admin` in `user_role`.
* **Triggers**:
  - `on_auth_user_created` on `auth.users` (`AFTER INSERT FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`).
* **Constraints & Defaults**:
  - `id` references `auth.users(id)` with `ON DELETE CASCADE`.
  - `role` defaults to `'candidate'`.
  - No database-level check constraint or foreign key ties `role = 'admin'` to `public.admin_staff_members`.

---

### 2.2 Table: `public.admin_staff_members`

* **Definition**: `supabase/migrations/20260812000000_admin_staff_management.sql` (lines 6–16)
* **Schema**:
  ```sql
  CREATE TABLE IF NOT EXISTS public.admin_staff_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sub_role TEXT NOT NULL DEFAULT 'ops_admin',
    department TEXT DEFAULT 'Operaciones',
    permissions TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```
* **Indexes**:
  - `idx_admin_staff_profile_id` on `profile_id`
  - `idx_admin_staff_sub_role` on `sub_role`
  - `idx_admin_staff_status` on `status`
* **Constraints & Integrity**:
  - `profile_id` is `UNIQUE NOT NULL` referencing `public.profiles(id)` with `ON DELETE CASCADE`.
  - `sub_role` is a plain `TEXT` column (no enum or check constraint enforcing valid sub-roles).
  - `status` is a plain `TEXT` column (no check constraint enforcing `'active' | 'inactive' | 'suspended'`).
  - **No constraint or trigger** checks whether `profiles.role` is `'admin'`.
  - **No trigger** synchronizes status changes with `public.profiles` or `auth.users`.

---

## 3. SQL Functions & Triggers Audit

### 3.1 `public.is_admin(user_id uuid DEFAULT auth.uid())`

* **Migration Source**: `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql` (lines 4–16)
* **Definition**:
  ```sql
  CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  STABLE
  AS $$
    SELECT EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'::public.user_role
    );
  $$;
  ```
* **Privileges**:
  ```sql
  REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
  GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
  ```
* **Security & Vulnerability Analysis**:
  1. **Security Mode**: `SECURITY DEFINER` prevents infinite RLS recursion on `public.profiles` and allows policy evaluations to read the `profiles` table directly.
  2. **Search Path**: `SET search_path = public`. While relatively safe for a single-table `sql` function, it omits `pg_temp` (standard hardening recommendation: `SET search_path = public, pg_temp` or `SET search_path = ''`).
  3. **Architectural Flaw**: The function evaluates authorization purely on `profiles.role = 'admin'`. It has **no** awareness of:
     - Whether a corresponding `admin_staff_members` record exists.
     - Whether `admin_staff_members.status` is `'active'`, `'inactive'`, or `'suspended'`.
     - Whether the administrator possesses specific subroles (`super_admin` vs `support`) or permissions (`system_settings`, `manage_users`).

---

### 3.2 `public.get_user_role(user_id uuid DEFAULT auth.uid())`

* **Migration Source**: `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql` (lines 19–29)
* **Definition**:
  ```sql
  CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
  RETURNS public.user_role
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  STABLE
  AS $$
    SELECT role
    FROM public.profiles
    WHERE id = COALESCE(user_id, auth.uid());
  $$;
  ```
* **Privileges**:
  ```sql
  REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
  GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
  ```
* **Security & Vulnerability Analysis**:
  1. Prevents unprivileged users from changing their own `role` on UPDATE in `public.profiles`.
  2. Because the update check is `WITH CHECK (id = (SELECT auth.uid()) AND (role = public.get_user_role() OR public.is_admin()))`, any user who is already an admin can alter roles via direct client SDK calls.

---

### 3.3 `public.handle_new_user()` & `on_auth_user_created` Trigger

* **Migration Source**: `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql` (lines 13–121)
* **Definition**:
  ```sql
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
  DECLARE
    raw_role_str text;
    assigned_role public.user_role;
    company_title text;
    raw_birth_date text;
    parsed_birth_date date;
  BEGIN
    raw_role_str := NEW.raw_user_meta_data->>'role';
    
    IF raw_role_str = 'company' THEN
      assigned_role := 'company'::public.user_role;
    ELSE
      assigned_role := 'candidate'::public.user_role;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, whatsapp_number, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario K’anPro'),
      COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', ''),
      assigned_role
    )
    ON CONFLICT (id) DO UPDATE SET
      role = CASE
        WHEN public.profiles.role = 'admin'::public.user_role THEN public.profiles.role
        ELSE EXCLUDED.role
      END,
      full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
      whatsapp_number = COALESCE(NULLIF(EXCLUDED.whatsapp_number, ''), public.profiles.whatsapp_number),
      updated_at = NOW();
    
    -- Initialize specialized candidate or company profile...
    RETURN NEW;
  END;
  $$;
  ```
* **Trigger**:
  ```sql
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```
* **Privileges**:
  ```sql
  REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
  REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
  REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
  ```
* **Security & Hardening Assessment**:
  1. **Privilege Escalation Prevention**: `raw_user_meta_data->>'role'` can **never** yield `'admin'`. Any signup payload attempting to pass `'admin'` or `'super_admin'` strictly falls back to `'candidate'`.
  2. **Admin Downgrade Protection**: Preserves existing admin profiles on conflict.
  3. **RPC Protection**: Execution revoked from all public client roles.
  4. **Search Path Hardened**: `SET search_path = public, pg_temp`.

---

## 4. Comprehensive RLS Matrix Across All Database Tables

The following matrix documents the active Row Level Security configuration across all 16 tables in schema `public` and all 3 Storage buckets.

| Table / Resource | RLS Enabled | `anon` Access | `authenticated` (Regular Users) Access | `admin` Access (via `is_admin()`) | Relies Solely on `profiles.role`? | Key Vulnerability / Finding |
|---|:---:|---|---|---|:---:|---|
| **`public.profiles`** | **YES** | None (`REVOKE ALL`) | **SELECT**: Own profile (`id = auth.uid()`), candidate directory (`role = 'candidate'`), applicant details for companies.<br>**UPDATE**: Own profile (cannot change `role`). | **ALL**: `"Admins manage all profiles"` (`is_admin()`). | **YES** | Any admin can modify any user's `role` to `'admin'` via client SDK. |
| **`public.candidate_profiles`** | **YES** | None (views use `security_invoker`) | **SELECT**: Own profile (`id = auth.uid()`), candidate directory (`true`), company viewing applicants.<br>**INSERT/UPDATE**: Own profile. | **ALL**: `"Admins manage candidate profiles"` (`is_admin()`). | **YES** | All admins have unrestricted CRUD over public candidate profiles. |
| **`public.candidate_private_profiles`** | **YES** | None | **ALL**: Own profile (`id = auth.uid()`). | **ALL**: `"Admins manage candidate private identity"` (`is_admin()`). | **YES** | Sensitive PII (`curp`, `rfc`, `cedula`, `birth_date`) readable/writable by **any** admin via SDK without `verify_documents` permission. |
| **`public.company_profiles`** | **YES** | **SELECT**: Directory (`true`). | **SELECT**: Directory (`true`).<br>**ALL**: Own company (`id = auth.uid()`). | **ALL**: `"Admins manage company profiles"` (`is_admin()`). | **YES** | Any admin can directly alter company credits, verification status, and subscriptions. |
| **`public.company_employees`** | **YES** | None | **ALL**: Company (`company_id = auth.uid()`).<br>**SELECT**: Employee (`employee_id = auth.uid()`). | None explicit (relies on service role). | N/A | Properly isolated between employer and employee. |
| **`public.profile_documents`** | **YES** | None | **SELECT**: Owner (`owner_id = auth.uid()`), authorized companies with approved request.<br>**INSERT/UPDATE**: Owner (`status = 'pending'`).<br>**DELETE**: Owner. | **ALL**: `"Admins can manage verification documents"` (`is_admin()`). | **YES** | Any admin can approve documents or read files via SDK without permission checks. |
| **`public.vacancies`** | **YES** | **SELECT**: Active vacancies (`is_active = true AND status = 'published'`). | **SELECT**: Active vacancies; own vacancies (`recruiter_id = auth.uid() OR company_id = auth.uid()`).<br>**INSERT/UPDATE/DELETE**: Own vacancies. | No explicit admin policy in SQL migrations. | N/A | Admin server actions using user client (`createClient()`) cannot update vacancies of other companies. |
| **`public.applications`** | **YES** | None | **ALL**: Candidate (`candidate_id = auth.uid()`).<br>**SELECT/UPDATE**: Company receiving application. | No explicit admin policy in SQL migrations. | N/A | Properly isolated to candidate and recruiter. |
| **`public.saved_vacancies`** | **YES** | None | **ALL**: Candidate (`candidate_id = auth.uid()`). | None. | N/A | Candidate-only isolation. |
| **`public.notifications`** | **YES** | None | **ALL**: Target user (`user_id = auth.uid()`). | None explicit. | N/A | Inserting notifications for other users requires `service_role` (`createAdminClient()`). |
| **`public.company_invoices`** | **YES** | None | **SELECT**: Company (`company_id = auth.uid()`). | **ALL**: `"Admins can manage all invoices"` (`is_admin()`). | **YES** | All admins can manage invoices; regular companies cannot direct-insert invoices. |
| **`public.document_access_requests`** | **YES** | None | **INSERT/SELECT**: Company.<br>**SELECT/UPDATE**: Candidate. | None explicit. | N/A | Candidate consent flow properly enforced. |
| **`public.admin_staff_members`** | **YES** | None | None for non-admin. | **ALL**: `"Admins can manage admin staff members"` (`is_admin()`). | **YES** | **CRITICAL**: Any user with `profiles.role = 'admin'` has direct client SDK CRUD on staff members, enabling self-escalation to `super_admin`. |
| **`public.support_tickets`** | **YES** | None | **SELECT/INSERT**: Ticket creator (`user_id = auth.uid()`). | **ALL**: `"Admins manage all support tickets"` (`is_admin()`). | **YES** | All admins can view/edit all tickets. |
| **`public.support_ticket_messages`** | **YES** | None | **SELECT**: Creator on non-internal notes (`is_internal_note = FALSE`). | **ALL**: `"Admins manage all support ticket messages"` (`is_admin()`). | **YES** | All admins can read/write internal notes and user messages. |
| **`public.vacancy_reports`** | **YES** | None | **INSERT**: Any authenticated user (`auth.uid() IS NOT NULL`). | **ALL**: `"Admins manage all vacancy reports"` (`is_admin()`). | **YES** | All admins have full management over reports and moderation queues. |

### 4.1 Storage Buckets RLS Policy Audit

| Storage Bucket | Public? | Policies Configured | Security Assessment |
|---|:---:|---|---|
| **`avatars`** | **TRUE** | `SELECT`: Public.<br>`INSERT/UPDATE/DELETE`: `(select auth.uid())::text = (storage.foldername(name))[1]`. | Secure: Users can only upload and modify assets in their own folder. |
| **`company_assets`** | **TRUE** | `SELECT`: Public.<br>`INSERT/UPDATE/DELETE`: `(select auth.uid())::text = (storage.foldername(name))[1]`. | Secure: Companies restricted to their own root folder. |
| **`profile_documents`** | **FALSE** | `SELECT`: Owner (`auth.uid() = foldername[1]`), Admin (`profiles.role = 'admin'`).<br>`ALL`: Owner (`auth.uid() = foldername[1]`). | Private bucket. Any user with `profiles.role = 'admin'` can generate signed URLs or read objects. |

---

## 5. Inconsistency & State Integrity Analysis

### 5.1 Scenario A: `profiles.role = 'admin'` without `admin_staff_members` Record

* **Occurrence**:
  - An admin promotes a user via `updateUserRole(userId, 'admin')` in `src/app/(dashboard)/dashboard/admin/users/actions.ts`.
  - Direct database update or legacy records created prior to migration `20260812000000`.
  - Partial failure where `profiles.role` is set to `'admin'` but `admin_staff_members` insert fails.
* **Database & RLS Impact**:
  - `is_admin()` evaluates to `true`. The user receives full admin privileges across all 10 admin RLS policies.
* **Application Impact**:
  - In `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (`getAdminStaffMembers()`, lines 55–85):
    ```ts
    const s = staffMap.get(p.id);
    return {
      subRole: (s?.sub_role as AdminSubRole) || "super_admin",
      department: s?.department || "Dirección General",
      permissions: (s?.permissions as AdminPermissionKey[]) || [
        "manage_users", "manage_companies", "verify_documents",
        "manage_vacancies", "analytics_access", "system_settings"
      ],
      status: (s?.status as AdminStaffStatus) || "active",
      ...
    };
    ```
  - **Critical Failure**: An orphan admin in `profiles` without a staff record is **automatically synthesized as a full active `super_admin` with all 6 permissions** in the UI!

---

### 5.2 Scenario B: `admin_staff_members` Record without `profiles.role = 'admin'`

* **Occurrence**:
  - An admin demotes a user via `updateUserRole(adminId, 'candidate')` in `users/actions.ts`. The `profiles.role` becomes `'candidate'`, but `admin_staff_members` is not deleted.
* **Database & RLS Impact**:
  - `is_admin()` returns `false`. The user is immediately blocked by RLS on all admin tables.
* **Application Impact**:
  - `requireAdminAuth()` rejects the user (`profile.role !== 'admin'`).
  - The record becomes a **zombie metadata row** in `admin_staff_members`. If the candidate is later re-promoted, the unique constraint on `profile_id` may cause collision or unexpected permission inheritance if not handled by `ON CONFLICT DO UPDATE`.

---

### 5.3 Scenario C: Staff Member Deletion or `status = 'inactive'` / `'suspended'`

* **Case C.1: Deletion via `deleteAdminStaffMember` Action**:
  - `deleteAdminStaffMember` in `staff/actions.ts` deletes the `admin_staff_members` row AND updates `profiles.role = 'candidate'`.
  - **However**, if an admin deletes the record via the Supabase client SDK (`supabase.from('admin_staff_members').delete()`), `profiles.role` remains `'admin'`, turning the user into a Scenario A orphan admin.
* **Case C.2: Status Deactivation (`status = 'inactive'` or `'suspended'`)**:
  - `toggleAdminStaffStatus(profileId, 'inactive')` updates **only** `admin_staff_members.status`.
  - `profiles.role` **remains `'admin'`**.
  - `is_admin()` continues to return `true`.
  - `requireAdminAuth()` in all Server Actions checks **only** `profiles.role === 'admin'` and does not query `admin_staff_members.status`.
  - **Severe Vulnerability**: Deactivating or suspending a staff member in the admin dashboard **fails to revoke their access**. The deactivated staff member can continue to invoke all Server Actions and execute queries against all admin tables via RLS.

---

## 6. Client SDK Direct Exploitation Vectors

Due to the permissive RLS policy `"Admins can manage admin staff members"` (`FOR ALL TO authenticated USING (public.is_admin())`):

```javascript
// Exploitation from browser console by any logged-in administrator (even 'support'):
const { data, error } = await supabase
  .from('admin_staff_members')
  .update({
    sub_role: 'super_admin',
    permissions: [
      'manage_users',
      'manage_companies',
      'verify_documents',
      'manage_vacancies',
      'analytics_access',
      'system_settings'
    ],
    status: 'active'
  })
  .eq('profile_id', myUserId);
```

**Result**: Succeeds with HTTP 200 / PostgREST success. The database accepts the update because RLS checks only `is_admin()`.

---

## 7. Recommended Database & RLS Architectural Remediation

To establish a resilient RBAC model at the database level:

1. **Add `is_active` / Status Verification to `public.is_admin()`**:
   ```sql
   CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
   RETURNS boolean
   LANGUAGE sql
   SECURITY DEFINER
   SET search_path = public, pg_temp
   STABLE
   AS $$
     SELECT EXISTS (
       SELECT 1
       FROM public.profiles p
       JOIN public.admin_staff_members s ON s.profile_id = p.id
       WHERE p.id = COALESCE(user_id, auth.uid())
         AND p.role = 'admin'::public.user_role
         AND s.status = 'active'
     );
   $$;
   ```
2. **Create Granular Database Helper Functions for RLS**:
   - `public.is_super_admin(user_id uuid DEFAULT auth.uid())`: Checks `s.sub_role = 'super_admin' AND s.status = 'active'`.
   - `public.has_admin_permission(perm text, user_id uuid DEFAULT auth.uid())`: Checks `perm = ANY(s.permissions) AND s.status = 'active'`.
3. **Harden `public.admin_staff_members` RLS**:
   - Allow **only `super_admin`** to INSERT, UPDATE, or DELETE records in `public.admin_staff_members`.
   - Allow lower-privilege admins SELECT access only to their own record or public directory.
4. **Enforce Database-Level Triggers**:
   - Trigger on `public.admin_staff_members`: When `status` changes to `'inactive'` or `'suspended'`, automatically downgrade or synchronize `profiles.role` or invalidate session.
   - Trigger on `public.profiles`: If `role` is updated from `'admin'` to `'candidate'`, automatically clean up or mark inactive in `admin_staff_members`.
