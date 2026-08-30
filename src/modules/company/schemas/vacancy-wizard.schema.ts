import { z } from "zod";

// Pre-defined available categories
export const VACANCY_CATEGORIES = [
  "Alimentos y Bebidas",
  "Hotelería y Turismo",
  "Mantenimiento y Limpieza",
  "Ventas y Comercio",
  "Administración y Operaciones",
  "Atención al Cliente",
  "Logística y Transporte",
  "Salud y Belleza",
  "Tecnología y Digital",
  "Otro",
] as const;

// Pre-defined employment types
export const EMPLOYMENT_TYPES = [
  "Tiempo Completo",
  "Medio Tiempo",
  "Turno Rotativo",
  "Fin de Semana",
  "Por Proyecto / Temporal",
] as const;

// Shift schedules
export const SHIFT_SCHEDULES = [
  "Matutino (Mañana)",
  "Vespertino (Tarde)",
  "Nocturno (Noche)",
  "Mixto / Rolado",
  "Flexible",
] as const;

// Pre-defined Yucatan & Riviera Maya Zones
export const PRESET_ZONES = [
  "Centro Mérida",
  "Norte / Altabrisa / Montecristo",
  "Poniente / Caucel",
  "Norte / Las Américas",
  "Francisco de Montejo",
  "Oriente / Kanasín",
  "Paseo de Montejo",
  "Progreso / Costa",
  "Playa del Carmen",
  "Cancún / Zona Hotelera",
  "Tulum",
  "Valladolid",
  "Otra Zona",
] as const;

// Standard benefits list
export const PRESET_BENEFITS = [
  "Prestaciones de Ley (IMSS, Infonavit, Aguinaldo)",
  "Propinas diarias / semanales",
  "Comedor de empleados gratuito",
  "Transporte de personal",
  "Uniformes incluidos",
  "Vales de despensa",
  "Bono de puntualidad y asistencia",
  "Capacitación pagada",
  "Descuentos de la empresa",
  "Seguro de vida",
  "Caja de ahorro",
  "Oportunidad de crecimiento",
] as const;

// Experience levels
export const EXPERIENCE_LEVELS = [
  "Sin experiencia previa",
  "6 meses a 1 año",
  "1 a 2 años",
  "3 a 5 años",
  "5+ años",
] as const;

// Education levels
export const EDUCATION_LEVELS = [
  "Indistinto",
  "Primaria / Secundaria",
  "Preparatoria / Bachillerato",
  "Carrera Técnica",
  "Licenciatura / Profesional",
] as const;

// Step 1: Puesto y Datos Básicos
export const step1Schema = z.object({
  title: z.string().min(3, "El puesto debe tener al menos 3 caracteres"),
  category: z.string().min(1, "Selecciona una categoría laboral"),
  employment_type: z.string().min(1, "Selecciona el tipo de jornada"),
  shift_schedule: z.string().min(1, "Selecciona el horario o turno"),
  positions_available: z.coerce.number().int().min(1, "Mínimo 1 vacante"),
});

// Step 2: Ubicación, Salario y Beneficios
export const step2Schema = z.object({
  location: z.string().min(2, "Ingresa la ciudad o municipio principal"),
  zone: z.string().min(1, "Selecciona o escribe la zona de trabajo"),
  salary_min: z.coerce.number().min(0, "El sueldo mínimo no puede ser negativo").optional().nullable(),
  salary_max: z.coerce.number().min(0, "El sueldo máximo no puede ser negativo").optional().nullable(),
  payment_frequency: z.enum(["semanal", "quincenal", "mensual"]),
  benefits: z.array(z.string()).default([]),
}).refine((data) => {
  if (data.salary_min && data.salary_max) {
    return data.salary_max >= data.salary_min;
  }
  return true;
}, {
  message: "El sueldo máximo debe ser mayor o igual al mínimo",
  path: ["salary_max"],
});

// Step 3: Descripción & Requisitos
export const step3Schema = z.object({
  description: z.string().min(15, "Escribe una descripción de al menos 15 caracteres"),
  experience_required: z.string().default("Sin experiencia previa"),
  education_level: z.string().default("Indistinto"),
  skills: z.array(z.string()).default([]),
});

// Step 4: Contacto y Publicación
export const step4Schema = z.object({
  contact_phone: z.string().min(10, "Ingresa un número de WhatsApp de 10 dígitos").regex(/^[0-9+ ]+$/, "Formato de teléfono no válido"),
  contact_email: z.string().email("Correo no válido").optional().or(z.literal("")),
  preferred_contact_method: z.enum(["whatsapp", "platform", "both"]).default("whatsapp"),
  is_active: z.boolean().default(true),
});

// Complete Form Schema
export const vacancyWizardSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
}).refine((data) => {
  if (data.salary_min && data.salary_max) {
    return data.salary_max >= data.salary_min;
  }
  return true;
}, {
  message: "El sueldo máximo debe ser mayor o igual al mínimo",
  path: ["salary_max"],
});

export type VacancyWizardValues = z.infer<typeof vacancyWizardSchema>;

export const DEFAULT_WIZARD_VALUES: VacancyWizardValues = {
  title: "",
  category: "Alimentos y Bebidas",
  employment_type: "Tiempo Completo",
  shift_schedule: "Matutino (Mañana)",
  positions_available: 1,
  location: "Mérida, Yucatán",
  zone: "Centro Mérida",
  salary_min: null,
  salary_max: null,
  payment_frequency: "quincenal",
  benefits: [],
  description: "",
  experience_required: "Sin experiencia previa",
  education_level: "Indistinto",
  skills: [],
  contact_phone: "",
  contact_email: "",
  preferred_contact_method: "whatsapp",
  is_active: true,
};
