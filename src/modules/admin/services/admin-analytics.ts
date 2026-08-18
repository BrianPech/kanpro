import { createClient } from "@/lib/supabase/server";

export interface PlatformOperationItem {
  id: string;
  category: "verification" | "report" | "support" | "vacancy" | "user";
  title: string;
  subtitle: string;
  details?: string;
  timestamp: string;
  status: "pending" | "in_progress" | "resolved" | "active" | "urgent";
  statusLabel: string;
  actionUrl: string;
  actionLabel: string;
}

export interface AdminDashboardMetrics {
  totalCandidates: number;
  totalCompanies: number;
  pendingVerifications: number;
  activeVacancies: number;
  totalApplications: number;
  pendingReports: number;
  openTickets: number;
  operationsFeed: PlatformOperationItem[];
  timeSeriesData: Array<{
    date: string;
    applications: number;
    vacancies: number;
  }>;
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const supabase = await createClient();

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoISO = ninetyDaysAgo.toISOString();

    const [
      { count: totalCandidates },
      { count: totalCompanies },
      { count: pendingVerifications },
      { count: activeVacancies },
      { count: totalApplications },
      { count: pendingReports },
      { count: openTickets },
      { data: unverifiedCompanies },
      { data: recentVacancies },
      { data: recentProfiles },
      { data: recentApplicationsData },
      { data: recentVacanciesData },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "candidate"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "company"),
      supabase.from("company_profiles").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
      supabase.from("vacancies").select("*", { count: "exact", head: true }).or("status.eq.Activa,status.eq.activa,is_active.eq.true"),
      supabase.from("applications").select("*", { count: "exact", head: true }),
      supabase.from("vacancy_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "abierto"),
      supabase.from("company_profiles").select("id, company_name, fiscal_address, created_at").eq("verification_status", "pending").limit(5),
      supabase.from("vacancies").select("id, title, category, location, created_at").order("created_at", { ascending: false }).limit(6),
      supabase.from("profiles").select("id, full_name, role, location, created_at").order("created_at", { ascending: false }).limit(6),
      supabase.from("applications").select("applied_at").gte("applied_at", ninetyDaysAgoISO),
      supabase.from("vacancies").select("created_at").gte("created_at", ninetyDaysAgoISO),
    ]);

    const operationsFeed: PlatformOperationItem[] = [];

    // 1. Pending Company Verifications
    if (unverifiedCompanies && unverifiedCompanies.length > 0) {
      unverifiedCompanies.forEach((comp) => {
        operationsFeed.push({
          id: `verif-${comp.id}`,
          category: "verification",
          title: comp.company_name || "Empresa por validar",
          subtitle: comp.fiscal_address || "Sureste de México",
          details: "Expediente fiscal y legal pendiente de revisión",
          timestamp: comp.created_at
            ? new Date(comp.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
            : "Reciente",
          status: "pending",
          statusLabel: "Por Verificar",
          actionUrl: "/dashboard/admin/verifications",
          actionLabel: "Revisar Expediente",
        });
      });
    }

    // 2. Recent Vacancies Posted
    if (recentVacancies && recentVacancies.length > 0) {
      recentVacancies.forEach((vac) => {
        operationsFeed.push({
          id: `vac-${vac.id}`,
          category: "vacancy",
          title: vac.title || "Nueva Vacante",
          subtitle: `${vac.category || "General"} • ${vac.location || "Riviera Maya"}`,
          details: "Publicada en el portal público de K'anPro",
          timestamp: vac.created_at
            ? new Date(vac.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
            : "Reciente",
          status: "active",
          statusLabel: "En Vivo",
          actionUrl: `/dashboard/candidate/discovery?jobId=${vac.id}`,
          actionLabel: "Ver Vacante",
        });
      });
    }

    // 3. Recent Registered Users
    if (recentProfiles && recentProfiles.length > 0) {
      recentProfiles.forEach((prof) => {
        operationsFeed.push({
          id: `user-${prof.id}`,
          category: "user",
          title: prof.full_name || "Nuevo Usuario",
          subtitle: `${prof.role === "company" ? "Cuenta Empresa" : "Candidato"} • ${prof.location || "Sureste"}`,
          details: "Registro completado en la plataforma",
          timestamp: prof.created_at
            ? new Date(prof.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
            : "Reciente",
          status: "resolved",
          statusLabel: "Registrado",
          actionUrl: "/dashboard/admin/users",
          actionLabel: "Ver Perfil",
        });
      });
    }

    // Aggregate real daily timeseries data
    const dailyAppsMap = new Map<string, number>();
    const dailyVacsMap = new Map<string, number>();

    (recentApplicationsData || []).forEach((app) => {
      if (app.applied_at) {
        const dateKey = app.applied_at.slice(0, 10);
        dailyAppsMap.set(dateKey, (dailyAppsMap.get(dateKey) || 0) + 1);
      }
    });

    (recentVacanciesData || []).forEach((vac) => {
      if (vac.created_at) {
        const dateKey = vac.created_at.slice(0, 10);
        dailyVacsMap.set(dateKey, (dailyVacsMap.get(dateKey) || 0) + 1);
      }
    });

    const timeSeriesData: Array<{ date: string; applications: number; vacancies: number }> = [];
    const now = new Date();

    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      timeSeriesData.push({
        date: dateStr,
        applications: dailyAppsMap.get(dateStr) || 0,
        vacancies: dailyVacsMap.get(dateStr) || 0,
      });
    }

    return {
      totalCandidates: totalCandidates || 0,
      totalCompanies: totalCompanies || 0,
      pendingVerifications: pendingVerifications || 0,
      activeVacancies: activeVacancies || 0,
      totalApplications: totalApplications || 0,
      pendingReports: pendingReports || 0,
      openTickets: openTickets || 0,
      operationsFeed,
      timeSeriesData,
    };
  } catch (error) {
    console.error("[getAdminDashboardMetrics] Error:", error);
    return {
      totalCandidates: 0,
      totalCompanies: 0,
      pendingVerifications: 0,
      activeVacancies: 0,
      totalApplications: 0,
      pendingReports: 0,
      openTickets: 0,
      operationsFeed: [],
      timeSeriesData: [],
    };
  }
}
