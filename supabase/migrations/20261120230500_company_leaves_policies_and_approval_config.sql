-- Migration: 20261120230500_company_leaves_policies_and_approval_config.sql
-- Description: Semana 2 / Parte 3B.
--   1. Amplía company_leaves.request_type con 'dias_economicos' y 'matrimonio'.
--   2. Agrega company_profiles.leave_approval_config (jsonb) para configurar modo de aprobación ('single_step' | 'two_step') y políticas especiales.

DO $$
DECLARE
  c text;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.company_leaves'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%request_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.company_leaves DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

ALTER TABLE public.company_leaves
  ADD CONSTRAINT company_leaves_request_type_check
  CHECK (
    request_type IN (
      'vacaciones',
      'permiso_con_goce',
      'permiso_sin_goce',
      'dias_economicos',
      'matrimonio',
      'paternidad',
      'maternidad',
      'luto'
    )
  );

-- Forma: {"approvalMode": "single_step" | "two_step"}. NULL = 'single_step'.
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS leave_approval_config jsonb;
