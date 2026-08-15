import { requireAdmin } from "@/lib/auth/require-admin";

import { AppSidebar } from "@/modules/admin/components/app-sidebar";
import { ChartAreaInteractive } from "@/modules/admin/components/chart-area-interactive";
import { DataTable } from "@/modules/admin/components/data-table";
import { SectionCards } from "@/modules/admin/components/section-cards";
import { SiteHeader } from "@/modules/admin/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { getAdminDashboardMetrics } from "@/modules/admin/services/admin-analytics";
import data from "./data.json";

export default async function AdminDashboardPage() {
  await requireAdmin();

  // 3. Fetch real platform metrics from Supabase
  const metrics = await getAdminDashboardMetrics();

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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards metrics={metrics} />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
