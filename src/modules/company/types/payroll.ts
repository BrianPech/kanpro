export interface PayrollEmployeeItem {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  department: string;
  avatarUrl?: string | null;

  // Base
  baseSalaryPeriod: number; // e.g. 9,250 for quincena
  daysWorked: number; // e.g. 15

  // Additions (Percepciones)
  overtimeHours: number;
  overtimePay: number; // calculated with 200%/300%
  punctualityBonus: number;
  attendanceBonus: number;
  performanceBonus: number;

  // Deductions (Deducciones)
  unjustifiedAbsences: number;
  absenceDeductions: number;
  lateArrivals: number;
  delayDeductions: number;
  imssDeduction: number; // Estimated employee IMSS share
  isrEstimated: number; // Estimated ISR retention

  // Desglose de impacto por incidencias en el periodo (B3)
  incidentDelays?: number;
  absenceEquivalents?: number;
  delayAbsenceEquivalents?: number;
  delayConversionDeduction?: number;
  delaysPerAbsenceRule?: number;
  delayDeductionDaysRule?: 0.5 | 1;
  absorbedIncidentsCount?: number;

  // Reglas de empresa (Bloque 1): IMSS, permisos y diferidos tras fecha de corte
  imssDisabilityDays?: number;
  imssComplementPay?: number;
  unpaidLeaveDays?: number;
  paidLeaveDays?: number;
  deferredIncidentsCount?: number;

  // Net
  totalPerceptions: number;
  totalDeductions: number;
  netPayEstimated: number;

  bankAccount?: {
    bankName: string;
    clabe: string;
  };
  hasValidBankDetails?: boolean;

  // Timbrado Fiscal CFDI 4.0 (SAT)
  cfdi?: {
    uuid: string;
    status: "pendiente" | "timbrado" | "error" | "cancelado";
    xml?: string;
    stampDate?: string;
    satSeal?: string;
    pacRfc?: string;
    qrCode?: string;
  };
}

export interface PayrollPeriodSummary {
  periodId: string;
  periodName: string;
  periodType: "quincenal" | "semanal" | "catorcenal" | "mensual";
  startDate: string;
  endDate: string;
  cutoffDate?: string;
  payoutDate: string;
  status: "borrador" | "calculada" | "dispersada" | "pagada" | "timbrada";
  timbradaAt?: string | null;
  timbradosCount?: number;

  totalGross: number;
  totalOvertime: number;
  totalBonuses: number;
  totalDeductions: number;
  totalNet: number;
  employeesCount: number;

  employees: PayrollEmployeeItem[];
}
