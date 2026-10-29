"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  applyToVacancySchema,
  type ApplyToVacancyInput,
} from "../schemas/applications.schema";
import {
  CandidateApplicationsService,
  type ApplyResult,
} from "../services/candidate-applications";

export type ApplyToVacancyActionResult =
  | { success: true; data: ApplyResult }
  | { success: false; error: string };

/**
 * Server Action para postularse a una vacante con validación de sesión de candidato.
 */
export async function applyToVacancyAction(
  rawInput: ApplyToVacancyInput
): Promise<ApplyToVacancyActionResult> {
  const parsed = applyToVacancySchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de postulación inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "No autorizado. Inicie sesión para postularse a esta vacante.",
    };
  }

  try {
    const result = await CandidateApplicationsService.applyToVacancy(
      supabase,
      user.id,
      parsed.data.vacancyId
    );

    revalidatePath("/dashboard/candidate/applications");
    revalidatePath("/dashboard/candidate");
    revalidatePath(`/jobs/${parsed.data.vacancyId}`);
    revalidatePath("/dashboard/company/vacancies");

    return { success: true, data: result };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al procesar la postulación.";
    return { success: false, error: message };
  }
}
