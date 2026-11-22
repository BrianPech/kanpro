-- Migration: 20261122052736_company_work_rules_config.sql
-- Description: Tarea 0 / Reglas de mi empresa.
--   Amplía la documentación y validación estructural de company_profiles.payroll_impact_config (jsonb)
--   para soportar políticas completas de trabajo por empresa (puntualidad, faltas y séptimo día,
--   incapacidades IMSS y catálogo de permisos, vacaciones/horas/tiempo extra, periodicidad y bonos),
--   manteniendo compatibilidad con defaults LFT cuando es NULL o parcial.

ALTER TABLE public.company_profiles
  DROP CONSTRAINT IF EXISTS company_profiles_payroll_impact_config_object;

ALTER TABLE public.company_profiles
  ADD CONSTRAINT company_profiles_payroll_impact_config_object
  CHECK (payroll_impact_config IS NULL OR jsonb_typeof(payroll_impact_config) = 'object');

ALTER TABLE public.company_profiles
  DROP CONSTRAINT IF EXISTS company_profiles_leave_approval_config_object;

ALTER TABLE public.company_profiles
  ADD CONSTRAINT company_profiles_leave_approval_config_object
  CHECK (leave_approval_config IS NULL OR jsonb_typeof(leave_approval_config) = 'object');

COMMENT ON COLUMN public.company_profiles.payroll_impact_config IS
  'Políticas de trabajo y reglas de negocio por empresa (NULL = defaults LFT). Incluye: puntualidad (toleranceMinutes, scope, delaysPerAbsence, delayDeductionDays, resetPeriod, earlyDepartureMode, compTimeMode), faltas y séptimo día (seventhDayMode, clarificationWindowDays), incapacidades y permisos (imssComplement, leaveCatalogue), vacaciones y horas (vacationRules >= Art. 76/80 LFT, hourlyLeaveRules, overtimeRules >= Art. 67/68 LFT), periodicidad y bonos (payrollPeriodicity, incidentCutoffDay, punctualityBonus, attendanceBonus, recognitionBonusDays, effectiveFrom).';
