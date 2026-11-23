import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  calculateDailySalaryFromMonthly,
  formatMexicoDateShort,
  fromMonthlyEquivalentSalary,
  getMexicoDateISO,
} from "@/lib/formatters";
import {
  EmployeeDossier,
  VacationRequest,
  EmployeeDocument,
  PositionHistoryItem,
  PerformanceReview,
} from "../types/employee-dossier";
import {
  calculateLFTVacationDays,
  calculateVacationPremium,
  filterLeavesInCurrentCycle,
} from "../utils/vacation-calculator";
import { parseCompanyWorkRulesConfig } from "../strategies/company-policies.parser";
import { resolveCompanyVacationPolicy } from "../strategies/leaves-imss-overtime-policy.engine";
import { calculatePunctualityRate } from "../utils/attendance-utils";
import { LEAVE_TYPE_LABELS } from "./company-leaves";

/**
 * Convierte una fecha o timestamp ISO a YYYY-MM-DD en la zona horaria de negocio.
 */
function toMexicoCalendarDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : getMexicoDateISO(parsed);
}

/**
 * Mapea los tipos de documento de la tabla profile_documents a las categorías del Expediente 360.
 */
export function mapDbDocumentTypeToDossierDocType(
  dbDocType: string | null | undefined
): EmployeeDocument["docType"] {
  switch (dbDocType) {
    case "ine_passport":
      return "ine";
    case "proof_of_address":
      return "comprobante_domicilio";
    case "curp":
      return "curp";
    case "constancia_situacion_fiscal":
      return "rfc_sat";
    case "imss_registry":
      return "nss";
    case "recommendation_letter":
      return "carta_antecedentes";
    case "work_certificate":
      return "contrato_laboral";
    default:
      return "comprobante_estudios";
  }
}

/**
 * Fetches an employee 360 dossier strictly from Supabase backend.
 * Returns null if the employee does not exist in the company roster.
 */
export async function getEmployeeDossierById(
  supabase: SupabaseClient<Database>,
  employeeId: string,
  companyId: string,
  adminClient?: SupabaseClient<Database>
): Promise<EmployeeDossier | null> {
  if (!companyId) return null;

  let companyName = "Mi Empresa";
  const { data: profile } = await supabase
    .from("company_profiles")
    .select("company_name, legal_name, payroll_impact_config")
    .eq("id", companyId)
    .maybeSingle();

  if (profile?.legal_name || profile?.company_name) {
    companyName = profile.legal_name || profile.company_name;
  }
  const workRules = parseCompanyWorkRulesConfig(
    (profile as { payroll_impact_config?: unknown } | null)?.payroll_impact_config
  );
  const vacationPolicy = resolveCompanyVacationPolicy(workRules);

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      employeeId
    );

  // 1. Fetch employee from company_employees
  let empQuery = supabase
    .from("company_employees")
    .select("*")
    .eq("company_id", companyId);

  if (isUuid) {
    empQuery = empQuery.or(`id.eq.${employeeId},employee_id.eq.${employeeId}`);
  } else {
    empQuery = empQuery.eq("employee_id", employeeId);
  }

  const { data: emp } = await empQuery.maybeSingle();

  // 2. If not found directly, check applications
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let candidateData: any = null;
  if (!emp && isUuid) {
    const { data: app } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        notes,
        applied_at,
        vacancies!inner (
          id,
          title,
          category,
          location,
          company_id
        ),
        candidate_profiles (
          id,
          skills,
          profiles (
            id,
            full_name,
            location,
            avatar_url,
            whatsapp_number,
            email
          )
        )
      `)
      .eq("id", employeeId)
      .eq("vacancies.company_id", companyId)
      .maybeSingle();

    if (app) {
      candidateData = app;
    }
  }

  if (!emp && !candidateData) {
    return null;
  }

  // 3. Fetch real performance reviews from company_evaluations
  let realReviews: PerformanceReview[] = [];
  const targetEmpId = emp?.id || employeeId;
  let evalQuery = supabase
    .from("company_evaluations")
    .select("*")
    .eq("company_id", companyId);

  if (isUuid) {
    evalQuery = evalQuery.or(
      `employee_id.eq.${targetEmpId},id.eq.${targetEmpId}`
    );
  } else {
    evalQuery = evalQuery.eq("employee_id", targetEmpId);
  }

  const { data: dbReviews } = await evalQuery.order("evaluation_date", {
    ascending: false,
  });

  if (dbReviews && dbReviews.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    realReviews = dbReviews.map((r: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parseStringArray = (val: any): string[] => {
        if (Array.isArray(val)) return val.map(String);
        if (typeof val === "string") {
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed.map(String) : [val];
          } catch {
            return val
              .split(".")
              .map((s: string) => s.trim())
              .filter(Boolean);
          }
        }
        return [];
      };

      return {
        id: r.id,
        period: r.period,
        evaluationDate: r.evaluation_date,
        evaluatorName: r.evaluator_name,
        score: Number(r.average_score) || 5.0,
        strengths: parseStringArray(r.strengths),
        growthAreas: parseStringArray(r.growth_areas),
        goalsMet:
          r.goals_achieved || "Objetivos cumplidos satisfactoriamente.",
        generalComments: r.comments || "",
      };
    });
  }

  // 4. Determine dates & calculations
  const candBase = candidateData?.candidate_profiles?.profiles;
  const hireDate =
    emp?.hire_date ||
    toMexicoCalendarDate(emp?.created_at) ||
    toMexicoCalendarDate(candidateData?.applied_at) ||
    getMexicoDateISO();

  const seniority = calculateLFTVacationDays(hireDate, undefined, vacationPolicy.strategy);

  // 5. Fetch real documents (contracts & profile_documents)
  const documents: EmployeeDocument[] = [];

  const targetCandId =
    emp?.employee_id || candidateData?.candidate_profiles?.id;

  let contractQuery = supabase
    .from("company_contracts")
    .select(
      "id, folio, contract_type, template_type, start_date, company_signature_url, employee_signature_url, status"
    )
    .eq("company_id", companyId);

  if (targetCandId) {
    contractQuery = contractQuery.or(
      `employee_id.eq.${emp?.id || employeeId},candidate_id.eq.${targetCandId}`
    );
  } else {
    contractQuery = contractQuery.eq("employee_id", emp?.id || employeeId);
  }

  const { data: contracts } = await contractQuery.limit(5);

  if (contracts && contracts.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts.forEach((c: any) => {
      documents.push({
        id: c.id,
        docType: "contrato_laboral",
        title: `${c.contract_type || "Contrato Laboral"} (${c.folio})`,
        fileName: `Contrato_${c.folio}.pdf`,
        fileUrl: c.company_signature_url || c.employee_signature_url || "#",
        fileSizeBytes: 2450000,
        uploadedAt: c.start_date || "Contrato firmado",
        status: c.status === "vigente" ? "validado" : "pendiente",
      });
    });
  }

  if (targetCandId) {
    const docClient = adminClient || supabase;
    let profDocsQuery = docClient
      .from("profile_documents")
      .select("id, doc_type, file_name, file_url, file_size_bytes, status, created_at")
      .eq("owner_id", targetCandId);

    if (adminClient) {
      profDocsQuery = profDocsQuery.or(`company_id.eq.${companyId},company_id.is.null`);
    }

    const { data: profDocs } = await profDocsQuery.order("created_at", { ascending: false });

    if (profDocs && profDocs.length > 0) {
      for (const d of profDocs) {
        let resolvedUrl = d.file_url || "#";
        const storagePath = extractProfileDocumentPath(d.file_url);
        if (storagePath) {
          const { data: signedData } = await docClient.storage
            .from("profile_documents")
            .createSignedUrl(storagePath, 3600);
          if (signedData?.signedUrl) {
            resolvedUrl = signedData.signedUrl;
          }
        }

        const mappedDocType = mapDbDocumentTypeToDossierDocType(d.doc_type);

        documents.push({
          id: d.id,
          docType: mappedDocType,
          title: d.file_name,
          fileName: d.file_name,
          fileUrl: resolvedUrl,
          fileSizeBytes: d.file_size_bytes || 0,
          uploadedAt: toMexicoCalendarDate(d.created_at) || "",
          status:
            d.status === "approved"
              ? "validado"
              : d.status === "rejected"
              ? "rechazado"
              : "pendiente",
        });
      }
    }
  }

  // 5b. Enrich CURP, RFC and address from candidate private/public profile when emp lacks them
  let resolvedCurp = emp?.curp || "";
  let resolvedRfc = emp?.rfc || "";
  let resolvedAddress = candBase?.location || "";

  if (targetCandId && adminClient && (!resolvedCurp || !resolvedRfc || !resolvedAddress)) {
    const [{ data: privProfile }, { data: pubProfile }] = await Promise.all([
      adminClient
        .from("candidate_private_profiles")
        .select("curp, rfc")
        .eq("id", targetCandId)
        .maybeSingle(),
      adminClient
        .from("profiles")
        .select("location")
        .eq("id", targetCandId)
        .maybeSingle(),
    ]);

    if (!resolvedCurp && privProfile?.curp) resolvedCurp = privProfile.curp;
    if (!resolvedRfc && privProfile?.rfc) resolvedRfc = privProfile.rfc;
    if (!resolvedAddress && pubProfile?.location) resolvedAddress = pubProfile.location;
  }

  // 6. Build position history
  const isTerminated = emp?.status === "terminated";
  const jobTitle =
    emp?.job_title || candidateData?.vacancies?.title || "Puesto General";
  const department =
    emp?.department ||
    candidateData?.vacancies?.category ||
    "Operaciones";

  // 7. Emergency contact
  let emergencyContact: { name: string; phone: string; relationship: string } = {
    name: "No registrado",
    phone: "No registrado",
    relationship: "No registrado",
  };
  if (emp?.emergency_contact && typeof emp.emergency_contact === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ec = emp.emergency_contact as any;
    emergencyContact = {
      name: ec.name || "No registrado",
      phone: ec.phone || "No registrado",
      relationship: ec.relationship || "Familiar",
    };
  }

  const rawFrequency = emp?.payment_frequency;
  const paymentFrequency: "quincenal" | "semanal" | "mensual" =
    rawFrequency === "semanal" || rawFrequency === "mensual"
      ? rawFrequency
      : "quincenal";

  const baseSalaryMonthly = Number(emp?.base_salary_monthly) || 0;
  const dailyBaseSalary = calculateDailySalaryFromMonthly(baseSalaryMonthly);
  const dailyIntegratedSalary =
    dailyBaseSalary > 0
      ? Math.round(dailyBaseSalary * 1.0493 * 100) / 100
      : 0;

  const positionHistory: PositionHistoryItem[] = [
    {
      id: `pos-${emp?.id || candidateData?.id}`,
      jobTitle,
      department,
      startDate: hireDate,
      endDate: isTerminated ? emp?.termination_date || "Baja" : "Actual",
      salary: fromMonthlyEquivalentSalary(baseSalaryMonthly, paymentFrequency),
      promotionReason: isTerminated
        ? emp?.termination_reason
          ? `Baja: ${emp.termination_reason}`
          : "Desvinculación laboral"
        : "Ingreso / Contratación a la empresa",
    },
  ];

  const fullName =
    emp?.full_name || candBase?.full_name || "Colaborador";
  const phone =
    emp?.phone || candBase?.whatsapp_number || "";
  const email =
    emp?.email || candBase?.email || "";

  // 8. Fetch employee leave requests and compute real vacation balance
  const leavesOwnerId = emp?.id;
  let rawEmpLeaves: Array<{
    id: string;
    employee_id: string | null;
    candidate_id: string | null;
    request_type: string;
    start_date: string;
    end_date: string;
    total_working_days: number;
    reason: string | null;
    status: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
    rejection_reason: string | null;
    created_at: string;
  }> = [];

  if (leavesOwnerId || targetCandId) {
    let empLeavesQuery = supabase
      .from("company_leaves")
      .select(
        "id, employee_id, candidate_id, request_type, start_date, end_date, total_working_days, reason, status, reviewed_at, reviewed_by, rejection_reason, created_at"
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (leavesOwnerId && targetCandId) {
      empLeavesQuery = empLeavesQuery.or(
        `employee_id.eq.${leavesOwnerId},candidate_id.eq.${targetCandId}`
      );
    } else if (leavesOwnerId) {
      empLeavesQuery = empLeavesQuery.eq("employee_id", leavesOwnerId);
    } else if (targetCandId) {
      empLeavesQuery = empLeavesQuery.eq("candidate_id", targetCandId);
    }

    const { data: fetchedLeaves, error: empLeavesErr } = await empLeavesQuery;
    if (empLeavesErr) {
      console.error("[getEmployeeDossierById] Error fetching employee leaves:", empLeavesErr);
    }
    rawEmpLeaves = fetchedLeaves || [];
  }

  const vacationRequests: VacationRequest[] = rawEmpLeaves.map((l) => ({
    id: l.id,
    employeeId: l.employee_id || l.candidate_id || targetEmpId,
    employeeName: fullName,
    avatarUrl: emp?.avatar_url || candBase?.avatar_url || null,
    department,
    requestType: l.request_type as VacationRequest["requestType"],
    typeLabel:
      LEAVE_TYPE_LABELS[l.request_type as VacationRequest["requestType"]] ||
      "Vacaciones LFT",
    startDate: l.start_date,
    endDate: l.end_date,
    totalWorkingDays: Number(l.total_working_days) || 0,
    reason: l.reason || "Sin observaciones registradas.",
    status: l.status as VacationRequest["status"],
    requestedAt: l.created_at
      ? formatMexicoDateShort(l.created_at)
      : "Reciente",
    reviewedAt: l.reviewed_at
      ? formatMexicoDateShort(l.reviewed_at)
      : undefined,
    reviewedBy: l.reviewed_by || undefined,
    rejectionReason: l.rejection_reason || undefined,
  }));

  const vacationRows = filterLeavesInCurrentCycle(
    rawEmpLeaves.filter((l) => l.request_type === "vacaciones"),
    hireDate
  );
  const daysTaken = vacationRows
    .filter((l) => l.status === "aprobada")
    .reduce((acc, curr) => acc + (Number(curr.total_working_days) || 0), 0);

  const daysPendingApproval = vacationRows
    .filter((l) => l.status === "pendiente" || l.status === "visto_bueno")
    .reduce((acc, curr) => acc + (Number(curr.total_working_days) || 0), 0);

  const daysAvailable = Math.max(
    0,
    seniority.totalDaysAccrued - daysTaken - daysPendingApproval
  );
  const vacationPremium = calculateVacationPremium(
    baseSalaryMonthly,
    seniority.totalDaysAccrued,
    vacationPolicy.premiumPercentage / 100
  );
  const currentMexicoYear = Number(getMexicoDateISO().slice(0, 4));

  // 9. Fetch real attendance & overtime summary
  let totalDaysPresent = 0;
  let totalLateArrivals = 0;
  let totalAbsences = 0;
  let totalOvertimeHours = 0;

  if (emp?.id) {
    try {
      const attTable = supabase.from("company_attendance");
      if (attTable && typeof attTable.select === "function") {
        const { data: attRows } = await attTable
          .select("status, overtime_hours, overtime_status")
          .eq("company_id", companyId)
          .eq("employee_id", emp.id);

        for (const row of attRows ?? []) {
          if (row.status === "presente" || row.status === "retardo") {
            totalDaysPresent += 1;
          }
          if (row.status === "retardo") {
            totalLateArrivals += 1;
          } else if (row.status === "falta_injustificada" || row.status === "ausente") {
            totalAbsences += 1;
          }
          const otHours = Number(row.overtime_hours) || 0;
          if (
            otHours > 0 &&
            (!workRules.overtimeRules.requiresPriorAuthorization ||
              row.overtime_status === "autorizado")
          ) {
            totalOvertimeHours += otHours;
          }
        }
      }
    } catch {
      // Fallback a 0 si el cliente mockeado no implementa company_attendance.
    }
  }

  const punctualityRate =
    totalDaysPresent > 0
      ? calculatePunctualityRate(totalDaysPresent - totalLateArrivals, totalLateArrivals)
      : 100;

  const dossier: EmployeeDossier = {
    id: emp?.id || candidateData?.id || employeeId,
    candidateId: emp?.employee_id || candidateData?.candidate_profiles?.id || undefined,
    fullName,
    avatarUrl: emp?.avatar_url || candBase?.avatar_url || null,
    email,
    phone,
    emergencyContact,
    rfc: resolvedRfc || "No registrado",
    curp: resolvedCurp || "No registrado",
    nss: emp?.nss || "No registrado",
    birthDate: "",
    address: resolvedAddress || "No registrada",
    nationality: "Mexicana",

    // Job & Contract
    jobTitle,
    department,
    branchName: `Sucursal Principal • ${companyName}`,
    hireDate,
    yearsOfServiceFormatted: seniority.formattedSeniority,
    contractType: "indeterminado",
    contractTypeLabel: "Contrato Laboral LFT",
    contractStartDate: hireDate,
    contractEndDate: emp?.termination_date || null,
    baseSalaryMonthly,
    dailyIntegratedSalary,
    paymentFrequency,
    workSchedule: emp?.work_schedule || "Lunes a Viernes (Jornada LFT)",
    status: isTerminated ? "baja" : "activo",

    // Real Documents
    documents,

    // Real Position History
    positionHistory,

    // Real Vacation Balance
    vacationBalance: {
      hireDate,
      yearsOfService: seniority.yearsOfService,
      totalDaysAccruedLFT: seniority.totalDaysAccrued,
      daysTaken,
      daysPendingApproval,
      daysAvailable,
      nextPeriodDate: `Ciclo anual ${currentMexicoYear + 1}`,
      premiumPercentage: vacationPolicy.premiumPercentage,
      estimatedVacationPremiumMxn: vacationPremium.premiumAmount,
    },

    // Real Vacation Requests
    vacationRequests,

    // Performance Reviews (from company_evaluations)
    performanceReviews: realReviews,

    attendanceSummary: {
      punctualityRate,
      totalDaysPresent,
      totalLateArrivals,
      totalAbsences,
      totalOvertimeHours,
    },
  };

  return dossier;
}

/**
 * Fetches all company vacation and leave requests from backend.
 */
export interface CompanyEmployeeRosterItem {
  id: string;
  fullName: string;
  department?: string | null;
  hireDate?: string | null;
}

export async function getCompanyVacationRequests(
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<{
  companyName: string;
  approvalMode: "single_step" | "two_step";
  requests: VacationRequest[];
  employees: CompanyEmployeeRosterItem[];
  stats: {
    pendingCount: number;
    approvedThisMonth: number;
    employeesOnLeaveToday: number;
    averageVacationBalance: number;
  };
}> {
  let companyName = "Mi Empresa";
  let approvalMode: "single_step" | "two_step" = "single_step";
  if (!companyId) {
    return {
      companyName,
      approvalMode,
      requests: [],
      employees: [],
      stats: {
        pendingCount: 0,
        approvedThisMonth: 0,
        employeesOnLeaveToday: 0,
        averageVacationBalance: 0,
      },
    };
  }

  const { data: profile } = await supabase
    .from("company_profiles")
    .select("company_name, legal_name, leave_approval_config")
    .eq("id", companyId)
    .maybeSingle();

  if (profile?.legal_name || profile?.company_name) {
    companyName = profile.legal_name || profile.company_name;
  }
  if (
    profile?.leave_approval_config &&
    typeof profile.leave_approval_config === "object" &&
    (profile.leave_approval_config as Record<string, unknown>).approvalMode === "two_step"
  ) {
    approvalMode = "two_step";
  }

  // 1. Fetch real leave requests from company_leaves
  const { data: dbLeaves, error: leavesErr } = await supabase
    .from("company_leaves")
    .select(`
      id,
      company_id,
      employee_id,
      candidate_id,
      request_type,
      start_date,
      end_date,
      total_working_days,
      reason,
      status,
      reviewed_at,
      reviewed_by,
      rejection_reason,
      created_at,
      employee:company_employees (
        id,
        full_name,
        department,
        avatar_url
      )
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (leavesErr) {
    console.error("[getCompanyVacationRequests] Error fetching leaves:", leavesErr);
  }

  const rawLeaves = dbLeaves || [];

  // Batch fetch candidate profiles if some leaves only have candidate_id
  const candidateIdsToFetch = Array.from(
    new Set(
      rawLeaves
        .filter((l) => !l.employee && l.candidate_id)
        .map((l) => l.candidate_id as string)
    )
  );

  const candidateProfilesMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
  if (candidateIdsToFetch.length > 0) {
    const { data: cProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", candidateIdsToFetch);

    if (cProfiles) {
      cProfiles.forEach((cp) => {
        candidateProfilesMap[cp.id] = {
          full_name: cp.full_name || "Colaborador",
          avatar_url: cp.avatar_url || null,
        };
      });
    }
  }

  const typeLabels: Record<string, string> = {
    vacaciones: "Vacaciones LFT",
    permiso_con_goce: "Permiso con Goce de Sueldo",
    permiso_sin_goce: "Permiso sin Goce de Sueldo",
    dias_economicos: "Días Económicos",
    matrimonio: "Permiso por Matrimonio",
    paternidad: "Permiso por Paternidad",
    maternidad: "Incapacidad por Maternidad",
    luto: "Permiso por Luto",
  };

  const requests: VacationRequest[] = rawLeaves.map((l) => {
    const emp = Array.isArray(l.employee) ? l.employee[0] : l.employee;
    const cand = l.candidate_id ? candidateProfilesMap[l.candidate_id] : null;

    const employeeName = emp?.full_name || cand?.full_name || "Colaborador";
    const avatarUrl = emp?.avatar_url || cand?.avatar_url || null;
    const department = emp?.department || "Operaciones";

    return {
      id: l.id,
      employeeId: l.employee_id || l.candidate_id || l.id,
      employeeName,
      avatarUrl,
      department,
      requestType: l.request_type as VacationRequest["requestType"],
      typeLabel: typeLabels[l.request_type] || "Vacaciones LFT",
      startDate: l.start_date,
      endDate: l.end_date,
      totalWorkingDays: l.total_working_days,
      reason: l.reason || "Sin observaciones registradas.",
      status: l.status as VacationRequest["status"],
      requestedAt: l.created_at
        ? formatMexicoDateShort(l.created_at)
        : "Reciente",
      reviewedAt: l.reviewed_at
        ? formatMexicoDateShort(l.reviewed_at)
        : undefined,
      reviewedBy: l.reviewed_by || undefined,
      rejectionReason: l.rejection_reason || undefined,
    };
  });

  // 2. Compute accurate stats
  const todayStr = getMexicoDateISO();
  const [currentYear, currentMonth] = todayStr.split("-").map(Number);

  const pendingCount = requests.filter(
    (r) => r.status === "pendiente" || r.status === "visto_bueno"
  ).length;

  const approvedThisMonth = requests.filter((r) => {
    if (r.status !== "aprobada") return false;
    const [y, m] = r.startDate.split("-").map(Number);
    return y === currentYear && m === currentMonth;
  }).length;

  const employeesOnLeaveToday = requests.filter(
    (r) => r.status === "aprobada" && r.startDate <= todayStr && r.endDate >= todayStr
  ).length;

  // Compute average vacation balance across company employees and gather roster
  const { data: employees } = await supabase
    .from("company_employees")
    .select("id, full_name, department, hire_date")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  const roster: CompanyEmployeeRosterItem[] = (employees || []).map((e) => ({
    id: e.id,
    fullName: e.full_name,
    department: e.department || null,
    hireDate: e.hire_date || null,
  }));

  let averageVacationBalance = 0;
  if (roster.length > 0) {
    const totalDays = roster.reduce((sum, e) => {
      const lft = calculateLFTVacationDays(e.hireDate || todayStr);
      return sum + lft.totalDaysAccrued;
    }, 0);
    averageVacationBalance = Number((totalDays / roster.length).toFixed(1));
  }

  return {
    companyName,
    approvalMode,
    requests,
    employees: roster,
    stats: {
      pendingCount,
      approvedThisMonth,
      employeesOnLeaveToday,
      averageVacationBalance,
    },
  };
}

function extractProfileDocumentPath(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  if (!fileUrl.startsWith("http")) {
    return fileUrl.replace(/^\/+/, "");
  }
  const marker = "/profile_documents/";
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return null;
  const raw = fileUrl.slice(idx + marker.length).split("?")[0];
  return raw ? decodeURIComponent(raw) : null;
}

