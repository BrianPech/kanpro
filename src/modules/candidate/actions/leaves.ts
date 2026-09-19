"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculateWorkingDays, calculateLFTVacationDays } from "@/modules/company/utils/vacation-calculator";
import { LeaveRequestType } from "../services/candidate-leaves";
import type { Database } from "@/types/supabase";

type CompanyLeaveInsert = Database["public"]["Tables"]["company_leaves"]["Insert"];

export interface SubmitLeaveRequestInput {
  companyId: string;
  employeeId?: string;
  requestType: LeaveRequestType;
  startDate: string;
  endDate: string;
  reason?: string;
}

const TYPE_LABELS: Record<LeaveRequestType, string> = {
  vacaciones: "Vacaciones Anuales LFT",
  permiso_con_goce: "Permiso con Goce de Sueldo",
  permiso_sin_goce: "Permiso sin Goce de Sueldo",
  paternidad: "Permiso por Paternidad (LFT)",
  maternidad: "Incapacidad por Maternidad (LFT/IMSS)",
  luto: "Permiso por Luto",
};

/**
 * Server Action: Candidate / Employee submits a vacation or leave request.
 * Computes business working days, validates LFT Art. 76 vacation balance if applicable,
 * persists the request in public.company_leaves, and alerts company HR via in-app notification.
 */
export async function submitCandidateLeaveRequestAction(input: SubmitLeaveRequestInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  if (!input.companyId || !input.requestType || !input.startDate || !input.endDate) {
    throw new Error("Todos los campos requeridos deben ser proporcionados.");
  }

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    throw new Error("El rango de fechas seleccionado es inválido.");
  }

  // Calculate working days according to LFT (excluding Sundays)
  const workingDays = calculateWorkingDays(input.startDate, input.endDate);

  if (workingDays <= 0) {
    throw new Error("El periodo seleccionado no contiene días laborales hábiles.");
  }

  // If requesting annual vacations, validate against available LFT balance
  if (input.requestType === "vacaciones") {
    // 1. Fetch active contract or employee record to get hire date
    const { data: contract } = await supabase
      .from("company_contracts")
      .select("start_date")
      .eq("candidate_id", user.id)
      .eq("company_id", input.companyId)
      .neq("status", "cancelado")
      .maybeSingle();

    let hireDate: string | null | undefined = contract?.start_date;
    if (!hireDate && input.employeeId) {
      const { data: emp } = await supabase
        .from("company_employees")
        .select("hire_date")
        .eq("id", input.employeeId)
        .maybeSingle();
      hireDate = emp?.hire_date;
    }

    const effectiveHireDate = hireDate || new Date().toISOString().split("T")[0];
    const lft = calculateLFTVacationDays(effectiveHireDate);

    // 2. Fetch existing vacation leaves
    const { data: existingLeaves } = await supabase
      .from("company_leaves")
      .select("total_working_days, status")
      .eq("company_id", input.companyId)
      .eq("request_type", "vacaciones")
      .in("status", ["aprobada", "pendiente"])
      .or(`candidate_id.eq.${user.id},employee_id.eq.${input.employeeId || "00000000-0000-0000-0000-000000000000"}`);

    const takenOrPending = (existingLeaves || []).reduce(
      (sum, l) => sum + (Number(l.total_working_days) || 0),
      0
    );

    const available = Math.max(0, lft.totalDaysAccrued - takenOrPending);

    if (workingDays > available) {
      throw new Error(
        `Saldo insuficiente: dispones de ${available} día(s) hábiles y solicitaste ${workingDays} día(s).`
      );
    }
  }

  // 3. Insert into public.company_leaves
  const payload: CompanyLeaveInsert = {
    company_id: input.companyId,
    employee_id: input.employeeId || null,
    candidate_id: user.id,
    request_type: input.requestType,
    start_date: input.startDate,
    end_date: input.endDate,
    total_working_days: workingDays,
    reason: input.reason?.trim() || null,
    status: "pendiente",
  };

  const { data: inserted, error: insertErr } = await supabase
    .from("company_leaves")
    .insert(payload)
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("Error inserting leave request:", insertErr);
    throw new Error(insertErr?.message || "No se pudo registrar la solicitud en la base de datos.");
  }

  // 4. Fetch candidate name for company notification
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const candidateName = profile?.full_name || "Un colaborador";
  const typeLabel = TYPE_LABELS[input.requestType] || "Vacaciones LFT";

  // 5. Notify company HR
  try {
    await supabase.from("notifications").insert({
      user_id: input.companyId,
      title: "Nueva solicitud de vacaciones / permiso",
      description: `${candidateName} ha enviado una solicitud de "${typeLabel}" (${workingDays} días hábiles) del ${input.startDate} al ${input.endDate}.`,
      type: "leave_requested",
    });
  } catch (notifErr) {
    console.error("Error sending notification to company HR:", notifErr);
  }

  // 6. Revalidate relevant cache paths
  revalidatePath("/dashboard/candidate/leaves");
  revalidatePath("/dashboard/candidate");
  revalidatePath("/dashboard/company/leaves");
  revalidatePath("/dashboard/company");

  return {
    success: true,
    message: `Solicitud de ${typeLabel} enviada exitosamente (${workingDays} días hábiles).`,
    leaveId: inserted.id,
  };
}
