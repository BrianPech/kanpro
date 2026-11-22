import {
  BUSINESS_TIME_ZONE,
  calculateDailySalary,
  toMonthlyEquivalentSalary,
} from "@/lib/formatters";
import {
  calculateAbsenceDeduction,
  type SeventhDayMode,
} from "../utils/payroll-calculator";
import {
  filterPayrollEligibleIncidents,
  resolveExpiredClarificationIncident,
  type ClarifiableIncidentLike,
  type EligibleIncidentCandidate,
} from "./incident-payroll-impact.strategy";
import { parseCompanyWorkRulesConfig } from "./company-policies.parser";
import type {
  CompanyWorkRulesConfig,
  DisciplinaryPayMode,
} from "../types/company-policies";

export interface JustifiableIncidentCandidate
  extends EligibleIncidentCandidate,
    Omit<ClarifiableIncidentLike, "category"> {
  evidence_url?: string | null;
  justified_at?: string | null;
  employee_statement_at?: string | null;
}

export interface ClarificationResolutionResult<T extends JustifiableIncidentCandidate> {
  incident: T;
  justifiedOnTime: boolean;
  expiredToAbsence: boolean;
}

/**
 * Evalúa una incidencia en estado 'por_aclarar':
 * - Si entregó justificante/evidencia antes de la fecha límite, NO pasa a falta injustificada ni se descuenta.
 * - Si venció la ventana sin justificante a tiempo, transiciona automáticamente a 'falta_injustificada' ('aprobado').
 */
export function resolveClarificationWithJustification<T extends JustifiableIncidentCandidate>(
  incident: T,
  now: Date = new Date()
): ClarificationResolutionResult<T> {
  if (incident.status !== "por_aclarar") {
    return { incident, justifiedOnTime: false, expiredToAbsence: false };
  }

  const hasEvidence = Boolean(incident.evidence_url && incident.evidence_url.trim().length > 0);
  if (hasEvidence) {
    const deadlineMs = incident.clarification_deadline
      ? Date.parse(incident.clarification_deadline)
      : Number.NaN;
    const submittedRaw = incident.justified_at || incident.employee_statement_at;
    const submittedMs = submittedRaw ? Date.parse(submittedRaw) : now.getTime();

    const onTime =
      Number.isNaN(deadlineMs) ||
      (!Number.isNaN(submittedMs) && submittedMs <= deadlineMs);

    if (onTime) {
      return {
        incident: {
          ...incident,
          status: "en_revision",
        },
        justifiedOnTime: true,
        expiredToAbsence: false,
      };
    }
  }

  const resolved = resolveExpiredClarificationIncident(incident, now);
  const expiredToAbsence =
    resolved.status === "aprobado" && resolved.category === "falta_injustificada";

  return {
    incident: resolved,
    justifiedOnTime: false,
    expiredToAbsence,
  };
}

export interface SeventhDayEntitlementInput {
  workedDays: number;
  scheduledWorkDays?: number;
  seventhDayMode?: SeventhDayMode;
}

export interface SeventhDayEntitlementResult {
  /** Proporción ganada del séptimo día (0..1) en función de los días trabajados (Art. 69/72 LFT). */
  earnedRatio: number;
  /** Días de séptimo día perdidos según el modo configurado. */
  lostSeventhDayRatio: number;
}

/**
 * El séptimo día se gana con los días trabajados de la semana (Art. 69 y 72 LFT).
 */
export function calculateSeventhDayEntitlement(
  input: SeventhDayEntitlementInput
): SeventhDayEntitlementResult {
  const scheduled = Math.max(1, Number(input.scheduledWorkDays) || 6);
  const worked = Math.max(0, Math.min(scheduled, Number(input.workedDays) || 0));
  const mode: SeventhDayMode = input.seventhDayMode ?? "proporcional";

  const earnedRatio = Math.round((worked / scheduled) * 10000) / 10000;
  if (worked >= scheduled || mode === "ninguno") {
    return { earnedRatio: worked >= scheduled ? 1 : earnedRatio, lostSeventhDayRatio: 0 };
  }
  if (mode === "completo") {
    return { earnedRatio, lostSeventhDayRatio: 1 };
  }
  return {
    earnedRatio,
    lostSeventhDayRatio: Math.round((1 - earnedRatio) * 10000) / 10000,
  };
}

/**
 * Calcula la deducción de faltas administrativas o suspensiones disciplinarias
 * según el modo configurado en `disciplinaryRules`.
 */
export function calculateDisciplinaryDeduction(
  monthlySalary: number,
  days: number,
  payMode: DisciplinaryPayMode,
  seventhDayMode: SeventhDayMode = "proporcional"
): number {
  if (days <= 0 || monthlySalary <= 0 || payMode === "con_goce") return 0;
  if (payMode === "sin_goce_solo_dia") {
    return calculateAbsenceDeduction(monthlySalary, days, "ninguno");
  }
  return calculateAbsenceDeduction(monthlySalary, days, seventhDayMode);
}

export interface AbsenceDisciplinaryImpactInput {
  incidents: JustifiableIncidentCandidate[];
  attendance: Array<{ work_date: string; status: string }>;
  monthlySalary: number;
  salaryInput?: { amount: number; paymentFrequency?: string | null };
  config?: unknown;
  now?: Date;
}

export interface AbsenceDisciplinaryImpactResult {
  timezone: typeof BUSINESS_TIME_ZONE;
  dailySalary: number;
  seventhDayMode: SeventhDayMode;
  unjustifiedAbsencesCount: number;
  absenceDeduction: number;
  suspensionCount: number;
  suspensionDeduction: number;
  administrativeFaultCount: number;
  administrativeFaultDeduction: number;
  justifiedOnTimeCount: number;
  expiredToAbsenceCount: number;
  /** Invariante de Felipe: incapacidades IMSS nunca cuentan como falta. */
  imssDisabilitiesExcluded: number;
  totalDeduction: number;
}

function resolveMonthly(input: AbsenceDisciplinaryImpactInput): number {
  if (input.salaryInput) {
    return toMonthlyEquivalentSalary(
      input.salaryInput.amount,
      input.salaryInput.paymentFrequency
    );
  }
  return Math.max(0, Number(input.monthlySalary) || 0);
}

/**
 * Orquesta el impacto de faltas injustificadas, aclaraciones con/sin justificante,
 * faltas administrativas y suspensiones disciplinarias según CompanyWorkRulesConfig.
 */
export function calculateAbsenceAndDisciplinaryImpact(
  input: AbsenceDisciplinaryImpactInput
): AbsenceDisciplinaryImpactResult {
  const config: CompanyWorkRulesConfig = parseCompanyWorkRulesConfig(input.config);
  const now = input.now ?? new Date();
  const monthlySalary = resolveMonthly(input);
  const dailySalary = calculateDailySalary(monthlySalary, "mensual");

  let justifiedOnTimeCount = 0;
  let expiredToAbsenceCount = 0;

  const resolvedIncidents = input.incidents.map((rawIncident) => {
    const res = resolveClarificationWithJustification(rawIncident, now);
    if (res.justifiedOnTime) justifiedOnTimeCount += 1;
    if (res.expiredToAbsence) expiredToAbsenceCount += 1;
    return res.incident;
  });

  const eligible = filterPayrollEligibleIncidents(resolvedIncidents, input.attendance);

  const unjustifiedAbsencesCount = eligible.filter(
    (i) => i.category === "falta_injustificada"
  ).length;
  const suspensionCount = eligible.filter((i) => i.category === "suspension").length;
  const administrativeFaultCount = eligible.filter(
    (i) => i.category === "incumplimiento"
  ).length;
  const imssDisabilitiesExcluded = eligible.filter(
    (i) => i.category === "incapacidad"
  ).length;

  const absenceDeduction = calculateAbsenceDeduction(
    monthlySalary,
    unjustifiedAbsencesCount,
    config.seventhDayMode
  );
  const suspensionDeduction = calculateDisciplinaryDeduction(
    monthlySalary,
    suspensionCount,
    config.disciplinaryRules.suspensionMode,
    config.seventhDayMode
  );
  const administrativeFaultDeduction = calculateDisciplinaryDeduction(
    monthlySalary,
    administrativeFaultCount,
    config.disciplinaryRules.administrativeFaultMode,
    config.seventhDayMode
  );

  return {
    timezone: BUSINESS_TIME_ZONE,
    dailySalary,
    seventhDayMode: config.seventhDayMode,
    unjustifiedAbsencesCount,
    absenceDeduction,
    suspensionCount,
    suspensionDeduction,
    administrativeFaultCount,
    administrativeFaultDeduction,
    justifiedOnTimeCount,
    expiredToAbsenceCount,
    imssDisabilitiesExcluded,
    totalDeduction:
      absenceDeduction + suspensionDeduction + administrativeFaultDeduction,
  };
}
