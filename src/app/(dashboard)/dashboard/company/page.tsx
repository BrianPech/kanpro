import * as React from "react"
import { redirect } from "next/navigation"
import { getDashboardSession } from "@/modules/auth/services/dashboard-session"
import { getCompanyDashboardData } from "@/modules/company/services/company-dashboard"
import { DashboardView } from "@/modules/company/components/dashboard-view"

export default async function CompanyDashboardPage() {
  const { userCompanies } = await getDashboardSession()

  if (userCompanies && userCompanies.length === 0) {
    redirect("/onboarding")
  }

  const data = await getCompanyDashboardData()

  return <DashboardView {...data} />
}
