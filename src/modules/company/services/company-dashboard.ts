import { createClient } from "@/lib/supabase/server";
import {
  CompanyDashboardData,
  WorkforceKPIs,
  ContractExpirationItem,
  PendingIncidentItem,
  TodayAttendanceItem,
  PayrollSummaryData,
  OperationalAlert,
  SubscriptionSummary,
  ApplicationsSummary,
  RecentCandidateItem,
} from "../types/dashboard";
import { getSubscriptionPlan, SUBSCRIPTION_PLANS } from "@/config/subscriptions";

export async function getCompanyDashboardData(targetCompanyId?: string): Promise<CompanyDashboardData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let effectiveCompanyId = targetCompanyId;
  if (!effectiveCompanyId) {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      effectiveCompanyId = cookieStore.get("kanpro_active_company")?.value;
    } catch {
      // outside cookie context
    }
  }

  if (!effectiveCompanyId && user?.id) {
    effectiveCompanyId = user.id;
  }

  let companyName = "Mi Empresa";
  let isCompanyEarlyAccess = true;

  // Default empty/baseline KPIs
  const kpis: WorkforceKPIs = {
    totalEmployees: 0,
    activeEmployees: 0,
    onboardingEmployees: 0,
    retentionRate: 100,
    absentCountToday: 0,
    unjustifiedAbsences: 0,
    justifiedAbsences: 0,
    lateArrivalsToday: 0,
    punctualityRate: 100,
    openVacanciesCount: 0,
    totalApplicationsReceived: 0,
    pendingReviewApplications: 0,
    activeContractsCount: 0,
    expiringContractsCount: 0,
    imminentContractsCount: 0,
    pendingIncidentsCount: 0,
    criticalIncidentsCount: 0,
  };

  const alerts: OperationalAlert[] = [];
  const expiringContracts: ContractExpirationItem[] = [];
  const pendingIncidents: PendingIncidentItem[] = [];
  const todayAttendance: TodayAttendanceItem[] = [];
  let openVacanciesList: CompanyDashboardData["openVacanciesList"] = [];
  let recentActivities: CompanyDashboardData["recentActivities"] = [];

  const now = new Date();

  // Calculate default payroll period (15th / last day of month cycle)
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let cutoffDate: Date;
  let paymentDate: Date;
  let periodName: string;

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  if (currentDay <= 15) {
    periodName = `1ra Quincena de ${monthNames[currentMonth]} ${currentYear}`;
    cutoffDate = new Date(currentYear, currentMonth, 15);
    paymentDate = new Date(currentYear, currentMonth, 15);
  } else {
    periodName = `2da Quincena de ${monthNames[currentMonth]} ${currentYear}`;
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    cutoffDate = new Date(currentYear, currentMonth, lastDay);
    paymentDate = new Date(currentYear, currentMonth, lastDay);
  }

  const daysToPay = Math.max(0, Math.ceil((paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const payrollSummary: PayrollSummaryData = {
    periodName,
    frequency: "quincenal",
    cutoffDate: cutoffDate.toISOString().split("T")[0],
    paymentDate: paymentDate.toISOString().split("T")[0],
    estimatedTotal: 0,
    employeesCount: 0,
    status: daysToPay <= 3 ? "calculada" : "preparacion",
    daysToPay,
    averageSalary: 8500,
    departmentBreakdown: [],
  };

  const weekDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  let weeklyAttendanceTrend = weekDays.map((day) => ({
    day,
    asistencia: 0,
    retardos: 0,
    ausencias: 0,
  }));

  let subscriptionSummary: SubscriptionSummary = {
    planName: SUBSCRIPTION_PLANS.basic.name,
    planKey: "basic",
    status: "active",
    periodEnd: null,
    daysRemaining: null,
    creditsAvailable: SUBSCRIPTION_PLANS.basic.creditsAllowance,
    featuredVacanciesAllowance: SUBSCRIPTION_PLANS.basic.featuredVacanciesAllowance,
    featuredVacanciesUsed: 0,
    verificationStatus: null,
  };

  const applicationsSummary: ApplicationsSummary = {
    total: 0,
    pending: 0,
    inReview: 0,
    shortlisted: 0,
    hired: 0,
    rejected: 0,
  };

  let recentCandidates: RecentCandidateItem[] = [];

  if (user) {
    const todayStr = now.toISOString().split("T")[0];
    const monday = new Date(now);
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Lunes, 6 = Domingo
    monday.setDate(now.getDate() - dayOfWeek);
    const mondayStr = monday.toISOString().split("T")[0];

    const companyScopeId = effectiveCompanyId || user.id;

    // 1. Fetch Company Profile, Vacancies, Employees, Contracts, Attendance & Incidents in parallel
    const [companyRes, vacanciesRes, employeesRes, contractsRes, attendanceRes, incidentsRes] = await Promise.all([
      supabase
        .from("company_profiles")
        .select(`
          company_name,
          subscription_plan,
          subscription_status,
          subscription_period_end,
          credits_available,
          featured_vacancies_allowance,
          featured_vacancies_used,
          verification_status,
          profiles (
            is_early_access
          )
        `)
        .eq("id", companyScopeId)
        .maybeSingle(),
      supabase
        .from("vacancies")
        .select("id, title, location, zone, salary_min, salary_max, category, created_at, is_active, status")
        .eq("company_id", companyScopeId)
        .order("created_at", { ascending: false }),
      supabase
        .from("company_employees")
        .select(`
          id,
          employee_id,
          full_name,
          phone,
          avatar_url,
          job_title,
          department,
          employee_code,
          base_salary_monthly,
          status,
          hire_date,
          created_at,
          candidate:candidate_profiles (
            id,
            headline,
            profiles (
              id,
              full_name,
              avatar_url,
              whatsapp_number
            )
          )
        `)
        .eq("company_id", companyScopeId)
        .order("created_at", { ascending: false }),
      supabase
        .from("company_contracts")
        .select(`
          id,
          employee_id,
          folio,
          job_title,
          department,
          contract_type,
          template_type,
          start_date,
          end_date,
          status,
          company_employees (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("company_id", companyScopeId)
        .eq("status", "vigente"),
      supabase
        .from("company_attendance")
        .select("*")
        .eq("company_id", companyScopeId)
        .gte("work_date", mondayStr)
        .lte("work_date", todayStr),
      supabase
        .from("company_incidents")
        .select("*")
        .eq("company_id", companyScopeId)
        .order("incident_date", { ascending: false })
        .limit(50),
    ]);

    if (companyRes.data) {
      if (companyRes.data.company_name) {
        companyName = companyRes.data.company_name;
      }

      const companyProfilesObj = companyRes.data.profiles;
      const baseCompanyProfile = Array.isArray(companyProfilesObj)
        ? companyProfilesObj[0]
        : companyProfilesObj;
      if (baseCompanyProfile && typeof (baseCompanyProfile as { is_early_access?: boolean }).is_early_access === "boolean") {
        isCompanyEarlyAccess = (baseCompanyProfile as { is_early_access?: boolean }).is_early_access ?? true;
      }

      const rawPlan = companyRes.data.subscription_plan || "basic";
      const planConfig = getSubscriptionPlan(rawPlan);
      const formattedPlanName = planConfig.name;

      let subDaysRemaining: number | null = null;
      if (companyRes.data.subscription_period_end) {
        const pEnd = new Date(companyRes.data.subscription_period_end);
        subDaysRemaining = Math.max(
          0,
          Math.ceil((pEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
      }

      subscriptionSummary = {
        planName: formattedPlanName,
        planKey: rawPlan,
        status: companyRes.data.subscription_status || "active",
        periodEnd: companyRes.data.subscription_period_end || null,
        daysRemaining: subDaysRemaining,
        creditsAvailable:
          companyRes.data.credits_available ?? planConfig.creditsAllowance,
        featuredVacanciesAllowance:
          companyRes.data.featured_vacancies_allowance ??
          planConfig.featuredVacanciesAllowance,
        featuredVacanciesUsed: companyRes.data.featured_vacancies_used ?? 0,
        verificationStatus: companyRes.data.verification_status || null,
        isEarlyAccess: isCompanyEarlyAccess,
      };
    }

    // Process Vacancies
    const allVacancies = vacanciesRes.data || [];
    const activeVacancies = allVacancies.filter(
      (v) => v.is_active !== false && v.status !== "Pausada" && v.status !== "Cerrada"
    );
    kpis.openVacanciesCount = activeVacancies.length;

    // Process Applications with relational join on vacancies!inner
    const [allAppsRes, appsWithVacancyRes] = await Promise.all([
      supabase
        .from("applications")
        .select("id, status, vacancy_id, vacancies!inner(company_id)")
        .eq("vacancies.company_id", companyScopeId),
      supabase
        .from("applications")
        .select(`
          id,
          applied_at,
          status,
          candidate_id,
          vacancy_id,
          vacancies!inner (
            id,
            title,
            company_id
          ),
          candidate:candidate_profiles (
            id,
            headline,
            skills,
            profiles (
              id,
              full_name,
              avatar_url,
              is_early_access
            )
          )
        `)
        .eq("vacancies.company_id", companyScopeId)
        .order("applied_at", { ascending: false })
        .limit(8),
    ]);

    const allApps = allAppsRes.data || [];
    applicationsSummary.total = allApps.length;
    applicationsSummary.pending = allApps.filter(
      (a) => a.status === "Pendiente" || a.status === "Nuevo"
    ).length;
    applicationsSummary.inReview = allApps.filter(
      (a) => a.status === "En revisión" || a.status === "En evaluacion"
    ).length;
    applicationsSummary.shortlisted = allApps.filter(
      (a) => a.status === "Preseleccionado" || a.status === "Entrevista"
    ).length;
    applicationsSummary.hired = allApps.filter(
      (a) => a.status === "Contratado" || a.status === "Aceptado"
    ).length;
    applicationsSummary.rejected = allApps.filter(
      (a) => a.status === "Rechazado" || a.status === "Descartado"
    ).length;

    kpis.totalApplicationsReceived = allApps.length;
    kpis.pendingReviewApplications =
      applicationsSummary.pending + applicationsSummary.inReview;

    const recentApps = appsWithVacancyRes.data || [];
    recentCandidates = recentApps.map((app) => {
      const candidateProfile = Array.isArray(app.candidate)
        ? app.candidate[0]
        : app.candidate;
      const baseProfile = candidateProfile?.profiles
        ? Array.isArray(candidateProfile.profiles)
          ? candidateProfile.profiles[0]
          : candidateProfile.profiles
        : null;

      let skillsList: string[] = [];
      if (Array.isArray(candidateProfile?.skills)) {
        skillsList = candidateProfile.skills as string[];
      } else if (typeof candidateProfile?.skills === "string") {
        try {
          skillsList = JSON.parse(candidateProfile.skills);
        } catch {
          skillsList = [candidateProfile.skills];
        }
      }

      const vac = Array.isArray(app.vacancies) ? app.vacancies[0] : app.vacancies;

      return {
        id: app.id,
        candidateId: candidateProfile?.id || app.candidate_id,
        candidateName: baseProfile?.full_name || "Candidato K'anPro",
        candidateHeadline:
          candidateProfile?.headline || "Profesional en búsqueda activa",
        candidateAvatar: baseProfile?.avatar_url || null,
        vacancyId: app.vacancy_id,
        vacancyTitle: vac?.title || "Vacante Abierta",
        status: app.status || "Pendiente",
        appliedAt: app.applied_at || new Date().toISOString(),
        skills: skillsList.slice(0, 3),
        isEarlyAccess: baseProfile?.is_early_access ?? true,
      };
    });

    recentActivities = recentCandidates.slice(0, 5).map((cand) => ({
      id: cand.id,
      candidateName: cand.candidateName,
      candidateHeadline: cand.candidateHeadline,
      candidateAvatar: cand.candidateAvatar,
      vacancyTitle: cand.vacancyTitle,
      createdAt: cand.appliedAt,
    }));

    // Build open vacancies top list with candidate counts
    openVacanciesList = activeVacancies.slice(0, 4).map((vac) => {
      const vacApps = allApps.filter((a) => a.vacancy_id === vac.id);
      const salaryRange =
        vac.salary_min && vac.salary_max
          ? `$${vac.salary_min.toLocaleString()} - $${vac.salary_max.toLocaleString()}`
          : vac.salary_min
          ? `Desde $${vac.salary_min.toLocaleString()}`
          : "Sueldo competitivo";

      return {
        id: vac.id,
        title: vac.title,
        category: vac.category || "General",
        location: vac.zone || vac.location || "Presencial",
        salaryRange,
        applicationsCount: vacApps.length,
        newApplicationsCount: vacApps.filter(
          (a) => a.status === "Pendiente" || a.status === "En revisión" || a.status === "Nuevo"
        ).length,
        createdAt: vac.created_at,
      };
    });


    // Process Employees
    const rawEmployees = employeesRes.data || [];
    kpis.totalEmployees = rawEmployees.length;

    const departmentTally: Record<string, { headcount: number; amount: number }> = {};

    const activeList = rawEmployees.filter(
      (emp: any) => emp.status === "Contratado" || emp.status === "active" || emp.status === "onboarding"
    );
    kpis.activeEmployees = activeList.length;
    kpis.onboardingEmployees = rawEmployees.filter((emp: any) => emp.status === "onboarding").length;

    // 2. Retention Rate Real
    if (kpis.totalEmployees > 0) {
      kpis.retentionRate = Math.round((kpis.activeEmployees / kpis.totalEmployees) * 100);
    } else {
      kpis.retentionRate = 100;
    }

    // 3. Process Real Contracts Expiration from company_contracts
    const rawContracts = contractsRes?.data || [];
    rawContracts.forEach((c: any) => {
      const isIndeterminado = c.template_type === "indeterminado" || !c.end_date;
      if (!isIndeterminado && c.end_date) {
        const endDate = new Date(c.end_date);
        const diffMs = endDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        let contractStatus: ContractExpirationItem["status"] = "normal";
        if (daysRemaining <= 7) {
          contractStatus = "imminent";
          kpis.imminentContractsCount++;
          kpis.expiringContractsCount++;
        } else if (daysRemaining <= 30) {
          contractStatus = "upcoming";
          kpis.expiringContractsCount++;
        }

        if (daysRemaining <= 45) {
          const emp = Array.isArray(c.company_employees)
            ? c.company_employees[0]
            : c.company_employees;
          expiringContracts.push({
            id: c.id,
            employeeId: emp?.id || c.employee_id || c.id,
            employeeName: emp?.full_name || "Colaborador",
            avatarUrl: emp?.avatar_url || null,
            jobTitle: c.job_title || "Puesto General",
            department: c.department || "Operaciones",
            contractType: c.contract_type || "Contrato Determinado",
            endDate: c.end_date,
            daysRemaining,
            status: contractStatus,
          });
        }
      }
    });

    // Sort expiring contracts closest first
    expiringContracts.sort((a, b) => a.daysRemaining - b.daysRemaining);
    kpis.activeContractsCount = rawContracts.length;

    // 4. Build Attendance and Department tallies for active employees
    const rawAttendance = attendanceRes?.data || [];
    const todayAttendanceRows = rawAttendance.filter((a: any) => a.work_date === todayStr);
    const attByEmp = new Map<string, any>();
    todayAttendanceRows.forEach((a: any) => attByEmp.set(a.employee_id, a));

    if (activeList.length > 0) {
      activeList.forEach((emp: any, index: number) => {
        const candidateData = Array.isArray(emp.candidate) ? emp.candidate[0] : emp.candidate;
        const profileData = candidateData?.profiles
          ? Array.isArray(candidateData.profiles)
            ? candidateData.profiles[0]
            : candidateData.profiles
          : {};

        const employeeName = emp.full_name || profileData?.full_name || `Colaborador #${emp.employee_code || index + 1}`;
        const avatarUrl = emp.avatar_url || profileData?.avatar_url || null;
        const dept = emp.department || "Operaciones";
        const jobTitle = emp.job_title || "Colaborador";

        // Department payroll tally using real base salary
        const empSalary = emp.base_salary_monthly ? Number(emp.base_salary_monthly) : 0;
        if (!departmentTally[dept]) {
          departmentTally[dept] = { headcount: 0, amount: 0 };
        }
        departmentTally[dept].headcount += 1;
        departmentTally[dept].amount += empSalary;

        // Only include employees who actually recorded attendance or an incident/leave today
        const existingAtt = attByEmp.get(emp.id);
        if (existingAtt) {
          const attStatus = existingAtt.status;
          let dashboardAttStatus: TodayAttendanceItem["status"] = "presente";
          if (attStatus === "retardo") dashboardAttStatus = "retardo";
          else if (attStatus === "falta_injustificada" || attStatus === "ausente") dashboardAttStatus = "ausente";
          else if (attStatus === "falta_justificada" || attStatus === "justificado" || attStatus === "incapacidad")
            dashboardAttStatus = "justificado";
          else if (attStatus === "vacaciones") dashboardAttStatus = "vacaciones";

          todayAttendance.push({
            id: existingAtt.id,
            employeeId: emp.id,
            employeeName,
            avatarUrl,
            jobTitle,
            department: dept,
            checkInTime: existingAtt.check_in_time || null,
            status: dashboardAttStatus,
            delayMinutes: existingAtt.delay_minutes || 0,
          });
        }
      });

      const presents = todayAttendance.filter((a) => a.status === "presente").length;
      const lates = todayAttendance.filter((a) => a.status === "retardo").length;
      const unjustifiedAbs = todayAttendance.filter((a) => a.status === "ausente").length;
      const justifiedAbs = todayAttendance.filter((a) => a.status === "justificado").length;
      const totalAttended = presents + lates;

      kpis.punctualityRate = totalAttended > 0 ? Math.round((presents / totalAttended) * 100) : 100;
      kpis.absentCountToday = unjustifiedAbs + justifiedAbs;
      kpis.unjustifiedAbsences = unjustifiedAbs;
      kpis.justifiedAbsences = justifiedAbs;
      kpis.lateArrivalsToday = lates;

      // Calculate Payroll Summary
      let totalEstPayroll = 0;
      const deptBreakdown = Object.entries(departmentTally).map(([department, data]) => {
        totalEstPayroll += data.amount;
        return {
          department,
          amount: data.amount,
          headcount: data.headcount,
          percentage: 0,
        };
      });

      deptBreakdown.forEach((dept) => {
        dept.percentage = totalEstPayroll > 0 ? Math.round((dept.amount / totalEstPayroll) * 100) : 0;
      });

      payrollSummary.estimatedTotal = totalEstPayroll;
      payrollSummary.employeesCount = activeList.length;
      payrollSummary.averageSalary = activeList.length > 0 ? Math.round(totalEstPayroll / activeList.length) : 0;
      payrollSummary.departmentBreakdown = deptBreakdown;

      // Weekly attendance trend strictly calculated from database records
      weeklyAttendanceTrend = weekDays.map((day, idx) => {
        const targetDay = new Date(monday);
        targetDay.setDate(monday.getDate() + idx);
        const dayStr = targetDay.toISOString().split("T")[0];
        const dayRecords = rawAttendance.filter((a: any) => a.work_date === dayStr);
        return {
          day,
          asistencia: dayRecords.filter((a: any) => a.status === "presente").length,
          retardos: dayRecords.filter((a: any) => a.status === "retardo").length,
          ausencias: dayRecords.filter((a: any) => a.status === "falta_injustificada" || a.status === "ausente").length,
        };
      });
    } else {
      payrollSummary.estimatedTotal = 0;
      payrollSummary.employeesCount = 0;
      payrollSummary.averageSalary = 0;
      payrollSummary.departmentBreakdown = [];
    }

    // Incidents: Real data from company_incidents table
    const allIncidents = incidentsRes?.data || [];
    const pendingIncidentsList = allIncidents.filter((i: any) => i.status === "pendiente");
    const criticalIncidentsList = allIncidents.filter(
      (i: any) => (i.severity === "alta" || i.severity === "critica") && i.status !== "resuelto"
    );

    kpis.pendingIncidentsCount = pendingIncidentsList.length;
    kpis.criticalIncidentsCount = criticalIncidentsList.length;

    const empAvatarMap = new Map<string, string | null>();
    (employeesRes.data || []).forEach((emp: any) => {
      if (emp.id) {
        empAvatarMap.set(emp.id, emp.avatar_url || null);
      }
    });

    pendingIncidents.push(
      ...pendingIncidentsList.map((row: any) => ({
        id: row.id,
        employeeId: row.employee_id || "",
        employeeName: row.employee_name,
        avatarUrl: row.employee_id ? empAvatarMap.get(row.employee_id) || null : null,
        department: row.department || "Operaciones",
        type: row.category,
        typeLabel: row.category_label || row.category,
        title: row.title,
        description: row.description,
        date: row.incident_date,
        severity: row.severity,
        status: row.status,
      }))
    );

    // 8. Generate Operational Alerts
    if (kpis.imminentContractsCount > 0) {
      alerts.push({
        id: "alert-imminent-contracts",
        type: "contract",
        severity: "critical",
        title: `${kpis.imminentContractsCount} Contrato(s) por vencer en menos de 7 días`,
        description: "Hay colaboradores cuya relación laboral termina esta semana. Revisa la renovación o finiquito.",
        actionUrl: "#contracts-section",
        actionLabel: "Revisar Contratos",
        timestamp: "Acción requerida hoy",
      });
    } else if (kpis.expiringContractsCount > 0) {
      alerts.push({
        id: "alert-upcoming-contracts",
        type: "contract",
        severity: "warning",
        title: `${kpis.expiringContractsCount} Contrato(s) vencen en los próximos 30 días`,
        description: "Planifica con tiempo las extensiones o renovaciones de tu personal activo.",
        actionUrl: "#contracts-section",
        actionLabel: "Ver Vencimientos",
        timestamp: "Esta quincena",
      });
    }

    if (kpis.pendingReviewApplications > 0) {
      alerts.push({
        id: "alert-pending-apps",
        type: "vacancy",
        severity: "info",
        title: `${kpis.pendingReviewApplications} Candidato(s) esperan respuesta a sus postulaciones`,
        description: "Mantener un tiempo de respuesta rápido mejora la tasa de conversión y contratación.",
        actionUrl: "/dashboard/company/applications",
        actionLabel: "Abrir Postulaciones",
        timestamp: "Reclutamiento activo",
      });
    }

    if (kpis.pendingIncidentsCount > 0) {
      alerts.push({
        id: "alert-incidents",
        type: "incident",
        severity: kpis.criticalIncidentsCount > 0 ? "critical" : "warning",
        title: `${kpis.pendingIncidentsCount} Incidencia(s) o permisos laborales por autorizar`,
        description: "Hay solicitudes de personal pendientes de validación para el cierre de nómina.",
        actionUrl: "#incidents-section",
        actionLabel: "Autorizar Incidencias",
        timestamp: "Pendiente",
      });
    }

    if (daysToPay <= 2) {
      alerts.push({
        id: "alert-payroll-cutoff",
        type: "payroll",
        severity: "warning",
        title: `Cierre de Nómina: ${daysToPay === 0 ? "Hoy es día de pago" : `Faltan ${daysToPay} día(s)`}`,
        description: `Revisa el reporte de incidencias y montos antes de la dispersión de la ${periodName}.`,
        actionUrl: "#payroll-section",
        actionLabel: "Ver Resumen de Nómina",
        timestamp: "Cierre de ciclo",
      });
    }
  }

  return {
    companyName,
    isEarlyAccess: isCompanyEarlyAccess,
    kpis,
    alerts,
    expiringContracts,
    pendingIncidents,
    todayAttendance,
    payrollSummary,
    subscriptionSummary,
    applicationsSummary,
    recentCandidates,
    openVacanciesList,
    weeklyAttendanceTrend,
    recentActivities,
  };
}

export async function getCompanyProfileData(targetCompanyId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let effectiveCompanyId = targetCompanyId;
  if (!effectiveCompanyId) {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      effectiveCompanyId = cookieStore.get("kanpro_active_company")?.value;
    } catch {
      // outside cookie context
    }
  }

  const companyScopeId = effectiveCompanyId || user.id;

  const [{ data: companyProfile }, { data: baseProfile }] = await Promise.all([
    supabase
      .from("company_profiles")
      .select("*")
      .eq("id", companyScopeId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  let lat: number | null = null;
  let lng: number | null = null;

  if (Array.isArray(companyProfile?.branch_addresses) && companyProfile.branch_addresses.length > 0) {
    const firstBranch = companyProfile.branch_addresses[0] as Record<string, unknown> | null;
    if (typeof firstBranch?.latitude === "number" && typeof firstBranch?.longitude === "number") {
      lat = firstBranch.latitude;
      lng = firstBranch.longitude;
    }
  }

  if (lat === null && companyProfile?.social_links) {
    const social = companyProfile.social_links as Record<string, unknown> | null;
    if (typeof social?.latitude === "number" && typeof social?.longitude === "number") {
      lat = social.latitude;
      lng = social.longitude;
    }
  }

  const profile = {
    ...(baseProfile || {}),
    ...(companyProfile || {}),
    latitude: lat,
    longitude: lng,
    phone:
      companyProfile?.contact_phone ||
      baseProfile?.whatsapp_number ||
      "",
    website:
      companyProfile?.website_url ||
      "",
    logo_url: companyProfile?.logo_url || baseProfile?.avatar_url || "",
    company_name:
      companyProfile?.company_name ||
      baseProfile?.full_name ||
      "",
    legal_name: companyProfile?.legal_name || "",
    verification_status:
      companyProfile?.verification_status ||
      (baseProfile?.is_verified ? "approved" : "unsubmitted"),
  };

  return {
    profile,
    userId: user.id,
  };
}
