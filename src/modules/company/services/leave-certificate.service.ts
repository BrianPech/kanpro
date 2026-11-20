import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  formatMexicoDateShort,
  formatSalaryDisplay,
  getMexicoDateISO,
} from "@/lib/formatters";
import {
  calculateLFTVacationDays,
  calculateVacationPremium,
  SPECIAL_LEAVE_POLICIES,
} from "../utils/vacation-calculator";
import {
  buildConstanciaVacacionesPdf,
  type ConstanciaVacacionesData,
} from "../utils/constancia-vacaciones-pdf";
import type { VacationRequestType } from "../types/employee-dossier";

/**
 * Genera la Constancia Oficial de Disfrute de Vacaciones / Permiso en PDF (Art. 81 LFT).
 * Solo disponible para solicitudes en estatus 'aprobada'.
 */
export class LeaveCertificateService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async generateForCompany(
    companyId: string,
    requestId: string
  ): Promise<{ fileName: string; pdf: Uint8Array }> {
    if (!companyId || !requestId) {
      throw new Error("Identificador de empresa y solicitud requeridos.");
    }

    const { data: leave, error } = await this.supabase
      .from("company_leaves")
      .select("*")
      .eq("id", requestId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (error || !leave) {
      throw new Error("Solicitud no encontrada o no pertenece a tu empresa.");
    }

    return this.buildCertificateFromLeave(leave);
  }

  async generateForCandidate(
    userId: string,
    requestId: string
  ): Promise<{ fileName: string; pdf: Uint8Array }> {
    if (!userId || !requestId) {
      throw new Error("Identificador de usuario y solicitud requeridos.");
    }

    const { data: leave, error } = await this.supabase
      .from("company_leaves")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();

    if (error || !leave) {
      throw new Error("Solicitud no encontrada o no autorizada.");
    }

    if (leave.candidate_id && leave.candidate_id !== userId) {
      const { data: empCheck } = await this.supabase
        .from("company_employees")
        .select("id")
        .eq("id", leave.employee_id || "")
        .eq("employee_id", userId)
        .maybeSingle();

      if (!empCheck) {
        throw new Error("No tienes permiso para descargar esta constancia.");
      }
    }

    return this.buildCertificateFromLeave(leave);
  }

  private async buildCertificateFromLeave(
    leave: Database["public"]["Tables"]["company_leaves"]["Row"]
  ): Promise<{ fileName: string; pdf: Uint8Array }> {
    if (leave.status !== "aprobada") {
      throw new Error(
        "La constancia oficial solo puede generarse para solicitudes aprobadas."
      );
    }

    const [companyRes, empRes] = await Promise.all([
      this.supabase
        .from("company_profiles")
        .select("company_name, legal_name")
        .eq("id", leave.company_id)
        .maybeSingle(),
      leave.employee_id
        ? this.supabase
            .from("company_employees")
            .select(
              "id, full_name, job_title, department, hire_date, base_salary_monthly"
            )
            .eq("id", leave.employee_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const companyName =
      companyRes.data?.legal_name ||
      companyRes.data?.company_name ||
      "Empresa K'anPro";

    let employeeName = empRes.data?.full_name || "Colaborador";
    if (!empRes.data && leave.candidate_id) {
      const { data: candProf } = await this.supabase
        .from("profiles")
        .select("full_name")
        .eq("id", leave.candidate_id)
        .maybeSingle();
      if (candProf?.full_name) {
        employeeName = candProf.full_name;
      }
    }

    const hireDate = empRes.data?.hire_date || leave.start_date;
    const seniority = calculateLFTVacationDays(hireDate);
    const requestType = (leave.request_type as VacationRequestType) || "vacaciones";
    const policy =
      SPECIAL_LEAVE_POLICIES[requestType] || SPECIAL_LEAVE_POLICIES.vacaciones;

    const monthlySalary = Number(empRes.data?.base_salary_monthly) || 0;
    const premium = calculateVacationPremium(
      monthlySalary,
      leave.total_working_days
    );

    const folio = leave.id.slice(0, 8).toUpperCase();
    const data: ConstanciaVacacionesData = {
      folio,
      companyName,
      issuedOn: formatMexicoDateShort(getMexicoDateISO()),
      employeeName,
      jobTitle: empRes.data?.job_title || "Colaborador",
      department: empRes.data?.department || "Operaciones",
      hireDate: formatMexicoDateShort(hireDate),
      formattedSeniority: seniority.formattedSeniority,
      requestTypeLabel: policy.label,
      legalBasis: policy.legalBasis,
      startDate: formatMexicoDateShort(leave.start_date),
      endDate: formatMexicoDateShort(leave.end_date),
      totalWorkingDays: leave.total_working_days,
      totalDaysAccruedLFT: seniority.totalDaysAccrued,
      daysRemainingAfterLeave: Math.max(
        0,
        seniority.totalDaysAccrued - leave.total_working_days
      ),
      vacationPremiumRateLabel: "25% mínimo conforme al Art. 80 LFT",
      vacationPremiumAmountLabel:
        monthlySalary > 0
          ? `${formatSalaryDisplay(premium.premiumAmount)} MXN (sobre ${leave.total_working_days} día(s))`
          : undefined,
      reviewedBy: leave.reviewed_by || "Recursos Humanos",
      reviewedAt: leave.reviewed_at
        ? formatMexicoDateShort(leave.reviewed_at)
        : formatMexicoDateShort(getMexicoDateISO()),
      reason: leave.reason || undefined,
    };

    return {
      fileName: `constancia-vacaciones-${folio}.pdf`,
      pdf: buildConstanciaVacacionesPdf(data),
    };
  }
}
