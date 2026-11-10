"use server";

import { requireAdminAuth } from "@/lib/auth/require-admin";
import * as nextCache from "next/cache";
import { invalidateDemoRolloutMemoryCache } from "@/modules/auth/services/dashboard-session";
import { z } from "zod";
import type { Json } from "@/types/supabase";
import type { DemoRolloutConfig } from "@/modules/company/config/demo-rollout";

export type SystemSettingsMap = {
  demo_rollout?: DemoRolloutConfig;
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
  [key: string]: unknown;
};

export async function getSystemSettings(): Promise<SystemSettingsMap> {
  const { supabase } = await requireAdminAuth({ requiredPermission: "system_settings" });

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
  const { supabase, user } = await requireAdminAuth({ requiredPermission: "system_settings" });

  const parsed = systemSettingsSchema.safeParse(settings);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Configuración del sistema inválida.");
  }

  const entries = Object.entries(parsed.data);
  const now = new Date().toISOString();

  if (entries.length > 0) {
    const rows = entries.map(([key, value]) => ({
      key,
      value: value as NonNullable<Json>,
      updated_at: now,
      updated_by: user.id,
    }));

    const { error } = await supabase
      .from("system_settings")
      .upsert(rows, { onConflict: "key" });

    if (error) {
      console.error("[AdminSettings] Error saving system settings batch:", error);
      throw new Error(`Error al guardar configuración del sistema: ${error.message}`);
    }
  }

  invalidateDemoRolloutMemoryCache();
  nextCache.revalidatePath("/dashboard/admin");
  nextCache.revalidatePath("/dashboard/admin/settings");
  nextCache.revalidatePath("/dashboard/company", "layout");
  try {
    if ("revalidateTag" in nextCache && typeof nextCache.revalidateTag === "function") {
      nextCache.revalidateTag("system-settings", "max");
    }
  } catch {
    // Ignorar fuera del contexto de servidor Next.js (ej. tests unitarios)
  }

  return { success: true };
}
