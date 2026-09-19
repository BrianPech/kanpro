-- Migration: 20260919020000_company_payroll.sql
-- Description: Creates payroll periods, items and employee banking columns for K'anPro

-- Helper function for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Add banking details to company_employees if they do not exist
ALTER TABLE public.company_employees
ADD COLUMN IF NOT EXISTS bank_name text DEFAULT 'BBVA México',
ADD COLUMN IF NOT EXISTS clabe_account text;

-- 2. Create company_payrolls table
CREATE TABLE IF NOT EXISTS public.company_payrolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  period_name text NOT NULL,
  period_type text NOT NULL DEFAULT 'quincenal' CHECK (period_type IN ('semanal', 'quincenal', 'mensual')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  payout_date date NOT NULL,
  status text NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'calculada', 'pagada')),
  total_gross numeric(12, 2) NOT NULL DEFAULT 0,
  total_overtime numeric(12, 2) NOT NULL DEFAULT 0,
  total_bonuses numeric(12, 2) NOT NULL DEFAULT 0,
  total_deductions numeric(12, 2) NOT NULL DEFAULT 0,
  total_net numeric(12, 2) NOT NULL DEFAULT 0,
  employees_count integer NOT NULL DEFAULT 0,
  dispersed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying payrolls by company
CREATE INDEX IF NOT EXISTS idx_company_payrolls_company_id ON public.company_payrolls(company_id);
CREATE INDEX IF NOT EXISTS idx_company_payrolls_dates ON public.company_payrolls(start_date, end_date);

-- 3. Create company_payroll_items table
CREATE TABLE IF NOT EXISTS public.company_payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_id uuid NOT NULL REFERENCES public.company_payrolls(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.company_employees(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  job_title text,
  department text,
  base_salary_period numeric(12, 2) NOT NULL DEFAULT 0,
  days_worked numeric(5, 1) NOT NULL DEFAULT 15,
  overtime_hours numeric(6, 2) NOT NULL DEFAULT 0,
  overtime_pay numeric(12, 2) NOT NULL DEFAULT 0,
  punctuality_bonus numeric(12, 2) NOT NULL DEFAULT 0,
  attendance_bonus numeric(12, 2) NOT NULL DEFAULT 0,
  performance_bonus numeric(12, 2) NOT NULL DEFAULT 0,
  unjustified_absences integer NOT NULL DEFAULT 0,
  absence_deductions numeric(12, 2) NOT NULL DEFAULT 0,
  late_arrivals integer NOT NULL DEFAULT 0,
  delay_deductions numeric(12, 2) NOT NULL DEFAULT 0,
  imss_deduction numeric(12, 2) NOT NULL DEFAULT 0,
  isr_estimated numeric(12, 2) NOT NULL DEFAULT 0,
  total_perceptions numeric(12, 2) NOT NULL DEFAULT 0,
  total_deductions numeric(12, 2) NOT NULL DEFAULT 0,
  net_pay numeric(12, 2) NOT NULL DEFAULT 0,
  bank_name text,
  clabe text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_payroll_employee UNIQUE (payroll_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_company_payroll_items_payroll ON public.company_payroll_items(payroll_id);
CREATE INDEX IF NOT EXISTS idx_company_payroll_items_emp ON public.company_payroll_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_company_payroll_items_company ON public.company_payroll_items(company_id);

-- 4. Enable RLS
ALTER TABLE public.company_payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_payroll_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for company_payrolls
DROP POLICY IF EXISTS "company_payrolls_company_access" ON public.company_payrolls;
CREATE POLICY "company_payrolls_company_access"
  ON public.company_payrolls
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- 6. RLS Policies for company_payroll_items
DROP POLICY IF EXISTS "company_payroll_items_company_access" ON public.company_payroll_items;
CREATE POLICY "company_payroll_items_company_access"
  ON public.company_payroll_items
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- Allow employees to view their own payroll receipts
DROP POLICY IF EXISTS "company_payroll_items_employee_read" ON public.company_payroll_items;
CREATE POLICY "company_payroll_items_employee_read"
  ON public.company_payroll_items
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM public.company_employees WHERE employee_id = auth.uid()
    )
  );

-- Trigger for updated_at on company_payrolls
DROP TRIGGER IF EXISTS trigger_company_payrolls_updated_at ON public.company_payrolls;
CREATE TRIGGER trigger_company_payrolls_updated_at
  BEFORE UPDATE ON public.company_payrolls
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Trigger for updated_at on company_payroll_items
DROP TRIGGER IF EXISTS trigger_company_payroll_items_updated_at ON public.company_payroll_items;
CREATE TRIGGER trigger_company_payroll_items_updated_at
  BEFORE UPDATE ON public.company_payroll_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
