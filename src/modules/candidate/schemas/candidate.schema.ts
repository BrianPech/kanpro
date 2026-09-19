import { z } from "zod";

export const experienceItemSchema = z.object({
  company: z.string().min(1, "El nombre de la empresa es requerido"),
  role: z.string().min(1, "El puesto es requerido"),
  period: z.string().min(1, "El período (ej. 2022 - Presente) es requerido"),
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
});

export const educationItemSchema = z.object({
  institution: z.string().min(1, "La institución es requerida"),
  degree: z.string().min(1, "El título o grado es requerido"),
  period: z.string().min(1, "El período es requerido"),
  description: z.string().optional(),
});

export const candidateProfileSchema = z.object({
  full_name: z.string().min(2, "El nombre completo debe tener al menos 2 caracteres"),
  headline: z.string().optional().or(z.literal("")),
  experience_summary: z.string().optional().or(z.literal("")),
  whatsapp_number: z.string().min(8, "Por favor, ingrese un número de WhatsApp válido"),
  city: z.string().optional().or(z.literal("")),
  zone: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  skills: z.array(z.string()).optional(),
  experience: z.array(experienceItemSchema).optional(),
  education: z.array(educationItemSchema).optional(),
  portfolio_links: z.array(z.string()).optional(),
  show_phone: z.boolean().optional(),
});

export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type CandidateProfileFormValues = z.infer<typeof candidateProfileSchema>;

