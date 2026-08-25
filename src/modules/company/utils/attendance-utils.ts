import {
  GeofenceConfig,
  EmployeeAttendanceHistory,
  EmployeeAttendanceDay,
  AttendanceStatus,
} from "../types/attendance";

// Default branch geofence (Riviera Maya / Cancún hub)
export const DEFAULT_GEOFENCE: GeofenceConfig = {
  latitude: 20.6296,
  longitude: -87.0739,
  radiusMeters: 150,
  branchName: "Oficina Central Riviera Maya",
  address: "Av. Constituyentes #120, Gonzalo Guerrero, Playa del Carmen, Q.R.",
};

// Haversine distance calculator in meters between two GPS coordinates
export function calculateDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Generate monthly dossier/history for an individual employee
export function getIndividualAttendanceHistory(
  employeeId: string,
  employeeName: string,
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear()
): EmployeeAttendanceHistory {
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNamesShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const days: EmployeeAttendanceDay[] = [];
  let daysPresent = 0;
  let daysLate = 0;
  let daysAbsent = 0;
  let daysJustified = 0;
  let totalEffectiveHours = 0;
  let totalOvertimeHours = 0;

  const currentDayNumber = new Date().getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeekIndex = dateObj.getDay();
    const dayOfWeek = dayNamesShort[dayOfWeekIndex];
    const isSunday = dayOfWeekIndex === 0;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    if (isSunday) {
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
        notes: "Día de descanso semanal",
      });
      continue;
    }

    // Future days in current month
    if (d > currentDayNumber) {
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
      });
      continue;
    }

    // Deterministic distribution for sample employee
    const seed = (d * 17 + employeeName.length * 3) % 20;

    let status: AttendanceStatus = "presente";
    let checkIn = "07:55";
    let checkOut = "17:05";
    let delay = 0;
    let ot = 0;
    let effective = 8.0;

    if (seed === 2 || seed === 8) {
      status = "retardo";
      checkIn = "08:22";
      delay = 22;
      daysLate++;
    } else if (seed === 14) {
      status = "falta_justificada";
      checkIn = null as any;
      checkOut = null as any;
      effective = 0;
      daysJustified++;
    } else if (seed === 19 && d < currentDayNumber - 2) {
      status = "falta_injustificada";
      checkIn = null as any;
      checkOut = null as any;
      effective = 0;
      daysAbsent++;
    } else {
      status = "presente";
      if (d % 6 === 0) {
        ot = 2.0;
        checkOut = "19:00";
        effective = 10.0;
        totalOvertimeHours += ot;
      }
      daysPresent++;
    }

    totalEffectiveHours += effective;

    days.push({
      date: dateStr,
      dayOfWeek,
      dayNumber: d,
      status,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      effectiveHours: effective,
      delayMinutes: delay,
      overtimeHours: ot,
    });
  }

  const totalEvaluated = daysPresent + daysLate;
  const individualPunctualityRate =
    totalEvaluated > 0 ? Math.round((daysPresent / totalEvaluated) * 100) : 95;

  return {
    employeeId,
    employeeName,
    jobTitle: "Colaborador K'anPro",
    department: "Operaciones",
    month,
    year,
    monthName: monthNames[month - 1],
    totalWorkDays: daysInMonth - Math.floor(daysInMonth / 7),
    daysPresent,
    daysLate,
    daysAbsent,
    daysJustified,
    totalEffectiveHours,
    totalOvertimeHours,
    individualPunctualityRate,
    days,
  };
}
