import * as React from "react"
import { getCompanyDashboardData } from "@/modules/company/services/company-dashboard"
import { DashboardView } from "@/modules/company/components/dashboard-view"

export default async function CompanyDashboardPage() {
  const { companyName } = await getCompanyDashboardData()

  return <DashboardView companyName={companyName} />
}
