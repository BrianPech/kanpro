import { ChartAreaInteractive } from "@/modules/admin/components/chart-area-interactive";
import { DataTable } from "@/modules/admin/components/data-table";
import { SectionCards } from "@/modules/admin/components/section-cards";
import { getAdminDashboardMetrics } from "@/modules/admin/services/admin-analytics";
import data from "./data.json";

export default async function AdminDashboardPage() {
  // Fetch real platform metrics from Supabase
  const metrics = await getAdminDashboardMetrics();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <SectionCards metrics={metrics} />
      <div>
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </div>
  );
}
