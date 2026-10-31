import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAuth } from "@/lib/auth/require-admin";

export { requireAdminAuth };

export interface CompanyDiagnosticProfile {
  id: string;
  companyName: string;
  legalName: string | null;
  rfc: string;
  industry: string;
  entityType: string | null;
  verificationStatus: "pending" | "approved" | "rejected" | "unverified";
  isVerified: boolean;
  creditsAvailable: number;
  subscriptionPlan: string;
  subscriptionStatus: string;
  corporateEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  fiscalAddress: string | null;
  addressDetails: string | null;
  imssPatronalRegistry: string | null;
  repseRegistry: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  userFullName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyDiagnosticVacancy {
  id: string;
  title: string;
  category: string;
  location: string;
  modality: string;
  employmentType: string;
  status: "Activa" | "Pausada" | "Cerrada";
  isActive: boolean;
  applicationsCount: number;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  createdAt: string;
}

export interface CompanyDiagnosticEmployee {
  id: string;
  fullName: string;
  jobTitle: string;
  department: string | null;
  employeeCode: string | null;
  email: string | null;
  phone: string | null;
  status: "pending" | "onboarding" | "active" | "suspended" | "terminated" | string;
  hireDate: string | null;
  baseSalaryMonthly: number | null;
  avatarUrl: string | null;
}

export interface CompanyDiagnosticInvitation {
  id: string;
  email: string;
  fullName: string;
  position: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  contractType: string | null;
  salary: number | null;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
}

export interface CompanyDiagnosticAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  workDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  checkInMethod: string;
  delayMinutes: number;
  overtimeHours: number;
}

export interface CompanyDiagnosticAttendance {
  recentRecords: CompanyDiagnosticAttendanceRecord[];
  kioskConfigured: boolean;
  kioskQrCount: number;
  totalRecordsCount: number;
}

export interface CompanyDiagnosticContractItem {
  id: string;
  folio: string;
  jobTitle: string;
  contractType: string;
  department: string;
  salary: number;
  startDate: string;
  endDate: string | null;
  companySigned: boolean;
  employeeSigned: boolean;
  status: string;
  createdAt: string;
}

export interface CompanyDiagnosticContractsSummary {
  totalCount: number;
  signedCount: number;
  pendingCount: number;
  recentContracts: CompanyDiagnosticContractItem[];
}

export interface CompanyDiagnosticPayrollItem {
  id: string;
  periodName: string;
  periodType: "semanal" | "quincenal" | "mensual" | string;
  startDate: string;
  endDate: string;
  payoutDate: string;
  status: "borrador" | "calculada" | "pagada" | string;
  employeesCount: number;
  totalGross: number;
  totalNet: number;
}

export interface CompanyDiagnosticPayrollsSummary {
  totalCount: number;
  totalGrossDispersed: number;
  totalNetDispersed: number;
  recentPayrolls: CompanyDiagnosticPayrollItem[];
}

export interface CompanyDiagnosticTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFullDiagnostic {
  company: CompanyDiagnosticProfile;
  vacancies: {
    list: CompanyDiagnosticVacancy[];
    totalCount: number;
    activeCount: number;
    pausedCount: number;
    closedCount: number;
    totalApplicationsCount: number;
  };
  team: {
    employees: CompanyDiagnosticEmployee[];
    invitations: CompanyDiagnosticInvitation[];
    activeEmployeesCount: number;
    pendingInvitationsCount: number;
  };
  attendance: CompanyDiagnosticAttendance;
  operations: {
    contracts: CompanyDiagnosticContractsSummary;
    payrolls: CompanyDiagnosticPayrollsSummary;
    hasAuditDocuments: boolean;
    auditUrl: string;
  };
  support: {
    tickets: CompanyDiagnosticTicket[];
    openCount: number;
  };
}

function applyBoundedLimit<T>(query: T, maxRows: number): T {
  if (query && typeof (query as { limit?: unknown }).limit === "function") {
    return (query as unknown as { limit: (n: number) => T }).limit(maxRows);
  }
  return query;
}

/**
 * Retrieves a full 360° diagnostic overview for a company account.
 */
export async function getCompanyFullDiagnostic(
  companyId: string
): Promise<CompanyFullDiagnostic | null> {
  await requireAdminAuth({ requiredPermission: "manage_companies" });
  const adminClient = createAdminClient();

  // 1. Fetch Company Profile and Auth/Profile details concurrently
  const [
    { data: compProfile },
    { data: userProfile },
  ] = await Promise.all([
    adminClient
      .from("company_profiles")
      .select("*")
      .eq("id", companyId)
      .maybeSingle(),
    adminClient
      .from("profiles")
      .select("*")
      .eq("id", companyId)
      .maybeSingle(),
  ]);

  if (!compProfile && !userProfile) {
    return null;
  }

  // Reject if the target profile is strictly a candidate with no company profile
  if (userProfile && userProfile.role === "candidate" && !compProfile) {
    return null;
  }

  // 2. Fetch Vacancies, Employees, Invitations, Attendance, Contracts, Payrolls, Tickets, and Documents
  // Using exact SQL counts and bounded row limits to avoid loading entire tables into Node memory
  const [
    { data: rawVacancies, count: totalVacanciesCount },
    { data: rawEmployees },
    { data: rawInvitations },
    { data: rawAttendance, count: totalAttendanceCount },
    { data: rawContracts },
    { data: rawPayrolls },
    { data: rawTickets },
    { count: auditDocsCount },
  ] = await Promise.all([
    applyBoundedLimit(
      adminClient
        .from("vacancies")
        .select(
          "id, title, category, location, modality, employment_type, status, is_active, salary_min, salary_max, currency, created_at",
          { count: "exact" }
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      50
    ),
    applyBoundedLimit(
      adminClient
        .from("company_employees")
        .select(
          "id, full_name, job_title, department, employee_code, email, phone, status, hire_date, base_salary_monthly, avatar_url",
          { count: "exact" }
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      100
    ),
    applyBoundedLimit(
      adminClient
        .from("employee_invitations")
        .select(
          "id, email, full_name, position, status, contract_type, salary, expires_at, created_at, accepted_at",
          { count: "exact" }
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      100
    ),
    adminClient
      .from("company_attendance")
      .select("*", { count: "exact" })
      .eq("company_id", companyId)
      .order("work_date", { ascending: false })
      .limit(25),
    applyBoundedLimit(
      adminClient
        .from("company_contracts")
        .select(
          "id, folio, job_title, contract_type, department, salary, start_date, end_date, company_signed, employee_signed, status, created_at",
          { count: "exact" }
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      50
    ),
    applyBoundedLimit(
      adminClient
        .from("company_payrolls")
        .select(
          "id, period_name, period_type, start_date, end_date, payout_date, status, employees_count, total_gross, total_net",
          { count: "exact" }
        )
        .eq("company_id", companyId)
        .order("payout_date", { ascending: false }),
      50
    ),
    applyBoundedLimit(
      adminClient
        .from("support_tickets")
        .select(
          "id, ticket_number, subject, description, category, priority, status, created_at, updated_at",
          { count: "exact" }
        )
        .eq("user_id", companyId)
        .order("created_at", { ascending: false }),
      50
    ),
    adminClient
      .from("profile_documents")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", companyId),
  ]);

  // 3. Applications count associated with those vacancies using exact count / bounded aggregation
  const vacancyList = rawVacancies || [];
  const vacancyIds = vacancyList.map((v) => v.id);
  const applicationsByVacancy: Record<string, number> = {};
  let totalApplicationsCount = 0;

  if (vacancyIds.length > 0) {
    const appCountProbe = adminClient
      .from("applications")
      .select("*", { count: "exact", head: true }) as unknown as {
      eq?: (col: string, val: string) => Promise<{ count?: number | null }>;
      in?: (
        col: string,
        vals: string[]
      ) => Promise<{ data?: Array<{ id?: string; vacancy_id: string }> | null; count?: number | null }>;
    };

    if (typeof appCountProbe.eq === "function") {
      const perVacancyCounts = await Promise.all(
        vacancyIds.map(async (vId) => {
          const { count } = await (
            adminClient
              .from("applications")
              .select("*", { count: "exact", head: true }) as unknown as {
              eq: (col: string, val: string) => Promise<{ count?: number | null }>;
            }
          ).eq("vacancy_id", vId);
          return { vId, count: count ?? 0 };
        })
      );
      for (const item of perVacancyCounts) {
        applicationsByVacancy[item.vId] = item.count;
        totalApplicationsCount += item.count;
      }
    } else if (typeof appCountProbe.in === "function") {
      const { data: rawApps, count } = await appCountProbe.in("vacancy_id", vacancyIds);
      if (rawApps) {
        totalApplicationsCount = count ?? rawApps.length;
        rawApps.forEach((app) => {
          applicationsByVacancy[app.vacancy_id] =
            (applicationsByVacancy[app.vacancy_id] || 0) + 1;
        });
      }
    }
  }

  // 4. Calculate vacancy metrics
  let activeCount = 0;
  let pausedCount = 0;
  let closedCount = 0;

  const formattedVacancies: CompanyDiagnosticVacancy[] = vacancyList.map((v) => {
    const statusLower = (v.status || "").toLowerCase().trim();
    let normalizedStatus: "Activa" | "Pausada" | "Cerrada";

    if (statusLower === "cerrada" || statusLower === "closed") {
      normalizedStatus = "Cerrada";
      closedCount++;
    } else if (
      statusLower === "pausada" ||
      statusLower === "paused" ||
      (!v.is_active && statusLower !== "cerrada")
    ) {
      normalizedStatus = "Pausada";
      pausedCount++;
    } else {
      normalizedStatus = "Activa";
      activeCount++;
    }

    return {
      id: v.id,
      title: v.title,
      category: v.category,
      location: v.location,
      modality: v.modality,
      employmentType: v.employment_type,
      status: normalizedStatus,
      isActive: v.is_active,
      applicationsCount: applicationsByVacancy[v.id] || 0,
      salaryMin: v.salary_min,
      salaryMax: v.salary_max,
      currency: v.currency,
      createdAt: v.created_at,
    };
  });

  // 5. Employees & Invitations mapping
  const employees: CompanyDiagnosticEmployee[] = (rawEmployees || []).map((emp) => ({
    id: emp.id,
    fullName: emp.full_name,
    jobTitle: emp.job_title,
    department: emp.department,
    employeeCode: emp.employee_code,
    email: emp.email,
    phone: emp.phone,
    status: emp.status,
    hireDate: emp.hire_date,
    baseSalaryMonthly: emp.base_salary_monthly,
    avatarUrl: emp.avatar_url,
  }));

  const activeEmployeesCount = employees.filter((e) => e.status === "active").length;

  const nowMs = Date.now();
  const invitations: CompanyDiagnosticInvitation[] = (rawInvitations || []).map((inv) => {
    let status: "pending" | "accepted" | "expired" | "cancelled" = "pending";
    const rawStatus = (inv.status || "").toLowerCase().trim();

    if (rawStatus === "accepted") {
      status = "accepted";
    } else if (rawStatus === "cancelled" || rawStatus === "canceled") {
      status = "cancelled";
    } else if (rawStatus === "expired" || new Date(inv.expires_at).getTime() < nowMs) {
      status = "expired";
    } else {
      status = "pending";
    }

    return {
      id: inv.id,
      email: inv.email,
      fullName: inv.full_name,
      position: inv.position,
      status,
      contractType: inv.contract_type,
      salary: inv.salary,
      expiresAt: inv.expires_at,
      createdAt: inv.created_at,
      acceptedAt: inv.accepted_at,
    };
  });

  const pendingInvitationsCount = invitations.filter((inv) => inv.status === "pending").length;

  // 6. Attendance mapping
  const employeeNameMap = new Map<string, string>();
  employees.forEach((e) => employeeNameMap.set(e.id, e.fullName));

  let kioskQrCount = 0;
  const recentAttendance: CompanyDiagnosticAttendanceRecord[] = (rawAttendance || []).map((rec) => {
    const methodLower = (rec.check_in_method || "").toLowerCase();
    if (methodLower.includes("qr") || methodLower.includes("kiosk")) {
      kioskQrCount++;
    }
    return {
      id: rec.id,
      employeeId: rec.employee_id,
      employeeName: employeeNameMap.get(rec.employee_id) || "Colaborador",
      workDate: rec.work_date,
      checkInTime: rec.check_in_time,
      checkOutTime: rec.check_out_time,
      status: rec.status,
      checkInMethod: rec.check_in_method || "manual",
      delayMinutes: rec.delay_minutes || 0,
      overtimeHours: rec.overtime_hours || 0,
    };
  });

  const hasBranchConfigs = Boolean(
    compProfile?.branch_addresses &&
      (Array.isArray(compProfile.branch_addresses)
        ? (compProfile.branch_addresses as unknown[]).length > 0
        : Object.keys(compProfile.branch_addresses as object).length > 0)
  );

  const kioskConfigured = hasBranchConfigs || kioskQrCount > 0;

  // 7. Contracts summary
  const contractList = rawContracts || [];
  const signedCount = contractList.filter(
    (c) => c.company_signed && c.employee_signed
  ).length;
  const pendingContractsCount = contractList.length - signedCount;

  const recentContracts: CompanyDiagnosticContractItem[] = contractList.slice(0, 15).map((c) => ({
    id: c.id,
    folio: c.folio,
    jobTitle: c.job_title,
    contractType: c.contract_type,
    department: c.department,
    salary: c.salary,
    startDate: c.start_date,
    endDate: c.end_date,
    companySigned: c.company_signed,
    employeeSigned: c.employee_signed,
    status: c.status,
    createdAt: c.created_at,
  }));

  // 8. Payrolls summary
  const payrollList = rawPayrolls || [];
  const totalGrossDispersed = payrollList.reduce((acc, p) => acc + (p.total_gross || 0), 0);
  const totalNetDispersed = payrollList.reduce((acc, p) => acc + (p.total_net || 0), 0);

  const recentPayrolls: CompanyDiagnosticPayrollItem[] = payrollList.slice(0, 10).map((p) => {
    const periodType =
      p.period_type === "semanal" || p.period_type === "mensual"
        ? p.period_type
        : "quincenal";
    const status =
      p.status === "borrador" || p.status === "pagada"
        ? p.status
        : (p.status || "calculada");

    return {
      id: p.id,
      periodName: p.period_name,
      periodType,
      startDate: p.start_date,
      endDate: p.end_date,
      payoutDate: p.payout_date,
      status,
      employeesCount: p.employees_count,
      totalGross: p.total_gross,
      totalNet: p.total_net,
    };
  });

  // 9. Support tickets
  const ticketList = rawTickets || [];
  const formattedTickets: CompanyDiagnosticTicket[] = ticketList.map((t) => ({
    id: t.id,
    ticketNumber: t.ticket_number,
    subject: t.subject,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  const openTicketsCount = formattedTickets.filter(
    (t) => t.status === "abierto" || t.status === "en_proceso"
  ).length;

  // 10. Build final profile object
  const rawVerificationStatus = compProfile?.verification_status || null;
  const isVerified =
    rawVerificationStatus === "approved" ||
    Boolean(userProfile?.is_verified);

  const verificationStatus: "pending" | "approved" | "rejected" | "unverified" =
    rawVerificationStatus === "approved"
      ? "approved"
      : rawVerificationStatus === "rejected"
      ? "rejected"
      : rawVerificationStatus === "pending"
      ? "pending"
      : isVerified
      ? "approved"
      : "unverified";

  const companyDiagnosticProfile: CompanyDiagnosticProfile = {
    id: companyId,
    companyName:
      compProfile?.company_name ||
      userProfile?.full_name ||
      "Empresa sin razón social",
    legalName: compProfile?.legal_name || null,
    rfc: compProfile?.rfc || "SIN RFC REGISTRADO",
    industry: compProfile?.industry || "Turismo y Servicios",
    entityType: compProfile?.entity_type || null,
    verificationStatus,
    isVerified,
    creditsAvailable: compProfile?.credits_available ?? 0,
    subscriptionPlan: compProfile?.subscription_plan || "Gratuito",
    subscriptionStatus: compProfile?.subscription_status || "active",
    corporateEmail: compProfile?.corporate_email || userProfile?.email || null,
    contactPhone: compProfile?.contact_phone || userProfile?.whatsapp_number || null,
    websiteUrl: compProfile?.website_url || null,
    fiscalAddress: compProfile?.fiscal_address || null,
    addressDetails: compProfile?.address_details || null,
    imssPatronalRegistry: compProfile?.imss_patronal_registry || null,
    repseRegistry: compProfile?.repse_registry || null,
    logoUrl: compProfile?.logo_url || userProfile?.avatar_url || null,
    bannerUrl: compProfile?.banner_url || null,
    userFullName: userProfile?.full_name || null,
    userEmail: userProfile?.email || null,
    userPhone: userProfile?.whatsapp_number || null,
    createdAt: compProfile?.created_at || userProfile?.created_at || new Date().toISOString(),
    updatedAt: compProfile?.updated_at || userProfile?.updated_at || new Date().toISOString(),
  };

  return {
    company: companyDiagnosticProfile,
    vacancies: {
      list: formattedVacancies,
      totalCount: totalVacanciesCount ?? formattedVacancies.length,
      activeCount,
      pausedCount,
      closedCount,
      totalApplicationsCount,
    },
    team: {
      employees,
      invitations,
      activeEmployeesCount,
      pendingInvitationsCount,
    },
    attendance: {
      recentRecords: recentAttendance,
      kioskConfigured,
      kioskQrCount,
      totalRecordsCount: totalAttendanceCount || recentAttendance.length,
    },
    operations: {
      contracts: {
        totalCount: contractList.length,
        signedCount,
        pendingCount: pendingContractsCount,
        recentContracts,
      },
      payrolls: {
        totalCount: payrollList.length,
        totalGrossDispersed,
        totalNetDispersed,
        recentPayrolls,
      },
      hasAuditDocuments: (auditDocsCount || 0) > 0,
      auditUrl: `/dashboard/admin/verifications/${companyId}`,
    },
    support: {
      tickets: formattedTickets,
      openCount: openTicketsCount,
    },
  };
}
