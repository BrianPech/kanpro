import { z } from "zod";

export const CONTRACT_TYPES = [
  { value: "tiempo_indeterminado", label: "Tiempo Indeterminado (Planta)" },
  { value: "tiempo_determinado", label: "Tiempo Determinado (Temporal)" },
  { value: "periodo_prueba", label: "Periodo de Prueba (30 - 90 días)" },
  { value: "obra_determinada", label: "Por Obra o Proyecto" },
  { value: "honorarios", label: "Honorarios / Servicios Profesionales" },
] as const;

export const paymentFrequencyEnum = z.enum([
  "semanal",
  "catorcenal",
  "quincenal",
  "mensual",
]);

export type InvitationPaymentFrequency = z.infer<typeof paymentFrequencyEnum>;

export const createEmployeeInvitationSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "El nombre completo debe tener al menos 3 caracteres.")
    .max(120, "El nombre no puede exceder 120 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El correo electrónico es requerido para enviar la invitación.")
    .email("Ingresa un correo electrónico válido."),
  position: z
    .string()
    .trim()
    .min(2, "El puesto o cargo es requerido.")
    .max(100, "El puesto no puede exceder 100 caracteres."),
  salary: z
    .number()
    .positive("El salario debe ser un número positivo.")
    .optional()
    .nullable(),
  payment_frequency: paymentFrequencyEnum.optional(),
  hire_date: z.string().optional().nullable(),
  contract_type: z.string().default("tiempo_indeterminado"),
  department: z.string().default("Operaciones"),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.trim().length >= 10, {
      message: "Ingresa un número telefónico válido (al menos 10 dígitos).",
    }),
  employee_code: z.string().optional().nullable(),
  work_schedule: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateEmployeeInvitationValues = z.infer<typeof createEmployeeInvitationSchema>;

export const bulkEmployeeImportRowSchema = z.object({
  full_name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Correo inválido"),
  position: z.string().min(2, "Puesto requerido"),
  salary: z.number().positive().optional().nullable(),
  payment_frequency: paymentFrequencyEnum.optional(),
  hire_date: z.string().optional().nullable(),
  contract_type: z.string().optional().default("tiempo_indeterminado"),
  department: z.string().optional().default("Operaciones"),
  phone: z.string().optional().nullable(),
});
export const bulkEmployeeImportSchema = z
  .array(bulkEmployeeImportRowSchema)
  .min(1, "Debe proporcionar al menos un registro para importar.");

export type BulkEmployeeImportRow = z.infer<typeof bulkEmployeeImportRowSchema>;
export type BulkEmployeeImportInput = z.infer<typeof bulkEmployeeImportSchema>;

export interface BulkImportPreviewItem extends BulkEmployeeImportRow {
  rowIndex: number;
  isValid: boolean;
  errors: string[];
}

export const invitationTokenSchema = z.object({
  rawToken: z.string().min(10, "El token de invitación es inválido."),
});

export type InvitationTokenInput = z.infer<typeof invitationTokenSchema>;

export const acceptEmployeeInvitationSchema = z.object({
  rawToken: z.string().min(10, "El token de invitación es inválido."),
  userId: z.string().uuid("El ID de usuario debe ser un UUID válido."),
  email: z.string().email("El correo electrónico es inválido."),
});

export type AcceptEmployeeInvitationInput = z.infer<typeof acceptEmployeeInvitationSchema>;
