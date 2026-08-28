# K'anPro RBAC Post-Hardening Security Audit: Database Migrations, RLS & PII Deep Dive

**Auditor Role**: Lead Database Migrations, RLS & PII Security Explorer  
**Date**: 2026-08-27  
**Scope**: `supabase/migrations/` (19 migration files), Database Schema Definitions, Row Level Security (RLS) Policies, PostgreSQL Functions & Triggers, Storage RLS, Candidate PII Protection, and Application/Database Split-Brain Authorization.  
**Mode**: Strict Read-Only Forensic Audit  

---

## 1. Executive Summary

A comprehensive, forensic security audit was conducted on the database schema, PostgreSQL migrations, Row Level Security (RLS) policies, database triggers/functions, and candidate personally identifiable information (PII) access pathways in K'anPro.

### Key Audit Conclusions

1. **RLS Activation Status (PASS)**: All 16 public tables in the database schema have `ROW LEVEL SECURITY` explicitly enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). No public table is left unshielded.
2. **The "Admin Equals Root" Architectural Defect (CRITICAL - P0)**: At the database RLS level, `public.is_admin()` evaluates exclusively whether `public.profiles.role = 'admin'`. It has **zero awareness** of `public.admin_staff_members`, sub-roles (`super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`), permissions arrays, or administrative status (`active`, `suspended`, `inactive`). Consequently:
   - Every administrative user possesses complete, unrestricted CRUD permissions across all database tables (including `admin_staff_members`, `candidate_private_profiles`, `profile_documents`, and `company_invoices`).
   - A `support` agent or `suspended` administrator can directly bypass application guards and execute direct PostgREST / Supabase SDK queries to promote themselves to `super_admin`, modify permissions, or delete other admins.
3. **Suspended Admin Invalidation Failure (CRITICAL - P0)**: Changing `admin_staff_members.status` to `'suspended'` or `'inactive'` **does not revoke access** in either the application middleware/proxies or the database RLS layer, allowing suspended personnel to maintain active administrative control.
4. **Candidate Contact PII Leakage via Permissive Directory Policy (HIGH - P1)**: In migration `20260815024555_fix_security_definer_views.sql`, the policy `"Authenticated view candidate basic profile directory"` on `public.profiles` grants `SELECT` to `authenticated` using `(role = 'candidate' OR id = auth.uid())`. This inadvertently exposes all candidate emails, WhatsApp phone numbers, full names, and locations to any authenticated user via direct REST API queries, bypassing the redaction intended by the `candidate_directory` view.
5. **Commercial Subscription & Billing Bypass via Direct RLS (HIGH - P1)**: Policy `"Companies manage own profile"` on `public.company_profiles` allows `FOR ALL` with `USING (id = auth.uid()) WITH CHECK (id = auth.uid())`. Any authenticated company user can issue a direct `UPDATE` request to elevate their `subscription_plan` to `'enterprise'`, set `subscription_status` to `'active'`, and assign arbitrary `credits_available` or `featured_vacancies_allowance` without payment.
6. **Storage vs RLS Permission Discrepancy for Verified Documents (MEDIUM - P2)**: The storage bucket `profile_documents` is private, and `public.profile_documents` RLS allows approved companies to view records. However, `storage.objects` lacks a company `SELECT` policy, causing client-side signed URL generation to depend entirely on backend/admin intervention.

---

## 2. Migration History & Database Schema Inventory

### Chronological Migration Sequence

The database schema was built and evolved across 19 sequential migration files in `supabase/migrations/`:

| Migration File | Primary Focus | Security & Architecture Significance |
|---|---|---|
| `20260728000000_initial_schema.sql` | Base schema, enums, core tables, triggers, initial RLS | Defines `profiles`, `candidate_profiles`, `company_profiles`, `vacancies`, `applications`, `profile_documents`. |
| `20260731000000_fix_table_grants.sql` | Grants permissions to `anon` and `authenticated` | Grants `ALL` to `authenticated` and `SELECT` to `anon`, making RLS the sole enforcement layer. |
| `20260731000001_company_profile_fields.sql` | Company fields | Adds `address_details` and `operation_hours`. |
| `20260805000000_add_subscriptions.sql` | B2B subscriptions & invoices | Adds `company_invoices` table and subscription fields to `company_profiles`. |
| `20260805000001_document_access_requests.sql` | Document access consent workflow | Adds `document_access_requests` table and candidate document authorization policies. |
| `20260805000002_fix_profile_documents_storage.sql` | Storage configuration | *(Deprecated/Superseded)* Temporarily made `profile_documents` bucket public. |
| `20260808000000_fix_supabase_linter_advisors.sql` | Advisor fixes & performance | Drops public bucket listing, optimizes RLS subqueries using `(select auth.uid())`. |
| `20260812000000_admin_staff_management.sql` | Admin staff metadata | Adds `admin_staff_members` table (`sub_role`, `permissions`, `status`). |
| `20260813000000_technical_support_tickets.sql` | Helpdesk & tickets | Adds `support_tickets` and `support_ticket_messages` tables. |
| `20260814000000_moderation_safety_reports.sql` | Content moderation | Adds `vacancy_reports` table for reporting fraudulent vacancies. |
| `20260814000001_secure_document_verification.sql` | Storage hardening & doc verification | Sets `profile_documents` bucket to `public = false`, sanitizes URLs, hardens verification policies. |
| `20260814093811_harden_profile_privacy.sql` | Identity PII isolation | Creates `candidate_private_profiles` (CURP, RFC, Cédula), creates directory security barrier views, revokes `anon` table grants. |
| `20260815024555_fix_security_definer_views.sql` | View security invoker | Sets `security_invoker = true` on directory views and introduces directory read policies. |
| `20260815030000_fix_auth_role_trigger.sql` | Role trigger handling | *(Superseded)* Handled role assignment from user metadata. |
| `20260815033000_fix_rls_infinite_recursion_profiles.sql` | RLS recursion resolution | Implements `public.is_admin()` and `public.get_user_role()` `SECURITY DEFINER` helper functions. |
| `20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql` | Birth date sync | Syncs `birth_date` from user metadata to `candidate_private_profiles`. |
| `20260815043500_add_certifications_to_candidate_profiles.sql` | Certifications field | Adds `certifications` JSONB column to `candidate_profiles`. |
| `20260815192000_fix_storage_objects_rls_policies.sql` | Storage RLS policies | Re-defines storage policies for `avatars`, `company_assets`, and `profile_documents`. |
| `20260826000000_harden_auth_user_creation_trigger.sql` | Auth trigger hardening | Strips role elevation from signup metadata; strictly forces default to `'candidate'`. |

---

### Complete Table Inventory & RLS Verification

| Table Name | Primary Key | Foreign Keys / References | RLS Status | Policy Count |
|---|---|---|---|---|
| `public.profiles` | `id` (UUID) | `auth.users(id)` ON DELETE CASCADE | **ENABLED** | 5 |
| `public.candidate_profiles` | `id` (UUID) | `public.profiles(id)` ON DELETE CASCADE | **ENABLED** | 6 |
| `public.candidate_private_profiles` | `id` (UUID) | `public.profiles(id)` ON DELETE CASCADE | **ENABLED** | 2 |
| `public.company_profiles` | `id` (UUID) | `public.profiles(id)` ON DELETE CASCADE | **ENABLED** | 3 |
| `public.company_employees` | `id` (UUID) | `company_profiles(id)`, `candidate_profiles(id)` | **ENABLED** | 2 |
| `public.profile_documents` | `id` (UUID) | `public.profiles(id)` ON DELETE CASCADE | **ENABLED** | 6 |
| `public.vacancies` | `id` (UUID) | `company_profiles(id)`, `profiles(id)` | **ENABLED** | 5 |
| `public.applications` | `id` (UUID) | `vacancies(id)`, `candidate_profiles(id)` | **ENABLED** | 3 |
| `public.saved_vacancies` | `id` (UUID) | `candidate_profiles(id)`, `vacancies(id)` | **ENABLED** | 1 |
| `public.notifications` | `id` (UUID) | `public.profiles(id)` ON DELETE CASCADE, `vacancies(id)` | **ENABLED** | 1 |
| `public.company_invoices` | `id` (UUID) | `public.company_profiles(id)` ON DELETE CASCADE | **ENABLED** | 2 |
| `public.document_access_requests` | `id` (UUID) | `profiles(id)`, `applications(id)` | **ENABLED** | 4 |
| `public.admin_staff_members` | `id` (UUID) | `public.profiles(id)` (UNIQUE) ON DELETE CASCADE | **ENABLED** | 1 |
| `public.support_tickets` | `id` (UUID) | `profiles(id)` ON DELETE CASCADE / SET NULL | **ENABLED** | 3 |
| `public.support_ticket_messages` | `id` (UUID) | `support_tickets(id)`, `profiles(id)` | **ENABLED** | 2 |
| `public.vacancy_reports` | `id` (UUID) | `vacancies(id)`, `profiles(id)` | **ENABLED** | 2 |

**Database Views (Public Schema)**:
1. `public.company_directory` (`security_barrier = true`, `security_invoker = true`)
2. `public.candidate_directory` (`security_barrier = true`, `security_invoker = true`)

**Storage Buckets (`storage.buckets`)**:
1. `avatars` (Public: `true`)
2. `company_assets` (Public: `true`)
3. `profile_documents` (Public: `false`)

---

## 3. Detailed RLS Policy Audit & Permissiveness Analysis

Below is the exhaustive matrix of all active RLS policies currently enforcing table access in PostgreSQL:

### 3.1 `public.profiles`
- **`Users read own profile`** (SELECT, authenticated): `USING (id = (select auth.uid()))`
- **`Authenticated view candidate basic profile directory`** (SELECT, authenticated): `USING (role = 'candidate' OR id = (select auth.uid()))`
  - *Risk Assessment*: **OVERLY PERMISSIVE (P1)**. Grants all logged-in candidates and companies direct table-level SELECT access to raw candidate records (`email`, `whatsapp_number`, `full_name`, `location`).
- **`Companies read applicant contact details`** (SELECT, authenticated): `USING (role = 'candidate' AND EXISTS (SELECT 1 FROM applications a JOIN vacancies v ON v.id = a.vacancy_id WHERE a.candidate_id = profiles.id AND (v.company_id = (select auth.uid()) OR v.recruiter_id = (select auth.uid()))))`
  - *Risk Assessment*: Rendered redundant by the broader directory policy above.
- **`Admins manage all profiles`** (ALL, authenticated): `USING (public.is_admin()) WITH CHECK (public.is_admin())`
  - *Risk Assessment*: **UNRESTRICTED ADMIN PRIVILEGE (P0)**. Any admin can modify, promote, or delete any profile.
- **`Users update own profile without role changes`** (UPDATE, authenticated): `USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()) AND (role = public.get_user_role() OR public.is_admin()))`

### 3.2 `public.candidate_profiles`
- **`Candidates can view own profile`** (SELECT, authenticated): `USING ((select auth.uid()) = id)`
- **`Candidates can update own profile`** (UPDATE, authenticated): `USING ((select auth.uid()) = id)`
- **`Candidates can insert own profile`** (INSERT, authenticated): `WITH CHECK ((select auth.uid()) = id)`
- **`Companies view applicants' professional profiles`** (SELECT, authenticated): `USING (EXISTS (SELECT 1 FROM applications a JOIN vacancies v ON v.id = a.vacancy_id WHERE a.candidate_id = candidate_profiles.id AND (v.company_id = (select auth.uid()) OR v.recruiter_id = (select auth.uid()))))`
- **`Authenticated view candidate profiles directory`** (SELECT, authenticated): `USING (true)`
  - *Risk Assessment*: **OVERLY PERMISSIVE (P2)**. Enables any authenticated user to dump the entire candidate talent pool database.
- **`Admins manage candidate profiles`** (ALL, authenticated): `USING (public.is_admin()) WITH CHECK (public.is_admin())`

### 3.3 `public.candidate_private_profiles` (Sensitive PII)
- **`Candidates manage own private identity`** (ALL, authenticated): `USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()))`
- **`Admins manage candidate private identity`** (ALL, authenticated): `USING (public.is_admin()) WITH CHECK (public.is_admin())`
  - *Risk Assessment*: **NO SUB-ROLE ISOLATION (P1)**. Any admin (e.g. `support`, `content_admin`, `ops_admin`) can query all candidate CURPs, RFCs, birth dates, and Cédulas Profesionales.

### 3.4 `public.company_profiles`
- **`Public read company profiles for directory`** (SELECT, public): `USING (true)`
  - *Risk Assessment*: **OVERLY PERMISSIVE (P1)**. Allows anonymous (`anon`) and authenticated callers to query all internal company fields (e.g. `rfc`, `imss_patronal_registry`, `repse_registry`, `legal_rep_name`, `credits_available`, `subscription_status`).
- **`Companies manage own profile`** (ALL, authenticated): `USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()))`
  - *Risk Assessment*: **COMMERCIAL BYPASS (P1)**. No column-level constraint or trigger prevents companies from updating `subscription_plan`, `subscription_status`, `credits_available`, or `featured_vacancies_allowance`.
- **`Admins manage company profiles`** (ALL, authenticated): `USING (public.is_admin()) WITH CHECK (public.is_admin())`

### 3.5 `public.admin_staff_members`
- **`Admins can manage admin staff members`** (ALL, authenticated): `USING (public.is_admin()) WITH CHECK (public.is_admin())`
  - *Risk Assessment*: **CRITICAL VULNERABILITY (P0)**. Permits any admin with `profiles.role = 'admin'` to execute `UPDATE`, `INSERT`, or `DELETE` on all staff records. A low-tier admin can self-escalate to `super_admin` or delete existing `super_admin` records directly via the Supabase client.

### 3.6 `public.profile_documents`
- **`Owners can read own documents`** (SELECT, authenticated): `USING (owner_id = (select auth.uid()))`
- **`Owners can add own pending documents`** (INSERT, authenticated): `WITH CHECK (owner_id = (select auth.uid()) AND status = 'pending')`
- **`Owners can replace own documents as pending`** (UPDATE, authenticated): `USING (owner_id = (select auth.uid())) WITH CHECK (owner_id = (select auth.uid()) AND status = 'pending')`
- **`Owners can delete own documents`** (DELETE, authenticated): `USING (owner_id = (select auth.uid()))`
- **`Admins can manage verification documents`** (ALL, authenticated): `USING (public.is_admin()) WITH CHECK (public.is_admin())`
- **`Authorized companies can view requested candidate documents`** (SELECT, authenticated): `USING (EXISTS (SELECT 1 FROM document_access_requests dar WHERE dar.company_id = (select auth.uid()) AND dar.candidate_id = profile_documents.owner_id AND dar.status = 'approved' AND profile_documents.doc_type::text = ANY (dar.requested_documents)))`

### 3.7 `public.company_invoices`
- **`Companies can view their own invoices`** (SELECT, authenticated): `USING ((select auth.uid()) = company_id)`
- **`Admins can manage all invoices`** (ALL, authenticated): `USING (public.is_admin()) WITH CHECK (public.is_admin())`

### 3.8 `public.document_access_requests`
- **`Companies can create document requests`** (INSERT, authenticated): `WITH CHECK ((select auth.uid()) = company_id)`
- **`Companies can view their document requests`** (SELECT, authenticated): `USING ((select auth.uid()) = company_id)`
- **`Candidates can view their document requests`** (SELECT, authenticated): `USING ((select auth.uid()) = candidate_id)`
- **`Candidates can update their document requests`** (UPDATE, authenticated): `USING ((select auth.uid()) = candidate_id)`

### 3.9 `public.support_tickets` & `public.support_ticket_messages`
- **`Users view own support tickets`** (SELECT): `USING (user_id = (SELECT auth.uid()))`
- **`Users create own support tickets`** (INSERT): `WITH CHECK (user_id = (SELECT auth.uid()))`
- **`Admins manage all support tickets`** (ALL): `USING (public.is_admin()) WITH CHECK (public.is_admin())`
- **`Users view non-internal ticket messages`** (SELECT): `USING (is_internal_note = FALSE AND EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = ticket_id AND support_tickets.user_id = (SELECT auth.uid())))`
- **`Admins manage all support ticket messages`** (ALL): `USING (public.is_admin()) WITH CHECK (public.is_admin())`

### 3.10 `public.vacancy_reports`
- **`Authenticated users create reports`** (INSERT): `WITH CHECK ((SELECT auth.uid()) IS NOT NULL)`
- **`Admins manage all vacancy reports`** (ALL): `USING (public.is_admin()) WITH CHECK (public.is_admin())`

### 3.11 `public.vacancies`, `public.applications`, `public.saved_vacancies`, `public.company_employees`, `public.notifications`
- Properly isolated by `recruiter_id = auth.uid()`, `candidate_id = auth.uid()`, `company_id = auth.uid()`, or `user_id = auth.uid()`.
- Note: `public.vacancies` currently lacks an explicit `Admins manage vacancies` RLS policy, requiring admin operations to rely on the server-side `service_role` admin client.

---

## 4. SQL Functions & Security Definer Audit

### 4.1 `public.is_admin(user_id uuid DEFAULT auth.uid())`
**Definition** (`supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql`):
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
**Forensic Analysis**:
1. **Search Path Security**: Properly specifies `SET search_path = public`, mitigating schema search path hijacking.
2. **Execute Permissions**: Properly revoked from `PUBLIC` and `anon`; granted only to `authenticated`.
3. **Architectural Vulnerability**: Evaluates exclusively `public.profiles.role = 'admin'`. It has **no awareness of `admin_staff_members`**. It does not check:
   - Whether the admin is `status = 'active'` or `status = 'suspended'`.
   - Whether the admin possesses specific permissions in `permissions`.
   - What `sub_role` the admin holds.

### 4.2 `public.get_user_role(user_id uuid DEFAULT auth.uid())`
**Definition** (`supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql`):
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
**Forensic Analysis**:
Used in `profiles` UPDATE RLS check to prevent non-admin users from changing their own `role`. Functions securely for self-update prevention, but inherits the same binary role model limitations.

### 4.3 `public.handle_new_user()` (Trigger Function on `auth.users`)
**Definition** (`supabase/migrations/20260826000000_harden_auth_user_creation_trigger.sql`):
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
  ...
```
**Forensic Analysis**:
1. **Hardened Role Assignment (PASS)**: Strips any attempt to pass `role: 'admin'` or `role: 'super_admin'` via user metadata during public registration. Only `'company'` yields `'company'`; all others default strictly to `'candidate'`.
2. **Admin Role Preservation (PASS)**: `ON CONFLICT DO UPDATE` protects pre-existing `'admin'` profiles from downgrade during metadata sync.
3. **RPC Protection (PASS)**: `REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;` prevents direct PostgREST RPC invocation.

---

## 5. Sensitive PII Access Audit

### 5.1 Candidate PII Field Mapping

| Data Field | Table & Column | Classification | Direct RLS Exposure | Authorized Access Rule |
|---|---|---|---|---|
| **CURP** (18-char Key) | `candidate_private_profiles.curp` | **Confidential PII** | Candidate Owner + Any Admin (`is_admin()`) | Candidate owner, or `verification_admin` with `verify_documents` |
| **RFC** (13-char Tax ID) | `candidate_private_profiles.rfc` | **Confidential PII** | Candidate Owner + Any Admin (`is_admin()`) | Candidate owner, or `verification_admin` with `verify_documents` |
| **Birth Date** | `candidate_private_profiles.birth_date` | **Sensitive PII** | Candidate Owner + Any Admin (`is_admin()`) | Candidate owner, or verified recruiters upon application |
| **Cédula Profesional** | `candidate_private_profiles.cedula_profesional` | **Professional PII** | Candidate Owner + Any Admin (`is_admin()`) | Candidate owner, or `verification_admin` |
| **Identity Documents** (INE, Passport) | `profile_documents` (`doc_type = 'ine_passport'`) | **High-Risk Document** | Candidate Owner + Any Admin + Approved Company | Approved `document_access_requests` |
| **Tax Certificate** (Constancia Fiscal) | `profile_documents` (`doc_type = 'constancia_situacion_fiscal'`) | **Financial/Tax Doc** | Candidate Owner + Any Admin + Approved Company | Approved `document_access_requests` |
| **Candidate Email & WhatsApp** | `profiles.email`, `profiles.whatsapp_number` | **Personal Contact** | **Leaked to ANY Authenticated User** via `profiles` RLS | Should be restricted to approved employers or redacted |
| **Curriculum Vitae / Resume** | `profile_documents` (`doc_type = 'cv'`) | **Professional PII** | Candidate Owner + Any Admin + Approved Company | Vacancy applicants and approved companies |

### 5.2 Forensic Findings on PII Access

#### Finding PII-1: Candidate Contact Info Scraping via `profiles` RLS (Severity: High / P1)
- **Mechanism**: In `supabase/migrations/20260815024555_fix_security_definer_views.sql`, line 28:
  ```sql
  CREATE POLICY "Authenticated view candidate basic profile directory" ON public.profiles
    FOR SELECT TO authenticated USING (role = 'candidate' OR id = (select auth.uid()));
  ```
- **Vulnerability**: Any authenticated user can issue a query against the `profiles` table:
  ```ts
  const { data } = await supabase.from('profiles').select('id, full_name, email, whatsapp_number, location').eq('role', 'candidate');
  ```
  This returns unredacted emails and WhatsApp numbers for all candidates across the platform.
- **Impact**: Mass scraping of candidate personal contact details without job application or consent.

#### Finding PII-2: Unrestricted Admin PII Harvest (Severity: High / P1)
- **Mechanism**: RLS on `candidate_private_profiles` and `profile_documents` relies exclusively on `public.is_admin()`.
- **Vulnerability**: A support agent (`sub_role: 'support'`), a content moderator (`sub_role: 'content_admin'`), or an administrative account with zero document verification permissions can execute:
  ```ts
  const { data: pii } = await supabase.from('candidate_private_profiles').select('*');
  const { data: docs } = await supabase.from('profile_documents').select('*');
  ```
  and harvest the national tax IDs, CURPs, and government IDs of all candidates.

#### Finding PII-3: Company Document Access Consent Flow (PASS / Verified)
- In `public.profile_documents`, policy `"Authorized companies can view requested candidate documents"` enforces that a company can only read candidate documents if:
  1. An entry exists in `document_access_requests` where `company_id = auth.uid()` and `candidate_id = profile_documents.owner_id`.
  2. `status = 'approved'`.
  3. `profile_documents.doc_type::text = ANY (dar.requested_documents)`.
- Companies cannot query `candidate_private_profiles` directly.

---

## 6. Database vs. Application Split-Brain Analysis

### 6.1 The Authorization Topology & Split-Brain Inconsistencies

```
                               ┌──────────────────────────────────────────────────────────┐
                               │                    CLIENT REQUEST                        │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
                            ┌───────────────────────────────┴───────────────────────────────┐
                            ▼                                                               ▼
                 [ Server Action / Route ]                                      [ Direct Supabase API ]
                            │                                                               │
     ┌──────────────────────┴──────────────────────┐                                        │
     ▼                                             ▼                                        │
[ requireAdminAuth() ]                     [ createAdminClient() ]                          │
Checks: profiles.role = 'admin'            Bypasses ALL RLS                                 │
IGNORES: sub_role, status, permissions     (service_role key)                               │
     │                                             │                                        │
     └──────────────────────┬──────────────────────┘                                        │
                            ▼                                                               ▼
             ┌─────────────────────────────────────────────────────────────────────────────────────┐
             │                               DATABASE (PostgreSQL)                                 │
             │                                                                                     │
             │  Row Level Security Policies evaluate: public.is_admin()                            │
             │  Evaluates: profiles.role = 'admin'                                                 │
             │  IGNORES: admin_staff_members.sub_role                                              │
             │  IGNORES: admin_staff_members.status ('suspended', 'inactive')                     │
             │  IGNORES: admin_staff_members.permissions array                                     │
             └─────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Forensic Analysis of the Split-Brain Failures

#### 1. The `status = 'suspended'` Bypass (P0)
- **Description**: When an administrator is suspended via `toggleAdminStaffStatus(adminId, 'suspended')`, the field `admin_staff_members.status` is set to `'suspended'`.
- **Application Behavior**:
  - `src/lib/supabase/proxy.ts` (lines 90–98): Resolves role solely from `profiles.role`. Since `profiles.role` is still `'admin'`, the proxy routes the suspended user to `/dashboard/admin`.
  - `src/lib/auth/require-admin.ts` (lines 35–49): Queries `profiles.role`. Verifies `'admin'` and grants access.
  - Server Actions (`src/app/(dashboard)/dashboard/admin/staff/actions.ts` line 19): `requireAdminAuth()` verifies `profiles.role === 'admin'` and allows execution.
- **Database Behavior**:
  - `public.is_admin()` checks `profiles.role = 'admin'`. Returns `TRUE`.
  - RLS grants full CRUD access on all tables.
- **Result**: Suspended administrators experience **zero revocation of capabilities**. They can manage users, view PII, or execute `toggleAdminStaffStatus(self.id, 'active')` to reactivate themselves.

#### 2. Administrative Sub-Role & Permission Non-Enforcement (P0)
- **Description**: The `admin_staff_members` table maintains `sub_role` (`super_admin`, `ops_admin`, `content_admin`, `verification_admin`, `support`) and `permissions` (`manage_users`, `manage_companies`, `verify_documents`, `manage_vacancies`, `analytics_access`, `system_settings`).
- **Audit Finding**: In all 6 administrative Server Action files (`staff`, `users`, `verifications`, `support`, `reports`, and root `admin/actions.ts`), **there is not a single check against `sub_role` or `permissions`**.
- **Impact**:
  - An admin with sub-role `support` can execute `createAdminStaffMember()` to create a `super_admin`.
  - An admin with sub-role `content_admin` can execute `reviewCompanyVerification()` or `adjustCompanyCredits()`.
  - An admin with no user management permissions can execute `deleteAdminStaffMember()` to delete another administrator.

#### 3. Orphan Admin Profile Insecure Defaults (P1)
- **Description**: In `src/app/(dashboard)/dashboard/admin/staff/actions.ts` (lines 63–72), when `getAdminStaffMembers()` encounters an admin profile with no corresponding row in `admin_staff_members`, it applies the following fallback:
  ```ts
  subRole: (s?.sub_role as AdminSubRole) || "super_admin",
  department: s?.department || "Dirección General",
  permissions: (s?.permissions as AdminPermissionKey[]) || [
    "manage_users",
    "manage_companies",
    "verify_documents",
    "manage_vacancies",
    "analytics_access",
    "system_settings",
  ],
  ```
- **Impact**: Any orphaned admin profile is automatically assigned the highest privilege tier (`super_admin`) with all 6 permissions enabled by default.

#### 4. Commercial Subscription Bypass (P1)
- **Location**: `src/modules/company/actions/settings.ts` (lines 74–133) and `supabase/migrations/20260814093811_harden_profile_privacy.sql` (line 63).
- **Vulnerability**:
  1. `updateSubscriptionPlan(companyId, "enterprise")` mutates `subscription_plan: 'enterprise'` and creates an invoice record with `status: 'paid'` without verifying payment via a payment webhook or gateway.
  2. Even without invoking the Server Action, `company_profiles` RLS allows `FOR ALL` with `USING (id = auth.uid()) WITH CHECK (id = auth.uid())`. An authenticated company user can issue a direct REST `PATCH` request via the Supabase client:
     ```ts
     await supabase
       .from('company_profiles')
       .update({
         subscription_plan: 'enterprise',
         subscription_status: 'active',
         credits_available: 99999,
         featured_vacancies_allowance: 50,
       })
       .eq('id', companyId);
     ```
     RLS evaluates `auth.uid() = id` as `TRUE` and commits the upgrade immediately.

#### 5. Impersonation Session Split-Brain (P2)
- **Location**: `src/lib/auth/impersonation.ts` (lines 53–87).
- **Vulnerability**:
  - Impersonation state is stored in unsigned, unencrypted plaintext cookies (`kanpro_impersonate_user_id`, `kanpro_impersonate_user_role`).
  - An admin can initiate impersonation of another administrator (`targetProfile.role === 'admin'`).
  - **Database Split-Brain**: The browser cookies reflect the impersonated identity, but the Supabase client authenticates using the administrator's original JWT session token. Database operations and RLS evaluate under the admin's `auth.uid()`, creating a desynchronization between what the UI displays and what the database executes.

---

## 7. Adversarial Threat Model & Bypass Matrix

| Scenario / Threat Vector | Actor | Target | Mechanism | Result / Exploitability | Severity |
|---|---|---|---|---|---|
| **A. Self-Elevation to Super Admin** | Support Admin (`sub_role: 'support'`) | `admin_staff_members` | Direct REST API `PATCH` or Server Action `updateAdminStaffMember` | **CONFIRMED VULNERABLE**. Actor can assign `sub_role: 'super_admin'` and all permissions. | **P0** |
| **B. Creation of Arbitrary Super Admin** | Support Admin | `admin_staff_members`, `profiles` | Server Action `createAdminStaffMember` | **CONFIRMED VULNERABLE**. Any admin can create new super admin accounts. | **P0** |
| **C. Deletion of Super Admin / Lockout** | Low-Tier Admin | Super Admin Profile | Server Action `deleteAdminStaffMember` or direct RLS `DELETE` | **CONFIRMED VULNERABLE**. Lower-tier admin can delete the sole super admin, causing executive lockout. | **P0** |
| **D. Suspended Admin Persistence** | Suspended Admin (`status: 'suspended'`) | Entire Admin Dashboard & DB | Direct SDK API / Server Actions | **CONFIRMED VULNERABLE**. Suspended admin retains full root access. | **P0** |
| **E. Candidate Contact PII Scraping** | Any Authenticated User | `public.profiles` | Direct PostgREST `SELECT` on `profiles` | **CONFIRMED VULNERABLE**. Mass harvest of candidate emails and WhatsApp numbers. | **P1** |
| **F. Candidate National PII Extraction** | Support Admin | `candidate_private_profiles` | Direct PostgREST `SELECT` | **CONFIRMED VULNERABLE**. Unrestricted extraction of CURP, RFC, Cédula without document permissions. | **P1** |
| **G. Commercial Subscription Auto-Upgrade** | Company User | `company_profiles` | Direct PostgREST `PATCH` on `company_profiles` | **CONFIRMED VULNERABLE**. Company can upgrade to Enterprise and grant unlimited credits. | **P1** |
| **H. Impersonation of Super Admin** | Low-Tier Admin | Super Admin Profile | `startImpersonating(superAdminId)` | **CONFIRMED VULNERABLE**. Admin can impersonate super admin via cookie setting. | **P2** |
| **I. Unauthenticated Admin Creation via Signup** | Public Anonymous Caller | `auth.users`, `profiles` | `signUp({ data: { role: 'admin' } })` | **BLOCKED / SECURED**. Trigger `handle_new_user()` defaults strictly to candidate. | **PASS** |

---

## 8. Prior Findings Verification Status (F-01 to F-22)

| ID | Prior Audit Finding Description | Forensic Status | Current Code Evidence & Location |
|---|---|---|---|
| **F-01** | Signup metadata role injection to admin | **FIXED** | `20260826000000_harden_auth_user_creation_trigger.sql` lines 28–37. |
| **F-02** | `profiles.role = 'admin'` confers unrestricted root access across all sub-roles | **CONFIRMED** | `is_admin()` in `20260815033000...sql` line 11; `requireAdminAuth()` in `staff/actions.ts` line 25. |
| **F-03** | Low-tier admin can self-escalate to `super_admin` | **CONFIRMED** | `updateAdminStaffMember()` in `staff/actions.ts` line 252; RLS on `admin_staff_members`. |
| **F-04** | Low-tier admin can create new `super_admin` | **CONFIRMED** | `createAdminStaffMember()` in `staff/actions.ts` line 88. |
| **F-05** | Low-tier admin can delete or downgrade a `super_admin` | **CONFIRMED** | `deleteAdminStaffMember()` in `staff/actions.ts` line 330. |
| **F-06** | `status = 'suspended'` does not revoke admin dashboard or RLS access | **CONFIRMED** | `proxy.ts` line 97; `require-admin.ts` line 42; `is_admin()` in SQL. |
| **F-07** | Orphan admin profiles default to `super_admin` with all permissions | **CONFIRMED** | `getAdminStaffMembers()` in `staff/actions.ts` lines 63–72. |
| **F-08** | Direct RLS mutation bypasses Server Action checks on `admin_staff_members` | **CONFIRMED** | `admin_staff_members` RLS policy in `20260815033000...sql` line 84. |
| **F-09** | Direct RLS mutation allows company commercial bypass on `company_profiles` | **CONFIRMED** | `company_profiles` RLS policy in `20260814093811...sql` line 63. |
| **F-10** | `updateSubscriptionPlan` creates paid invoices without payment gateway | **CONFIRMED** | `src/modules/company/actions/settings.ts` lines 100–126. |
| **F-11** | Unsigned plaintext cookies used for impersonation state | **CONFIRMED** | `src/lib/auth/impersonation.ts` lines 56–86. |
| **F-12** | Impersonation allows an admin to target another admin / super admin | **CONFIRMED** | `src/lib/auth/impersonation.ts` line 94. |
| **F-13** | Directory RLS exposes raw candidate emails and phone numbers to authenticated users | **CONFIRMED** | `20260815024555...sql` line 28 (`profiles` RLS). |
| **F-14** | All admins have direct RLS access to `candidate_private_profiles` (CURP, RFC) | **CONFIRMED** | `20260815033000...sql` line 53. |
| **F-15** | All admins have direct RLS access to `profile_documents` and storage | **CONFIRMED** | `20260815033000...sql` line 71; `20260814000001...sql` line 62. |
| **F-16** | Company document access requests workflow enforces candidate consent | **FIXED / SECURE** | `20260814000001...sql` line 48 (`profile_documents` RLS). |
| **F-17** | Private storage bucket prevents anonymous document downloads | **FIXED / SECURE** | `20260814000001...sql` lines 4–6 (`public = false`). |
| **F-18** | Missing covering indexes on foreign keys | **FIXED** | `20260808000000_fix_supabase_linter_advisors.sql` lines 181–192. |
| **F-19** | `SECURITY DEFINER` view lint advisory (Lint 0010) | **FIXED** | `20260815024555...sql` lines 5 & 10 (`security_invoker = true`). |
| **F-20** | `handle_new_user()` public RPC execution risk | **FIXED** | `20260826000000...sql` lines 113–115 (`REVOKE EXECUTE`). |
| **F-21** | Compensatory rollback missing on admin creation failure | **FIXED** | `src/app/(dashboard)/dashboard/admin/staff/actions.ts` lines 238–246. |
| **F-22** | Non-admin users prevented from self-elevating profile role via direct update | **FIXED** | `20260815033000...sql` lines 46–49 (`WITH CHECK (role = get_user_role())`). |

---

## 9. Comprehensive Remediation Recommendations

### 9.1 Database & RLS Layer Hardening (Phase 1)

1. **Granular SQL Helper Function**: Replace `public.is_admin()` with a status- and permission-aware function:
   ```sql
   CREATE OR REPLACE FUNCTION public.is_active_admin(user_id uuid DEFAULT auth.uid())
   RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
     SELECT EXISTS (
       SELECT 1 FROM public.profiles p
       JOIN public.admin_staff_members asm ON asm.profile_id = p.id
       WHERE p.id = COALESCE(user_id, auth.uid())
         AND p.role = 'admin'::public.user_role
         AND asm.status = 'active'
     );
   $$;

   CREATE OR REPLACE FUNCTION public.has_admin_permission(perm_key text, user_id uuid DEFAULT auth.uid())
   RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
     SELECT EXISTS (
       SELECT 1 FROM public.profiles p
       JOIN public.admin_staff_members asm ON asm.profile_id = p.id
       WHERE p.id = COALESCE(user_id, auth.uid())
         AND p.role = 'admin'::public.user_role
         AND asm.status = 'active'
         AND (asm.sub_role = 'super_admin' OR perm_key = ANY(asm.permissions))
     );
   $$;
   ```

2. **Harden `admin_staff_members` RLS**: Restrict mutations on `admin_staff_members` strictly to active `super_admin` users:
   ```sql
   DROP POLICY IF EXISTS "Admins can manage admin staff members" ON public.admin_staff_members;
   CREATE POLICY "Super admins can manage staff" ON public.admin_staff_members
     FOR ALL TO authenticated
     USING (public.has_admin_permission('manage_users'))
     WITH CHECK (public.has_admin_permission('manage_users'));
   ```

3. **Harden `candidate_private_profiles` RLS**: Restrict PII reads to candidate owners and verified document reviewers:
   ```sql
   DROP POLICY IF EXISTS "Admins manage candidate private identity" ON public.candidate_private_profiles;
   CREATE POLICY "Verifiers read candidate private identity" ON public.candidate_private_profiles
     FOR SELECT TO authenticated
     USING (public.has_admin_permission('verify_documents'));
   ```

4. **Remediate Candidate Directory Contact Leak**: Replace the overly permissive `profiles` RLS policy:
   ```sql
   DROP POLICY IF EXISTS "Authenticated view candidate basic profile directory" ON public.profiles;
   -- Profiles should only be readable by self, verified employers of applicant, or active admins.
   -- Anonymous and general discovery must query the security_barrier view candidate_directory.
   ```

5. **Protect Company Subscription & Credits from Direct Manipulation**:
   - Split billing/subscription columns into a dedicated `company_subscriptions` table or use a `BEFORE UPDATE` trigger on `company_profiles` that prevents non-admin users from altering `subscription_plan`, `subscription_status`, `credits_available`, or `featured_vacancies_allowance`.

### 9.2 Application Layer Hardening (Phase 2)

1. **Update `requireAdmin()` and `proxy.ts`**: Join `admin_staff_members` to verify `status === 'active'`. If status is `suspended`, immediately redirect to `/login?error=account_suspended`.
2. **Implement Sub-Role and Permission Guards in Server Actions**:
   - `createAdminStaffMember`, `updateAdminStaffMember`, `deleteAdminStaffMember`: Require `subRole === 'super_admin'` and `manage_users` permission.
   - Prevent any admin from downgrading or deleting the last active `super_admin` (invariance check).
   - `reviewCandidateVerification`, `reviewCompanyVerification`: Require `verify_documents` permission.
   - `adjustCompanyCredits`: Require `manage_companies` permission.
3. **Cryptographically Sign Impersonation Cookies**:
   - Use HMAC-SHA256 signatures on impersonation cookies to prevent client tampering.
   - Disallow impersonating any user with `role === 'admin'`.
4. **Integrate Payment Webhook Verification**:
   - Decouple `updateSubscriptionPlan` from direct client invocation; update subscription status only upon verified Stripe / payment gateway webhook events.
