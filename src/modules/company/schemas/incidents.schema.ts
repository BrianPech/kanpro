import { z } from "zod";

export const incidentCategoryEnum = z.enum([
  "falta_injustificada",
  "retardo",
  "accidente",
  "queja",
  "permiso",
  "suspension",
  "incumplimiento",
  "reconocimiento",
  "incapacidad",
  "otro",
]);

export const incidentSeverityEnum = z.enum(["baja", "media", "alta", "critica"]);

export const incidentStatusEnum = z.enum([
  "pendiente",
  "en_revision",
  "aprobado",
  "rechazado",
  "resuelto",
]);

export const evidenceTypeEnum = z.enum([
  "documento",
  "foto",
  "receta_medica",
  "acta_administrativa",
]);

export const createIncidentSchema = z.object({
  employeeId: z.string().nullable().optional(),
  employeeName: z.string().min(1, "El nombre del colaborador es obligatorio").max(120),
  jobTitle: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  category: incidentCategoryEnum,
  categoryLabel: z.string().max(100).optional(),
  title: z.string().min(1, "El título de la incidencia es obligatorio").max(200),
  description: z.string().min(1, "La descripción es obligatoria").max(3000),
  incidentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
    .optional(),
  severity: incidentSeverityEnum.optional(),
  responsibleSupervisor: z.string().max(120).optional(),
  evidenceUrl: z.string().optional(),
  evidenceFileName: z.string().max(255).optional(),
  evidenceType: evidenceTypeEnum.optional(),
  status: incidentStatusEnum.optional(),
});

export const updateIncidentStatusSchema = z.object({
  incidentId: z.string().min(1, "El ID de la incidencia es requerido"),
  status: incidentStatusEnum,
  resolutionNotes: z.string().max(1000, "Las notas de resolución no pueden exceder 1000 caracteres").optional(),
});

export const deleteIncidentSchema = z.object({
  incidentId: z.string().min(1, "El ID de la incidencia es requerido"),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>;
export type DeleteIncidentInput = z.infer<typeof deleteIncidentSchema>;
