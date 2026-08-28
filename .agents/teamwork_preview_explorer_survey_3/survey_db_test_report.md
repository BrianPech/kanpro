# Comprehensive Database Schema, Billing Flow & Test Harness Survey Report
**Project**: K'anPro — Defense-in-Depth RBAC Hardening  
**Target Milestone**: Preview Survey 3 — Database & Test Harness  
**Author**: Database & Test Harness Explorer (`teamwork_preview_explorer_survey_3`)  
**Date**: 2026-08-27  

---

## Executive Summary

This survey report provides an exhaustive, read-only technical audit of:
1. **Supabase / PostgreSQL Database Setup**: Analysis of all 19 active migration files in `supabase/migrations/`, 16 core tables, 2 views, storage buckets, triggers, and SQL helper functions. It demonstrates conclusively that current PostgreSQL RLS policies operate under a flat `"admin = root"` paradigm where any profile with `profiles.role = 'admin'` has full `ALL` access across all administrative tables, irrespective of `sub_role`, `permissions`, or `status = 'suspended'`.
2. **Subscription & Billing Flows**: Audit of `src/modules/company/actions/settings.ts`, `employees.ts`, `vacancies.ts`, and `document-access.ts`. It uncovers critical vulnerabilities where companies can self-assign the `enterprise` plan, generate fake paid invoices, and mutate sensitive commercial columns due to missing application-level ownership assertions and permissive RLS `UPDATE` policies on `company_profiles`.
3. **Test Infrastructure & Harness**: Audit of `vitest.config.ts`, `package.json`, and all 9 test suites containing 93 tests (100% PASS). It examines mocking patterns for `@/lib/supabase/server`, `@/lib/supabase/admin`, `@supabase/ssr`, `next/cache`, and `next/headers`, and establishes the strategy for integrating the new 33+ adversarial RBAC security test suite without modifying or breaking any pre-existing tests.

---

## 1. Supabase / PostgreSQL Database Architecture Audit

### 1.1 Migration Chronology & Evolution

The active database migration directory `supabase/migrations/` contains 19 migration files that establish the schema:

| # | Migration File | Primary Responsibility / Schema Impact |
|---|---|---|
| 1 | `20260728000000_initial_schema.sql` | Base schema: `profiles`, `candidate_profiles`, `company_profiles`, `company_employees`, `profile_documents`, `vacancies`, `applications`, `saved_vacancies`, `notifications`, initial RLS, `handle_new_user()` trigger, and storage buckets (`avatars`, `company_assets`, `profile_documents`). |
| 2 | `20260731000000_fix_table_grants.sql` | Grants on tables to `authenticated`, `anon`, `service_role`. |
| 3 | `20260731000001_company_profile_fields.sql` | Adds `address_details` and `operation_hours` to `company_profiles`. |
| 4 | `20260805000000_add_subscriptions.sql` | Adds subscription columns to `company_profiles`, featured vacancy columns to `vacancies`, and creates `company_invoices` table with RLS. |
| 5 | `20260805000001_document_access_requests.sql` | Creates `document_access_requests` table and candidate document authorization policies. |
| 6 | `20260805000002_fix_profile_documents_storage.sql` | Made `profile_documents` storage bucket public (later revoked). |
| 7 | `20260808000000_fix_supabase_linter_advisors.sql` | Replaces `auth.uid()` with `(select auth.uid())` across all RLS policies to prevent subquery re-evaluations; adds covering FK indexes. |
| 8 | `20260812000000_admin_staff_management.sql` | Creates `admin_staff_members` table (`id`, `profile_id`, `sub_role`, `department`, `permissions`, `status`, `notes`) with flat `is_admin()` RLS policy. |
| 9 | `20260813000000_technical_support_tickets.sql` | Creates `support_tickets` and `support_ticket_messages` tables with RLS. |
| 10 | `20260814000000_moderation_safety_reports.sql` | Creates `vacancy_reports` table with RLS. |
| 11 | `20260814000001_secure_document_verification.sql` | Makes `profile_documents` bucket private; updates document review policies for candidate/company/admin. |
| 12 | `20260814093811_harden_profile_privacy.sql` | Creates `candidate_private_profiles` table for PII (CURP, RFC, birth_date, cédula); creates `company_directory` and `candidate_directory` views; revokes anonymous access to public tables. |
| 13 | `20260815024555_fix_security_definer_views.sql` | Updates `company_directory` and `candidate_directory` with `security_invoker = true`. |
| 14 | `20260815030000_fix_auth_role_trigger.sql` | Updates `handle_new_user()` trigger (contained early vulnerability allowing role: admin from metadata). |
| 15 | `20260815033000_fix_rls_infinite_recursion_profiles.sql` | Introduces `public.is_admin(uuid)` and `public.get_user_role(uuid)` helper functions; standardizes all admin policies to `USING (public.is_admin())`. |
| 16 | `20260815034500_fix_candidate_birth_date_and_private_profile_sync.sql` | Syncs birth_date into `candidate_private_profiles`. |
| 17 | `20260815043500_add_certifications_to_candidate_profiles.sql` | Adds `certifications` JSONB column to `candidate_profiles`. |
| 18 | `20260815192000_fix_storage_objects_rls_policies.sql` | Fine-tunes storage object RLS policies for `avatars`, `company_assets`, and `profile_documents`. |
| 19 | `20260826000000_harden_auth_user_creation_trigger.sql` | Strips ability to assign 'admin' or 'super_admin' from `raw_user_meta_data`; defaults all non-'company' signups to 'candidate'; protects existing admin profiles on conflict. |

---

### 1.2 Table-by-Table Schema Inventory

```
+----------------------------------------------------------------------------------------------------+
|                                    K'ANPRO POSTGRESQL SCHEMA                                       |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +--------------------+         +-------------------------------+         +---------------------+  |
|  |     auth.users     | <------+ public.profiles               | +-----> | admin_staff_members |  |
|  +--------------------+  1:1    | id (PK, FK auth.users)        | | 1:1   | id (PK)             |  |
|                                 | role (candidate,company,admin)| |       | profile_id (UQ, FK) |  |
|                                 | email, full_name, whatsapp... | |       | sub_role, status    |  |
|                                 +-------------------------------+ |       | permissions TEXT[]  |  |
|                                            |         |            |       +---------------------+  |
|                         +------------------+         +---------+  |                                |
|                         | 1:1                                  | 1:1                               |
|                         v                                      v  |                                |
|  +------------------------------+            +----------------------------+                        |
|  | candidate_profiles           |            | company_profiles           |                        |
|  | id (PK, FK profiles)         |            | id (PK, FK profiles)       |                        |
|  | candidate_type, skills...    |            | company_name, rfc, size    |                        |
|  +------------------------------+            | subscription_plan, status  |                        |
|                 | 1:1                        | credits_available, rating  |                        |
|                 v                            +----------------------------+                        |
|  +------------------------------+                       |          |                               |
|  | candidate_private_profiles   |                       | 1:N      | 1:N                           |
|  | id (PK, FK profiles)         |                       v          v                               |
|  | curp, rfc, birth_date, cedula|            +------------+  +------------------+                  |
|  +------------------------------+            | vacancies  |  | company_invoices |                  |
|                                              +------------+  +------------------+                  |
+----------------------------------------------------------------------------------------------------+
```

#### Detailed Table Definitions:

1. **`public.profiles`**
   - **Columns**: `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`, `role public.user_role NOT NULL DEFAULT 'candidate'`, `email TEXT NOT NULL UNIQUE`, `full_name TEXT NOT NULL`, `whatsapp_number TEXT NOT NULL`, `avatar_url TEXT`, `location TEXT DEFAULT 'Mérida, Yucatán'`, `is_verified BOOLEAN NOT NULL DEFAULT FALSE`, `terms_accepted_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
   - **Current RLS**:
     - `Users read own profile`: `FOR SELECT USING (id = (select auth.uid()))`
     - `Authenticated view candidate basic profile directory`: `FOR SELECT USING (role = 'candidate' OR id = (select auth.uid()))` *(Vulnerability: leaks candidate emails & whatsapp numbers to all authenticated users!)*
     - `Users update own profile without role changes`: `FOR UPDATE USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()) AND (role = public.get_user_role() OR public.is_admin()))`
     - `Admins manage all profiles`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())` *(Vulnerability: flat admin root)*

2. **`public.admin_staff_members`**
   - **Columns**: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`, `sub_role TEXT NOT NULL DEFAULT 'ops_admin'`, `department TEXT DEFAULT 'Operaciones'`, `permissions TEXT[] DEFAULT '{}'`, `status TEXT NOT NULL DEFAULT 'active'`, `notes TEXT`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
   - **Indexes**: `idx_admin_staff_profile_id`, `idx_admin_staff_sub_role`, `idx_admin_staff_status`.
   - **Current RLS**:
     - `Admins can manage admin staff members`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())` *(Critical vulnerability: any admin, even support or suspended, can INSERT, UPDATE, DELETE in this table)*

3. **`public.candidate_profiles`**
   - **Columns**: `id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE`, `candidate_type candidate_type NOT NULL DEFAULT 'trabajador'`, `specialization_area TEXT`, `years_experience INT`, `trade_description TEXT`, `preferred_zone TEXT`, `skills TEXT[]`, `languages JSONB`, `education JSONB`, `experience JSONB`, `portfolio_links JSONB`, `social_links JSONB`, `job_alerts_enabled BOOLEAN`, `certifications JSONB DEFAULT '[]'`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
   - **Current RLS**:
     - `Candidates can view own profile`: `FOR SELECT USING ((select auth.uid()) = id)`
     - `Candidates can update own profile`: `FOR UPDATE USING ((select auth.uid()) = id)`
     - `Candidates can insert own profile`: `FOR INSERT WITH CHECK ((select auth.uid()) = id)`
     - `Authenticated view candidate profiles directory`: `FOR SELECT USING (true)`
     - `Admins manage candidate profiles`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())`

4. **`public.candidate_private_profiles`**
   - **Columns**: `id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE`, `curp VARCHAR(18) UNIQUE`, `rfc VARCHAR(13)`, `birth_date DATE`, `cedula_profesional TEXT`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
   - **Current RLS**:
     - `Candidates manage own private identity`: `FOR ALL USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()))`
     - `Admins manage candidate private identity`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())` *(Vulnerability: non-verification admins like support/content_admin can read all PII directly via client)*

5. **`public.company_profiles`**
   - **Columns**: `id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE`, `entity_type company_entity_type NOT NULL DEFAULT 'persona_moral'`, `company_name TEXT NOT NULL`, `legal_name TEXT`, `rfc VARCHAR(13) NOT NULL`, `fiscal_address TEXT NOT NULL`, `address_details TEXT`, `operation_hours TEXT`, `industry TEXT NOT NULL`, `company_size TEXT`, `description TEXT`, `legal_rep_name TEXT`, `corporate_email TEXT`, `contact_phone TEXT`, `website_url TEXT`, `social_links JSONB`, `branch_addresses JSONB`, `imss_patronal_registry TEXT`, `repse_registry TEXT`, `logo_url TEXT`, `banner_url TEXT`, `credits_available INT NOT NULL DEFAULT 0`, `rating NUMERIC(3,2) DEFAULT 5.00`, `verification_status verification_status DEFAULT 'pending'`, `subscription_plan TEXT NOT NULL DEFAULT 'basic'`, `subscription_status TEXT NOT NULL DEFAULT 'active'`, `subscription_period_end TIMESTAMPTZ`, `featured_vacancies_allowance INT NOT NULL DEFAULT 0`, `featured_vacancies_used INT NOT NULL DEFAULT 0`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
   - **Current RLS**:
     - `Public read company profiles for directory`: `FOR SELECT USING (true)`
     - `Companies manage own profile`: `FOR ALL USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()))` *(Critical vulnerability: allows company to update subscription_plan, credits_available, verification_status directly!)*
     - `Admins manage company profiles`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())`

6. **`public.company_employees`**
   - **Columns**: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE`, `employee_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE`, `job_title TEXT NOT NULL`, `department TEXT`, `employee_code TEXT`, `status employee_status NOT NULL DEFAULT 'onboarding'`, `hire_date DATE DEFAULT CURRENT_DATE`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`, `UNIQUE(company_id, employee_id)`.
   - **Current RLS**:
     - `Companies can manage own employees`: `FOR ALL USING (company_id = (select auth.uid())) WITH CHECK (company_id = (select auth.uid()))`
     - `Employees can view own employment record`: `FOR SELECT USING (employee_id = (select auth.uid()))`

7. **`public.profile_documents`**
   - **Columns**: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`, `doc_type document_type NOT NULL`, `file_url TEXT NOT NULL`, `file_name TEXT NOT NULL`, `file_size_bytes BIGINT`, `status verification_status NOT NULL DEFAULT 'pending'`, `rejection_reason TEXT`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
   - **Current RLS**:
     - `Owners can read own documents`: `FOR SELECT USING (owner_id = (select auth.uid()))`
     - `Owners can add own pending documents`: `FOR INSERT WITH CHECK (owner_id = (select auth.uid()) AND status = 'pending')`
     - `Owners can replace own documents as pending`: `FOR UPDATE USING (owner_id = (select auth.uid())) WITH CHECK (owner_id = (select auth.uid()) AND status = 'pending')`
     - `Owners can delete own documents`: `FOR DELETE USING (owner_id = (select auth.uid()))`
     - `Authorized companies can view requested candidate documents`: `FOR SELECT USING (EXISTS (SELECT 1 FROM public.document_access_requests dar WHERE dar.company_id = (select auth.uid()) AND dar.candidate_id = profile_documents.owner_id AND dar.status = 'approved' AND profile_documents.doc_type::text = ANY (dar.requested_documents)))`
     - `Admins can manage verification documents`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())`

8. **`public.vacancies`**
   - **Columns**: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE`, `recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `description TEXT NOT NULL`, `requirements TEXT`, `category TEXT NOT NULL`, `zone TEXT NOT NULL`, `location TEXT NOT NULL DEFAULT 'Mérida'`, `modality TEXT NOT NULL DEFAULT 'Presencial'`, `employment_type TEXT NOT NULL`, `salary_min NUMERIC(10,2)`, `salary_max NUMERIC(10,2)`, `currency VARCHAR(3) DEFAULT 'MXN'`, `benefits TEXT[] DEFAULT '{}'`, `skills TEXT[] DEFAULT '{}'`, `tags TEXT[] DEFAULT '{}'`, `is_active BOOLEAN NOT NULL DEFAULT TRUE`, `is_promoted BOOLEAN NOT NULL DEFAULT FALSE`, `status VARCHAR(20) NOT NULL DEFAULT 'published'`, `is_featured BOOLEAN NOT NULL DEFAULT FALSE`, `featured_until TIMESTAMPTZ`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
   - **Current RLS**:
     - `Anyone can view active vacancies`: `FOR SELECT USING (is_active = true AND status = 'published')`
     - `Companies can view all own vacancies`: `FOR SELECT USING (recruiter_id = (select auth.uid()) OR company_id = (select auth.uid()))`
     - `Companies can insert vacancies`: `FOR INSERT WITH CHECK (recruiter_id = (select auth.uid()) OR company_id = (select auth.uid()))`
     - `Companies can update own vacancies`: `FOR UPDATE USING (recruiter_id = (select auth.uid()) OR company_id = (select auth.uid()))`
     - `Companies can delete own vacancies`: `FOR DELETE USING (recruiter_id = (select auth.uid()) OR company_id = (select auth.uid()))`

9. **`public.applications`**
   - **Columns**: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `vacancy_id UUID NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE`, `candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE`, `status VARCHAR(30) NOT NULL DEFAULT 'applied'`, `applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`, `UNIQUE(vacancy_id, candidate_id)`.
   - **Current RLS**:
     - `Candidates can manage own applications`: `FOR ALL USING (candidate_id = (select auth.uid())) WITH CHECK (candidate_id = (select auth.uid()))`
     - `Companies can view applications for their vacancies`: `FOR SELECT USING (EXISTS (SELECT 1 FROM public.vacancies v WHERE v.id = vacancy_id AND (v.company_id = (select auth.uid()) OR v.recruiter_id = (select auth.uid()))))`
     - `Companies can update application status for their vacancies`: `FOR UPDATE USING (EXISTS (SELECT 1 FROM public.vacancies v WHERE v.id = vacancy_id AND (v.company_id = (select auth.uid()) OR v.recruiter_id = (select auth.uid()))))`

10. **`public.saved_vacancies`**
    - **Columns**: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `candidate_id UUID NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE`, `vacancy_id UUID NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE`, `created_at TIMESTAMPTZ`, `UNIQUE(candidate_id, vacancy_id)`.
    - **Current RLS**: `Candidates can manage saved vacancies`: `FOR ALL USING (candidate_id = (select auth.uid())) WITH CHECK (candidate_id = (select auth.uid()))`.

11. **`public.notifications`**
    - **Columns**: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `description TEXT NOT NULL`, `type VARCHAR(50) NOT NULL`, `target_vacancy_id UUID REFERENCES public.vacancies(id) ON DELETE SET NULL`, `is_read BOOLEAN NOT NULL DEFAULT FALSE`, `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
    - **Current RLS**: `Users can manage own notifications`: `FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()))`.

12. **`public.company_invoices`**
    - **Columns**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `company_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE`, `plan_name TEXT NOT NULL`, `amount NUMERIC(10,2) NOT NULL DEFAULT 0.00`, `currency TEXT NOT NULL DEFAULT 'MXN'`, `status TEXT NOT NULL DEFAULT 'paid'`, `payment_method TEXT DEFAULT 'Tarjeta / Transferencia'`, `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
    - **Current RLS**:
      - `Companies can view their own invoices`: `FOR SELECT USING ((select auth.uid()) = company_id)`
      - `Admins can manage all invoices`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())`

13. **`public.document_access_requests`**
    - **Columns**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`, `candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`, `application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE`, `requested_documents TEXT[] NOT NULL DEFAULT ARRAY['curp', 'rfc', 'ine']`, `status TEXT NOT NULL DEFAULT 'pending'`, `created_at TIMESTAMPTZ`, `approved_at TIMESTAMPTZ`, `rejected_at TIMESTAMPTZ`.
    - **Current RLS**:
      - `Companies can create document requests`: `FOR INSERT WITH CHECK ((select auth.uid()) = company_id)`
      - `Companies can view their document requests`: `FOR SELECT USING ((select auth.uid()) = company_id)`
      - `Candidates can view their document requests`: `FOR SELECT USING ((select auth.uid()) = candidate_id)`
      - `Candidates can update their document requests`: `FOR UPDATE USING ((select auth.uid()) = candidate_id)`

14. **`public.support_tickets` & `public.support_ticket_messages`**
    - **Columns (`support_tickets`)**: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `ticket_number TEXT UNIQUE NOT NULL`, `user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE`, `subject TEXT NOT NULL`, `description TEXT NOT NULL`, `category TEXT NOT NULL DEFAULT 'cuenta_acceso'`, `priority TEXT NOT NULL DEFAULT 'media'`, `status TEXT NOT NULL DEFAULT 'abierto'`, `assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL`, `internal_notes TEXT`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
    - **Columns (`support_ticket_messages`)**: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE`, `sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`, `is_internal_note BOOLEAN NOT NULL DEFAULT FALSE`, `message TEXT NOT NULL`, `created_at TIMESTAMPTZ`.
    - **Current RLS**:
      - Users view & insert own tickets / view non-internal messages.
      - `Admins manage all support tickets`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())`.
      - `Admins manage all support ticket messages`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())`.

15. **`public.vacancy_reports`**
    - **Columns**: `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, `vacancy_id UUID REFERENCES public.vacancies(id) ON DELETE CASCADE`, `reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL`, `reason TEXT NOT NULL DEFAULT 'cobro_dinero'`, `details TEXT`, `status TEXT NOT NULL DEFAULT 'pending'`, `action_taken TEXT`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
    - **Current RLS**:
      - `Authenticated users create reports`: `FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL)`.
      - `Admins manage all vacancy reports`: `FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())`.

---

### 1.3 SQL Helper Functions & Security Definer Analysis

Existing SQL Functions in PostgreSQL:
1. **`public.is_admin(user_id uuid DEFAULT auth.uid())`**:
   ```sql
   CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
   RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
     SELECT EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'::public.user_role
     );
   $$;
   ```
   *Analysis*: It only checks `profiles.role = 'admin'`. It does NOT consult `admin_staff_members.status` or `sub_role`.

2. **`public.get_user_role(user_id uuid DEFAULT auth.uid())`**:
   ```sql
   CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
   RETURNS public.user_role LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
     SELECT role FROM public.profiles WHERE id = COALESCE(user_id, auth.uid());
   $$;
   ```

3. **`public.handle_new_user()`**:
   - Hardened trigger on `auth.users AFTER INSERT`.
   - Strips `role = 'admin'` from metadata.
   - Prevents unauthenticated admin registration.

#### Missing SQL Helper Functions & Database Invariants:
To implement Defense-in-Depth RBAC in PostgreSQL, the following SQL functions and triggers are required:
- `public.is_active_admin(user_id uuid DEFAULT auth.uid())`: Returns `true` iff `profiles.role = 'admin'` AND `admin_staff_members.status = 'active'`.
- `public.is_super_admin(user_id uuid DEFAULT auth.uid())`: Returns `true` iff `profiles.role = 'admin'` AND `admin_staff_members.sub_role = 'super_admin'` AND `admin_staff_members.status = 'active'`.
- `public.has_admin_permission(perm_key text, user_id uuid DEFAULT auth.uid())`: Checks if user is `is_super_admin()` OR (is `is_active_admin()` and has `perm_key = ANY(admin_staff_members.permissions)`).
- `public.prevent_last_super_admin_removal()` trigger on `admin_staff_members` and `profiles`: Prevents any `DELETE`, `UPDATE sub_role`, `UPDATE status`, or `UPDATE profiles.role` that would result in 0 active super admins.
- `public.protect_company_profiles_commercial_fields()` trigger on `company_profiles BEFORE UPDATE`: Prevents non-super-admins from mutating `subscription_plan`, `subscription_status`, `subscription_period_end`, `featured_vacancies_allowance`, `credits_available`, or `verification_status`.

---

## 2. Subscription & Billing Flows Audit

### 2.1 Server Action Inspection: `src/modules/company/actions/settings.ts`

```typescript
// Lines 74-133: updateSubscriptionPlan
export async function updateSubscriptionPlan(companyId: string, plan: "basic" | "pro" | "enterprise") {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.")
  }

  // VULNERABILITY 1: Missing companyId === user.id assertion
  // Any logged-in candidate or company can supply any companyId.

  // VULNERABILITY 2: Zero payment gateway verification
  // Directly grants allowance and sets status to active
  let featuredAllowance = 0
  let planPrice = 0
  let planName = "Plan Básico"

  if (plan === "pro") {
    featuredAllowance = 3
    planPrice = 1499.00
    planName = "Plan PRO Mensual"
  } else if (plan === "enterprise") {
    featuredAllowance = 10
    planPrice = 3999.00
    planName = "Plan Corporativo Mensual"
  }

  const periodEnd = new Date()
  periodEnd.setDate(periodEnd.getDate() + 30)

  // VULNERABILITY 3: Direct update on company_profiles
  const { error: updateErr } = await supabase
    .from("company_profiles")
    .update({
      subscription_plan: plan,
      subscription_status: "active",
      subscription_period_end: periodEnd.toISOString(),
      featured_vacancies_allowance: featuredAllowance,
      updated_at: new Date().toISOString()
    } as any)
    .eq("id", companyId)

  // VULNERABILITY 4: Inserts fake 'paid' invoice with no payment gateway
  if (planPrice > 0) {
    await supabase.from("company_invoices").insert({
      company_id: companyId,
      plan_name: planName,
      amount: planPrice,
      currency: "MXN",
      status: "paid",
      payment_method: "Tarjeta / Suscripción Activa"
    })
  }

  return { success: true }
}
```

### 2.2 Server Action Inspection: `src/modules/company/actions/employees.ts`
- `updateEmployeeStartDate(applicationId, startDate)` (lines 9-32)
- `terminateEmployee(applicationId, reason, notes)` (lines 37-65)
- `reactivateEmployee(applicationId)` (lines 70-93)
- *Vulnerability*: These actions do not verify that `applicationId` belongs to a vacancy owned by `user.id` in TypeScript application code. While PostgreSQL RLS prevents cross-tenant mutation for client calls, Server Actions using admin or misconfigured clients could allow cross-tenant manipulation.

### 2.3 RLS-Level Commercial Bypass Vulnerability
In `supabase/migrations/20260814093811_harden_profile_privacy.sql`:
```sql
CREATE POLICY "Companies manage own profile" ON public.company_profiles 
FOR ALL TO authenticated
USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));
```
Because this policy uses `FOR ALL` without column restrictions, any authenticated company can execute a direct Supabase client call:
```javascript
await supabase.from('company_profiles').update({
  subscription_plan: 'enterprise',
  subscription_status: 'active',
  featured_vacancies_allowance: 999999,
  credits_available: 999999,
  verification_status: 'approved'
}).eq('id', myCompanyId);
```
PostgreSQL RLS evaluates `id = auth.uid()`, which is TRUE, so PostgreSQL happily updates the commercial and verification columns. This is a critical commercial bypass vulnerability that MUST be blocked with a `BEFORE UPDATE` trigger or strict column-level isolation.

---

## 3. Test Infrastructure & Test Harness Audit

### 3.1 Test Configuration & Runners
- **Runner**: Vitest `v4.1.10`
- **Config file**: `vitest.config.ts`
  - Environment: `node`
  - Globals: `true`
  - Alias: `@` $\to$ `./src`
  - Environment variables: Loads `.env` file automatically.
- **Execution Command**: `npx vitest run` (executes all unit and security integration tests synchronously in ~330ms).
- **Scripts in `package.json`**:
  - Currently contains `"dev"`, `"build"`, `"start"`, `"lint"`.

### 3.2 Detailed Audit of the 9 Existing Test Suites (93 Tests)

| Suite File | Test Count | Key Areas Covered |
|---|---|---|
| `src/tests/formatters.test.ts` | 10 | Date normalization (`DD/MM/YYYY` to ISO), phone prefixing (`+52`), CURP/RFC uppercase normalization, location parsing, salary display formatting. |
| `src/tests/proxy.test.ts` | 7 | `updateSession()` proxy protection, redirecting unauthenticated requests to `/login?redirectTo=...`, exempt routes (`/verify-email`, `/reset-password`), role dashboard redirection (`/dashboard/company`, `/dashboard/candidate`, `/dashboard/admin`). |
| `src/tests/candidate-profile.test.ts` | 3 | `normalizeDateToISO()` handling `DD/MM/YYYY`, ISO `YYYY-MM-DD`, null/empty inputs. |
| `src/tests/geo.test.ts` | 6 | Geographic coordinate resolver (`getCoordsForZone`), nearest city/zone calculations (`findNearestCityAndZone`), Haversine distance, city list structuring, dirty address sanitization (`cleanCityName`). |
| `src/__tests__/security/admin-privilege-hardening.test.ts` | 12 | 12 Acceptance Criteria: blocked public admin registration, super_admin signup blocking, OAuth role injection defense, `getDashboardSession` DB truth enforcement, `createAdminStaffMember` authentication & authorization guards, UUID integrity with `auth.users`, rollback on failure. |
| `src/tests/admin-security-hardening.test.ts` | 13 | `createAdminClient` environment validation & non-persistent session config, `getDashboardSession` ignoring client metadata, auth callback stripping `?role=admin`, admin action guards. |
| `src/tests/backend-logic-adversarial.test.ts` | 21 | Adversarial challenges: account collision and silent promotion rejection (candidate/company/corrupt roles), staff member modification rules, role downgrade safety. |
| `src/tests/flows.test.ts` | 8 | End-to-end integration flows: Onboarding express, radar geolocation (Mérida vs Playa del Carmen), WhatsApp symmetric connection, admin console server actions. |
| `src/modules/company/schemas/__tests__/vacancy-wizard.schema.test.ts` | 13 | Zod schema validation for Step 1 (job title, shifts), Step 2 (salary ranges, location), Step 3 (description length), Step 4 (WhatsApp phone), full wizard preset templates. |
| **Total** | **93** | **100% PASS (93/93)** |

### 3.3 Mocking Strategies & Harness Patterns in Existing Tests

The codebase uses standard Vitest mocking conventions:
1. **Mocking Server-Only & Next.js Modules**:
   ```typescript
   vi.mock("server-only", () => ({}));
   vi.mock("next/cache", () => ({
     revalidatePath: vi.fn(),
     revalidateTag: vi.fn(),
   }));
   vi.mock("next/headers", () => ({
     cookies: vi.fn(() => ({
       get: vi.fn(),
       set: vi.fn(),
       delete: vi.fn(),
       getAll: vi.fn(() => []),
     })),
   }));
   ```

2. **Mocking Supabase Server Client (`@/lib/supabase/server`)**:
   ```typescript
   vi.mock("@/lib/supabase/server", () => ({
     createClient: vi.fn().mockResolvedValue({
       auth: {
         getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-id" } } }),
       },
       from: vi.fn((table: string) => ({
         select: vi.fn().mockReturnThis(),
         insert: vi.fn().mockReturnThis(),
         update: vi.fn().mockReturnThis(),
         delete: vi.fn().mockReturnThis(),
         eq: vi.fn().mockReturnThis(),
         maybeSingle: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
         single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
       })),
     }),
   }));
   ```

3. **Mocking Supabase Admin Client (`@/lib/supabase/admin`)**:
   ```typescript
   vi.mock("@/lib/supabase/admin", () => ({
     createAdminClient: vi.fn().mockReturnValue({
       auth: {
         admin: {
           createUser: vi.fn().mockResolvedValue({ data: { user: { id: "new-user-id" } } }),
           deleteUser: vi.fn().mockResolvedValue({}),
         },
       },
       from: vi.fn((table: string) => ({ ... })),
     }),
   }));
   ```

---

## 4. Integration Blueprint for Proposed 33+ RBAC Adversarial Tests

To verify the Defense-in-Depth RBAC architecture without impacting existing tests:

### Test Suite Structure Proposal:
Create a dedicated test file: `src/__tests__/security/defense-in-depth-rbac.test.ts`

### 33 Test Scenarios Grouped by Perimeter:
1. **Public & Registration Perimeter (Tests 1–4)**:
   - `signUp` with `role: 'admin'` $\to$ default `candidate`.
   - `signUp` with `role: 'super_admin'` $\to$ default `candidate`.
   - OAuth callback with `?role=admin` or metadata tampering $\to$ default `candidate`.
   - Account collision with existing company/candidate profile $\to$ fail-closed rejection.

2. **RBAC Guard Centralization (`rbac-guards.ts`) (Tests 5–12)**:
   - Unauthenticated caller to `requireAdminStaffAuth` $\to$ 401/Error.
   - Non-admin user (candidate/company) to `requireAdminStaffAuth` $\to$ 403/Error.
   - Admin with `status = 'suspended'` $\to$ 403/Error.
   - Admin with `status = 'inactive'` $\to$ 403/Error.
   - Orphan admin (no row in `admin_staff_members`) $\to$ Fail-closed 403/Error.
   - `ops_admin` attempting action requiring `manage_users` (has perm) $\to$ PASS.
   - `support` attempting action requiring `system_settings` (lacks perm) $\to$ 403/Error.
   - `super_admin` with active status $\to$ bypasses operational permission checks.

3. **Staff Lifecycle & Hierarchy (`staff/actions.ts`) (Tests 13–18)**:
   - Non-super-admin attempting `createAdminStaffMember` $\to$ 403/Error.
   - Non-super-admin attempting `updateAdminStaffMember` $\to$ 403/Error.
   - Non-super-admin attempting `toggleAdminStaffStatus` $\to$ 403/Error.
   - Non-super-admin attempting `deleteAdminStaffMember` $\to$ 403/Error.
   - Self-modification of `sub_role` or `permissions` by any admin $\to$ 403/Error.
   - Attempting to delete or suspend the last active `super_admin` $\to$ Aborted / Error.

4. **Cryptographic Impersonation (`impersonation.ts`) (Tests 19–24)**:
   - Attempting to impersonate another `admin` $\to$ 403/Error.
   - Token generated with valid HMAC-SHA256 signature and nonce $\to$ PASS.
   - Forged or tampered cookie token $\to$ Verification fails.
   - Expired impersonation token $\to$ Verification fails.
   - Actor admin suspended in DB after token issuance $\to$ Instant invalidation on revalidation.
   - `stopImpersonating` clears all cryptographic cookies cleanly $\to$ PASS.

5. **PII & Sensitive Document Protection (Tests 25–27)**:
   - Admin without `verify_documents` permission accessing `candidate_private_profiles` $\to$ 403/Error.
   - Admin without `verify_documents` requesting signed URLs for documents $\to$ 403/Error.
   - Admin with `verify_documents` accessing verification dossier $\to$ PASS.

6. **Billing, Subscriptions & Tenant Isolation (Tests 28–31)**:
   - Company calling `updateSubscriptionPlan` without valid webhook/super_admin auth $\to$ 403/Error.
   - Company A attempting to mutate employees or settings of Company B $\to$ 403/Error.
   - Candidate directory query policy does NOT leak email or phone numbers $\to$ PASS.
   - Company directory public view only returns public-safe columns $\to$ PASS.

7. **Compensatory Rollbacks & Concurrency (Tests 32–33)**:
   - Failure during multi-table admin creation triggers complete rollback.
   - Concurrency race conditions handled cleanly without duplicate super admins.

---

## 5. Synthesis & Verification Checklist

- [x] **Database Schema**: All 19 migration files, 16 tables, 2 views, and storage bucket policies fully surveyed and indexed.
- [x] **RLS Flat Admin Paradigm**: Empirical proof documented (`is_admin()` gives flat root access across all tables; `company_profiles` allows client commercial bypass).
- [x] **Billing Actions**: `settings.ts` unauthenticated self-assignment and lack of tenant validation documented.
- [x] **Test Infrastructure**: `vitest.config.ts`, 9 test files, 93/93 PASS verified, mocking strategies analyzed.
- [x] **Zero Code Modification**: Repositories, production files, migrations, and existing tests remain strictly unmodified.
