import { z } from "zod";

const uuidOrIdSchema = z.string().min(1, "El identificador es requerido.");

export const requestDocumentAccessSchema = z.object({
  applicationId: uuidOrIdSchema,
  candidateId: uuidOrIdSchema,
  requestedDocuments: z
    .array(z.string().min(1))
    .min(1, "Debe solicitar al menos un documento.")
    .default(["curp", "rfc", "ine"]),
});

export type RequestDocumentAccessInput = z.infer<typeof requestDocumentAccessSchema>;

export const respondDocumentAccessSchema = z.object({
  requestId: uuidOrIdSchema,
  status: z.enum(["approved", "rejected"]),
});

export type RespondDocumentAccessInput = z.infer<typeof respondDocumentAccessSchema>;

export const getDocumentAccessStatusSchema = z.object({
  applicationId: uuidOrIdSchema,
});

export type GetDocumentAccessStatusInput = z.infer<typeof getDocumentAccessStatusSchema>;

export const getAuthorizedDocumentsSchema = z.object({
  applicationId: uuidOrIdSchema,
  candidateId: uuidOrIdSchema,
});

export type GetAuthorizedDocumentsInput = z.infer<typeof getAuthorizedDocumentsSchema>;

export const getCandidateCvDocumentSchema = z.object({
  applicationId: uuidOrIdSchema,
  candidateId: uuidOrIdSchema,
});

export type GetCandidateCvDocumentInput = z.infer<typeof getCandidateCvDocumentSchema>;
