"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createEvaluationSchema,
  deleteEvaluationSchema,
  createNom035SurveySchema,
  deleteNom035SurveySchema,
  type CreateEvaluationInput,
  type DeleteEvaluationInput,
  type CreateNom035SurveyInput,
  type DeleteNom035SurveyInput,
} from "../schemas/evaluations.schema";
import { CompanyEvaluationsService } from "../services/company-evaluations";
import type { Nom035RiskLevel } from "../types/evaluations";

export type {
  CreateEvaluationInput,
  DeleteEvaluationInput,
  CreateNom035SurveyInput,
  DeleteNom035SurveyInput,
};

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type CreateEvaluationActionResult =
  | {
      success: true;
      data: { evaluationId: string; averageScore: number };
      evaluationId: string;
      averageScore: number;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      evaluationId?: undefined;
      averageScore?: undefined;
    };

export type CreateNom035SurveyActionResult =
  | {
      success: true;
      data: { surveyId: string; totalScore: number; riskLevel: Nom035RiskLevel };
      surveyId: string;
      totalScore: number;
      riskLevel: Nom035RiskLevel;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      surveyId?: undefined;
      totalScore?: undefined;
      riskLevel?: undefined;
    };

/**
 * Registra una evaluación de desempeño 360 para un colaborador.
 */
export async function createEvaluationAction(
  rawInput: CreateEvaluationInput
): Promise<CreateEvaluationActionResult> {
  const parsed = createEvaluationSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de evaluación de desempeño inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión como empresa." };
  }

  try {
    const result = await CompanyEvaluationsService.createEvaluation(
      supabase,
      user.id,
      parsed.data
    );

    revalidatePath("/dashboard/company/evaluations");
    revalidatePath("/dashboard/company/employees");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: result,
      evaluationId: result.evaluationId,
      averageScore: result.averageScore,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Error al registrar la evaluación en la base de datos.";
    return { success: false, error: message };
  }
}

/**
 * Elimina una evaluación de desempeño registrada.
 */
export async function deleteEvaluationAction(
  evaluationId: string
): Promise<ActionResponse<void>> {
  const parsed = deleteEvaluationSchema.safeParse({ evaluationId });
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Identificador de evaluación inválido.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    await CompanyEvaluationsService.deleteEvaluation(
      supabase,
      user.id,
      parsed.data.evaluationId
    );

    revalidatePath("/dashboard/company/evaluations");
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al eliminar la evaluación.";
    return { success: false, error: message };
  }
}

/**
 * Registra una evaluación de clima laboral y factores psicosociales (NOM-035-STPS-2018).
 */
export async function createNom035SurveyAction(
  rawInput: CreateNom035SurveyInput
): Promise<CreateNom035SurveyActionResult> {
  const parsed = createNom035SurveySchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de encuesta NOM-035 inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    const result = await CompanyEvaluationsService.createNom035Survey(
      supabase,
      user.id,
      parsed.data
    );

    revalidatePath("/dashboard/company/evaluations");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: result,
      surveyId: result.surveyId,
      totalScore: result.totalScore,
      riskLevel: result.riskLevel,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Error al registrar la encuesta NOM-035.";
    return { success: false, error: message };
  }
}

/**
 * Elimina una encuesta NOM-035 registrada.
 */
export async function deleteNom035SurveyAction(
  surveyId: string
): Promise<ActionResponse<void>> {
  const parsed = deleteNom035SurveySchema.safeParse({ surveyId });
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Identificador de encuesta NOM-035 inválido.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado." };
  }

  try {
    await CompanyEvaluationsService.deleteNom035Survey(
      supabase,
      user.id,
      parsed.data.surveyId
    );

    revalidatePath("/dashboard/company/evaluations");
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al eliminar la encuesta NOM-035.";
    return { success: false, error: message };
  }
}
