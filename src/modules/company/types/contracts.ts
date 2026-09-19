export type ContractTemplateType =
  | "indeterminado"
  | "determinado"
  | "periodo_prueba"
  | "capacitacion_inicial"
  | "honorarios";

export type ContractStatus = "vigente" | "proximo_a_vencer" | "vencido" | "en_firma" | "renovado";

export interface DigitalSignature {
  signerName: string;
  signerRole: "representante_legal" | "trabajador";
  signerEmail?: string;
  signerRfc?: string;
  signatureDataUrl: string; // Base64 canvas or drawn signature
  signedAt: string;
  certificateHash: string; // SHA-256 hash
  ipAddress?: string;
}

export interface ContractAddendum {
  id: string;
  title: string;
  effectiveDate: string;
  description: string;
  modifiedClause: string;
  signedBy: string;
}

export interface EmploymentContract {
  id: string;
  folio: string; // e.g. "KAN-CTR-2026-089"
  employeeId: string;
  employeeName: string;
  employeeRfc: string;
  employeeCurp: string;
  employeeAddress: string;
  avatarUrl?: string | null;
  
  jobTitle: string;
  department: string;
  companyName: string;
  companyRfc: string;
  companyAddress: string;
  legalRepName: string;

  templateType: ContractTemplateType;
  templateName: string;
  startDate: string;
  endDate?: string | null; // null for indeterminado
  daysRemaining?: number;

  baseSalaryMonthly: number;
  dailyIntegratedSalary: number;
  paymentFrequency: "quincenal" | "semanal" | "mensual";
  workSchedule: string;
  probationDays?: number;

  status: ContractStatus;
  companySignature?: DigitalSignature | null;
  employeeSignature?: DigitalSignature | null;
  addendums: ContractAddendum[];
  pdfUrl?: string;
  createdAt: string;
}
