import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CompanyEmployeesView } from "./employees-client"

export const metadata = {
  title: "Empleados Contratados | K'anPro",
  description: "Gestiona y visualiza a tus empleados contratados a través de K'anPro.",
}

export default async function CompanyEmployeesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 1. Fetch company vacancies
  const { data: userVacs } = await supabase
    .from("vacancies")
    .select("id")
    .eq("company_id", user.id)

  const vacIds = (userVacs || []).map((v) => v.id)

  let rawApplications: any[] = []

  if (vacIds.length > 0) {
    // 2. Fetch hired applications for those vacancies
    const { data: apps } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        applied_at,
        vacancy:vacancies(id, title, category, location, zone),
        candidate:candidate_profiles(
          id,
          skills,
          profiles:id(full_name, location, avatar_url, whatsapp_number)
        )
      `)
      .in("vacancy_id", vacIds)
      .in("status", ["Contratado", "hired", "accepted"])
      .order("applied_at", { ascending: false })

    rawApplications = apps || []
  }

  const employees = (rawApplications || []).map((app: any) => {
    const candProfile = Array.isArray(app.candidate?.profiles)
      ? app.candidate.profiles[0]
      : app.candidate?.profiles || {}

    const vacancyData = Array.isArray(app.vacancy)
      ? app.vacancy[0]
      : app.vacancy || {}

    return {
      id: app.id,
      candidate_id: app.candidate?.id || app.id,
      full_name: candProfile.full_name || "Candidato Contratado",
      phone: candProfile.whatsapp_number || candProfile.phone || "",
      avatar_url: candProfile.avatar_url || null,
      location: candProfile.location || app.candidate?.preferred_zone || "Riviera Maya",
      vacancy_title: vacancyData.title || "Puesto General",
      vacancy_category: vacancyData.category || "General",
      hired_date: app.applied_at,
      status: app.status,
    }
  })

  return <CompanyEmployeesView userId={user.id} initialEmployees={employees} />
}
