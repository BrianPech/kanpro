"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CreateEvaluationInput {
  employeeId?: string | null;
  employeeName: string;
  jobTitle?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  period: string;
  evaluatorName: string;
  evaluatorRole?: string | null;
  evaluationDate?: string;
  punctualityScore: number;
  attendanceScore: number;
  productivityScore: number;
  teamworkScore: number;
  customerServiceScore: number;
  goalsScore: number;
  strengths?: string[];
  growthAreas?: string[];
  developmentPlan?: string;
  goalsAchieved?: string;
  comments?: string;
  status?: "completada" | "borrador";
}

export async function createEvaluationAction(input: CreateEvaluationInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado. Inicie sesión como empresa." };
  }

  if (!input.employeeName || !input.employeeName.trim()) {
    return { success: false, error: "El nombre del colaborador es requerido." };
  }

  // Calculate precise average score
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

  const evaluationDate =
    input.evaluationDate || new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("company_evaluations")
    .insert({
      company_id: user.id,
      employee_id: input.employeeId || null,
      evaluator_id: user.id,
      employee_name: input.employeeName.trim(),
      job_title: input.jobTitle?.trim() || null,
      department: input.department?.trim() || null,
      avatar_url: input.avatarUrl || null,
      period: input.period.trim() || "Evaluación de Desempeño 360",
      evaluation_date: evaluationDate,
      evaluator_name: input.evaluatorName.trim() || "Evaluador Directo",
      evaluator_role: input.evaluatorRole?.trim() || "Dirección / RRHH",
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
      strengths: (input.strengths || []) as any,
      growth_areas: (input.growthAreas || []) as any,
      development_plan: input.developmentPlan?.trim() || null,
      goals_achieved: input.goalsAchieved?.trim() || null,
      comments: input.comments?.trim() || null,
      status: input.status || "completada",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating company evaluation:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/company/evaluations");
  revalidatePath("/dashboard/company/employees");
  revalidatePath("/dashboard/company");

  return { success: true, evaluationId: data.id, averageScore };
}

export async function deleteEvaluationAction(evaluationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const { error } = await supabase
    .from("company_evaluations")
    .delete()
    .eq("id", evaluationId)
    .eq("company_id", user.id);

  if (error) {
    console.error("Error deleting evaluation:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/company/evaluations");
  return { success: true };
}

export interface CreateNom035SurveyInput {
  employeeId?: string | null;
  employeeName: string;
  jobTitle?: string | null;
  department?: string | null;
  guideType?: "guia_i" | "guia_ii" | "guia_iii";
  surveyDate?: string;
  environmentScore: number;
  activityFactorsScore: number;
  timeOrganizationScore: number;
  leadershipRelationsScore: number;
  organizationalClimateScore: number;
  actionPlan?: string;
  status?: "borrador" | "completada";
}

/**
 * Registra una evaluación de clima laboral y factores psicosociales (NOM-035-STPS-2018)
 */
export async function createNom035SurveyAction(input: CreateNom035SurveyInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const totalScore =
    Number(input.environmentScore || 0) +
    Number(input.activityFactorsScore || 0) +
    Number(input.timeOrganizationScore || 0) +
    Number(input.leadershipRelationsScore || 0) +
    Number(input.organizationalClimateScore || 0);

  let riskLevel: "nulo" | "bajo" | "medio" | "alto" | "muy_alto" = "bajo";
  if (totalScore < 20) riskLevel = "nulo";
  else if (totalScore < 45) riskLevel = "bajo";
  else if (totalScore < 70) riskLevel = "medio";
  else if (totalScore < 90) riskLevel = "alto";
  else riskLevel = "muy_alto";

  const { data, error } = await supabase
    .from("company_nom035_surveys")
    .insert({
      company_id: user.id,
      employee_id: input.employeeId || null,
      employee_name: input.employeeName.trim(),
      job_title: input.jobTitle?.trim() || null,
      department: input.department?.trim() || null,
      guide_type: input.guideType || "guia_ii",
      survey_date: input.surveyDate || new Date().toISOString().split("T")[0],
      environment_score: input.environmentScore,
      activity_factors_score: input.activityFactorsScore,
      time_organization_score: input.timeOrganizationScore,
      leadership_relations_score: input.leadershipRelationsScore,
      organizational_climate_score: input.organizationalClimateScore,
      total_score: totalScore,
      risk_level: riskLevel,
      action_plan: input.actionPlan?.trim() || null,
      status: input.status || "completada",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating NOM-035 survey:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/company/evaluations");
  revalidatePath("/dashboard/company");

  return { success: true, surveyId: data.id, totalScore, riskLevel };
}

export async function deleteNom035SurveyAction(surveyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado." };
  }

  const { error } = await supabase
    .from("company_nom035_surveys")
    .delete()
    .eq("id", surveyId)
    .eq("company_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/company/evaluations");
  return { success: true };
}
