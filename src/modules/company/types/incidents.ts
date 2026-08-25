export type IncidentCategory =
  | "falta_injustificada"
  | "retardo"
  | "accidente"
  | "queja"
  | "permiso"
  | "suspension"
  | "incumplimiento"
  | "reconocimiento";

export type IncidentSeverity = "baja" | "media" | "alta" | "critica";
export type IncidentStatus = "pendiente" | "en_revision" | "aprobado" | "rechazado" | "resuelto";

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
  resolutionNotes?: string;
  createdAt: string;
}
