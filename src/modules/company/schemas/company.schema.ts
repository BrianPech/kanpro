import { z } from "zod";

export const companyProfileSchema = z.object({
  company_name: z.string().min(2, "El nombre comercial debe tener al menos 2 caracteres"),
  industry: z.string().min(1, "El sector industrial es requerido"),
  website_or_linkedin: z.string().url("Por favor ingrese una URL válida (ej. https://empresa.com)").or(z.literal("")).optional(),
  location: z.string().min(2, "La ubicación es requerida"),
  logo_url: z.string().optional(),
  description: z.string().max(300, "La bio comercial no puede exceder los 300 caracteres").optional(),
  phone: z.string().optional(),
  company_size: z.string().optional(),
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
  salary_range: z.string().optional(),
  skills: z.string().min(1, "Ingresa al menos una habilidad (separadas por comas)"),
  benefits: z.string().optional(),
});

export type VacancyFormValues = z.infer<typeof vacancySchema>;
