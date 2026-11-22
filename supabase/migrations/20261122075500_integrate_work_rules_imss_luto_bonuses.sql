-- Migration: 20261122075500_integrate_work_rules_imss_luto_bonuses.sql
-- Description: Bloque 1 / Paso 0 de integración de Reglas de mi empresa:
--   1. Agrega folio_imss, dias_amparados, ramo_imss y complemento_empresa a company_incidents.
--   2. Agrega early_departure_minutes a company_attendance.
--   3. Agrega incident_id + índice y tipo 'incapacidad_imss' a company_leaves.
--   4. Backfill de bonos 5 % (punctualityBonus y attendanceBonus) a company_profiles existentes.

-- 1. Columnas IMSS en company_incidents -------------------------------------
ALTER TABLE public.company_incidents
  ADD COLUMN IF NOT EXISTS folio_imss text,
  ADD COLUMN IF NOT EXISTS dias_amparados integer,
  ADD COLUMN IF NOT EXISTS ramo_imss text,
  ADD COLUMN IF NOT EXISTS complemento_empresa numeric(10, 2);

ALTER TABLE public.company_incidents
  DROP CONSTRAINT IF EXISTS company_incidents_dias_amparados_check,
  DROP CONSTRAINT IF EXISTS company_incidents_ramo_imss_check,
  DROP CONSTRAINT IF EXISTS company_incidents_complemento_empresa_check;

ALTER TABLE public.company_incidents
  ADD CONSTRAINT company_incidents_dias_amparados_check
    CHECK (dias_amparados IS NULL OR (dias_amparados >= 1 AND dias_amparados <= 365)),
  ADD CONSTRAINT company_incidents_ramo_imss_check
    CHECK (ramo_imss IS NULL OR ramo_imss IN ('enfermedad_general', 'riesgo_trabajo', 'maternidad')),
  ADD CONSTRAINT company_incidents_complemento_empresa_check
    CHECK (complemento_empresa IS NULL OR complemento_empresa >= 0);

-- 2. Salida anticipada en company_attendance ---------------------------------
ALTER TABLE public.company_attendance
  ADD COLUMN IF NOT EXISTS early_departure_minutes integer NOT NULL DEFAULT 0;

ALTER TABLE public.company_attendance
  DROP CONSTRAINT IF EXISTS company_attendance_early_departure_minutes_check;

ALTER TABLE public.company_attendance
  ADD CONSTRAINT company_attendance_early_departure_minutes_check
    CHECK (early_departure_minutes >= 0);

-- 3. Enlace único a incidencia IMSS desde company_leaves ---------------------
ALTER TABLE public.company_leaves
  ADD COLUMN IF NOT EXISTS incident_id uuid REFERENCES public.company_incidents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_company_leaves_incident_id
  ON public.company_leaves(incident_id)
  WHERE incident_id IS NOT NULL;

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
      'luto',
      'incapacidad_imss'
    )
  );

-- 4. Backfill de bonos 5 % para empresas existentes --------------------------
-- Las empresas nuevas inician con default 0/deshabilitado en parser;
-- las ya registradas conservan el 5% previo para evitar pérdida silenciosa.
UPDATE public.company_profiles
SET payroll_impact_config =
  COALESCE(payroll_impact_config, '{}'::jsonb)
  || CASE
       WHEN payroll_impact_config IS NULL OR NOT (payroll_impact_config ? 'punctualityBonus') THEN
         jsonb_build_object(
           'punctualityBonus',
           jsonb_build_object(
             'enabled', true,
             'amount', 5,
             'type', 'percentage',
             'cancelledBy', jsonb_build_array('retardo', 'falta_injustificada', 'suspension'),
             'partialCancelBy', jsonb_build_array(),
             'partialCancelPercentage', 50
           )
         )
       ELSE '{}'::jsonb
     END
  || CASE
       WHEN payroll_impact_config IS NULL OR NOT (payroll_impact_config ? 'attendanceBonus') THEN
         jsonb_build_object(
           'attendanceBonus',
           jsonb_build_object(
             'enabled', true,
             'amount', 5,
             'type', 'percentage',
             'cancelledBy', jsonb_build_array('falta_injustificada', 'suspension'),
             'partialCancelBy', jsonb_build_array(),
             'partialCancelPercentage', 50
           )
         )
       ELSE '{}'::jsonb
     END
WHERE payroll_impact_config IS NULL
   OR NOT (payroll_impact_config ? 'punctualityBonus')
   OR NOT (payroll_impact_config ? 'attendanceBonus');
