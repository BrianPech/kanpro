import * as React from "react"
import { ApplicationsInbox } from "@/modules/company/components/applications-inbox"

export default function ApplicationsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground font-medium">Cargando postulaciones...</div>}>
      <ApplicationsInbox />
    </React.Suspense>
  )
}
