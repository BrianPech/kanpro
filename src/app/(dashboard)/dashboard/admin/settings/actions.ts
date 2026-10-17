"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Json } from "@/types/supabase";

export async function requireAdminAuth() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado. Por favor inicie sesión.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    throw new Error("Acceso denegado: Se requieren permisos de administrador.");
  }

  return { supabase, user };
}

export type SystemSettingsMap = {
  general?: {
    appName: string;
    language: string;
    timezone: string;
    currency: string;
  };
  security?: {
    require2FA: boolean;
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
  };
  notifications?: {
    candidateDailyDigest: boolean;
    slaAlerts: boolean;
    systemNotificationEmail: string;
  };
  privacy?: {
    cvRetentionMonths: number;
    autoAnonymizeRejected: boolean;
  };
  [key: string]: any;
};

export async function getSystemSettings(): Promise<SystemSettingsMap> {
  const { supabase } = await requireAdminAuth();

  const { data, error } = await supabase
    .from("system_settings")
    .select("key, value");

  if (error) {
    throw new Error(`Error al obtener configuración del sistema: ${error.message}`);
  }

  const result: SystemSettingsMap = {};
  if (data) {
    for (const item of data) {
      result[item.key] = item.value;
    }
  }

  return result;
}

export const systemSettingsSchema = z.record(
  z.string().min(1, "La clave de configuración no puede estar vacía").max(100),
  z.unknown()
);

export async function saveSystemSettings(settings: Record<string, unknown>) {
  const { supabase, user } = await requireAdminAuth();

  const parsed = systemSettingsSchema.safeParse(settings);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Configuración del sistema inválida.");
  }

  const entries = Object.entries(parsed.data);
  const now = new Date().toISOString();

  for (const [key, value] of entries) {
    const { error } = await supabase
      .from("system_settings")
      .upsert(
        {
          key,
          value: value as NonNullable<Json>,
          updated_at: now,
          updated_by: user.id,
        },
        { onConflict: "key" }
      );

    if (error) {
      console.error(`[AdminSettings] Error saving setting [${key}]:`, error);
      throw new Error(`Error al guardar configuración [${key}]. Operación no completada.`);
    }
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/settings");

  return { success: true };
}
