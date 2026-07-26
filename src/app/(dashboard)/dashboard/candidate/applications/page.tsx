import * as React from "react";
import { getCandidateDashboardData } from "@/modules/candidate/services/candidate-dashboard";
import { CandidateDashboardView } from "@/modules/candidate/components/candidate-dashboard-view";

export const dynamic = "force-dynamic";

export default async function CandidateApplicationsPage() {
  const dashboardData = await getCandidateDashboardData();

  return <CandidateDashboardView initialData={dashboardData} />;
}
