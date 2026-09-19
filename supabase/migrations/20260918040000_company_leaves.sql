-- Migration: 20260918040000_company_leaves.sql
-- Description: Creates company_leaves table for LFT (Art. 76) vacation and leave requests between employees/candidates and companies.

CREATE TABLE IF NOT EXISTS public.company_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.company_employees(id) ON DELETE SET NULL,
  candidate_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  request_type text NOT NULL CHECK (
    request_type IN ('vacaciones', 'permiso_con_goce', 'permiso_sin_goce', 'paternidad', 'maternidad', 'luto')
  ),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_working_days integer NOT NULL CHECK (total_working_days > 0),
  reason text,
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),
  reviewed_at timestamptz,
  reviewed_by text,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_leave_dates CHECK (end_date >= start_date)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_company_leaves_company_id ON public.company_leaves(company_id);
CREATE INDEX IF NOT EXISTS idx_company_leaves_employee_id ON public.company_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_company_leaves_candidate_id ON public.company_leaves(candidate_id);
CREATE INDEX IF NOT EXISTS idx_company_leaves_status ON public.company_leaves(status);
CREATE INDEX IF NOT EXISTS idx_company_leaves_dates ON public.company_leaves(start_date, end_date);

-- Enable RLS
ALTER TABLE public.company_leaves ENABLE ROW LEVEL SECURITY;

-- 1. Companies can view, insert, update, delete their own leave requests
CREATE POLICY "Companies can manage own leave requests"
  ON public.company_leaves
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- 2. Employees / Candidates can view their own leave requests
CREATE POLICY "Employees can view own leave requests"
  ON public.company_leaves
  FOR SELECT
  TO authenticated
  USING (
    candidate_id = auth.uid() OR
    employee_id IN (
      SELECT id FROM public.company_employees
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
         OR employee_id = auth.uid()
    )
  );

-- 3. Employees / Candidates can create their own leave requests
CREATE POLICY "Employees can insert own leave requests"
  ON public.company_leaves
  FOR INSERT
  TO authenticated
  WITH CHECK (
    candidate_id = auth.uid()
  );
