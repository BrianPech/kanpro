import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { CompanyAttendanceService } from "@/modules/company/services/company-attendance";
import { calculateDistanceInMeters } from "@/modules/company/utils/attendance-utils";
import {
  type EmployeeQrCheckInInput,
  type EmployeeQrCheckInResult,
} from "../schemas/employee-attendance.schema";
import { parseQrAttendancePayload } from "../utils/qr-attendance-parser";

export interface ActiveEmployeeMatch {
  id: string;
  company_id: string;
  full_name: string;
  email: string | null;
  employee_id: string | null;
  status: string;
}

export class CandidateAttendanceService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Finds the active employee profile associated with the user account by auth ID or email.
   */
  async findActiveEmployee(
    userId: string,
    userEmail?: string | null
  ): Promise<ActiveEmployeeMatch | null> {
    // 1. First attempt: match by employee_id = userId
    const { data: empById, error: errById } = await this.supabase
      .from("company_employees")
      .select("id, company_id, full_name, email, employee_id, status")
      .eq("employee_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!errById && empById) {
      return empById as ActiveEmployeeMatch;
    }

    // 2. Second attempt: match by email = userEmail
    if (userEmail) {
      const { data: empByEmail, error: errByEmail } = await this.supabase
        .from("company_employees")
        .select("id, company_id, full_name, email, employee_id, status")
        .eq("email", userEmail)
        .eq("status", "active")
        .maybeSingle();

      if (!errByEmail && empByEmail) {
        return empByEmail as ActiveEmployeeMatch;
      }
    }

    return null;
  }

  /**
   * Processes a QR check-in / check-out for the active employee.
   */
  async recordQrCheckIn(
    employee: ActiveEmployeeMatch,
    input: EmployeeQrCheckInInput
  ): Promise<EmployeeQrCheckInResult> {
    const qrParams = parseQrAttendancePayload(input.qrUrlOrToken);

    if (!qrParams.token || !qrParams.token.trim()) {
      throw new Error("El código o enlace QR no contiene un token válido.");
    }

    // Optional GPS distance check if branch GPS is present in QR
    let distanceMeters: number | undefined = undefined;
    if (
      input.coordinates &&
      qrParams.branchLat !== undefined &&
      qrParams.branchLng !== undefined
    ) {
      distanceMeters = calculateDistanceInMeters(
        input.coordinates.lat,
        input.coordinates.lng,
        qrParams.branchLat,
        qrParams.branchLng
      );
    }

    const companyAttendanceService = new CompanyAttendanceService(this.supabase);

    const checkInResult = await companyAttendanceService.recordMobileCheckIn(
      employee.company_id,
      {
        employeeId: employee.id,
        actionType: "auto",
        method: "qr",
        qrToken: qrParams.token,
        coordinates: input.coordinates,
        distanceMeters,
      }
    );

    const resolvedAction: "check_in" | "check_out" =
      checkInResult.actionType === "check_out" || checkInResult.actionTaken === "check_out"
        ? "check_out"
        : "check_in";

    return {
      timeStr: checkInResult.timeStr,
      isLate: checkInResult.isLate,
      delayMinutes: checkInResult.delayMinutes,
      employeeName: checkInResult.employeeName || employee.full_name,
      actionType: resolvedAction,
      branchName: qrParams.branchName,
      companyName: qrParams.companyName,
    };
  }
}
