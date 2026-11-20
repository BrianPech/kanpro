import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type {
  VacancyWizardValues,
  CreateExpressVacancyInput,
} from "../schemas/vacancies.schema";
import { getSubscriptionPlan } from "@/config/subscriptions";
import { GEO_CONFIG } from "@/config/geo";
import { parseLocation } from "@/lib/formatters";
import {
  SupabaseVacanciesRepository,
  type VacanciesRepository,
  type VacancyRow,
  type VacancyInsert,
  type VacancyUpdate,
} from "../repositories/vacancies.repository";
import {
  buildInsert,
  buildUpdate,
  buildExpressInsert,
  buildCloneInsert,
} from "../factories/vacancy-payload.factory";

export type { VacancyRow, VacancyInsert, VacancyUpdate };

export type VacancyWithApplicantCount = VacancyRow & {
  applicants_count: number;
};

export type VacancyStatusValue = "Activa" | "Pausada" | "Cerrada";

export interface VacancyWizardCompanyPrefill {
  company_name: string;
  contact_phone: string | null;
  fiscal_address: string | null;
  address_details: string | null;
  logo_url: string | null;
  verification_status: string | null;
  subscription_plan: string | null;
  resolvedCity: string;
  resolvedZone: string;
  resolvedLocation: string;
}

export interface VacancyDetailData {
  vacancy: VacancyRow;
  applicantsCount: number;
  companyName: string;
  companyLocation: string;
}

export interface VacancyManagerProfileSummary {
  company_name: string;
  phone: string;
  logo_url: string | null;
  location: string;
  is_validated: boolean;
}

/**
 * Servicio de dominio para gestión de vacantes de empresa.
 */
export class CompanyVacanciesService {
  private readonly repository: VacanciesRepository;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    repository?: VacanciesRepository
  ) {
    this.repository = repository ?? new SupabaseVacanciesRepository(supabase);
  }

  /**
   * Verifica si la empresa puede activar una vacante adicional según su plan.
   */
  public async checkActiveVacancyLimit(companyId: string): Promise<void> {
    const { data: profile } = await this.supabase
      .from("company_profiles")
      .select("subscription_plan")
      .eq("id", companyId)
      .maybeSingle();

    const plan = profile?.subscription_plan || "basic";
    const planConfig = getSubscriptionPlan(plan);
    const maxAllowed = planConfig.maxActiveVacancies;

    if (maxAllowed === Infinity) {
      return;
    }

    const activeCount = await this.repository.countActive(companyId);
    if (activeCount >= maxAllowed) {
      throw new Error(
        `Has alcanzado el límite de ${maxAllowed} vacantes activas de tu Plan ${plan.toUpperCase()}. Actualiza tu plan para activar más vacantes.`
      );
    }
  }

  /**
   * Crea una vacante completa desde los datos del wizard.
   */
  public async createVacancy(
    companyId: string,
    data: VacancyWizardValues,
    recruiterId: string = companyId
  ): Promise<VacancyRow> {
    if (data.is_active) {
      await this.checkActiveVacancyLimit(companyId);
    }

    const payload = buildInsert(companyId, recruiterId, data);
    return this.repository.create(companyId, payload);
  }

  /**
   * Actualiza una vacante existente garantizando pertenencia a la empresa.
   * Solo valida límite de plan cuando la vacante pasa de inactiva a activa.
   */
  public async updateVacancy(
    companyId: string,
    vacancyId: string,
    data: VacancyWizardValues
  ): Promise<VacancyRow> {
    const payload = buildUpdate(data);

    if (Boolean(payload.is_active)) {
      const currentVacancy = await this.repository.getById(companyId, vacancyId);
      if (!currentVacancy) {
        throw new Error("No se pudo actualizar la vacante.");
      }
      if (!currentVacancy.is_active) {
        await this.checkActiveVacancyLimit(companyId);
      }
    }

    return this.repository.update(companyId, vacancyId, payload);
  }

  /**
   * Crea una vacante exprés con valores por defecto.
   */
  public async createExpressVacancy(
    companyId: string,
    params: CreateExpressVacancyInput,
    recruiterId: string = companyId
  ): Promise<VacancyRow> {
    await this.checkActiveVacancyLimit(companyId);

    const { data: companyProfile } = await this.supabase
      .from("company_profiles")
      .select("fiscal_address")
      .eq("id", companyId)
      .maybeSingle();

    const payload = buildExpressInsert(
      companyId,
      recruiterId,
      params,
      companyProfile?.fiscal_address ?? null
    );
    return this.repository.create(companyId, payload);
  }

  /**
   * Clona una vacante existente para la empresa en estado Borrador.
   */
  public async cloneVacancy(
    companyId: string,
    vacancyId: string,
    recruiterId: string = companyId
  ): Promise<{ newVacancyId: string; title: string }> {
    const source = await this.repository
      .getById(companyId, vacancyId)
      .catch(() => null);

    if (!source) {
      throw new Error("No se encontró la vacante origen para duplicar.");
    }

    const clonedPayload = buildCloneInsert(source, companyId, recruiterId);
    const inserted = await this.repository.create(companyId, clonedPayload);

    return {
      newVacancyId: inserted.id,
      title: inserted.title,
    };
  }

  /**
   * Cambia el estado activo/pausado/cerrado de una vacante.
   * Valida límite de plan únicamente en la transición false -> true.
   */
  public async toggleVacancyStatus(
    companyId: string,
    vacancyId: string,
    isActive: boolean,
    nextStatus?: VacancyStatusValue
  ): Promise<VacancyRow> {
    if (isActive) {
      const currentVacancy = await this.repository.getById(companyId, vacancyId);
      if (!currentVacancy?.is_active) {
        await this.checkActiveVacancyLimit(companyId);
      }
    }

    return this.repository.update(companyId, vacancyId, {
      is_active: isActive,
      status: nextStatus ?? (isActive ? "Activa" : "Pausada"),
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Elimina una vacante perteneciente a la empresa.
   */
  public async deleteVacancy(
    companyId: string,
    vacancyId: string
  ): Promise<void> {
    await this.repository.delete(companyId, vacancyId);
  }

  /**
   * Obtiene la lista de vacantes creadas por la empresa.
   */
  public async getVacancies(companyId: string): Promise<VacancyRow[]> {
    return this.repository.listByCompany(companyId);
  }

  /**
   * Obtiene una vacante por ID verificando pertenencia a la empresa.
   */
  public async getVacancyById(
    companyId: string,
    vacancyId: string
  ): Promise<VacancyRow | null> {
    return this.repository.getById(companyId, vacancyId);
  }

  /**
   * Obtiene las vacantes de la empresa enriquecidas con el conteo de postulaciones.
   */
  public async getVacanciesWithCounts(
    companyId: string
  ): Promise<VacancyWithApplicantCount[]> {
    const vacancies = await this.repository.listByCompany(companyId);

    if (vacancies.length === 0) {
      return [];
    }

    const vacancyIds = vacancies.map((vacancy) => vacancy.id);
    const { data: appRows, error: appError } = await this.supabase
      .from("applications")
      .select("vacancy_id")
      .in("vacancy_id", vacancyIds);

    if (appError) {
      throw new Error(
        appError.message || "No se pudieron cargar los conteos de postulaciones."
      );
    }

    const countsByVacancy = (appRows ?? []).reduce<Map<string, number>>(
      (acc, row) => {
        if (row.vacancy_id) {
          acc.set(row.vacancy_id, (acc.get(row.vacancy_id) ?? 0) + 1);
        }
        return acc;
      },
      new Map()
    );

    return vacancies.map((vacancy) => ({
      ...vacancy,
      applicants_count: countsByVacancy.get(vacancy.id) ?? 0,
    }));
  }

  /**
   * Obtiene los datos de empresa y usuario para pre-llenar el wizard en servidor.
   */
  public async getWizardCompanyPrefill(
    companyId: string,
    userId: string
  ): Promise<VacancyWizardCompanyPrefill | null> {
    if (!companyId || !userId) {
      return null;
    }

    const [compRes, profRes] = await Promise.all([
      this.supabase
        .from("company_profiles")
        .select(
          "company_name, contact_phone, fiscal_address, address_details, logo_url, verification_status, subscription_plan"
        )
        .eq("id", companyId)
        .maybeSingle(),
      this.supabase
        .from("profiles")
        .select("location, full_name, whatsapp_number")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    const comp = compRes.data;
    const prof = profRes.data;

    if (!comp && !prof) {
      return null;
    }

    const rawLoc =
      comp?.fiscal_address || comp?.address_details || prof?.location;
    const parsed = parseLocation(rawLoc);
    const cleanCity = parsed.city || "Mérida";
    const cleanZone =
      parsed.zone || (cleanCity === "Mérida" ? "Centro Mérida" : "Centro");
    const stateName = GEO_CONFIG[cleanCity]?.state;
    const resolvedLocation = stateName
      ? `${cleanCity}, ${stateName === "Quintana Roo" ? "Q. Roo" : stateName}`
      : rawLoc?.trim() || cleanCity;

    return {
      company_name: comp?.company_name || prof?.full_name || "Tu Empresa",
      contact_phone: comp?.contact_phone ?? null,
      fiscal_address: comp?.fiscal_address ?? null,
      address_details: comp?.address_details ?? null,
      logo_url: comp?.logo_url ?? null,
      verification_status: comp?.verification_status ?? null,
      subscription_plan: comp?.subscription_plan ?? null,
      resolvedCity: cleanCity,
      resolvedZone: cleanZone,
      resolvedLocation,
    };
  }

  /**
   * Obtiene el detalle completo de una vacante de la empresa con postulaciones y datos corporativos.
   */
  public async getVacancyDetail(
    companyId: string,
    vacancyId: string
  ): Promise<VacancyDetailData | null> {
    const vacancy = await this.repository.getById(companyId, vacancyId);
    if (!vacancy) {
      return null;
    }

    const targetCompanyId = vacancy.company_id || companyId;
    const [appCountRes, compRes, baseProfRes] = await Promise.all([
      this.supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("vacancy_id", vacancy.id),
      this.supabase
        .from("company_profiles")
        .select("company_name, fiscal_address, address_details")
        .eq("id", targetCompanyId)
        .maybeSingle(),
      this.supabase
        .from("profiles")
        .select("full_name, location")
        .eq("id", targetCompanyId)
        .maybeSingle(),
    ]);

    const compProfile = compRes.data;
    const baseProfile = baseProfRes.data;
    const resolvedName =
      compProfile?.company_name &&
      compProfile.company_name.trim() !== "" &&
      compProfile.company_name.trim() !== "Nueva Empresa"
        ? compProfile.company_name
        : baseProfile?.full_name || "Empresa K'anPro";

    return {
      vacancy,
      applicantsCount: appCountRes.count ?? 0,
      companyName: resolvedName,
      companyLocation:
        compProfile?.fiscal_address ||
        compProfile?.address_details ||
        baseProfile?.location ||
        "",
    };
  }

  /**
   * Obtiene el resumen de perfil de empresa para el encabezado del gestor de vacantes.
   */
  public async getManagerProfileSummary(
    companyId: string,
    userId: string
  ): Promise<VacancyManagerProfileSummary> {
    const [baseRes, compRes] = await Promise.all([
      this.supabase
        .from("profiles")
        .select("full_name, location")
        .eq("id", userId)
        .maybeSingle(),
      this.supabase
        .from("company_profiles")
        .select(
          "company_name, contact_phone, fiscal_address, logo_url, verification_status"
        )
        .eq("id", companyId)
        .maybeSingle(),
    ]);

    const baseProfile = baseRes.data;
    const compProfile = compRes.data;

    return {
      company_name: compProfile?.company_name || baseProfile?.full_name || "",
      phone: compProfile?.contact_phone || "configurado",
      logo_url: compProfile?.logo_url || null,
      location: compProfile?.fiscal_address || baseProfile?.location || "",
      is_validated: compProfile?.verification_status === "approved",
    };
  }
}
