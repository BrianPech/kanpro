"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { companyTenantService } from "../services/company-tenant.service";

export type InviteCandidateResult =
  | { success: true; message: string }
  | { success: false; error: string };

/**
 * Invita a un candidato explorado en el Radar a postularse a una vacante activa de la empresa.
 */
export async function inviteCandidateToVacancyAction(
  candidateId: string,
  vacancyId: string
): Promise<InviteCandidateResult> {
  if (!candidateId || !vacancyId) {
    return { success: false, error: "Identificadores de candidato y vacante obligatorios." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para enviar invitaciones." };
  }

  const { companyId: companyScopeId } = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);

  try {
    // 1. Obtener datos de la empresa y la vacante
    const [companyRes, vacancyRes] = await Promise.all([
      supabase
        .from("company_profiles")
        .select("company_name")
        .eq("id", companyScopeId)
        .maybeSingle(),
      supabase
        .from("vacancies")
        .select("id, title, company_id")
        .eq("id", vacancyId)
        .eq("company_id", companyScopeId)
        .maybeSingle(),
    ]);

    if (!vacancyRes.data) {
      return { success: false, error: "La vacante seleccionada no pertenece a tu empresa o no existe." };
    }

    const companyName = companyRes.data?.company_name || "Una empresa local";
    const vacancyTitle = vacancyRes.data.title;

    // 2. Enviar notificación directa al candidato
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: candidateId,
      title: `¡${companyName} te ha invitado a postularte!`,
      description: `Has sido invitado proactivamente para la vacante "${vacancyTitle}". Revisa la oferta y postúlate con un clic.`,
      type: "vacancy_invitation",
    });

    if (notifError) {
      console.error("Error creating candidate notification:", notifError);
      return { success: false, error: "No se pudo registrar la notificación para el candidato." };
    }

    revalidatePath("/dashboard/company/radar");

    return {
      success: true,
      message: `Invitación enviada exitosamente al candidato para la vacante "${vacancyTitle}".`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error inesperado al invitar al candidato.";
    return { success: false, error: message };
  }
}
