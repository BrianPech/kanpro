import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getMexicoDateISO } from "@/lib/formatters";
import {
  calculateWorkingDays,
  validateSpecialLeavePolicyDays,
} from "../utils/vacation-calculator";
import { VacationRequestType } from "../types/employee-dossier";
import type {
  RespondToLeaveRequestInput,
  CreateCompanyLeaveInput,
} from "../schemas/leaves.schema";
import {
  SupabaseLeavesRepository,
  type LeavesRepository,
  type CompanyLeaveRow,
  type CompanyLeaveInsert,
  type CompanyLeaveUpdate,
} from "../repositories/leaves.repository";
import {
  resolveLeaveApprovalStrategy,
  type LeaveApprovalMode,
  type LeaveApprovalStatus,
  type LeaveApprovalActor,
} from "../strategies/leave-approval.strategy";
import { LeaveOverlapService } from "./leave-overlap.service";

export type { CompanyLeaveRow, CompanyLeaveInsert, CompanyLeaveUpdate };

export const LEAVE_TYPE_LABELS: Record<VacationRequestType, string> = {
  vacaciones: "Vacaciones LFT",
  permiso_con_goce: "Permiso con Goce de Sueldo",
  permiso_sin_goce: "Permiso sin Goce de Sueldo",
  dias_economicos: "Días Económicos",
  matrimonio: "Permiso por Matrimonio",
  paternidad: "Permiso por Paternidad",
  maternidad: "Incapacidad por Maternidad",
  luto: "Permiso por Luto",
};

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

export function parseLeaveApprovalMode(raw: unknown): LeaveApprovalMode {
  if (typeof raw === "object" && raw !== null) {
    const mode = (raw as Record<string, unknown>).approvalMode;
    if (mode === "two_step") {
      return "two_step";
    }
  }
  return "single_step";
}

export class CompanyLeavesService {
  private readonly repository: LeavesRepository;
  private readonly overlapService: LeaveOverlapService;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    repository?: LeavesRepository,
    private readonly approvalModeOverride?: LeaveApprovalMode
  ) {
    this.repository = repository ?? new SupabaseLeavesRepository(supabase);
    this.overlapService = new LeaveOverlapService(this.repository);
  }

  private async resolveApprovalMode(companyId: string): Promise<LeaveApprovalMode> {
    if (this.approvalModeOverride) {
      return this.approvalModeOverride;
    }

    try {
      const { data } = await this.supabase
        .from("company_profiles")
        .select("leave_approval_config")
        .eq("id", companyId)
        .maybeSingle();

      return parseLeaveApprovalMode(data?.leave_approval_config);
    } catch {
      return "single_step";
    }
  }

  async respondToLeaveRequest(
    companyId: string,
    input: RespondToLeaveRequestInput
  ): Promise<RespondToLeaveResult> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    const mode = await this.resolveApprovalMode(companyId);
    const strategy = resolveLeaveApprovalStrategy(mode);
    const actor: LeaveApprovalActor = input.actor ?? "hr";

    let currentStatus: LeaveApprovalStatus = "pendiente";
    if (mode === "two_step" || input.actor) {
      const existing = this.repository.getById
        ? await this.repository.getById(companyId, input.requestId)
        : null;
      if (!existing) {
        throw new Error(
          "No se encontró la solicitud de vacaciones o no pertenece a tu empresa."
        );
      }
      currentStatus = (existing.status as LeaveApprovalStatus) || "pendiente";
    }

    const outcome = strategy.decide(currentStatus, actor, input.decision);

    const now = `${getMexicoDateISO()}T12:00:00.000Z`;
    const reviewerLabel =
      actor === "area_leader" ? "Líder de Área (Vo.Bo.)" : "Recursos Humanos";

    const updatePayload: CompanyLeaveUpdate = {
      status: outcome.status,
      reviewed_at: now,
      reviewed_by: reviewerLabel,
      rejection_reason:
        outcome.status === "rechazada"
          ? input.rejectionReason?.trim() || null
          : null,
      updated_at: now,
    };

    const updatedLeave = await this.repository.respond(
      companyId,
      input.requestId,
      updatePayload
    );

    await this.notifyEmployeeOfResolution(
      updatedLeave,
      outcome.status,
      input.rejectionReason
    );

    const message =
      outcome.status === "visto_bueno"
        ? "Vo.Bo. del líder de área registrado. Pendiente de aprobación final de Recursos Humanos."
        : outcome.status === "aprobada"
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

    validateSpecialLeavePolicyDays(input.requestType, workingDays);

    const { data: emp, error: empErr } = await this.supabase
      .from("company_employees")
      .select("id, full_name, email, employee_id")
      .eq("id", input.employeeId)
      .eq("company_id", companyId)
      .single();

    if (empErr || !emp) {
      throw new Error("El colaborador no pertenece a tu plantilla.");
    }

    try {
      const hasOverlap = await this.overlapService.hasOverlap(
        companyId,
        emp.id,
        input.startDate,
        input.endDate
      );
      if (hasOverlap) {
        throw new Error(
          "El colaborador ya tiene una ausencia activa o en revisión que se traslapa con las fechas seleccionadas."
        );
      }
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("traslapa con las fechas seleccionadas")
      ) {
        throw err;
      }
    }

    const now = `${getMexicoDateISO()}T12:00:00.000Z`;
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

    const inserted = await this.repository.create(companyId, payload);

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
    status: LeaveApprovalStatus,
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
      const isApproved = status === "aprobada";
      const isVistoBueno = status === "visto_bueno";
      const typeLabel =
        LEAVE_TYPE_LABELS[leave.request_type as VacationRequestType] ||
        "Vacaciones";

      const title = isApproved
        ? `¡Solicitud de ${typeLabel} aprobada!`
        : isVistoBueno
        ? `Vo.Bo. otorgado a tu solicitud de ${typeLabel}`
        : `Actualización de solicitud de ${typeLabel}`;

      const description = isApproved
        ? `Tu solicitud de ${leave.total_working_days} día(s) del ${leave.start_date} al ${leave.end_date} ha sido aprobada por Recursos Humanos.`
        : isVistoBueno
        ? `Tu líder de área otorgó el Vo.Bo. a tu solicitud del ${leave.start_date} al ${leave.end_date}. Falta la aprobación final de Recursos Humanos.`
        : `Tu solicitud de descanso del ${leave.start_date} al ${leave.end_date} fue rechazada.${rejectionReason ? ` Motivo: "${rejectionReason.trim()}".` : ""}`;

      const notifType = isApproved
        ? "leave_approved"
        : isVistoBueno
        ? "leave_visto_bueno"
        : "leave_rejected";

      await this.supabase.from("notifications").insert({
        user_id: targetUserId,
        title,
        description,
        type: notifType,
      });
    } catch (notifErr) {
      console.error("Error notifying employee of leave resolution:", notifErr);
    }
  }
}
