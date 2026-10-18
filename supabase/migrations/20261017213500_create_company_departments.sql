-- Migration: 20261017213500_create_company_departments.sql
-- Description: Creates company_departments table for custom company areas and departments management.

CREATE TABLE IF NOT EXISTS public.company_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#6366f1',
  manager_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_company_department_name UNIQUE (company_id, name)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_company_departments_company ON public.company_departments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_departments_active ON public.company_departments(company_id, is_active);

-- Enable RLS
ALTER TABLE public.company_departments ENABLE ROW LEVEL SECURITY;

-- 1. Companies can manage their own departments
DROP POLICY IF EXISTS "Companies can manage own departments" ON public.company_departments;
CREATE POLICY "Companies can manage own departments"
  ON public.company_departments
  FOR ALL
  TO authenticated
  USING (company_id = (select auth.uid()))
  WITH CHECK (company_id = (select auth.uid()));

-- 2. Employees of this company can view departments
DROP POLICY IF EXISTS "Employees can view their company departments" ON public.company_departments;
CREATE POLICY "Employees can view their company departments"
  ON public.company_departments
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.company_employees
      WHERE employee_id = (select auth.uid())
         OR email = (SELECT email FROM public.profiles WHERE id = (select auth.uid()))
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_departments TO authenticated;
