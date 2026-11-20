"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  submitCandidateLeaveRequestSchema,
  type SubmitCandidateLeaveRequestInput,
} from "../schemas/leaves.schema";
import { CandidateLeavesService } from "../services/candidate-leaves";
import { LeaveCertificateService } from "@/modules/company/services/leave-certificate.service";

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
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Ocurrió un error inesperado al procesar la solicitud.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Action: Candidate / Employee downloads their official Constancia de Disfrute de Vacaciones PDF.
 */
export async function generateCandidateLeaveCertificateAction(
  requestId: string
): Promise<{ success: boolean; data?: { fileName: string; base64: string }; error?: string }> {
  if (!requestId || !requestId.trim()) {
    return { success: false, error: "El ID de la solicitud es requerido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  try {
    const { fileName, pdf } = await new LeaveCertificateService(supabase).generateForCandidate(
      user.id,
      requestId
    );
    return {
      success: true,
      data: { fileName, base64: Buffer.from(pdf).toString("base64") },
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "No se pudo generar la constancia.";
    return { success: false, error: errorMsg };
  }
}
