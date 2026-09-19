-- ============================================================================
-- K'anPro Migration: 20260908000000_early_access_company_employees.sql
-- Purpose: Enable direct workforce registration for Early Access Canary HR suite
-- ============================================================================

-- 1. Allow employee_id to be NULL for direct workforce without platform accounts
ALTER TABLE public.company_employees ALTER COLUMN employee_id DROP NOT NULL;

-- 2. Drop the rigid unique constraint
ALTER TABLE public.company_employees DROP CONSTRAINT IF EXISTS company_employees_company_id_employee_id_key;

-- 3. Add partial unique index for candidate-linked records
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_employees_company_candidate 
ON public.company_employees (company_id, employee_id) 
WHERE employee_id IS NOT NULL;

-- 4. Add direct workforce profile fields
ALTER TABLE public.company_employees
  ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS base_salary_monthly NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_frequency TEXT DEFAULT 'quincenal',
  ADD COLUMN IF NOT EXISTS rfc TEXT,
  ADD COLUMN IF NOT EXISTS curp TEXT,
  ADD COLUMN IF NOT EXISTS nss TEXT,
  ADD COLUMN IF NOT EXISTS work_schedule TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS termination_reason TEXT,
  ADD COLUMN IF NOT EXISTS termination_date DATE;

-- 5. Set default status to 'active' for direct employees
ALTER TABLE public.company_employees ALTER COLUMN status SET DEFAULT 'active'::employee_status;

-- 6. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_company_employees_company_created 
ON public.company_employees (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_company_employees_status 
ON public.company_employees (company_id, status);
