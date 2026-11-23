import { z } from "zod";
import {
  BUSINESS_TIME_ZONE,
  calculateDailySalary,
  parseMexicoCalendarDate,
  toMonthlyEquivalentSalary,
} from "@/lib/formatters";
import { calculateAbsenceDeduction } from "../utils/payroll-calculator";
import { parseCompanyWorkRulesConfig } from "./company-policies.parser";
import {
  DEFAULT_VACATION_POLICY,
  type VacationPolicyStrategy,
} from "./vacation-policy.strategy";
import type {
  CompanyWorkRulesConfig,
  LeaveCatalogueKey,
} from "../types/company-policies";

export type ImssBranch = "enfermedad_general" | "riesgo_trabajo" | "maternidad";

export const imssDisabilityCaptureSchema = z.object({
  folio: z
    .string()
    .trim()
    .min(3, "El folio de incapacidad IMSS debe tener al menos 3 caracteres.")
    .max(40, "El folio de incapacidad IMSS no puede exceder 40 caracteres."),
  daysCovered: z
    .number()
    .int("Los días amparados deben ser un número entero.")
    .min(1, "La incapacidad debe amparar al menos 1 día.")
    .max(365, "Los días amparados no pueden exceder 365 en un solo folio."),
  branch: z.enum(["enfermedad_general", "riesgo_trabajo", "maternidad"]),
  startDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de inicio debe tener formato YYYY-MM-DD."),
});

export type ImssDisabilityCapture = z.infer<typeof imssDisabilityCaptureSchema>;

export function parseImssDisabilityCapture(raw: unknown): ImssDisabilityCapture {
  return imssDisabilityCaptureSchema.parse(raw);
}

export interface ImssPayrollEffectInput {
  capture: ImssDisabilityCapture;
  monthlySalary: number;
  salaryInput?: { amount: number; paymentFrequency?: string | null };
  config?: unknown;
}

export interface ImssPayrollEffectResult {
  timezone: typeof BUSINESS_TIME_ZONE;
  folio: string;
  daysCovered: number;
  branch: ImssBranch;
  /** Invariante de Felipe: nunca cuenta como falta. */
  readonly countsAsAbsence: false;
  /** Invariante de Felipe: nunca se paga como salario ordinario. */
  readonly paidAsOrdinarySalary: false;
  readonly ordinarySalaryPaid: 0;
  readonly absenceDeduction: 0;
  readonly imssSubsidyHandledByImss: true;
  companyComplementPay: number;
}

function resolveMonthlySalary(
  monthlySalary: number,
  salaryInput?: { amount: number; paymentFrequency?: string | null }
): number {
  if (salaryInput) {
    return toMonthlyEquivalentSalary(salaryInput.amount, salaryInput.paymentFrequency);
  }
  return Math.max(0, Number(monthlySalary) || 0);
}

/**
 * Calcula el efecto en nómina de una incapacidad IMSS capturada:
 * - Nunca cuenta como falta injustificada (absenceDeduction = 0).
 * - Nunca se paga como salario ordinario (ordinarySalaryPaid = 0; el subsidio es del IMSS).
 * - Solo calcula el complemento voluntario de la empresa si `imssComplement.enabled` es true.
 */
export function calculateImssDisabilityPayrollEffect(
  input: ImssPayrollEffectInput
): ImssPayrollEffectResult {
  const capture = parseImssDisabilityCapture(input.capture);
  const config: CompanyWorkRulesConfig = parseCompanyWorkRulesConfig(input.config);
  const monthlySalary = resolveMonthlySalary(input.monthlySalary, input.salaryInput);
  const dailySalary = calculateDailySalary(monthlySalary, "mensual");

  let companyComplementPay = 0;
  const { imssComplement } = config;
  if (imssComplement.enabled && dailySalary > 0) {
    const pct = imssComplement.complementPercentage / 100;
    if (capture.branch === "enfermedad_general" && imssComplement.coverFirstThreeDays) {
      const firstThreeDays = Math.min(3, capture.daysCovered);
      const remainingDays = Math.max(0, capture.daysCovered - firstThreeDays);
      const firstThreeRate = pct > 0 ? pct : 1;
      companyComplementPay = Math.round(
        dailySalary * firstThreeDays * firstThreeRate +
          dailySalary * remainingDays * pct
      );
    } else {
      companyComplementPay = Math.round(dailySalary * capture.daysCovered * pct);
    }
  }

  return {
    timezone: BUSINESS_TIME_ZONE,
    folio: capture.folio,
    daysCovered: capture.daysCovered,
    branch: capture.branch,
    countsAsAbsence: false,
    paidAsOrdinarySalary: false,
    ordinarySalaryPaid: 0,
    absenceDeduction: 0,
    imssSubsidyHandledByImss: true,
    companyComplementPay,
  };
}

export interface LeavePolicyEffectInput {
  requestType: LeaveCatalogueKey;
  days: number;
  monthlySalary: number;
  salaryInput?: { amount: number; paymentFrequency?: string | null };
  config?: unknown;
}

export interface LeavePolicyEffectResult {
  timezone: typeof BUSINESS_TIME_ZONE;
  requestType: LeaveCatalogueKey;
  days: number;
  paid: boolean;
  payPercentage: number;
  paidAmount: number;
  unpaidDeduction: number;
  affectsSeventhDay: boolean;
  affectsVacationPremium: boolean;
  affectsBonuses: boolean;
  exceedsAnnualLimit: boolean;
}

/**
 * Evalúa el efecto en nómina y prestaciones de un permiso del catálogo configurado:
 * - Permisos con goce: se pagan íntegros al 100%.
 * - Permisos sin goce: sin pago y afectan séptimo día / prima / bonos según config.
 */
export function evaluateLeavePolicyEffect(
  input: LeavePolicyEffectInput
): LeavePolicyEffectResult {
  const config = parseCompanyWorkRulesConfig(input.config);
  const rule = config.leaveCatalogue[input.requestType];
  const days = Math.max(0, Number(input.days) || 0);
  const monthlySalary = resolveMonthlySalary(input.monthlySalary, input.salaryInput);
  const dailySalary = calculateDailySalary(monthlySalary, "mensual");

  const paidAmount = rule.paid
    ? Math.round(dailySalary * days * (rule.payPercentage / 100))
    : 0;

  const unpaidDeduction = rule.paid
    ? 0
    : rule.affectsSeventhDay
      ? calculateAbsenceDeduction(monthlySalary, days, config.seventhDayMode)
      : Math.round(dailySalary * days);

  return {
    timezone: BUSINESS_TIME_ZONE,
    requestType: input.requestType,
    days,
    paid: rule.paid,
    payPercentage: rule.payPercentage,
    paidAmount,
    unpaidDeduction,
    affectsSeventhDay: rule.affectsSeventhDay,
    affectsVacationPremium: rule.affectsVacationPremium,
    affectsBonuses: rule.affectsBonuses,
    exceedsAnnualLimit: rule.maxDaysPerYear !== null && days > rule.maxDaysPerYear,
  };
}

export interface CompanyVacationPolicyResult {
  strategy: VacationPolicyStrategy;
  premiumPercentage: number;
  allowCarryOver: boolean;
  maxCarryOverDays: number;
}

/**
 * Resuelve la estrategia de vacaciones de la empresa validando que ningún año
 * esté por debajo del piso legal del Art. 76 LFT (y prima >= 25% Art. 80 LFT).
 */
export function resolveCompanyVacationPolicy(
  config?: unknown
): CompanyVacationPolicyResult {
  const parsed = parseCompanyWorkRulesConfig(config);
  const { vacationRules } = parsed;

  const strategy: VacationPolicyStrategy = {
    getDaysForYear(yearNumber: number): number {
      const lftMin = DEFAULT_VACATION_POLICY.getDaysForYear(yearNumber);
      const override = vacationRules.daysByYearOverrides[yearNumber];
      return typeof override === "number" ? Math.max(lftMin, override) : lftMin;
    },
  };

  return {
    strategy,
    premiumPercentage: vacationRules.premiumPercentage,
    allowCarryOver: vacationRules.allowCarryOver,
    maxCarryOverDays: vacationRules.maxCarryOverDays,
  };
}

export interface HourlyLeaveEvaluationInput {
  requestedMinutes: number;
  alreadyUsedHoursThisMonth?: number;
  config?: unknown;
}

export interface HourlyLeaveEvaluationResult {
  allowed: boolean;
  reason?: string;
  billedHours: number;
}

/**
 * Evalúa si un permiso por horas cumple las reglas de la empresa
 * (habilitado, incremento mínimo, máximo por día y tope mensual).
 */
export function evaluateHourlyLeave(
  input: HourlyLeaveEvaluationInput
): HourlyLeaveEvaluationResult {
  const { hourlyLeaveRules } = parseCompanyWorkRulesConfig(input.config);
  if (!hourlyLeaveRules.enabled) {
    return { allowed: false, reason: "Los permisos por horas están deshabilitados.", billedHours: 0 };
  }

  const mins = Math.max(0, Number(input.requestedMinutes) || 0);
  if (mins <= 0) {
    return { allowed: false, reason: "La duración solicitada debe ser mayor a 0 minutos.", billedHours: 0 };
  }

  const step = hourlyLeaveRules.minIncrementMinutes;
  const roundedMinutes = Math.ceil(mins / step) * step;
  const billedHours = Math.round((roundedMinutes / 60) * 100) / 100;

  if (billedHours > hourlyLeaveRules.maxHoursPerDay) {
    return {
      allowed: false,
      reason: `Excede el máximo permitido por día (${hourlyLeaveRules.maxHoursPerDay} h).`,
      billedHours,
    };
  }

  const used = Math.max(0, Number(input.alreadyUsedHoursThisMonth) || 0);
  if (hourlyLeaveRules.monthlyCapHours > 0 && used + billedHours > hourlyLeaveRules.monthlyCapHours) {
    return {
      allowed: false,
      reason: `Excede el tope mensual permitido (${hourlyLeaveRules.monthlyCapHours} h).`,
      billedHours,
    };
  }

  return { allowed: true, billedHours };
}

export interface OvertimeEntry {
  work_date: string;
  hours: number;
  authorized: boolean;
  rateType?: "doble" | "triple";
}

export interface OvertimeEvaluationInput {
  entries: OvertimeEntry[];
  monthlySalary: number;
  salaryInput?: { amount: number; paymentFrequency?: string | null };
  config?: unknown;
}

export interface OvertimeEvaluationResult {
  timezone: typeof BUSINESS_TIME_ZONE;
  requiresPriorAuthorization: boolean;
  authorizedHoursPaid: number;
  unauthorizedHoursExcluded: number;
  doubleHours: number;
  tripleHours: number;
  doublePay: number;
  triplePay: number;
  totalOvertimePay: number;
}

function getOvertimeWeekKey(workDate: string): string {
  const parsed = parseMexicoCalendarDate(workDate);
  if (!parsed) return "default";
  const dayOffset = (parsed.getUTCDay() + 6) % 7; // 0 = lunes, 6 = domingo
  const monday = new Date(parsed.getTime() - dayOffset * 86_400_000);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const d = String(monday.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calcula el pago de horas extras según `overtimeRules`:
 * - Si `requiresPriorAuthorization` es true, las horas sin autorización previa no se pagan.
 * - Primeras `maxDoubleHoursPerWeek` por semana (máx. 9h LFT) al multiplicador doble (>= 2x),
 *   excedente (o entradas explícitas `"triple"`) al multiplicador triple (>= 3x).
 */
export function evaluateOvertimePolicy(
  input: OvertimeEvaluationInput
): OvertimeEvaluationResult {
  const { overtimeRules } = parseCompanyWorkRulesConfig(input.config);
  const monthlySalary = resolveMonthlySalary(input.monthlySalary, input.salaryInput);
  const dailySalary = calculateDailySalary(monthlySalary, "mensual");
  const hourlyRate = dailySalary / 8;

  let unauthorizedHoursExcluded = 0;
  const byWeek = new Map<string, { standardHours: number; explicitTripleHours: number }>();

  for (const entry of input.entries) {
    const hours = Math.max(0, Number(entry.hours) || 0);
    if (hours <= 0) continue;

    if (overtimeRules.requiresPriorAuthorization && !entry.authorized) {
      unauthorizedHoursExcluded += hours;
      continue;
    }

    const weekKey = getOvertimeWeekKey(entry.work_date);
    const bucket = byWeek.get(weekKey) ?? { standardHours: 0, explicitTripleHours: 0 };
    if (entry.rateType === "triple") {
      bucket.explicitTripleHours += hours;
    } else {
      bucket.standardHours += hours;
    }
    byWeek.set(weekKey, bucket);
  }

  let doubleHours = 0;
  let tripleHours = 0;

  for (const bucket of byWeek.values()) {
    const weekDouble = Math.min(bucket.standardHours, overtimeRules.maxDoubleHoursPerWeek);
    const weekTriple =
      Math.max(0, bucket.standardHours - weekDouble) + bucket.explicitTripleHours;
    doubleHours += weekDouble;
    tripleHours += weekTriple;
  }

  const eligibleHours = doubleHours + tripleHours;
  const doublePay = Math.round(hourlyRate * doubleHours * overtimeRules.doubleRateMultiplier);
  const triplePay = Math.round(hourlyRate * tripleHours * overtimeRules.tripleRateMultiplier);

  return {
    timezone: BUSINESS_TIME_ZONE,
    requiresPriorAuthorization: overtimeRules.requiresPriorAuthorization,
    authorizedHoursPaid: eligibleHours,
    unauthorizedHoursExcluded,
    doubleHours,
    tripleHours,
    doublePay,
    triplePay,
    totalOvertimePay: doublePay + triplePay,
  };
}
