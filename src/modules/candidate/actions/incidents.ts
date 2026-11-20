"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  respondToIncidentSchema,
  type RespondToIncidentInput,
} from "../schemas/incidents.schema";
import {
  CandidateIncidentsService,
  type CandidateIncident,
} from "../services/candidate-incidents";

type RespondToIncidentActionResult =
  | { success: true; data: CandidateIncident }
  | { success: false; error: string };

/**
 * Server Action: el colaborador acepta ("enterado") y/o registra su descargo sobre una incidencia.
 */
export async function respondToIncidentAction(
  rawInput: RespondToIncidentInput
): Promise<RespondToIncidentActionResult> {
  const parsed = respondToIncidentSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Respuesta inválida." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No autorizado. Inicia sesión para continuar." };
  }

  try {
    const incident = await new CandidateIncidentsService(supabase).respond(parsed.data);
    revalidatePath("/dashboard/candidate/incidents");
    revalidatePath("/dashboard/company/incidents");
    return { success: true, data: incident };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error inesperado al registrar tu respuesta.";
    return { success: false, error: errorMsg };
  }
}
