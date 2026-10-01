import { z } from "zod";

export const attendanceStatusEnum = z.enum([
  "presente",
  "retardo",
  "falta_injustificada",
  "falta_justificada",
  "descanso",
  "vacaciones",
  "incapacidad",
]);

export const checkInMethodEnum = z.enum(["gps", "qr", "manual"]);

export const actionTypeEnum = z.enum([
  "check_in",
  "check_out",
  "break_start",
  "break_end",
]);

export const overtimeRateTypeEnum = z.enum(["doble", "triple"]);

export const justificationDecisionEnum = z.enum(["aprobada", "rechazada"]);

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
});

export const mobileCheckInSchema = z.object({
  employeeId: z.string().min(1, "ID de colaborador requerido"),
  actionType: actionTypeEnum,
  method: checkInMethodEnum,
  coordinates: coordinatesSchema.optional(),
  distanceMeters: z.number().nonnegative().optional(),
  qrToken: z.string().optional(),
});

export const manualAttendanceSchema = z.object({
  employeeId: z.string().min(1, "ID de colaborador requerido"),
  workDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  checkInTime: z.string().nullable().optional(),
  checkOutTime: z.string().nullable().optional(),
  status: attendanceStatusEnum,
  delayMinutes: z.number().nonnegative().optional(),
  notes: z.string().max(500, "Las notas no pueden exceder 500 caracteres").optional(),
});

export const authorizeOvertimeSchema = z.object({
  recordId: z.string().min(1, "ID de registro de asistencia requerido"),
  hours: z.number().positive("Las horas extras deben ser un número positivo"),
  rateType: overtimeRateTypeEnum,
  notes: z.string().max(500, "Las notas no pueden exceder 500 caracteres").optional(),
});

export const reviewJustificationSchema = z.object({
  recordId: z.string().min(1, "ID de registro de asistencia requerido"),
  decision: justificationDecisionEnum,
  comments: z.string().max(500, "Los comentarios no pueden exceder 500 caracteres").optional(),
});

export const getAttendanceHistorySchema = z.object({
  employeeId: z.string().min(1, "ID de colaborador requerido"),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
});

export type MobileCheckInInput = z.infer<typeof mobileCheckInSchema>;
export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>;
export type AuthorizeOvertimeInput = z.infer<typeof authorizeOvertimeSchema>;
export type ReviewJustificationInput = z.infer<typeof reviewJustificationSchema>;
export type GetAttendanceHistoryInput = z.infer<typeof getAttendanceHistorySchema>;
