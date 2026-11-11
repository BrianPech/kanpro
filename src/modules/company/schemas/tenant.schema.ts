import { z } from "zod";

export const companyRoleSchema = z.enum(["owner", "admin", "recruiter", "viewer"]);
export type CompanyMemberRole = z.infer<typeof companyRoleSchema>;

export const createCompanySchema = z.object({
  company_name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no puede exceder 120 caracteres"),
  legal_name: z
    .string()
    .trim()
    .max(150, "La razón social no puede exceder 150 caracteres")
    .optional(),
  rfc: z
    .string()
    .trim()
    .transform((val) => (val ? val.toUpperCase() : val))
    .optional(),
  industry: z
    .string()
    .trim()
    .min(2, "Selecciona o ingresa una industria"),
  company_size: z.string().optional(),
  location: z
    .string()
    .trim()
    .min(3, "La ubicación fiscal o comercial es obligatoria"),
  address_details: z.string().optional(),
  contact_phone: z.string().optional(),
  website_url: z.string().optional(),
  description: z.string().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const switchActiveCompanySchema = z.object({
  companyId: z.string().uuid("ID de empresa inválido"),
});

export type SwitchActiveCompanyInput = z.infer<typeof switchActiveCompanySchema>;

export const updateOwnerNameSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
});

export type UpdateOwnerNameInput = z.infer<typeof updateOwnerNameSchema>;

export const ACTIVE_COMPANY_COOKIE = "kanpro_active_company";
