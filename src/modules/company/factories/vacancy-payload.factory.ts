import type {
  VacancyInsert,
  VacancyRow,
  VacancyUpdate,
} from "../repositories/vacancies.repository";
import type {
  CreateExpressVacancyInput,
  VacancyWizardValues,
} from "../schemas/vacancies.schema";
import type { VacancyPreset } from "../data/vacancy-presets";

type WizardColumns = Omit<VacancyUpdate, "company_id" | "recruiter_id" | "id">;

function wizardColumns(data: VacancyWizardValues): WizardColumns {
  const description = data.description.trim();
  return {
    title: data.title.trim(),
    category: data.category,
    employment_type: data.employment_type,
    shift_schedule: data.shift_schedule,
    positions_available: data.positions_available,
    location: data.location.trim(),
    zone: data.zone.trim(),
    salary_min: data.salary_min ?? null,
    salary_max: data.salary_max ?? null,
    payment_frequency: data.payment_frequency,
    benefits: data.benefits ?? [],
    description,
    requirements: description,
    experience_required: data.experience_required,
    education_level: data.education_level,
    skills: data.skills ?? [],
    tags: data.skills ?? [],
    contact_phone: data.contact_phone?.trim() || null,
    contact_email: data.contact_email?.trim() || null,
    preferred_contact_method: data.preferred_contact_method || "whatsapp",
    is_active: Boolean(data.is_active),
    status: data.is_active ? "Activa" : "Borrador",
  };
}

/** Payload de inserción desde los valores completos del wizard. */
export function buildInsert(
  companyId: string,
  recruiterId: string,
  data: VacancyWizardValues
): VacancyInsert {
  return {
    ...wizardColumns(data),
    company_id: companyId,
    recruiter_id: recruiterId,
    title: data.title.trim(),
    category: data.category,
    employment_type: data.employment_type,
    description: data.description.trim(),
    zone: data.zone.trim(),
  };
}

/** Payload de actualización desde los valores del wizard (no reasigna tenant ni reclutador). */
export function buildUpdate(
  data: VacancyWizardValues,
  now: string = new Date().toISOString()
): VacancyUpdate {
  return { ...wizardColumns(data), updated_at: now };
}

/** Payload de vacante exprés con valores por defecto. */
export function buildExpressInsert(
  companyId: string,
  recruiterId: string,
  params: CreateExpressVacancyInput,
  companyLocation: string | null
): VacancyInsert {
  const requirements = params.requirements.trim();
  return {
    company_id: companyId,
    recruiter_id: recruiterId,
    title: params.title.trim(),
    zone: params.zone.trim(),
    category: params.category.trim(),
    requirements,
    description: requirements,
    salary_min: params.salary_min ?? null,
    salary_max: params.salary_max ?? null,
    modality: params.modality || "Presencial",
    employment_type: params.employment_type || "Tiempo Completo",
    location: companyLocation || params.zone || "Mérida, Yucatán",
    status: "Activa",
    is_active: true,
    payment_frequency: "quincenal",
    positions_available: 1,
  };
}

/** Payload de duplicado: Borrador, sufijo "(Copia)" y reclutador = usuario resuelto. */
export function buildCloneInsert(
  source: VacancyRow,
  companyId: string,
  recruiterId: string
): VacancyInsert {
  return {
    title: `${source.title} (Copia)`,
    description: source.description,
    requirements: source.requirements,
    category: source.category,
    employment_type: source.employment_type,
    shift_schedule: source.shift_schedule || "Matutino (Mañana)",
    positions_available: source.positions_available || 1,
    modality: source.modality || "Presencial",
    salary_min: source.salary_min,
    salary_max: source.salary_max,
    currency: source.currency || "MXN",
    payment_frequency: source.payment_frequency || "quincenal",
    location: source.location,
    zone: source.zone,
    experience_required: source.experience_required || "Sin experiencia previa",
    education_level: source.education_level || "Indistinto",
    benefits: source.benefits || [],
    skills: source.skills || [],
    tags: source.tags || source.skills || [],
    contact_phone: source.contact_phone || null,
    contact_email: source.contact_email || null,
    preferred_contact_method: source.preferred_contact_method || "whatsapp",
    company_id: companyId,
    recruiter_id: recruiterId,
    is_active: false,
    status: "Borrador",
  };
}

/** Pre-llena los campos del puesto con un preset; conserva ubicación y contacto. */
export function applyPreset(
  values: VacancyWizardValues,
  preset: VacancyPreset
): VacancyWizardValues {
  return {
    ...values,
    title: preset.title,
    category: preset.category,
    employment_type: preset.employment_type,
    shift_schedule: preset.shift_schedule,
    salary_min: preset.salary_min,
    salary_max: preset.salary_max,
    payment_frequency: preset.payment_frequency,
    benefits: [...preset.benefits],
    description: preset.description,
    skills: [...preset.skills],
    experience_required: preset.experience_required,
    education_level: preset.education_level,
  };
}
