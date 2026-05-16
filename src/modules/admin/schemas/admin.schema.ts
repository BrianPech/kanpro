import { z } from "zod"

export const adminActionSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["suspend", "activate", "ban", "verify"]),
  reason: z.string().min(10, "La razón debe tener al menos 10 caracteres"),
})

export const resolveReportSchema = z.object({
  reportId: z.string(),
  action: z.enum(["dismiss", "warn", "remove_content", "suspend_user"]),
  notes: z.string().optional(),
})

export type AdminAction = z.infer<typeof adminActionSchema>
export type ResolveReport = z.infer<typeof resolveReportSchema>
