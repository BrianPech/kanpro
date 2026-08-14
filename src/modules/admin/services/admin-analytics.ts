import { createClient } from "@/lib/supabase/server";

export interface AdminDashboardMetrics {
  totalCandidates: number;
  totalCompanies: number;
  pendingVerifications: number;
  activeVacancies: number;
  totalApplications: number;
  recentActivity: Array<{
    id: string;
    type: "candidate_registered" | "company_registered" | "vacancy_posted" | "application_submitted";
    title: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const supabase = await createClient();

  try {
    const [
      { count: totalCandidates },
      { count: totalCompanies },
      { count: pendingVerifications },
      { count: activeVacancies },
      { count: totalApplications },
      { data: recentProfiles },
      { data: recentVacancies },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "candidate"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "company"),
      supabase.from("company_profiles").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
      supabase.from("vacancies").select("*", { count: "exact", head: true }).or("status.eq.Activa,status.eq.activa,is_active.eq.true"),
      supabase.from("applications").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("vacancies").select("id, title, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    const activityList: AdminDashboardMetrics["recentActivity"] = [];

    if (recentProfiles) {
      recentProfiles.forEach((p) => {
        activityList.push({
          id: `user-${p.id}`,
          type: p.role === "company" ? "company_registered" : "candidate_registered",
          title: p.role === "company" ? "Nueva Empresa Registrada" : "Nuevo Candidato Registrado",
          description: p.full_name || "Usuario K'anPro",
          timestamp: p.created_at
            ? new Date(p.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
            : "Reciente",
          status: "Completado",
        });
      });
    }

    if (recentVacancies) {
      recentVacancies.forEach((v) => {
        activityList.push({
          id: `vac-${v.id}`,
          type: "vacancy_posted",
          title: "Nueva Oferta Publicada",
          description: v.title || "Vacante",
          timestamp: v.created_at
            ? new Date(v.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
            : "Reciente",
          status: "Activa",
        });
      });
    }

    return {
      totalCandidates: totalCandidates || 0,
      totalCompanies: totalCompanies || 0,
      pendingVerifications: pendingVerifications || 0,
      activeVacancies: activeVacancies || 0,
      totalApplications: totalApplications || 0,
      recentActivity: activityList,
    };
  } catch (error) {
    console.error("[getAdminDashboardMetrics] Error:", error);
    return {
      totalCandidates: 0,
      totalCompanies: 0,
      pendingVerifications: 0,
      activeVacancies: 0,
      totalApplications: 0,
      recentActivity: [],
    };
  }
}
