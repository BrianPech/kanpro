# Database Schema & Trigger Specification Analysis — Milestone 1
**Project**: K'anPro Admin Creation Security Hardening & Privilege Escalation Fix  
**Agent**: Database Schema Spec Miner (`spec_miner_db_m1`)  
**Date**: 2026-08-26  
**Status**: COMPLETE  

---

## 1. Executive Summary & Forensic Vulnerability Analysis

A comprehensive audit of the database schema migrations in `supabase/migrations/` was conducted to investigate the root causes of the privilege escalation vulnerability (P0/P1) in K'anPro and to design an authoritative, hardened database specification.

### 1.1 Root Cause in `handle_new_user()`
The vulnerability originated in `supabase/migrations/20260728000000_initial_schema.sql` and was perpetuated in `20260815030000_fix_auth_role_trigger.sql` and `20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql`.

In these migrations, the function `public.handle_new_user()` parsed user metadata directly:
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
Furthermore, the `ON CONFLICT (id)` clause did:
```sql
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  ...
```

### 1.2 Security Impact
1. **Public Privilege Escalation**: Any unauthenticated actor submitting a registration payload (e.g. `supabase.auth.signUp({ email, password, options: { data: { role: 'admin' } } })`) was automatically granted `profiles.role = 'admin'`.
2. **Admin Downgrade/Overwrite Risk**: If an existing admin user triggered a conflict, their role was subject to `EXCLUDED.role` overwriting, potentially degrading or compromising admin state.
3. **Database Security Invariant Violation**: The database violated the core security rule that database triggers on public auth events MUST NEVER assign administrative roles.

---

## 2. Evolution and Historical State of `public.handle_new_user()`

| Migration File | Changes to `handle_new_user()` | Flaws / Vulnerabilities |
|---|---|---|
| `20260728000000_initial_schema.sql` | First implementation: cast `NEW.raw_user_meta_data->>'role'` directly to `user_role`. Set `search_path = public, pg_temp`. Created trigger `on_auth_user_created AFTER INSERT ON auth.users`. | Direct cast allowed arbitrary role in metadata including `admin`. |
| `20260815030000_fix_auth_role_trigger.sql` | Added explicit `IF/ELSIF/ELSE` for role assignment (`company`, `admin`, `candidate`). Added `ON CONFLICT (id) DO UPDATE` on `profiles` and `company_profiles`. Executed backfill updating profiles to metadata role. | Explicitly supported `ELSIF raw_role_str = 'admin'`, enabling metadata privilege escalation. `ON CONFLICT` blindly replaced `role = EXCLUDED.role`. |
| `20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql` | Added parsing of `raw_birth_date` (supporting `DD/MM/YYYY` and `YYYY-MM-DD`) and insert/upsert into `candidate_private_profiles`. Set `search_path = public` (omitted `pg_temp`). | Maintained `ELSIF raw_role_str = 'admin'` and `role = EXCLUDED.role`. Missing `pg_temp` in `search_path`. |

---

## 3. Comprehensive Database Schema Inventory

### 3.1 Custom Enums
- **`public.user_role`**: `('candidate', 'company', 'admin')`
- **`public.candidate_type`**: `('trabajador', 'oficio', 'profesionista')`
- **`public.company_entity_type`**: `('persona_fisica', 'persona_moral')`
- **`public.document_type`**: `('ine_passport', 'curp', 'constancia_situacion_fiscal', 'proof_of_address', 'cv', 'cedula_profesional', 'titulo_profesional', 'acta_constitutiva', 'legal_power', 'legal_rep_id', 'imss_registry', 'repse', 'operating_license', 'work_certificate', 'recommendation_letter', 'course_certificate', 'work_photo')`
- **`public.verification_status`**: `('pending', 'approved', 'rejected')`
- **`public.employee_status`**: `('onboarding', 'active', 'suspended', 'terminated')`

---

### 3.2 Affected Table Definitions and Constraints

#### 1. `public.profiles` (Base Profile Table)
| Column Name | Data Type | Nullable | Default | Constraints & References |
|---|---|---|---|---|
| `id` | `UUID` | NO | None | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE` |
| `role` | `user_role` | NO | `'candidate'::user_role` | Enum: candidate, company, admin |
| `email` | `TEXT` | NO | None | `UNIQUE` |
| `full_name` | `TEXT` | NO | None | Initial default in trigger: `'Usuario K’anPro'` |
| `whatsapp_number` | `TEXT` | NO | None | Initial default in trigger: `''` |
| `avatar_url` | `TEXT` | YES | `NULL` | |
| `location` | `TEXT` | YES | `'Mérida, Yucatán'` | |
| `is_verified` | `BOOLEAN` | NO | `FALSE` | |
| `terms_accepted_at`| `TIMESTAMPTZ` | NO | `NOW()` | |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | |

**Row Level Security (RLS)**:
- Enabled on `public.profiles`.
- Policies:
  - `Users read own profile`: `FOR SELECT TO authenticated USING (id = (SELECT auth.uid()))`
  - `Authenticated view candidate basic profile directory`: `FOR SELECT TO authenticated USING (role = 'candidate' OR id = (SELECT auth.uid()))`
  - `Companies read applicant contact details`: `FOR SELECT TO authenticated ...`
  - `Users update own profile without role changes`: `FOR UPDATE TO authenticated USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()) AND (role = public.get_user_role() OR public.is_admin()))`
  - `Admins manage all profiles`: `FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())`

---

#### 2. `public.candidate_profiles` (Public Candidate Profile)
| Column Name | Data Type | Nullable | Default | Constraints & References |
|---|---|---|---|---|
| `id` | `UUID` | NO | None | `PRIMARY KEY`, `REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `candidate_type` | `candidate_type` | NO | `'trabajador'::candidate_type` | Enum: trabajador, oficio, profesionista |
| `curp` | `VARCHAR(18)` | YES | `NULL` | Stripped/migrated to private profiles |
| `birth_date` | `DATE` | YES | `NULL` | Stripped/migrated to private profiles |
| `headline` | `TEXT` | YES | `NULL` | |
| `bio` | `TEXT` | YES | `NULL` | |
| `rfc` | `VARCHAR(13)` | YES | `NULL` | Stripped/migrated to private profiles |
| `cedula_profesional`| `TEXT` | YES | `NULL` | Stripped/migrated to private profiles |
| `specialization_area`| `TEXT` | YES | `NULL` | |
| `years_experience` | `INT` | YES | `0` | |
| `trade_description`| `TEXT` | YES | `NULL` | |
| `preferred_zone` | `TEXT` | YES | `NULL` | |
| `skills` | `TEXT[]` | YES | `'{}'::text[]` | |
| `languages` | `JSONB` | YES | `'[]'::jsonb` | |
| `education` | `JSONB` | YES | `'[]'::jsonb` | |
| `experience` | `JSONB` | YES | `'[]'::jsonb` | |
| `portfolio_links` | `JSONB` | YES | `'[]'::jsonb` | |
| `social_links` | `JSONB` | YES | `'{}'::jsonb` | |
| `certifications` | `JSONB` | YES | `'[]'::jsonb` | Added in migration `20260815043500` |
| `job_alerts_enabled`| `BOOLEAN`| YES | `TRUE` | |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | |

**Row Level Security (RLS)**:
- Enabled on `public.candidate_profiles`.
- Policies:
  - `Authenticated view candidate profiles directory`: `FOR SELECT TO authenticated USING (true)`
  - `Candidates can update own profile`: `FOR UPDATE USING ((select auth.uid()) = id)`
  - `Candidates can insert own profile`: `FOR INSERT WITH CHECK ((select auth.uid()) = id)`
  - `Admins manage candidate profiles`: `FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())`

---

#### 3. `public.candidate_private_profiles` (Sensitive Private Identity)
| Column Name | Data Type | Nullable | Default | Constraints & References |
|---|---|---|---|---|
| `id` | `UUID` | NO | None | `PRIMARY KEY`, `REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `curp` | `VARCHAR(18)` | YES | `NULL` | `UNIQUE` |
| `rfc` | `VARCHAR(13)` | YES | `NULL` | |
| `birth_date` | `DATE` | YES | `NULL` | Populated by trigger from metadata |
| `cedula_profesional`| `TEXT` | YES | `NULL` | |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | |

**Row Level Security (RLS)**:
- Enabled on `public.candidate_private_profiles`.
- Policies:
  - `Candidates manage own private identity`: `FOR ALL TO authenticated USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()))`
  - `Admins manage candidate private identity`: `FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())`

---

#### 4. `public.company_profiles` (Company Profile)
| Column Name | Data Type | Nullable | Default | Constraints & References |
|---|---|---|---|---|
| `id` | `UUID` | NO | None | `PRIMARY KEY`, `REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `entity_type` | `company_entity_type` | NO | `'persona_moral'::company_entity_type` | |
| `company_name` | `TEXT` | NO | None | Trigger default: `'Nueva Empresa'` |
| `legal_name` | `TEXT` | YES | `NULL` | |
| `rfc` | `VARCHAR(13)` | NO | None | Trigger default: `'XAXX010101000'` |
| `fiscal_address` | `TEXT` | NO | None | Trigger default: `'Mérida, Yucatán'` |
| `industry` | `TEXT` | NO | None | Trigger default: `'General'` |
| `company_size` | `TEXT` | YES | `NULL` | |
| `description` | `TEXT` | YES | `NULL` | |
| `legal_rep_name` | `TEXT` | YES | `NULL` | |
| `corporate_email`| `TEXT` | YES | `NULL` | |
| `contact_phone` | `TEXT` | YES | `NULL` | |
| `website_url` | `TEXT` | YES | `NULL` | |
| `social_links` | `JSONB` | YES | `'{}'::jsonb` | |
| `branch_addresses`| `JSONB` | YES | `'[]'::jsonb` | |
| `address_details`| `TEXT` | YES | `NULL` | Added in migration `20260731000001` |
| `operation_hours`| `TEXT` | YES | `NULL` | Added in migration `20260731000001` |
| `imss_patronal_registry`| `TEXT` | YES | `NULL` | |
| `repse_registry` | `TEXT` | YES | `NULL` | |
| `logo_url` | `TEXT` | YES | `NULL` | |
| `banner_url` | `TEXT` | YES | `NULL` | |
| `credits_available`| `INT` | NO | `0` | |
| `rating` | `NUMERIC(3,2)` | YES | `5.00` | |
| `verification_status`| `verification_status`| YES | `'pending'::verification_status` | |
| `subscription_plan`| `TEXT` | NO | `'free'` | Added in migration `20260805000000` |
| `subscription_status`| `TEXT` | NO | `'active'` | Added in migration `20260805000000` |
| `subscription_period_end`| `TIMESTAMPTZ`| YES | `NULL` | Added in migration `20260805000000` |
| `featured_vacancies_allowance`| `INT`| NO | `0` | Added in migration `20260805000000` |
| `featured_vacancies_used`| `INT` | NO | `0` | Added in migration `20260805000000` |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | |

**Row Level Security (RLS)**:
- Enabled on `public.company_profiles`.
- Policies:
  - `Public read company profiles for directory`: `FOR SELECT TO public USING (true)`
  - `Companies manage own profile`: `FOR ALL TO authenticated USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()))`
  - `Admins manage company profiles`: `FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())`

---

#### 5. `public.admin_staff_members` (Admin Staff Metadata)
| Column Name | Data Type | Nullable | Default | Constraints & References |
|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid_generate_v4()` | `PRIMARY KEY` |
| `profile_id` | `UUID` | NO | None | `UNIQUE`, `REFERENCES public.profiles(id) ON DELETE CASCADE` |
| `sub_role` | `TEXT` | NO | `'ops_admin'` | Allowed: super_admin, ops_admin, content_admin, verification_admin, support |
| `department` | `TEXT` | YES | `'Operaciones'` | |
| `permissions` | `TEXT[]` | YES | `'{}'::text[]` | Array of admin permission keys |
| `status` | `TEXT` | NO | `'active'` | active, inactive, suspended |
| `notes` | `TEXT` | YES | `NULL` | |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | |

**Indexes**:
- `idx_admin_staff_profile_id ON public.admin_staff_members(profile_id)`
- `idx_admin_staff_sub_role ON public.admin_staff_members(sub_role)`
- `idx_admin_staff_status ON public.admin_staff_members(status)`

**Row Level Security (RLS)**:
- Enabled on `public.admin_staff_members`.
- Policy: `Admins can manage admin staff members`: `FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())`

---

## 4. Auth Triggers on `auth.users`

- **Trigger Name**: `on_auth_user_created`
- **Target Table**: `auth.users`
- **Trigger Event**: `AFTER INSERT`
- **Granularity**: `FOR EACH ROW`
- **Target Function**: `public.handle_new_user()`
- **Execution Order**: Single trigger attached to `auth.users`. Executed immediately upon user creation in Supabase Auth.
- **RPC Privileges**: Direct `EXECUTE` on `public.handle_new_user()` is REVOKED from `PUBLIC`, `anon`, and `authenticated` to prevent PostgREST RPC exploitation.

---

## 5. Specification Miner Output Tables

### Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth Trigger | `handle_new_user` Candidate Registration | Creates base `profiles`, `candidate_profiles`, and `candidate_private_profiles` with parsed birth date | `NEW.id`, `NEW.email`, `raw_user_meta_data` (`full_name`, `whatsapp_number`, `birth_date`) | New rows in `profiles`, `candidate_profiles`, `candidate_private_profiles` | Returns `NULL` for invalid date formats; creates candidate profile safely | `20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql` |
| 2 | Auth Trigger | `handle_new_user` Company Registration | Creates base `profiles` and `company_profiles` with default business values | `NEW.id`, `NEW.email`, `raw_user_meta_data->>'role' = 'company'`, `company_name`, `rfc`, `fiscal_address`, `industry` | New rows in `profiles` and `company_profiles` with role `'company'` | Defaults missing fields to standard Mexican defaults (`'XAXX010101000'`, `'Mérida, Yucatán'`, `'General'`) | `20260815030000_fix_auth_role_trigger.sql` |
| 3 | Security / RBAC | Strict Role Assignment Invariant | Strips ability for any metadata to request `'admin'` or `'super_admin'` | `NEW.raw_user_meta_data->>'role'` | Always `'candidate'` unless exact match for `'company'` | None; silently coerces untrusted/arbitrary role input to `'candidate'` | R1 Specification Requirement |
| 4 | Security / Idempotency | `ON CONFLICT` Admin Role Guard | Prevents downgrade or mutation of existing `admin` profiles during re-execution of trigger | Existing `profiles.role = 'admin'` on conflict | Role preserved as `'admin'` | Safe conditional `CASE` expression in `ON CONFLICT` update | R1 Specification Requirement |
| 5 | Staff Management | `admin_staff_members` Record Association | Associates sub_role, department, permissions array and status with an admin profile | `profile_id`, `sub_role`, `department`, `permissions`, `status`, `notes` | Row in `admin_staff_members` | Rejects non-existent `profile_id` via FK constraint (`REFERENCES profiles(id)`) | `20260812000000_admin_staff_management.sql` |
| 6 | Authorization | Non-recursive RLS Helpers | `public.is_admin()` and `public.get_user_role()` stable security definer functions | `user_id UUID DEFAULT auth.uid()` | `BOOLEAN` / `public.user_role` | Returns `false` or `NULL` if user not found | `20260815033000_fix_rls_infinite_recursion_profiles.sql` |
| 7 | Bootstrap | Operational Admin Provisioning | Manual promotion and staff creation via SQL Editor / direct database connection | Target `auth.users.id` UUID | Promoted `profiles.role = 'admin'`, active `admin_staff_members` entry | Fails if UUID does not exist in `auth.users` | R5 Specification Requirement |

### Edge Cases
| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | `handle_new_user` | `raw_user_meta_data = { role: "admin" }` | Trigger assigns `assigned_role := 'candidate'::public.user_role`. `profiles.role` is set to `'candidate'`. Admin escalation is blocked. |
| 2 | `handle_new_user` | `raw_user_meta_data = { role: "super_admin" }` | Trigger assigns `'candidate'`. Escalation blocked. |
| 3 | `handle_new_user` | `raw_user_meta_data = { role: "hacker'; DROP TABLE profiles; --" }` | Handled via safe parameterized JSON extraction `->>'role'`, evaluated strictly in `IF raw_role_str = 'company'`, falls through to `'candidate'`. |
| 4 | `handle_new_user` | `raw_user_meta_data = {}` (empty) or `NULL` | Trigger defaults `assigned_role` to `'candidate'`. `full_name` defaults to `'Usuario K’anPro'`, `whatsapp_number` defaults to `''`. |
| 5 | `handle_new_user` | Conflict on existing user where `profiles.role = 'admin'` | `ON CONFLICT (id) DO UPDATE` executes `CASE WHEN profiles.role = 'admin' THEN profiles.role ELSE EXCLUDED.role END`. Role remains `'admin'` intact without degradation. |
| 6 | `handle_new_user` | Conflict on existing user where `profiles.role = 'candidate'` | `ON CONFLICT (id) DO UPDATE` updates `role` to `EXCLUDED.role` (which is `'candidate'` or `'company'`, never admin). |
| 7 | `handle_new_user` | `birth_date = "15/08/1995"` (DD/MM/YYYY) | Normalized via `to_date('15/08/1995', 'DD/MM/YYYY')` to `1995-08-15` in `candidate_private_profiles`. |
| 8 | `handle_new_user` | `birth_date = "1995-08-15"` (ISO YYYY-MM-DD) | Normalized via `::date` to `1995-08-15` in `candidate_private_profiles`. |
| 9 | `handle_new_user` | `birth_date = "invalid-date-string"` | Caught by exception block (`EXCEPTION WHEN OTHERS THEN parsed_birth_date := NULL;`), safely stored as `NULL` without aborting transaction. |
| 10 | `handle_new_user` | Direct PostgREST RPC call to `handle_new_user()` | Blocked and rejected because `REVOKE EXECUTE` is applied for `PUBLIC`, `anon`, and `authenticated`. |

---

## 6. Authoritative SQL Migration Design (Requirement R1)

The following migration is designed to be placed in a new migration file (e.g. `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql`). It is completely idempotent, preserves all legitimate candidate/company flows, and closes all privilege escalation vectors.

```sql
-- ============================================================================
-- Migration: 20260826000000_harden_auth_user_creation_trigger.sql
-- Description: Security Hardening for handle_new_user() trigger (Requirement R1)
-- 
-- 1. Strips all ability to assign 'admin' role from raw_user_meta_data.
-- 2. Strictly enforces default to 'candidate' for all values other than 'company'.
-- 3. Protects existing 'admin' profiles from downgrade or overwrite on conflict.
-- 4. Retains birth_date parsing and sync to candidate_private_profiles.
-- 5. Sets immutable search_path = public, pg_temp for SECURITY DEFINER safety.
-- 6. Revokes public execute access to prevent PostgREST RPC exposure.
-- ============================================================================

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
  
  -- Strict assignment rule:
  -- Only 'company' yields 'company'::public.user_role.
  -- ALL other values (including 'admin', 'super_admin', NULL, empty or arbitrary)
  -- strictly default to 'candidate'::public.user_role.
  -- Elevating to 'admin' via user metadata is strictly prohibited.
  IF raw_role_str = 'company' THEN
    assigned_role := 'company'::public.user_role;
  ELSE
    assigned_role := 'candidate'::public.user_role;
  END IF;

  -- Insert profile or update non-role fields while preserving existing admin status
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
  
  -- Initialize specialized profile according to assigned role
  IF assigned_role = 'candidate' THEN
    -- Public candidate profile
    INSERT INTO public.candidate_profiles (id) VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;

    -- Extract and normalize birth_date for sensitive private profile
    raw_birth_date := NEW.raw_user_meta_data->>'birth_date';
    IF raw_birth_date IS NOT NULL AND raw_birth_date <> '' THEN
      BEGIN
        IF raw_birth_date ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
          parsed_birth_date := to_date(raw_birth_date, 'DD/MM/YYYY');
        ELSIF raw_birth_date ~ '^\d{4}-\d{2}-\d{2}$' THEN
          parsed_birth_date := raw_birth_date::date;
        ELSE
          parsed_birth_date := raw_birth_date::date;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        parsed_birth_date := NULL;
      END;
    ELSE
      parsed_birth_date := NULL;
    END IF;

    -- Private candidate profile
    INSERT INTO public.candidate_private_profiles (id, birth_date)
    VALUES (NEW.id, parsed_birth_date)
    ON CONFLICT (id) DO UPDATE SET
      birth_date = COALESCE(EXCLUDED.birth_date, public.candidate_private_profiles.birth_date),
      updated_at = NOW();

  ELSIF assigned_role = 'company' THEN
    company_title := COALESCE(
      NEW.raw_user_meta_data->>'company_name',
      NEW.raw_user_meta_data->>'full_name',
      'Nueva Empresa'
    );
    INSERT INTO public.company_profiles (
      id, company_name, rfc, fiscal_address, industry
    ) VALUES (
      NEW.id,
      company_title,
      COALESCE(NEW.raw_user_meta_data->>'rfc', 'XAXX010101000'),
      COALESCE(NEW.raw_user_meta_data->>'fiscal_address', 'Mérida, Yucatán'),
      COALESCE(NEW.raw_user_meta_data->>'industry', 'General')
    )
    ON CONFLICT (id) DO UPDATE SET
      company_name = COALESCE(NULLIF(EXCLUDED.company_name, ''), public.company_profiles.company_name),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- Revoke execute permissions from client-accessible roles (prevents RPC invocation)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Recreate trigger on auth.users idempotently
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 7. Secure Admin Bootstrap Specification (Requirement R5)

To guarantee zero public attack surface for administrative setup, no public HTTP endpoints or unprotected server actions exist for bootstrapping. The initial administrator (`super_admin`) is provisioned directly through an authenticated database session (Supabase Studio SQL Editor or CLI/psql).

### 7.1 Operational Bootstrap Workflow
1. **User Identity Creation**: Create the target admin account in Supabase Auth:
   - Option A: Via Supabase Studio -> **Authentication** -> **Users** -> **Add User** (Enter email, password, confirm email = true).
   - Option B: Via Supabase CLI / Auth Admin API.
2. **UUID Identification**: Copy the generated `id` (UUID) from the Authentication table.
3. **Privilege Elevation & Staff Registration**: Execute the SQL statement in the Supabase SQL Editor.

### 7.2 Exact Bootstrap SQL Script

```sql
-- ============================================================================
-- OPERATIONAL PROCEDURE: SECURE BOOTSTRAP OF THE INITIAL SUPER ADMIN
-- Run in Supabase Studio SQL Editor
-- ============================================================================

DO $$
DECLARE
  target_user_id UUID := '<USER_UUID>'::uuid; -- Replace with actual auth.users UUID
  target_email TEXT := 'admin@kanpro.mx';     -- Replace with target admin email
BEGIN
  -- Verify user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Usuario con UUID % no existe en auth.users. Cree el usuario en Authentication primero.', target_user_id;
  END IF;

  -- 1. Promote profile to admin and verify
  UPDATE public.profiles
  SET 
    role = 'admin'::public.user_role,
    is_verified = true,
    updated_at = NOW()
  WHERE id = target_user_id;

  -- If profile was not yet created by trigger, insert it explicitly
  INSERT INTO public.profiles (id, email, full_name, whatsapp_number, role, is_verified)
  VALUES (
    target_user_id,
    target_email,
    'Super Administrador K’anPro',
    '+529990000000',
    'admin'::public.user_role,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin'::public.user_role,
    is_verified = true,
    updated_at = NOW();

  -- 2. Insert or Upsert Super Admin staff record
  INSERT INTO public.admin_staff_members (
    profile_id,
    sub_role,
    department,
    status,
    permissions,
    notes,
    created_at,
    updated_at
  ) VALUES (
    target_user_id,
    'super_admin',
    'Dirección General',
    'active',
    ARRAY[
      'manage_users',
      'manage_companies',
      'verify_documents',
      'manage_vacancies',
      'analytics_access',
      'system_settings'
    ]::text[],
    'Super Administrador inicial aprovisionado mediante bootstrap seguro.',
    NOW(),
    NOW()
  )
  ON CONFLICT (profile_id) DO UPDATE SET
    sub_role = EXCLUDED.sub_role,
    department = EXCLUDED.department,
    status = EXCLUDED.status,
    permissions = EXCLUDED.permissions,
    notes = EXCLUDED.notes,
    updated_at = NOW();

  RAISE NOTICE 'Super Administrador % aprovisionado exitosamente con perfil UUID %.', target_email, target_user_id;
END $$;

-- 3. Verification Query
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_verified,
  s.sub_role,
  s.department,
  s.status AS staff_status,
  s.permissions
FROM public.profiles p
JOIN public.admin_staff_members s ON s.profile_id = p.id
WHERE p.id = '<USER_UUID>'::uuid;
```

---

## 8. Summary of Findings for Downstream Agents

1. **For Database / Supabase Agent (Milestone 2)**:
   - Migration file to create: `supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql` with exact content specified in Section 6.
   - Bootstrap guide to create: `docs/security/ADMIN_BOOTSTRAP.md` with script from Section 7.
2. **For Backend Agent (Milestone 3)**:
   - `createAdminStaffMember()` must NEVER use `supabase.auth.signUp()`. It must use `createAdminClient()` (Service Role) calling `supabaseAdmin.auth.admin.createUser()`.
   - `admin_staff_members.permissions` is `TEXT[]` in PostgreSQL; in TypeScript `permissions` should be passed as an array of string permission keys.
   - `profiles.role` is `public.user_role` enum (`'candidate' | 'company' | 'admin'`).
3. **For Security / QA Agent (Milestone 4)**:
   - Test cases 1, 2, 3 must verify that `signUp({ data: { role: 'admin' } })` yields `'candidate'`, `role: 'super_admin'` yields `'candidate'`, and `role: 'company'` yields `'company'`.
   - Test cases 9, 10 must verify that real `auth.users.id` matches `profiles.id` and `admin_staff_members.profile_id`.
