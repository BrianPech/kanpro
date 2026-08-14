import { z } from "zod";

export const phoneOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "El número de teléfono es requerido")
    .refine(
      (val) => {
        const cleaned = val.replace(/[\s\-\(\)]/g, "");
        return /^(\+52)?\d{10}$/.test(cleaned);
      },
      {
        message:
          "Por favor ingresa un número de teléfono válido en México (+52 o 10 dígitos)",
      }
    ),
  channel: z.enum(["whatsapp", "sms"]).default("whatsapp"),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "El número de teléfono es requerido"),
  token: z
    .string()
    .trim()
    .length(6, "El código OTP debe ser de 6 dígitos")
    .regex(/^\d{6}$/, "El código OTP solo debe contener números"),
});

export type PhoneOtpValues = z.infer<typeof phoneOtpSchema>;
export type VerifyOtpValues = z.infer<typeof verifyOtpSchema>;
