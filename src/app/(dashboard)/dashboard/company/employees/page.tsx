import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CompanyEmployeesView } from "@/modules/company/components/company-employees-view"

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
    .or(`company_id.eq.${user.id},recruiter_id.eq.${user.id}`)

  const vacIds = (userVacs || []).map((v) => v.id)

  let rawApplications: any[] = []

  if (vacIds.length > 0) {
    // 2. Fetch hired and terminated applications for those vacancies
    const { data: apps, error } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        notes,
        applied_at,
        vacancies (
          id,
          title,
          category,
          location,
          zone
        ),
        candidate_profiles (
          id,
          skills,
          profiles (
            id,
            full_name,
            location,
            avatar_url,
            whatsapp_number
          )
        )
      `)
      .in("vacancy_id", vacIds)
      .in("status", ["Contratado", "hired", "accepted", "Baja", "Finalizado"])
      .order("applied_at", { ascending: false })

    if (error) {
      console.error("[CompanyEmployeesPage] Error loading employees:", error)
    }

    rawApplications = apps || []
  }

  const employees = (rawApplications || []).map((app: any) => {
    const candidateObj = app.candidate_profiles || app.candidate
    const candidateProfile = Array.isArray(candidateObj)
      ? candidateObj[0]
      : candidateObj || {}

    const baseProfileObj = candidateProfile?.profiles
    const candProfile = Array.isArray(baseProfileObj)
      ? baseProfileObj[0]
      : baseProfileObj || {}

    const vacancyObj = app.vacancies || app.vacancy
    const vacancyData = Array.isArray(vacancyObj)
      ? vacancyObj[0]
      : vacancyObj || {}

    return {
      id: app.id,
      candidate_id: candidateProfile?.id || app.id,
      full_name: candProfile.full_name || "Candidato Contratado",
      phone: candProfile.whatsapp_number || candProfile.phone || "",
      avatar_url: candProfile.avatar_url || null,
      location: candProfile.location || vacancyData.location || "Riviera Maya",
      vacancy_title: vacancyData.title || "Puesto General",
      vacancy_category: vacancyData.category || "General",
      hired_date: app.applied_at || new Date().toISOString(),
      notes: app.notes || "",
      status: (app.status === "Baja" || app.status === "Finalizado"
        ? "Baja"
        : "Contratado") as "Contratado" | "Baja",
    }
  })

  return <CompanyEmployeesView userId={user.id} initialEmployees={employees} />
}
