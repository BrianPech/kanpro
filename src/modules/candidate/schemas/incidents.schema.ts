import { z } from "zod";

export const respondToIncidentSchema = z
  .object({
    incidentId: z.string().min(1, "El ID de la incidencia es requerido"),
    acknowledge: z.boolean(),
    statement: z
      .string()
      .trim()
      .max(2000, "El descargo no puede exceder 2000 caracteres")
      .optional(),
  })
  .refine((value) => value.acknowledge || Boolean(value.statement), {
    message: "Acepta la incidencia o escribe tu descargo.",
  });

export type RespondToIncidentInput = z.infer<typeof respondToIncidentSchema>;
