import * as React from "react"
import { CandidateRadar } from "@/modules/company/components/candidate-radar"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function RadarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <CandidateRadar />
}
