import type { CandidateInterviewDetails } from "../services/candidate-dashboard";

export type ApplicationStageStep = 1 | 2 | 3 | 4;

export interface ApplicationStageInfo {
  step: ApplicationStageStep;
  label: string;
  isFinished: boolean;
  isRejected: boolean;
  nextStepTitle: string;
  nextStepSubtitle: string;
  whatFollows: string;
}

export const APPLICATION_STAGES: ReadonlyArray<{
  step: ApplicationStageStep;
  label: string;
}> = [
  { step: 1, label: "Por revisar" },
  { step: 2, label: "Preselección" },
  { step: 3, label: "Entrevista" },
  { step: 4, label: "Contratado" },
];

export function formatInterviewDateParts(
  interview?: CandidateInterviewDetails | null
): { dateLine: string; timeLine: string | null; modalityLine: string } | null {
  if (!interview) return null;

  const modalityLine =
    interview.modality === "virtual" ? "Videollamada" : "Presencial";

  const rawIso =
    interview.scheduledInterviewAt ||
    interview.scheduledAt ||
    (interview.date
      ? `${interview.date}T${interview.time ? `${interview.time}:00` : "10:00:00"}`
      : null);

  if (!rawIso) {
    return {
      dateLine: "Entrevista programada",
      timeLine: interview.time ? `${interview.time} h` : null,
      modalityLine,
    };
  }

  const parsed = new Date(rawIso);
  if (Number.isNaN(parsed.getTime())) {
    return {
      dateLine: interview.date || "Entrevista programada",
      timeLine: interview.time ? `${interview.time} h` : null,
      modalityLine,
    };
  }

  const weekday = parsed
    .toLocaleDateString("es-MX", { weekday: "short" })
    .replace(".", "");
  const day = parsed.getDate();
  const month = parsed
    .toLocaleDateString("es-MX", { month: "short" })
    .replace(".", "");
  const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const dateLine = `${capWeekday} ${day} ${month}`;

  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  const timeLine = interview.time
    ? `${interview.time} h`
    : `${hours}:${minutes} h`;

  return { dateLine, timeLine, modalityLine };
}

export function resolveApplicationStage(
  status: string,
  interview?: CandidateInterviewDetails | null,
  progress?: number
): ApplicationStageInfo {
  const normalized = status.toLowerCase().trim();

  if (
    normalized === "descartado" ||
    normalized === "rejected" ||
    normalized === "withdrawn" ||
    normalized === "cancelled" ||
    normalized === "no seleccionado"
  ) {
    // Infer last reached stage from available interview/progress data without inventing unreachable stages
    const lastStep: ApplicationStageStep = interview
      ? 3
      : (progress ?? 0) >= 50
        ? 2
        : 1;
    const lastStageLabel =
      APPLICATION_STAGES.find((s) => s.step === lastStep)?.label ??
      "Por revisar";

    return {
      step: lastStep,
      label: "No seleccionado",
      isFinished: true,
      isRejected: true,
      nextStepTitle: lastStageLabel,
      nextStepSubtitle: "Proceso finalizado",
      whatFollows:
        "Este proceso terminó. Puedes explorar otras vacantes que se ajusten a tu perfil.",
    };
  }

  if (
    normalized === "contratado" ||
    normalized === "hired" ||
    normalized === "accepted" ||
    normalized === "offer"
  ) {
    return {
      step: 4,
      label: "Contratado",
      isFinished: true,
      isRejected: false,
      nextStepTitle: "Selección completada",
      nextStepSubtitle: "Espera indicaciones de la empresa",
      whatFollows:
        "La empresa te compartirá los siguientes pasos para tu incorporación.",
    };
  }

  if (
    normalized === "entrevista" ||
    normalized === "en entrevista" ||
    normalized === "interview" ||
    normalized === "interviewing"
  ) {
    const formatted = formatInterviewDateParts(interview);
    return {
      step: 3,
      label: "Entrevista",
      isFinished: false,
      isRejected: false,
      nextStepTitle: formatted?.dateLine ?? "Por confirmar",
      nextStepSubtitle: formatted?.modalityLine ?? "Revisa tus avisos",
      whatFollows: "Revisa los datos de tu entrevista y ten tu CV a la mano.",
    };
  }

  if (
    normalized === "preseleccionado" ||
    normalized === "preselección" ||
    normalized === "preseleccion" ||
    normalized === "shortlisted" ||
    normalized === "preselected"
  ) {
    return {
      step: 2,
      label: "Preselección",
      isFinished: false,
      isRejected: false,
      nextStepTitle: "Contacto de la empresa",
      nextStepSubtitle: "Revisa tus avisos",
      whatFollows:
        "Tu perfil avanzó a preselección. La empresa te indicará el siguiente paso por los canales de contacto de tu perfil.",
    };
  }

  return {
    step: 1,
    label: "Por revisar",
    isFinished: false,
    isRejected: false,
    nextStepTitle: "Revisión de perfil",
    nextStepSubtitle: "Espera novedades",
    whatFollows:
      "Tu postulación fue recibida. La empresa revisará tu información y te avisará si avanzas.",
  };
}
