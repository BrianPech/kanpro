import { z } from "zod";

export const signCandidateContractSchema = z.object({
  contractId: z.string().min(1, "El identificador del contrato es requerido."),
  signatureData: z
    .string()
    .min(10, "La firma electrónica proporcionada es inválida o está incompleta.")
    .refine((val) => val.startsWith("data:image/"), {
      message: "La firma electrónica debe ser un formato de imagen válido (data:image/).",
    }),
});

export type SignCandidateContractInput = z.infer<typeof signCandidateContractSchema>;
