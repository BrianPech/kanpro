import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";

import { AppSidebar } from "@/modules/admin/components/app-sidebar";
import { SiteHeader } from "@/modules/admin/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVacancyReports } from "./actions";
import { ReportsDataTable } from "@/modules/admin/components/reports-data-table";
import {
  ShieldAlertIcon,
  AlertTriangleIcon,
  BanIcon,
  ShieldCheckIcon,
} from "lucide-react";

export default async function AdminReportsPage() {
  await requireAdmin();
  const supabase = await createClient();

  // 3. Fetch reports and safety statistics
  const reports = await getVacancyReports();

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const actionTakenCount = reports.filter((r) => r.status === "action_taken").length;

  const { count: verifiedCompaniesCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "company")
    .eq("is_verified", true);

  const { count: deactivatedVacanciesCount } = await supabase
    .from("vacancies")
    .select("id", { count: "exact", head: true })
    .eq("is_active", false);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 bg-muted/10 min-h-[calc(100vh-var(--header-height))]">
          {/* Header Bar */}
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldAlertIcon className="size-6 text-red-500" />
              <span>Bandeja de Moderación y Seguridad</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Protección contra vacantes falsas, cobros indebidos a candidatos y gestión de la insignia <strong>Empresa Verificada</strong>.
            </p>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-red-500/20 bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground">
                  Reportes Pendientes
                </CardTitle>
                <ShieldAlertIcon className="size-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{pendingCount}</div>
                <p className="text-[11px] text-muted-foreground pt-1">Requieren atención preventiva</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-amber-500/20 bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground">
                  Vacantes Desactivadas
                </CardTitle>
                <AlertTriangleIcon className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{deactivatedVacanciesCount || actionTakenCount}</div>
                <p className="text-[11px] text-muted-foreground pt-1">Ocultadas por moderación</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-rose-500/20 bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground">
                  Acciones de Sanción
                </CardTitle>
                <BanIcon className="size-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{actionTakenCount}</div>
                <p className="text-[11px] text-muted-foreground pt-1">Cuentas o vacantes sancionadas</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-green-500/20 bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground">
                  Empresas Verificadas
                </CardTitle>
                <ShieldCheckIcon className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{verifiedCompaniesCount || 0}</div>
                <p className="text-[11px] text-muted-foreground pt-1">Con badge de confianza activo</p>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Reports Table */}
          <ReportsDataTable data={reports} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
