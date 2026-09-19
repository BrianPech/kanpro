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

  // Net
  totalPerceptions: number;
  totalDeductions: number;
  netPayEstimated: number;

  bankAccount?: {
    bankName: string;
    clabe: string;
  };
}

export interface PayrollPeriodSummary {
  periodId: string;
  periodName: string;
  periodType: "quincenal" | "semanal" | "mensual";
  startDate: string;
  endDate: string;
  payoutDate: string;
  status: "borrador" | "calculada" | "dispersada" | "pagada";

  totalGross: number;
  totalOvertime: number;
  totalBonuses: number;
  totalDeductions: number;
  totalNet: number;
  employeesCount: number;

  employees: PayrollEmployeeItem[];
}
