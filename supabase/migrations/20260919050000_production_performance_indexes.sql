-- 1. Covering indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_company_contracts_application_id ON public.company_contracts(application_id);
CREATE INDEX IF NOT EXISTS idx_company_evaluations_evaluator_id ON public.company_evaluations(evaluator_id);

-- 2. Optimize search_path and security on functions
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_candidate_contact') THEN
    ALTER FUNCTION public.notify_candidate_contact(uuid, text, text) SET search_path = public, pg_temp;
    REVOKE EXECUTE ON FUNCTION public.notify_candidate_contact(uuid, text, text) FROM anon;
  END IF;
END $$;

-- 3. Optimize RLS init_plan on company_leaves
DROP POLICY IF EXISTS "Companies can manage own leave requests" ON public.company_leaves;
CREATE POLICY "Companies can manage own leave requests"
ON public.company_leaves
FOR ALL
TO authenticated
USING (company_id = (SELECT auth.uid()))
WITH CHECK (company_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Employees can view own leave requests" ON public.company_leaves;
CREATE POLICY "Employees can view own leave requests"
ON public.company_leaves
FOR SELECT
TO authenticated
USING (employee_id IN (
  SELECT id FROM public.company_employees WHERE employee_id = (SELECT auth.uid())
));

DROP POLICY IF EXISTS "Employees can insert own leave requests" ON public.company_leaves;
CREATE POLICY "Employees can insert own leave requests"
ON public.company_leaves
FOR INSERT
TO authenticated
WITH CHECK (employee_id IN (
  SELECT id FROM public.company_employees WHERE employee_id = (SELECT auth.uid())
));
