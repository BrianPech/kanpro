import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";
import type { RespondToInterviewInput } from "../schemas/interviews.schema";

export interface RespondToInterviewResult {
  success: boolean;
  status: "confirmed" | "rescheduled";
  message: string;
}

interface RawApplicationWithVacancy {
  id: string;
  candidate_id: string;
  status: string;
  interview_details: Record<string, unknown> | null;
  interview_status: string | null;
  scheduled_interview_at: string | null;
  vacancy:
    | {
        id: string;
        title: string;
        company_id: string;
      }
    | Array<{
        id: string;
        title: string;
        company_id: string;
      }>
    | null;
}

export class CandidateInterviewsService {
  /**
   * Procesa la confirmación de asistencia o solicitud de reagendamiento de una entrevista.
   */
  static async respondToInterview(
    supabase: SupabaseClient<Database>,
    userId: string,
    input: RespondToInterviewInput
  ): Promise<RespondToInterviewResult> {
    // 1. Obtener postulación y verificar propiedad del candidato
    const { data: rawApplication, error: appErr } = await supabase
      .from("applications")
      .select(`
        id,
        candidate_id,
        status,
        interview_details,
        interview_status,
        scheduled_interview_at,
        vacancy:vacancies (
          id,
          title,
          company_id
        )
      `)
      .eq("id", input.applicationId)
      .single();

    if (appErr || !rawApplication) {
      throw new Error("No se encontró la postulación especificada.");
    }

    const application = rawApplication as unknown as RawApplicationWithVacancy;

    if (application.candidate_id !== userId) {
      throw new Error("No tienes permisos para responder sobre esta postulación.");
    }

    const currentDetails = (application.interview_details as Record<string, unknown>) || {};
    const now = new Date().toISOString();
    const isConfirm = input.response === "confirm";
    const newInterviewStatus: "confirmed" | "rescheduled" = isConfirm
      ? "confirmed"
      : "rescheduled";

    const updatedDetails = {
      ...currentDetails,
      status: newInterviewStatus,
      respondedAt: now,
      candidateResponseNotes: input.candidateNotes?.trim() || null,
      proposedDate: input.proposedDate || null,
      proposedTime: input.proposedTime || null,
    };

    // 2. Actualizar la postulación en la base de datos
    const { error: updateErr } = await supabase
      .from("applications")
      .update({
        interview_status: newInterviewStatus,
        interview_details: updatedDetails as unknown as Json,
        updated_at: now,
      })
      .eq("id", input.applicationId);

    if (updateErr) {
      console.error("Error updating application interview status:", updateErr);
      throw new Error(
        updateErr.message || "No se pudo registrar la respuesta a la entrevista."
      );
    }

    // 3. Enviar notificación in-app a la empresa empleadora
    const vacObj = Array.isArray(application.vacancy)
      ? application.vacancy[0]
      : application.vacancy;
    const companyId = vacObj?.company_id;
    const vacancyTitle = vacObj?.title || "la vacante";

    if (companyId) {
      const { data: candProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();

      const candidateName = candProfile?.full_name || "El candidato";

      try {
        if (isConfirm) {
          const dateStr = currentDetails.date
            ? ` el día ${currentDetails.date}${
                currentDetails.time ? ` a las ${currentDetails.time}` : ""
              }`
            : "";

          await supabase.from("notifications").insert({
            user_id: companyId,
            title: "¡Entrevista confirmada por el candidato!",
            description: `${candidateName} ha confirmado su asistencia a la entrevista para el puesto de "${vacancyTitle}"${dateStr}.`,
            type: "interview_confirmed",
          });
        } else {
          const dateProposal = input.proposedDate
            ? ` (propone: ${input.proposedDate}${
                input.proposedTime ? ` a las ${input.proposedTime}` : ""
              })`
            : "";
          const notesSnippet = input.candidateNotes
            ? ` Motivo: "${input.candidateNotes.trim()}"`
            : "";

          await supabase.from("notifications").insert({
            user_id: companyId,
            title: "Solicitud de reagendamiento de entrevista",
            description: `${candidateName} solicita reagendar su cita para "${vacancyTitle}"${dateProposal}.${notesSnippet}`,
            type: "interview_rescheduled",
          });
        }
      } catch (notifErr) {
        console.error("Error sending interview notification to company:", notifErr);
      }
    }

    return {
      success: true,
      status: newInterviewStatus,
      message: isConfirm
        ? "¡Cita de entrevista confirmada con éxito!"
        : "Se ha enviado la solicitud de reagendamiento a la empresa.",
    };
  }
}
