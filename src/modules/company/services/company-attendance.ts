import { createClient } from "@/lib/supabase/server";
import {
  AttendanceRecord,
  AttendanceOverviewStats,
  GeofenceConfig,
} from "../types/attendance";
import { DEFAULT_GEOFENCE } from "../utils/attendance-utils";

export { DEFAULT_GEOFENCE, calculateDistanceInMeters, getIndividualAttendanceHistory } from "../utils/attendance-utils";

// Generate realistic daily attendance data for company
export async function getCompanyAttendanceData(targetDate?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayStr = targetDate || new Date().toISOString().split("T")[0];

  // Try to query real company profile and employees if available
  let companyName = "Mi Empresa";
  let branchConfig: GeofenceConfig = { ...DEFAULT_GEOFENCE };

  if (user) {
    const { data: profile } = await supabase
      .from("company_profiles")
      .select("company_name, address_details")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.company_name) {
      companyName = profile.company_name;
      branchConfig.branchName = `Sucursal Principal - ${profile.company_name}`;
      if (profile.address_details) {
        branchConfig.address = profile.address_details;
      }
    }
  }

  // Pre-configured baseline records for robust interactivity
  const initialRecords: AttendanceRecord[] = [
    {
      id: "att-001",
      employeeId: "emp-001",
      employeeName: "Carlos Mendoza",
      jobTitle: "Supervisor de Mantenimiento",
      department: "Operaciones",
      workDate: todayStr,
      scheduledCheckIn: "08:00",
      scheduledCheckOut: "17:00",
      checkInTime: "07:54",
      checkOutTime: null,
      breakStartTime: null,
      breakEndTime: null,
      checkInMethod: "gps",
      checkInLocation: {
        lat: 20.6295,
        lng: -87.0738,
        distanceToBranchMeters: 18,
      },
      delayMinutes: 0,
      status: "presente",
      overtimeHours: 0,
    },
    {
      id: "att-002",
      employeeId: "emp-002",
      employeeName: "Mariana Silva",
      jobTitle: "Capitán de Meseros",
      department: "Alimentos y Bebidas",
      workDate: todayStr,
      scheduledCheckIn: "08:00",
      scheduledCheckOut: "16:30",
      checkInTime: "08:18",
      checkOutTime: null,
      breakStartTime: null,
      breakEndTime: null,
      checkInMethod: "qr",
      delayMinutes: 18,
      status: "retardo",
      overtimeHours: 0,
    },
    {
      id: "att-003",
      employeeId: "emp-003",
      employeeName: "Alejandro Ruiz",
      jobTitle: "Cocinero A",
      department: "Cocina & Producción",
      workDate: todayStr,
      scheduledCheckIn: "07:00",
      scheduledCheckOut: "15:30",
      checkInTime: "06:55",
      checkOutTime: "17:30",
      breakStartTime: "11:30",
      breakEndTime: "12:30",
      checkInMethod: "qr",
      delayMinutes: 0,
      status: "presente",
      overtimeHours: 2.0,
      overtimeStatus: "pendiente",
    },
    {
      id: "att-004",
      employeeId: "emp-004",
      employeeName: "Sofía Morales",
      jobTitle: "Recepcionista Bilingüe",
      department: "Front Desk",
      workDate: todayStr,
      scheduledCheckIn: "08:30",
      scheduledCheckOut: "17:30",
      checkInTime: null,
      checkOutTime: null,
      breakStartTime: null,
      breakEndTime: null,
      checkInMethod: "manual",
      delayMinutes: 0,
      status: "falta_injustificada",
      overtimeHours: 0,
    },
    {
      id: "att-005",
      employeeId: "emp-005",
      employeeName: "Rodrigo Vargas",
      jobTitle: "Auxiliar Administrativo",
      department: "Administración",
      workDate: todayStr,
      scheduledCheckIn: "09:00",
      scheduledCheckOut: "18:00",
      checkInTime: null,
      checkOutTime: null,
      breakStartTime: null,
      breakEndTime: null,
      checkInMethod: "manual",
      delayMinutes: 0,
      status: "falta_justificada",
      overtimeHours: 0,
      justification: {
        id: "just-001",
        attendanceRecordId: "att-005",
        employeeId: "emp-005",
        employeeName: "Rodrigo Vargas",
        workDate: todayStr,
        reasonType: "medica",
        reasonLabel: "Incapacidad Médica IMSS",
        comments: "Cita programada en UMF 11 IMSS por cuadro gripal.",
        evidenceUrl: "/assets/docs/incapacidad_sample.pdf",
        status: "aprobada",
        submittedAt: "Hoy, 07:15 AM",
        reviewedAt: "Hoy, 08:00 AM",
        reviewedBy: "Recursos Humanos",
      },
    },
    {
      id: "att-006",
      employeeId: "emp-006",
      employeeName: "Valeria Gómez",
      jobTitle: "Hostess",
      department: "Alimentos y Bebidas",
      workDate: todayStr,
      scheduledCheckIn: "08:00",
      scheduledCheckOut: "16:00",
      checkInTime: "07:58",
      checkOutTime: null,
      breakStartTime: null,
      breakEndTime: null,
      checkInMethod: "gps",
      checkInLocation: {
        lat: 20.6297,
        lng: -87.0741,
        distanceToBranchMeters: 25,
      },
      delayMinutes: 0,
      status: "presente",
      overtimeHours: 0,
    },
  ];

  const presentCount = initialRecords.filter((r) => r.status === "presente").length;
  const lateCount = initialRecords.filter((r) => r.status === "retardo").length;
  const unjustifiedAbsences = initialRecords.filter((r) => r.status === "falta_injustificada").length;
  const justifiedAbsences = initialRecords.filter((r) => r.status === "falta_justificada").length;
  const totalScheduled = initialRecords.length;

  const attended = presentCount + lateCount;
  const punctualityRate = attended > 0 ? Math.round((presentCount / attended) * 100) : 100;

  const stats: AttendanceOverviewStats = {
    totalScheduled,
    presentCount,
    lateCount,
    unjustifiedAbsences,
    justifiedAbsences,
    punctualityRate,
    totalOvertimeHoursToday: 2.0,
    pendingJustificationsCount: 0,
  };

  return {
    companyName,
    workDate: todayStr,
    branchConfig,
    records: initialRecords,
    stats,
  };
}
