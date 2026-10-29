-- Migration: 20261027200000_payroll_cfdi_and_evaluations_360.sql
-- Description: Adds CFDI 4.0 timbrado fields to payroll and 360 multi-evaluator / 9-Box fields to evaluations

-- 1. CFDI fields on company_payroll_items
ALTER TABLE public.company_payroll_items
ADD COLUMN IF NOT EXISTS cfdi_uuid text,
ADD COLUMN IF NOT EXISTS cfdi_status text NOT NULL DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS cfdi_xml text,
ADD COLUMN IF NOT EXISTS cfdi_stamp_date timestamptz,
ADD COLUMN IF NOT EXISTS cfdi_sat_seal text,
ADD COLUMN IF NOT EXISTS cfdi_pac_rfc text,
ADD COLUMN IF NOT EXISTS cfdi_qr_code text;

-- Add check constraint for cfdi_status if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_payroll_items_cfdi_status_check'
  ) THEN
    ALTER TABLE public.company_payroll_items
    ADD CONSTRAINT company_payroll_items_cfdi_status_check
    CHECK (cfdi_status IN ('pendiente', 'timbrado', 'error', 'cancelado'));
  END IF;
END $$;

-- 2. Update company_payrolls status check and timbrada_at column
ALTER TABLE public.company_payrolls
ADD COLUMN IF NOT EXISTS timbrada_at timestamptz;

-- Update status check constraint on company_payrolls
ALTER TABLE public.company_payrolls
DROP CONSTRAINT IF EXISTS company_payrolls_status_check;

ALTER TABLE public.company_payrolls
ADD CONSTRAINT company_payrolls_status_check
CHECK (status IN ('borrador', 'calculada', 'pagada', 'timbrada'));

-- Index on cfdi_uuid for quick lookup
CREATE INDEX IF NOT EXISTS idx_company_payroll_items_cfdi_uuid 
ON public.company_payroll_items(cfdi_uuid);

-- 3. Multi-evaluador 360 & 9-Box fields on company_evaluations
ALTER TABLE public.company_evaluations
ADD COLUMN IF NOT EXISTS evaluator_relation text NOT NULL DEFAULT 'jefe_directo',
ADD COLUMN IF NOT EXISTS potential_score numeric(3, 1) NOT NULL DEFAULT 3.0,
ADD COLUMN IF NOT EXISTS nine_box_quadrant text;

-- Check constraint for evaluator_relation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_evaluations_evaluator_relation_check'
  ) THEN
    ALTER TABLE public.company_evaluations
    ADD CONSTRAINT company_evaluations_evaluator_relation_check
    CHECK (evaluator_relation IN ('autoevaluacion', 'jefe_directo', 'par', 'subordinado'));
  END IF;
END $$;

-- Index on company_evaluations for employee & relation
CREATE INDEX IF NOT EXISTS idx_company_evaluations_emp_rel
ON public.company_evaluations(employee_id, evaluator_relation);
