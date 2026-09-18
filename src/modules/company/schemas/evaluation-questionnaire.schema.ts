import { z } from "zod";

export const evaluationQuestionnaireSchema = z.object({
  employee_id: z.string().min(1, "Debe seleccionar un colaborador para evaluar."),
  period: z.string().min(1, "El periodo de evaluación es requerido."),
  puntualidad: z.enum(["1", "2", "3", "4", "5"], {
    message: "Debe calificar la puntualidad del colaborador.",
  }),
  asistencia: z.enum(["1", "2", "3", "4", "5"], {
    message: "Debe calificar la asistencia y turno.",
  }),
  productividad: z.enum(["1", "2", "3", "4", "5"], {
    message: "Debe calificar la productividad y calidad.",
  }),
  trabajo_equipo: z.enum(["1", "2", "3", "4", "5"], {
    message: "Debe calificar el trabajo en equipo.",
  }),
  atencion_comunicacion: z.enum(["1", "2", "3", "4", "5"], {
    message: "Debe calificar el servicio y comunicación.",
  }),
  metas: z.enum(["1", "2", "3", "4", "5"], {
    message: "Debe calificar el cumplimiento de metas.",
  }),
  fortalezas: z.array(z.string()).min(1, "Seleccione al menos una fortaleza o escriba una personalizada."),
  areas_oportunidad: z.array(z.string()).min(1, "Seleccione al menos un área de oportunidad."),
  plan_desarrollo: z.string().min(1, "Especifique el plan de capacitación o desarrollo."),
});

export type EvaluationQuestionnaireValues = z.infer<typeof evaluationQuestionnaireSchema>;
