import * as React from "react";
import { getCandidateDashboardData } from "@/modules/candidate/services/candidate-dashboard";
import { CandidateDashboardView } from "@/modules/candidate/components/candidate-dashboard-view";

// Ensure this page is dynamically rendered so it fetches fresh database records
export const dynamic = "force-dynamic";

export default async function CandidateDashboard() {
  const dashboardData = await getCandidateDashboardData();

  return <CandidateDashboardView initialData={dashboardData} />;
}
