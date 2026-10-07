import { z } from "zod";

export const leaveRequestTypeSchema = z.enum([
  "vacaciones",
  "permiso_con_goce",
  "permiso_sin_goce",
  "paternidad",
  "maternidad",
  "luto",
]);

export type LeaveRequestType = z.infer<typeof leaveRequestTypeSchema>;

export const submitCandidateLeaveRequestSchema = z
  .object({
    companyId: z.string().min(1, "El identificador de la empresa es requerido."),
    employeeId: z.string().optional().nullable(),
    requestType: leaveRequestTypeSchema,
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de inicio debe tener formato YYYY-MM-DD."),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha de fin debe tener formato YYYY-MM-DD."),
    reason: z
      .string()
      .max(1000, "El motivo no puede exceder 1,000 caracteres.")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
    },
    {
      message: "La fecha de fin debe ser posterior o igual a la fecha de inicio.",
      path: ["endDate"],
    }
  );

export type SubmitCandidateLeaveRequestInput = z.infer<
  typeof submitCandidateLeaveRequestSchema
>;
