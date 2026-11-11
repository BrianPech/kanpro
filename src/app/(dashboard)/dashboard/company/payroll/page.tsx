import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { getCompanyDashboardData } from "@/modules/company/services/company-dashboard";
import { getCompanyPayrollData } from "@/modules/company/services/company-payroll";
import { PayrollView } from "@/modules/company/components/payroll-view";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";

export default async function CompanyPayrollPage() {
  const [{ activeCompanyId }, supabase] = await Promise.all([
    getDashboardSession(),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetCompanyId = activeCompanyId || user?.id || "";

  const [payrollData, dashboardData] = await Promise.all([
    getCompanyPayrollData(supabase, targetCompanyId),
    getCompanyDashboardData(targetCompanyId),
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
