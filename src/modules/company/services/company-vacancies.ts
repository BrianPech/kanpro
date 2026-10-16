import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  VacancyWizardValues,
  CreateExpressVacancyInput,
} from "../schemas/vacancies.schema";
import { getSubscriptionPlan } from "@/config/subscriptions";

export type VacancyRow = Database["public"]["Tables"]["vacancies"]["Row"];
export type VacancyInsert = Database["public"]["Tables"]["vacancies"]["Insert"];
export type VacancyUpdate = Database["public"]["Tables"]["vacancies"]["Update"];

export class CompanyVacanciesService {
  /**
   * Obtiene el límite máximo de vacantes activas permitido según el plan de la empresa.
   */
  public static async checkActiveVacancyLimit(
    supabase: SupabaseClient<Database>,
    companyId: string
  ): Promise<void> {
    const { data: profile } = await supabase
      .from("company_profiles")
      .select("subscription_plan")
      .eq("id", companyId)
      .maybeSingle();

    const plan = profile?.subscription_plan || "basic";
    const planConfig = getSubscriptionPlan(plan);
    const maxAllowed = planConfig.maxActiveVacancies;

    if (maxAllowed !== Infinity) {
      const { count: activeCount } = await supabase
        .from("vacancies")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true);

      if ((activeCount || 0) >= maxAllowed) {
        throw new Error(
          `Has alcanzado el límite de ${maxAllowed} vacantes activas de tu Plan ${plan.toUpperCase()}. Actualiza tu plan para activar más vacantes.`
        );
      }
    }
  }

  /**
   * Crea una vacante completa desde los datos del wizard.
   */
  public static async createVacancy(
    supabase: SupabaseClient<Database>,
    companyId: string,
    data: VacancyWizardValues
  ): Promise<VacancyRow> {
    if (data.is_active) {
      await CompanyVacanciesService.checkActiveVacancyLimit(supabase, companyId);
    }

    const payload: VacancyInsert = {
      company_id: companyId,
      recruiter_id: companyId,
      title: data.title.trim(),
      category: data.category,
      employment_type: data.employment_type,
      shift_schedule: data.shift_schedule,
      positions_available: data.positions_available,
      location: data.location.trim(),
      zone: data.zone.trim(),
      salary_min: data.salary_min != null ? data.salary_min : null,
      salary_max: data.salary_max != null ? data.salary_max : null,
      payment_frequency: data.payment_frequency,
      benefits: data.benefits || [],
      description: data.description.trim(),
      requirements: data.description.trim(),
      experience_required: data.experience_required,
      education_level: data.education_level,
      skills: data.skills || [],
      tags: data.skills || [],
      contact_phone: data.contact_phone?.trim() || null,
      contact_email: data.contact_email?.trim() || null,
      preferred_contact_method: data.preferred_contact_method || "whatsapp",
      is_active: Boolean(data.is_active),
      status: data.is_active ? "Activa" : "Borrador",
    };

    const { data: inserted, error } = await supabase
      .from("vacancies")
      .insert(payload)
      .select()
      .single();

    if (error || !inserted) {
      throw new Error(error?.message || "No se pudo registrar la vacante.");
    }

    return inserted;
  }

  /**
   * Crea una vacante exprés con valores por defecto.
   */
  public static async createExpressVacancy(
    supabase: SupabaseClient<Database>,
    companyId: string,
    params: CreateExpressVacancyInput
  ): Promise<VacancyRow> {
    await CompanyVacanciesService.checkActiveVacancyLimit(supabase, companyId);

    // Obtener ubicación de la empresa
    const { data: companyProfile } = await supabase
      .from("company_profiles")
      .select("fiscal_address")
      .eq("id", companyId)
      .maybeSingle();

    const location = companyProfile?.fiscal_address || params.zone || "Mérida, Yucatán";

    const payload: VacancyInsert = {
      company_id: companyId,
      recruiter_id: companyId,
      title: params.title.trim(),
      zone: params.zone.trim(),
      category: params.category.trim(),
      requirements: params.requirements.trim(),
      description: params.requirements.trim(),
      salary_min: params.salary_min != null ? params.salary_min : null,
      salary_max: params.salary_max != null ? params.salary_max : null,
      modality: params.modality || "Presencial",
      employment_type: params.employment_type || "Tiempo Completo",
      location,
      status: "Activa",
      is_active: true,
      payment_frequency: "quincenal",
      positions_available: 1,
    };

    const { data: inserted, error } = await supabase
      .from("vacancies")
      .insert(payload)
      .select()
      .single();

    if (error || !inserted) {
      throw new Error(error?.message || "No se pudo crear la vacante exprés.");
    }

    return inserted;
  }

  /**
   * Clona una vacante existente para la empresa en estado Borrador.
   */
  public static async cloneVacancy(
    supabase: SupabaseClient<Database>,
    companyId: string,
    vacancyId: string
  ): Promise<{ newVacancyId: string; title: string }> {
    const { data: source, error: fetchError } = await supabase
      .from("vacancies")
      .select("*")
      .eq("id", vacancyId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (fetchError || !source) {
      throw new Error("No se encontró la vacante origen para duplicar.");
    }

    const clonedTitle = `${source.title} (Copia)`;

    const clonedPayload: VacancyInsert = {
      title: clonedTitle,
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
      recruiter_id: companyId,
      is_active: false,
      status: "Borrador",
    };

    const { data: inserted, error: insertError } = await supabase
      .from("vacancies")
      .insert(clonedPayload)
      .select("id, title")
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message || "No se pudo duplicar la vacante.");
    }

    return {
      newVacancyId: inserted.id,
      title: inserted.title,
    };
  }

  /**
   * Cambia el estado activo/pausado de una vacante verificando límites si se activa.
   */
  public static async toggleVacancyStatus(
    supabase: SupabaseClient<Database>,
    companyId: string,
    vacancyId: string,
    isActive: boolean
  ): Promise<VacancyRow> {
    if (isActive) {
      await CompanyVacanciesService.checkActiveVacancyLimit(supabase, companyId);
    }

    const { data: updated, error } = await supabase
      .from("vacancies")
      .update({
        is_active: isActive,
        status: isActive ? "Activa" : "Pausada",
        updated_at: new Date().toISOString(),
      })
      .eq("id", vacancyId)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(error?.message || "No se pudo actualizar el estado de la vacante.");
    }

    return updated;
  }

  /**
   * Elimina una vacante perteneciente a la empresa.
   */
  public static async deleteVacancy(
    supabase: SupabaseClient<Database>,
    companyId: string,
    vacancyId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("vacancies")
      .delete()
      .eq("id", vacancyId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error("No se pudo eliminar la vacante.");
    }
  }

  /**
   * Obtiene la lista de vacantes creadas por la empresa.
   */
  public static async getVacancies(
    supabase: SupabaseClient<Database>,
    companyId: string
  ): Promise<VacancyRow[]> {
    const { data, error } = await supabase
      .from("vacancies")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("No se pudieron cargar las vacantes.");
    }

    return data || [];
  }
}
