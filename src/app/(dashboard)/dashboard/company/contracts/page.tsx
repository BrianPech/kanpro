import * as React from "react";
import { getCompanyDashboardData } from "@/modules/company/services/company-dashboard";
import { ContractsView } from "@/modules/company/components/contracts-view";

export default async function CompanyContractsPage() {
  const data = await getCompanyDashboardData();

  return (
    <ContractsView
      initialContracts={data.expiringContracts}
      kpis={data.kpis}
    />
  );
}
