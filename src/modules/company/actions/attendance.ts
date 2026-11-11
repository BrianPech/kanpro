"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { companyTenantService } from "../services/company-tenant.service";
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
  actionTaken?: "check_in" | "check_out" | "break_start" | "break_end";
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
    let resolvedCompanyId = user.id;

    const empTable = supabase.from("company_employees");
    if (empTable?.select) {
      const empQuery = empTable
        .select("id, company_id, employee_id, status")
        .eq("id", parsed.data.employeeId);
      const { data: employeeRecord } = await (empQuery.maybeSingle
        ? empQuery.maybeSingle()
        : empQuery.single());

      if (employeeRecord?.company_id) {
        if (
          employeeRecord.status &&
          employeeRecord.status !== "active" &&
          employeeRecord.status !== "onboarding"
        ) {
          return {
            success: false,
            error: "Colaborador inactivo en la plantilla de la empresa.",
          };
        }

        const isMember = await companyTenantService.verifyUserMembership(user.id, employeeRecord.company_id, supabase);
        const isCompanyOwner = employeeRecord.company_id === user.id || !!isMember;
        const isLinkedEmployee = employeeRecord.employee_id === user.id;

        if (!isCompanyOwner && !isLinkedEmployee) {
          return {
            success: false,
            error: "No tienes autorización para registrar asistencia de este colaborador.",
          };
        }

        resolvedCompanyId = employeeRecord.company_id;
      }
    }

    const service = new CompanyAttendanceService(supabase);
    const result = await service.recordMobileCheckIn(resolvedCompanyId, parsed.data);

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
      actionTaken: result.actionTaken,
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

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const service = new CompanyAttendanceService(supabase);
    const record = await service.createManualAttendance(companyScopeId, parsed.data);

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

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const service = new CompanyAttendanceService(supabase);
    const record = await service.authorizeOvertime(companyScopeId, parsed.data);

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

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const service = new CompanyAttendanceService(supabase);
    const reviewerEmail = user.email || "Recursos Humanos";
    const record = await service.reviewJustification(companyScopeId, reviewerEmail, parsed.data);

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

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    const service = new CompanyAttendanceService(supabase);
    const history = await service.getEmployeeAttendanceHistory(companyScopeId, parsed.data);

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
