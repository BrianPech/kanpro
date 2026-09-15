import { z } from "zod";

export const companyEmployeeSchema = z.object({
  full_name: z
    .string()
    .min(3, "El nombre completo debe tener al menos 3 caracteres.")
    .max(120, "El nombre no puede exceder 120 caracteres."),
  job_title: z
    .string()
    .min(2, "El puesto de trabajo es requerido.")
    .max(100, "El puesto no puede exceder 100 caracteres."),
  department: z.string().optional().default("Operaciones"),
  employee_code: z.string().optional().nullable(),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.trim().length >= 10, {
      message: "Ingresa un número telefónico válido (al menos 10 dígitos).",
    }),
  email: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Ingresa un correo electrónico válido.",
    }),
  hire_date: z.string().optional().nullable(),
  base_salary_monthly: z
    .number()
    .positive("El salario debe ser un número positivo.")
    .optional()
    .nullable(),
  payment_frequency: z.enum(["semanal", "catorcenal", "quincenal", "mensual"]).default("quincenal"),
  work_schedule: z.string().optional().nullable(),
  rfc: z.string().optional().nullable(),
  curp: z.string().optional().nullable(),
  nss: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CompanyEmployeeFormValues = z.infer<typeof companyEmployeeSchema>;
