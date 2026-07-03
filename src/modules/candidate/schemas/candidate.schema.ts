import { z } from "zod";

export const experienceItemSchema = z.object({
  company: z.string().min(1, "El nombre de la empresa es requerido"),
  role: z.string().min(1, "El puesto es requerido"),
  period: z.string().min(1, "El período (ej. 2022 - Presente) es requerido"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
});

export const candidateProfileSchema = z.object({
  full_name: z.string().min(2, "El nombre completo debe tener al menos 2 caracteres"),
  headline: z.string().min(2, "El área profesional es requerida (ej. Diseñador, Desarrollador)"),
  experience_summary: z.string().min(10, "El resumen de experiencia debe tener al menos 10 caracteres"),
  whatsapp_number: z.string().min(8, "Por favor, ingrese un número de WhatsApp válido"),
  location: z.string().min(2, "La ubicación es requerida"),
  skills: z.array(z.string()).min(1, "Debe agregar al menos una habilidad"),
  experience: z.array(experienceItemSchema),
  portfolio_links: z.array(z.string().url("Enlace de portafolio no válido")),
  show_phone: z.boolean(),
});

export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type CandidateProfileFormValues = z.infer<typeof candidateProfileSchema>;
