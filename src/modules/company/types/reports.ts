export type ReportCategory =
  | "asistencia_mensual"
  | "horas_trabajadas"
  | "faltas_retardos"
  | "rotacion_personal"
  | "vacaciones_lft"
  | "incidencias_clima"
  | "censo_plantilla"
  | "costos_nomina";

export interface ReportItemDefinition {
  id: ReportCategory;
  title: string;
  category: "operaciones" | "talento" | "finanzas" | "legal";
  description: string;
  iconName: string;
  recommendedFrequency: string;
  fieldsIncluded: string[];
}

export interface QuickInsightAnswer {
  id: string;
  question: string;
  category: string;
  headline: string;
  metric: string;
  metricSubtitle: string;
  badge: string;
  badgeColor?: string;
  employeeHighlight?: {
    name: string;
    jobTitle: string;
    department: string;
    detail: string;
    employeeId: string;
  };
  explanation: string;
}
