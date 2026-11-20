import { z } from "zod";

export const leaveDecisionEnum = z.enum(["aprobada", "rechazada"]);
export const leaveApprovalActorEnum = z.enum(["area_leader", "hr"]);

export const vacationRequestTypeEnum = z.enum([
  "vacaciones",
  "permiso_con_goce",
  "permiso_sin_goce",
  "dias_economicos",
  "matrimonio",
  "paternidad",
  "maternidad",
  "luto",
]);

export const respondToLeaveRequestSchema = z.object({
  requestId: z.string().min(1, "El ID de la solicitud es requerido"),
  decision: leaveDecisionEnum,
  actor: leaveApprovalActorEnum.optional(),
  rejectionReason: z
    .string()
    .max(500, "El motivo de rechazo no puede exceder 500 caracteres")
    .optional(),
});

export const createCompanyLeaveSchema = z.object({
  employeeId: z.string().min(1, "El colaborador es obligatorio"),
  requestType: vacationRequestTypeEnum,
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha de inicio inválido (YYYY-MM-DD)"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha de fin inválido (YYYY-MM-DD)"),
  reason: z.string().max(500, "El motivo no puede exceder 500 caracteres").optional(),
});

export const leaveReferenceSchema = z.object({
  requestId: z.string().min(1, "El ID de la solicitud es requerido"),
});

export type RespondToLeaveRequestInput = z.infer<typeof respondToLeaveRequestSchema>;
export type CreateCompanyLeaveInput = z.infer<typeof createCompanyLeaveSchema>;
export type LeaveReferenceInput = z.infer<typeof leaveReferenceSchema>;
