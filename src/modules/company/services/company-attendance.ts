import { createClient } from "@/lib/supabase/server";
import {
  AttendanceRecord,
  AttendanceOverviewStats,
  GeofenceConfig,
  EmployeeSelectOption,
  AttendanceStatus,
  CheckInMethod,
} from "../types/attendance";
import { DEFAULT_GEOFENCE } from "../utils/attendance-utils";

export {
  DEFAULT_GEOFENCE,
  calculateDistanceInMeters,
  getIndividualAttendanceHistory,
} from "../utils/attendance-utils";

export interface CompanyAttendanceResponse {
  companyName: string;
  workDate: string;
  branchConfig: GeofenceConfig;
  records: AttendanceRecord[];
  stats: AttendanceOverviewStats;
  employees: EmployeeSelectOption[];
}

/**
 * Consulta la asistencia real de los colaboradores de la empresa para una fecha determinada.
 * Cero mock data: lee directamente de public.company_employees, public.company_attendance y public.company_leaves.
 */
export async function getCompanyAttendanceData(
  targetDate?: string
): Promise<CompanyAttendanceResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayStr = targetDate || new Date().toISOString().split("T")[0];

  let companyName = "Mi Empresa";
  const branchConfig: GeofenceConfig = { ...DEFAULT_GEOFENCE };

  if (!user) {
    return {
      companyName,
      workDate: todayStr,
      branchConfig,
      records: [],
      stats: {
        totalScheduled: 0,
        presentCount: 0,
        lateCount: 0,
        unjustifiedAbsences: 0,
        justifiedAbsences: 0,
        punctualityRate: 100,
        totalOvertimeHoursToday: 0,
        pendingJustificationsCount: 0,
      },
      employees: [],
    };
  }

  // 1. Consultar perfil de la empresa, colaboradores activos, asistencias de la fecha y permisos aprobados
  const [profileRes, employeesRes, attendanceRes, leavesRes] =
    await Promise.all([
      supabase
        .from("company_profiles")
        .select("company_name, address_details, fiscal_address")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("company_employees")
        .select(`
          id,
          full_name,
          job_title,
          department,
          avatar_url,
          work_schedule,
          status
        `)
        .eq("company_id", user.id)
        .not("status", "eq", "terminated")
        .order("full_name", { ascending: true }),
      supabase
        .from("company_attendance")
        .select("*")
        .eq("company_id", user.id)
        .eq("work_date", todayStr),
      supabase
        .from("company_leaves")
        .select("*")
        .eq("company_id", user.id)
        .eq("status", "aprobada")
        .lte("start_date", todayStr)
        .gte("end_date", todayStr),
    ]);

  if (profileRes.data?.company_name) {
    companyName = profileRes.data.company_name;
    branchConfig.branchName = `Sucursal Principal - ${profileRes.data.company_name}`;
    if (profileRes.data.address_details || profileRes.data.fiscal_address) {
      branchConfig.address =
        profileRes.data.address_details || profileRes.data.fiscal_address || branchConfig.address;
    }
  }

  const rawEmployees = employeesRes.data || [];
  const rawAttendance = attendanceRes.data || [];
  const rawLeaves = leavesRes.data || [];

  // Mapear opciones para selectores de colaboradores
  const employeeOptions: EmployeeSelectOption[] = rawEmployees.map((emp) => ({
    id: emp.id,
    name: emp.full_name || "Colaborador",
    jobTitle: emp.job_title || "Puesto General",
    department: emp.department || "Operaciones",
    avatarUrl: emp.avatar_url || null,
    workSchedule: emp.work_schedule || "08:00 - 17:00",
  }));

  // Indexar checadas existentes por employee_id
  const attendanceByEmployee = new Map<string, any>();
  rawAttendance.forEach((att) => {
    attendanceByEmployee.set(att.employee_id, att);
  });

  // Indexar permisos aprobados por employee_id
  const leavesByEmployee = new Map<string, any>();
  rawLeaves.forEach((leave) => {
    if (leave.employee_id) {
      leavesByEmployee.set(leave.employee_id, leave);
    }
  });

  // Determinar si hoy es domingo
  const dateObj = new Date(todayStr + "T12:00:00Z");
  const isSunday = dateObj.getDay() === 0;

  // 2. Construir los registros de asistencia combinando plantilla y registros reales
  const records: AttendanceRecord[] = rawEmployees.map((emp) => {
    const existing = attendanceByEmployee.get(emp.id);
    const activeLeave = leavesByEmployee.get(emp.id);

    let scheduledCheckIn = "08:00";
    let scheduledCheckOut = "17:00";
    if (emp.work_schedule && emp.work_schedule.includes("-")) {
      const parts = emp.work_schedule.split("-").map((p: string) => p.trim());
      if (parts[0]) scheduledCheckIn = parts[0];
      if (parts[1]) scheduledCheckOut = parts[1];
    }

    if (existing) {
      let justification = undefined;
      if (existing.justification_status || existing.justification_reason_type) {
        justification = {
          id: `just-${existing.id}`,
          attendanceRecordId: existing.id,
          employeeId: emp.id,
          employeeName: emp.full_name,
          workDate: todayStr,
          reasonType: (existing.justification_reason_type || "personal") as any,
          reasonLabel: existing.justification_label || "Justificante Laboral",
          comments: existing.justification_comments || "",
          evidenceUrl: existing.justification_evidence_url || null,
          status: (existing.justification_status || "pendiente") as any,
          submittedAt: existing.justification_submitted_at
            ? new Date(existing.justification_submitted_at).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Hoy",
          reviewedAt: existing.justification_reviewed_at
            ? new Date(existing.justification_reviewed_at).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : undefined,
          reviewedBy: existing.justification_reviewed_by || undefined,
        };
      }

      let checkInLocation = undefined;
      if (existing.check_in_lat && existing.check_in_lng) {
        checkInLocation = {
          lat: Number(existing.check_in_lat),
          lng: Number(existing.check_in_lng),
          accuracyMeters: existing.check_in_accuracy ? Number(existing.check_in_accuracy) : undefined,
          distanceToBranchMeters: existing.check_in_distance_meters
            ? Number(existing.check_in_distance_meters)
            : 0,
        };
      }

      return {
        id: existing.id,
        employeeId: emp.id,
        employeeName: emp.full_name,
        avatarUrl: emp.avatar_url || null,
        jobTitle: emp.job_title || "Colaborador",
        department: emp.department || "Operaciones",
        workDate: todayStr,
        scheduledCheckIn: existing.scheduled_check_in || scheduledCheckIn,
        scheduledCheckOut: existing.scheduled_check_out || scheduledCheckOut,
        checkInTime: existing.check_in_time || null,
        checkOutTime: existing.check_out_time || null,
        breakStartTime: existing.break_start_time || null,
        breakEndTime: existing.break_end_time || null,
        checkInMethod: (existing.check_in_method || "manual") as CheckInMethod,
        checkInLocation,
        delayMinutes: existing.delay_minutes || 0,
        status: existing.status as AttendanceStatus,
        overtimeHours: Number(existing.overtime_hours) || 0,
        overtimeStatus: existing.overtime_status || undefined,
        overtimeRateType: existing.overtime_rate_type || undefined,
        justification,
      };
    }

    // Si no hay registro previo en la BD para hoy:
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

  // 3. Calcular métricas ejecutivas de asistencia reales
  const presentCount = records.filter((r) => r.status === "presente").length;
  const lateCount = records.filter((r) => r.status === "retardo").length;
  const unjustifiedAbsences = records.filter((r) => r.status === "falta_injustificada").length;
  const justifiedAbsences = records.filter(
    (r) => r.status === "falta_justificada" || r.status === "incapacidad"
  ).length;
  const totalScheduled = records.filter((r) => r.status !== "descanso" && r.status !== "vacaciones").length;

  const attended = presentCount + lateCount;
  const punctualityRate = attended > 0 ? Math.round((presentCount / attended) * 100) : 100;

  const totalOvertimeHoursToday = records.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);
  const pendingJustificationsCount = records.filter((r) => r.justification?.status === "pendiente").length;

  const stats: AttendanceOverviewStats = {
    totalScheduled,
    presentCount,
    lateCount,
    unjustifiedAbsences,
    justifiedAbsences,
    punctualityRate,
    totalOvertimeHoursToday,
    pendingJustificationsCount,
  };

  return {
    companyName,
    workDate: todayStr,
    branchConfig,
    records,
    stats,
    employees: employeeOptions,
  };
}
