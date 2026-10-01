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

export function getVacationDaysForYear(yearNumber: number): number {
  if (yearNumber <= 0) return 0;
  if (yearNumber === 1) return 12;
  if (yearNumber === 2) return 14;
  if (yearNumber === 3) return 16;
  if (yearNumber === 4) return 18;
  if (yearNumber === 5) return 20;
  if (yearNumber <= 10) return 22;
  if (yearNumber <= 15) return 24;
  if (yearNumber <= 20) return 26;
  if (yearNumber <= 25) return 28;
  if (yearNumber <= 30) return 30;
  return 32;
}

export function calculateLFTVacationDays(
  hireDateStr: string,
  targetDateStr?: string
): {
  yearsOfService: number;
  monthsOfService: number;
  daysOfService: number;
  formattedSeniority: string;
  totalDaysAccrued: number;
  currentYearEntitlement: number;
} {
  const hireDate = new Date(hireDateStr);
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();

  if (isNaN(hireDate.getTime())) {
    return {
      yearsOfService: 1,
      monthsOfService: 0,
      daysOfService: 0,
      formattedSeniority: "1 año",
      totalDaysAccrued: 12,
      currentYearEntitlement: 12,
    };
  }

  let years = targetDate.getFullYear() - hireDate.getFullYear();
  let months = targetDate.getMonth() - hireDate.getMonth();
  let days = targetDate.getDate() - hireDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      0
    ).getDate();
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
  const currentYearEntitlement = getVacationDaysForYear(currentWorkingYear);

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

/**
 * Calculates the number of working days between two dates, excluding Sundays (and optionally Saturdays)
 */
export function calculateWorkingDays(
  startDateStr: string,
  endDateStr: string,
  excludeSaturdays = false
): number {
  const start = new Date(startDateStr.includes("T") ? startDateStr : `${startDateStr}T12:00:00`);
  const end = new Date(endDateStr.includes("T") ? endDateStr : `${endDateStr}T12:00:00`);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 is Sunday, 6 is Saturday
    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;

    if (!isSunday && (!excludeSaturdays || !isSaturday)) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}
