import { z } from "zod";

export const departmentColorEnum = z.enum([
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Rose
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#64748b", // Slate
]);

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre del área debe tener al menos 2 caracteres.")
    .max(80, "El nombre del área no puede exceder 80 caracteres."),
  description: z
    .string()
    .trim()
    .max(250, "La descripción no puede exceder 250 caracteres.")
    .optional()
    .or(z.literal("")),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color hexadecimal inválido")
    .default("#6366f1"),
  manager_name: z
    .string()
    .trim()
    .max(100, "El nombre del responsable no puede exceder 100 caracteres.")
    .optional()
    .or(z.literal("")),
});

export const updateDepartmentSchema = z.object({
  id: z.string().uuid("ID de área inválido."),
  name: z
    .string()
    .trim()
    .min(2, "El nombre del área debe tener al menos 2 caracteres.")
    .max(80, "El nombre del área no puede exceder 80 caracteres."),
  description: z
    .string()
    .trim()
    .max(250, "La descripción no puede exceder 250 caracteres.")
    .optional()
    .or(z.literal("")),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color hexadecimal inválido")
    .optional(),
  manager_name: z
    .string()
    .trim()
    .max(100, "El nombre del responsable no puede exceder 100 caracteres.")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().optional(),
});

export const deleteDepartmentSchema = z.object({
  id: z.string().uuid("ID de área inválido."),
});

export const createPresetDepartmentsSchema = z.object({
  names: z
    .array(z.string().trim().min(2).max(80))
    .min(1, "Debe seleccionar al menos un área sugerida."),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type DeleteDepartmentInput = z.infer<typeof deleteDepartmentSchema>;
export type CreatePresetDepartmentsInput = z.infer<typeof createPresetDepartmentsSchema>;
