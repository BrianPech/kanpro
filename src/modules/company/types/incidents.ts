export const INCIDENT_EVIDENCE_BUCKET = "incident_evidence";

export type IncidentCategory =
  | "falta_injustificada"
  | "retardo"
  | "accidente"
  | "queja"
  | "permiso"
  | "suspension"
  | "incumplimiento"
  | "reconocimiento"
  | "incapacidad"
  | "otro";

export type IncidentSeverity = "baja" | "media" | "alta" | "critica";
export type IncidentStatus =
  | "pendiente"
  | "por_aclarar"
  | "en_revision"
  | "aprobado"
  | "rechazado"
  | "resuelto";

export interface LaborIncident {
  id: string;
  employeeId: string;
  employeeName: string;
  avatarUrl?: string | null;
  jobTitle: string;
  department: string;

  category: IncidentCategory;
  categoryLabel: string;
  title: string;
  description: string;
  incidentDate: string;
  severity: IncidentSeverity;

  // Evidence
  evidenceUrl?: string;
  evidenceFileName?: string;
  evidenceType?: "documento" | "foto" | "receta_medica" | "acta_administrativa";

  responsibleSupervisor: string;
  status: IncidentStatus;
  clarificationDeadline?: string;
  resolutionNotes?: string;
  createdAt: string;

  // Respuesta del trabajador (portal del colaborador)
  notifiedAt?: string;
  acknowledgedAt?: string;
  employeeStatement?: string;
  employeeStatementAt?: string;

  // Captura oficial de incapacidad IMSS
  folioImss?: string;
  diasAmparados?: number;
  ramoImss?: "enfermedad_general" | "riesgo_trabajo" | "maternidad";
  complementoEmpresa?: number;
}
