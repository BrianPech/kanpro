import {
  BUSINESS_TIME_ZONE,
  calculateDailySalary,
  getMexicoDateISO,
  parseMexicoCalendarDate,
  toMonthlyEquivalentSalary,
} from "@/lib/formatters";
import { calculateAbsenceDeduction } from "../utils/payroll-calculator";
import {
  filterPayrollEligibleIncidents,
  type EligibleIncidentCandidate,
} from "./incident-payroll-impact.strategy";
import { parseCompanyWorkRulesConfig } from "./company-policies.parser";
import type {
  CompanyWorkRulesConfig,
  DelayResetPeriod,
} from "../types/company-policies";

const DAY_MS = 24 * 60 * 60 * 1000;
// Lunes base para bloques catorcenales deterministas (UTC mediodía).
const CATORCENAL_EPOCH_MS = Date.UTC(2026, 0, 5, 12, 0, 0);

export interface EmployeeScopeContext {
  jobTitle?: string | null;
  shift?: string | null;
  branch?: string | null;
}

export interface EffectiveToleranceResult {
  appliesTolerance: boolean;
  toleranceMinutes: number;
  timezone: typeof BUSINESS_TIME_ZONE;
}

function normalizeMatch(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function listContains(list: string[], candidate: string | null | undefined): boolean {
  const normalized = normalizeMatch(candidate);
  if (!normalized || list.length === 0) return false;
  return list.some((item) => item.trim().toLowerCase() === normalized);
}

/**
 * Resuelve los minutos de tolerancia efectivos según el scope de la empresa
 * (uniforme o segmentado por puestos, turnos o sucursales).
 */
export function resolveEffectiveTolerance(
  config: Pick<CompanyWorkRulesConfig, "toleranceMinutes" | "scope">,
  employee?: EmployeeScopeContext
): EffectiveToleranceResult {
  if (config.scope.uniformTolerance) {
    return {
      appliesTolerance: true,
      toleranceMinutes: config.toleranceMinutes,
      timezone: BUSINESS_TIME_ZONE,
    };
  }

  const hasFilters =
    config.scope.jobTitles.length > 0 ||
    config.scope.shifts.length > 0 ||
    config.scope.branches.length > 0;

  if (!hasFilters) {
    return {
      appliesTolerance: true,
      toleranceMinutes: config.toleranceMinutes,
      timezone: BUSINESS_TIME_ZONE,
    };
  }

  const matchesScope =
    listContains(config.scope.jobTitles, employee?.jobTitle) ||
    listContains(config.scope.shifts, employee?.shift) ||
    listContains(config.scope.branches, employee?.branch);

  return {
    appliesTolerance: matchesScope,
    toleranceMinutes: matchesScope ? config.toleranceMinutes : 0,
    timezone: BUSINESS_TIME_ZONE,
  };
}

function formatUtcDateISO(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Calcula la clave del periodo de reinicio de retardos para una fecha YYYY-MM-DD.
 * Cuando la clave cambia entre fechas, el contador de retardos se reinicia.
 */
export function getResetPeriodKey(
  dateISO: string,
  resetPeriod: DelayResetPeriod,
  anchorDateISO?: string
): string {
  const parsed = parseMexicoCalendarDate(dateISO) ?? parseMexicoCalendarDate(getMexicoDateISO())!;
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = parsed.getUTCDate();

  if (resetPeriod === "mensual") {
    return `mensual:${year}-${month}`;
  }

  if (resetPeriod === "quincenal") {
    return `quincenal:${year}-${month}-${day <= 15 ? "Q1" : "Q2"}`;
  }

  if (resetPeriod === "semanal") {
    const dayOfWeek = parsed.getUTCDay(); // 0=Dom..6=Sab
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayMs = parsed.getTime() + diffToMonday * DAY_MS;
    return `semanal:${formatUtcDateISO(mondayMs)}`;
  }

  // catorcenal: bloques de 14 días desde anchor (por defecto lunes 2026-01-05)
  const anchorMs = anchorDateISO
    ? (parseMexicoCalendarDate(anchorDateISO)?.getTime() ?? CATORCENAL_EPOCH_MS)
    : CATORCENAL_EPOCH_MS;
  const diffDays = Math.floor((parsed.getTime() - anchorMs) / DAY_MS);
  const blockIndex = Math.floor(diffDays / 14);
  const blockStartMs = anchorMs + blockIndex * 14 * DAY_MS;
  return `catorcenal:${formatUtcDateISO(blockStartMs)}`;
}

export interface EarlyDepartureRecord {
  work_date: string;
  minutes: number;
  compensatedMinutes?: number;
}

export interface PeriodDelayAccumulationInput {
  incidents: EligibleIncidentCandidate[];
  attendance: Array<{ work_date: string; status: string }>;
  /** Salario mensual normalizado; si se pasa salario periódico usar `salaryInput`. */
  monthlySalary: number;
  /** Alternativa segura cuando se tiene monto periódico y frecuencia de pago. */
  salaryInput?: { amount: number; paymentFrequency?: string | null };
  config?: unknown;
  targetDateISO?: string;
  anchorDateISO?: string;
  earlyDepartures?: EarlyDepartureRecord[];
}

export interface PeriodDelayAccumulationResult {
  timezone: typeof BUSINESS_TIME_ZONE;
  periodKey: string;
  resetPeriod: DelayResetPeriod;
  dailySalary: number;
  /** Retardos de incidencias elegibles en el periodo actual (excluye duplicados en asistencia). */
  delayIncidentsInPeriod: number;
  /** Retardos excluidos por pertenecer a otro periodo (reinicio de conteo). */
  delaysFromOtherPeriods: number;
  /** Retardos excluidos por ya existir en asistencia el mismo día. */
  delaysAbsorbedByAttendance: number;
  /** Equivalentes a retardo generados por salidas anticipadas (modo retardo_equivalente). */
  earlyDepartureDelayEquivalents: number;
  /** Minutos netos de salida anticipada tras aplicar compTimeMode. */
  uncompensatedEarlyMinutes: number;
  /** Deducción proporcional por salidas anticipadas (modo descuento_proporcional). */
  earlyDepartureDeduction: number;
  /** Total de retardos acumulados en el periodo actual. */
  totalDelaysInPeriod: number;
  /** Faltas equivalentes por acumulación de retardos. */
  absenceEquivalents: number;
  /** Deducción en MXN por acumulación de retardos (Art. 72 LFT según seventhDayMode). */
  delayDeduction: number;
  /** Siempre 0: la multa fija de $100 es ilegal (Art. 107 LFT). */
  readonly fixedFineAmount: 0;
  totalDeduction: number;
}

function resolveMonthlySalary(input: PeriodDelayAccumulationInput): number {
  if (input.salaryInput) {
    return toMonthlyEquivalentSalary(
      input.salaryInput.amount,
      input.salaryInput.paymentFrequency
    );
  }
  return Math.max(0, Number(input.monthlySalary) || 0);
}

/**
 * Acumula retardos y salidas anticipadas en el periodo vigente de reinicio:
 * - Excluye incidencias ya absorbidas por asistencia el mismo día (filterPayrollEligibleIncidents).
 * - Reinicia el conteo al cambiar de periodo (semanal, catorcenal, quincenal, mensual).
 * - Aplica salida anticipada y tiempo compensable según earlyDepartureMode y compTimeMode.
 * - Calcula salario diario desde salario mensual normalizado (calculateDailySalary), sin multa fija de $100.
 */
export function calculatePeriodDelayAccumulation(
  input: PeriodDelayAccumulationInput
): PeriodDelayAccumulationResult {
  const config: CompanyWorkRulesConfig = parseCompanyWorkRulesConfig(input.config);
  const targetDateISO = input.targetDateISO ?? getMexicoDateISO();
  const periodKey = getResetPeriodKey(targetDateISO, config.resetPeriod, input.anchorDateISO);

  const monthlySalary = resolveMonthlySalary(input);
  const dailySalary = calculateDailySalary(monthlySalary, "mensual");

  const eligible = filterPayrollEligibleIncidents(input.incidents, input.attendance);
  const eligibleDelays = eligible.filter((i) => i.category === "retardo");
  const allAppliedDelays = input.incidents.filter(
    (i) => i.category === "retardo" && i.status === "aprobado"
  );
  const delaysAbsorbedByAttendance = Math.max(0, allAppliedDelays.length - eligibleDelays.length);

  let delayIncidentsInPeriod = 0;
  let delaysFromOtherPeriods = 0;
  for (const delay of eligibleDelays) {
    const key = getResetPeriodKey(delay.incident_date, config.resetPeriod, input.anchorDateISO);
    if (key === periodKey) {
      delayIncidentsInPeriod += 1;
    } else {
      delaysFromOtherPeriods += 1;
    }
  }

  let uncompensatedEarlyMinutes = 0;
  let earlyDepartureDelayEquivalents = 0;
  const allowCompTime = config.compTimeMode !== "ninguno";

  for (const record of input.earlyDepartures ?? []) {
    const key = getResetPeriodKey(record.work_date, config.resetPeriod, input.anchorDateISO);
    if (key !== periodKey) continue;

    const rawMinutes = Math.max(0, Number(record.minutes) || 0);
    const compMinutes = allowCompTime ? Math.max(0, Number(record.compensatedMinutes) || 0) : 0;
    const netMinutes = Math.max(0, rawMinutes - compMinutes);
    if (netMinutes <= 0) continue;

    uncompensatedEarlyMinutes += netMinutes;
    if (config.earlyDepartureMode === "retardo_equivalente") {
      earlyDepartureDelayEquivalents += 1;
    }
  }

  const earlyDepartureDeduction =
    config.earlyDepartureMode === "descuento_proporcional" && uncompensatedEarlyMinutes > 0
      ? Math.round((dailySalary / 8 / 60) * uncompensatedEarlyMinutes)
      : 0;

  const totalDelaysInPeriod = delayIncidentsInPeriod + earlyDepartureDelayEquivalents;
  const groups = Math.floor(totalDelaysInPeriod / config.delaysPerAbsence);
  const absenceEquivalents = groups * config.delayDeductionDays;
  const delayDeduction = calculateAbsenceDeduction(
    monthlySalary,
    absenceEquivalents,
    config.seventhDayMode
  );

  return {
    timezone: BUSINESS_TIME_ZONE,
    periodKey,
    resetPeriod: config.resetPeriod,
    dailySalary,
    delayIncidentsInPeriod,
    delaysFromOtherPeriods,
    delaysAbsorbedByAttendance,
    earlyDepartureDelayEquivalents,
    uncompensatedEarlyMinutes,
    earlyDepartureDeduction,
    totalDelaysInPeriod,
    absenceEquivalents,
    delayDeduction,
    fixedFineAmount: 0,
    totalDeduction: delayDeduction + earlyDepartureDeduction,
  };
}
