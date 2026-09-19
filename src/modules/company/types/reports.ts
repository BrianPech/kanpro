export type ReportCategoryGroup =
  | "all"
  | "talento"
  | "legal"
  | "finanzas"
  | "evaluaciones";

export type ReportKey =
  | "censo_plantilla"
  | "vacaciones_lft"
  | "contratos_vigencias"
  | "costos_nomina"
  | "evaluaciones_desempeno"
  | "vacantes_atraccion";

export interface ReportColumn {
  key: string;
  label: string;
  format?: "currency" | "date" | "badge" | "number" | "text";
}

export interface ReportDefinition {
  id: ReportKey;
  title: string;
  category: ReportCategoryGroup;
  categoryLabel: string;
  description: string;
  recommendedFrequency: string;
  columns: ReportColumn[];
  data: Record<string, any>[];
  recordCount: number;
}

export interface ReportsExecutiveKPIs {
  activeEmployees: number;
  totalEmployees: number;
  retentionRate: number;
  totalMonthlyPayroll: number;
  averageSalary: number;
  totalAccruedVacationDays: number;
  totalContractsCount: number;
  totalEvaluationsCount: number;
  evaluationsAverageScore: number;
}

export interface QuickInsight {
  id: string;
  question: string;
  category: string;
  headline: string;
  metric: string;
  metricSubtitle: string;
  badge: string;
  badgeColor?: string;
  explanation: string;
  linkHref?: string;
  linkLabel?: string;
}

export interface CompanyReportsData {
  companyName: string;
  kpis: ReportsExecutiveKPIs;
  insights: QuickInsight[];
  reports: ReportDefinition[];
  departments: string[];
}
