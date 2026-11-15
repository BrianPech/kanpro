-- Migration: 20261117000000_multi_company_rls_complete.sql
-- Description: Complete Multi-Company RLS support across all company-scoped tables
-- Preserves legacy (company_id = auth.uid()) while enabling multi-tenant access via public.user_has_company_access().

-- ============================================================================
-- 1. ESTRUCTURA Y SUCURSALES (company_departments, company_branches)
-- ============================================================================

DROP POLICY IF EXISTS "Companies can manage own departments" ON public.company_departments;
CREATE POLICY "Companies can manage own departments"
  ON public.company_departments
  FOR ALL
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin', 'recruiter'])
  )
  WITH CHECK (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin', 'recruiter'])
  );

DROP POLICY IF EXISTS "Companies manage own branches" ON public.company_branches;
CREATE POLICY "Companies manage own branches"
  ON public.company_branches
  FOR ALL
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

-- ============================================================================
-- 2. INVITACIONES Y RECLUTAMIENTO (invitations, applications, document_access)
-- ============================================================================

DROP POLICY IF EXISTS "Companies can manage own employee invitations" ON public.employee_invitations;
CREATE POLICY "Companies can manage own employee invitations"
  ON public.employee_invitations
  FOR ALL
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Companies can view applications for their vacancies" ON public.applications;
CREATE POLICY "Companies can view applications for their vacancies"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vacancies v
      WHERE v.id = applications.vacancy_id
        AND (
          v.recruiter_id = (SELECT auth.uid()) OR
          v.company_id = (SELECT auth.uid()) OR
          public.user_has_company_access(v.company_id)
        )
    )
  );

DROP POLICY IF EXISTS "Companies can update application status for their vacancies" ON public.applications;
CREATE POLICY "Companies can update application status for their vacancies"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vacancies v
      WHERE v.id = applications.vacancy_id
        AND (
          v.recruiter_id = (SELECT auth.uid()) OR
          v.company_id = (SELECT auth.uid()) OR
          public.user_has_company_access(v.company_id, ARRAY['owner', 'admin', 'recruiter'])
        )
    )
  );

DROP POLICY IF EXISTS "Companies can create document requests" ON public.document_access_requests;
CREATE POLICY "Companies can create document requests"
  ON public.document_access_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin', 'recruiter'])
  );

DROP POLICY IF EXISTS "Companies can view their document requests" ON public.document_access_requests;
CREATE POLICY "Companies can view their document requests"
  ON public.document_access_requests
  FOR SELECT
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id)
  );

DROP POLICY IF EXISTS "Companies can view applicant documents" ON public.profile_documents;
CREATE POLICY "Companies can view applicant documents"
  ON public.profile_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.vacancies v ON v.id = a.vacancy_id
      WHERE a.candidate_id = profile_documents.owner_id
        AND (
          v.company_id = (SELECT auth.uid()) OR
          v.recruiter_id = (SELECT auth.uid()) OR
          public.user_has_company_access(v.company_id)
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.company_employees e
      WHERE e.employee_id = profile_documents.owner_id
        AND (
          e.company_id = (SELECT auth.uid()) OR
          public.user_has_company_access(e.company_id)
        )
    )
  );

DROP POLICY IF EXISTS "Authorized companies can view candidate documents" ON public.profile_documents;
CREATE POLICY "Authorized companies can view candidate documents"
  ON public.profile_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.document_access_requests dar
      WHERE dar.candidate_id = profile_documents.owner_id
        AND dar.status = 'approved'
        AND (
          dar.company_id = (SELECT auth.uid()) OR
          public.user_has_company_access(dar.company_id)
        )
    )
  );

DROP POLICY IF EXISTS "Companies read applicant contact details" ON public.profiles;
CREATE POLICY "Companies read applicant contact details"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.vacancies v ON v.id = a.vacancy_id
      WHERE a.candidate_id = profiles.id
        AND (
          v.company_id = (SELECT auth.uid()) OR
          v.recruiter_id = (SELECT auth.uid()) OR
          public.user_has_company_access(v.company_id)
        )
    )
  );

DROP POLICY IF EXISTS "Companies view applicants' professional profiles" ON public.candidate_profiles;
CREATE POLICY "Companies view applicants' professional profiles"
  ON public.candidate_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.vacancies v ON v.id = a.vacancy_id
      WHERE a.candidate_id = candidate_profiles.id
        AND (
          v.company_id = (SELECT auth.uid()) OR
          v.recruiter_id = (SELECT auth.uid()) OR
          public.user_has_company_access(v.company_id)
        )
    )
  );

-- ============================================================================
-- 3. OPERACIÓN, CONTRATOS, NÓMINA Y CUMPLIMIENTO
-- ============================================================================

DROP POLICY IF EXISTS "Companies can manage own contracts" ON public.company_contracts;
CREATE POLICY "Companies can manage own contracts"
  ON public.company_contracts
  FOR ALL
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Companies can manage own leave requests" ON public.company_leaves;
CREATE POLICY "Companies can manage own leave requests"
  ON public.company_leaves
  FOR ALL
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Companies can manage own attendance records" ON public.company_attendance;
CREATE POLICY "Companies can manage own attendance records"
  ON public.company_attendance
  FOR ALL
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Companies can manage own labor incidents" ON public.company_incidents;
CREATE POLICY "Companies can manage own labor incidents"
  ON public.company_incidents
  FOR ALL
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "company_payrolls_company_access" ON public.company_payrolls;
CREATE POLICY "company_payrolls_company_access"
  ON public.company_payrolls
  FOR ALL
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "company_payroll_items_company_access" ON public.company_payroll_items;
CREATE POLICY "company_payroll_items_company_access"
  ON public.company_payroll_items
  FOR ALL
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Companies can view their own evaluations" ON public.company_evaluations;
CREATE POLICY "Companies can view their own evaluations"
  ON public.company_evaluations
  FOR SELECT
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id)
  );

DROP POLICY IF EXISTS "Companies can insert evaluations" ON public.company_evaluations;
CREATE POLICY "Companies can insert evaluations"
  ON public.company_evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Companies can update their own evaluations" ON public.company_evaluations;
CREATE POLICY "Companies can update their own evaluations"
  ON public.company_evaluations
  FOR UPDATE
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Companies can delete their own evaluations" ON public.company_evaluations;
CREATE POLICY "Companies can delete their own evaluations"
  ON public.company_evaluations
  FOR DELETE
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "company_nom035_company_access" ON public.company_nom035_surveys;
CREATE POLICY "company_nom035_company_access"
  ON public.company_nom035_surveys
  FOR ALL
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Companies can view their own invoices" ON public.company_invoices;
CREATE POLICY "Companies can view their own invoices"
  ON public.company_invoices
  FOR SELECT
  TO authenticated
  USING (
    company_id = (SELECT auth.uid()) OR
    public.user_has_company_access(company_id, ARRAY['owner', 'admin'])
  );
