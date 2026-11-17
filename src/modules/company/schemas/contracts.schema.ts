import { z } from "zod";

export const contractTemplateTypes = [
  "indeterminado",
  "determinado",
  "periodo_prueba",
  "capacitacion_inicial",
  "honorarios",
  "obra_determinada",
] as const;

const uuidSchema = z
  .string()
  .uuid({ message: "El identificador debe ser un UUID válido." });

export const createContractSchema = z
  .object({
    employeeId: uuidSchema.optional().nullable(),
    employeeName: z
      .string()
      .trim()
      .min(2, "El nombre del colaborador debe tener al menos 2 caracteres.")
      .max(160, "El nombre del colaborador no puede exceder 160 caracteres.")
      .optional()
      .nullable(),
    candidateId: uuidSchema.optional().nullable(),
    applicationId: uuidSchema.optional().nullable(),
    folio: z.string().optional().nullable(),
    jobTitle: z
      .string()
      .min(2, "El puesto es requerido y debe tener al menos 2 caracteres.")
      .max(120, "El puesto no puede exceder 120 caracteres."),
    department: z
      .string()
      .min(2, "El departamento es requerido.")
      .max(100, "El departamento no puede exceder 100 caracteres.")
      .default("Operaciones"),
    contractType: z
      .string()
      .min(2, "El tipo de contrato es requerido."),
    templateType: z.enum(contractTemplateTypes),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de inicio debe tener el formato YYYY-MM-DD."),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de fin debe tener el formato YYYY-MM-DD.")
      .optional()
      .nullable(),
    salary: z
      .number()
      .positive("El salario mensual debe ser un valor positivo mayor a 0."),
    paymentFrequency: z
      .string()
      .optional()
      .default("quincenal"),
    companySigned: z.boolean().optional().default(false),
    companySignatureUrl: z.string().optional().nullable(),
    employeeSigned: z.boolean().optional().default(false),
    employeeSignatureUrl: z.string().optional().nullable(),
    status: z
      .enum(["vigente", "proximo_a_vencer", "imminent", "en_firma"])
      .optional(),
    notes: z.string().max(1000, "Las notas no pueden exceder 1000 caracteres.").optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.templateType === "determinado" || data.templateType === "periodo_prueba") {
        if (data.endDate && data.startDate) {
          return new Date(data.endDate) >= new Date(data.startDate);
        }
      }
      return true;
    },
    {
      message: "La fecha de término del contrato no puede ser anterior a la fecha de inicio.",
      path: ["endDate"],
    }
  );

export type CreateContractInput = z.infer<typeof createContractSchema>;

export const renewContractSchema = z
  .object({
    contractId: uuidSchema,
    templateType: z.enum(contractTemplateTypes),
    contractType: z.string().min(2, "El tipo de contrato es requerido."),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de fin debe tener el formato YYYY-MM-DD.")
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.templateType !== "indeterminado" && !data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: "Se requiere especificar la fecha de término para contratos temporales o de prueba.",
      path: ["endDate"],
    }
  );

export type RenewContractInput = z.infer<typeof renewContractSchema>;

export const signContractSchema = z.object({
  contractId: uuidSchema,
  signerRole: z.enum(["representante_legal", "trabajador"]),
  signatureUrl: z
    .string()
    .min(10, "Los datos o URL de la firma son obligatorios."),
  isNowFullySigned: z.boolean().default(false),
});

export type SignContractInput = z.infer<typeof signContractSchema>;

export const deleteContractSchema = z.object({
  contractId: uuidSchema,
});

export type DeleteContractInput = z.infer<typeof deleteContractSchema>;
