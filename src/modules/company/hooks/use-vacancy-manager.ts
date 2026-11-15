import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getActiveCompanyContextAction } from "../actions/tenant-actions";
import type { Database } from "@/types/supabase";

export type VacancyRow = Database["public"]["Tables"]["vacancies"]["Row"];

export interface CreateExpressVacancyParams {
  title: string;
  zone: string;
  category: string;
  requirements: string;
  salary_min?: number | null;
  salary_max?: number | null;
  modality?: string;
  employment_type?: string | null;
}

export function useVacancyManager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  /**
   * Crea una vacante exprés asociada al reclutador actual.
   */
  const createExpressVacancy = useCallback(async (params: CreateExpressVacancyParams): Promise<VacancyRow> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Debe iniciar sesión como empresa para publicar ofertas.");
      }

      const scopeRes = await getActiveCompanyContextAction();
      const companyScopeId = scopeRes.success ? scopeRes.data.companyId : user.id;

      // Fetch company profile & subscription plan
      const { data: companyProfile, error: profileError } = await supabase
        .from("company_profiles")
        .select("fiscal_address, subscription_plan" as any)
        .eq("id", companyScopeId)
        .maybeSingle();

      const cp = companyProfile as any;
      let companyLocation = cp?.fiscal_address || null;

      if (profileError || !companyLocation) {
        const { data: generalProfile } = await supabase
          .from("profiles")
          .select("location")
          .eq("id", user.id)
          .maybeSingle();
        companyLocation = generalProfile?.location || null;
      }

      if (!companyLocation) {
        companyLocation = "Mérida - Centro";
      }

      // Check active vacancy count limit for company's plan
      const plan = cp?.subscription_plan || "basic";
      let maxAllowed = 3;
      if (plan === "pro") maxAllowed = 15;
      if (plan === "enterprise") maxAllowed = Infinity;

      if (maxAllowed !== Infinity) {
        const { count: activeCount } = await supabase
          .from("vacancies")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyScopeId)
          .eq("is_active", true);

        if ((activeCount || 0) >= maxAllowed) {
          throw new Error(`Has alcanzado el límite de ${maxAllowed} vacantes activas de tu Plan ${plan.toUpperCase()}. Actualiza a Plan PRO o Corporativo en Configuración para activar más vacantes.`);
        }
      }

      // Insertar en la tabla vacancies. Los triggers de base de datos se encargan de
      // sincronizar las columnas duplicadas de compatibilidad (location, requirements, etc).
      const { data, error: insertError } = await supabase
        .from("vacancies")
        .insert({
          company_id: companyScopeId,
          recruiter_id: user.id,
          title: params.title,
          zone: params.zone,
          category: params.category,
          requirements: params.requirements,
          description: params.requirements, // Requerido en base de datos
          salary_min: params.salary_min !== undefined ? params.salary_min : null,
          salary_max: params.salary_max !== undefined ? params.salary_max : null,
          modality: params.modality || "Presencial",
          status: "Activa",
          is_active: true,
          location: companyLocation, // Inyección automática para evitar el not-null constraint
          employment_type: params.employment_type || null, // Tipo de Jornada
        } as any)
        .select()
        .single();

      if (insertError || !data) {
        throw new Error(insertError?.message || "No se pudo recuperar la vacante creada.");
      }

      return data as VacancyRow;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al crear la vacante express.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /**
   * Cambia el estado de una vacante (Métrica Norte de Vacante Cubierta).
   */
  const toggleVacancyStatus = useCallback(async (vacancyId: string, isActive: boolean): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      if (isActive) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const scopeRes = await getActiveCompanyContextAction();
          const companyScopeId = scopeRes.success ? scopeRes.data.companyId : user.id;

          const { data: compProfile } = await supabase
            .from("company_profiles")
            .select("subscription_plan")
            .eq("id", companyScopeId)
            .maybeSingle();

          const plan = compProfile?.subscription_plan || "basic";
          let maxAllowed = 3;
          if (plan === "pro") maxAllowed = 15;
          if (plan === "enterprise") maxAllowed = Infinity;

          if (maxAllowed !== Infinity) {
            const { count: activeCount } = await supabase
              .from("vacancies")
              .select("id", { count: "exact", head: true })
              .eq("company_id", companyScopeId)
              .eq("is_active", true);

            if ((activeCount || 0) >= maxAllowed) {
              throw new Error(`Has alcanzado el límite de ${maxAllowed} vacantes activas de tu Plan ${plan.toUpperCase()}. Actualiza tu suscripción en Configuración para activar más ofertas.`);
            }
          }
        }
      }

      const { error: updateError } = await supabase
        .from("vacancies")
        .update({
          is_active: isActive,
          status: isActive ? "Activa" : "Cerrada", // La sincronización en BD actualiza la columna equivalente
        })
        .eq("id", vacancyId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return true;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al actualizar el estado de la vacante.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /**
   * Obtiene la lista de vacantes creadas por el reclutador/empresa autenticado.
   */
  const fetchCompanyVacancies = useCallback(async (): Promise<VacancyRow[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Debe iniciar sesión para ver sus vacantes.");
      }

      const { data, error: selectError } = await supabase
        .from("vacancies")
        .select("*")
        .eq("recruiter_id", user.id)
        .order("created_at", { ascending: false });

      if (selectError) {
        throw new Error(selectError.message);
      }

      return (data || []) as VacancyRow[];
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar las vacantes de la empresa.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /**
   * Elimina una vacante por ID.
   */
  const deleteVacancy = useCallback(async (vacancyId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("vacancies")
        .delete()
        .eq("id", vacancyId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      return true;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al eliminar la vacante.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /**
   * Actualiza una vacante por ID.
   */
  const updateVacancy = useCallback(async (vacancyId: string, payload: Partial<VacancyRow>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("vacancies")
        .update(payload)
        .eq("id", vacancyId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return true;
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al actualizar la vacante.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return {
    createExpressVacancy,
    toggleVacancyStatus,
    fetchCompanyVacancies,
    deleteVacancy,
    updateVacancy,
    loading,
    error,
  };
}
