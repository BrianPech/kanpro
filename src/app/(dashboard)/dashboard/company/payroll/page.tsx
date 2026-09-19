import * as React from "react";
import { getCompanyDashboardData } from "@/modules/company/services/company-dashboard";
import { getCompanyPayrollData } from "@/modules/company/services/company-payroll";
import { PayrollView } from "@/modules/company/components/payroll-view";

export default async function CompanyPayrollPage() {
  const [payrollData, dashboardData] = await Promise.all([
    getCompanyPayrollData(),
    getCompanyDashboardData(),
  ]);

  return (
    <PayrollView
      payrollSummary={payrollData.summary}
      companyName={payrollData.companyName}
      kpis={dashboardData.kpis}
      payroll={dashboardData.payrollSummary}
    />
  );
}
