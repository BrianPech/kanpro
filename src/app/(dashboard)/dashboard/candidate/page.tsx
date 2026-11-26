import * as React from "react";
import { getCandidateDashboardData } from "@/modules/candidate/services/candidate-dashboard";
import { CandidateDashboardView } from "@/modules/candidate/components/candidate-dashboard-view";
import { parseCandidateSearchParams } from "@/modules/candidate/utils/search-params";

// Ensure this page is dynamically rendered so it fetches fresh database records
export const dynamic = "force-dynamic";

export default async function CandidateDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [dashboardData, resolvedSearchParams] = await Promise.all([
    getCandidateDashboardData(),
    searchParams,
  ]);
  const initialFilters = parseCandidateSearchParams(resolvedSearchParams);

  return (
    <CandidateDashboardView
      initialData={dashboardData}
      initialFilters={initialFilters}
    />
  );
}
