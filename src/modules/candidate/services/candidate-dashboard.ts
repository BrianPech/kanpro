import { createClient } from "@/lib/supabase/server";
import { parseLocation, cleanCityName } from "@/lib/formatters";
import { getCoordsForZone, haversineDistanceKm, GEO_CONFIG } from "@/config/geo";
import { calculateLFTVacationDays } from "@/modules/company/utils/vacation-calculator";

export interface ActiveEmploymentData {
  id: string;
  companyId: string;
  companyName: string;
  companyLogoUrl: string | null;
  companyRfc: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  jobTitle: string;
  department: string | null;
  hireDate: string | null;
  employeeCode: string | null;
  workSchedule: string | null;
  paymentFrequency: string | null;
  baseSalaryMonthly: number | null;
  seniorityFormatted: string;
  vacationDaysTotal: number;
  vacationDaysTaken: number;
  vacationDaysAvailable: number;
  contract: {
    id: string;
    folio: string;
    status: string;
    contractType: string;
    isPendingSignature: boolean;
  } | null;
  todayAttendance: {
    hasCheckedIn: boolean;
    hasCheckedOut: boolean;
    checkInTime: string | null;
    checkOutTime: string | null;
    status: string;
    delayMinutes: number;
  } | null;
  forcePasswordChange?: boolean;
}

export interface CandidateContractSummary {
  id: string
  folio: string
  jobTitle: string
  department: string
  contractType: string
  templateType: string
  startDate: string
  endDate?: string | null
  salary: number
  paymentFrequency: string
  companySigned: boolean
  companySignatureUrl?: string | null
  employeeSigned: boolean
  employeeSignatureUrl?: string | null
  status: string
  companyName?: string
  companyRfc?: string | null
  companyAddress?: string | null
  companyLegalRep?: string | null
}

export interface CandidateInterviewDetails {
  date: string
  time?: string
  modality: "presencial" | "virtual"
  locationOrLink: string
  notes?: string
  scheduledAt?: string | null
  status?: "pending" | "confirmed" | "rescheduled" | "reschedule_requested" | "cancelled" | "completed" | null
  candidateResponseNotes?: string | null
  proposedDate?: string | null
  proposedTime?: string | null
  scheduledInterviewAt?: string | null
  interviewStatus?: string | null
}

export interface CandidateApplication {
  id: string
  vacancy_id?: string
  position: string
  location: string
  company: string
  companyInitials: string
  logoUrl: string | null
  status: string
  statusLabel: string
  statusColor: string
  progress: number
  appliedDate: string
  created_at: string
  salary_min: number | null
  salary_max: number | null
  companyPhone: string | null
  interviewDetails?: CandidateInterviewDetails | null
  contract?: CandidateContractSummary | null
}

export interface VacancyItem {
  id: string
  title: string
  companyName: string
  companyLogo: string | null
  location: string
  zone?: string
  city?: string
  employmentType: string
  formattedSalary: string
  isFeatured: boolean
  category: string
  createdAt?: string
  distanceKm?: number | null
  distanceBadge?: string | null
  salary_min?: number | null
  salary_max?: number | null
  paymentFrequency?: string | null
  modality?: string
  skills?: string[]
}


export interface CandidateDashboardData {
  profile: {
    id: string
    full_name: string
    headline: string | null
    experience_summary: string | null
    location: string | null
    skills: string[] | null
    avatar_url: string | null
    is_approved: boolean
    is_validated: boolean
    completionScore: number
    rfc?: string | null
    curp?: string | null
    is_early_access?: boolean
  } | null
  applications: CandidateApplication[]
  stats: {
    total: number
    reviewing: number
    hired: number
    pendingContracts: number
  }
  featuredVacancies: VacancyItem[]
  nearbyVacancies: VacancyItem[]
  pendingContractsCount: number
  activeEmployment: ActiveEmploymentData | null
  forcePasswordChange?: boolean
}

export async function getCandidateDashboardData(): Promise<CandidateDashboardData> {
  const supabase = await createClient()
  
  // 1. Get current authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return {
      profile: null,
      applications: [],
      stats: {
        total: 0,
        reviewing: 0,
        hired: 0,
        pendingContracts: 0,
      },
      featuredVacancies: [],
      nearbyVacancies: [],
      pendingContractsCount: 0,
      activeEmployment: null,
      forcePasswordChange: false,
    }
  }

  // 2. Fetch candidate profile and private info via PostgREST Resource Embedding
  const { data: rawProfileData } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      whatsapp_number,
      avatar_url,
      location,
      is_early_access,
      candidate_profiles (
        headline,
        bio,
        skills,
        experience,
        portfolio_links,
        preferred_zone
      ),
      candidate_private_profiles (
        rfc,
        curp,
        birth_date
      )
    `)
    .eq("id", user.id)
    .maybeSingle();

  interface EmbeddedCandProfile {
    headline: string | null;
    bio: string | null;
    skills: string[] | null;
    experience: unknown;
    portfolio_links: unknown;
    preferred_zone: string | null;
  }

  interface EmbeddedPrivProfile {
    rfc: string | null;
    curp: string | null;
    birth_date: string | null;
  }

  interface BaseProfileWithEmbeds {
    id: string;
    full_name: string | null;
    email: string | null;
    whatsapp_number: string | null;
    avatar_url: string | null;
    location: string | null;
    is_early_access?: boolean | null;
    candidate_profiles: EmbeddedCandProfile | EmbeddedCandProfile[] | null;
    candidate_private_profiles: EmbeddedPrivProfile | EmbeddedPrivProfile[] | null;
  }

  const baseProfile = rawProfileData as unknown as BaseProfileWithEmbeds | null;

  const candProfile: EmbeddedCandProfile | null = baseProfile?.candidate_profiles
    ? (Array.isArray(baseProfile.candidate_profiles)
        ? (baseProfile.candidate_profiles[0] ?? null)
        : baseProfile.candidate_profiles)
    : null;

  const privateProfile: EmbeddedPrivProfile | null = baseProfile?.candidate_private_profiles
    ? (Array.isArray(baseProfile.candidate_private_profiles)
        ? (baseProfile.candidate_private_profiles[0] ?? null)
        : baseProfile.candidate_private_profiles)
    : null;

  const profileData = baseProfile ? {
    id: baseProfile.id,
    full_name: baseProfile.full_name || "Candidato",
    headline: candProfile?.headline || null,
    experience_summary: candProfile?.bio || null,
    location: baseProfile.location || (candProfile?.preferred_zone ? `Mérida - ${candProfile.preferred_zone}` : null),
    skills: candProfile?.skills || null,
    avatar_url: baseProfile.avatar_url || null,
    is_approved: true,
    is_validated: true,
    experience: candProfile?.experience || null,
    cv_url: null,
    rfc: privateProfile?.rfc || null,
    curp: privateProfile?.curp || null,
    is_early_access: baseProfile.is_early_access ?? true,
  } : null;

  let completionScore = 0
  if (profileData) {
    if (profileData.full_name && profileData.full_name !== "Candidato") completionScore += 20
    if (profileData.headline) completionScore += 15
    if (profileData.experience_summary) completionScore += 15
    if (profileData.location) completionScore += 10
    if (profileData.skills && profileData.skills.length > 0) completionScore += 15
    if (profileData.avatar_url) completionScore += 15
    if (profileData.experience && Array.isArray(profileData.experience) && profileData.experience.length > 0) completionScore += 10
  }

  // 3. Fetch candidate applications and formal contracts in parallel
  const [{ data: dbApplications }, { data: dbContracts }] = await Promise.all([
    supabase
      .from("applications")
      .select(`
        id,
        status,
        applied_at,
        vacancy_id,
        interview_details,
        scheduled_interview_at,
        interview_status,
        hired_at,
        vacancy:vacancies (
          id,
          title,
          location,
          modality,
          skills,
          salary_min,
          salary_max,
          created_at,
          company_id,
          company:company_profiles (
            id,
            company_name,
            logo_url,
            contact_phone
          )
        )
      `)
      .eq("candidate_id", user.id)
      .order("applied_at", { ascending: false }),
    supabase
      .from("company_contracts")
      .select(`
        id,
        folio,
        company_id,
        candidate_id,
        employee_id,
        application_id,
        job_title,
        department,
        contract_type,
        template_type,
        start_date,
        end_date,
        salary,
        payment_frequency,
        company_signed,
        company_signature_url,
        employee_signed,
        employee_signature_url,
        status,
        created_at,
        company:company_profiles (
          id,
          company_name,
          legal_name,
          rfc,
          fiscal_address,
          legal_rep_name
        )
      `)
      .eq("candidate_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  interface EmbeddedCompanyProfile {
    id: string;
    company_name: string | null;
    logo_url: string | null;
    contact_phone: string | null;
  }

  interface DBApplication {
    id: string;
    status: string;
    applied_at: string | null;
    created_at?: string | null;
    vacancy_id?: string;
    interview_details?: {
      date?: string;
      time?: string;
      modality?: "presencial" | "virtual";
      locationOrLink?: string;
      notes?: string;
      scheduledAt?: string | null;
      status?: "pending" | "confirmed" | "rescheduled" | "reschedule_requested" | "cancelled" | "completed" | null;
      candidateResponseNotes?: string | null;
      proposedDate?: string | null;
      proposedTime?: string | null;
    } | null;
    scheduled_interview_at?: string | null;
    interview_status?: string | null;
    hired_at?: string | null;
    vacancy: {
      id: string;
      title: string;
      location: string | null;
      modality: string;
      skills: string[] | null;
      salary_min: number | null;
      salary_max: number | null;
      created_at: string;
      company_id: string;
      company?: EmbeddedCompanyProfile | EmbeddedCompanyProfile[] | null;
    } | null;
  }

  const typedApplications = (dbApplications as unknown as DBApplication[]) || []

  interface DBContractCompany {
    id: string;
    company_name: string | null;
    legal_name: string | null;
    rfc: string | null;
    fiscal_address: string | null;
    legal_rep_name: string | null;
  }

  interface DBContract {
    id: string;
    folio: string;
    company_id: string;
    candidate_id: string;
    employee_id: string | null;
    application_id: string | null;
    job_title: string;
    department: string;
    contract_type: string;
    template_type: string;
    start_date: string;
    end_date: string | null;
    salary: number;
    payment_frequency: string;
    company_signed: boolean;
    company_signature_url: string | null;
    employee_signed: boolean;
    employee_signature_url: string | null;
    status: string;
    created_at: string;
    company: DBContractCompany | DBContractCompany[] | null;
  }

  // 4. Map contracts by application_id and company_id
  const contractsByAppId: Record<string, CandidateContractSummary> = {};
  const contractsByCompanyId: Record<string, CandidateContractSummary> = {};

  const typedContracts = (dbContracts as unknown as DBContract[]) || [];

  typedContracts.forEach((c) => {
    const comp = Array.isArray(c.company) ? c.company[0] : c.company;
    const summary: CandidateContractSummary = {
      id: c.id,
      folio: c.folio,
      jobTitle: c.job_title,
      department: c.department,
      contractType: c.contract_type,
      templateType: c.template_type,
      startDate: c.start_date,
      endDate: c.end_date || null,
      salary: Number(c.salary) || 0,
      paymentFrequency: c.payment_frequency || "quincenal",
      companySigned: Boolean(c.company_signed),
      companySignatureUrl: c.company_signature_url || null,
      employeeSigned: Boolean(c.employee_signed),
      employeeSignatureUrl: c.employee_signature_url || null,
      status: c.status || "vigente",
      companyName: comp?.company_name || comp?.legal_name || "Empresa Contratante",
      companyRfc: comp?.rfc || null,
      companyAddress: comp?.fiscal_address || null,
      companyLegalRep: comp?.legal_rep_name || null,
    };

    if (c.application_id) {
      contractsByAppId[c.application_id] = summary;
    }
    if (c.company_id && !contractsByCompanyId[c.company_id]) {
      contractsByCompanyId[c.company_id] = summary;
    }
  });

  const pendingContractsCount = typedContracts.filter(
    (c) => !c.employee_signed && c.status !== "cancelado"
  ).length;

  // 4b. Check for active employment (Employee Self-Service Portal)
  let activeEmployment: ActiveEmploymentData | null = null;

  interface DBEmployeeCompany {
    id: string;
    company_name: string | null;
    legal_name: string | null;
    logo_url: string | null;
    rfc: string | null;
    fiscal_address: string | null;
    contact_phone: string | null;
  }

  interface DBEmployeeWithCompany {
    id: string;
    company_id: string;
    employee_id: string | null;
    job_title: string;
    department: string | null;
    employee_code: string | null;
    status: string;
    hire_date: string | null;
    work_schedule: string | null;
    payment_frequency: string | null;
    base_salary_monthly: number | null;
    company?: DBEmployeeCompany | DBEmployeeCompany[] | null;
  }

  const { data: rawEmployees } = await supabase
    .from("company_employees")
    .select(`
      id,
      company_id,
      employee_id,
      job_title,
      department,
      employee_code,
      status,
      hire_date,
      work_schedule,
      payment_frequency,
      base_salary_monthly,
      company:company_profiles (
        id,
        company_name,
        legal_name,
        logo_url,
        rfc,
        fiscal_address,
        contact_phone
      )
    `)
    .eq("employee_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  const activeEmployees = (rawEmployees as unknown as DBEmployeeWithCompany[]) || [];
  let currentEmployee: DBEmployeeWithCompany | null = activeEmployees.length > 0 ? activeEmployees[0] : null;

  // Fallback: If not found directly by employee_id, check if linked via an active contract with employee_id
  if (!currentEmployee && typedContracts.length > 0) {
    const activeContract = typedContracts.find(
      (c) => c.status === "vigente" && c.employee_id
    );
    if (activeContract?.employee_id) {
      const { data: empByContract } = await supabase
        .from("company_employees")
        .select(`
          id,
          company_id,
          employee_id,
          job_title,
          department,
          employee_code,
          status,
          hire_date,
          work_schedule,
          payment_frequency,
          base_salary_monthly,
          company:company_profiles (
            id,
            company_name,
            legal_name,
            logo_url,
            rfc,
            fiscal_address,
            contact_phone
          )
        `)
        .eq("id", activeContract.employee_id)
        .maybeSingle();

      const typedEmp = empByContract as unknown as DBEmployeeWithCompany | null;
      if (typedEmp && typedEmp.status === "active") {
        currentEmployee = typedEmp;
      }
    }
  }

  if (currentEmployee) {
    const comp = Array.isArray(currentEmployee.company)
      ? currentEmployee.company[0]
      : currentEmployee.company;

    const hireDate = currentEmployee.hire_date || new Date().toISOString().split("T")[0];
    const lft = calculateLFTVacationDays(hireDate);

    // Fetch approved vacation leaves and today's attendance in parallel
    const todayStr = new Date().toISOString().split("T")[0];

    const [{ data: vacationLeaves }, { data: todayAttendanceRow }] = await Promise.all([
      supabase
        .from("company_leaves")
        .select("total_working_days")
        .eq("employee_id", currentEmployee.id)
        .eq("request_type", "vacaciones")
        .eq("status", "aprobada"),
      supabase
        .from("company_attendance")
        .select("check_in_time, check_out_time, status, delay_minutes")
        .eq("employee_id", currentEmployee.id)
        .eq("work_date", todayStr)
        .maybeSingle(),
    ]);

    interface VacationLeaveRow {
      total_working_days: number | null;
    }
    const typedVacationLeaves = (vacationLeaves as unknown as VacationLeaveRow[]) || [];
    const vacationDaysTaken = typedVacationLeaves.reduce(
      (sum, item) => sum + (item.total_working_days || 0),
      0
    );
    const vacationDaysAvailable = Math.max(0, lft.currentYearEntitlement - vacationDaysTaken);

    // Find active contract for this employee
    const matchedContract = typedContracts.find(
      (c) =>
        c.employee_id === currentEmployee?.id ||
        (c.company_id === currentEmployee?.company_id && c.status === "vigente")
    );

    interface AttendanceRow {
      check_in_time: string | null;
      check_out_time: string | null;
      status: string;
      delay_minutes: number | null;
    }
    const typedAttendance = todayAttendanceRow as unknown as AttendanceRow | null;

    activeEmployment = {
      id: currentEmployee.id,
      companyId: currentEmployee.company_id,
      companyName: comp?.company_name || comp?.legal_name || "Mi Empresa",
      companyLogoUrl: comp?.logo_url || null,
      companyRfc: comp?.rfc || null,
      companyAddress: comp?.fiscal_address || null,
      companyPhone: comp?.contact_phone || null,
      jobTitle: currentEmployee.job_title || "Empleado",
      department: currentEmployee.department || null,
      hireDate: currentEmployee.hire_date || null,
      employeeCode: currentEmployee.employee_code || null,
      workSchedule: currentEmployee.work_schedule || null,
      paymentFrequency: currentEmployee.payment_frequency || "quincenal",
      baseSalaryMonthly: currentEmployee.base_salary_monthly
        ? Number(currentEmployee.base_salary_monthly)
        : matchedContract?.salary || null,
      seniorityFormatted: lft.formattedSeniority,
      vacationDaysTotal: lft.currentYearEntitlement,
      vacationDaysTaken,
      vacationDaysAvailable,
      contract: matchedContract
        ? {
            id: matchedContract.id,
            folio: matchedContract.folio,
            status: matchedContract.status,
            contractType: matchedContract.contract_type,
            isPendingSignature: !matchedContract.employee_signed && matchedContract.status !== "cancelado",
          }
        : null,
      todayAttendance: typedAttendance
        ? {
            hasCheckedIn: !!typedAttendance.check_in_time,
            hasCheckedOut: !!typedAttendance.check_out_time,
            checkInTime: typedAttendance.check_in_time,
            checkOutTime: typedAttendance.check_out_time,
            status: typedAttendance.status,
            delayMinutes: typedAttendance.delay_minutes || 0,
          }
        : null,
      forcePasswordChange: Boolean(user.user_metadata?.force_password_change),
    };
  }

  interface RawVacancyWithCompany {
    id: string;
    title: string;
    location: string | null;
    modality: string;
    employment_type: string | null;
    salary_min: number | null;
    salary_max: number | null;
    payment_frequency?: string | null;
    is_promoted: boolean | null;
    is_featured?: boolean | null;
    category: string | null;
    company_id: string;
    created_at: string;
    status: string | null;
    is_active: boolean | null;
    zone: string | null;
    skills: string[] | null;
    company?: EmbeddedCompanyProfile | EmbeddedCompanyProfile[] | null;
  }

  // 5. Fetch ALL active vacancies with embedded company profile directly
  const { data: rawVacancies, error: vacErr } = await supabase
    .from("vacancies")
    .select(`
      id,
      title,
      location,
      modality,
      employment_type,
      salary_min,
      salary_max,
      payment_frequency,
      is_promoted,
      category,
      company_id,
      created_at,
      status,
      is_active,
      zone,
      skills,
      company:company_profiles (
        id,
        company_name,
        logo_url,
        contact_phone
      )
    `)
    .or("is_active.eq.true,status.eq.Activa,status.eq.activa,status.eq.published,status.eq.Publicada")
    .order("created_at", { ascending: false });

  if (vacErr) {
    console.error("[getCandidateDashboardData] Error fetching vacancies:", vacErr.message || vacErr);
  }

  const allActiveVacancies: RawVacancyWithCompany[] = (rawVacancies as unknown as RawVacancyWithCompany[]) || [];

  // 6. Format applications directly using embedded company profile from vacancy
  const formattedApplications: CandidateApplication[] = typedApplications.map((app) => {
    const vacancy = app.vacancy;
    const comp = Array.isArray(vacancy?.company) ? vacancy?.company[0] : vacancy?.company;
    const companyName = comp?.company_name || "Empresa";
    const logoUrl = comp?.logo_url || null;
    const companyPhone = comp?.contact_phone || null;
    const companyInitials = companyName.substring(0, 2).toUpperCase();

    const matchedContract = 
      contractsByAppId[app.id] || 
      (app.status === "Contratado" && vacancy?.company_id ? contractsByCompanyId[vacancy.company_id] : null) ||
      null;

    let statusLabel = app.status
    let statusColor = "text-muted-foreground bg-muted/60 border-border/70"
    let progress = 25

    switch (app.status) {
      case "Pendiente":
        statusLabel = "Pendiente"
        statusColor = "text-muted-foreground bg-muted/60 border-border/70"
        progress = 25
        break
      case "En revisión":
        statusLabel = "En Revisión"
        statusColor = "text-foreground bg-muted border-border"
        progress = 50
        break
      case "Preseleccionado":
      case "Entrevista":
        statusLabel = app.status === "Entrevista" ? "En Entrevista" : "Preseleccionado"
        statusColor = "text-primary bg-primary/10 border-primary/20"
        progress = 75
        break
      case "Contratado":
        statusLabel = "Contratado"
        statusColor = "text-primary bg-primary/10 border-primary/20"
        progress = 100
        break
      case "Descartado":
        statusLabel = "Descartado"
        statusColor = "text-destructive bg-destructive/10 border-destructive/20"
        progress = 100
        break
    }

    const rawDetails = app.interview_details;
    const interviewStatus = app.interview_status || rawDetails?.status || (rawDetails ? "pending" : null);

    let interviewDetails: CandidateInterviewDetails | null = null;
    if (rawDetails || app.scheduled_interview_at) {
      let dateStr = rawDetails?.date || "";
      let timeStr = rawDetails?.time || "";
      if (!dateStr && app.scheduled_interview_at) {
        try {
          const d = new Date(app.scheduled_interview_at);
          dateStr = d.toISOString().split("T")[0];
          timeStr = d.toTimeString().slice(0, 5);
        } catch {
          dateStr = "";
        }
      }

      interviewDetails = {
        date: dateStr,
        time: timeStr,
        modality: rawDetails?.modality || "virtual",
        locationOrLink: rawDetails?.locationOrLink || (rawDetails?.modality === "presencial" ? "Oficinas de la empresa" : "Google Meet"),
        notes: rawDetails?.notes || "",
        scheduledAt: rawDetails?.scheduledAt || app.scheduled_interview_at || null,
        status: (interviewStatus as CandidateInterviewDetails["status"]) ?? "pending",
        candidateResponseNotes: rawDetails?.candidateResponseNotes || null,
        proposedDate: rawDetails?.proposedDate || null,
        proposedTime: rawDetails?.proposedTime || null,
        scheduledInterviewAt: app.scheduled_interview_at || null,
        interviewStatus,
      };
    }

    const appDateStr = app.applied_at || app.created_at
    const appliedDate = appDateStr
      ? new Date(appDateStr).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      : "Reciente"

    return {
      id: app.id,
      vacancy_id: vacancy?.id || app.vacancy_id || "",
      position: vacancy?.title || "Posición",
      location: vacancy?.location || vacancy?.modality || "Remoto",
      company: companyName,
      companyInitials,
      logoUrl,
      status: app.status,
      statusLabel,
      statusColor,
      progress,
      appliedDate,
      created_at: appDateStr || new Date().toISOString(),
      salary_min: vacancy?.salary_min ?? null,
      salary_max: vacancy?.salary_max ?? null,
      companyPhone,
      interviewDetails,
      contract: matchedContract,
    }
  })

  const total = formattedApplications.length
  const reviewing = formattedApplications.filter(
    (app) => app.status === "En revisión" || app.status === "Preseleccionado"
  ).length
  const hired = formattedApplications.filter((app) => app.status === "Contratado").length

  // 7. Sort vacancies by real geographic proximity and city match
  const candidateLocation = profileData?.location || "";
  const parsedCandidateLoc = parseLocation(candidateLocation);
  const candidateCity = cleanCityName(parsedCandidateLoc.city);
  const candidateCoords =
    getCoordsForZone(candidateLocation) ||
    getCoordsForZone(parsedCandidateLoc.zone) ||
    (GEO_CONFIG[candidateCity]?.coords ?? null);

  // Helper formatter for vacancy items
  const formatVacancyItem = (vac: RawVacancyWithCompany): VacancyItem => {
    const comp = Array.isArray(vac.company) ? vac.company[0] : vac.company;
    const compName = comp?.company_name || "Empresa";
    const compLogo = comp?.logo_url || null;

    let formattedSalary = ""
    const min = Number(vac.salary_min)
    const max = Number(vac.salary_max)
    if (min && max) {
      formattedSalary = `$${min.toLocaleString()} - $${max.toLocaleString()} MXN`
    } else if (min) {
      formattedSalary = `Desde $${min.toLocaleString()} MXN`
    } else if (max) {
      formattedSalary = `Hasta $${max.toLocaleString()} MXN`
    } else {
      formattedSalary = "Sueldo no especificado"
    }

    const cleanCity = cleanCityName(vac.location || "");
    const displayLocation = vac.zone && cleanCity
      ? `${vac.zone}, ${cleanCity}`
      : vac.location || vac.zone || vac.modality || "Ubicación no especificada";

    let distanceBadge: string | null = null;
    let distanceKm: number | null = null;

    if (candidateCoords) {
      const vacCoords =
        getCoordsForZone(`${cleanCity} - ${vac.zone || ""}`) ||
        getCoordsForZone(vac.zone) ||
        getCoordsForZone(cleanCity) ||
        (GEO_CONFIG[cleanCity]?.coords ?? null);

      if (vacCoords) {
        distanceKm = haversineDistanceKm(candidateCoords.lat, candidateCoords.lng, vacCoords.lat, vacCoords.lng);
        if (distanceKm < 1.5) {
          distanceBadge = "< 1.5 km (Misma zona)";
        } else if (distanceKm < 10) {
          distanceBadge = `${distanceKm.toFixed(1)} km cerca`;
        } else if (distanceKm < 35) {
          distanceBadge = `${distanceKm.toFixed(0)} km (${cleanCity})`;
        } else {
          distanceBadge = `${distanceKm.toFixed(0)} km`;
        }
      }
    } else if (candidateCity && cleanCity.toLowerCase() === candidateCity.toLowerCase()) {
      distanceBadge = `En tu ciudad (${cleanCity})`;
    }

    return {
      id: vac.id,
      title: vac.title,
      companyName: compName,
      companyLogo: compLogo,
      location: displayLocation,
      zone: vac.zone || "",
      city: cleanCity,
      employmentType: vac.employment_type || vac.modality || "Tiempo Completo",
      formattedSalary,
      isFeatured: !!(vac.is_promoted || vac.is_featured),
      category: vac.category || "General",
      createdAt: vac.created_at,
      distanceKm,
      distanceBadge,
      salary_min: min || null,
      salary_max: max || null,
      paymentFrequency: vac.payment_frequency || "quincenal",
      modality: vac.modality || "Presencial",
      skills: vac.skills || []
    }
  }


  // Featured vacancies (promoted or top vacancies)
  const promotedList = allActiveVacancies.filter((v: RawVacancyWithCompany) => v.is_promoted || v.is_featured);
  const featuredDb = promotedList.length > 0 ? promotedList : allActiveVacancies.slice(0, 4);

  // Nearby vacancies: sorted accurately using Haversine distance and city match
  const sortedNearbyDb = [...allActiveVacancies].sort((a: RawVacancyWithCompany, b: RawVacancyWithCompany) => {
    // 1. If candidate has known GPS / Zone coordinates, calculate true Haversine distance
    if (candidateCoords) {
      const cityA = cleanCityName(a.location || "");
      const cityB = cleanCityName(b.location || "");

      const coordsA =
        getCoordsForZone(`${cityA} - ${a.zone || ""}`) ||
        getCoordsForZone(a.zone) ||
        getCoordsForZone(cityA) ||
        (GEO_CONFIG[cityA]?.coords ?? null);

      const coordsB =
        getCoordsForZone(`${cityB} - ${b.zone || ""}`) ||
        getCoordsForZone(b.zone) ||
        getCoordsForZone(cityB) ||
        (GEO_CONFIG[cityB]?.coords ?? null);

      if (coordsA && coordsB) {
        const distA = haversineDistanceKm(candidateCoords.lat, candidateCoords.lng, coordsA.lat, coordsA.lng);
        const distB = haversineDistanceKm(candidateCoords.lat, candidateCoords.lng, coordsB.lat, coordsB.lng);
        if (Math.abs(distA - distB) > 0.2) {
          return distA - distB;
        }
      } else if (coordsA && !coordsB) {
        return -1;
      } else if (!coordsA && coordsB) {
        return 1;
      }
    }

    // 2. City-level match fallback
    if (candidateCity) {
      const cityA = cleanCityName(a.location || "");
      const cityB = cleanCityName(b.location || "");
      const matchA = cityA.toLowerCase() === candidateCity.toLowerCase();
      const matchB = cityB.toLowerCase() === candidateCity.toLowerCase();
      if (matchA && !matchB) return -1;
      if (!matchA && matchB) return 1;
    }

    // 3. Keep newer vacancies first
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const featuredVacancies = featuredDb.map(formatVacancyItem);
  const nearbyVacancies = sortedNearbyDb.map(formatVacancyItem);

  return {
    profile: profileData
      ? {
          id: profileData.id,
          full_name: profileData.full_name,
          headline: profileData.headline || null,
          experience_summary: profileData.experience_summary || null,
          location: profileData.location || null,
          skills: profileData.skills || null,
          avatar_url: profileData.avatar_url || null,
          is_approved: profileData.is_approved || false,
          is_validated: profileData.is_validated || false,
          completionScore
        }
      : null,
    applications: formattedApplications,
    stats: {
      total,
      reviewing,
      hired,
      pendingContracts: pendingContractsCount
    },
    featuredVacancies,
    nearbyVacancies,
    pendingContractsCount,
    activeEmployment,
    forcePasswordChange: Boolean(user.user_metadata?.force_password_change),
  }
}
