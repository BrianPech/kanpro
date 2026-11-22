import { z } from "zod";

export const companyOnboardingWorkspaceSchema = z.object({
  company_name: z
    .string()
    .trim()
    .min(2, "El nombre de la empresa debe tener al menos 2 caracteres")
    .max(120, "El nombre no puede exceder 120 caracteres"),
  location: z
    .string()
    .trim()
    .min(3, "La ubicación de la empresa es obligatoria"),
  leave_approval_mode: z.enum(["single_step", "two_step"]).optional(),
});

export type CompanyOnboardingWorkspaceValues = z.infer<
  typeof companyOnboardingWorkspaceSchema
>;
