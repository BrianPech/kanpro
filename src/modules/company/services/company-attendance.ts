import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  AttendanceRecord,
  AttendanceOverviewStats,
  GeofenceConfig,
  EmployeeSelectOption,
  AttendanceStatus,
  CheckInMethod,
  EmployeeAttendanceHistory,
  EmployeeAttendanceDay,
} from "../types/attendance";
import {
  DEFAULT_GEOFENCE,
  calculateDistanceInMeters,
  calculatePunctualityRate,
} from "../utils/attendance-utils";
import { BUSINESS_TIME_ZONE, getMexicoDateISO } from "@/lib/formatters";
import {
  DEFAULT_COMPANY_WORK_RULES_CONFIG,
  parseCompanyWorkRulesConfig,
} from "../strategies/company-policies.parser";
import { resolveEffectiveTolerance } from "../strategies/punctuality-policy.engine";
import { GEO_CONFIG, getCitiesList } from "@/config/geo";
import type {
  MobileCheckInInput,
  ManualAttendanceInput,
  AuthorizeOvertimeInput,
  ReviewJustificationInput,
  GetAttendanceHistoryInput,
} from "../schemas/attendance.schema";

export {
  DEFAULT_GEOFENCE,
  calculateDistanceInMeters,
  getIndividualAttendanceHistory,
} from "../utils/attendance-utils";

export interface CompanyAttendanceResponse {
  companyId?: string;
  companyName: string;
  workDate: string;
  branchConfig: GeofenceConfig;
  toleranceMinutes?: number;
  records: AttendanceRecord[];
  stats: AttendanceOverviewStats;
  employees: EmployeeSelectOption[];
}

export type AttendanceRow = Database["public"]["Tables"]["company_attendance"]["Row"];
export type AttendanceInsert = Database["public"]["Tables"]["company_attendance"]["Insert"];
export type AttendanceUpdate = Database["public"]["Tables"]["company_attendance"]["Update"];

export interface MobileCheckInResult {
  record: AttendanceRow;
  timeStr: string;
  isLate: boolean;
  delayMinutes: number;
  employeeName: string;
  jobTitle: string;
  department: string;
  scheduledCheckIn: string;
  scheduledCheckOut: string;
  actionTaken?: "check_in" | "check_out" | "break_start" | "break_end";
  actionType?: "check_in" | "check_out" | "break_start" | "break_end";
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

const DAY_NAMES_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

export function resolveWorkSchedule(schedule?: string | null): {
  scheduledCheckIn: string;
  scheduledCheckOut: string;
} {
  let scheduledCheckIn = "08:00";
  let scheduledCheckOut = "17:00";
  if (schedule && schedule.includes("-")) {
    const parts = schedule.split("-").map((p) => p.trim());
    if (parts[0]) scheduledCheckIn = parts[0];
    if (parts[1]) scheduledCheckOut = parts[1];
  }
  return { scheduledCheckIn, scheduledCheckOut };
}

export function calculateDelayMinutes(
  scheduledCheckIn: string,
  now: Date = new Date(),
  toleranceMinutes = 15
): {
  workDate: string;
  timeStr: string;
  isLate: boolean;
  delayMinutes: number;
} {
  const workDate = getMexicoDateISO(now);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const rawHour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const currentHour = rawHour === 24 ? 0 : rawHour;
  const currentMin = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const timeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;

  const [rawSchedHour, rawSchedMin] = scheduledCheckIn.split(":");
  const parsedSchedHour = Number.parseInt(rawSchedHour ?? "", 10);
  const parsedSchedMin = Number.parseInt(rawSchedMin ?? "", 10);
  const scheduledHour = Number.isNaN(parsedSchedHour) ? 8 : parsedSchedHour;
  const scheduledMin = Number.isNaN(parsedSchedMin) ? 0 : parsedSchedMin;

  const currentMinutesFromMidnight = currentHour * 60 + currentMin;
  const scheduledMinutesFromMidnight = scheduledHour * 60 + scheduledMin;

  const isLate = currentMinutesFromMidnight > scheduledMinutesFromMidnight + toleranceMinutes;
  const delayMinutes = isLate ? currentMinutesFromMidnight - scheduledMinutesFromMidnight : 0;

  return { workDate, timeStr, isLate, delayMinutes };
}

/**
 * Calcula los minutos de salida anticipada respecto a la hora programada de salida (HH:MM).
 */
export function calculateEarlyDepartureMinutes(
  scheduledCheckOut: string,
  checkOutTimeStr: string
): number {
  const [rawSchedH, rawSchedM] = scheduledCheckOut.split(":");
  const [rawOutH, rawOutM] = checkOutTimeStr.split(":");
  const schedH = Number.parseInt(rawSchedH ?? "", 10);
  const schedM = Number.parseInt(rawSchedM ?? "", 10);
  const outH = Number.parseInt(rawOutH ?? "", 10);
  const outM = Number.parseInt(rawOutM ?? "", 10);
  if ([schedH, schedM, outH, outM].some(Number.isNaN)) return 0;
  return Math.max(0, schedH * 60 + schedM - (outH * 60 + outM));
}

export class CompanyAttendanceService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async recordMobileCheckIn(
    companyId: string,
    input: MobileCheckInInput
  ): Promise<MobileCheckInResult> {
    const { data: employee, error: empError } = await this.supabase
      .from("company_employees")
      .select("id, company_id, employee_id, full_name, work_schedule, department, job_title")
      .eq("id", input.employeeId)
      .single();

    if (
      empError ||
      !employee ||
      (employee.company_id !== companyId && employee.employee_id !== companyId)
    ) {
      throw new Error("Colaborador no encontrado en la plantilla de la empresa.");
    }

    const effectiveCompanyId = employee.company_id;

    // Doble Factor: Si el método es 'qr', validar token y geocerca GPS
    if (input.method === "qr") {
      if (!input.qrToken || !input.qrToken.trim()) {
        throw new Error("Código QR no proporcionado o inválido.");
      }

      let targetLat = DEFAULT_GEOFENCE.latitude;
      let targetLng = DEFAULT_GEOFENCE.longitude;
      const maxRadius = DEFAULT_GEOFENCE.radiusMeters;

      if (input.distanceMeters === undefined && input.coordinates) {
        // Resolver coordenadas dinámicas de la sucursal de la empresa si existen
        try {
          const branchTable = this.supabase.from("company_branches") as any;
          if (branchTable && typeof branchTable.select === "function") {
            const { data: branch } = await branchTable
              .select("lat, lng")
              .eq("company_id", effectiveCompanyId)
              .not("lat", "is", null)
              .limit(1)
              .maybeSingle();

            if (branch?.lat && branch?.lng) {
              targetLat = Number(branch.lat);
              targetLng = Number(branch.lng);
            } else {
              const compProfileTable = this.supabase.from("company_profiles") as any;
              if (compProfileTable && typeof compProfileTable.select === "function") {
                const { data: compProfile } = await compProfileTable
                  .select("fiscal_address, address_details")
                  .eq("id", effectiveCompanyId)
                  .maybeSingle();

                const addr = compProfile?.address_details || compProfile?.fiscal_address || "";
                const matchedCity = getCitiesList().find((c) => addr.toLowerCase().includes(c.name.toLowerCase()));
                if (matchedCity && GEO_CONFIG[matchedCity.name]) {
                  targetLat = GEO_CONFIG[matchedCity.name].coords.lat;
                  targetLng = GEO_CONFIG[matchedCity.name].coords.lng;
                }
              }
            }
          }
        } catch {
          // Fallback a geocerca estándar si falla la resolución de sucursal
        }
      }

      const dist =
        input.distanceMeters ??
        (input.coordinates
          ? calculateDistanceInMeters(
              input.coordinates.lat,
              input.coordinates.lng,
              targetLat,
              targetLng
            )
          : undefined);

      if (dist !== undefined && dist > maxRadius) {
        throw new Error(
          `Fuera de la zona de trabajo autorizada. Distancia: ${Math.round(dist)}m (máximo permitido: ${maxRadius}m).`
        );
      }
    }

    const { scheduledCheckIn, scheduledCheckOut } = resolveWorkSchedule(employee.work_schedule);
    const now = new Date();
    let effectiveToleranceMinutes = DEFAULT_COMPANY_WORK_RULES_CONFIG.toleranceMinutes;
    try {
      const compProfileTable = this.supabase.from("company_profiles");
      if (compProfileTable && typeof compProfileTable.select === "function") {
        const { data: compProfile } = await compProfileTable
          .select("payroll_impact_config")
          .eq("id", effectiveCompanyId)
          .maybeSingle();
        if (compProfile?.payroll_impact_config !== undefined) {
          const workRules = parseCompanyWorkRulesConfig(compProfile.payroll_impact_config);
          effectiveToleranceMinutes = resolveEffectiveTolerance(workRules, {
            jobTitle: employee.job_title,
            shift: employee.work_schedule,
          }).toleranceMinutes;
        }
      }
    } catch {
      effectiveToleranceMinutes = DEFAULT_COMPANY_WORK_RULES_CONFIG.toleranceMinutes;
    }

    const { workDate, timeStr, isLate, delayMinutes } = calculateDelayMinutes(
      scheduledCheckIn,
      now,
      effectiveToleranceMinutes
    );

    let effectiveActionType: "check_in" | "check_out" | "break_start" | "break_end" =
      input.actionType === "auto" ? "check_in" : input.actionType;

    let existingRecord: AttendanceRow | null = null;
    const { data: existing } = await this.supabase
      .from("company_attendance")
      .select("*")
      .eq("company_id", effectiveCompanyId)
      .eq("employee_id", employee.id)
      .eq("work_date", workDate)
      .maybeSingle();

    existingRecord = existing;

    if (input.actionType === "auto") {
      if (!existingRecord || !existingRecord.check_in_time) {
        effectiveActionType = "check_in";
      } else if (!existingRecord.check_out_time) {
        effectiveActionType = "check_out";
      } else {
        effectiveActionType = "check_out";
      }
    }

    const upsertPayload = this.buildMobileUpsertPayload(
      employee.company_id,
      employee.id,
      workDate,
      scheduledCheckIn,
      scheduledCheckOut,
      input,
      effectiveActionType,
      timeStr,
      isLate,
      delayMinutes,
      now,
      existingRecord
    );

    const { data, error } = await this.supabase
      .from("company_attendance")
      .upsert(upsertPayload, { onConflict: "company_id,employee_id,work_date" })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Error al registrar checada de asistencia.");
    }

    return {
      record: data,
      timeStr,
      isLate,
      delayMinutes,
      employeeName: employee.full_name || "Colaborador",
      jobTitle: employee.job_title || "Colaborador",
      department: employee.department || "Operaciones",
      scheduledCheckIn,
      scheduledCheckOut,
      actionTaken: effectiveActionType,
      actionType: effectiveActionType,
    };
  }

  async createManualAttendance(
    companyId: string,
    input: ManualAttendanceInput
  ): Promise<AttendanceRow> {
    const { data: employee, error: empError } = await this.supabase
      .from("company_employees")
      .select("id, company_id, full_name, work_schedule")
      .eq("id", input.employeeId)
      .single();

    if (empError || !employee || employee.company_id !== companyId) {
      throw new Error("Colaborador no encontrado o no pertenece a tu empresa.");
    }

    const { scheduledCheckIn, scheduledCheckOut } = resolveWorkSchedule(employee.work_schedule);
    const earlyDepartureMinutes = input.checkOutTime
      ? calculateEarlyDepartureMinutes(scheduledCheckOut, input.checkOutTime)
      : 0;

    const payload: AttendanceInsert = {
      company_id: companyId,
      employee_id: input.employeeId,
      work_date: input.workDate,
      scheduled_check_in: scheduledCheckIn,
      scheduled_check_out: scheduledCheckOut,
      check_in_time: input.checkInTime || null,
      check_out_time: input.checkOutTime || null,
      check_in_method: "manual",
      delay_minutes: input.delayMinutes ?? (input.status === "retardo" ? 20 : 0),
      ...(earlyDepartureMinutes > 0 ? { early_departure_minutes: earlyDepartureMinutes } : {}),
      status: input.status,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from("company_attendance")
      .upsert(payload, { onConflict: "company_id,employee_id,work_date" })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Error al registrar asistencia manual.");
    }

    return data;
  }

  async authorizeOvertime(
    companyId: string,
    input: AuthorizeOvertimeInput
  ): Promise<AttendanceRow> {
    const updatePayload: AttendanceUpdate = {
      overtime_hours: input.hours,
      overtime_status: "autorizado",
      overtime_rate_type: input.rateType,
      overtime_notes: input.notes?.trim() || `Autorizadas ${input.hours} horas a tarifa ${input.rateType}`,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from("company_attendance")
      .update(updatePayload)
      .eq("id", input.recordId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error || !data) {
      throw new Error("Registro de asistencia no encontrado o no autorizado.");
    }

    return data;
  }

  async reviewJustification(
    companyId: string,
    reviewerEmail: string,
    input: ReviewJustificationInput
  ): Promise<AttendanceRow> {
    const newStatus: AttendanceStatus =
      input.decision === "aprobada" ? "falta_justificada" : "falta_injustificada";

    const updatePayload: AttendanceUpdate = {
      status: newStatus,
      justification_status: input.decision,
      justification_reviewed_at: new Date().toISOString(),
      justification_reviewed_by: reviewerEmail || "Recursos Humanos",
      justification_comments: input.comments?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from("company_attendance")
      .update(updatePayload)
      .eq("id", input.recordId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Registro no encontrado para resolver justificante.");
    }

    return data;
  }

  async getEmployeeAttendanceHistory(
    companyId: string,
    input: GetAttendanceHistoryInput
  ): Promise<EmployeeAttendanceHistory> {
    const [currentYear, currentMonth] = getMexicoDateISO().split("-").map(Number);
    const month = input.month ?? currentMonth;
    const year = input.year ?? currentYear;

    const { data: employee, error: empError } = await this.supabase
      .from("company_employees")
      .select("id, full_name, avatar_url, job_title, department")
      .eq("id", input.employeeId)
      .eq("company_id", companyId)
      .single();

    if (empError || !employee) {
      throw new Error("Colaborador no encontrado.");
    }

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const { data: records, error: attError } = await this.supabase
      .from("company_attendance")
      .select("*")
      .eq("employee_id", input.employeeId)
      .eq("company_id", companyId)
      .gte("work_date", startDate)
      .lte("work_date", endDate)
      .order("work_date", { ascending: true });

    if (attError) {
      throw new Error(attError.message);
    }

    return this.buildEmployeeAttendanceHistory(
      employee,
      records || [],
      year,
      month,
      daysInMonth
    );
  }

  async getCompanyAttendanceData(
    companyId: string,
    targetDate?: string
  ): Promise<CompanyAttendanceResponse> {
    const todayStr = targetDate || getMexicoDateISO();
    const branchConfig: GeofenceConfig = { ...DEFAULT_GEOFENCE };

    if (!companyId) {
      return this.buildEmptyAttendanceResponse(todayStr, branchConfig, companyId);
    }

    const branchTable = this.supabase.from("company_branches") as any;
    const branchPromise =
      branchTable && typeof branchTable.select === "function"
        ? branchTable
            .select("name, address, lat, lng, is_headquarters")
            .eq("company_id", companyId)
            .order("is_headquarters", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null });

    const [profileRes, employeesRes, attendanceRes, leavesRes, branchRes] = await Promise.all([
      this.supabase
        .from("company_profiles")
        .select("company_name, address_details, fiscal_address, payroll_impact_config")
        .eq("id", companyId)
        .maybeSingle(),
      this.supabase
        .from("company_employees")
        .select("id, full_name, job_title, department, avatar_url, work_schedule, status")
        .eq("company_id", companyId)
        .not("status", "eq", "terminated")
        .order("full_name", { ascending: true }),
      this.supabase
        .from("company_attendance")
        .select("*")
        .eq("company_id", companyId)
        .eq("work_date", todayStr),
      this.supabase
        .from("company_leaves")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "aprobada")
        .lte("start_date", todayStr)
        .gte("end_date", todayStr),
      branchPromise,
    ]);

    const companyName = profileRes.data?.company_name || "Mi Empresa";
    if (branchRes?.data?.lat && branchRes?.data?.lng) {
      branchConfig.latitude = Number(branchRes.data.lat);
      branchConfig.longitude = Number(branchRes.data.lng);
      if (branchRes.data.name) branchConfig.branchName = branchRes.data.name;
      if (branchRes.data.address) branchConfig.address = branchRes.data.address;
    } else {
      if (profileRes.data?.company_name) {
        branchConfig.branchName = `Sucursal Principal - ${profileRes.data.company_name}`;
      }
      if (profileRes.data?.address_details || profileRes.data?.fiscal_address) {
        branchConfig.address =
          profileRes.data.address_details || profileRes.data.fiscal_address || branchConfig.address;
        const rawAddr = branchConfig.address;
        const matchedCity = getCitiesList().find((c) => rawAddr.toLowerCase().includes(c.name.toLowerCase()));
        if (matchedCity && GEO_CONFIG[matchedCity.name]) {
          branchConfig.latitude = GEO_CONFIG[matchedCity.name].coords.lat;
          branchConfig.longitude = GEO_CONFIG[matchedCity.name].coords.lng;
        }
      }
    }

    const rawEmployees = employeesRes.data || [];
    const rawAttendance = attendanceRes.data || [];
    const rawLeaves = leavesRes.data || [];

    const employeeOptions: EmployeeSelectOption[] = rawEmployees.map((emp) => ({
      id: emp.id,
      name: emp.full_name || "Colaborador",
      jobTitle: emp.job_title || "Puesto General",
      department: emp.department || "Operaciones",
      avatarUrl: emp.avatar_url || null,
      workSchedule: emp.work_schedule || "08:00 - 17:00",
    }));

    const attendanceByEmployee = new Map<string, AttendanceRow>();
    rawAttendance.forEach((att) => {
      attendanceByEmployee.set(att.employee_id, att);
    });

    const leavesByEmployee = new Map<string, (typeof rawLeaves)[number]>();
    rawLeaves.forEach((leave) => {
      if (leave.employee_id) {
        leavesByEmployee.set(leave.employee_id, leave);
      }
    });

    const dateObj = new Date(todayStr + "T12:00:00Z");
    const isSunday = dateObj.getUTCDay() === 0;

    const records: AttendanceRecord[] = rawEmployees.map((emp) => {
      const existing = attendanceByEmployee.get(emp.id);
      const activeLeave = leavesByEmployee.get(emp.id);
      const { scheduledCheckIn, scheduledCheckOut } = resolveWorkSchedule(emp.work_schedule);

      if (existing) {
        return this.mapExistingToAttendanceRecord(existing, emp, todayStr, scheduledCheckIn, scheduledCheckOut);
      }

      let defaultStatus: AttendanceStatus = "falta_injustificada";
      if (activeLeave) {
        defaultStatus = activeLeave.request_type === "vacaciones" ? "vacaciones" : "falta_justificada";
      } else if (isSunday) {
        defaultStatus = "descanso";
      }

      return {
        id: `virtual-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.full_name,
        avatarUrl: emp.avatar_url || null,
        jobTitle: emp.job_title || "Colaborador",
        department: emp.department || "Operaciones",
        workDate: todayStr,
        scheduledCheckIn,
        scheduledCheckOut,
        checkInTime: null,
        checkOutTime: null,
        breakStartTime: null,
        breakEndTime: null,
        checkInMethod: "manual",
        delayMinutes: 0,
        status: defaultStatus,
        overtimeHours: 0,
      };
    });

    const workRules = parseCompanyWorkRulesConfig(profileRes.data?.payroll_impact_config);
    const stats = this.computeOverviewStats(records);

    return {
      companyId,
      companyName,
      workDate: todayStr,
      branchConfig,
      toleranceMinutes: workRules.toleranceMinutes,
      records,
      stats,
      employees: employeeOptions,
    };
  }

  private buildMobileUpsertPayload(
    companyId: string,
    employeeId: string,
    workDate: string,
    scheduledCheckIn: string,
    scheduledCheckOut: string,
    input: MobileCheckInInput,
    resolvedActionType: "check_in" | "check_out" | "break_start" | "break_end",
    timeStr: string,
    isLate: boolean,
    delayMinutes: number,
    now: Date,
    existingRecord?: AttendanceRow | null
  ): AttendanceInsert {
    const payload: AttendanceInsert = {
      company_id: companyId,
      employee_id: employeeId,
      work_date: workDate,
      scheduled_check_in: scheduledCheckIn,
      scheduled_check_out: scheduledCheckOut,
      updated_at: now.toISOString(),
    };

    if (existingRecord) {
      if (existingRecord.check_in_time) payload.check_in_time = existingRecord.check_in_time;
      if (existingRecord.check_in_method) payload.check_in_method = existingRecord.check_in_method;
      if (existingRecord.status) payload.status = existingRecord.status;
      if (existingRecord.delay_minutes != null) payload.delay_minutes = existingRecord.delay_minutes;
      if (existingRecord.check_in_lat != null) payload.check_in_lat = existingRecord.check_in_lat;
      if (existingRecord.check_in_lng != null) payload.check_in_lng = existingRecord.check_in_lng;
    }

    if (resolvedActionType === "check_in") {
      payload.check_in_time = timeStr;
      payload.check_out_time = null;
      payload.check_in_method = input.method;
      payload.delay_minutes = isLate ? delayMinutes : 0;
      payload.status = isLate ? "retardo" : "presente";
      if (input.coordinates) {
        payload.check_in_lat = input.coordinates.lat;
        payload.check_in_lng = input.coordinates.lng;
        payload.check_in_accuracy = input.coordinates.accuracy ?? null;
      }
      if (input.distanceMeters != null) {
        payload.check_in_distance_meters = input.distanceMeters;
      }
    } else if (resolvedActionType === "check_out") {
      payload.check_out_time = timeStr;
      const earlyDepartureMinutes = calculateEarlyDepartureMinutes(scheduledCheckOut, timeStr);
      if (earlyDepartureMinutes > 0) {
        payload.early_departure_minutes = earlyDepartureMinutes;
      }
    } else if (resolvedActionType === "break_start") {
      payload.break_start_time = timeStr;
    } else if (resolvedActionType === "break_end") {
      payload.break_end_time = timeStr;
    }

    return payload;
  }

  private mapExistingToAttendanceRecord(
    existing: AttendanceRow,
    emp: { full_name: string; avatar_url?: string | null; job_title?: string | null; department?: string | null },
    todayStr: string,
    fallbackCheckIn: string,
    fallbackCheckOut: string
  ): AttendanceRecord {
    const justification = existing.justification_status || existing.justification_reason_type
      ? {
          id: `just-${existing.id}`,
          attendanceRecordId: existing.id,
          employeeId: existing.employee_id,
          employeeName: emp.full_name,
          workDate: todayStr,
          reasonType: (existing.justification_reason_type || "personal") as "medica" | "transporte" | "fuerza_mayor" | "personal",
          reasonLabel: existing.justification_label || "Justificante Laboral",
          comments: existing.justification_comments || "",
          evidenceUrl: existing.justification_evidence_url || null,
          status: (existing.justification_status || "pendiente") as "pendiente" | "aprobada" | "rechazada",
          submittedAt: existing.justification_submitted_at
            ? new Date(existing.justification_submitted_at).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: BUSINESS_TIME_ZONE,
              })
            : "Hoy",
          reviewedAt: existing.justification_reviewed_at
            ? new Date(existing.justification_reviewed_at).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: BUSINESS_TIME_ZONE,
              })
            : undefined,
          reviewedBy: existing.justification_reviewed_by || undefined,
        }
      : undefined;

    const checkInLocation = existing.check_in_lat && existing.check_in_lng
      ? {
          lat: Number(existing.check_in_lat),
          lng: Number(existing.check_in_lng),
          accuracyMeters: existing.check_in_accuracy ? Number(existing.check_in_accuracy) : undefined,
          distanceToBranchMeters: existing.check_in_distance_meters
            ? Number(existing.check_in_distance_meters)
            : 0,
        }
      : undefined;

    return {
      id: existing.id,
      employeeId: existing.employee_id,
      employeeName: emp.full_name,
      avatarUrl: emp.avatar_url || null,
      jobTitle: emp.job_title || "Colaborador",
      department: emp.department || "Operaciones",
      workDate: todayStr,
      scheduledCheckIn: existing.scheduled_check_in || fallbackCheckIn,
      scheduledCheckOut: existing.scheduled_check_out || fallbackCheckOut,
      checkInTime: existing.check_in_time || null,
      checkOutTime: existing.check_out_time || null,
      breakStartTime: existing.break_start_time || null,
      breakEndTime: existing.break_end_time || null,
      checkInMethod: (existing.check_in_method || "manual") as CheckInMethod,
      checkInLocation,
      delayMinutes: existing.delay_minutes || 0,
      status: existing.status as AttendanceStatus,
      overtimeHours: Number(existing.overtime_hours) || 0,
      overtimeStatus: (existing.overtime_status as "pendiente" | "autorizado" | "rechazado") || undefined,
      overtimeRateType: (existing.overtime_rate_type as "doble" | "triple") || undefined,
      justification,
    };
  }

  private computeOverviewStats(records: AttendanceRecord[]): AttendanceOverviewStats {
    const presentCount = records.filter((r) => r.status === "presente").length;
    const lateCount = records.filter((r) => r.status === "retardo").length;
    const unjustifiedAbsences = records.filter((r) => r.status === "falta_injustificada").length;
    const justifiedAbsences = records.filter(
      (r) => r.status === "falta_justificada" || r.status === "incapacidad"
    ).length;
    const totalScheduled = records.filter((r) => r.status !== "descanso" && r.status !== "vacaciones").length;

    const punctualityRate = calculatePunctualityRate(presentCount, lateCount);
    const totalOvertimeHoursToday = records.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
    const pendingJustificationsCount = records.filter((r) => r.justification?.status === "pendiente").length;

    return {
      totalScheduled,
      presentCount,
      lateCount,
      unjustifiedAbsences,
      justifiedAbsences,
      punctualityRate,
      totalOvertimeHoursToday,
      pendingJustificationsCount,
    };
  }

  private buildEmptyAttendanceResponse(
    todayStr: string,
    branchConfig: GeofenceConfig,
    companyId?: string
  ): CompanyAttendanceResponse {
    return {
      companyId: companyId || "",
      companyName: "Mi Empresa",
      workDate: todayStr,
      branchConfig,
      toleranceMinutes: DEFAULT_COMPANY_WORK_RULES_CONFIG.toleranceMinutes,
      records: [],
      stats: {
        totalScheduled: 0,
        presentCount: 0,
        lateCount: 0,
        unjustifiedAbsences: 0,
        justifiedAbsences: 0,
        punctualityRate: 0,
        totalOvertimeHoursToday: 0,
        pendingJustificationsCount: 0,
      },
      employees: [],
    };
  }

  private buildEmployeeAttendanceHistory(
    employee: { id: string; full_name: string; avatar_url: string | null; job_title: string | null; department: string | null },
    records: AttendanceRow[],
    year: number,
    month: number,
    daysInMonth: number
  ): EmployeeAttendanceHistory {
    const recordsByDate = new Map<string, AttendanceRow>();
    records.forEach((r) => {
      recordsByDate.set(r.work_date, r);
    });

    const days: EmployeeAttendanceDay[] = [];
    let daysPresent = 0;
    let daysLate = 0;
    let daysAbsent = 0;
    let daysJustified = 0;
    let totalEffectiveHours = 0;
    let totalOvertimeHours = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(Date.UTC(year, month - 1, d, 12, 0, 0));
      const dayOfWeekIndex = dateObj.getUTCDay();
      const dayOfWeek = DAY_NAMES_SHORT[dayOfWeekIndex];
      const isSunday = dayOfWeekIndex === 0;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      const existing = recordsByDate.get(dateStr);

      if (existing) {
        const status = existing.status as AttendanceStatus;
        if (status === "presente") daysPresent++;
        else if (status === "retardo") {
          daysPresent++;
          daysLate++;
        } else if (status === "falta_injustificada") daysAbsent++;
        else if (status === "falta_justificada") daysJustified++;

        const effectiveHours = existing.check_in_time && existing.check_out_time ? 8 : existing.check_in_time ? 4 : 0;
        totalEffectiveHours += effectiveHours;
        totalOvertimeHours += Number(existing.overtime_hours) || 0;

        days.push({
          date: dateStr,
          dayOfWeek,
          dayNumber: d,
          status,
          checkInTime: existing.check_in_time,
          checkOutTime: existing.check_out_time,
          effectiveHours,
          delayMinutes: existing.delay_minutes || 0,
          overtimeHours: Number(existing.overtime_hours) || 0,
          notes: existing.notes || undefined,
        });
      } else {
        days.push({
          date: dateStr,
          dayOfWeek,
          dayNumber: d,
          status: "descanso",
          checkInTime: null,
          checkOutTime: null,
          effectiveHours: 0,
          delayMinutes: 0,
          overtimeHours: 0,
          notes: isSunday ? "Día de descanso semanal" : undefined,
        });
      }
    }

    const punctualityRate = calculatePunctualityRate(daysPresent - daysLate, daysLate);

    return {
      employeeId: employee.id,
      employeeName: employee.full_name,
      avatarUrl: employee.avatar_url,
      jobTitle: employee.job_title || "Colaborador",
      department: employee.department || "Operaciones",
      month,
      year,
      monthName: MONTH_NAMES[month - 1],
      totalWorkDays: daysInMonth,
      daysPresent,
      daysLate,
      daysAbsent,
      daysJustified,
      totalEffectiveHours,
      totalOvertimeHours,
      individualPunctualityRate: punctualityRate,
      days,
    };
  }
}

/**
 * Función helper de consulta directa inyectando el cliente Supabase
 */
export async function getCompanyAttendanceData(
  supabase: SupabaseClient<Database>,
  companyId: string,
  targetDate?: string
): Promise<CompanyAttendanceResponse> {
  const service = new CompanyAttendanceService(supabase);
  return service.getCompanyAttendanceData(companyId, targetDate);
}
