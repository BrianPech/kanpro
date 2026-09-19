import { createClient } from "@/lib/supabase/server";
import {
  EmployeeEvaluation,
  Nom035Survey,
  Nom035Metrics,
  Nom035RiskLevel,
} from "../types/evaluations";

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
  nom035Surveys: Nom035Survey[];
  nom035Metrics: Nom035Metrics;
  companyName: string;
}

export async function getCompanyEvaluationsData(): Promise<CompanyEvaluationsData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const defaultMetrics: Nom035Metrics = {
    totalSurveys: 0,
    averageTotalScore: 0,
    overallRiskLevel: "nulo",
    riskCounts: { nulo: 0, bajo: 0, medio: 0, alto: 0, muy_alto: 0 },
    dimensionAverages: {
      environment: 0,
      activityFactors: 0,
      timeOrganization: 0,
      leadershipRelations: 0,
      organizationalClimate: 0,
    },
  };

  if (!user) {
    return {
      evaluations: [],
      employees: [],
      nom035Surveys: [],
      nom035Metrics: defaultMetrics,
      companyName: "K'anPro",
    };
  }

  const [companyRes, evaluationsRes, employeesRes, nom035Res] = await Promise.all([
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
    supabase
      .from("company_nom035_surveys")
      .select("*")
      .eq("company_id", user.id)
      .order("survey_date", { ascending: false }),
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

  // Map NOM-035 surveys
  const rawNom035 = nom035Res.data || [];
  const nom035Surveys: Nom035Survey[] = rawNom035.map((s: any) => ({
    id: s.id,
    employeeId: s.employee_id,
    employeeName: s.employee_name || "Colaborador",
    jobTitle: s.job_title,
    department: s.department,
    guideType: s.guide_type,
    surveyDate: s.survey_date,
    environmentScore: Number(s.environment_score) || 0,
    activityFactorsScore: Number(s.activity_factors_score) || 0,
    timeOrganizationScore: Number(s.time_organization_score) || 0,
    leadershipRelationsScore: Number(s.leadership_relations_score) || 0,
    organizationalClimateScore: Number(s.organizational_climate_score) || 0,
    totalScore: Number(s.total_score) || 0,
    riskLevel: s.risk_level as Nom035RiskLevel,
    actionPlan: s.action_plan,
    status: (s.status as "borrador" | "completada") || "completada",
  }));

  // Calculate NOM-035 Metrics
  const totalSurveys = nom035Surveys.length;
  const sumTotal = nom035Surveys.reduce((acc, s) => acc + s.totalScore, 0);
  const avgTotal =
    totalSurveys > 0 ? Math.round((sumTotal / totalSurveys) * 10) / 10 : 0;

  let overallRiskLevel: Nom035RiskLevel = "nulo";
  if (avgTotal >= 90) overallRiskLevel = "muy_alto";
  else if (avgTotal >= 70) overallRiskLevel = "alto";
  else if (avgTotal >= 45) overallRiskLevel = "medio";
  else if (avgTotal >= 20) overallRiskLevel = "bajo";
  else overallRiskLevel = "nulo";

  const riskCounts: Record<Nom035RiskLevel, number> = {
    nulo: 0,
    bajo: 0,
    medio: 0,
    alto: 0,
    muy_alto: 0,
  };

  nom035Surveys.forEach((s) => {
    if (riskCounts[s.riskLevel] !== undefined) {
      riskCounts[s.riskLevel]++;
    }
  });

  const nom035Metrics: Nom035Metrics = {
    totalSurveys,
    averageTotalScore: avgTotal,
    overallRiskLevel,
    riskCounts,
    dimensionAverages: {
      environment:
        totalSurveys > 0
          ? Math.round(
              (nom035Surveys.reduce((a, s) => a + s.environmentScore, 0) /
                totalSurveys) *
                10
            ) / 10
          : 0,
      activityFactors:
        totalSurveys > 0
          ? Math.round(
              (nom035Surveys.reduce((a, s) => a + s.activityFactorsScore, 0) /
                totalSurveys) *
                10
            ) / 10
          : 0,
      timeOrganization:
        totalSurveys > 0
          ? Math.round(
              (nom035Surveys.reduce((a, s) => a + s.timeOrganizationScore, 0) /
                totalSurveys) *
                10
            ) / 10
          : 0,
      leadershipRelations:
        totalSurveys > 0
          ? Math.round(
              (nom035Surveys.reduce(
                (a, s) => a + s.leadershipRelationsScore,
                0
              ) /
                totalSurveys) *
                10
            ) / 10
          : 0,
      organizationalClimate:
        totalSurveys > 0
          ? Math.round(
              (nom035Surveys.reduce(
                (a, s) => a + s.organizationalClimateScore,
                0
              ) /
                totalSurveys) *
                10
            ) / 10
          : 0,
    },
  };

  return {
    evaluations,
    employees,
    nom035Surveys,
    nom035Metrics,
    companyName,
  };
}
