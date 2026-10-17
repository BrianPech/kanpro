import { z } from "zod";

export const companyProfileSchema = z.object({
  company_name: z.string().min(2, "El nombre comercial debe tener al menos 2 caracteres"),
  legal_name: z.string().optional().or(z.literal("")),
  industry: z.string().min(1, "El sector industrial es requerido"),
  website: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        try {
          const urlToTest = val.startsWith("http://") || val.startsWith("https://") ? val : `https://${val}`;
          const parsed = new URL(urlToTest);
          return parsed.hostname.includes(".") && !parsed.hostname.endsWith(".");
        } catch {
          return false;
        }
      },
      { message: "Introduce una URL válida" }
    ),
  location: z.string().min(2, "La ubicación es requerida"),
  logo_url: z.string().optional(),
  description: z.string().max(300, "La bio comercial no puede exceder los 300 caracteres").optional(),
  phone: z.string().optional(),
  company_size: z.string().optional(),
  fiscal_regime: z.enum(["persona_moral", "persona_fisica"]).optional(),
  rfc: z.string().optional().or(z.literal("")),
  // Optional benefits and shift fields
  banner_url: z.string().optional(),
  instagram_url: z.string().optional(),
  facebook_url: z.string().optional(),
  address_details: z.string().optional().or(z.literal("")),
  has_transport: z.boolean().optional(),
  benefit_canteen: z.boolean().optional(),
  benefit_tips: z.boolean().optional(),
  benefit_imss: z.boolean().optional(),
  benefit_uniforms: z.boolean().optional(),
  benefit_growth: z.boolean().optional(),
  operation_hours: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.rfc && data.rfc.trim().length > 0 && data.fiscal_regime) {
    const cleaned = data.rfc.toUpperCase().trim();
    if (data.fiscal_regime === "persona_moral") {
      const pmRegex = /^[A-Z&Ñ]{3}\d{6}[A-Z0-9]{3}$/;
      if (cleaned.length !== 12 || !pmRegex.test(cleaned)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El RFC de Persona Moral debe tener exactamente 12 caracteres (3 letras + 6 dígitos + 3 homoclave)",
          path: ["rfc"],
        });
      }
    } else if (data.fiscal_regime === "persona_fisica") {
      const pfRegex = /^[A-Z&Ñ]{4}\d{6}[A-Z0-9]{3}$/;
      if (cleaned.length !== 13 || !pfRegex.test(cleaned)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El RFC de Persona Física debe tener exactamente 13 caracteres (4 letras + 6 dígitos + 3 homoclave)",
          path: ["rfc"],
        });
      }
    }
  }
});


export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

export const vacancySchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  requirements: z.string().min(10, "Los requisitos o descripción del puesto deben tener al menos 10 caracteres"),
  modality: z.enum(["Remoto", "Híbrido", "Presencial"]),
  city: z.string().min(1, "La ciudad es requerida"),
  zone: z.string().min(1, "La zona o área de trabajo es requerida"),
  location: z.string().optional(),
  category: z.string().optional(),
  seniority: z.string().optional(),
  contract_type: z.string().optional(),
  employment_type: z.string().optional(),
  vacancies_count: z.coerce.number().int().min(1, "Debe haber al menos 1 vacante"),
  application_deadline: z.string().optional(),
  salary_min: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const parsedValue = Number(value);
    return Number.isNaN(parsedValue) ? undefined : parsedValue;
  }, z.number().positive().optional()),
  salary_max: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const parsedValue = Number(value);
    return Number.isNaN(parsedValue) ? undefined : parsedValue;
  }, z.number().positive().optional()),
  currency: z.enum(["USD", "EUR", "MXN", "ARS", "COP"]),
  skills: z.string().min(1, "Ingresa al menos una habilidad (separadas por comas)"),
  benefits: z.string().optional(),
});

export type VacancyFormValues = z.infer<typeof vacancySchema>;
