"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  cloneVacancySchema,
  createExpressVacancySchema,
  toggleVacancyStatusSchema,
  deleteVacancySchema,
  vacancyWizardSchema,
  type CloneVacancyInput,
  type CreateExpressVacancyInput,
  type ToggleVacancyStatusInput,
  type DeleteVacancyInput,
  type VacancyWizardValues,
} from "../schemas/vacancies.schema";
import {
  CompanyVacanciesService,
  type VacancyRow,
} from "../services/company-vacancies";

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type CloneVacancyActionResult =
  | {
      success: true;
      data: { newVacancyId: string; title: string };
      newVacancyId: string;
      title: string;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      newVacancyId?: undefined;
      title?: undefined;
    };

type CreateVacancyActionResult =
  | {
      success: true;
      data: VacancyRow;
      vacancy: VacancyRow;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
      data?: undefined;
      vacancy?: undefined;
    };

/**
 * Revalida la caché de la página de gestión de vacantes y rutas públicas asociadas.
 */
export async function revalidateVacancies(): Promise<void> {
  revalidatePath("/dashboard/company/vacancies");
  revalidatePath("/dashboard/candidate/discovery");
  revalidatePath("/dashboard/company");
  revalidatePath("/");
}

/**
 * Clona una vacante existente para la empresa en estado Borrador.
 */
export async function cloneVacancyAction(
  rawInput: CloneVacancyInput | string
): Promise<CloneVacancyActionResult> {
  const inputObj =
    typeof rawInput === "string" ? { vacancyId: rawInput } : rawInput;

  const parsed = cloneVacancySchema.safeParse(inputObj);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Identificador de vacante inválido.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicia sesión para continuar." };
  }

  try {
    const result = await CompanyVacanciesService.cloneVacancy(
      supabase,
      user.id,
      parsed.data.vacancyId
    );

    await revalidateVacancies();

    return {
      success: true,
      data: result,
      newVacancyId: result.newVacancyId,
      title: result.title,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "No se pudo duplicar la vacante.";
    return { success: false, error: message };
  }
}

/**
 * Crea una vacante completa desde el asistente (wizard).
 */
export async function createVacancyAction(
  rawInput: VacancyWizardValues
): Promise<CreateVacancyActionResult> {
  const parsed = vacancyWizardSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de vacante inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicia sesión para continuar." };
  }

  try {
    const vacancy = await CompanyVacanciesService.createVacancy(
      supabase,
      user.id,
      parsed.data
    );

    await revalidateVacancies();

    return {
      success: true,
      data: vacancy,
      vacancy,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "No se pudo publicar la vacante.";
    return { success: false, error: message };
  }
}

/**
 * Crea una vacante exprés con valores por defecto.
 */
export async function createExpressVacancyAction(
  rawInput: CreateExpressVacancyInput
): Promise<CreateVacancyActionResult> {
  const parsed = createExpressVacancySchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de vacante exprés inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicia sesión para continuar." };
  }

  try {
    const vacancy = await CompanyVacanciesService.createExpressVacancy(
      supabase,
      user.id,
      parsed.data
    );

    await revalidateVacancies();

    return {
      success: true,
      data: vacancy,
      vacancy,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "No se pudo crear la vacante exprés.";
    return { success: false, error: message };
  }
}

/**
 * Pausa o activa una vacante verificando límites de suscripción.
 */
export async function toggleVacancyStatusAction(
  rawInput: ToggleVacancyStatusInput
): Promise<CreateVacancyActionResult> {
  const parsed = toggleVacancyStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Datos de cambio de estado inválidos.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicia sesión para continuar." };
  }

  try {
    const vacancy = await CompanyVacanciesService.toggleVacancyStatus(
      supabase,
      user.id,
      parsed.data.vacancyId,
      parsed.data.isActive
    );

    await revalidateVacancies();

    return {
      success: true,
      data: vacancy,
      vacancy,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "No se pudo actualizar el estado de la vacante.";
    return { success: false, error: message };
  }
}

/**
 * Elimina una vacante perteneciente a la empresa.
 */
export async function deleteVacancyAction(
  rawInput: DeleteVacancyInput | string
): Promise<ActionResponse<void>> {
  const inputObj =
    typeof rawInput === "string" ? { vacancyId: rawInput } : rawInput;

  const parsed = deleteVacancySchema.safeParse(inputObj);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message || "Identificador de vacante inválido.";
    return { success: false, error: errorMsg };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicia sesión para continuar." };
  }

  try {
    await CompanyVacanciesService.deleteVacancy(
      supabase,
      user.id,
      parsed.data.vacancyId
    );

    await revalidateVacancies();

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "No se pudo eliminar la vacante.";
    return { success: false, error: message };
  }
}
