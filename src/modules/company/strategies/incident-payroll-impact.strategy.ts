import {
  calculateAbsenceDeduction,
  type SeventhDayMode,
} from "../utils/payroll-calculator";
import type { IncidentCategory } from "../types/incidents";
import { getMexicoDateISO, parseMexicoCalendarDate } from "@/lib/formatters";

export type { SeventhDayMode };
export type DelayDeductionDays = 0.5 | 1;
export type DelayResetPeriod = "semanal" | "catorcenal" | "quincenal" | "mensual";

export interface PayrollImpactScope {
  /** Si es true, la tolerancia aplica igual para toda la empresa. */
  uniformTolerance: boolean;
  /** Puestos a los que aplica o con excepción de tolerancia. */
  jobTitles: string[];
  /** Turnos a los que aplica. */
  shifts: string[];
  /** Sucursales a los que aplica. */
  branches: string[];
}

export interface PayrollImpactConfig {
  /** Retardos acumulados en el periodo que equivalen a un descuento. */
  delaysPerAbsence: number;
  /** Días de salario descontados al completar los retardos (1 día o 0.5 medio día). */
  delayDeductionDays: DelayDeductionDays;
  /** Minutos de tolerancia antes de marcar retardo. */
  toleranceMinutes: number;
  /** Periodo en el que se reinicia el conteo de retardos. */
  resetPeriod: DelayResetPeriod;
  /** Modo de descuento del séptimo día por falta injustificada (Art. 72 LFT). */
  seventhDayMode: SeventhDayMode;
  /** Ventana en días para entregar justificante antes de pasar a injustificada. */
  clarificationWindowDays: number;
  /** Alcance de tolerancia por puestos, turnos o sucursales. */
  scope: PayrollImpactScope;
  /** Días de salario que se pagan como bono por cada reconocimiento. */
  recognitionBonusDays: number;
  /** Fecha de entrada en vigor (YYYY-MM-DD), opcional. */
  effectiveFrom: string | null;
}

export const DEFAULT_PAYROLL_IMPACT_SCOPE: PayrollImpactScope = {
  uniformTolerance: true,
  jobTitles: [],
  shifts: [],
  branches: [],
};

export const DEFAULT_PAYROLL_IMPACT_CONFIG: PayrollImpactConfig = {
  delaysPerAbsence: 3,
  delayDeductionDays: 1,
  toleranceMinutes: 15,
  resetPeriod: "quincenal",
  seventhDayMode: "proporcional",
  clarificationWindowDays: 3,
  scope: {
    uniformTolerance: true,
    jobTitles: [],
    shifts: [],
    branches: [],
  },
  recognitionBonusDays: 1,
  effectiveFrom: null,
};

const VALID_RESET_PERIODS = new Set<DelayResetPeriod>([
  "semanal",
  "catorcenal",
  "quincenal",
  "mensual",
]);

const VALID_SEVENTH_DAY_MODES = new Set<SeventhDayMode>([
  "completo",
  "proporcional",
  "ninguno",
]);

export interface PayrollImpact {
  deduction: number;
  bonus: number;
  /** Faltas equivalentes que se descuentan (faltas reales o acumuladas por retardos). */
  absenceEquivalents: number;
}

export interface PayrollImpactInput {
  monthlySalary: number;
  /** Incidencias vigentes de esa categoría en el periodo. */
  count: number;
}

export interface IncidentPayrollImpactStrategy {
  calculate(input: PayrollImpactInput): PayrollImpact;
}

const NO_IMPACT: PayrollImpact = { deduction: 0, bonus: 0, absenceEquivalents: 0 };

function deductionFor(
  monthlySalary: number,
  absences: number,
  seventhDayMode: SeventhDayMode = "proporcional"
): PayrollImpact {
  return {
    deduction: calculateAbsenceDeduction(monthlySalary, absences, seventhDayMode),
    bonus: 0,
    absenceEquivalents: absences,
  };
}

export class UnjustifiedAbsenceImpact implements IncidentPayrollImpactStrategy {
  constructor(private readonly seventhDayMode: SeventhDayMode = "proporcional") {}

  calculate({ monthlySalary, count }: PayrollImpactInput): PayrollImpact {
    return deductionFor(monthlySalary, count, this.seventhDayMode);
  }
}

export class DelayAccumulationImpact implements IncidentPayrollImpactStrategy {
  constructor(
    private readonly delaysPerAbsence: number,
    private readonly delayDeductionDays: DelayDeductionDays = 1,
    private readonly seventhDayMode: SeventhDayMode = "proporcional"
  ) {
    if (!Number.isInteger(delaysPerAbsence) || delaysPerAbsence < 1) {
      throw new Error("Los retardos por falta deben ser un entero mayor o igual a 1.");
    }
    if (delayDeductionDays !== 0.5 && delayDeductionDays !== 1) {
      throw new Error("Los días de descuento por acumulación deben ser 0.5 o 1.");
    }
  }

  calculate({ monthlySalary, count }: PayrollImpactInput): PayrollImpact {
    if (count <= 0) return { ...NO_IMPACT };
    const groups = Math.floor(count / this.delaysPerAbsence);
    const absenceEquivalents = groups * this.delayDeductionDays;
    return deductionFor(monthlySalary, absenceEquivalents, this.seventhDayMode);
  }
}

export class NoDeductionImpact implements IncidentPayrollImpactStrategy {
  calculate(): PayrollImpact {
    return { ...NO_IMPACT };
  }
}

export class RecognitionBonusImpact implements IncidentPayrollImpactStrategy {
  constructor(private readonly bonusDays: number) {}

  calculate({ monthlySalary, count }: PayrollImpactInput): PayrollImpact {
    if (monthlySalary <= 0 || count <= 0 || this.bonusDays <= 0) return { ...NO_IMPACT };
    return {
      ...NO_IMPACT,
      bonus: Math.round((monthlySalary / 30) * this.bonusDays * count),
    };
  }
}

function mergeConfigWithDefaults(
  config?: Partial<PayrollImpactConfig>
): PayrollImpactConfig {
  if (!config) return DEFAULT_PAYROLL_IMPACT_CONFIG;
  return {
    ...DEFAULT_PAYROLL_IMPACT_CONFIG,
    ...config,
    scope: {
      ...DEFAULT_PAYROLL_IMPACT_SCOPE,
      ...(config.scope ?? {}),
    },
  };
}

/** Resuelve la estrategia de impacto en nómina por categoría. */
export function resolvePayrollImpactStrategy(
  category: IncidentCategory,
  config?: Partial<PayrollImpactConfig>
): IncidentPayrollImpactStrategy {
  const effective = mergeConfigWithDefaults(config);
  switch (category) {
    case "falta_injustificada":
      return new UnjustifiedAbsenceImpact(effective.seventhDayMode);
    case "retardo":
      return new DelayAccumulationImpact(
        effective.delaysPerAbsence,
        effective.delayDeductionDays,
        effective.seventhDayMode
      );
    case "reconocimiento":
      return new RecognitionBonusImpact(effective.recognitionBonusDays);
    default:
      // incapacidad IMSS, permiso con goce y demás categorías: sin deducción automática.
      return new NoDeductionImpact();
  }
}

export interface PayrollImpactIncident {
  category: IncidentCategory;
  status: string;
}

/** Totaliza el impacto de las incidencias de un empleado; las rechazadas no cuentan. */
export function calculateIncidentsPayrollImpact(
  incidents: PayrollImpactIncident[],
  monthlySalary: number,
  config?: Partial<PayrollImpactConfig>
): PayrollImpact {
  const effective = mergeConfigWithDefaults(config);
  const counts = new Map<IncidentCategory, number>();
  for (const incident of incidents) {
    if (incident.status === "rechazado") continue;
    counts.set(incident.category, (counts.get(incident.category) ?? 0) + 1);
  }

  return Array.from(counts.entries()).reduce<PayrollImpact>(
    (total, [category, count]) => {
      const impact = resolvePayrollImpactStrategy(category, effective).calculate({
        monthlySalary,
        count,
      });
      return {
        deduction: total.deduction + impact.deduction,
        bonus: total.bonus + impact.bonus,
        absenceEquivalents: total.absenceEquivalents + impact.absenceEquivalents,
      };
    },
    { ...NO_IMPACT }
  );
}

function parseStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

function parseScope(raw: unknown): PayrollImpactScope {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {
      uniformTolerance: DEFAULT_PAYROLL_IMPACT_SCOPE.uniformTolerance,
      jobTitles: [],
      shifts: [],
      branches: [],
    };
  }
  const source = raw as Record<string, unknown>;
  return {
    uniformTolerance:
      typeof source.uniformTolerance === "boolean"
        ? source.uniformTolerance
        : DEFAULT_PAYROLL_IMPACT_SCOPE.uniformTolerance,
    jobTitles: parseStringList(source.jobTitles),
    shifts: parseStringList(source.shifts),
    branches: parseStringList(source.branches),
  };
}

/** Lee payroll_impact_config (jsonb) de la empresa; cada campo inválido cae al default. */
export function parsePayrollImpactConfig(raw: unknown): PayrollImpactConfig {
  const source =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const delays = source.delaysPerAbsence;
  const deductionDays = source.delayDeductionDays;
  const tolerance = source.toleranceMinutes;
  const resetPeriod = source.resetPeriod;
  const seventhDayMode = source.seventhDayMode;
  const clarificationWindow = source.clarificationWindowDays;
  const bonusDays = source.recognitionBonusDays;
  const effectiveFrom = source.effectiveFrom;

  return {
    delaysPerAbsence:
      typeof delays === "number" && Number.isInteger(delays) && delays >= 1 && delays <= 30
        ? delays
        : DEFAULT_PAYROLL_IMPACT_CONFIG.delaysPerAbsence,
    delayDeductionDays:
      deductionDays === 0.5 || deductionDays === 1
        ? deductionDays
        : DEFAULT_PAYROLL_IMPACT_CONFIG.delayDeductionDays,
    toleranceMinutes:
      typeof tolerance === "number" && Number.isInteger(tolerance) && tolerance >= 0 && tolerance <= 120
        ? tolerance
        : DEFAULT_PAYROLL_IMPACT_CONFIG.toleranceMinutes,
    resetPeriod:
      typeof resetPeriod === "string" && VALID_RESET_PERIODS.has(resetPeriod as DelayResetPeriod)
        ? (resetPeriod as DelayResetPeriod)
        : DEFAULT_PAYROLL_IMPACT_CONFIG.resetPeriod,
    seventhDayMode:
      typeof seventhDayMode === "string" &&
      VALID_SEVENTH_DAY_MODES.has(seventhDayMode as SeventhDayMode)
        ? (seventhDayMode as SeventhDayMode)
        : DEFAULT_PAYROLL_IMPACT_CONFIG.seventhDayMode,
    clarificationWindowDays:
      typeof clarificationWindow === "number" &&
      Number.isInteger(clarificationWindow) &&
      clarificationWindow >= 1 &&
      clarificationWindow <= 30
        ? clarificationWindow
        : DEFAULT_PAYROLL_IMPACT_CONFIG.clarificationWindowDays,
    scope: parseScope(source.scope),
    recognitionBonusDays:
      typeof bonusDays === "number" && Number.isFinite(bonusDays) && bonusDays >= 0
        ? bonusDays
        : DEFAULT_PAYROLL_IMPACT_CONFIG.recognitionBonusDays,
    effectiveFrom:
      typeof effectiveFrom === "string" && /^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom.trim())
        ? effectiveFrom.trim()
        : null,
  };
}

export interface EligibleIncidentCandidate extends PayrollImpactIncident {
  incident_date: string;
}

export interface PartitionedPayrollIncidents<T extends EligibleIncidentCandidate> {
  eligible: T[];
  absorbedByAttendance: T[];
}

/**
 * Separa incidencias aplicadas (aprobado / reconocimiento resuelto) entre elegibles
 * para cálculo de nómina y las absorbidas porque ya constan en asistencia ese día.
 */
export function partitionPayrollIncidents<T extends EligibleIncidentCandidate>(
  incidents: T[],
  attendance: Array<{ work_date: string; status: string }>
): PartitionedPayrollIncidents<T> {
  const attendanceKeys = new Set(attendance.map((a) => `${a.status}|${a.work_date}`));
  const eligible: T[] = [];
  const absorbedByAttendance: T[] = [];

  for (const incident of incidents) {
    const isApplied =
      incident.status === "aprobado" ||
      (incident.category === "reconocimiento" && incident.status === "resuelto");
    if (!isApplied) continue;

    if (attendanceKeys.has(`${incident.category}|${incident.incident_date}`)) {
      absorbedByAttendance.push(incident);
    } else {
      eligible.push(incident);
    }
  }

  return { eligible, absorbedByAttendance };
}

/**
 * Incidencias que ya pueden afectar la nómina: las "aprobado" (aplicadas por RH) y los
 * reconocimientos "resuelto". Se omiten las que ya cuentan vía asistencia el mismo día.
 */
export function filterPayrollEligibleIncidents<T extends EligibleIncidentCandidate>(
  incidents: T[],
  attendance: Array<{ work_date: string; status: string }>
): T[] {
  return partitionPayrollIncidents(incidents, attendance).eligible;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calcula la fecha límite (fin del día en America/Cancun, UTC-5 permanente) para aclarar
 * una incidencia en estado 'por_aclarar'.
 */
export function computeClarificationDeadline(
  baseDateISO: string,
  windowDays: number = DEFAULT_PAYROLL_IMPACT_CONFIG.clarificationWindowDays
): string {
  const safeDays = Math.max(1, Math.min(30, Math.floor(Number(windowDays) || 3)));
  const parsed = parseMexicoCalendarDate(baseDateISO) ?? parseMexicoCalendarDate(getMexicoDateISO())!;
  const target = new Date(parsed.getTime() + safeDays * DAY_MS);
  const year = target.getUTCFullYear();
  const month = String(target.getUTCMonth() + 1).padStart(2, "0");
  const day = String(target.getUTCDate()).padStart(2, "0");
  // America/Cancun es UTC-5 permanente (sin horario de verano)
  return new Date(`${year}-${month}-${day}T23:59:59-05:00`).toISOString();
}

export interface ClarifiableIncidentLike {
  category: string;
  status: string;
  clarification_deadline?: string | null;
  resolution_notes?: string | null;
}

/** Determina si una incidencia en 'por_aclarar' ya excedió su fecha límite de justificante. */
export function isClarificationExpired(
  incident: Pick<ClarifiableIncidentLike, "status" | "clarification_deadline">,
  now: Date = new Date()
): boolean {
  if (incident.status !== "por_aclarar" || !incident.clarification_deadline) {
    return false;
  }
  const deadlineMs = Date.parse(incident.clarification_deadline);
  return !Number.isNaN(deadlineMs) && deadlineMs <= now.getTime();
}

/**
 * Aplica en memoria la transición automática de una incidencia 'por_aclarar' vencida:
 * pasa a estatus 'aprobado' y categoría 'falta_injustificada' (salvo si era 'retardo').
 */
export function resolveExpiredClarificationIncident<T extends ClarifiableIncidentLike>(
  incident: T,
  now: Date = new Date()
): T {
  if (!isClarificationExpired(incident, now)) {
    return incident;
  }

  const nextCategory =
    incident.category === "retardo" ? "retardo" : "falta_injustificada";
  const defaultNote =
    nextCategory === "retardo"
      ? "Plazo de aclaración vencido sin justificante; retardo aplicado automáticamente."
      : "Plazo de aclaración vencido sin justificante; marcada automáticamente como falta injustificada.";

  return {
    ...incident,
    category: nextCategory,
    status: "aprobado",
    resolution_notes: incident.resolution_notes?.trim() || defaultNote,
  };
}
