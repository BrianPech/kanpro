"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type AccountDeletionActionResult =
  | { success: true; message?: string; error?: undefined }
  | { success: false; error: string; message?: undefined };

/**
 * Server Action: Procesa la solicitud de cancelación de cuenta conforme a los Derechos ARCO (LFPDPPP).
 * 1. Verifica la sesión activa del solicitante.
 * 2. Registra la solicitud de auditoría en la tabla `arco_requests`.
 * 3. Marca el perfil como `suspended` con nota de `PENDING_DELETION`.
 * 4. Anonimiza datos sensibles (PII: CURP, RFC, teléfono, nombre, bio).
 * 5. Desactiva y bloquea el usuario en Supabase Auth mediante la API administrativa.
 */
export async function requestAccountDeletionAction(
  reason?: string
): Promise<AccountDeletionActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No autorizado. Inicie sesión para continuar." };
  }

  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  try {
    // 1. Obtener perfil actual para metadata de auditoría
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role, email, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const userEmail = user.email || profile?.email || "desconocido@kanpro.local";

    // 2. Registrar en la tabla de auditoría arco_requests
    const { error: arcoErr } = await adminClient
      .from("arco_requests")
      .insert({
        user_id: user.id,
        user_email: userEmail,
        request_type: "cancellation",
        reason: reason?.trim() || "Cancelación de cuenta solicitada por el usuario (Derechos ARCO).",
        status: "completed",
        metadata: {
          original_role: profile?.role || "candidate",
          requested_at: now,
          action: "account_deactivation_and_pii_anonymization",
        },
      });

    if (arcoErr) {
      console.error("[ARCO] Error registering request in arco_requests:", arcoErr);
      // No detener si la tabla aún se está migrando, pero registrar advertencia
    }

    // 3. Marcar el perfil como suspended y anonimizar datos PII
    const { error: profileErr } = await adminClient
      .from("profiles")
      .update({
        status: "suspended",
        location: "PENDING_DELETION",
        is_verified: false,
        full_name: "Usuario Eliminado (ARCO)",
        whatsapp_number: null,
        avatar_url: null,
        updated_at: now,
      })
      .eq("id", user.id);

    if (profileErr) {
      throw new Error(`Error al actualizar el perfil de usuario: ${profileErr.message}`);
    }

    // 4. Si es candidato, eliminar o anonimizar PII privada
    await adminClient
      .from("candidate_private_profiles")
      .delete()
      .eq("id", user.id);

    await adminClient
      .from("candidate_profiles")
      .update({
        bio: null,
        headline: "Cuenta dada de baja",
        portfolio_links: null,
        skills: [],
      })
      .eq("id", user.id);

    // 5. Si es empresa, revocar verificación
    await adminClient
      .from("company_profiles")
      .update({
        verification_status: "rejected",
        updated_at: now,
      })
      .eq("id", user.id);

    // 6. Invocar API administrativa para inhabilitar permanentemente el acceso del usuario
    const { error: adminAuthErr } = await adminClient.auth.admin.updateUserById(
      user.id,
      {
        ban_duration: "876000h", // 100 años (bloqueo permanente)
        user_metadata: {
          deleted: true,
          deleted_at: now,
          status: "suspended",
        },
      }
    );

    if (adminAuthErr) {
      console.warn("[ARCO] Warning disabling auth user in GoTrue:", adminAuthErr.message);
    }

    revalidatePath("/");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Tu cuenta ha sido cancelada y tus datos anonimizados conforme a los Derechos ARCO.",
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Ocurrió un error inesperado al procesar la cancelación de cuenta.";
    return { success: false, error: message };
  }
}
