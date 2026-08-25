import * as React from "react";
import { getCompanyDashboardData } from "@/modules/company/services/company-dashboard";
import { PayrollView } from "@/modules/company/components/payroll-view";

export default async function CompanyPayrollPage() {
  const data = await getCompanyDashboardData();

  return (
    <PayrollView
      payroll={data.payrollSummary}
      kpis={data.kpis}
    />
  );
}
