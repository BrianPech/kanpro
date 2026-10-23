"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  employeeQrCheckInSchema,
  type EmployeeQrCheckInInput,
  type EmployeeQrCheckInResult,
} from "../schemas/employee-attendance.schema";
import { CandidateAttendanceService } from "../services/candidate-attendance";

export type RecordEmployeeQrCheckInResponse =
  | {
      success: true;
      data: EmployeeQrCheckInResult;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
    };

/**
 * Server Action: Employee scans a branch/kiosk QR code to record check-in / check-out.
 * Validates session, finds active employment, and executes double-factor attendance logic.
 */
export async function recordEmployeeQrCheckInAction(
  rawInput: EmployeeQrCheckInInput
): Promise<RecordEmployeeQrCheckInResponse> {
  const parsed = employeeQrCheckInSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de checador QR inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "No autorizado. Inicia sesión en K'anPro para registrar tu asistencia.",
    };
  }

  try {
    const attendanceService = new CandidateAttendanceService(supabase);
    const employee = await attendanceService.findActiveEmployee(
      user.id,
      user.email
    );

    if (!employee) {
      return {
        success: false,
        error:
          "No se encontró un perfil de colaborador activo vinculado a tu cuenta en esta empresa.",
      };
    }

    const result = await attendanceService.recordQrCheckIn(
      employee,
      parsed.data
    );

    revalidatePath("/dashboard/candidate");
    revalidatePath("/dashboard/company/attendance");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Error al procesar el registro de asistencia con código QR.";
    return { success: false, error: message };
  }
}
