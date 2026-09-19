"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculateWorkingDays } from "../utils/vacation-calculator";
import { VacationRequestType } from "../types/employee-dossier";
import type { Database } from "@/types/supabase";

type CompanyLeaveUpdate = Database["public"]["Tables"]["company_leaves"]["Update"];
type CompanyLeaveInsert = Database["public"]["Tables"]["company_leaves"]["Insert"];

export interface RespondToLeaveRequestInput {
  requestId: string;
  decision: "aprobada" | "rechazada";
  rejectionReason?: string;
}

export interface CreateCompanyLeaveInput {
  employeeId: string;
  requestType: VacationRequestType;
  startDate: string;
  endDate: string;
  reason?: string;
}

const TYPE_LABELS: Record<VacationRequestType, string> = {
  vacaciones: "Vacaciones LFT",
  permiso_con_goce: "Permiso con Goce de Sueldo",
  permiso_sin_goce: "Permiso sin Goce de Sueldo",
  paternidad: "Permiso por Paternidad",
  maternidad: "Incapacidad por Maternidad",
  luto: "Permiso por Luto",
};

/**
 * Server Action: Company HR approves or rejects an employee vacation/leave request.
 * Persists status in public.company_leaves and alerts employee via in-app notification.
 */
export async function respondToCompanyLeaveAction(input: RespondToLeaveRequestInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  if (!input.requestId || !input.decision) {
    throw new Error("Parámetros de resolución de solicitud inválidos.");
  }

  // 1. Fetch leave verifying company ownership
  const { data: leave, error: fetchErr } = await supabase
    .from("company_leaves")
    .select(`
      id,
      company_id,
      employee_id,
      candidate_id,
      request_type,
      start_date,
      end_date,
      total_working_days
    `)
    .eq("id", input.requestId)
    .eq("company_id", user.id)
    .single();

  if (fetchErr || !leave) {
    throw new Error("No se encontró la solicitud de vacaciones o no pertenece a tu empresa.");
  }

  const now = new Date().toISOString();

  // 2. Update status in database
  const updatePayload: CompanyLeaveUpdate = {
    status: input.decision,
    reviewed_at: now,
    reviewed_by: "Recursos Humanos",
    rejection_reason: input.decision === "rechazada" ? input.rejectionReason?.trim() || null : null,
    updated_at: now,
  };

  const { error: updateErr } = await supabase
    .from("company_leaves")
    .update(updatePayload)
    .eq("id", input.requestId);

  if (updateErr) {
    console.error("Error updating leave resolution:", updateErr);
    throw new Error(updateErr.message || "Error al registrar la resolución en la base de datos.");
  }

  // 3. Resolve target user to notify
  let targetUserId = leave.candidate_id;

  if (!targetUserId && leave.employee_id) {
    // Find candidate by employee email in auth/profiles
    const { data: emp } = await supabase
      .from("company_employees")
      .select("email, employee_id")
      .eq("id", leave.employee_id)
      .maybeSingle();

    if (emp?.employee_id) {
      targetUserId = emp.employee_id;
    } else if (emp?.email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", emp.email)
        .maybeSingle();
      if (profile?.id) {
        targetUserId = profile.id;
      }
    }
  }

  // 4. Send notification to the employee
  if (targetUserId) {
    try {
      const isApproved = input.decision === "aprobada";
      const typeLabel = TYPE_LABELS[leave.request_type as VacationRequestType] || "Vacaciones";

      await supabase.from("notifications").insert({
        user_id: targetUserId,
        title: isApproved
          ? `¡Solicitud de ${typeLabel} aprobada!`
          : `Actualización de solicitud de ${typeLabel}`,
        description: isApproved
          ? `Tu solicitud de ${leave.total_working_days} día(s) del ${leave.start_date} al ${leave.end_date} ha sido aprobada por Recursos Humanos.`
          : `Tu solicitud de descanso del ${leave.start_date} al ${leave.end_date} fue rechazada.${input.rejectionReason ? ` Motivo: "${input.rejectionReason.trim()}".` : ""}`,
        type: isApproved ? "leave_approved" : "leave_rejected",
      });
    } catch (notifErr) {
      console.error("Error notifying employee of leave resolution:", notifErr);
    }
  }

  // 5. Revalidate paths
  revalidatePath("/dashboard/company/leaves");
  revalidatePath("/dashboard/company");
  revalidatePath("/dashboard/candidate/leaves");
  revalidatePath("/dashboard/candidate");

  return {
    success: true,
    message: input.decision === "aprobada"
      ? "Solicitud aprobada con éxito. Días descontados del saldo del colaborador."
      : "Solicitud rechazada. Se ha notificado al colaborador.",
  };
}

/**
 * Server Action: Company HR directly creates/registers a leave for an employee.
 */
export async function createCompanyLeaveAction(input: CreateCompanyLeaveInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  if (!input.employeeId || !input.requestType || !input.startDate || !input.endDate) {
    throw new Error("Todos los datos de la solicitud son obligatorios.");
  }

  const workingDays = calculateWorkingDays(input.startDate, input.endDate);
  if (workingDays <= 0) {
    throw new Error("El rango de fechas no contiene días hábiles.");
  }

  // Verify employee belongs to company
  const { data: emp, error: empErr } = await supabase
    .from("company_employees")
    .select("id, full_name, email, employee_id")
    .eq("id", input.employeeId)
    .eq("company_id", user.id)
    .single();

  if (empErr || !emp) {
    throw new Error("El colaborador no pertenece a tu plantilla.");
  }

  const now = new Date().toISOString();

  const payload: CompanyLeaveInsert = {
    company_id: user.id,
    employee_id: emp.id,
    candidate_id: emp.employee_id || null,
    request_type: input.requestType,
    start_date: input.startDate,
    end_date: input.endDate,
    total_working_days: workingDays,
    reason: input.reason?.trim() || "Registrado por Recursos Humanos.",
    status: "aprobada", // Direct capture by HR is auto-approved
    reviewed_at: now,
    reviewed_by: "Recursos Humanos",
  };

  const { data: inserted, error: insertErr } = await supabase
    .from("company_leaves")
    .insert(payload)
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("Error creating company leave:", insertErr);
    throw new Error(insertErr?.message || "No se pudo registrar la solicitud.");
  }

  revalidatePath("/dashboard/company/leaves");
  revalidatePath("/dashboard/company");
  revalidatePath("/dashboard/candidate/leaves");

  return {
    success: true,
    message: `Permiso de ${TYPE_LABELS[input.requestType]} registrado y aprobado exitosamente (${workingDays} días hábiles).`,
    leaveId: inserted.id,
  };
}
