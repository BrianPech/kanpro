import { z } from "zod";
import {
  MEXICO_TIME_ZONE,
  normalizeDateToISO,
  normalizePhone,
} from "@/lib/formatters";

function getTodayInBusinessTimezone(): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MEXICO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === "year")?.value ?? 2026);
  const month = Number(parts.find((p) => p.type === "month")?.value ?? 1);
  const day = Number(parts.find((p) => p.type === "day")?.value ?? 1);
  return { year, month, day };
}

export const candidatePersonalReviewSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Ingresa tu nombre completo")
    .max(100, "El nombre es muy largo"),
  birthDate: z
    .string()
    .trim()
    .min(1, "Ingresa tu fecha de nacimiento")
    .transform((val) => {
      const compact = val.replace(/\s+/g, "");
      return normalizeDateToISO(compact) || compact;
    })
    .refine((val) => {
      const iso = normalizeDateToISO(val);
      if (!iso) return false;
      const [year, month, day] = iso.split("-").map(Number);
      if (!year || !month || !day) return false;
      const date = new Date(year, month - 1, day);
      return !isNaN(date.getTime()) && date.getDate() === day;
    }, "Ingresa una fecha válida (DD / MM / AAAA)")
    .refine((val) => {
      const iso = normalizeDateToISO(val);
      if (!iso) return false;
      const [year, month, day] = iso.split("-").map(Number);
      const today = getTodayInBusinessTimezone();
      const age = today.year - year;
      const hadBirthday =
        today.month > month || (today.month === month && today.day >= day);
      return (hadBirthday ? age : age - 1) >= 15;
    }, "Debes tener al menos 15 años."),
  whatsappNumber: z
    .string()
    .trim()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const clean = normalizePhone(val);
      return clean
        ? clean.startsWith("+") && clean.length >= 12 && clean.length <= 16
        : false;
    }, "Ingresa un número de celular válido (10 dígitos)")
    .transform((val) => (val ? normalizePhone(val) || val : "")),
  curp: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .refine(
      (val) => !val || /^[A-Z]{4}\d{6}[HMX][A-Z]{5}[A-Z0-9]\d$/.test(val),
      "CURP inválida"
    ),
  rfc: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .refine(
      (val) => !val || /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(val),
      "RFC inválido"
    ),
  gender: z.enum(["H", "M", "X"]).optional(),
  electorKey: z.string().trim().toUpperCase().max(32).optional(),
  ineValidityYear: z.number().int().min(2020).max(2060).optional(),
});

export const candidateAddressSchema = z.object({
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Ingresa un código postal de 5 dígitos"),
  state: z.string().trim().min(2, "Ingresa tu estado").max(80),
  municipality: z
    .string()
    .trim()
    .min(2, "Ingresa tu municipio o alcaldía")
    .max(100),
  neighborhood: z.string().trim().min(2, "Ingresa tu colonia").max(120),
  street: z.string().trim().min(2, "Ingresa tu calle").max(160),
  exteriorNumber: z.string().trim().min(1, "Requerido").max(32),
  interiorNumber: z.string().trim().max(32).optional(),
});

export type CandidatePersonalReviewInput = z.input<
  typeof candidatePersonalReviewSchema
>;
export type CandidatePersonalReviewValues = z.infer<
  typeof candidatePersonalReviewSchema
>;
export type CandidateAddressValues = z.infer<typeof candidateAddressSchema>;

export interface ExtractedIneData {
  fullName?: string;
  birthDate?: string;
  curp?: string;
  gender?: "H" | "M" | "X";
  electorKey?: string;
  ineValidityYear?: number;
  postalCode?: string;
  state?: string;
  municipality?: string;
  neighborhood?: string;
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  extractionSource: "gemini" | "tesseract" | "qr_curp" | "none";
}

export interface CandidateOnboardingDraft {
  personal: {
    fullName: string;
    birthDate: string;
    whatsappNumber: string;
    curp?: string;
    gender?: "H" | "M" | "X";
    electorKey?: string;
    ineValidityYear?: number;
  };
  address: {
    postalCode: string;
    state: string;
    municipality: string;
    neighborhood: string;
    street: string;
    exteriorNumber: string;
    interiorNumber: string;
  };
}
