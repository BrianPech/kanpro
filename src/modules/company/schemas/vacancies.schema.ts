import { z } from "zod";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  vacancyWizardSchema,
  type VacancyWizardValues,
  DEFAULT_WIZARD_VALUES,
  VACANCY_CATEGORIES,
  EMPLOYMENT_TYPES,
  SHIFT_SCHEDULES,
  PRESET_ZONES,
  PRESET_BENEFITS,
  EXPERIENCE_LEVELS,
  EDUCATION_LEVELS,
} from "./vacancy-wizard.schema";

export {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  vacancyWizardSchema,
  type VacancyWizardValues,
  DEFAULT_WIZARD_VALUES,
  VACANCY_CATEGORIES,
  EMPLOYMENT_TYPES,
  SHIFT_SCHEDULES,
  PRESET_ZONES,
  PRESET_BENEFITS,
  EXPERIENCE_LEVELS,
  EDUCATION_LEVELS,
};

const uuidSchema = z
  .string()
  .uuid({ message: "El identificador de la vacante debe ser un UUID válido." });

export const cloneVacancySchema = z.object({
  vacancyId: uuidSchema,
});

export type CloneVacancyInput = z.infer<typeof cloneVacancySchema>;

export const createExpressVacancySchema = z
  .object({
    title: z.string().min(3, "El título del puesto debe tener al menos 3 caracteres."),
    zone: z.string().min(1, "La zona de trabajo es requerida."),
    category: z.string().min(1, "La categoría de la vacante es requerida."),
    requirements: z.string().min(5, "Especifica los requisitos básicos del puesto."),
    salary_min: z.number().min(0, "El sueldo mínimo no puede ser negativo.").optional().nullable(),
    salary_max: z.number().min(0, "El sueldo máximo no puede ser negativo.").optional().nullable(),
    modality: z.string().optional().default("Presencial"),
    employment_type: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.salary_min != null && data.salary_max != null) {
        return data.salary_max >= data.salary_min;
      }
      return true;
    },
    {
      message: "El sueldo máximo debe ser mayor o igual al sueldo mínimo.",
      path: ["salary_max"],
    }
  );

export type CreateExpressVacancyInput = z.infer<typeof createExpressVacancySchema>;

export const toggleVacancyStatusSchema = z.object({
  vacancyId: uuidSchema,
  isActive: z.boolean(),
});

export type ToggleVacancyStatusInput = z.infer<typeof toggleVacancyStatusSchema>;

export const deleteVacancySchema = z.object({
  vacancyId: uuidSchema,
});

export type DeleteVacancyInput = z.infer<typeof deleteVacancySchema>;
