import * as React from "react";
import { getCompanyDashboardData } from "@/modules/company/services/company-dashboard";
import { IncidentsView } from "@/modules/company/components/incidents-view";

export default async function CompanyIncidentsPage() {
  const data = await getCompanyDashboardData();

  return (
    <IncidentsView
      initialIncidents={data.pendingIncidents}
      kpis={data.kpis}
    />
  );
}
