import { z } from "zod"

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  email: z
    .string()
    .email("Correo electrónico inválido"),
  subject: z
    .string()
    .max(200, "El asunto es demasiado largo")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(2000, "El mensaje es demasiado largo"),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>
