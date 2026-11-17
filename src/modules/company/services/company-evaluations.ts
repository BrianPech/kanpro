import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getMexicoDateISO } from "@/lib/formatters";
import {
  EmployeeEvaluation,
  Nom035Survey,
  Nom035Metrics,
  Nom035RiskLevel,
  EvaluatorRelation,
  calculateNineBoxQuadrant,
} from "../types/evaluations";
import { Nom035Engine } from "../utils/nom035-engine";
import type {
  CreateEvaluationInput,
  CreateNom035SurveyInput,
} from "../schemas/evaluations.schema";

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

export type EvaluationRow = Database["public"]["Tables"]["company_evaluations"]["Row"];
export type EvaluationInsert = Database["public"]["Tables"]["company_evaluations"]["Insert"];
export type Nom035SurveyRow = Database["public"]["Tables"]["company_nom035_surveys"]["Row"];
export type Nom035SurveyInsert = Database["public"]["Tables"]["company_nom035_surveys"]["Insert"];

export class CompanyEvaluationsService {
  /**
   * Registra una evaluación de desempeño 360 calculando el promedio exacto.
   */
  public static async createEvaluation(
    supabase: SupabaseClient<Database>,
    companyId: string,
    input: CreateEvaluationInput
  ): Promise<{ evaluationId: string; averageScore: number }> {
    const scores = [
      input.punctualityScore,
      input.attendanceScore,
      input.productivityScore,
      input.teamworkScore,
      input.customerServiceScore,
      input.goalsScore,
    ];

    const sum = scores.reduce(
      (acc, score) => acc + Math.max(1, Math.min(5, Number(score) || 5)),
      0
    );
    const averageScore = Math.round((sum / scores.length) * 10) / 10;
    const potentialScore = Math.max(1, Math.min(5, Number(input.potentialScore) || 3.5));
    const evaluatorRelation = input.evaluatorRelation || "jefe_directo";
    const nineBoxQuadrant = calculateNineBoxQuadrant(averageScore, potentialScore);
    const evaluationDate = input.evaluationDate || getMexicoDateISO();

    const payload: EvaluationInsert = {
      company_id: companyId,
      employee_id: input.employeeId || null,
      evaluator_id: companyId,
      employee_name: input.employeeName.trim(),
      job_title: input.jobTitle?.trim() || null,
      department: input.department?.trim() || null,
      avatar_url: input.avatarUrl || null,
      period: input.period.trim() || "Evaluación de Desempeño 360",
      evaluation_date: evaluationDate,
      evaluator_name: input.evaluatorName.trim() || "Evaluador Directo",
      evaluator_role: input.evaluatorRole?.trim() || "Dirección / RRHH",
      evaluator_relation: evaluatorRelation,
      potential_score: potentialScore,
      nine_box_quadrant: nineBoxQuadrant,
      punctuality_score: Math.max(1, Math.min(5, Number(input.punctualityScore) || 5)),
      attendance_score: Math.max(1, Math.min(5, Number(input.attendanceScore) || 5)),
      productivity_score: Math.max(1, Math.min(5, Number(input.productivityScore) || 5)),
      teamwork_score: Math.max(1, Math.min(5, Number(input.teamworkScore) || 5)),
      customer_service_score: Math.max(
        1,
        Math.min(5, Number(input.customerServiceScore) || 5)
      ),
      goals_score: Math.max(1, Math.min(5, Number(input.goalsScore) || 5)),
      average_score: averageScore,
      strengths: input.strengths || [],
      growth_areas: input.growthAreas || [],
      development_plan: input.developmentPlan?.trim() || null,
      goals_achieved: input.goalsAchieved?.trim() || null,
      comments: input.comments?.trim() || null,
      status: input.status || "completada",
    };

    const { data, error } = await supabase
      .from("company_evaluations")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "No se pudo registrar la evaluación de desempeño.");
    }

    return { evaluationId: data.id, averageScore };
  }

  /**
   * Elimina una evaluación garantizando multitenancy.
   */
  public static async deleteEvaluation(
    supabase: SupabaseClient<Database>,
    companyId: string,
    evaluationId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("company_evaluations")
      .delete()
      .eq("id", evaluationId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error(error.message || "No se pudo eliminar la evaluación.");
    }
  }

  /**
   * Registra una evaluación de clima y factores psicosociales NOM-035 integrando Nom035Engine.
   */
  public static async createNom035Survey(
    supabase: SupabaseClient<Database>,
    companyId: string,
    input: CreateNom035SurveyInput
  ): Promise<{ surveyId: string; totalScore: number; riskLevel: Nom035RiskLevel }> {
    const engine = new Nom035Engine(
      {
        environmentScore: input.environmentScore,
        activityFactorsScore: input.activityFactorsScore,
        timeOrganizationScore: input.timeOrganizationScore,
        leadershipRelationsScore: input.leadershipRelationsScore,
        organizationalClimateScore: input.organizationalClimateScore,
      },
      input.guideType
    );

    const totalScore = engine.getTotalScore();
    const riskLevel = engine.getRiskLevel();
    const actionPlan = input.actionPlan?.trim() || engine.getActionPlan();
    const surveyDate = input.surveyDate || getMexicoDateISO();

    const payload: Nom035SurveyInsert = {
      company_id: companyId,
      employee_id: input.employeeId || null,
      employee_name: input.employeeName.trim(),
      job_title: input.jobTitle?.trim() || null,
      department: input.department?.trim() || null,
      guide_type: input.guideType || "guia_ii",
      survey_date: surveyDate,
      environment_score: input.environmentScore,
      activity_factors_score: input.activityFactorsScore,
      time_organization_score: input.timeOrganizationScore,
      leadership_relations_score: input.leadershipRelationsScore,
      organizational_climate_score: input.organizationalClimateScore,
      total_score: totalScore,
      risk_level: riskLevel,
      action_plan: actionPlan,
      status: input.status || "completada",
    };

    const { data, error } = await supabase
      .from("company_nom035_surveys")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "No se pudo registrar la encuesta NOM-035.");
    }

    return { surveyId: data.id, totalScore, riskLevel };
  }

  /**
   * Elimina una encuesta NOM-035 garantizando multitenancy.
   */
  public static async deleteNom035Survey(
    supabase: SupabaseClient<Database>,
    companyId: string,
    surveyId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("company_nom035_surveys")
      .delete()
      .eq("id", surveyId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error(error.message || "No se pudo eliminar la encuesta NOM-035.");
    }
  }

  /**
   * Consulta y agrega todos los datos de desempeño y NOM-035 para el dashboard de la empresa.
   */
  public static async getCompanyEvaluationsData(
    supabase: SupabaseClient<Database>,
    companyId: string
  ): Promise<CompanyEvaluationsData> {
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

    if (!companyId) {
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
        .eq("id", companyId)
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
          evaluator_relation,
          potential_score,
          nine_box_quadrant,
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
        .eq("company_id", companyId)
        .order("evaluation_date", { ascending: false }),
      supabase
        .from("company_employees")
        .select("id, full_name, job_title, department, avatar_url, status")
        .eq("company_id", companyId)
        .order("full_name", { ascending: true }),
      supabase
        .from("company_nom035_surveys")
        .select("*")
        .eq("company_id", companyId)
        .order("survey_date", { ascending: false }),
    ]);

    const companyName = companyRes.data?.company_name || "Mi Empresa";

    // Mapeo de opciones de colaborador
    const rawEmployees = employeesRes.data || [];
    const employees: EmployeeSelectOption[] = rawEmployees.map((emp) => ({
      id: emp.id,
      name: emp.full_name,
      jobTitle: emp.job_title || "Colaborador",
      department: emp.department || "Operaciones",
      avatarUrl: emp.avatar_url,
    }));

    // Mapeo de evaluaciones de desempeño 360
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
        evaluatorRelation: (ev.evaluator_relation as EvaluatorRelation) || "jefe_directo",
        punctualityScore: Number(ev.punctuality_score) || 5,
        attendanceScore: Number(ev.attendance_score) || 5,
        productivityScore: Number(ev.productivity_score) || 5,
        teamworkScore: Number(ev.teamwork_score) || 5,
        customerServiceScore: Number(ev.customer_service_score) || 5,
        goalsScore: Number(ev.goals_score) || 5,
        averageScore: Number(ev.average_score) || 5.0,
        potentialScore: Number(ev.potential_score) || 3.5,
        nineBoxQuadrant:
          ev.nine_box_quadrant ||
          calculateNineBoxQuadrant(
            Number(ev.average_score) || 5.0,
            Number(ev.potential_score) || 3.5
          ),
        strengths: parseStringArray(ev.strengths),
        growthAreas: parseStringArray(ev.growth_areas),
        developmentPlan: ev.development_plan || "",
        goalsAchieved: ev.goals_achieved || "",
        comments: ev.comments || "",
        status: (ev.status as "completada" | "borrador") || "completada",
      };
    });

    // Mapeo de encuestas NOM-035
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

    // Métricas calculadas mediante Nom035Engine
    const nom035Metrics = Nom035Engine.calculateMetrics(nom035Surveys);

    return {
      evaluations,
      employees,
      nom035Surveys,
      nom035Metrics,
      companyName,
    };
  }
}

/**
 * Función desacoplada para Server Components (ahora recibe supabase y companyId).
 */
export async function getCompanyEvaluationsData(
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<CompanyEvaluationsData> {
  return CompanyEvaluationsService.getCompanyEvaluationsData(supabase, companyId);
}
