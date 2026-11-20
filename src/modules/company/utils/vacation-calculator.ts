import { getMexicoDateISO, parseMexicoCalendarDate } from "@/lib/formatters";
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
      yearsOfService: 1,
      monthsOfService: 0,
      daysOfService: 0,
      formattedSeniority: "1 año",
      totalDaysAccrued: 12,
      currentYearEntitlement: 12,
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

  // Active year in course
  const completedYears = years;
  const currentWorkingYear = completedYears + 1;
  const currentYearEntitlement = getVacationDaysForYear(currentWorkingYear, policy);

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
    totalDaysAccrued: currentYearEntitlement,
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
  monthlySalary: number,
  vacationDays: number,
  premiumRate: number = LFT_VACATION_PREMIUM_RATE
): VacationPremiumResult {
  const safeMonthly = Math.max(0, Number(monthlySalary) || 0);
  const safeDays = Math.max(0, Number(vacationDays) || 0);
  const safeRate = Math.max(LFT_VACATION_PREMIUM_RATE, Number(premiumRate) || LFT_VACATION_PREMIUM_RATE);
  const dailySalary = Math.round((safeMonthly / 30) * 100) / 100;
  const vacationBaseAmount = Math.round(dailySalary * safeDays * 100) / 100;
  const premiumAmount = Math.round(vacationBaseAmount * safeRate * 100) / 100;

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
    maxDaysPerRequest: 5,
    paid: true,
    deductsFromVacationBalance: false,
    legalBasis: "Política humanitaria por fallecimiento familiar directo (máx. 5 días hábiles)",
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
  workingDays: number
): void {
  const policy = SPECIAL_LEAVE_POLICIES[requestType];
  if (!policy || policy.maxDaysPerRequest === null) {
    return;
  }
  if (workingDays > policy.maxDaysPerRequest) {
    throw new Error(
      `El permiso de "${policy.label}" permite un máximo de ${policy.maxDaysPerRequest} día(s) hábiles por solicitud (solicitaste ${workingDays}).`
    );
  }
}
