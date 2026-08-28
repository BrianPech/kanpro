# Handoff Report — Database & Test Harness Explorer

**Milestone**: Preview Survey 3 (Database Schema, Billing Flows & Test Harness)  
**Working Directory**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_survey_3`  
**Target File**: `/Users/brianpech/Developer/Commercial/kanpro/.agents/teamwork_preview_explorer_survey_3/survey_db_test_report.md`  

---

## 1. Observation

1. **PostgreSQL Migrations & Tables (`supabase/migrations/`)**:
   - 19 active migration files exist in `supabase/migrations/` from `20260728000000_initial_schema.sql` to `20260826000000_harden_auth_user_creation_trigger.sql`.
   - Core tables include: `public.profiles`, `public.admin_staff_members`, `public.candidate_profiles`, `public.candidate_private_profiles`, `public.company_profiles`, `public.company_employees`, `public.profile_documents`, `public.vacancies`, `public.applications`, `public.saved_vacancies`, `public.notifications`, `public.company_invoices`, `public.document_access_requests`, `public.support_tickets`, `public.support_ticket_messages`, `public.vacancy_reports`.
   - `public.admin_staff_members` table schema in `20260812000000_admin_staff_management.sql`:
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

2. **SQL Functions & RLS Policies (`20260815033000_fix_rls_infinite_recursion_profiles.sql`)**:
   - `public.is_admin(user_id uuid DEFAULT auth.uid())`:
     ```sql
     CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
     RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
       SELECT EXISTS (
         SELECT 1 FROM public.profiles
         WHERE id = COALESCE(user_id, auth.uid()) AND role = 'admin'::public.user_role
       );
     $$;
     ```
   - RLS policy on `public.admin_staff_members`:
     ```sql
     CREATE POLICY "Admins can manage admin staff members"
       ON public.admin_staff_members FOR ALL TO authenticated
       USING (public.is_admin())
       WITH CHECK (public.is_admin());
     ```
   - RLS policy on `public.company_profiles` (`20260814093811_harden_profile_privacy.sql`):
     ```sql
     CREATE POLICY "Companies manage own profile" ON public.company_profiles
       FOR ALL TO authenticated
       USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));
     ```

3. **Billing Action Vulnerabilities (`src/modules/company/actions/settings.ts`)**:
   - `updateSubscriptionPlan` (lines 74-133):
     ```typescript
     export async function updateSubscriptionPlan(companyId: string, plan: "basic" | "pro" | "enterprise") {
       const supabase = await createClient()
       const { data: { user }, error: authError } = await supabase.auth.getUser()
       if (authError || !user) {
         throw new Error("No autorizado. Inicie sesión para continuar.")
       }
       // ...
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
     ```
   - No check `if (companyId !== user.id)` exists.
   - No payment verification or Stripe webhook validation occurs.

4. **Test Infrastructure & Execution**:
   - Vitest config (`vitest.config.ts`) runs tests with `node` environment, `globals: true`, `@` path alias to `./src`.
   - Running `npx vitest run` yields:
     `Test Files 9 passed (9)`
     `Tests 93 passed (93)`
     `Duration 328ms`

---

## 2. Logic Chain

1. **Flat PostgreSQL RLS "admin = root" Paradox**:
   - Direct Observation: `public.is_admin()` checks ONLY whether `profiles.role = 'admin'`.
   - Direct Observation: All administrative RLS policies across `admin_staff_members`, `candidate_private_profiles`, `company_profiles`, `profile_documents`, `company_invoices`, `support_tickets`, and `vacancy_reports` use `USING (public.is_admin()) WITH CHECK (public.is_admin())`.
   - Invariant Violation: Any authenticated user with `profiles.role = 'admin'` (e.g., `sub_role = 'support'` or `status = 'suspended'`) can issue direct Supabase SDK queries to read PII, delete super admins, or self-promote to `super_admin` by modifying `admin_staff_members`.
   - Conclusion: Defense-in-depth requires PostgreSQL helper functions `public.is_active_admin()`, `public.is_super_admin()`, `public.has_admin_permission()`, and trigger `public.prevent_last_super_admin_removal()`.

2. **Commercial Bypass via RLS & Server Action**:
   - Direct Observation: `company_profiles` has an unrestricted `FOR ALL` policy with `USING (id = auth.uid())`.
   - Direct Observation: `updateSubscriptionPlan` in `settings.ts` does not validate tenant ownership (`companyId === user.id`) or require payment gateway authorization.
   - Invariant Violation: A company can directly set `subscription_plan = 'enterprise'`, `credits_available = 999999`, or call `updateSubscriptionPlan` for another company ID.
   - Conclusion: Must introduce `BEFORE UPDATE` trigger on `company_profiles` protecting commercial fields and enforce `companyId === user.id` in `settings.ts`.

3. **Test Harness Feasibility**:
   - Direct Observation: 93 tests across 9 files pass cleanly with zero modifications.
   - Direct Observation: Vitest configuration and mocking patterns for `@/lib/supabase/server`, `@/lib/supabase/admin`, and `next/headers` allow adding a new 33+ test suite in `src/__tests__/security/defense-in-depth-rbac.test.ts`.
   - Conclusion: New adversarial RBAC test suites can be introduced seamlessly while preserving 100% PASS on the existing 93 tests.

---

## 3. Caveats

- **No Caveats**: All 19 migration files, 16 tables, 2 views, storage policies, billing Server Actions, and test configuration files were read and verified directly from the repository.

---

## 4. Conclusion

The database schema and test infrastructure are completely mapped. Current PostgreSQL RLS and billing actions contain major vulnerabilities (flat admin permissions, suspended admin bypass, commercial self-assignment, and orphan admin elevation). The test harness (Vitest) is fully operational and capable of executing both the existing 93 tests and the planned 33+ adversarial RBAC test suite.

---

## 5. Verification Method

To verify these findings independently:
1. **Run existing test suite**:
   ```bash
   npx vitest run
   ```
   *Expected result*: 9 test files passed, 93 tests passed.

2. **Inspect Migration & RLS definitions**:
   - `supabase/migrations/20260812000000_admin_staff_management.sql` (Line 28)
   - `supabase/migrations/20260815033000_fix_rls_infinite_recursion_profiles.sql` (Lines 4-16, 41-105)
   - `supabase/migrations/20260814093811_harden_profile_privacy.sql` (Lines 29-37, 63-67)

3. **Inspect Billing Actions**:
   - `src/modules/company/actions/settings.ts` (Lines 74-133)
