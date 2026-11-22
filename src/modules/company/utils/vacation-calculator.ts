import {
  getMexicoDateISO,
  parseMexicoCalendarDate,
  toMonthlyEquivalentSalary,
} from "@/lib/formatters";
import {
  DEFAULT_VACATION_POLICY,
  type VacationPolicyStrategy,
} from "../strategies/vacation-policy.strategy";
import type { VacationRequestType } from "../types/employee-dossier";

/**
 * Mexican Federal Labor Law (LFT - "Vacaciones Dignas") Vacation Days Calculator
 * Art. 76 LFT:
 * Year 1: 12 days
 * Year 2: 14 days
 * Year 3: 16 days
 * Year 4: 18 days
 * Year 5: 20 days
 * Years 6-10: 22 days
 * Years 11-15: 24 days
 * Years 16-20: 26 days
 * Years 21-25: 28 days
 * Years 26-30: 30 days
 * Years 31-35: 32 days
 */

export function getVacationDaysForYear(
  yearNumber: number,
  policy: VacationPolicyStrategy = DEFAULT_VACATION_POLICY
): number {
  return policy.getDaysForYear(yearNumber);
}

export function calculateLFTVacationDays(
  hireDateStr: string,
  targetDateStr?: string,
  policy: VacationPolicyStrategy = DEFAULT_VACATION_POLICY
): {
  yearsOfService: number;
  monthsOfService: number;
  daysOfService: number;
  formattedSeniority: string;
  totalDaysAccrued: number;
  currentYearEntitlement: number;
} {
  const hireDate = parseMexicoCalendarDate(hireDateStr);
  const targetDate = parseMexicoCalendarDate(targetDateStr || getMexicoDateISO());

  if (!hireDate || !targetDate) {
    return {
      yearsOfService: 0,
      monthsOfService: 0,
      daysOfService: 0,
      formattedSeniority: "0 días",
      totalDaysAccrued: 0,
      currentYearEntitlement: 0,
    };
  }

  // Si la fecha de referencia es anterior o igual a la fecha de ingreso, el devengado es 0
  // (evita que el préstamo de meses deje months = 11 para fechas futuras).
  if (targetDate.getTime() <= hireDate.getTime()) {
    const isFutureHire = targetDate.getTime() < hireDate.getTime();
    return {
      yearsOfService: 0,
      monthsOfService: 0,
      daysOfService: 0,
      formattedSeniority: "0 días",
      totalDaysAccrued: 0,
      currentYearEntitlement: isFutureHire ? 0 : getVacationDaysForYear(1, policy),
    };
  }

  let years = targetDate.getUTCFullYear() - hireDate.getUTCFullYear();
  let months = targetDate.getUTCMonth() - hireDate.getUTCMonth();
  let days = targetDate.getUTCDate() - hireDate.getUTCDate();

  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(
      Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 0)
    ).getUTCDate();
    days += prevMonthDays;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  years = Math.max(0, years);
  months = Math.max(0, months);
  days = Math.max(0, days);

  // Active year in course (annual LFT entitlement for the year being worked)
  const completedYears = years;
  const currentWorkingYear = completedYears + 1;
  const currentYearEntitlement = getVacationDaysForYear(currentWorkingYear, policy);
  // Accrued days: proportional in year 1 (1 day per completed month), full completed-year LFT entitlement after year 1
  const totalDaysAccrued =
    completedYears === 0
      ? Math.floor((currentYearEntitlement * months) / 12)
      : getVacationDaysForYear(completedYears, policy);

  let formattedSeniority = "";
  if (years > 0) {
    formattedSeniority += `${years} año${years > 1 ? "s" : ""}`;
  }
  if (months > 0) {
    if (formattedSeniority) formattedSeniority += ", ";
    formattedSeniority += `${months} mes${months > 1 ? "es" : ""}`;
  }
  if (!formattedSeniority) {
    formattedSeniority = `${days} día${days !== 1 ? "s" : ""}`;
  }

  return {
    yearsOfService: years,
    monthsOfService: months,
    daysOfService: days,
    formattedSeniority,
    totalDaysAccrued,
    currentYearEntitlement,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Normaliza fecha o timestamp a día calendario de negocio (UTC mediodía). */
function toBusinessCalendarDay(dateStr: string): Date | null {
  const day = dateStr.includes("T") ? getMexicoDateISO(new Date(dateStr)) : dateStr;
  return Number.isNaN(Date.parse(dateStr)) ? null : parseMexicoCalendarDate(day);
}

/**
 * Calculates the number of working days between two dates, excluding Sundays (and optionally Saturdays).
 * Opera sobre días calendario de la zona de negocio, independiente de la zona del servidor.
 */
export function calculateWorkingDays(
  startDateStr: string,
  endDateStr: string,
  excludeSaturdays = false
): number {
  const start = toBusinessCalendarDay(startDateStr);
  const end = toBusinessCalendarDay(endDateStr);

  if (!start || !end || start > end) {
    return 0;
  }

  let count = 0;
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const dayOfWeek = new Date(t).getUTCDay(); // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && (!excludeSaturdays || dayOfWeek !== 6)) {
      count++;
    }
  }

  return count;
}

export const LFT_VACATION_PREMIUM_RATE = 0.25;

export interface VacationPremiumResult {
  dailySalary: number;
  vacationBaseAmount: number;
  premiumRate: number;
  premiumAmount: number;
}

/**
 * Art. 80 LFT: Prima vacacional no menor de 25% sobre los salarios que correspondan
 * durante el período de vacaciones.
 */
export function calculateVacationPremium(
  salaryAmount: number,
  vacationDays: number,
  premiumRate: number = LFT_VACATION_PREMIUM_RATE,
  paymentFrequency?: string | null
): VacationPremiumResult {
  const safeSalary = Math.max(0, Number(salaryAmount) || 0);
  const safeMonthly =
    paymentFrequency && paymentFrequency.toLowerCase().trim() !== "mensual"
      ? toMonthlyEquivalentSalary(safeSalary, paymentFrequency)
      : safeSalary;
  const safeDays = Math.max(0, Number(vacationDays) || 0);
  const safeRate = Math.max(
    LFT_VACATION_PREMIUM_RATE,
    Number(premiumRate) || LFT_VACATION_PREMIUM_RATE
  );
  const dailySalary = Math.round((safeMonthly / 30) * 100) / 100;
  const rawBase = (safeMonthly / 30) * safeDays;
  const vacationBaseAmount = Math.round(rawBase * 100) / 100;
  const premiumAmount = Math.round(rawBase * safeRate * 100) / 100;

  return {
    dailySalary,
    vacationBaseAmount,
    premiumRate: safeRate,
    premiumAmount,
  };
}

export interface VacationExpirationSchedule {
  completedYears: number;
  lastAnniversaryDate: string;
  nextAnniversaryDate: string;
  enjoymentWindowEndDate: string;
  prescriptionEndDate: string;
  isExpired: boolean;
}

function addMonthsUTC(base: Date, monthsToAdd: number): string {
  const totalMonths = base.getUTCFullYear() * 12 + base.getUTCMonth() + monthsToAdd;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = totalMonths % 12;
  const maxDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(base.getUTCDate(), maxDay);
  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
}

export interface VacationCycleWindow {
  /** Inicio del ciclo anual vigente (YYYY-MM-DD, inclusivo). */
  cycleStartDate: string;
  /** Fin del ciclo anual vigente (YYYY-MM-DD, exclusivo: próximo aniversario). */
  cycleEndDate: string;
  /** Años completos de antigüedad al corte. */
  completedYears: number;
}

/**
 * Calcula la ventana del ciclo anual vacacional vigente con base en la fecha de ingreso
 * y fecha de corte (zona America/Cancun). Devuelve null si hireDate es inválida o futura.
 */
export function getCurrentVacationCycleWindow(
  hireDateStr: string | null | undefined,
  targetDateStr?: string
): VacationCycleWindow | null {
  if (!hireDateStr) return null;
  const referenceISO = targetDateStr || getMexicoDateISO();
  const hireDate = parseMexicoCalendarDate(hireDateStr);
  const targetDate = parseMexicoCalendarDate(referenceISO);
  if (!hireDate || !targetDate || targetDate.getTime() < hireDate.getTime()) {
    return null;
  }

  const seniority = calculateLFTVacationDays(hireDateStr, referenceISO);
  const completedYears = seniority.yearsOfService;
  const cycleStartDate = addMonthsUTC(hireDate, completedYears * 12);
  const cycleEndDate = addMonthsUTC(hireDate, (completedYears + 1) * 12);

  return {
    cycleStartDate,
    cycleEndDate,
    completedYears,
  };
}

/**
 * Filtra solicitudes de vacaciones al ciclo anual vigente (start_date >= cycleStartDate),
 * evitando que vacaciones tomadas en años anteriores consuman el saldo del ciclo actual.
 */
export function filterLeavesInCurrentCycle<
  T extends { start_date?: string | null; startDate?: string | null }
>(
  leaves: T[],
  hireDateStr: string | null | undefined,
  targetDateStr?: string
): T[] {
  if (!hireDateStr) return leaves;
  const window = getCurrentVacationCycleWindow(hireDateStr, targetDateStr);
  if (!window) return [];
  return leaves.filter((leave) => {
    const start = (leave.start_date ?? leave.startDate ?? "").trim();
    return start.length >= 10 && start >= window.cycleStartDate;
  });
}

/**
 * Art. 81 y Art. 516 LFT:
 * - Las vacaciones deben concederse dentro de los 6 meses siguientes al cumplimiento del año de servicios.
 * - La acción para reclamarlas prescribe en 1 año a partir de que sean exigibles (18 meses tras el aniversario).
 */
export function calculateVacationExpiration(
  hireDateStr: string,
  targetDateStr?: string
): VacationExpirationSchedule {
  const referenceISO = targetDateStr || getMexicoDateISO();
  const hireDate = parseMexicoCalendarDate(hireDateStr) || parseMexicoCalendarDate(referenceISO)!;
  const seniority = calculateLFTVacationDays(hireDateStr, referenceISO);
  const completedYears = Math.max(1, seniority.yearsOfService);

  const lastAnniversaryDate = addMonthsUTC(hireDate, completedYears * 12);
  const nextAnniversaryDate = addMonthsUTC(hireDate, (completedYears + 1) * 12);
  const enjoymentWindowEndDate = addMonthsUTC(hireDate, completedYears * 12 + 6);
  const prescriptionEndDate = addMonthsUTC(hireDate, completedYears * 12 + 18);

  return {
    completedYears,
    lastAnniversaryDate,
    nextAnniversaryDate,
    enjoymentWindowEndDate,
    prescriptionEndDate,
    isExpired: referenceISO > prescriptionEndDate,
  };
}

export interface SpecialLeavePolicyRule {
  requestType: VacationRequestType;
  label: string;
  maxDaysPerRequest: number | null;
  paid: boolean;
  deductsFromVacationBalance: boolean;
  legalBasis: string;
}

export const SPECIAL_LEAVE_POLICIES: Record<VacationRequestType, SpecialLeavePolicyRule> = {
  vacaciones: {
    requestType: "vacaciones",
    label: "Vacaciones Anuales LFT",
    maxDaysPerRequest: null,
    paid: true,
    deductsFromVacationBalance: true,
    legalBasis: "Art. 76 LFT (Vacaciones Dignas)",
  },
  dias_economicos: {
    requestType: "dias_economicos",
    label: "Días Económicos",
    maxDaysPerRequest: 3,
    paid: true,
    deductsFromVacationBalance: false,
    legalBasis: "Prestación corporativa con goce de sueldo (máx. 3 días hábiles)",
  },
  matrimonio: {
    requestType: "matrimonio",
    label: "Permiso por Matrimonio",
    maxDaysPerRequest: 5,
    paid: true,
    deductsFromVacationBalance: false,
    legalBasis: "Política corporativa de nupcias (máx. 5 días hábiles)",
  },
  paternidad: {
    requestType: "paternidad",
    label: "Permiso por Paternidad",
    maxDaysPerRequest: 5,
    paid: true,
    deductsFromVacationBalance: false,
    legalBasis: "Art. 132 Fracc. XXVII Bis LFT (5 días laborables con goce de sueldo)",
  },
  maternidad: {
    requestType: "maternidad",
    label: "Incapacidad por Maternidad",
    maxDaysPerRequest: 84,
    paid: true,
    deductsFromVacationBalance: false,
    legalBasis: "Art. 170 Fracc. II LFT / IMSS (84 días)",
  },
  luto: {
    requestType: "luto",
    label: "Permiso por Luto",
    maxDaysPerRequest: 3,
    paid: true,
    deductsFromVacationBalance: false,
    legalBasis: "Art. 132 Fracc. XXIX LFT (mín. 3 días hábiles por evento con goce de sueldo)",
  },
  permiso_con_goce: {
    requestType: "permiso_con_goce",
    label: "Permiso con Goce de Sueldo",
    maxDaysPerRequest: null,
    paid: true,
    deductsFromVacationBalance: false,
    legalBasis: "Autorización especial con goce de sueldo",
  },
  permiso_sin_goce: {
    requestType: "permiso_sin_goce",
    label: "Permiso sin Goce de Sueldo",
    maxDaysPerRequest: null,
    paid: false,
    deductsFromVacationBalance: false,
    legalBasis: "Licencia temporal sin goce de salario",
  },
};

export function validateSpecialLeavePolicyDays(
  requestType: VacationRequestType,
  workingDays: number,
  customMaxDaysPerRequest?: number | null
): void {
  const policy = SPECIAL_LEAVE_POLICIES[requestType];
  if (!policy) {
    return;
  }
  const effectiveMax =
    customMaxDaysPerRequest !== undefined ? customMaxDaysPerRequest : policy.maxDaysPerRequest;
  if (effectiveMax === null) {
    return;
  }
  if (workingDays > effectiveMax) {
    throw new Error(
      `El permiso de "${policy.label}" permite un máximo de ${effectiveMax} día(s) hábiles por solicitud (solicitaste ${workingDays}).`
    );
  }
}
