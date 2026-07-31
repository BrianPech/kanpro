import { z } from "zod";

export const companyRegisterSchema = z.object({
  full_name: z.string().min(2, "El nombre de la empresa es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const candidateRegisterSchema = z.object({
  fullName: z.string().min(2, "Por favor ingresa tu nombre completo"),
  birthDate: z.string().min(1, "Por favor selecciona tu fecha de nacimiento"),
  whatsappNumber: z.string().min(1, "Por favor ingresa tu WhatsApp de contacto"),
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const adminRegisterSchema = z.object({
  fullName: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export type CompanyRegisterValues = z.infer<typeof companyRegisterSchema>;
export type CandidateRegisterValues = z.infer<typeof candidateRegisterSchema>;
export type AdminRegisterValues = z.infer<typeof adminRegisterSchema>;
