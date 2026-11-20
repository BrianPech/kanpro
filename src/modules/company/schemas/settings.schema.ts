import { z } from "zod";

const uuidOrIdSchema = z.string().min(1, "El identificador es requerido.");

export const toggleGlobalRecruitmentSchema = z.object({
  companyId: uuidOrIdSchema,
  pause: z.boolean(),
});

export type ToggleGlobalRecruitmentInput = z.infer<typeof toggleGlobalRecruitmentSchema>;

export const updateContactChannelSchema = z.object({
  companyId: uuidOrIdSchema,
  channel: z.enum(["whatsapp", "phone", "inbox"], {
    message: "El canal de contacto debe ser 'whatsapp', 'phone' o 'inbox'.",
  }),
});

export type UpdateContactChannelInput = z.infer<typeof updateContactChannelSchema>;

export const updateSubscriptionPlanSchema = z.object({
  companyId: uuidOrIdSchema,
  plan: z.enum(["basic", "pro", "enterprise"], {
    message: "El plan de suscripción debe ser 'basic', 'pro' o 'enterprise'.",
  }),
});

export type UpdateSubscriptionPlanInput = z.infer<typeof updateSubscriptionPlanSchema>;

export const branchGeofenceSchema = z.object({
  branchName: z
    .string()
    .min(2, "El nombre de la sucursal debe tener al menos 2 caracteres.")
    .max(120, "El nombre de la sucursal no puede exceder 120 caracteres."),
  address: z
    .string()
    .min(5, "La dirección física debe tener al menos 5 caracteres.")
    .max(255, "La dirección física no puede exceder 255 caracteres."),
  latitude: z
    .number()
    .min(-90, "La latitud debe estar entre -90 y 90.")
    .max(90, "La latitud debe estar entre -90 y 90."),
  longitude: z
    .number()
    .min(-180, "La longitud debe estar entre -180 y 180.")
    .max(180, "La longitud debe estar entre -180 y 180."),
  radiusMeters: z
    .number()
    .min(10, "El radio mínimo de geocerca es 10 metros.")
    .max(5000, "El radio máximo de geocerca es 5,000 metros.")
    .default(150),
});

export type BranchGeofenceInput = z.infer<typeof branchGeofenceSchema>;

export const updateCompanyBranchesSchema = z.object({
  companyId: uuidOrIdSchema,
  branches: z
    .array(branchGeofenceSchema)
    .min(1, "Debe registrar al menos una sucursal con geocerca activa."),
});

export type UpdateCompanyBranchesInput = z.infer<typeof updateCompanyBranchesSchema>;

export const getCompanyInvoicesSchema = z.object({
  companyId: uuidOrIdSchema,
});

export type GetCompanyInvoicesInput = z.infer<typeof getCompanyInvoicesSchema>;

export const updateCompanyAccountPhoneSchema = z.object({
  companyId: uuidOrIdSchema,
  phone: z
    .string()
    .trim()
    .min(10, "Ingresa un teléfono válido de al menos 10 dígitos.")
    .max(20, "El teléfono no puede exceder 20 caracteres."),
});

export type UpdateCompanyAccountPhoneInput = z.infer<typeof updateCompanyAccountPhoneSchema>;
