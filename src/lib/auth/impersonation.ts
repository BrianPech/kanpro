"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export interface ImpersonationState {
  isImpersonating: boolean;
  targetUserId?: string;
  targetUserName?: string;
  targetUserEmail?: string;
  targetUserRole?: "candidate" | "company" | "admin";
}

/**
 * Inicia la impersonación de un usuario (candidato o empresa) por parte de un administrador.
 */
export async function startImpersonating(targetUserId: string) {
  const supabase = await createClient();

  // 1. Verificar autenticación del administrador
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado. Por favor inicie sesión.");
  }

  // 2. Verificar rol de administrador
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminProfile || adminProfile.role !== "admin") {
    throw new Error("Acceso denegado: Solo los administradores pueden impersonar usuarios.");
  }

  // 3. Obtener perfil del usuario objetivo
  const { data: targetProfile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (error || !targetProfile) {
    throw new Error("No se encontró el perfil del usuario a impersonar.");
  }

  // 4. Guardar cookies de impersonación seguras
  const cookieStore = await cookies();
  const maxAge = 60 * 60 * 2; // 2 horas de token temporal de soporte

  cookieStore.set("kanpro_impersonate_user_id", targetProfile.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  cookieStore.set("kanpro_impersonate_user_name", targetProfile.full_name || "Usuario", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  cookieStore.set("kanpro_impersonate_user_email", targetProfile.email || "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  cookieStore.set("kanpro_impersonate_user_role", targetProfile.role || "candidate", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  revalidatePath("/", "layout");

  // Redirigir a la vista según el rol del usuario impersonado
  const redirectUrl =
    targetProfile.role === "company"
      ? "/dashboard/company"
      : targetProfile.role === "admin"
      ? "/dashboard/admin"
      : "/dashboard/candidate";

  return { success: true, redirectUrl, targetName: targetProfile.full_name };
}

/**
 * Detiene la impersonación activa y regresa la sesión al panel de administración.
 */
export async function stopImpersonating() {
  const cookieStore = await cookies();

  cookieStore.delete("kanpro_impersonate_user_id");
  cookieStore.delete("kanpro_impersonate_user_name");
  cookieStore.delete("kanpro_impersonate_user_email");
  cookieStore.delete("kanpro_impersonate_user_role");

  revalidatePath("/", "layout");
  return { success: true, redirectUrl: "/dashboard/admin" };
}

/**
 * Obtiene el estado actual de impersonación (si existe una cookie activa).
 */
export async function getImpersonationState(): Promise<ImpersonationState> {
  const cookieStore = await cookies();
  const targetUserId = cookieStore.get("kanpro_impersonate_user_id")?.value;
  const targetUserName = cookieStore.get("kanpro_impersonate_user_name")?.value;
  const targetUserEmail = cookieStore.get("kanpro_impersonate_user_email")?.value;
  const targetUserRole = cookieStore.get("kanpro_impersonate_user_role")?.value as
    | "candidate"
    | "company"
    | "admin"
    | undefined;

  if (!targetUserId) {
    return { isImpersonating: false };
  }

  // Verificar que el usuario original siga siendo admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isImpersonating: false };
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminProfile || adminProfile.role !== "admin") {
    return { isImpersonating: false };
  }

  return {
    isImpersonating: true,
    targetUserId,
    targetUserName,
    targetUserEmail,
    targetUserRole,
  };
}
