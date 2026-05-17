import * as React from "react"
import { VacanciesManager } from "@/modules/company/components/vacancies-manager"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function VacanciesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <VacanciesManager userId={user.id} />
}
