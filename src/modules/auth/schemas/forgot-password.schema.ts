import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Por favor, ingrese un correo electrónico válido"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
