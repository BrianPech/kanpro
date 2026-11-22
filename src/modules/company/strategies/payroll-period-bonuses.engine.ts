import {
  BUSINESS_TIME_ZONE,
  fromMonthlyEquivalentSalary,
  getMexicoDateISO,
  parseMexicoCalendarDate,
  toMonthlyEquivalentSalary,
} from "@/lib/formatters";
import {
  filterPayrollEligibleIncidents,
  type EligibleIncidentCandidate,
} from "./incident-payroll-impact.strategy";
import { parseCompanyWorkRulesConfig } from "./company-policies.parser";
import type {
  AttendanceBonusConfig,
  PayrollPeriodicity,
} from "../types/company-policies";
import type { IncidentCategory } from "../types/incidents";

const DAY_MS = 24 * 60 * 60 * 1000;
const CATORCENAL_EPOCH_MS = Date.UTC(2026, 0, 5, 12, 0, 0);

function formatUtcDateISO(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface PayrollPeriodWithCutoff {
  timezone: typeof BUSINESS_TIME_ZONE;
  periodicity: PayrollPeriodicity;
  startDate: string;
  endDate: string;
  cutoffDate: string;
}

/**
 * Resuelve el periodo de nómina vigente y su fecha de corte de incidencias
 * según `payrollPeriodicity` y `incidentCutoffDay` en zona `America/Cancun`.
 */
export function resolvePayrollPeriodWithCutoff(options?: {
  refDateISO?: string;
  config?: unknown;
  anchorDateISO?: string;
}): PayrollPeriodWithCutoff {
  const config = parseCompanyWorkRulesConfig(options?.config);
  const refDateISO = options?.refDateISO ?? getMexicoDateISO();
  const parsed = parseMexicoCalendarDate(refDateISO) ?? parseMexicoCalendarDate(getMexicoDateISO())!;

  const year = parsed.getUTCFullYear();
  const monthIdx = parsed.getUTCMonth();
  const month = String(monthIdx + 1).padStart(2, "0");
  const day = parsed.getUTCDate();
  const lastDayOfMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
  const cutoffDay = config.incidentCutoffDay;
  const periodicity = config.payrollPeriodicity;

  if (periodicity === "mensual") {
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-${String(lastDayOfMonth).padStart(2, "0")}`;
    const clampedCutoff = Math.max(1, Math.min(lastDayOfMonth, cutoffDay));
    const cutoffDate = `${year}-${month}-${String(clampedCutoff).padStart(2, "0")}`;
    return { timezone: BUSINESS_TIME_ZONE, periodicity, startDate, endDate, cutoffDate };
  }

  if (periodicity === "quincenal") {
    if (day <= 15) {
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-15`;
      const clampedCutoff = cutoffDay <= 15 ? Math.max(1, cutoffDay) : 15;
      const cutoffDate = `${year}-${month}-${String(clampedCutoff).padStart(2, "0")}`;
      return { timezone: BUSINESS_TIME_ZONE, periodicity, startDate, endDate, cutoffDate };
    }
    const startDate = `${year}-${month}-16`;
    const endDate = `${year}-${month}-${String(lastDayOfMonth).padStart(2, "0")}`;
    const q2Cutoff =
      cutoffDay >= 16
        ? Math.min(cutoffDay, lastDayOfMonth)
        : Math.min(15 + cutoffDay, lastDayOfMonth);
    const cutoffDate = `${year}-${month}-${String(q2Cutoff).padStart(2, "0")}`;
    return { timezone: BUSINESS_TIME_ZONE, periodicity, startDate, endDate, cutoffDate };
  }

  if (periodicity === "semanal") {
    const dow = parsed.getUTCDay();
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const mondayMs = parsed.getTime() + diffToMonday * DAY_MS;
    const sundayMs = mondayMs + 6 * DAY_MS;
    const offset = Math.max(0, Math.min(6, cutoffDay - 1));
    return {
      timezone: BUSINESS_TIME_ZONE,
      periodicity,
      startDate: formatUtcDateISO(mondayMs),
      endDate: formatUtcDateISO(sundayMs),
      cutoffDate: formatUtcDateISO(mondayMs + offset * DAY_MS),
    };
  }

  // catorcenal: bloques de 14 días
  const anchorMs = options?.anchorDateISO
    ? (parseMexicoCalendarDate(options.anchorDateISO)?.getTime() ?? CATORCENAL_EPOCH_MS)
    : CATORCENAL_EPOCH_MS;
  const diffDays = Math.floor((parsed.getTime() - anchorMs) / DAY_MS);
  const blockIndex = Math.floor(diffDays / 14);
  const startMs = anchorMs + blockIndex * 14 * DAY_MS;
  const endMs = startMs + 13 * DAY_MS;
  const offset = Math.max(0, Math.min(13, cutoffDay - 1));

  return {
    timezone: BUSINESS_TIME_ZONE,
    periodicity,
    startDate: formatUtcDateISO(startMs),
    endDate: formatUtcDateISO(endMs),
    cutoffDate: formatUtcDateISO(startMs + offset * DAY_MS),
  };
}

export interface PartitionedByCutoff<T extends { incident_date: string }> {
  inCurrentPeriod: T[];
  deferredToNextPeriod: T[];
  outsidePeriod: T[];
}

/**
 * Separa incidencias según la fecha de corte del periodo:
 * - `[startDate, cutoffDate]` → entran al periodo actual.
 * - `(cutoffDate, endDate]` → se difieren al siguiente periodo.
 */
export function partitionIncidentsByCutoff<T extends { incident_date: string }>(
  incidents: T[],
  period: Pick<PayrollPeriodWithCutoff, "startDate" | "endDate" | "cutoffDate">
): PartitionedByCutoff<T> {
  const inCurrentPeriod: T[] = [];
  const deferredToNextPeriod: T[] = [];
  const outsidePeriod: T[] = [];

  for (const incident of incidents) {
    const d = incident.incident_date;
    if (d < period.startDate || d > period.endDate) {
      outsidePeriod.push(incident);
    } else if (d <= period.cutoffDate) {
      inCurrentPeriod.push(incident);
    } else {
      deferredToNextPeriod.push(incident);
    }
  }

  return { inCurrentPeriod, deferredToNextPeriod, outsidePeriod };
}

export type BonusEvaluationStatus = "disabled" | "full" | "cancelled_partial" | "cancelled_full";

export interface SingleBonusEvaluation {
  enabled: boolean;
  baseAmount: number;
  finalAmount: number;
  status: BonusEvaluationStatus;
  reductionPercentage: number;
  triggeredBy: IncidentCategory[];
}

export interface PeriodBonusesInput {
  incidents: EligibleIncidentCandidate[];
  attendance: Array<{ work_date: string; status: string }>;
  monthlySalary: number;
  salaryInput?: { amount: number; paymentFrequency?: string | null };
  config?: unknown;
  refDateISO?: string;
  anchorDateISO?: string;
}

export interface PeriodBonusesResult {
  timezone: typeof BUSINESS_TIME_ZONE;
  period: PayrollPeriodWithCutoff;
  basePeriodSalary: number;
  punctualityBonus: SingleBonusEvaluation;
  attendanceBonus: SingleBonusEvaluation;
  totalBonuses: number;
  inCurrentPeriodCount: number;
  deferredToNextPeriodCount: number;
}

function evaluateSingleBonus(
  rule: AttendanceBonusConfig,
  basePeriodSalary: number,
  activeCategories: Set<IncidentCategory>
): SingleBonusEvaluation {
  if (!rule.enabled || rule.amount <= 0) {
    return {
      enabled: rule.enabled,
      baseAmount: 0,
      finalAmount: 0,
      status: "disabled",
      reductionPercentage: 0,
      triggeredBy: [],
    };
  }

  const baseAmount =
    rule.type === "fixed"
      ? Math.round(rule.amount)
      : Math.round(basePeriodSalary * (rule.amount / 100));

  const fullTriggers = rule.cancelledBy.filter((cat) => activeCategories.has(cat));
  if (fullTriggers.length > 0) {
    return {
      enabled: true,
      baseAmount,
      finalAmount: 0,
      status: "cancelled_full",
      reductionPercentage: 100,
      triggeredBy: fullTriggers,
    };
  }

  const partialTriggers = rule.partialCancelBy.filter((cat) => activeCategories.has(cat));
  if (partialTriggers.length > 0 && rule.partialCancelPercentage > 0) {
    const reduction = Math.min(100, Math.max(0, rule.partialCancelPercentage));
    const finalAmount = Math.round(baseAmount * (1 - reduction / 100));
    return {
      enabled: true,
      baseAmount,
      finalAmount,
      status: reduction >= 100 ? "cancelled_full" : "cancelled_partial",
      reductionPercentage: reduction,
      triggeredBy: partialTriggers,
    };
  }

  return {
    enabled: true,
    baseAmount,
    finalAmount: baseAmount,
    status: "full",
    reductionPercentage: 0,
    triggeredBy: [],
  };
}

/**
 * Calcula bonos de puntualidad y asistencia sobre el periodo de nómina vigente,
 * respetando la fecha de corte de incidencias y las reglas de cancelación total/parcial.
 */
export function evaluatePeriodBonuses(input: PeriodBonusesInput): PeriodBonusesResult {
  const config = parseCompanyWorkRulesConfig(input.config);
  const period = resolvePayrollPeriodWithCutoff({
    refDateISO: input.refDateISO,
    config,
    anchorDateISO: input.anchorDateISO,
  });

  const monthlySalary = input.salaryInput
    ? toMonthlyEquivalentSalary(input.salaryInput.amount, input.salaryInput.paymentFrequency)
    : Math.max(0, Number(input.monthlySalary) || 0);

  const basePeriodSalary = fromMonthlyEquivalentSalary(monthlySalary, config.payrollPeriodicity);
  const eligible = filterPayrollEligibleIncidents(input.incidents, input.attendance);
  const { inCurrentPeriod, deferredToNextPeriod } = partitionIncidentsByCutoff(eligible, period);

  const activeCategories = new Set<IncidentCategory>();
  for (const inc of inCurrentPeriod) {
    activeCategories.add(inc.category);
  }
  for (const att of input.attendance) {
    if (att.work_date >= period.startDate && att.work_date <= period.cutoffDate) {
      if (att.status === "retardo" || att.status === "falta_injustificada") {
        activeCategories.add(att.status);
      }
    }
  }

  const punctualityBonus = evaluateSingleBonus(
    config.punctualityBonus,
    basePeriodSalary,
    activeCategories
  );
  const attendanceBonus = evaluateSingleBonus(
    config.attendanceBonus,
    basePeriodSalary,
    activeCategories
  );

  return {
    timezone: BUSINESS_TIME_ZONE,
    period,
    basePeriodSalary,
    punctualityBonus,
    attendanceBonus,
    totalBonuses: punctualityBonus.finalAmount + attendanceBonus.finalAmount,
    inCurrentPeriodCount: inCurrentPeriod.length,
    deferredToNextPeriodCount: deferredToNextPeriod.length,
  };
}
