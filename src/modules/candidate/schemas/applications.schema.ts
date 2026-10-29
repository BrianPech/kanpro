import { z } from "zod";

export const applyToVacancySchema = z.object({
  vacancyId: z.string().uuid("Identificador de vacante inválido"),
});

export type ApplyToVacancyInput = z.infer<typeof applyToVacancySchema>;
