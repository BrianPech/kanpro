"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  AttendanceStatus,
  CheckInMethod,
  EmployeeAttendanceHistory,
  EmployeeAttendanceDay,
} from "../types/attendance";

export interface MobileCheckInInput {
  employeeId: string;
  actionType: "check_in" | "check_out" | "break_start" | "break_end";
  method: CheckInMethod;
  coordinates?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  distanceMeters?: number;
  qrToken?: string;
}

export interface ManualAttendanceInput {
  employeeId: string;
  workDate: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: AttendanceStatus;
  delayMinutes?: number;
  notes?: string;
}

export interface AuthorizeOvertimeInput {
  recordId: string;
  hours: number;
  rateType: "doble" | "triple";
  notes?: string;
}

export interface ReviewJustificationInput {
  recordId: string;
  decision: "aprobada" | "rechazada";
  comments?: string;
}

/**
 * Registra checada móvil (GPS o QR) para un colaborador
 */
export async function recordAttendanceCheckInAction(input: MobileCheckInInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado. Inicie sesión para registrar asistencia." };
  }

  // 1. Obtener información del colaborador para validar que pertenezca a la empresa
  const { data: employee, error: empError } = await supabase
    .from("company_employees")
    .select("id, company_id, full_name, work_schedule, department, job_title")
    .eq("id", input.employeeId)
    .single();

  if (empError || !employee) {
    return { success: false, error: "Colaborador no encontrado en la plantilla de la empresa." };
  }

  const now = new Date();
  const workDate = now.toISOString().split("T")[0];
  const timeStr = now.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Determinar horario programado (por defecto 08:00)
  let scheduledCheckIn = "08:00";
  let scheduledCheckOut = "17:00";
  if (employee.work_schedule && employee.work_schedule.includes("-")) {
    const parts = employee.work_schedule.split("-").map((p) => p.trim());
    if (parts[0]) scheduledCheckIn = parts[0];
    if (parts[1]) scheduledCheckOut = parts[1];
  }

  // Calcular retardo con 15 min de tolerancia
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const scheduledHour = parseInt(scheduledCheckIn.split(":")[0], 10) || 8;
  const scheduledMin = parseInt(scheduledCheckIn.split(":")[1], 10) || 0;

  const currentMinutesFromMidnight = currentHour * 60 + currentMin;
  const scheduledMinutesFromMidnight = scheduledHour * 60 + scheduledMin;
  const toleranceMinutes = 15;

  const isLate = currentMinutesFromMidnight > scheduledMinutesFromMidnight + toleranceMinutes;
  const delayMinutes = isLate ? currentMinutesFromMidnight - scheduledMinutesFromMidnight : 0;

  // Consultar si ya existe registro para hoy
  const { data: existingRecord } = await supabase
    .from("company_attendance")
    .select("*")
    .eq("company_id", employee.company_id)
    .eq("employee_id", employee.id)
    .eq("work_date", workDate)
    .maybeSingle();

  let result;
  if (existingRecord) {
    // Actualizar registro existente según acción
    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.actionType === "check_in") {
      updatePayload.check_in_time = timeStr;
      updatePayload.check_in_method = input.method;
      updatePayload.delay_minutes = delayMinutes;
      updatePayload.status = isLate ? "retardo" : "presente";
      if (input.coordinates) {
        updatePayload.check_in_lat = input.coordinates.lat;
        updatePayload.check_in_lng = input.coordinates.lng;
        updatePayload.check_in_accuracy = input.coordinates.accuracy || null;
      }
      if (input.distanceMeters != null) {
        updatePayload.check_in_distance_meters = input.distanceMeters;
      }
    } else if (input.actionType === "check_out") {
      updatePayload.check_out_time = timeStr;
    } else if (input.actionType === "break_start") {
      updatePayload.break_start_time = timeStr;
    } else if (input.actionType === "break_end") {
      updatePayload.break_end_time = timeStr;
    }

    result = await supabase
      .from("company_attendance")
      .update(updatePayload)
      .eq("id", existingRecord.id)
      .select()
      .single();
  } else {
    // Insertar nuevo registro
    const insertPayload: any = {
      company_id: employee.company_id,
      employee_id: employee.id,
      work_date: workDate,
      scheduled_check_in: scheduledCheckIn,
      scheduled_check_out: scheduledCheckOut,
      check_in_method: input.method,
      check_in_time: input.actionType === "check_in" ? timeStr : null,
      check_out_time: input.actionType === "check_out" ? timeStr : null,
      break_start_time: input.actionType === "break_start" ? timeStr : null,
      break_end_time: input.actionType === "break_end" ? timeStr : null,
      delay_minutes: input.actionType === "check_in" && isLate ? delayMinutes : 0,
      status: input.actionType === "check_in" && isLate ? "retardo" : "presente",
      check_in_lat: input.coordinates?.lat || null,
      check_in_lng: input.coordinates?.lng || null,
      check_in_accuracy: input.coordinates?.accuracy || null,
      check_in_distance_meters: input.distanceMeters ?? null,
    };

    result = await supabase
      .from("company_attendance")
      .insert(insertPayload)
      .select()
      .single();
  }

  if (result.error) {
    console.error("Error registrando asistencia:", result.error);
    return { success: false, error: result.error.message };
  }

  revalidatePath("/dashboard/company/attendance");
  revalidatePath("/dashboard/company");

  return {
    success: true,
    record: result.data,
    timeStr,
    isLate,
    delayMinutes,
  };
}

/**
 * Captura manual de checada o incidencia por Recursos Humanos
 */
export async function createManualAttendanceAction(input: ManualAttendanceInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  const { data: employee } = await supabase
    .from("company_employees")
    .select("id, company_id, full_name, work_schedule")
    .eq("id", input.employeeId)
    .single();

  if (!employee || employee.company_id !== user.id) {
    return { success: false, error: "Colaborador no encontrado o no pertenece a tu empresa." };
  }

  let scheduledCheckIn = "08:00";
  let scheduledCheckOut = "17:00";
  if (employee.work_schedule && employee.work_schedule.includes("-")) {
    const parts = employee.work_schedule.split("-").map((p) => p.trim());
    if (parts[0]) scheduledCheckIn = parts[0];
    if (parts[1]) scheduledCheckOut = parts[1];
  }

  const payload = {
    company_id: user.id,
    employee_id: input.employeeId,
    work_date: input.workDate,
    scheduled_check_in: scheduledCheckIn,
    scheduled_check_out: scheduledCheckOut,
    check_in_time: input.checkInTime || null,
    check_out_time: input.checkOutTime || null,
    check_in_method: "manual" as const,
    delay_minutes: input.delayMinutes || (input.status === "retardo" ? 20 : 0),
    status: input.status,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("company_attendance")
    .upsert(payload, { onConflict: "company_id,employee_id,work_date" })
    .select()
    .single();

  if (error) {
    console.error("Error creating manual attendance:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/company/attendance");
  revalidatePath("/dashboard/company");

  return { success: true, record: data };
}

/**
 * Autoriza o rechaza horas extras conforme al Art. 67 y 68 LFT
 */
export async function authorizeOvertimeAction(input: AuthorizeOvertimeInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const { data, error } = await supabase
    .from("company_attendance")
    .update({
      overtime_hours: input.hours,
      overtime_status: "autorizado",
      overtime_rate_type: input.rateType,
      overtime_notes: input.notes?.trim() || `Autorizadas ${input.hours} horas a tarifa ${input.rateType}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.recordId)
    .eq("company_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error authorizing overtime:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/company/attendance");
  revalidatePath("/dashboard/company/payroll");

  return { success: true, record: data };
}

/**
 * Revisa y resuelve un justificante médico o laboral
 */
export async function reviewAttendanceJustificationAction(input: ReviewJustificationInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const newStatus: AttendanceStatus =
    input.decision === "aprobada" ? "falta_justificada" : "falta_injustificada";

  const { data, error } = await supabase
    .from("company_attendance")
    .update({
      status: newStatus,
      justification_status: input.decision,
      justification_reviewed_at: new Date().toISOString(),
      justification_reviewed_by: user.email || "Recursos Humanos",
      justification_comments: input.comments?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.recordId)
    .eq("company_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error reviewing attendance justification:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/company/attendance");
  revalidatePath("/dashboard/company/payroll");

  return { success: true, record: data };
}

/**
 * Obtiene el expediente histórico mensual real de un colaborador
 */
export async function getEmployeeAttendanceHistoryAction(
  employeeId: string,
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear()
): Promise<{ success: boolean; history?: EmployeeAttendanceHistory; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const { data: employee } = await supabase
    .from("company_employees")
    .select("id, full_name, avatar_url, job_title, department")
    .eq("id", employeeId)
    .eq("company_id", user.id)
    .single();

  if (!employee) {
    return { success: false, error: "Colaborador no encontrado." };
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const { data: records } = await supabase
    .from("company_attendance")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("work_date", startDate)
    .lte("work_date", endDate)
    .order("work_date", { ascending: true });

  const recordsByDate = new Map<string, any>();
  (records || []).forEach((r) => {
    recordsByDate.set(r.work_date, r);
  });

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const dayNamesShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const days: EmployeeAttendanceDay[] = [];
  let daysPresent = 0;
  let daysLate = 0;
  let daysAbsent = 0;
  let daysJustified = 0;
  let totalEffectiveHours = 0;
  let totalOvertimeHours = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeekIndex = dateObj.getDay();
    const dayOfWeek = dayNamesShort[dayOfWeekIndex];
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
    } else if (isSunday) {
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
      });
    }
  }

  const attended = daysPresent;
  const punctualityRate = attended > 0 ? Math.round(((daysPresent - daysLate) / attended) * 100) : 100;

  const history: EmployeeAttendanceHistory = {
    employeeId: employee.id,
    employeeName: employee.full_name,
    avatarUrl: employee.avatar_url,
    jobTitle: employee.job_title || "Colaborador",
    department: employee.department || "Operaciones",
    month,
    year,
    monthName: monthNames[month - 1],
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

  return { success: true, history };
}
