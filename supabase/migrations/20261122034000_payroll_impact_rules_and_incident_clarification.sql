-- Migration: 20261122034000_payroll_impact_rules_and_incident_clarification.sql
-- Description: Bloqueante B3 (puntos 1 y 3):
--   1. Amplía company_incidents.status con 'por_aclarar' y agrega clarification_deadline.
--   2. Agrega función expire_overdue_clarification_incidents para transicionar incidencias vencidas a falta injustificada aplicada.
--   3. Valida estructura objeto jsonb en company_profiles.payroll_impact_config.
--   4. Permite medios días (0.5) en company_payroll_items.unjustified_absences.

-- 1. Estado 'por_aclarar' y fecha límite de justificante en company_incidents -
DO $$
DECLARE
  c text;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.company_incidents'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.company_incidents DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

ALTER TABLE public.company_incidents
  ADD CONSTRAINT company_incidents_status_check
  CHECK (status IN ('pendiente', 'por_aclarar', 'en_revision', 'aprobado', 'rechazado', 'resuelto'));

ALTER TABLE public.company_incidents
  ADD COLUMN IF NOT EXISTS clarification_deadline timestamptz;

CREATE INDEX IF NOT EXISTS idx_company_incidents_clarification_due
  ON public.company_incidents (company_id, clarification_deadline)
  WHERE status = 'por_aclarar' AND clarification_deadline IS NOT NULL;

-- 2. Transición automática al vencer la ventana de aclaración -----------------
CREATE OR REPLACE FUNCTION public.expire_overdue_clarification_incidents(
  p_company_id uuid
)
RETURNS SETOF public.company_incidents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'ID de empresa requerido.';
  END IF;

  IF NOT (
    p_company_id = (SELECT auth.uid())
    OR public.user_has_company_access(p_company_id, ARRAY['owner', 'admin'])
  ) THEN
    RAISE EXCEPTION 'No autorizado para operar incidencias de esta empresa.';
  END IF;

  RETURN QUERY
  UPDATE public.company_incidents i
  SET
    category = CASE
      WHEN i.category = 'retardo' THEN 'retardo'
      ELSE 'falta_injustificada'
    END,
    category_label = CASE
      WHEN i.category = 'retardo' THEN COALESCE(i.category_label, 'Retardo de Turno')
      ELSE 'Falta Injustificada'
    END,
    status = 'aprobado',
    resolution_notes = CASE
      WHEN i.resolution_notes IS NULL OR btrim(i.resolution_notes) = '' THEN
        CASE
          WHEN i.category = 'retardo' THEN 'Plazo de aclaración vencido sin justificante; retardo aplicado automáticamente.'
          ELSE 'Plazo de aclaración vencido sin justificante; marcada automáticamente como falta injustificada.'
        END
      ELSE i.resolution_notes
    END,
    updated_at = now()
  WHERE i.company_id = p_company_id
    AND i.status = 'por_aclarar'
    AND i.clarification_deadline IS NOT NULL
    AND i.clarification_deadline <= now()
  RETURNING i.*;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_overdue_clarification_incidents(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_overdue_clarification_incidents(uuid) TO authenticated;

-- 3. Configuración ampliada de impacto en nómina ------------------------------
ALTER TABLE public.company_profiles
  DROP CONSTRAINT IF EXISTS company_profiles_payroll_impact_config_object;

ALTER TABLE public.company_profiles
  ADD CONSTRAINT company_profiles_payroll_impact_config_object
  CHECK (payroll_impact_config IS NULL OR jsonb_typeof(payroll_impact_config) = 'object');

COMMENT ON COLUMN public.company_profiles.payroll_impact_config IS
  'Reglas de negocio por empresa: {"delaysPerAbsence":3,"delayDeductionDays":1|0.5,"toleranceMinutes":15,"resetPeriod":"semanal"|"catorcenal"|"quincenal"|"mensual","seventhDayMode":"completo"|"proporcional"|"ninguno","clarificationWindowDays":3,"scope":{"uniformTolerance":true,"jobTitles":[],"shifts":[],"branches":[]},"recognitionBonusDays":1,"effectiveFrom":"YYYY-MM-DD"|null}. NULL = defaults.';

-- 4. Soportar equivalentes fraccionarios (0.5 día) en company_payroll_items ---
ALTER TABLE public.company_payroll_items
  ALTER COLUMN unjustified_absences TYPE numeric(5, 1)
  USING unjustified_absences::numeric(5, 1);
