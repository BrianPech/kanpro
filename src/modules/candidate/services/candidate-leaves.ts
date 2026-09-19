import { createClient } from "@/lib/supabase/server";
import { calculateLFTVacationDays } from "@/modules/company/utils/vacation-calculator";

export type LeaveRequestType =
  | "vacaciones"
  | "permiso_con_goce"
  | "permiso_sin_goce"
  | "paternidad"
  | "maternidad"
  | "luto";

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

const TYPE_LABELS: Record<LeaveRequestType, string> = {
  vacaciones: "Vacaciones Anuales LFT",
  permiso_con_goce: "Permiso con Goce de Sueldo",
  permiso_sin_goce: "Permiso sin Goce de Sueldo",
  paternidad: "Permiso por Paternidad (LFT)",
  maternidad: "Incapacidad por Maternidad (LFT/IMSS)",
  luto: "Permiso por Luto",
};

/**
 * Fetches vacation and leave balance and request history for the logged-in candidate/employee.
 * Strictly reads from Supabase: public.company_contracts, public.company_employees, public.company_leaves.
 */
export async function getCandidateLeavesData(): Promise<CandidateLeavesData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { hasActiveEmployment: false, requests: [] };
  }

  // 1. Check for active contract in company_contracts
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
    .eq("candidate_id", user.id)
    .neq("status", "cancelado")
    .order("created_at", { ascending: false });

  const activeContract = contracts && contracts.length > 0 ? contracts[0] : null;

  // 2. Also check if the candidate exists in company_employees (by email or employee_id)
  let employeeRecord: any = null;
  if (activeContract?.employee_id) {
    const { data: emp } = await supabase
      .from("company_employees")
      .select("*")
      .eq("id", activeContract.employee_id)
      .maybeSingle();
    employeeRecord = emp;
  }

  if (!employeeRecord && user.email) {
    const { data: empByEmail } = await supabase
      .from("company_employees")
      .select(`
        *,
        company:company_profiles (
          id,
          company_name,
          legal_name,
          logo_url
        )
      `)
      .eq("email", user.email)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (empByEmail) {
      employeeRecord = empByEmail;
    }
  }

  // If no contract and no employee record, user is not currently employed
  if (!activeContract && !employeeRecord) {
    return {
      hasActiveEmployment: false,
      requests: [],
    };
  }

  const companyProfile = (activeContract?.company as any) || (employeeRecord?.company as any);
  const companyId = activeContract?.company_id || employeeRecord?.company_id || "";
  const companyName = companyProfile?.company_name || companyProfile?.legal_name || "Empresa Contratante";
  const companyLogoUrl = companyProfile?.logo_url || null;
  const employeeId = activeContract?.employee_id || employeeRecord?.id || undefined;
  const jobTitle = activeContract?.job_title || employeeRecord?.job_title || "Colaborador";
  const department = activeContract?.department || employeeRecord?.department || "Operaciones";
  const hireDate = activeContract?.start_date || employeeRecord?.hire_date || new Date().toISOString().split("T")[0];

  // 3. Compute LFT Art. 76 vacation days
  const lft = calculateLFTVacationDays(hireDate);

  // 4. Fetch leave requests from company_leaves
  let leavesQuery = supabase
    .from("company_leaves")
    .select("*")
    .order("created_at", { ascending: false });

  if (employeeId) {
    leavesQuery = leavesQuery.or(`candidate_id.eq.${user.id},employee_id.eq.${employeeId}`);
  } else {
    leavesQuery = leavesQuery.eq("candidate_id", user.id);
  }

  const { data: rawLeaves, error: leavesErr } = await leavesQuery;

  if (leavesErr) {
    console.error("[getCandidateLeavesData] Error querying leaves:", leavesErr);
  }

  const leavesList = rawLeaves || [];

  // Calculate days taken (aprobada) and days pending (pendiente) only for "vacaciones"
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
