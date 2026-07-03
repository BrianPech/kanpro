import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

export type VacancyRow = Database["public"]["Tables"]["vacancies"]["Row"];

export interface CreateExpressVacancyParams {
  title: string;
  zone: string;
  category: string;
  requirements: string;
  salary_range?: string | null;
  modality?: string;
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

      // Insertar en la tabla vacancies. Los triggers de base de datos se encargan de
      // sincronizar las columnas duplicadas de compatibilidad (location, requirements, etc).
      const { data, error: insertError } = await supabase
        .from("vacancies")
        .insert({
          company_id: user.id,
          recruiter_id: user.id,
          title: params.title,
          zone: params.zone,
          category: params.category,
          requirements: params.requirements,
          description: params.requirements, // Requerido en base de datos
          salary_range: params.salary_range || null,
          modality: params.modality || "Presencial",
          status: "Activa",
          is_active: true,
        })
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

  return {
    createExpressVacancy,
    toggleVacancyStatus,
    fetchCompanyVacancies,
    loading,
    error,
  };
}
