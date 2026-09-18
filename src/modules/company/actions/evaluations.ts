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
