"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  companyTenantService,
  isCompanyAdminRole,
  isValidUuid,
} from "../services/company-tenant.service";
import {
  toggleGlobalRecruitmentSchema,
  updateContactChannelSchema,
  updateSubscriptionPlanSchema,
  updateCompanyBranchesSchema,
  getCompanyInvoicesSchema,
  updateCompanyAccountPhoneSchema,
  type BranchGeofenceInput,
} from "../schemas/settings.schema";
import {
  CompanySettingsService,
  type CompanyInvoiceRecord,
} from "../services/company-settings";

interface SettingsActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Toggles recruitment status (is_active) for all vacancies belonging to a company.
 */
export async function toggleGlobalRecruitment(
  companyId: string,
  pause: boolean
): Promise<SettingsActionResult> {
  const parsed = toggleGlobalRecruitmentSchema.safeParse({ companyId, pause });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Parámetros inválidos.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  const membershipRole = await companyTenantService.verifyUserMembership(user.id, companyId, supabase);
  if (!isCompanyAdminRole(membershipRole)) {
    return {
      success: false,
      error: "No tienes permisos para modificar la configuración de esta empresa.",
    };
  }

  try {
    await CompanySettingsService.toggleGlobalRecruitment(
      supabase,
      companyId,
      parsed.data.pause
    );

    revalidatePath("/dashboard/company/settings");
    revalidatePath("/dashboard/candidate/discovery");
    revalidatePath("/dashboard/company/vacancies");
    revalidatePath("/");

    return { success: true };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "No se pudo actualizar el estado de reclutamiento.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Updates the preferred contact channel for a company profile.
 */
export async function updateContactChannel(
  companyId: string,
  channel: string
): Promise<SettingsActionResult> {
  const parsed = updateContactChannelSchema.safeParse({ companyId, channel });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Canal de contacto inválido.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  const membershipRole = await companyTenantService.verifyUserMembership(user.id, companyId, supabase);
  if (!isCompanyAdminRole(membershipRole)) {
    return {
      success: false,
      error: "No tienes permisos para modificar la configuración de esta empresa.",
    };
  }

  try {
    await CompanySettingsService.updateContactChannel(
      supabase,
      companyId,
      parsed.data.channel
    );

    revalidatePath("/dashboard/company/settings");

    return { success: true };
  } catch (err) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "No se pudo actualizar el canal de contacto preferido.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Updates the subscription plan for a company and generates a billing invoice record.
 */
export async function updateSubscriptionPlan(
  companyId: string,
  plan: "basic" | "pro" | "enterprise"
): Promise<SettingsActionResult> {
  const parsed = updateSubscriptionPlanSchema.safeParse({ companyId, plan });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Plan de suscripción inválido.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  const membershipRole = await companyTenantService.verifyUserMembership(user.id, companyId, supabase);
  if (!isCompanyAdminRole(membershipRole)) {
    return {
      success: false,
      error: "No tienes permisos para modificar la suscripción de esta empresa.",
    };
  }

  if (parsed.data.plan !== "basic") {
    return {
      success: false,
      error:
        "Las actualizaciones a planes de pago (Pro / Enterprise) requieren un pago verificado por la pasarela de facturación.",
    };
  }

  try {
    await CompanySettingsService.updateSubscriptionPlan(
      supabase,
      companyId,
      parsed.data.plan
    );

    revalidatePath("/dashboard/company/settings");
    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/company/vacancies");

    return { success: true };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "No se pudo actualizar el plan de suscripción.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Saves and updates branches with geofencing coordinates for a company.
 */
export async function updateCompanyBranchesAction(
  companyId: string,
  branches: BranchGeofenceInput[]
): Promise<SettingsActionResult<{ count: number; branches: BranchGeofenceInput[] }>> {
  const parsed = updateCompanyBranchesSchema.safeParse({ companyId, branches });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos de sucursales inválidos.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  const membershipRole = await companyTenantService.verifyUserMembership(user.id, companyId, supabase);
  if (!isCompanyAdminRole(membershipRole)) {
    return {
      success: false,
      error: "No tienes permisos para modificar las sucursales de esta empresa.",
    };
  }

  try {
    const result = await CompanySettingsService.updateCompanyBranches(
      supabase,
      companyId,
      parsed.data.branches
    );

    revalidatePath("/dashboard/company/settings");
    revalidatePath("/dashboard/company/attendance");

    return {
      success: true,
      data: {
        count: result.count,
        branches: result.branches,
      },
    };
  } catch (err) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : "No se pudo actualizar la configuración de sucursales.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Fetches billing invoices for a company.
 */
export async function getCompanyInvoices(companyId: string): Promise<CompanyInvoiceRecord[]> {
  const parsed = getCompanyInvoicesSchema.safeParse({ companyId });
  if (!parsed.success || !isValidUuid(parsed.data.companyId)) {
    throw new Error("Identificador de empresa inválido.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  const membershipRole = await companyTenantService.verifyUserMembership(
    user.id,
    parsed.data.companyId,
    supabase
  );
  if (!isCompanyAdminRole(membershipRole)) {
    throw new Error("No tienes permisos para consultar las facturas de esta empresa.");
  }

  return await CompanySettingsService.getCompanyInvoices(supabase, parsed.data.companyId);
}

/**
 * Fetches branches and geofences configured for a company.
 */
export async function getCompanyBranches(companyId: string): Promise<BranchGeofenceInput[]> {
  if (!isValidUuid(companyId)) {
    throw new Error("Identificador de empresa inválido.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.");
  }

  const membershipRole = await companyTenantService.verifyUserMembership(
    user.id,
    companyId,
    supabase
  );
  if (!isCompanyAdminRole(membershipRole)) {
    throw new Error("No tienes permisos para consultar las sucursales de esta empresa.");
  }

  return await CompanySettingsService.getCompanyBranches(supabase, companyId);
}

/**
 * Updates the contact phone for the active company and syncs the owner profile WhatsApp number.
 */
export async function updateCompanyAccountPhone(
  companyId: string,
  phone: string
): Promise<SettingsActionResult<{ phone: string }>> {
  const parsed = updateCompanyAccountPhoneSchema.safeParse({ companyId, phone });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Teléfono inválido.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  const membershipRole = await companyTenantService.verifyUserMembership(user.id, companyId, supabase);
  if (!isCompanyAdminRole(membershipRole)) {
    return {
      success: false,
      error: "No tienes permisos para actualizar el teléfono de esta empresa.",
    };
  }

  try {
    const result = await CompanySettingsService.updateAccountPhone(
      supabase,
      user.id,
      parsed.data.companyId,
      parsed.data.phone
    );

    revalidatePath("/dashboard/company/settings");
    revalidatePath("/dashboard/company/profile");

    return { success: true, data: { phone: result.phone } };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "No se pudo actualizar el teléfono.";
    return { success: false, error: errorMsg };
  }
}
