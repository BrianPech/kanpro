-- ============================================================================
-- Migration: 20260808000000_fix_supabase_linter_advisors.sql
-- Fix Supabase Advisor warnings (security & performance):
-- 1. Remove public bucket listing policy to prevent object enumeration (public_bucket_allows_listing)
-- 2. Optimize RLS Policies using (select auth.uid()) to avoid subquery re-evaluations (auth_rls_initplan)
-- 3. Add covering indexes for foreign key constraints (unindexed_foreign_keys)
-- ============================================================================

-- 1. Security: Remove public bucket listing policy on storage.objects
DROP POLICY IF EXISTS "Public Read Profile Documents Storage" ON storage.objects;

-- 2. Performance: Optimize RLS Policies using (select auth.uid())

-- public.profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);

-- public.candidate_profiles
DROP POLICY IF EXISTS "Candidates can view own profile" ON public.candidate_profiles;
CREATE POLICY "Candidates can view own profile" ON public.candidate_profiles FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Candidates can update own profile" ON public.candidate_profiles;
CREATE POLICY "Candidates can update own profile" ON public.candidate_profiles FOR UPDATE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Candidates can insert own profile" ON public.candidate_profiles;
CREATE POLICY "Candidates can insert own profile" ON public.candidate_profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Companies can view candidate profiles" ON public.candidate_profiles;
CREATE POLICY "Companies can view candidate profiles" ON public.candidate_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'company')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
);

-- public.company_profiles
DROP POLICY IF EXISTS "Companies can update own profile" ON public.company_profiles;
CREATE POLICY "Companies can update own profile" ON public.company_profiles FOR UPDATE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Companies can insert own profile" ON public.company_profiles;
CREATE POLICY "Companies can insert own profile" ON public.company_profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- public.company_employees
DROP POLICY IF EXISTS "Companies can manage own employees" ON public.company_employees;
CREATE POLICY "Companies can manage own employees" ON public.company_employees FOR ALL
  USING (company_id = (select auth.uid()))
  WITH CHECK (company_id = (select auth.uid()));

DROP POLICY IF EXISTS "Employees can view own employment record" ON public.company_employees;
CREATE POLICY "Employees can view own employment record" ON public.company_employees FOR SELECT USING (employee_id = (select auth.uid()));

-- public.vacancies
DROP POLICY IF EXISTS "Companies can view all own vacancies" ON public.vacancies;
CREATE POLICY "Companies can view all own vacancies" ON public.vacancies FOR SELECT USING (recruiter_id = (select auth.uid()) OR company_id = (select auth.uid()));

DROP POLICY IF EXISTS "Companies can insert vacancies" ON public.vacancies;
CREATE POLICY "Companies can insert vacancies" ON public.vacancies FOR INSERT WITH CHECK (recruiter_id = (select auth.uid()) OR company_id = (select auth.uid()));

DROP POLICY IF EXISTS "Companies can update own vacancies" ON public.vacancies;
CREATE POLICY "Companies can update own vacancies" ON public.vacancies FOR UPDATE USING (recruiter_id = (select auth.uid()) OR company_id = (select auth.uid()));

DROP POLICY IF EXISTS "Companies can delete own vacancies" ON public.vacancies;
CREATE POLICY "Companies can delete own vacancies" ON public.vacancies FOR DELETE USING (recruiter_id = (select auth.uid()) OR company_id = (select auth.uid()));

-- public.applications
DROP POLICY IF EXISTS "Candidates can manage own applications" ON public.applications;
CREATE POLICY "Candidates can manage own applications" ON public.applications FOR ALL
  USING (candidate_id = (select auth.uid()))
  WITH CHECK (candidate_id = (select auth.uid()));

DROP POLICY IF EXISTS "Companies can view applications for their vacancies" ON public.applications;
CREATE POLICY "Companies can view applications for their vacancies" ON public.applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.vacancies v
    WHERE v.id = vacancy_id AND (v.company_id = (select auth.uid()) OR v.recruiter_id = (select auth.uid()))
  )
);

DROP POLICY IF EXISTS "Companies can update application status for their vacancies" ON public.applications;
CREATE POLICY "Companies can update application status for their vacancies" ON public.applications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.vacancies v
    WHERE v.id = vacancy_id AND (v.company_id = (select auth.uid()) OR v.recruiter_id = (select auth.uid()))
  )
);

-- public.saved_vacancies
DROP POLICY IF EXISTS "Candidates can manage saved vacancies" ON public.saved_vacancies;
CREATE POLICY "Candidates can manage saved vacancies" ON public.saved_vacancies FOR ALL
  USING (candidate_id = (select auth.uid()))
  WITH CHECK (candidate_id = (select auth.uid()));

-- public.notifications
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- public.profile_documents
DROP POLICY IF EXISTS "Users can manage own documents" ON public.profile_documents;
CREATE POLICY "Users can manage own documents" ON public.profile_documents FOR ALL
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Companies can view applicant documents" ON public.profile_documents;
CREATE POLICY "Companies can view applicant documents" ON public.profile_documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.vacancies v ON v.id = a.vacancy_id
    WHERE a.candidate_id = profile_documents.owner_id
    AND (v.company_id = (select auth.uid()) OR v.recruiter_id = (select auth.uid()))
  )
  OR EXISTS (
    SELECT 1 FROM public.company_employees e
    WHERE e.employee_id = profile_documents.owner_id
    AND e.company_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Authorized companies can view candidate documents" ON public.profile_documents;
CREATE POLICY "Authorized companies can view candidate documents" ON public.profile_documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.document_access_requests dar
    WHERE dar.company_id = (select auth.uid())
    AND dar.candidate_id = profile_documents.owner_id
    AND dar.status = 'approved'
  )
);

-- public.company_invoices
DROP POLICY IF EXISTS "Companies can view their own invoices" ON public.company_invoices;
CREATE POLICY "Companies can view their own invoices" ON public.company_invoices FOR SELECT USING ((select auth.uid()) = company_id);

DROP POLICY IF EXISTS "Admins can manage all invoices" ON public.company_invoices;
CREATE POLICY "Admins can manage all invoices" ON public.company_invoices FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
  )
);

-- public.document_access_requests
DROP POLICY IF EXISTS "Companies can create document requests" ON public.document_access_requests;
CREATE POLICY "Companies can create document requests" ON public.document_access_requests FOR INSERT WITH CHECK ((select auth.uid()) = company_id);

DROP POLICY IF EXISTS "Companies can view their document requests" ON public.document_access_requests;
CREATE POLICY "Companies can view their document requests" ON public.document_access_requests FOR SELECT USING ((select auth.uid()) = company_id);

DROP POLICY IF EXISTS "Candidates can view their document requests" ON public.document_access_requests;
CREATE POLICY "Candidates can view their document requests" ON public.document_access_requests FOR SELECT USING ((select auth.uid()) = candidate_id);

DROP POLICY IF EXISTS "Candidates can update their document requests" ON public.document_access_requests;
CREATE POLICY "Candidates can update their document requests" ON public.document_access_requests FOR UPDATE USING ((select auth.uid()) = candidate_id);

-- storage.objects policies
DROP POLICY IF EXISTS "Users Upload Own Avatar" ON storage.objects;
CREATE POLICY "Users Upload Own Avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users Update Own Avatar" ON storage.objects;
CREATE POLICY "Users Update Own Avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users Delete Own Avatar" ON storage.objects;
CREATE POLICY "Users Delete Own Avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Companies Upload Assets" ON storage.objects;
CREATE POLICY "Companies Upload Assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company_assets' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Companies Update Assets" ON storage.objects;
CREATE POLICY "Companies Update Assets" ON storage.objects FOR UPDATE USING (bucket_id = 'company_assets' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Companies Delete Assets" ON storage.objects;
CREATE POLICY "Companies Delete Assets" ON storage.objects FOR DELETE USING (bucket_id = 'company_assets' AND (select auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users Manage Own Profile Documents Storage" ON storage.objects;
CREATE POLICY "Users Manage Own Profile Documents Storage" ON storage.objects FOR ALL
  USING (bucket_id = 'profile_documents' AND (select auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'profile_documents' AND (select auth.uid())::text = (storage.foldername(name))[1]);

-- 3. Performance: Add covering indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON public.applications (candidate_id);
CREATE INDEX IF NOT EXISTS idx_company_employees_employee_id ON public.company_employees (employee_id);
CREATE INDEX IF NOT EXISTS idx_company_invoices_company_id ON public.company_invoices (company_id);
CREATE INDEX IF NOT EXISTS idx_document_access_requests_application_id ON public.document_access_requests (application_id);
CREATE INDEX IF NOT EXISTS idx_document_access_requests_candidate_id ON public.document_access_requests (candidate_id);
CREATE INDEX IF NOT EXISTS idx_document_access_requests_company_id ON public.document_access_requests (company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_vacancy_id ON public.notifications (target_vacancy_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_vacancies_vacancy_id ON public.saved_vacancies (vacancy_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_company_id ON public.vacancies (company_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_recruiter_id ON public.vacancies (recruiter_id);
