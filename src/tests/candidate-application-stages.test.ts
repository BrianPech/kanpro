import { describe, expect, test } from "vitest";
import {
  formatInterviewDateParts,
  resolveApplicationStage,
} from "@/modules/candidate/utils/application-stages";

describe("Candidate application stage mapping", () => {
  test("maps stages 1 through 4 accurately", () => {
    expect(resolveApplicationStage("Pendiente")).toMatchObject({
      step: 1,
      label: "Por revisar",
      isFinished: false,
      nextStepTitle: "Revisión de perfil",
    });

    expect(resolveApplicationStage("Preseleccionado")).toMatchObject({
      step: 2,
      label: "Preselección",
      isFinished: false,
      nextStepTitle: "Contacto de la empresa",
    });

    expect(
      resolveApplicationStage("Entrevista", {
        date: "2026-11-23",
        time: "10:00",
        modality: "virtual",
        locationOrLink: "https://meet.google.com/abc",
      })
    ).toMatchObject({
      step: 3,
      label: "Entrevista",
      isFinished: false,
      nextStepSubtitle: "Videollamada",
    });

    expect(resolveApplicationStage("Contratado")).toMatchObject({
      step: 4,
      label: "Contratado",
      isFinished: true,
      isRejected: false,
      nextStepTitle: "Selección completada",
      nextStepSubtitle: "Espera indicaciones de la empresa",
    });
  });

  test("marks discarded applications as finished and infers last reached stage", () => {
    expect(resolveApplicationStage("Descartado", null, 50)).toMatchObject({
      step: 2,
      label: "No seleccionado",
      isFinished: true,
      isRejected: true,
      nextStepTitle: "Preselección",
      nextStepSubtitle: "Proceso finalizado",
    });
  });

  test("formatInterviewDateParts handles missing and valid interview data", () => {
    expect(formatInterviewDateParts(null)).toBeNull();
    expect(
      formatInterviewDateParts({
        date: "2026-11-23",
        time: "10:00",
        modality: "presencial",
        locationOrLink: "Oficinas Centro",
      })
    ).toMatchObject({
      timeLine: "10:00 h",
      modalityLine: "Presencial",
    });
  });
});
