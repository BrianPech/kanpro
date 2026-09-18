import { createClient } from "@/lib/supabase/server";
import { EmployeeEvaluation } from "../types/evaluations";

export interface EmployeeSelectOption {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  avatarUrl?: string | null;
}

export interface CompanyEvaluationsData {
  evaluations: EmployeeEvaluation[];
  employees: EmployeeSelectOption[];
  companyName: string;
}

export async function getCompanyEvaluationsData(): Promise<CompanyEvaluationsData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      evaluations: [],
      employees: [],
      companyName: "K'anPro",
    };
  }

  const [companyRes, evaluationsRes, employeesRes] = await Promise.all([
    supabase
      .from("company_profiles")
      .select("company_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("company_evaluations")
      .select(`
        id,
        employee_id,
        employee_name,
        job_title,
        department,
        avatar_url,
        period,
        evaluation_date,
        evaluator_name,
        evaluator_role,
        punctuality_score,
        attendance_score,
        productivity_score,
        teamwork_score,
        customer_service_score,
        goals_score,
        average_score,
        strengths,
        growth_areas,
        development_plan,
        goals_achieved,
        comments,
        status,
        company_employees (
          id,
          full_name,
          job_title,
          department,
          avatar_url
        )
      `)
      .eq("company_id", user.id)
      .order("evaluation_date", { ascending: false }),
    supabase
      .from("company_employees")
      .select("id, full_name, job_title, department, avatar_url, status")
      .eq("company_id", user.id)
      .order("full_name", { ascending: true }),
  ]);

  const companyName = companyRes.data?.company_name || "Mi Empresa";

  // Map employee options for the modal selector
  const rawEmployees = employeesRes.data || [];
  const employees: EmployeeSelectOption[] = rawEmployees.map((emp) => ({
    id: emp.id,
    name: emp.full_name,
    jobTitle: emp.job_title || "Colaborador",
    department: emp.department || "Operaciones",
    avatarUrl: emp.avatar_url,
  }));

  // Map database evaluations to EmployeeEvaluation interface
  const rawEvaluations = evaluationsRes.data || [];
  const evaluations: EmployeeEvaluation[] = rawEvaluations.map((ev: any) => {
    const linkedEmp = Array.isArray(ev.company_employees)
      ? ev.company_employees[0]
      : ev.company_employees;

    const parseStringArray = (val: any): string[] => {
      if (Array.isArray(val)) return val.map(String);
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed.map(String) : [val];
        } catch {
          return val.split(".").map((s) => s.trim()).filter(Boolean);
        }
      }
      return [];
    };

    return {
      id: ev.id,
      employeeId: ev.employee_id || linkedEmp?.id || ev.id,
      employeeName: ev.employee_name || linkedEmp?.full_name || "Colaborador",
      avatarUrl: ev.avatar_url || linkedEmp?.avatar_url || null,
      jobTitle: ev.job_title || linkedEmp?.job_title || "Puesto General",
      department: ev.department || linkedEmp?.department || "Operaciones",
      period: ev.period,
      evaluationDate: ev.evaluation_date,
      evaluatorName: ev.evaluator_name,
      evaluatorRole: ev.evaluator_role || "Evaluador Directo",
      punctualityScore: Number(ev.punctuality_score) || 5,
      attendanceScore: Number(ev.attendance_score) || 5,
      productivityScore: Number(ev.productivity_score) || 5,
      teamworkScore: Number(ev.teamwork_score) || 5,
      customerServiceScore: Number(ev.customer_service_score) || 5,
      goalsScore: Number(ev.goals_score) || 5,
      averageScore: Number(ev.average_score) || 5.0,
      strengths: parseStringArray(ev.strengths),
      growthAreas: parseStringArray(ev.growth_areas),
      developmentPlan: ev.development_plan || "",
      goalsAchieved: ev.goals_achieved || "",
      comments: ev.comments || "",
      status: (ev.status as "completada" | "borrador") || "completada",
    };
  });

  return {
    evaluations,
    employees,
    companyName,
  };
}
