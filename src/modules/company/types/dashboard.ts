export type ContractStatus = "imminent" | "upcoming" | "normal";

export interface ContractExpirationItem {
  id: string;
  employeeId: string;
  employeeName: string;
  avatarUrl: string | null;
  jobTitle: string;
  department: string;
  contractType: string;
  startDate?: string;
  endDate: string;
  daysRemaining: number;
  status: ContractStatus;
}

export type IncidentType =
  | "permiso"
  | "incapacidad"
  | "falta_injustificada"
  | "horas_extra"
  | "retardo"
  | "vacaciones"
  | "otro";

export type IncidentSeverity = "baja" | "media" | "alta" | "critica";
export type IncidentStatus = "pendiente" | "por_aclarar" | "aprobado" | "rechazado" | "en_revision";

export interface PendingIncidentItem {
  id: string;
  employeeId: string;
  employeeName: string;
  avatarUrl: string | null;
  department: string;
  type: IncidentType;
  typeLabel: string;
  title: string;
  description: string;
  date: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  hoursRequested?: number;
}

export type AttendanceStatus = "presente" | "ausente" | "retardo" | "justificado" | "vacaciones";

export interface TodayAttendanceItem {
  id: string;
  employeeId: string;
  employeeName: string;
  avatarUrl: string | null;
  jobTitle: string;
  department: string;
  checkInTime: string | null;
  status: AttendanceStatus;
  delayMinutes?: number;
}

export interface PayrollSummaryData {
  periodName: string;
  periodDates?: string;
  frequency: "quincenal" | "semanal" | "mensual";
  cutoffDate: string;
  paymentDate: string;
  estimatedTotal: number;
  employeesCount: number;
  status: "preparacion" | "calculada" | "dispersada" | "pagada" | "timbrada";
  daysToPay: number;
  averageSalary: number;
  departmentBreakdown: Array<{
    department: string;
    amount: number;
    headcount: number;
    percentage: number;
  }>;
}

export type AlertSeverity = "critical" | "warning" | "info" | "success";
export type AlertType = "contract" | "attendance" | "incident" | "vacancy" | "payroll" | "legal";

export interface OperationalAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
  timestamp: string;
}

export interface WorkforceKPIs {
  // 1. Trabajadores activos
  totalEmployees: number;
  activeEmployees: number;
  onboardingEmployees: number;
  retentionRate: number; // Porcentaje de retención

  // 2. Trabajadores ausentes
  absentCountToday: number;
  unjustifiedAbsences: number;
  justifiedAbsences: number;

  // 3. Llegadas tarde
  lateArrivalsToday: number;
  punctualityRate: number; // Porcentaje de puntualidad del turno (ej. 95%)

  // 4. Vacantes abiertas
  openVacanciesCount: number;
  totalApplicationsReceived: number;
  pendingReviewApplications: number;

  // 5. Contratos por vencer y activos
  activeContractsCount?: number;
  expiringContractsCount: number; // En los próximos 30 días
  imminentContractsCount: number; // En los próximos 7 días

  // 6. Incidencias pendientes
  pendingIncidentsCount: number;
  criticalIncidentsCount: number;
}

export interface SubscriptionSummary {
  planName: string;
  planKey: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "free" | string;
  periodEnd: string | null;
  daysRemaining: number | null;
  creditsAvailable: number;
  featuredVacanciesAllowance: number;
  featuredVacanciesUsed: number;
  verificationStatus: string | null;
  isEarlyAccess?: boolean;
}

export interface ApplicationsSummary {
  total: number;
  pending: number;
  inReview: number;
  shortlisted: number;
  hired: number;
  rejected: number;
}

export interface RecentCandidateItem {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateHeadline: string;
  candidateAvatar: string | null;
  vacancyId: string;
  vacancyTitle: string;
  status: string;
  appliedAt: string;
  skills?: string[];
  isEarlyAccess?: boolean;
}

export interface CompanyDashboardData {
  companyName: string;
  isEarlyAccess?: boolean;
  kpis: WorkforceKPIs;
  alerts: OperationalAlert[];
  expiringContracts: ContractExpirationItem[];
  pendingIncidents: PendingIncidentItem[];
  todayAttendance: TodayAttendanceItem[];
  payrollSummary: PayrollSummaryData;
  subscriptionSummary?: SubscriptionSummary;
  applicationsSummary?: ApplicationsSummary;
  recentCandidates?: RecentCandidateItem[];
  openVacanciesList: Array<{
    id: string;
    title: string;
    category: string;
    location: string;
    salaryRange?: string;
    applicationsCount: number;
    newApplicationsCount: number;
    createdAt: string;
  }>;
  weeklyAttendanceTrend: Array<{
    day: string;
    asistencia: number;
    retardos: number;
    ausencias: number;
  }>;
  recentActivities?: Array<{
    id: string;
    candidateName: string;
    candidateHeadline?: string;
    candidateAvatar?: string | null;
    vacancyTitle?: string;
    createdAt?: string;
  }>;
}

