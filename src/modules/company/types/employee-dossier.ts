export type ContractType =
  | "indeterminado"
  | "determinado"
  | "periodo_prueba"
  | "capacitacion_inicial"
  | "honorarios";

export type DocumentType =
  | "ine"
  | "curp"
  | "rfc_sat"
  | "nss"
  | "comprobante_domicilio"
  | "contrato_laboral"
  | "carta_antecedentes"
  | "examen_medico"
  | "comprobante_estudios";

export const DOSSIER_DOC_TYPE_LABELS: Record<DocumentType, string> = {
  comprobante_estudios: "Comprobante de Estudios / Certificado",
  ine: "Identificación Oficial (INE / Pasaporte)",
  curp: "CURP",
  rfc_sat: "Constancia de Situación Fiscal (RFC / SAT)",
  nss: "Número de Seguridad Social (NSS / IMSS)",
  comprobante_domicilio: "Comprobante de Domicilio",
  contrato_laboral: "Contrato / Constancia Laboral",
  carta_antecedentes: "Carta de Recomendación / Antecedentes",
  examen_medico: "Certificado / Examen Médico",
};

export type VacationRequestType =
  | "vacaciones"
  | "permiso_con_goce"
  | "permiso_sin_goce"
  | "dias_economicos"
  | "matrimonio"
  | "paternidad"
  | "maternidad"
  | "luto";

export type RequestStatus = "pendiente" | "visto_bueno" | "aprobada" | "rechazada";

export interface EmployeeDocument {
  id: string;
  docType: DocumentType;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes?: number;
  uploadedAt: string;
  status: "validado" | "pendiente" | "rechazado";
}

export interface PositionHistoryItem {
  id: string;
  jobTitle: string;
  department: string;
  startDate: string;
  endDate: string | "Actual";
  salary: number;
  promotionReason?: string;
}

export interface VacationBalance {
  hireDate: string;
  yearsOfService: number;
  totalDaysAccruedLFT: number; // e.g. 12 or 14 based on LFT
  daysTaken: number;
  daysPendingApproval: number;
  daysAvailable: number;
  nextPeriodDate: string;
  premiumPercentage?: number;
  estimatedVacationPremiumMxn?: number;
}

export interface VacationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  avatarUrl?: string | null;
  department: string;
  requestType: VacationRequestType;
  typeLabel: string;
  startDate: string;
  endDate: string;
  totalWorkingDays: number;
  reason?: string;
  status: RequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface PerformanceReview {
  id: string;
  period: string; // e.g. "Q2 2026 - Evaluación Trimestral"
  evaluationDate: string;
  evaluatorName: string;
  score: number; // 1 to 5
  strengths: string[];
  growthAreas: string[];
  goalsMet: string;
  generalComments: string;
}

export interface EmployeeDossier {
  id: string;
  candidateId?: string;
  fullName: string;
  avatarUrl?: string | null;
  email: string;
  phone: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  rfc: string;
  curp: string;
  nss: string;
  birthDate: string;
  address: string;
  nationality: string;

  // Job & Contract
  jobTitle: string;
  department: string;
  branchName: string;
  hireDate: string;
  yearsOfServiceFormatted: string;
  contractType: ContractType;
  contractTypeLabel: string;
  contractStartDate: string;
  contractEndDate?: string | null;
  baseSalaryMonthly: number;
  dailyIntegratedSalary: number; // SDI
  paymentFrequency: "quincenal" | "semanal" | "mensual";
  workSchedule: string; // "Lunes a Viernes 08:00 - 17:00"
  status: "activo" | "baja" | "en_permiso";

  // Sub-modules
  documents: EmployeeDocument[];
  positionHistory: PositionHistoryItem[];
  vacationBalance: VacationBalance;
  vacationRequests: VacationRequest[];
  performanceReviews: PerformanceReview[];

  // Attendance metrics summary
  attendanceSummary: {
    punctualityRate: number;
    totalDaysPresent: number;
    totalLateArrivals: number;
    totalAbsences: number;
    totalOvertimeHours: number;
  };
}
