import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type VacancyRow = Database["public"]["Tables"]["vacancies"]["Row"];
export type VacancyInsert = Database["public"]["Tables"]["vacancies"]["Insert"];
export type VacancyUpdate = Database["public"]["Tables"]["vacancies"]["Update"];

/**
 * Contrato de acceso a datos para vacantes con aislamiento estricto por empresa.
 */
export interface VacanciesRepository {
  create(companyId: string, payload: VacancyInsert): Promise<VacancyRow>;
  update(
    companyId: string,
    vacancyId: string,
    payload: VacancyUpdate
  ): Promise<VacancyRow>;
  getById(companyId: string, vacancyId: string): Promise<VacancyRow | null>;
  listByCompany(companyId: string): Promise<VacancyRow[]>;
  delete(companyId: string, vacancyId: string): Promise<void>;
  countActive(companyId: string): Promise<number>;
}

/**
 * Implementación Supabase del repositorio de vacantes usando cliente autenticado con RLS.
 */
export class SupabaseVacanciesRepository implements VacanciesRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async create(companyId: string, payload: VacancyInsert): Promise<VacancyRow> {
    if (!companyId) {
      throw new Error("ID de empresa requerido.");
    }

    const { data, error } = await this.supabase
      .from("vacancies")
      .insert({ ...payload, company_id: companyId })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "No se pudo registrar la vacante.");
    }

    return data;
  }

  async update(
    companyId: string,
    vacancyId: string,
    payload: VacancyUpdate
  ): Promise<VacancyRow> {
    if (!companyId || !vacancyId) {
      throw new Error("Identificador de empresa y vacante requeridos.");
    }

    const safePayload: VacancyUpdate = { ...payload };
    delete safePayload.company_id;

    const { data, error } = await this.supabase
      .from("vacancies")
      .update(safePayload)
      .eq("company_id", companyId)
      .eq("id", vacancyId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "No se pudo actualizar la vacante.");
    }

    return data;
  }

  async getById(
    companyId: string,
    vacancyId: string
  ): Promise<VacancyRow | null> {
    if (!companyId || !vacancyId) {
      return null;
    }

    const { data, error } = await this.supabase
      .from("vacancies")
      .select("*")
      .eq("company_id", companyId)
      .eq("id", vacancyId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "No se pudo cargar la vacante.");
    }

    return data ?? null;
  }

  async listByCompany(companyId: string): Promise<VacancyRow[]> {
    if (!companyId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from("vacancies")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message || "No se pudieron cargar las vacantes.");
    }

    return data ?? [];
  }

  async delete(companyId: string, vacancyId: string): Promise<void> {
    if (!companyId || !vacancyId) {
      throw new Error("Identificador de empresa y vacante requeridos.");
    }

    const { error } = await this.supabase
      .from("vacancies")
      .delete()
      .eq("company_id", companyId)
      .eq("id", vacancyId);

    if (error) {
      throw new Error(error.message || "No se pudo eliminar la vacante.");
    }
  }

  async countActive(companyId: string): Promise<number> {
    if (!companyId) {
      return 0;
    }

    const { count, error } = await this.supabase
      .from("vacancies")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("is_active", true);

    if (error) {
      throw new Error(
        error.message || "No se pudo contar las vacantes activas."
      );
    }

    return count ?? 0;
  }
}
