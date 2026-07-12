import * as React from "react"
import { VacancyFormView } from "@/modules/company/components/vacancy-form-view"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function NewVacancyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <VacancyFormView userId={user.id} />
}
