import { z } from "zod";

export const companyRegisterSchema = z.object({
  companyName: z.string().min(2, "El nombre de la empresa es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  industry: z.string().min(2, "Por favor, ingrese su industria"),
});

export const professionalRegisterSchema = z.object({
  fullName: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  specialty: z.string().min(2, "Por favor, ingrese su especialidad"),
});

export const candidateRegisterSchema = z.object({
  fullName: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export type CompanyRegisterValues = z.infer<typeof companyRegisterSchema>;
export type ProfessionalRegisterValues = z.infer<typeof professionalRegisterSchema>;
export type CandidateRegisterValues = z.infer<typeof candidateRegisterSchema>;
