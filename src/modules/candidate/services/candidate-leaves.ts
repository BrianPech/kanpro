import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { formatMexicoDateShort, getMexicoDateISO } from "@/lib/formatters";
import {
  calculateWorkingDays,
  calculateLFTVacationDays,
  calculateVacationPremium,
  calculateVacationExpiration,
  filterLeavesInCurrentCycle,
  getCurrentVacationCycleWindow,
  validateSpecialLeavePolicyDays,
} from "@/modules/company/utils/vacation-calculator";
import { SupabaseLeavesRepository } from "@/modules/company/repositories/leaves.repository";
import { LeaveOverlapService } from "@/modules/company/services/leave-overlap.service";
import {
  DEFAULT_COMPANY_WORK_RULES_CONFIG,
  parseCompanyWorkRulesConfig,
} from "@/modules/company/strategies/company-policies.parser";
import { resolveCompanyVacationPolicy } from "@/modules/company/strategies/leaves-imss-overtime-policy.engine";
import type { LeaveCatalogueKey } from "@/modules/company/types/company-policies";
import type {
  LeaveRequestType,
  SubmitCandidateLeaveRequestInput,
} from "../schemas/leaves.schema";

export type { LeaveRequestType };
export type LeaveStatus = "pendiente" | "visto_bueno" | "aprobada" | "rechazada";

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
  vacationPremiumRate: number;
  vacationPremiumEstimatedAmount: number;
  enjoymentWindowEndDate: string;
  prescriptionEndDate: string;
  nextAnniversaryDate: string;
  isPeriodExpired: boolean;
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
  dias_economicos: "Días Económicos",
  matrimonio: "Permiso por Matrimonio",
  paternidad: "Permiso por Paternidad (LFT)",
  maternidad: "Incapacidad por Maternidad (LFT/IMSS)",
  luto: "Permiso por Luto",
};

interface CompanyProfileJoined {
  id: string;
  company_name: string;
  legal_name: string | null;
  logo_url: string | null;
  payroll_impact_config?: unknown;
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
          logo_url,
          payroll_impact_config
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
      base_salary_monthly?: number | null;
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
          base_salary_monthly,
          company:company_profiles (
            id,
            company_name,
            legal_name,
            logo_url,
            payroll_impact_config
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
          base_salary_monthly: emp.base_salary_monthly,
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
          base_salary_monthly,
          company:company_profiles (
            id,
            company_name,
            legal_name,
            logo_url,
            payroll_impact_config
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
          base_salary_monthly: empDirect.base_salary_monthly,
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
      getMexicoDateISO();

    // 3. Calcular antigüedad, días devengados Art. 76 LFT, prima vacacional Art. 80 y vencimiento Art. 81
    const vacationPolicy = resolveCompanyVacationPolicy(
      companyProfile?.payroll_impact_config ?? DEFAULT_COMPANY_WORK_RULES_CONFIG
    );
    const lft = calculateLFTVacationDays(hireDate, undefined, vacationPolicy.strategy);
    const expiration = calculateVacationExpiration(hireDate);
    const monthlySalary = Number(employeeRecord?.base_salary_monthly) || 0;
    const premium = calculateVacationPremium(
      monthlySalary,
      lft.totalDaysAccrued,
      vacationPolicy.premiumPercentage / 100
    );

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

    // Calcular días tomados y pendientes para vacaciones dentro del ciclo anual vigente
    const vacationRequests = filterLeavesInCurrentCycle(
      leavesList.filter((l) => l.request_type === "vacaciones"),
      hireDate
    );
    const daysTaken = vacationRequests
      .filter((l) => l.status === "aprobada")
      .reduce((acc, curr) => acc + (Number(curr.total_working_days) || 0), 0);

    const daysPendingApproval = vacationRequests
      .filter((l) => l.status === "pendiente" || l.status === "visto_bueno")
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
      vacationPremiumRate: premium.premiumRate,
      vacationPremiumEstimatedAmount: premium.premiumAmount,
      enjoymentWindowEndDate: expiration.enjoymentWindowEndDate,
      prescriptionEndDate: expiration.prescriptionEndDate,
      nextAnniversaryDate: expiration.nextAnniversaryDate,
      isPeriodExpired: expiration.isExpired,
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
        ? formatMexicoDateShort(req.created_at)
        : "Reciente",
      reviewedAt: req.reviewed_at
        ? formatMexicoDateShort(req.reviewed_at)
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
   * Registra una nueva solicitud de vacaciones o permiso laboral validando reglas LFT, políticas y solapamientos.
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

    let rawCompanyWorkRules: unknown = null;
    try {
      const compTable = supabase.from("company_profiles");
      if (compTable && typeof compTable.select === "function") {
        const { data: compProfile } = await compTable
          .select("payroll_impact_config")
          .eq("id", input.companyId)
          .maybeSingle();
        rawCompanyWorkRules =
          (compProfile as { payroll_impact_config?: unknown } | null)?.payroll_impact_config ??
          null;
      }
    } catch {
      rawCompanyWorkRules = null;
    }

    const workRules = parseCompanyWorkRulesConfig(
      rawCompanyWorkRules ?? DEFAULT_COMPANY_WORK_RULES_CONFIG
    );
    const catalogueRule = workRules.leaveCatalogue[input.requestType as LeaveCatalogueKey];
    const customMaxDays =
      input.requestType === "luto"
        ? (catalogueRule?.maxDaysPerEvent ?? 3)
        : (catalogueRule?.maxDaysPerEvent ?? undefined);

    // 1b. Validar tope de días por política especial (días económicos, matrimonio, paternidad, luto)
    validateSpecialLeavePolicyDays(input.requestType, workingDays, customMaxDays);

    // 1c. Validar solapamiento de ausencias con LeaveOverlapService si hay employeeId
    if (input.employeeId) {
      try {
        const overlapService = new LeaveOverlapService(
          new SupabaseLeavesRepository(supabase)
        );
        const hasOverlap = await overlapService.hasOverlap(
          input.companyId,
          input.employeeId,
          input.startDate,
          input.endDate
        );
        if (hasOverlap) {
          throw new Error(
            "Ya cuentas con una solicitud activa o aprobada que se traslapa con las fechas seleccionadas."
          );
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("se traslapa con las fechas seleccionadas")
        ) {
          throw err;
        }
      }
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

      const effectiveHireDate = hireDate || getMexicoDateISO();
      const vacationPolicy = resolveCompanyVacationPolicy(workRules);
      const lft = calculateLFTVacationDays(effectiveHireDate, undefined, vacationPolicy.strategy);
      const cycleWindow = getCurrentVacationCycleWindow(effectiveHireDate);

      // Consultar solicitudes previas en company_leaves del ciclo anual actual
      let existingLeavesQuery = supabase
        .from("company_leaves")
        .select("total_working_days, status, start_date")
        .eq("company_id", input.companyId)
        .eq("request_type", "vacaciones")
        .in("status", ["aprobada", "pendiente", "visto_bueno"])
        .or(
          `candidate_id.eq.${userId},employee_id.eq.${
            input.employeeId || "00000000-0000-0000-0000-000000000000"
          }`
        );

      if (cycleWindow && typeof existingLeavesQuery.gte === "function") {
        existingLeavesQuery = existingLeavesQuery.gte(
          "start_date",
          cycleWindow.cycleStartDate
        );
      }

      const { data: existingLeaves } = await existingLeavesQuery;

      const takenOrPending = cycleWindow
        ? (existingLeaves || [])
            .filter(
              (l) => !l.start_date || l.start_date >= cycleWindow.cycleStartDate
            )
            .reduce((sum, l) => sum + (Number(l.total_working_days) || 0), 0)
        : 0;

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
