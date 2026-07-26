import * as React from "react";
import { getCandidateDashboardData } from "@/modules/candidate/services/candidate-dashboard";
import { CandidateApplicationsView } from "@/modules/candidate/components/candidate-applications-view";

export const dynamic = "force-dynamic";

export default async function CandidateApplicationsPage() {
  const dashboardData = await getCandidateDashboardData();

  return <CandidateApplicationsView initialData={dashboardData} />;
}
