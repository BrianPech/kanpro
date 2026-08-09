import { z } from "zod";

const passwordValidation = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "La contraseña debe contener al menos una letra mayúscula")
  .regex(/[0-9]/, "La contraseña debe contener al menos un número");

export const companyRegisterSchema = z.object({
  full_name: z.string().trim().min(2, "El nombre de la empresa es muy corto"),
  email: z.string().trim().toLowerCase().email("Correo electrónico inválido"),
  password: passwordValidation,
});

export const candidateRegisterSchema = z.object({
  fullName: z.string().trim().min(2, "Por favor ingresa tu nombre completo"),
  birthDate: z
    .string()
    .trim()
    .min(1, "Por favor selecciona tu fecha de nacimiento")
    .refine(
      (val) => !isNaN(Date.parse(val)),
      "Por favor ingresa una fecha de nacimiento válida"
    ),
  whatsappNumber: z
    .string()
    .trim()
    .regex(
      /^\+?[0-9\s\-]{8,18}$/,
      "Por favor ingresa un número de WhatsApp / teléfono válido"
    ),
  email: z.string().trim().toLowerCase().email("Ingresa un correo electrónico válido"),
  password: passwordValidation,
});

export const adminRegisterSchema = z.object({
  fullName: z.string().trim().min(2, "El nombre es muy corto"),
  email: z.string().trim().toLowerCase().email("Correo electrónico inválido"),
  password: passwordValidation,
});

export type CompanyRegisterValues = z.infer<typeof companyRegisterSchema>;
export type CandidateRegisterValues = z.infer<typeof candidateRegisterSchema>;
export type AdminRegisterValues = z.infer<typeof adminRegisterSchema>;

