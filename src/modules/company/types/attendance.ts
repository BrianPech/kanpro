export type AttendanceStatus =
  | "presente"
  | "retardo"
  | "falta_injustificada"
  | "falta_justificada"
  | "descanso"
  | "vacaciones"
  | "incapacidad";

export type CheckInMethod = "gps" | "qr" | "manual";

export interface GeofenceConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  branchName: string;
  address: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  avatarUrl?: string | null;
  jobTitle: string;
  department: string;
  workDate: string; // YYYY-MM-DD
  scheduledCheckIn: string; // "08:00"
  scheduledCheckOut: string; // "17:00"
  checkInTime: string | null; // "08:14"
  checkOutTime: string | null; // "17:35"
  breakStartTime: string | null; // "13:00"
  breakEndTime: string | null; // "14:00"
  checkInMethod: CheckInMethod;
  checkInLocation?: {
    lat: number;
    lng: number;
    accuracyMeters?: number;
    distanceToBranchMeters: number;
  };
  delayMinutes: number; // e.g. 14
  status: AttendanceStatus;
  overtimeHours: number; // e.g. 0.5
  overtimeStatus?: "pendiente" | "autorizado" | "rechazado";
  overtimeRateType?: "doble" | "triple";
  justification?: AttendanceJustification;
}

export interface EmployeeSelectOption {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  avatarUrl?: string | null;
  workSchedule?: string | null;
}

export interface AttendanceJustification {
  id: string;
  attendanceRecordId: string;
  employeeId: string;
  employeeName: string;
  workDate: string;
  reasonType: "medica" | "transporte" | "fuerza_mayor" | "personal";
  reasonLabel: string;
  comments: string;
  evidenceUrl?: string | null;
  status: "pendiente" | "aprobada" | "rechazada";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface OvertimeEntry {
  id: string;
  attendanceRecordId: string;
  employeeId: string;
  employeeName: string;
  workDate: string;
  hours: number;
  overtimeType: "doble" | "triple";
  calculatedAmount: number;
  status: "pendiente" | "autorizado" | "rechazado";
  notes?: string;
}

export interface AttendanceOverviewStats {
  totalScheduled: number;
  presentCount: number;
  lateCount: number;
  unjustifiedAbsences: number;
  justifiedAbsences: number;
  punctualityRate: number; // Percentage, e.g. 96
  totalOvertimeHoursToday: number;
  pendingJustificationsCount: number;
}

export interface EmployeeAttendanceDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Lun", "Mar", etc.
  dayNumber: number; // 1 to 31
  status: AttendanceStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  effectiveHours: number;
  delayMinutes: number;
  overtimeHours: number;
  notes?: string;
}

export interface EmployeeAttendanceHistory {
  employeeId: string;
  employeeName: string;
  avatarUrl?: string | null;
  jobTitle: string;
  department: string;
  month: number; // 1 to 12
  year: number;
  monthName: string;
  totalWorkDays: number;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  daysJustified: number;
  totalEffectiveHours: number;
  totalOvertimeHours: number;
  individualPunctualityRate: number;
  days: EmployeeAttendanceDay[];
}

export interface MobileCheckInPayload {
  employeeId: string;
  employeeName: string;
  actionType: "check_in" | "check_out" | "break_start" | "break_end";
  method: CheckInMethod;
  coordinates?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  qrToken?: string;
  deviceInfo?: string;
}
