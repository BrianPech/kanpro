import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { calculateWorkingDays } from "../utils/vacation-calculator";
import { VacationRequestType } from "../types/employee-dossier";
import type {
  RespondToLeaveRequestInput,
  CreateCompanyLeaveInput,
} from "../schemas/leaves.schema";

export const LEAVE_TYPE_LABELS: Record<VacationRequestType, string> = {
  vacaciones: "Vacaciones LFT",
  permiso_con_goce: "Permiso con Goce de Sueldo",
  permiso_sin_goce: "Permiso sin Goce de Sueldo",
  paternidad: "Permiso por Paternidad",
  maternidad: "Incapacidad por Maternidad",
  luto: "Permiso por Luto",
};

export type CompanyLeaveRow = Database["public"]["Tables"]["company_leaves"]["Row"];
export type CompanyLeaveInsert = Database["public"]["Tables"]["company_leaves"]["Insert"];
export type CompanyLeaveUpdate = Database["public"]["Tables"]["company_leaves"]["Update"];

export interface RespondToLeaveResult {
  message: string;
  leave: CompanyLeaveRow;
}

export interface CreateCompanyLeaveResult {
  message: string;
  leaveId: string;
  workingDays: number;
  leave: CompanyLeaveRow;
}

export class CompanyLeavesService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async respondToLeaveRequest(
    companyId: string,
    input: RespondToLeaveRequestInput
  ): Promise<RespondToLeaveResult> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    const { data: leave, error: fetchErr } = await this.supabase
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
      .eq("company_id", companyId)
      .single();

    if (fetchErr || !leave) {
      throw new Error("No se encontró la solicitud de vacaciones o no pertenece a tu empresa.");
    }

    const now = new Date().toISOString();
    const updatePayload: CompanyLeaveUpdate = {
      status: input.decision,
      reviewed_at: now,
      reviewed_by: "Recursos Humanos",
      rejection_reason: input.decision === "rechazada" ? input.rejectionReason?.trim() || null : null,
      updated_at: now,
    };

    const { data: updatedLeave, error: updateErr } = await this.supabase
      .from("company_leaves")
      .update(updatePayload)
      .eq("id", input.requestId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (updateErr || !updatedLeave) {
      throw new Error(updateErr?.message || "Error al registrar la resolución en la base de datos.");
    }

    await this.notifyEmployeeOfResolution(leave, input.decision, input.rejectionReason);

    const message =
      input.decision === "aprobada"
        ? "Solicitud aprobada con éxito. Días descontados del saldo del colaborador."
        : "Solicitud rechazada. Se ha notificado al colaborador.";

    return { message, leave: updatedLeave };
  }

  async createCompanyLeave(
    companyId: string,
    input: CreateCompanyLeaveInput
  ): Promise<CreateCompanyLeaveResult> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    const workingDays = calculateWorkingDays(input.startDate, input.endDate);
    if (workingDays <= 0) {
      throw new Error("El rango de fechas no contiene días hábiles.");
    }

    const { data: emp, error: empErr } = await this.supabase
      .from("company_employees")
      .select("id, full_name, email, employee_id")
      .eq("id", input.employeeId)
      .eq("company_id", companyId)
      .single();

    if (empErr || !emp) {
      throw new Error("El colaborador no pertenece a tu plantilla.");
    }

    const now = new Date().toISOString();
    const payload: CompanyLeaveInsert = {
      company_id: companyId,
      employee_id: emp.id,
      candidate_id: emp.employee_id || null,
      request_type: input.requestType,
      start_date: input.startDate,
      end_date: input.endDate,
      total_working_days: workingDays,
      reason: input.reason?.trim() || "Registrado por Recursos Humanos.",
      status: "aprobada",
      reviewed_at: now,
      reviewed_by: "Recursos Humanos",
    };

    const { data: inserted, error: insertErr } = await this.supabase
      .from("company_leaves")
      .insert(payload)
      .select()
      .single();

    if (insertErr || !inserted) {
      throw new Error(insertErr?.message || "No se pudo registrar la solicitud.");
    }

    const label = LEAVE_TYPE_LABELS[input.requestType] || "Permiso";
    const message = `Permiso de ${label} registrado y aprobado exitosamente (${workingDays} días hábiles).`;

    return {
      message,
      leaveId: inserted.id,
      workingDays,
      leave: inserted,
    };
  }

  private async notifyEmployeeOfResolution(
    leave: {
      candidate_id: string | null;
      employee_id: string | null;
      request_type: string;
      start_date: string;
      end_date: string;
      total_working_days: number;
    },
    decision: "aprobada" | "rechazada",
    rejectionReason?: string
  ): Promise<void> {
    let targetUserId = leave.candidate_id;

    if (!targetUserId && leave.employee_id) {
      const { data: emp } = await this.supabase
        .from("company_employees")
        .select("email, employee_id")
        .eq("id", leave.employee_id)
        .maybeSingle();

      if (emp?.employee_id) {
        targetUserId = emp.employee_id;
      } else if (emp?.email) {
        const { data: profile } = await this.supabase
          .from("profiles")
          .select("id")
          .eq("email", emp.email)
          .maybeSingle();
        if (profile?.id) {
          targetUserId = profile.id;
        }
      }
    }

    if (!targetUserId) {
      return;
    }

    try {
      const isApproved = decision === "aprobada";
      const typeLabel = LEAVE_TYPE_LABELS[leave.request_type as VacationRequestType] || "Vacaciones";

      await this.supabase.from("notifications").insert({
        user_id: targetUserId,
        title: isApproved
          ? `¡Solicitud de ${typeLabel} aprobada!`
          : `Actualización de solicitud de ${typeLabel}`,
        description: isApproved
          ? `Tu solicitud de ${leave.total_working_days} día(s) del ${leave.start_date} al ${leave.end_date} ha sido aprobada por Recursos Humanos.`
          : `Tu solicitud de descanso del ${leave.start_date} al ${leave.end_date} fue rechazada.${rejectionReason ? ` Motivo: "${rejectionReason.trim()}".` : ""}`,
        type: isApproved ? "leave_approved" : "leave_rejected",
      });
    } catch (notifErr) {
      console.error("Error notifying employee of leave resolution:", notifErr);
    }
  }
}
