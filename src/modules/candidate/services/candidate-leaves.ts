import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  calculateWorkingDays,
  calculateLFTVacationDays,
} from "@/modules/company/utils/vacation-calculator";
import type {
  LeaveRequestType,
  SubmitCandidateLeaveRequestInput,
} from "../schemas/leaves.schema";

export type { LeaveRequestType };
export type LeaveStatus = "pendiente" | "aprobada" | "rechazada";

export interface CandidateLeaveRequest {
  id: string;
  requestType: LeaveRequestType;
  typeLabel: string;
  startDate: string;
  endDate: string;
  totalWorkingDays: number;
  reason: string;
  status: LeaveStatus;
  requestedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
}

export interface CandidateVacationBalance {
  hireDate: string;
  yearsOfService: number;
  monthsOfService: number;
  formattedSeniority: string;
  totalDaysAccruedLFT: number;
  daysTaken: number;
  daysPendingApproval: number;
  daysAvailable: number;
}

export interface CandidateLeavesData {
  hasActiveEmployment: boolean;
  companyId?: string;
  companyName?: string;
  companyLogoUrl?: string | null;
  employeeId?: string;
  jobTitle?: string;
  department?: string;
  balance?: CandidateVacationBalance;
  requests: CandidateLeaveRequest[];
}

export interface SubmitLeaveResult {
  success: boolean;
  message: string;
  leaveId: string;
}

const TYPE_LABELS: Record<LeaveRequestType, string> = {
  vacaciones: "Vacaciones Anuales LFT",
  permiso_con_goce: "Permiso con Goce de Sueldo",
  permiso_sin_goce: "Permiso sin Goce de Sueldo",
  paternidad: "Permiso por Paternidad (LFT)",
  maternidad: "Incapacidad por Maternidad (LFT/IMSS)",
  luto: "Permiso por Luto",
};

interface CompanyProfileJoined {
  id: string;
  company_name: string;
  legal_name: string | null;
  logo_url: string | null;
}

export class CandidateLeavesService {
  /**
   * Obtiene el balance de vacaciones y el historial de permisos del candidato/colaborador.
   */
  static async getCandidateLeavesData(
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<CandidateLeavesData> {
    if (!userId) {
      return { hasActiveEmployment: false, requests: [] };
    }

    // 1. Verificar contrato vigente en company_contracts
    const { data: contracts } = await supabase
      .from("company_contracts")
      .select(`
        id,
        company_id,
        employee_id,
        job_title,
        department,
        start_date,
        status,
        company:company_profiles (
          id,
          company_name,
          legal_name,
          logo_url
        )
      `)
      .eq("candidate_id", userId)
      .neq("status", "cancelado")
      .order("created_at", { ascending: false });

    const activeContract = contracts && contracts.length > 0 ? contracts[0] : null;

    // 2. Si hay employee_id, consultar registro de empleado
    let employeeRecord: {
      id: string;
      company_id: string;
      job_title: string;
      department: string | null;
      hire_date: string | null;
      company?: CompanyProfileJoined | null;
    } | null = null;

    if (activeContract?.employee_id) {
      const { data: emp } = await supabase
        .from("company_employees")
        .select(`
          id,
          company_id,
          job_title,
          department,
          hire_date,
          company:company_profiles (
            id,
            company_name,
            legal_name,
            logo_url
          )
        `)
        .eq("id", activeContract.employee_id)
        .maybeSingle();

      if (emp) {
        employeeRecord = {
          id: emp.id,
          company_id: emp.company_id,
          job_title: emp.job_title,
          department: emp.department,
          hire_date: emp.hire_date,
          company: Array.isArray(emp.company) ? emp.company[0] : emp.company,
        };
      }
    }

    // 2b. Si no se encontró vía contrato, consultar directamente por employee_id (auth userId)
    if (!employeeRecord) {
      const { data: empDirect } = await supabase
        .from("company_employees")
        .select(`
          id,
          company_id,
          job_title,
          department,
          hire_date,
          company:company_profiles (
            id,
            company_name,
            legal_name,
            logo_url
          )
        `)
        .eq("employee_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (empDirect) {
        employeeRecord = {
          id: empDirect.id,
          company_id: empDirect.company_id,
          job_title: empDirect.job_title,
          department: empDirect.department,
          hire_date: empDirect.hire_date,
          company: Array.isArray(empDirect.company) ? empDirect.company[0] : empDirect.company,
        };
      }
    }

    if (!activeContract && !employeeRecord) {
      return {
        hasActiveEmployment: false,
        requests: [],
      };
    }

    const compContract = Array.isArray(activeContract?.company)
      ? activeContract?.company[0]
      : activeContract?.company;
    const companyProfile = compContract || employeeRecord?.company;
    const companyId = activeContract?.company_id || employeeRecord?.company_id || "";
    const companyName =
      companyProfile?.company_name || companyProfile?.legal_name || "Empresa Contratante";
    const companyLogoUrl = companyProfile?.logo_url || null;
    const employeeId = activeContract?.employee_id || employeeRecord?.id || undefined;
    const jobTitle = activeContract?.job_title || employeeRecord?.job_title || "Colaborador";
    const department =
      activeContract?.department || employeeRecord?.department || "Operaciones";
    const hireDate =
      activeContract?.start_date ||
      employeeRecord?.hire_date ||
      new Date().toISOString().split("T")[0];

    // 3. Calcular antigüedad y días devengados Art. 76 LFT
    const lft = calculateLFTVacationDays(hireDate);

    // 4. Consultar solicitudes previas en company_leaves
    let leavesQuery = supabase
      .from("company_leaves")
      .select("*")
      .order("created_at", { ascending: false });

    if (employeeId) {
      leavesQuery = leavesQuery.or(`candidate_id.eq.${userId},employee_id.eq.${employeeId}`);
    } else {
      leavesQuery = leavesQuery.eq("candidate_id", userId);
    }

    const { data: rawLeaves, error: leavesErr } = await leavesQuery;

    if (leavesErr) {
      console.error("[getCandidateLeavesData] Error querying leaves:", leavesErr);
    }

    const leavesList = rawLeaves || [];

    // Calcular días tomados y pendientes para vacaciones
    const vacationRequests = leavesList.filter((l) => l.request_type === "vacaciones");
    const daysTaken = vacationRequests
      .filter((l) => l.status === "aprobada")
      .reduce((acc, curr) => acc + (Number(curr.total_working_days) || 0), 0);

    const daysPendingApproval = vacationRequests
      .filter((l) => l.status === "pendiente")
      .reduce((acc, curr) => acc + (Number(curr.total_working_days) || 0), 0);

    const daysAvailable = Math.max(
      0,
      lft.totalDaysAccrued - daysTaken - daysPendingApproval
    );

    const balance: CandidateVacationBalance = {
      hireDate,
      yearsOfService: lft.yearsOfService,
      monthsOfService: lft.monthsOfService,
      formattedSeniority: lft.formattedSeniority,
      totalDaysAccruedLFT: lft.totalDaysAccrued,
      daysTaken,
      daysPendingApproval,
      daysAvailable,
    };

    const requests: CandidateLeaveRequest[] = leavesList.map((req) => ({
      id: req.id,
      requestType: req.request_type as LeaveRequestType,
      typeLabel: TYPE_LABELS[req.request_type as LeaveRequestType] || "Vacaciones LFT",
      startDate: req.start_date,
      endDate: req.end_date,
      totalWorkingDays: req.total_working_days,
      reason: req.reason || "Sin observaciones adicionales.",
      status: req.status as LeaveStatus,
      requestedAt: req.created_at
        ? new Date(req.created_at).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Reciente",
      reviewedAt: req.reviewed_at
        ? new Date(req.reviewed_at).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : null,
      reviewedBy: req.reviewed_by || null,
      rejectionReason: req.rejection_reason || null,
    }));

    return {
      hasActiveEmployment: true,
      companyId,
      companyName,
      companyLogoUrl,
      employeeId,
      jobTitle,
      department,
      balance,
      requests,
    };
  }

  /**
   * Registra una nueva solicitud de vacaciones o permiso laboral validando reglas LFT.
   */
  static async submitLeaveRequest(
    supabase: SupabaseClient<Database>,
    userId: string,
    input: SubmitCandidateLeaveRequestInput
  ): Promise<SubmitLeaveResult> {
    // 1. Calcular días hábiles según LFT (excluyendo domingos)
    const workingDays = calculateWorkingDays(input.startDate, input.endDate);

    if (workingDays <= 0) {
      throw new Error("El periodo seleccionado no contiene días laborales hábiles.");
    }

    // 2. Si son vacaciones anuales, validar contra saldo disponible Art. 76 LFT
    if (input.requestType === "vacaciones") {
      const { data: contract } = await supabase
        .from("company_contracts")
        .select("start_date")
        .eq("candidate_id", userId)
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

      // Consultar solicitudes previas en company_leaves
      const { data: existingLeaves } = await supabase
        .from("company_leaves")
        .select("total_working_days, status")
        .eq("company_id", input.companyId)
        .eq("request_type", "vacaciones")
        .in("status", ["aprobada", "pendiente"])
        .or(
          `candidate_id.eq.${userId},employee_id.eq.${
            input.employeeId || "00000000-0000-0000-0000-000000000000"
          }`
        );

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

    // 3. Insertar solicitud en public.company_leaves
    const payload = {
      company_id: input.companyId,
      employee_id: input.employeeId || null,
      candidate_id: userId,
      request_type: input.requestType,
      start_date: input.startDate,
      end_date: input.endDate,
      total_working_days: workingDays,
      reason: input.reason?.trim() || null,
      status: "pendiente" as const,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("company_leaves")
      .insert(payload)
      .select("id")
      .single();

    if (insertErr || !inserted) {
      console.error("Error inserting leave request:", insertErr);
      throw new Error(
        insertErr?.message || "No se pudo registrar la solicitud en la base de datos."
      );
    }

    // 4. Obtener nombre del colaborador para notificar a la empresa
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const candidateName = profile?.full_name || "Un colaborador";
    const typeLabel = TYPE_LABELS[input.requestType] || "Vacaciones LFT";

    // 5. Enviar notificación in-app a Recursos Humanos de la empresa
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

    return {
      success: true,
      message: `Solicitud de ${typeLabel} enviada exitosamente (${workingDays} días hábiles).`,
      leaveId: inserted.id,
    };
  }
}

/**
 * Función desacoplada retrocompatible
 */
export async function getCandidateLeavesData(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CandidateLeavesData> {
  return CandidateLeavesService.getCandidateLeavesData(supabase, userId);
}
