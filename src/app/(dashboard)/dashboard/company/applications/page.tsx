import * as React from "react"
import { ApplicationsInbox } from "@/modules/company/components/applications-inbox"
import { getDashboardSession } from "@/modules/auth/services/dashboard-session"
import { createClient } from "@/lib/supabase/server"

export default async function ApplicationsPage() {
  const { targetUserId, activeCompanyId } = await getDashboardSession()
  const supabase = await createClient()
  const targetCompanyId = activeCompanyId || targetUserId || ""

  let companyLegalRep = ""
  if (targetCompanyId) {
    const { data: comp } = await supabase
      .from("company_profiles")
      .select("legal_rep_name, owner_id")
      .eq("id", targetCompanyId)
      .maybeSingle()

    companyLegalRep = comp?.legal_rep_name?.trim() || ""
    if (!companyLegalRep) {
      const ownerId = comp?.owner_id || targetUserId
      if (ownerId) {
        const { data: ownerProf } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", ownerId)
          .maybeSingle()
        companyLegalRep = ownerProf?.full_name?.trim() || ""
      }
    }
  }

  return (
    <React.Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground font-medium">Cargando postulaciones...</div>}>
      <ApplicationsInbox companyId={activeCompanyId} companyLegalRep={companyLegalRep} />
    </React.Suspense>
  )
}
