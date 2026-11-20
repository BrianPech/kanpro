-- Migration: 20261120230000_company_leaves_allow_visto_bueno.sql
-- Description: company_leaves.status solo admitía ('pendiente','aprobada','rechazada').
-- La aprobación en 2 pasos (TwoStepApproval) requiere el estatus intermedio 'visto_bueno'.

DO $$
DECLARE
  c text;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.company_leaves'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.company_leaves DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

ALTER TABLE public.company_leaves
  ADD CONSTRAINT company_leaves_status_check
  CHECK (status IN ('pendiente', 'visto_bueno', 'aprobada', 'rechazada'));
