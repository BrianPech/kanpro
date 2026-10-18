"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  deleteDepartmentSchema,
  createPresetDepartmentsSchema,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
  type DeleteDepartmentInput,
  type CreatePresetDepartmentsInput,
} from "../schemas/areas.schema";
import {
  CompanyAreasService,
  type DepartmentWithStats,
  type CompanyDepartmentRow,
} from "../services/company-areas";

type ActionResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never };

/**
 * Obtiene todas las áreas/departamentos de la empresa en sesión.
 */
export async function getCompanyDepartmentsAction(): Promise<
  ActionResult<DepartmentWithStats[]>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesión no válida o expirada." };
    }

    const departments = await CompanyAreasService.getCompanyDepartments(
      supabase,
      user.id
    );

    return { success: true, data: departments };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al consultar las áreas.";
    return { success: false, error: message };
  }
}

/**
 * Registra una nueva área para la empresa.
 */
export async function createDepartmentAction(
  rawInput: CreateDepartmentInput
): Promise<ActionResult<CompanyDepartmentRow>> {
  try {
    const validation = createDepartmentSchema.safeParse(rawInput);
    if (!validation.success) {
      const firstError =
        validation.error.issues[0]?.message || "Datos de área inválidos.";
      return { success: false, error: firstError };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesión no válida o expirada." };
    }

    const newDept = await CompanyAreasService.createDepartment(
      supabase,
      user.id,
      validation.data
    );

    revalidatePath("/dashboard/company/areas");
    revalidatePath("/dashboard/company/employees");
    return { success: true, data: newDept };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al crear el área.";
    return { success: false, error: message };
  }
}

/**
 * Agrega en bloque sugerencias de áreas predeterminadas.
 */
export async function createPresetDepartmentsAction(
  rawInput: CreatePresetDepartmentsInput
): Promise<ActionResult<CompanyDepartmentRow[]>> {
  try {
    const validation = createPresetDepartmentsSchema.safeParse(rawInput);
    if (!validation.success) {
      const firstError =
        validation.error.issues[0]?.message || "Selección de áreas inválida.";
      return { success: false, error: firstError };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesión no válida o expirada." };
    }

    const created = await CompanyAreasService.createPresetDepartments(
      supabase,
      user.id,
      validation.data.names
    );

    revalidatePath("/dashboard/company/areas");
    revalidatePath("/dashboard/company/employees");
    return { success: true, data: created };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al registrar áreas sugeridas.";
    return { success: false, error: message };
  }
}

/**
 * Actualiza la información de un área existente.
 */
export async function updateDepartmentAction(
  rawInput: UpdateDepartmentInput
): Promise<ActionResult<CompanyDepartmentRow>> {
  try {
    const validation = updateDepartmentSchema.safeParse(rawInput);
    if (!validation.success) {
      const firstError =
        validation.error.issues[0]?.message || "Datos de actualización inválidos.";
      return { success: false, error: firstError };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesión no válida o expirada." };
    }

    const updated = await CompanyAreasService.updateDepartment(
      supabase,
      user.id,
      validation.data
    );

    revalidatePath("/dashboard/company/areas");
    revalidatePath("/dashboard/company/employees");
    return { success: true, data: updated };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al actualizar el área.";
    return { success: false, error: message };
  }
}

/**
 * Elimina un área de la empresa (siempre que no tenga colaboradores activos).
 */
export async function deleteDepartmentAction(
  rawInput: DeleteDepartmentInput
): Promise<ActionResult<{ success: boolean; deletedName: string }>> {
  try {
    const validation = deleteDepartmentSchema.safeParse(rawInput);
    if (!validation.success) {
      return { success: false, error: "Identificador de área inválido." };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesión no válida o expirada." };
    }

    const result = await CompanyAreasService.deleteDepartment(
      supabase,
      user.id,
      validation.data.id
    );

    revalidatePath("/dashboard/company/areas");
    revalidatePath("/dashboard/company/employees");
    return { success: true, data: result };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al eliminar el área.";
    return { success: false, error: message };
  }
}
