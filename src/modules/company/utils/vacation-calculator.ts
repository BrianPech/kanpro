import { getMexicoDateISO, parseMexicoCalendarDate } from "@/lib/formatters";
import {
  DEFAULT_VACATION_POLICY,
  type VacationPolicyStrategy,
} from "../strategies/vacation-policy.strategy";

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
