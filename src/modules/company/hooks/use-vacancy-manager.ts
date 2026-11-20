import { useState, useCallback } from "react";
import type { Database } from "@/types/supabase";
import {
  createExpressVacancyAction,
  deleteVacancyAction,
  getCompanyVacanciesAction,
  toggleVacancyStatusAction,
} from "../actions/vacancies";

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

/**
 * Hook cliente para mutaciones y consultas de vacantes vía Server Actions.
 */
export function useVacancyManager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExpressVacancy = useCallback(
    async (params: CreateExpressVacancyParams): Promise<VacancyRow> => {
      setLoading(true);
      setError(null);

      try {
        const res = await createExpressVacancyAction({
          title: params.title,
          zone: params.zone,
          category: params.category,
          requirements: params.requirements,
          salary_min: params.salary_min ?? null,
          salary_max: params.salary_max ?? null,
          modality: params.modality || "Presencial",
          employment_type: params.employment_type ?? null,
        });

        if (!res.success || !res.vacancy) {
          throw new Error(
            res.error || "No se pudo recuperar la vacante creada."
          );
        }

        return res.vacancy;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Error al crear la vacante express.";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const toggleVacancyStatus = useCallback(
    async (
      vacancyId: string,
      isActive: boolean,
      nextStatus?: "Activa" | "Pausada" | "Cerrada"
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const res = await toggleVacancyStatusAction({
          vacancyId,
          isActive,
          status: nextStatus,
        });

        if (!res.success) {
          throw new Error(
            res.error || "Error al actualizar el estado de la vacante."
          );
        }

        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Error al actualizar el estado de la vacante.";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchCompanyVacancies = useCallback(async (): Promise<VacancyRow[]> => {
    setLoading(true);
    setError(null);

    try {
      const res = await getCompanyVacanciesAction();
      if (!res.success) {
        throw new Error(res.error || "Error al cargar las vacantes de la empresa.");
      }

      return res.data;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al cargar las vacantes de la empresa.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVacancy = useCallback(async (vacancyId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const res = await deleteVacancyAction(vacancyId);
      if (!res.success) {
        throw new Error(res.error || "Error al eliminar la vacante.");
      }

      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al eliminar la vacante.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createExpressVacancy,
    toggleVacancyStatus,
    fetchCompanyVacancies,
    deleteVacancy,
    loading,
    error,
  };
}
