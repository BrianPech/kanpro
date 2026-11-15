"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  createCompanySchema,
  switchActiveCompanySchema,
  updateOwnerNameSchema,
  ACTIVE_COMPANY_COOKIE,
  type CreateCompanyInput,
  type UpdateOwnerNameInput,
} from "../schemas/tenant.schema";
import { companyTenantService } from "../services/company-tenant.service";

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Server Action para dar de alta una nueva empresa en el panel.
 * Asigna al usuario como 'owner' y establece la empresa como activa en la cookie de sesión.
 */
export async function createCompanyAction(
  rawInput: CreateCompanyInput
): Promise<ActionResult<{ companyId: string; companyName: string }>> {
  try {
    // 1. Validar precondiciones y esquema Zod
    const parsed = createCompanySchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Datos de empresa inválidos";
      return { success: false, error: firstError };
    }

    // 2. Verificar usuario autenticado
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Debes iniciar sesión para dar de alta una empresa." };
    }

    // 3. Invocar lógica en capa Service
    const result = await companyTenantService.createCompany(user.id, parsed.data, supabase);

    // 4. Establecer como empresa activa en la cookie del navegador
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_COMPANY_COOKIE, result.companyId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 año
    });

    // 5. Revalidar vistas del panel
    revalidatePath("/dashboard/company", "layout");

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    console.error("[createCompanyAction] Error:", err);
    const message = err instanceof Error ? err.message : "Error inesperado al crear la empresa.";
    return { success: false, error: message };
  }
}

/**
 * Server Action para alternar de empresa activa dentro del panel.
 */
export async function switchCompanyAction(
  rawInput: { companyId: string }
): Promise<ActionResult<{ activeCompanyId: string }>> {
  try {
    // 1. Validar esquema Zod
    const parsed = switchActiveCompanySchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: "Identificador de empresa inválido." };
    }

    // 2. Verificar usuario autenticado
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesión expirada o no iniciada." };
    }

    // 3. Validar que el usuario sea miembro de la empresa solicitada
    const targetCompanyId = parsed.data.companyId;
    const role = await companyTenantService.verifyUserMembership(user.id, targetCompanyId, supabase);

    if (!role) {
      return { success: false, error: "No tienes permisos para acceder a esta empresa." };
    }

    // 4. Guardar selección en cookie
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_COMPANY_COOKIE, targetCompanyId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    // 5. Revalidar vistas
    revalidatePath("/dashboard/company", "layout");

    return {
      success: true,
      data: { activeCompanyId: targetCompanyId },
    };
  } catch (err: unknown) {
    console.error("[switchCompanyAction] Error:", err);
    const message = err instanceof Error ? err.message : "Error al cambiar de empresa.";
    return { success: false, error: message };
  }
}

/**
 * Server Action para que titulares de cuentas actualicen su nombre personal
 * y separen su identidad humana del nombre de la empresa.
 */
export async function updateOwnerPersonalNameAction(
  rawInput: UpdateOwnerNameInput
): Promise<ActionResult<{ fullName: string }>> {
  try {
    const parsed = updateOwnerNameSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Nombre inválido" };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesión no autenticada." };
    }

    const result = await companyTenantService.updateOwnerPersonalName(
      user.id,
      parsed.data.fullName,
      supabase
    );

    revalidatePath("/dashboard/company", "layout");
    revalidatePath("/onboarding");

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    console.error("[updateOwnerPersonalNameAction] Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al actualizar el nombre del titular.",
    };
  }
}

/**
 * Devuelve el ID y rol de la empresa activa en la sesión actual para hooks/componentes cliente.
 */
export async function getActiveCompanyContextAction(): Promise<
  ActionResult<{ companyId: string; role: string }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesión no autenticada." };
    }

    const scope = await companyTenantService.resolveActiveCompanyScope(user.id, supabase);
    return {
      success: true,
      data: scope,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "No se pudo resolver la empresa activa.",
    };
  }
}
