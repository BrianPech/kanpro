-- Migration: Add RLS policy allowing employees/candidates to sign their own contracts
-- Purely additive and safe: does not modify or delete any existing data

DROP POLICY IF EXISTS "Employees can sign own contracts" ON public.company_contracts;
CREATE POLICY "Employees can sign own contracts" ON public.company_contracts
    FOR UPDATE
    USING (
        candidate_id = (SELECT auth.uid()) OR
        employee_id IN (
            SELECT id FROM public.company_employees WHERE employee_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        candidate_id = (SELECT auth.uid()) OR
        employee_id IN (
            SELECT id FROM public.company_employees WHERE employee_id = (SELECT auth.uid())
        )
    );
