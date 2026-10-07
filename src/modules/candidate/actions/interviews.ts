"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  respondToInterviewSchema,
  type RespondToInterviewInput,
} from "../schemas/interviews.schema";
import { CandidateInterviewsService } from "../services/candidate-interviews";

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type RespondToInterviewActionResult =
  | {
      success: true;
      data: { status: "confirmed" | "rescheduled" };
      status: "confirmed" | "rescheduled";
      message: string;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      status?: undefined;
      message?: undefined;
    };

/**
 * Server Action: Candidate confirms attendance or requests rescheduling of an interview.
 * Validates payload against Zod schema, checks session, and delegates logic to CandidateInterviewsService.
 */
export async function respondToInterviewAction(
  rawInput: RespondToInterviewInput
): Promise<RespondToInterviewActionResult> {
  const parsed = respondToInterviewSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Parámetros de respuesta de entrevista inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  try {
    const result = await CandidateInterviewsService.respondToInterview(
      supabase,
      user.id,
      parsed.data
    );

    revalidatePath("/dashboard/candidate/applications");
    revalidatePath("/dashboard/candidate");
    revalidatePath("/dashboard/company/interviews");
    revalidatePath("/dashboard/company/vacancies");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: { status: result.status },
      status: result.status,
      message: result.message,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "No se pudo registrar la respuesta a la entrevista.";
    return { success: false, error: message };
  }
}
