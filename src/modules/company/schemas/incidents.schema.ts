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
  "por_aclarar",
  "en_revision",
  "aprobado",
  "rechazado",
  "resuelto",
]);

const clarificationDeadlineSchema = z
  .string()
  .refine(
    (val) => /^\d{4}-\d{2}-\d{2}$/.test(val) || !Number.isNaN(Date.parse(val)),
    "Fecha límite de aclaración inválida"
  )
  .nullable()
  .optional();

export const evidenceTypeEnum = z.enum([
  "documento",
  "foto",
  "receta_medica",
  "acta_administrativa",
]);

export const imssBranchEnum = z.enum([
  "enfermedad_general",
  "riesgo_trabajo",
  "maternidad",
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
  clarificationDeadline: clarificationDeadlineSchema,
  folioImss: z.string().trim().min(3, "El folio IMSS debe tener al menos 3 caracteres").max(40).optional(),
  diasAmparados: z.number().int().min(1).max(365).optional(),
  ramoImss: imssBranchEnum.optional(),
  complementoEmpresa: z.number().min(0).optional(),
});

export const updateIncidentStatusSchema = z.object({
  incidentId: z.string().min(1, "El ID de la incidencia es requerido"),
  status: incidentStatusEnum,
  clarificationDeadline: clarificationDeadlineSchema,
  resolutionNotes: z.string().max(1000, "Las notas de resolución no pueden exceder 1000 caracteres").optional(),
});

export const deleteIncidentSchema = z.object({
  incidentId: z.string().min(1, "El ID de la incidencia es requerido"),
});

export const incidentReferenceSchema = z.object({
  incidentId: z.string().min(1, "El ID de la incidencia es requerido"),
});

export const prepareEvidenceUploadSchema = z.object({
  fileName: z.string().min(1, "Nombre de archivo requerido").max(255),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>;
export type DeleteIncidentInput = z.infer<typeof deleteIncidentSchema>;

export type PrepareEvidenceUploadInput = z.infer<typeof prepareEvidenceUploadSchema>;
