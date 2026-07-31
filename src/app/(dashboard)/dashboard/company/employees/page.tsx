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

  // Fetch hired applications for this company
  const { data: rawApplications } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      applied_at,
      notes,
      vacancy:vacancies(id, title, category, city, zone),
      candidate:candidate_profiles(
        id,
        experience_years,
        preferred_zone,
        profiles:id(full_name, location, avatar_url, phone)
      )
    `)
    .eq("company_id", user.id)
    .in("status", ["hired", "accepted"])
    .order("applied_at", { ascending: false })

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
      phone: candProfile.phone || "",
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
