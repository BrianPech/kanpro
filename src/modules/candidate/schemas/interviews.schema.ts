import { z } from "zod";

export const interviewResponseActionSchema = z.enum(["confirm", "reschedule"]);

export type InterviewResponseAction = z.infer<typeof interviewResponseActionSchema>;

export const respondToInterviewSchema = z.object({
  applicationId: z.string().min(1, "El identificador de la postulación es requerido."),
  response: interviewResponseActionSchema,
  candidateNotes: z
    .string()
    .max(1000, "Las notas o motivo no pueden exceder 1,000 caracteres.")
    .optional()
    .nullable(),
  proposedDate: z.string().optional().nullable(),
  proposedTime: z.string().optional().nullable(),
});

export type RespondToInterviewInput = z.infer<typeof respondToInterviewSchema>;
