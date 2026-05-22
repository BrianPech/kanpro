import { z } from "zod";

export const companyRegisterSchema = z.object({
  companyName: z.string().min(2, "El nombre de la empresa es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  industry: z.string().min(2, "Por favor, ingrese su industria"),
  websiteOrLinkedin: z.string().url("Por favor ingrese una URL válida"),
  location: z.string().min(2, "Por favor, ingrese su ubicación"),
});

export const professionalRegisterSchema = z.object({
  fullName: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  birthDate: z.string().refine((date) => {
    if (!date) return false;
    const birthDate = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  }, { message: "Debes ser mayor de 18 años" }),
  category: z.string().min(2, "Por favor, seleccione una categoría"),
  location: z.string().min(2, "Por favor, ingrese su ubicación"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
});

export const candidateRegisterSchema = z.object({
  fullName: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export type CompanyRegisterValues = z.infer<typeof companyRegisterSchema>;
export type ProfessionalRegisterValues = z.infer<typeof professionalRegisterSchema>;
export type CandidateRegisterValues = z.infer<typeof candidateRegisterSchema>;
