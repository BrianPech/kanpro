import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CompanyEmployeesView } from "@/modules/company/components/company-employees-view";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";

export const metadata = {
  title: "Plantilla de Empleados | K'anPro",
  description: "Gestión operativa, estatus laboral y expedientes del personal de la empresa.",
};

export default async function CompanyEmployeesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { activeCompanyId } = await getDashboardSession();
  const targetCompanyId = activeCompanyId || user.id;

  // 1. Fetch direct company employees from public.company_employees
  const { data: directEmployees, error: directError } = await supabase
    .from("company_employees")
    .select(`
      id,
      company_id,
      employee_id,
      full_name,
      job_title,
      department,
      employee_code,
      phone,
      email,
      avatar_url,
      base_salary_monthly,
      payment_frequency,
      work_schedule,
      rfc,
      curp,
      nss,
      notes,
      status,
      hire_date,
      termination_reason,
      termination_date,
      created_at
    `)
    .eq("company_id", targetCompanyId)
    .order("created_at", { ascending: false });

  if (directError) {
    console.error("[CompanyEmployeesPage] Error loading direct employees:", directError);
  }

  // 2. Fetch legacy hired applications to merge if needed
  const { data: userVacs } = await supabase
    .from("vacancies")
    .select("id")
    .or(`company_id.eq.${targetCompanyId},recruiter_id.eq.${targetCompanyId}`);

  const vacIds = (userVacs || []).map((v) => v.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawApplications: any[] = [];
  if (vacIds.length > 0) {
    const { data: apps } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        notes,
        applied_at,
        vacancies (
          id,
          title,
          category,
          location,
          zone
        ),
        candidate_profiles (
          id,
          skills,
          profiles (
            id,
            full_name,
            location,
            avatar_url,
            whatsapp_number
          )
        )
      `)
      .in("vacancy_id", vacIds)
      .in("status", ["Contratado", "hired", "accepted", "Baja", "Finalizado"])
      .order("applied_at", { ascending: false });

    rawApplications = apps || [];
  }

  // 3. Map direct employees
  const directMapped = (directEmployees || []).map((emp) => {
    return {
      id: emp.id,
      candidate_id: emp.employee_id || emp.id,
      full_name: emp.full_name || "Empleado",
      phone: emp.phone || "",
      avatar_url: emp.avatar_url || null,
      location: emp.department || "",
      vacancy_title: emp.job_title || "",
      vacancy_category: emp.department || "",
      hired_date: emp.hire_date || emp.created_at || new Date().toISOString(),
      notes: emp.notes || (emp.termination_reason ? `Motivo de baja: ${emp.termination_reason}` : ""),
      status: (emp.status === "terminated" ? "Baja" : "Contratado") as "Contratado" | "Baja",
      base_salary_monthly: emp.base_salary_monthly,
      payment_frequency: emp.payment_frequency,
      employee_code: emp.employee_code,
      department: emp.department,
      job_title: emp.job_title,
      rfc: emp.rfc,
      curp: emp.curp,
      nss: emp.nss,
      work_schedule: emp.work_schedule,
      email: emp.email,
    };
  });

  // 4. Map legacy applications
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacyMapped = rawApplications.map((app: any) => {
    const candidateObj = app.candidate_profiles || app.candidate;
    const candidateProfile = Array.isArray(candidateObj)
      ? candidateObj[0]
      : candidateObj || {};

    const baseProfileObj = candidateProfile?.profiles;
    const candProfile = Array.isArray(baseProfileObj)
      ? baseProfileObj[0]
      : baseProfileObj || {};

    const vacancyObj = app.vacancies || app.vacancy;
    const vacancyData = Array.isArray(vacancyObj)
      ? vacancyObj[0]
      : vacancyObj || {};

    return {
      id: app.id,
      candidate_id: candidateProfile?.id || app.id,
      full_name: candProfile.full_name || "Candidato Contratado",
      phone: candProfile.whatsapp_number || candProfile.phone || "",
      avatar_url: candProfile.avatar_url || null,
      location: candProfile.location || vacancyData.location || "Riviera Maya",
      vacancy_title: vacancyData.title || "Puesto General",
      vacancy_category: vacancyData.category || "General",
      hired_date: app.applied_at || new Date().toISOString(),
      notes: app.notes || "",
      status: (app.status === "Baja" || app.status === "Finalizado"
        ? "Baja"
        : "Contratado") as "Contratado" | "Baja",
    };
  });

  // Combine direct and legacy, avoiding duplicate IDs
  const seenIds = new Set<string>();
  const combinedEmployees = [...directMapped, ...legacyMapped].filter((e) => {
    if (seenIds.has(e.id)) return false;
    seenIds.add(e.id);
    return true;
  });

  // 5. Fetch employee invitations for company
  const { data: rawInvitations } = await supabase
    .from("employee_invitations")
    .select(`
      id,
      company_id,
      employee_id,
      email,
      full_name,
      position,
      salary,
      hire_date,
      contract_type,
      status,
      expires_at,
      accepted_at,
      created_at
    `)
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  const invitations = (rawInvitations || []).map((inv) => {
    const now = new Date();
    let currentStatus = inv.status;
    if (currentStatus === "sent" || currentStatus === "pending") {
      if (new Date(inv.expires_at) < now) {
        currentStatus = "expired";
      }
    }
    return {
      ...inv,
      status: currentStatus,
    };
  });

  // 6. Fetch company registered departments/areas
  const { data: rawDepartments } = await supabase
    .from("company_departments")
    .select("id, name, color")
    .eq("company_id", targetCompanyId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  const companyDepartments = (rawDepartments || []).map((d) => ({
    id: d.id,
    name: d.name,
    color: d.color,
  }));

  return (
    <CompanyEmployeesView
      userId={targetCompanyId}
      initialEmployees={combinedEmployees}
      initialInvitations={invitations}
      companyDepartments={companyDepartments}
    />
  );
}
