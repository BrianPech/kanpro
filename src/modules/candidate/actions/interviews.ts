"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/supabase";

type ApplicationUpdate = Database["public"]["Tables"]["applications"]["Update"];

export interface RespondToInterviewInput {
  applicationId: string;
  response: "confirm" | "reschedule";
  candidateNotes?: string;
  proposedDate?: string;
  proposedTime?: string;
}

/**
 * Server Action: Candidate confirms attendance or requests rescheduling of an interview.
 * Atomically validates ownership, updates application interview_status & interview_details,
 * and notifies the hiring company via platform in-app notifications.
 */
export async function respondToInterviewAction(input: RespondToInterviewInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  if (!input.applicationId || !input.response) {
    throw new Error("Parámetros de respuesta de entrevista inválidos.");
  }

  // 1. Fetch application verifying candidate ownership
  const { data: application, error: appErr } = await supabase
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

  if (appErr || !application) {
    throw new Error("No se encontró la postulación especificada.");
  }

  if (application.candidate_id !== user.id) {
    throw new Error("No tienes permisos para responder sobre esta postulación.");
  }

  const currentDetails = (application.interview_details as any) || {};
  const now = new Date().toISOString();
  const isConfirm = input.response === "confirm";
  const newInterviewStatus = isConfirm ? "confirmed" : "rescheduled";

  const updatedDetails = {
    ...currentDetails,
    status: newInterviewStatus,
    respondedAt: now,
    candidateResponseNotes: input.candidateNotes?.trim() || null,
    proposedDate: input.proposedDate || null,
    proposedTime: input.proposedTime || null,
  };

  const updates: ApplicationUpdate = {
    interview_status: newInterviewStatus,
    interview_details: updatedDetails as any,
    updated_at: now,
  };

  // 2. Update application in Supabase
  const { error: updateErr } = await supabase
    .from("applications")
    .update(updates)
    .eq("id", input.applicationId);

  if (updateErr) {
    console.error("Error updating application interview status:", updateErr);
    throw new Error(
      updateErr.message || "No se pudo registrar la respuesta a la entrevista."
    );
  }

  // 3. Send notification to the hiring company
  const vacObj = Array.isArray(application.vacancy) ? application.vacancy[0] : application.vacancy;
  const companyId = vacObj?.company_id;
  const vacancyTitle = vacObj?.title || "la vacante";

  if (companyId) {
    const { data: candProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const candidateName = candProfile?.full_name || "El candidato";

    try {
      if (isConfirm) {
        const interviewDateStr = currentDetails.date
          ? ` el día ${currentDetails.date}${currentDetails.time ? ` a las ${currentDetails.time}` : ""}`
          : "";

        await supabase.from("notifications").insert({
          user_id: companyId,
          title: "¡Entrevista confirmada por el candidato!",
          description: `${candidateName} ha confirmado su asistencia a la entrevista para el puesto de "${vacancyTitle}"${interviewDateStr}.`,
          type: "interview_confirmed",
        });
      } else {
        const dateProposal = input.proposedDate
          ? ` (propone: ${input.proposedDate}${input.proposedTime ? ` a las ${input.proposedTime}` : ""})`
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

  // 4. Revalidate paths
  revalidatePath("/dashboard/candidate/applications");
  revalidatePath("/dashboard/candidate");
  revalidatePath("/dashboard/company/applications");
  revalidatePath("/dashboard/company");

  return {
    success: true,
    status: newInterviewStatus,
    message: isConfirm
      ? "¡Cita de entrevista confirmada con éxito!"
      : "Se ha enviado la solicitud de reagendamiento a la empresa.",
  };
}
