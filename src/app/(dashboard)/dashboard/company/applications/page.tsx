import * as React from "react"
import { ApplicationsInbox } from "@/modules/company/components/applications-inbox"
import { getDashboardSession } from "@/modules/auth/services/dashboard-session"

export default async function ApplicationsPage() {
  const { activeCompanyId } = await getDashboardSession()

  return (
    <React.Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground font-medium">Cargando postulaciones...</div>}>
      <ApplicationsInbox companyId={activeCompanyId} />
    </React.Suspense>
  )
}
