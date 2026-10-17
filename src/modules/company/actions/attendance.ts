"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  mobileCheckInSchema,
  manualAttendanceSchema,
  authorizeOvertimeSchema,
  reviewJustificationSchema,
  getAttendanceHistorySchema,
  type MobileCheckInInput,
  type ManualAttendanceInput,
  type AuthorizeOvertimeInput,
  type ReviewJustificationInput,
  type GetAttendanceHistoryInput,
} from "../schemas/attendance.schema";
import {
  CompanyAttendanceService,
  type AttendanceRow,
} from "../services/company-attendance";
import type { EmployeeAttendanceHistory } from "../types/attendance";

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface MobileCheckInActionResult extends ActionResponse<AttendanceRow> {
  record?: AttendanceRow;
  timeStr?: string;
  isLate?: boolean;
  delayMinutes?: number;
  employeeName?: string;
  jobTitle?: string;
  department?: string;
  scheduledCheckIn?: string;
  scheduledCheckOut?: string;
}

interface ManualAttendanceActionResult extends ActionResponse<AttendanceRow> {
  record?: AttendanceRow;
}

interface OvertimeActionResult extends ActionResponse<AttendanceRow> {
  record?: AttendanceRow;
}

interface JustificationActionResult extends ActionResponse<AttendanceRow> {
  record?: AttendanceRow;
}

interface AttendanceHistoryActionResult extends ActionResponse<EmployeeAttendanceHistory> {
  history?: EmployeeAttendanceHistory;
}

/**
 * Registra checada móvil (GPS o QR) para un colaborador
 */
export async function recordAttendanceCheckInAction(
  rawInput: MobileCheckInInput
): Promise<MobileCheckInActionResult> {
  const parsed = mobileCheckInSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de checada móvil inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado. Inicie sesión para registrar asistencia." };
  }

  try {
    const service = new CompanyAttendanceService(supabase);
    const result = await service.recordMobileCheckIn(user.id, parsed.data);

    revalidatePath("/dashboard/company/attendance");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: result.record,
      record: result.record,
      timeStr: result.timeStr,
      isLate: result.isLate,
      delayMinutes: result.delayMinutes,
      employeeName: result.employeeName,
      jobTitle: result.jobTitle,
      department: result.department,
      scheduledCheckIn: result.scheduledCheckIn,
      scheduledCheckOut: result.scheduledCheckOut,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al registrar checada.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Captura manual de checada o incidencia por Recursos Humanos
 */
export async function createManualAttendanceAction(
  rawInput: ManualAttendanceInput
): Promise<ManualAttendanceActionResult> {
  const parsed = manualAttendanceSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de asistencia manual inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  try {
    const service = new CompanyAttendanceService(supabase);
    const record = await service.createManualAttendance(user.id, parsed.data);

    revalidatePath("/dashboard/company/attendance");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: record,
      record,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al guardar asistencia manual.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Autoriza o rechaza horas extras conforme al Art. 67 y 68 LFT
 */
export async function authorizeOvertimeAction(
  rawInput: AuthorizeOvertimeInput
): Promise<OvertimeActionResult> {
  const parsed = authorizeOvertimeSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de horas extras inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    const service = new CompanyAttendanceService(supabase);
    const record = await service.authorizeOvertime(user.id, parsed.data);

    revalidatePath("/dashboard/company/attendance");
    revalidatePath("/dashboard/company/payroll");

    return {
      success: true,
      data: record,
      record,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al autorizar horas extras.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Revisa y resuelve un justificante médico o laboral
 */
export async function reviewAttendanceJustificationAction(
  rawInput: ReviewJustificationInput
): Promise<JustificationActionResult> {
  const parsed = reviewJustificationSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Datos de resolución de justificante inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    const service = new CompanyAttendanceService(supabase);
    const reviewerEmail = user.email || "Recursos Humanos";
    const record = await service.reviewJustification(user.id, reviewerEmail, parsed.data);

    revalidatePath("/dashboard/company/attendance");
    revalidatePath("/dashboard/company/payroll");

    return {
      success: true,
      data: record,
      record,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al resolver justificante.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Obtiene el expediente histórico mensual real de un colaborador
 */
export async function getEmployeeAttendanceHistoryAction(
  employeeId: string,
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear()
): Promise<AttendanceHistoryActionResult> {
  const parsed = getAttendanceHistorySchema.safeParse({ employeeId, month, year });
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Parámetros de consulta de expediente inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    const service = new CompanyAttendanceService(supabase);
    const history = await service.getEmployeeAttendanceHistory(user.id, parsed.data);

    return {
      success: true,
      data: history,
      history,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al consultar expediente.";
    return { success: false, error: errorMsg };
  }
}
