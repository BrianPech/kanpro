import { z } from "zod";

export const companyRegisterSchema = z.object({
  companyName: z.string().min(2, "El nombre de la empresa es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  industry: z.string().min(2, "Por favor, ingrese su industria"),
  websiteOrLinkedin: z.string().url("Por favor ingrese una URL válida"),
  location: z.string().min(2, "Por favor, ingrese su ubicación"),
});


export const candidateRegisterSchema = z.object({
  fullName: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const adminRegisterSchema = z.object({
  fullName: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export type CompanyRegisterValues = z.infer<typeof companyRegisterSchema>;
export type CandidateRegisterValues = z.infer<typeof candidateRegisterSchema>;
export type AdminRegisterValues = z.infer<typeof adminRegisterSchema>;
