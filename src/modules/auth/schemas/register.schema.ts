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

import { normalizeDateToISO, normalizePhone } from "@/lib/formatters";

export const candidateRegisterSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Por favor ingresa tu nombre completo")
    .max(100, "El nombre es muy largo"),
  birthDate: z
    .string()
    .trim()
    .min(1, "Por favor selecciona tu fecha de nacimiento")
    .transform((val) => normalizeDateToISO(val) || val)
    .refine(
      (val) => {
        const iso = normalizeDateToISO(val);
        if (!iso) return false;
        const [year, month, day] = iso.split("-").map(Number);
        if (!year || !month || !day) return false;
        const d = new Date(year, month - 1, day);
        return !isNaN(d.getTime()) && d.getDate() === day;
      },
      "Por favor ingresa una fecha de nacimiento válida"
    )
    .refine(
      (val) => {
        const iso = normalizeDateToISO(val);
        if (!iso) return false;
        const [year, month, day] = iso.split("-").map(Number);
        const birth = new Date(year, month - 1, day);
        const today = new Date();
        return birth <= today;
      },
      "La fecha de nacimiento no puede ser una fecha futura"
    )
    .refine(
      (val) => {
        const iso = normalizeDateToISO(val);
        if (!iso) return false;
        const [year, month, day] = iso.split("-").map(Number);
        const birth = new Date(year, month - 1, day);
        const today = new Date();
        const ageYears = today.getFullYear() - birth.getFullYear();
        const hasHadBirthday =
          today.getMonth() > birth.getMonth() ||
          (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
        const actualAge = hasHadBirthday ? ageYears : ageYears - 1;
        return actualAge >= 15;
      },
      "Debes tener al menos 15 años para registrarte como candidato"
    ),
  whatsappNumber: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const clean = normalizePhone(val);
        return clean ? clean.startsWith("+") && clean.length >= 12 && clean.length <= 16 : false;
      },
      "Por favor ingresa un número de teléfono celular válido (10 dígitos)"
    )
    .transform((val) => (val ? normalizePhone(val) || val : val)),
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
export type CandidateRegisterInput = z.input<typeof candidateRegisterSchema>;
export type AdminRegisterValues = z.infer<typeof adminRegisterSchema>;

