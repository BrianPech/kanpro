import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export interface ApplyResult {
  alreadyApplied: boolean;
  applicationId?: string;
  message: string;
}

export class CandidateApplicationsService {
  /**
   * Registra la postulación formal de un candidato a una vacante activa,
   * garantizando la existencia del perfil y control estricto de duplicados.
   */
  static async applyToVacancy(
    supabase: SupabaseClient<Database>,
    userId: string,
    vacancyId: string
  ): Promise<ApplyResult> {
    // 1. Garantizar perfil de candidato existente de forma defensiva
    const { data: candProfile } = await supabase
      .from("candidate_profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!candProfile) {
      await supabase
        .from("candidate_profiles")
        .upsert({ id: userId, updated_at: new Date().toISOString() });
    }

    // 2. Verificar si la vacante existe
    const { data: vacancy, error: vacancyError } = await supabase
      .from("vacancies")
      .select("id, title, is_active, company_id")
      .eq("id", vacancyId)
      .maybeSingle();

    if (vacancyError || !vacancy) {
      throw new Error("La vacante solicitada no existe o no está disponible.");
    }

    // 3. Insertar postulación
    const { data, error } = await supabase
      .from("applications")
      .insert({
        candidate_id: userId,
        vacancy_id: vacancyId,
        status: "Pendiente",
      })
      .select("id")
      .maybeSingle();

    if (error) {
      // 23505 = unique_violation en PostgreSQL (candidate_id, vacancy_id)
      if (error.code === "23505") {
        return {
          alreadyApplied: true,
          message: "Ya te has postulado previamente a esta vacante.",
        };
      }
      throw new Error(error.message || "Error al procesar la postulación.");
    }

    // 4. Enviar notificación in-app a la empresa
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();

      const candidateName = profile?.full_name || "Un nuevo candidato";

      await supabase.from("notifications").insert({
        user_id: vacancy.company_id,
        title: "¡Nueva postulación recibida!",
        description: `${candidateName} se ha postulado para la vacante "${vacancy.title}".`,
        type: "new_application",
      });
    } catch {
      // Notificación opcional/silenciosa
    }

    return {
      alreadyApplied: false,
      applicationId: data?.id,
      message: "¡Postulación enviada exitosamente!",
    };
  }
}
