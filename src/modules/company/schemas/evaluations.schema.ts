import { z } from "zod";
import {
  evaluationQuestionnaireSchema,
  type EvaluationQuestionnaireValues,
} from "./evaluation-questionnaire.schema";

export { evaluationQuestionnaireSchema, type EvaluationQuestionnaireValues };

const uuidSchema = z
  .string()
  .uuid({ message: "El identificador debe ser un UUID válido." });

const scoreSchema = z.coerce
  .number({ message: "La calificación debe ser un número." })
  .min(1, "La calificación mínima es 1.")
  .max(5, "La calificación máxima es 5.");

export const createEvaluationSchema = z.object({
  employeeId: z.string().optional().nullable(),
  employeeName: z
    .string()
    .min(2, "El nombre del colaborador es requerido y debe tener al menos 2 caracteres.")
    .max(120, "El nombre no puede exceder 120 caracteres."),
  jobTitle: z.string().max(120).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  period: z
    .string()
    .min(2, "El periodo de evaluación es requerido.")
    .max(100)
    .default("Evaluación de Desempeño 360"),
  evaluatorName: z
    .string()
    .min(2, "El nombre del evaluador es requerido.")
    .max(120)
    .default("Evaluador Directo"),
  evaluatorRole: z.string().max(100).optional().nullable().default("Dirección / RRHH"),
  evaluatorRelation: z
    .enum(["autoevaluacion", "jefe_directo", "par", "subordinado"])
    .optional()
    .default("jefe_directo"),
  potentialScore: scoreSchema.optional().default(3.5),
  evaluationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD.")
    .optional(),
  punctualityScore: scoreSchema,
  attendanceScore: scoreSchema,
  productivityScore: scoreSchema,
  teamworkScore: scoreSchema,
  customerServiceScore: scoreSchema,
  goalsScore: scoreSchema,
  strengths: z.array(z.string()).optional().default([]),
  growthAreas: z.array(z.string()).optional().default([]),
  developmentPlan: z.string().max(1000).optional().nullable(),
  goalsAchieved: z.string().max(1000).optional().nullable(),
  comments: z.string().max(1500).optional().nullable(),
  status: z.enum(["completada", "borrador"]).optional().default("completada"),
});

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;

export const deleteEvaluationSchema = z.object({
  evaluationId: uuidSchema,
});

export type DeleteEvaluationInput = z.infer<typeof deleteEvaluationSchema>;

export const createNom035SurveySchema = z.object({
  employeeId: z.string().optional().nullable(),
  employeeName: z
    .string()
    .min(2, "El nombre del colaborador evaluado es requerido.")
    .max(120),
  jobTitle: z.string().max(120).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  guideType: z.enum(["guia_i", "guia_ii", "guia_iii"]).default("guia_ii"),
  surveyDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD.")
    .optional(),
  environmentScore: z.coerce.number().min(0, "El puntaje no puede ser negativo."),
  activityFactorsScore: z.coerce.number().min(0, "El puntaje no puede ser negativo."),
  timeOrganizationScore: z.coerce.number().min(0, "El puntaje no puede ser negativo."),
  leadershipRelationsScore: z.coerce.number().min(0, "El puntaje no puede ser negativo."),
  organizationalClimateScore: z.coerce.number().min(0, "El puntaje no puede ser negativo."),
  actionPlan: z.string().max(1500).optional().nullable(),
  status: z.enum(["borrador", "completada"]).optional().default("completada"),
});

export type CreateNom035SurveyInput = z.infer<typeof createNom035SurveySchema>;

export const deleteNom035SurveySchema = z.object({
  surveyId: uuidSchema,
});

export type DeleteNom035SurveyInput = z.infer<typeof deleteNom035SurveySchema>;
