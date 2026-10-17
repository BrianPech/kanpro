import { z } from "zod";
import { MexicanRFC, MexicanCURP, MexicanNSS } from "../utils/mexican-identifiers";

const uuidSchema = z
  .string()
  .uuid({ message: "El identificador debe ser un UUID válido." });

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
  hire_date: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "La fecha de ingreso debe tener formato YYYY-MM-DD.",
    }),
  base_salary_monthly: z
    .number()
    .positive("El salario debe ser un número positivo.")
    .optional()
    .nullable(),
  payment_frequency: z.enum(["semanal", "catorcenal", "quincenal", "mensual"]).default("quincenal"),
  work_schedule: z.string().optional().nullable(),
  rfc: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || MexicanRFC.isValid(val), {
      message: "El RFC no cumple con el formato oficial del SAT (12 o 13 caracteres alfanuméricos válidos).",
    }),
  curp: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || MexicanCURP.isValid(val), {
      message: "La CURP no cumple con el formato oficial de RENAPO (18 caracteres alfanuméricos).",
    }),
  nss: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || MexicanNSS.isValid(val), {
      message: "El NSS debe contener exactamente 11 dígitos numéricos.",
    }),
  notes: z.string().optional().nullable(),
});

export type CompanyEmployeeFormValues = z.infer<typeof companyEmployeeSchema>;

export const terminateEmployeeSchema = z.object({
  employeeId: uuidSchema,
  reason: z
    .string()
    .min(3, "El motivo de la baja es requerido (mínimo 3 caracteres).")
    .max(500, "El motivo no puede exceder 500 caracteres."),
  notes: z.string().max(1000, "Las notas no pueden exceder 1000 caracteres.").optional().nullable(),
});

export type TerminateEmployeeInput = z.infer<typeof terminateEmployeeSchema>;

export const reactivateEmployeeSchema = z.object({
  employeeId: uuidSchema,
});

export type ReactivateEmployeeInput = z.infer<typeof reactivateEmployeeSchema>;

export const updateEmployeeStartDateSchema = z.object({
  employeeId: uuidSchema,
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de inicio debe tener formato YYYY-MM-DD."),
});

export type UpdateEmployeeStartDateInput = z.infer<typeof updateEmployeeStartDateSchema>;

export const hireCandidateSchema = z.object({
  applicationId: uuidSchema,
  candidateId: uuidSchema,
  jobTitle: z
    .string()
    .min(2, "El puesto de trabajo es requerido.")
    .max(120, "El puesto no puede exceder 120 caracteres."),
  department: z
    .string()
    .min(2, "El departamento es requerido.")
    .max(100, "El departamento no puede exceder 100 caracteres.")
    .default("Operaciones"),
  templateType: z.string().default("indeterminado"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de ingreso debe tener formato YYYY-MM-DD."),
  salary: z
    .number()
    .positive("El salario debe ser un número positivo."),
  paymentFrequency: z.string().optional().default("quincenal"),
  contractFolio: z.string().optional().nullable(),
  signatureData: z.string().optional().nullable(),
});

export type HireCandidateInput = z.infer<typeof hireCandidateSchema>;

export const registerDirectEmployeeSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(3, "El nombre completo debe tener al menos 3 caracteres.")
      .max(120, "El nombre no puede exceder 120 caracteres."),
    email: z
      .string()
      .trim()
      .email("Ingresa un correo electrónico válido.")
      .toLowerCase(),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirm_password: z
      .string()
      .min(1, "Debes confirmar la contraseña."),
    force_password_change: z
      .boolean()
      .default(true),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm_password"],
  });

export type RegisterDirectEmployeeValues = z.infer<typeof registerDirectEmployeeSchema>;

