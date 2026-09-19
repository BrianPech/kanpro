import { ChartAreaInteractive } from "@/modules/admin/components/chart-area-interactive";
import { DataTable } from "@/modules/admin/components/data-table";
import { SectionCards } from "@/modules/admin/components/section-cards";
import { getAdminDashboardMetrics } from "@/modules/admin/services/admin-analytics";

export const metadata = {
  title: "Panel Central de Administración | K'anPro",
  description: "Monitoreo y gestión de la plataforma K'anPro en el sureste de México.",
};

export default async function AdminDashboardPage() {
  // Fetch real platform metrics from Supabase
  const metrics = await getAdminDashboardMetrics();

  return (
    <div className="flex flex-1 flex-col gap-6 pb-8">
      <SectionCards metrics={metrics} />
      <ChartAreaInteractive data={metrics.timeSeriesData} />
      <DataTable data={metrics.operationsFeed} />
    </div>
  );
}
