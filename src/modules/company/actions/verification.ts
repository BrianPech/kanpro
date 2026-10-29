"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  saveCompanyVerificationSchema,
  type SaveCompanyVerificationInput,
} from "../schemas/verification.schema";
import type { Database } from "@/types/supabase";

export type SaveCompanyVerificationResult =
  | { success: true; message?: string }
  | { success: false; error: string };

/**
 * Server Action para guardar datos de verificación empresarial y enviar a revisión.
 * Ejecuta validaciones estrictas y opera sobre el usuario autenticado.
 */
export async function saveCompanyVerificationAction(
  rawInput: SaveCompanyVerificationInput
): Promise<SaveCompanyVerificationResult> {
  const parsed = saveCompanyVerificationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos de verificación inválidos.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "No autorizado. Inicie sesión para guardar los datos de la empresa.",
    };
  }

  const data = parsed.data;

  try {
    const companyPayload: Database["public"]["Tables"]["company_profiles"]["Update"] = {
      updated_at: new Date().toISOString(),
    };

    if (data.legal_name !== undefined) companyPayload.legal_name = data.legal_name;
    if (data.company_name !== undefined) companyPayload.company_name = data.company_name;
    if (data.rfc !== undefined) companyPayload.rfc = data.rfc.toUpperCase().trim();
    if (data.fiscal_address !== undefined) companyPayload.fiscal_address = data.fiscal_address;
    if (data.industry !== undefined) companyPayload.industry = data.industry;
    if (data.legal_rep_name !== undefined) companyPayload.legal_rep_name = data.legal_rep_name;
    if (data.corporate_email !== undefined) companyPayload.corporate_email = data.corporate_email;
    if (data.contact_phone !== undefined) companyPayload.contact_phone = data.contact_phone;
    if (data.entity_type !== undefined || data.fiscal_regime !== undefined) {
      companyPayload.entity_type = (data.entity_type || data.fiscal_regime) as Database["public"]["Enums"]["company_entity_type"];
    }

    if (data.submitForReview) {
      companyPayload.verification_status = "pending";
    }

    const { error: companyErr } = await supabase
      .from("company_profiles")
      .update(companyPayload)
      .eq("id", user.id);

    if (companyErr) throw companyErr;

    // Sincronizar datos base del perfil
    const profilesPayload: Database["public"]["Tables"]["profiles"]["Update"] = {
      updated_at: new Date().toISOString(),
    };
    if (data.company_name) profilesPayload.full_name = data.company_name;
    if (data.fiscal_address) profilesPayload.location = data.fiscal_address;
    if (data.contact_phone) profilesPayload.whatsapp_number = data.contact_phone;
    if (data.terms_accepted) profilesPayload.terms_accepted_at = new Date().toISOString();

    await supabase.from("profiles").update(profilesPayload).eq("id", user.id);

    revalidatePath("/dashboard/company/settings/verification");
    revalidatePath("/dashboard/company/settings");
    revalidatePath("/dashboard/company");

    return {
      success: true,
      message: data.submitForReview
        ? "Expediente enviado a revisión con éxito."
        : "Avance guardado en borrador.",
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al actualizar los datos de la empresa.";
    return { success: false, error: message };
  }
}
