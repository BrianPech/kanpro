"use server";

import crypto from "crypto";
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

function getImpersonationSecret(): string {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.IMPERSONATION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("Configuración inválida: AUTH_SECRET es requerido para firmar sesiones de impersonación.");
  }

  return secret || "kanpro-dev-impersonation-hmac-secret";
}

function computeImpersonationSignature(
  adminUserId: string,
  targetUserId: string,
  targetUserRole: string
): string {
  return crypto
    .createHmac("sha256", getImpersonationSecret())
    .update(`${adminUserId}:${targetUserId}:${targetUserRole}`)
    .digest("hex");
}

function verifyImpersonationSignature(
  adminUserId: string,
  targetUserId: string,
  targetUserRole: string,
  signature: string | undefined
): boolean {
  if (!signature) return false;
  const expected = computeImpersonationSignature(adminUserId, targetUserId, targetUserRole);
  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
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

  // 2. Verificar rol y estado activo de administrador
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminProfile || adminProfile.role !== "admin" || adminProfile.status === "suspended") {
    throw new Error("Acceso denegado: Solo los administradores activos pueden impersonar usuarios.");
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

  if (targetProfile.role === "admin") {
    throw new Error("Acceso denegado: No está permitido suplantar a usuarios con rol de administrador.");
  }

  const resolvedRole: "candidate" | "company" =
    targetProfile.role === "company" ? "company" : "candidate";

  const signature = computeImpersonationSignature(user.id, targetProfile.id, resolvedRole);

  // 4. Guardar cookies de impersonación firmadas con HMAC-SHA256
  const cookieStore = await cookies();
  const maxAge = 60 * 60 * 2; // 2 horas de token temporal de soporte

  cookieStore.set("kanpro_impersonate_user_id", targetProfile.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  cookieStore.set("kanpro_impersonate_sig", signature, {
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

  cookieStore.set("kanpro_impersonate_user_role", resolvedRole, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  revalidatePath("/", "layout");

  // Redirigir a la vista según el rol del usuario impersonado
  const redirectUrl =
    resolvedRole === "company" ? "/dashboard/company" : "/dashboard/candidate";

  return { success: true, redirectUrl, targetName: targetProfile.full_name };
}

/**
 * Detiene la impersonación activa y regresa la sesión al panel de administración.
 */
export async function stopImpersonating() {
  const cookieStore = await cookies();

  cookieStore.delete("kanpro_impersonate_user_id");
  cookieStore.delete("kanpro_impersonate_sig");
  cookieStore.delete("kanpro_impersonate_user_name");
  cookieStore.delete("kanpro_impersonate_user_email");
  cookieStore.delete("kanpro_impersonate_user_role");

  revalidatePath("/", "layout");
  return { success: true, redirectUrl: "/dashboard/admin" };
}

/**
 * Obtiene el estado actual de impersonación (si existe una cookie activa y firmada válidamente).
 */
export async function getImpersonationState(): Promise<ImpersonationState> {
  const cookieStore = await cookies();
  const rawTargetUserId = cookieStore.get("kanpro_impersonate_user_id")?.value;
  const cookieSig = cookieStore.get("kanpro_impersonate_sig")?.value;
  const targetUserName = cookieStore.get("kanpro_impersonate_user_name")?.value;
  const targetUserEmail = cookieStore.get("kanpro_impersonate_user_email")?.value;
  const targetUserRole = (cookieStore.get("kanpro_impersonate_user_role")?.value || "candidate") as
    | "candidate"
    | "company"
    | "admin";

  if (!rawTargetUserId || targetUserRole === "admin") {
    return { isImpersonating: false };
  }

  let targetUserId = rawTargetUserId;
  let signature = cookieSig;

  if (!signature && rawTargetUserId.includes(".")) {
    const [parsedId, parsedSig] = rawTargetUserId.split(".");
    if (parsedId && parsedSig) {
      targetUserId = parsedId;
      signature = parsedSig;
    }
  }

  // Verificar que el usuario original siga siendo admin activo
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isImpersonating: false };
  }

  if (!verifyImpersonationSignature(user.id, targetUserId, targetUserRole, signature)) {
    return { isImpersonating: false };
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminProfile || adminProfile.role !== "admin" || adminProfile.status === "suspended") {
    return { isImpersonating: false };
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetProfile?.role === "admin") {
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
