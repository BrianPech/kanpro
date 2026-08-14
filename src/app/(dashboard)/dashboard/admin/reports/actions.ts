"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  VacancyReportItem,
  ReportReason,
  ReportStatus,
} from "@/modules/admin/types/moderation";

async function requireAdminAuth() {
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

export async function getVacancyReports(): Promise<VacancyReportItem[]> {
  const { supabase } = await requireAdminAuth();

  const { data: reports, error } = await supabase
    .from("vacancy_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !reports || reports.length === 0) {
    return [];
  }

  // Fetch vacancies details
  const vacancyIds = Array.from(new Set(reports.map((r) => r.vacancy_id).filter(Boolean))) as string[];
  const { data: dbVacancies } = await supabase
    .from("vacancies")
    .select("id, title, category, company_id")
    .in("id", vacancyIds);

  const vacancyMap = new Map((dbVacancies || []).map((v) => [v.id, v]));

  // Fetch company details
  const companyIds = Array.from(new Set((dbVacancies || []).map((v) => v.company_id)));
  const { data: dbCompanies } = await supabase
    .from("company_profiles")
    .select("id, company_name, rfc")
    .in("id", companyIds);

  const { data: dbProfiles } = await supabase
    .from("profiles")
    .select("id, is_verified")
    .in("id", companyIds);

  const companyMap = new Map((dbCompanies || []).map((c) => [c.id, c]));
  const profileMap = new Map((dbProfiles || []).map((p) => [p.id, p]));

  return reports.map((r) => {
    const v = r.vacancy_id ? vacancyMap.get(r.vacancy_id) : null;
    const c = v?.company_id ? companyMap.get(v.company_id) : null;
    const p = v?.company_id ? profileMap.get(v.company_id) : null;

    return {
      id: r.id,
      vacancyId: r.vacancy_id || "",
      vacancyTitle: v?.title || "Vacante Reportada",
      vacancyCategory: v?.category || "General",
      companyId: v?.company_id || "",
      companyName: c?.company_name || "Empresa Registrada",
      companyRfc: c?.rfc || "",
      companyIsVerified: p?.is_verified || false,
      reason: (r.reason as ReportReason) || "cobro_dinero",
      details: r.details || undefined,
      status: (r.status as ReportStatus) || "pending",
      actionTaken: r.action_taken || undefined,
      createdAt: r.created_at
        ? new Date(r.created_at).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Reciente",
      updatedAt: r.updated_at,
    };
  });
}

// Action: Desactivar / Ocultar vacante sospechosa instantáneamente
export async function quickDeactivateVacancy(vacancyId: string) {
  const { supabase } = await requireAdminAuth();

  const { error } = await supabase
    .from("vacancies")
    .update({
      is_active: false,
      status: "hidden",
      updated_at: new Date().toISOString(),
    })
    .eq("id", vacancyId);

  if (error) {
    throw new Error(`Error al desactivar la vacante: ${error.message}`);
  }

  // Update associated reports status
  await supabase
    .from("vacancy_reports")
    .update({
      status: "action_taken",
      action_taken: "vacancy_deactivated",
      updated_at: new Date().toISOString(),
    })
    .eq("vacancy_id", vacancyId);

  revalidatePath("/dashboard/admin/reports");
  return { success: true };
}

// Action: Bloquear / Banear cuenta de usuario o empresa insostenible
export async function banUserAccount(userId: string, reason: string) {
  const { supabase, user } = await requireAdminAuth();

  if (user.id === userId) {
    throw new Error("No puede banear su propia cuenta de administrador.");
  }

  // Revoke verification and set location / note as BANNED
  const { error } = await supabase
    .from("profiles")
    .update({
      is_verified: false,
      location: `SUSPENDIDO / BANEADO por ${reason}`,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Error al banear la cuenta del usuario: ${error.message}`);
  }

  // Deactivate all vacancies by this company
  await supabase
    .from("vacancies")
    .update({ is_active: false, status: "banned" })
    .eq("company_id", userId);

  revalidatePath("/dashboard/admin/reports");
  return { success: true };
}

// Action: Gestión del Badge "Empresa Verificada" (is_verified)
export async function toggleCompanyVerification(companyId: string, isVerified: boolean) {
  const { supabase } = await requireAdminAuth();

  // 1. Update public.profiles is_verified
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ is_verified: isVerified })
    .eq("id", companyId);

  if (profileErr) {
    throw new Error(`Error al actualizar verificación de perfil: ${profileErr.message}`);
  }

  // 2. Update public.company_profiles verification_status
  const { error: companyErr } = await supabase
    .from("company_profiles")
    .update({
      verification_status: isVerified ? "approved" : "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId);

  if (companyErr) {
    throw new Error(`Error al actualizar estado de verificación de empresa: ${companyErr.message}`);
  }

  revalidatePath("/dashboard/admin/reports");
  revalidatePath("/dashboard/admin/users");
  return { success: true, isVerified };
}

// Action: Resolver o desestimar reporte
export async function resolveReport(reportId: string, status: ReportStatus, actionTaken?: string) {
  const { supabase } = await requireAdminAuth();

  const { error } = await supabase
    .from("vacancy_reports")
    .update({
      status,
      action_taken: actionTaken || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    throw new Error(`Error al actualizar el reporte: ${error.message}`);
  }

  revalidatePath("/dashboard/admin/reports");
  return { success: true };
}
