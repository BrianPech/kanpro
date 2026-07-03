import * as React from "react"
import { getCompanyDashboardData } from "@/modules/company/services/company-dashboard"
import { DashboardView } from "@/modules/company/components/dashboard-view"

export default async function CompanyDashboardPage() {
  const data = await getCompanyDashboardData()

  return <DashboardView {...data} />
}
