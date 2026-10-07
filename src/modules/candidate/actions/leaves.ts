"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  submitCandidateLeaveRequestSchema,
  type SubmitCandidateLeaveRequestInput,
} from "../schemas/leaves.schema";
import { CandidateLeavesService } from "../services/candidate-leaves";

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type SubmitCandidateLeaveActionResult =
  | {
      success: true;
      data: { leaveId: string };
      leaveId: string;
      message: string;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      leaveId?: undefined;
      message?: undefined;
    };

/**
 * Server Action: Candidate / Employee submits a vacation or leave request.
 * Validates payload against Zod schema, checks session, and delegates logic to CandidateLeavesService.
 */
export async function submitCandidateLeaveRequestAction(
  rawInput: SubmitCandidateLeaveRequestInput
): Promise<SubmitCandidateLeaveActionResult> {
  const parsed = submitCandidateLeaveRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de solicitud de permiso inválidos.";
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
    const result = await CandidateLeavesService.submitLeaveRequest(
      supabase,
      user.id,
      parsed.data
    );

    revalidatePath("/dashboard/candidate/leaves");
    revalidatePath("/dashboard/candidate");
    revalidatePath("/dashboard/company/leaves");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      data: { leaveId: result.leaveId },
      leaveId: result.leaveId,
      message: result.message,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Error al enviar la solicitud de permiso.";
    return { success: false, error: message };
  }
}
