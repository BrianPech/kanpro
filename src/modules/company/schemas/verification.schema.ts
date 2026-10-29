import { z } from "zod";

export const saveCompanyVerificationSchema = z.object({
  legal_name: z.string().optional(),
  company_name: z.string().optional(),
  rfc: z.string().optional(),
  fiscal_address: z.string().optional(),
  industry: z.string().optional(),
  legal_rep_name: z.string().optional(),
  corporate_email: z.string().email("Correo corporativo inválido").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  fiscal_regime: z.string().optional(),
  entity_type: z.string().optional(),
  terms_accepted: z.boolean().optional(),
  submitForReview: z.boolean().default(false),
});

export type SaveCompanyVerificationInput = z.infer<typeof saveCompanyVerificationSchema>;
