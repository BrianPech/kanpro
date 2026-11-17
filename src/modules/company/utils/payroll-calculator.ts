/**
 * Motor de Cálculo Laboral y Fiscal de Nómina conforme a la LFT, LISR y LSS (México)
 */

import { getMexicoDateISO } from "@/lib/formatters";

export interface FortnightPeriodInfo {
  periodName: string;
  periodDates: string;
  startDate: string;
  endDate: string;
  payoutDate: string;
  periodType: "quincenal" | "semanal" | "mensual";
}

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/**
 * Determina el periodo quincenal en curso o según fecha de referencia
 */
export function getFortnightPeriodInfo(refDate = new Date()): FortnightPeriodInfo {
  const [yStr, mStr, dStr] = getMexicoDateISO(refDate).split("-");
  const year = Number(yStr);
  const month = Number(mStr) - 1; // 0-indexed
  const day = Number(dStr);
  const monthName = MONTH_NAMES_ES[month];

  if (day <= 15) {
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-15`;
    return {
      periodName: `1ª Quincena ${monthName} ${year}`,
      periodDates: `01 al 15 de ${monthName} ${year}`,
      startDate,
      endDate,
      payoutDate: endDate,
      periodType: "quincenal",
    };
  } else {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-16`;
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;
    return {
      periodName: `2ª Quincena ${monthName} ${year}`,
      periodDates: `16 al ${lastDayOfMonth} de ${monthName} ${year}`,
      startDate,
      endDate,
      payoutDate: endDate,
      periodType: "quincenal",
    };
  }
}

/**
 * Tabla de Retención de ISR Quincenal 2025/2026 (Art. 96 Ley del ISR)
 */
interface ISRBracket {
  lowerLimit: number;
  fixedFee: number;
  ratePercentage: number;
}

const ISR_QUINCENAL_BRACKETS: ISRBracket[] = [
  { lowerLimit: 0.01, fixedFee: 0.0, ratePercentage: 0.0192 },
  { lowerLimit: 368.11, fixedFee: 7.05, ratePercentage: 0.064 },
  { lowerLimit: 3124.36, fixedFee: 183.45, ratePercentage: 0.1088 },
  { lowerLimit: 5490.76, fixedFee: 441.0, ratePercentage: 0.16 },
  { lowerLimit: 6382.81, fixedFee: 583.65, ratePercentage: 0.1792 },
  { lowerLimit: 7641.91, fixedFee: 809.55, ratePercentage: 0.2136 },
  { lowerLimit: 15412.81, fixedFee: 2468.55, ratePercentage: 0.2352 },
  { lowerLimit: 24290.71, fixedFee: 4557.45, ratePercentage: 0.3 },
  { lowerLimit: 46378.51, fixedFee: 11183.85, ratePercentage: 0.32 },
  { lowerLimit: 61838.11, fixedFee: 16130.85, ratePercentage: 0.34 },
  { lowerLimit: 185514.31, fixedFee: 58180.8, ratePercentage: 0.35 },
];

/**
 * Calcula la retención estimada de ISR Quincenal conforme al Art. 96 LISR
 */
export function calculateMexicanISR(taxableBaseQuincenal: number): number {
  if (taxableBaseQuincenal <= 0) return 0;

  // Encontrar el tramo correspondiente
  let bracket = ISR_QUINCENAL_BRACKETS[0];
  for (let i = ISR_QUINCENAL_BRACKETS.length - 1; i >= 0; i--) {
    if (taxableBaseQuincenal >= ISR_QUINCENAL_BRACKETS[i].lowerLimit) {
      bracket = ISR_QUINCENAL_BRACKETS[i];
      break;
    }
  }

  const excess = taxableBaseQuincenal - bracket.lowerLimit;
  const tax = bracket.fixedFee + excess * bracket.ratePercentage;
  return Math.max(0, Math.round(tax));
}

/**
 * Calcula la cuota obrera del IMSS (~2.725% sobre SBC quincenal)
 */
export function calculateIMSSWorkerShare(monthlySalary: number): number {
  if (monthlySalary <= 0) return 0;

  // Factor de integración mínimo primer año (15 días aguinaldo + 12 días vacaciones al 25% prima) = 1.0493
  const dailyBase = monthlySalary / 30;
  const sbcDaily = dailyBase * 1.0493;

  // Tope 25 UMAs (~$2,714.25 MXN diario en 2025/2026)
  const umaValue = 113.14;
  const maxSbcDaily = umaValue * 25;
  const integratedDaily = Math.min(sbcDaily, maxSbcDaily);

  // Cuota obrera por 15 días:
  // Invalidez y vida (0.625%), Cesantía y vejez (1.125%), Prestaciones en dinero y pensionados (0.625%) + excedente
  const workerRate = 0.02725;
  const quincenalImss = integratedDaily * 15 * workerRate;

  return Math.round(quincenalImss);
}

/**
 * Calcula las horas extras conforme a los Art. 67 y 68 de la LFT
 */
export function calculateOvertimePay(
  monthlySalary: number,
  hours: number,
  rateType: "doble" | "triple" = "doble"
): number {
  if (hours <= 0 || monthlySalary <= 0) return 0;
  const hourlyRate = monthlySalary / 30 / 8;
  const multiplier = rateType === "triple" ? 3 : 2;
  return Math.round(hourlyRate * hours * multiplier);
}

/**
 * Calcula el importe de deducción por falta injustificada (Art. 72 LFT: Día de salario + proporcional descanso)
 */
export function calculateAbsenceDeduction(monthlySalary: number, absences: number): number {
  if (absences <= 0 || monthlySalary <= 0) return 0;
  const dailySalary = monthlySalary / 30;
  // Factor 1.1666 incluye el proporcional del séptimo día de descanso semanal
  return Math.round(dailySalary * 1.1666 * absences);
}

/**
 * Genera una CLABE interbancaria estandarizada de 18 dígitos para dispersión bancaria
 */
export function generateValidClabe(employeeId: string, bankCode = "012"): string {
  // Código de banco de 3 dígitos (012 BBVA, 072 Banorte, 014 Santander, 646 STP, etc.)
  const plaza = "180"; // CDMX o estándar
  // Convertir caracteres de id en números de cuenta
  let numericHash = "";
  for (let i = 0; i < employeeId.length && numericHash.length < 11; i++) {
    const code = employeeId.charCodeAt(i) % 10;
    numericHash += code.toString();
  }
  numericHash = numericHash.padEnd(11, "0");
  const base17 = `${bankCode}${plaza}${numericHash}`;

  // Dígito verificador ponderado módulo 10 (Norma bancaria mexicana ABM)
  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += (parseInt(base17.charAt(i), 10) * weights[i]) % 10;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return `${base17}${checkDigit}`;
}

/**
 * Value Object para CLABE interbancaria (18 dígitos según la norma bancaria mexicana ABM)
 */
export class MexicanCLABE {
  private readonly value: string;

  constructor(raw: string) {
    const clean = raw.trim();
    if (!MexicanCLABE.isValid(clean)) {
      throw new Error("CLABE interbancaria inválida: debe tener 18 dígitos y dígito verificador correcto.");
    }
    this.value = clean;
  }

  public getValue(): string {
    return this.value;
  }

  public getBankCode(): string {
    return this.value.slice(0, 3);
  }

  public getPlaza(): string {
    return this.value.slice(3, 6);
  }

  public getAccountNumber(): string {
    return this.value.slice(6, 17);
  }

  public getCheckDigit(): string {
    return this.value.slice(17, 18);
  }

  public static isValid(clabe: string): boolean {
    if (!/^\d{18}$/.test(clabe)) return false;
    const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += (parseInt(clabe.charAt(i), 10) * weights[i]) % 10;
    }
    const expected = (10 - (sum % 10)) % 10;
    return parseInt(clabe.charAt(17), 10) === expected;
  }
}

/**
 * Motor de Dominio para orquestar y encapsular reglas laborales y fiscales mexicanas
 */
export class MexicanPayrollEngine {
  getFortnightPeriod(refDate = new Date()): FortnightPeriodInfo {
    return getFortnightPeriodInfo(refDate);
  }

  calculateISR(taxableBaseQuincenal: number): number {
    return calculateMexicanISR(taxableBaseQuincenal);
  }

  calculateIMSS(monthlySalary: number): number {
    return calculateIMSSWorkerShare(monthlySalary);
  }

  calculateOvertime(
    monthlySalary: number,
    hours: number,
    rateType: "doble" | "triple" = "doble"
  ): number {
    return calculateOvertimePay(monthlySalary, hours, rateType);
  }

  calculateAbsence(monthlySalary: number, absences: number): number {
    return calculateAbsenceDeduction(monthlySalary, absences);
  }
}

