import { createClient } from "@/lib/supabase/server"

export interface CandidateApplication {
  id: string
  position: string
  location: string
  company: string
  companyInitials: string
  logoUrl: string | null
  status: string
  statusLabel: string
  statusColor: string
  progress: number
  appliedDate: string
  companyPhone: string | null
}

export interface CandidateDashboardData {
  profile: {
    id: string
    full_name: string
    headline: string | null
    experience_summary: string | null
    location: string | null
    skills: string[] | null
    avatar_url: string | null
    is_approved: boolean
    is_validated: boolean
    completionScore: number
  } | null
  applications: CandidateApplication[]
  stats: {
    total: number
    reviewing: number
    hired: number
  }
}

export async function getCandidateDashboardData(): Promise<CandidateDashboardData> {
  const supabase = await createClient()
  
  // 1. Get current authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return {
      profile: null,
      applications: [],
      stats: {
        total: 0,
        reviewing: 0,
        hired: 0
      }
    }
  }

  // 2. Fetch candidate profile
  const { data: profileData } = await supabase
    .from("profiles_view")
    .select("id, full_name, headline, experience_summary, location, skills, avatar_url, is_approved, is_validated, experience, cv_url")
    .eq("id", user.id)
    .single()

  let completionScore = 0
  if (profileData) {
    if (profileData.full_name) completionScore += 20
    if (profileData.headline) completionScore += 15
    if (profileData.experience_summary) completionScore += 15
    if (profileData.location) completionScore += 10
    if (profileData.skills && profileData.skills.length > 0) completionScore += 15
    if (profileData.cv_url) completionScore += 15
    if (profileData.experience && Array.isArray(profileData.experience) && profileData.experience.length > 0) completionScore += 10
  }

  // 3. Fetch applications
  const { data: dbApplications } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      created_at,
      vacancy_id,
      vacancy:vacancies (
        id,
        title,
        location,
        modality,
        skills,
        company_id
      )
    `)
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false })

  // 4. Resolve company names for vacancies
  const companies: Record<string, { company_name: string; logo_url: string | null; phone: string | null }> = {}
  
  interface DBApplication {
    id: string
    status: string
    created_at: string | null
    vacancy: {
      id: string
      title: string
      location: string | null
      modality: string
      skills: string[] | null
      company_id: string
    } | null
  }

  const typedApplications = (dbApplications as unknown as DBApplication[]) || []

  if (typedApplications.length > 0) {
    const companyIds = Array.from(
      new Set(
        typedApplications
          .map((app) => app.vacancy?.company_id)
          .filter(Boolean)
      )
    ) as string[]

    if (companyIds.length > 0) {
      const { data: companyProfiles } = await supabase
        .from("company_profiles")
        .select("id, company_name, logo_url, phone")
        .in("id", companyIds)

      if (companyProfiles) {
        companyProfiles.forEach((comp: any) => {
          companies[comp.id] = {
            company_name: comp.company_name || "Empresa",
            logo_url: comp.logo_url || null,
            phone: comp.phone || null
          }
        })
      }
    }
  }

  // 5. Format applications
  const formattedApplications: CandidateApplication[] = typedApplications.map((app) => {
    const vacancy = app.vacancy
    const companyInfo = vacancy ? companies[vacancy.company_id] : null
    const companyName = companyInfo?.company_name || "Empresa"
    const logoUrl = companyInfo?.logo_url || null
    const companyInitials = companyName.substring(0, 2).toUpperCase()

    let statusLabel = app.status
    let statusColor = "text-zinc-500 bg-zinc-500/10 border-zinc-500/20 dark:text-zinc-400 dark:bg-zinc-400/10 dark:border-zinc-400/20"
    let progress = 25

    switch (app.status) {
      case "Pendiente":
        statusLabel = "Pendiente"
        statusColor = "text-zinc-500 bg-zinc-500/10 border-zinc-500/20 dark:text-zinc-400 dark:bg-zinc-400/10 dark:border-zinc-400/20"
        progress = 25
        break
      case "En revisión":
        statusLabel = "En Revisión"
        statusColor = "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20"
        progress = 50
        break
      case "Preseleccionado":
        statusLabel = "Preseleccionado"
        statusColor = "text-indigo-500 bg-indigo-500/10 border-indigo-500/20 dark:text-indigo-400 dark:bg-indigo-400/10 dark:border-indigo-400/20"
        progress = 75
        break
      case "Contratado":
        statusLabel = "Contratado"
        statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20"
        progress = 100
        break
      case "Descartado":
        statusLabel = "Descartado"
        statusColor = "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-400 dark:bg-rose-400/10 dark:border-rose-400/20"
        progress = 100
        break
    }

    const appliedDate = app.created_at
      ? new Date(app.created_at).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      : "Reciente"

    return {
      id: app.id,
      position: vacancy?.title || "Posición",
      location: vacancy?.location || vacancy?.modality || "Remoto",
      company: companyName,
      companyInitials,
      logoUrl,
      status: app.status,
      statusLabel,
      statusColor,
      progress,
      appliedDate,
      companyPhone: companyInfo?.phone || null
    }
  })

  const total = formattedApplications.length
  const reviewing = formattedApplications.filter(
    (app) => app.status === "En revisión" || app.status === "Preseleccionado"
  ).length
  const hired = formattedApplications.filter((app) => app.status === "Contratado").length

  return {
    profile: profileData
      ? {
          id: profileData.id,
          full_name: profileData.full_name,
          headline: profileData.headline || null,
          experience_summary: profileData.experience_summary || null,
          location: profileData.location || null,
          skills: profileData.skills || null,
          avatar_url: profileData.avatar_url || null,
          is_approved: profileData.is_approved || false,
          is_validated: profileData.is_validated || false,
          completionScore
        }
      : null,
    applications: formattedApplications,
    stats: {
      total,
      reviewing,
      hired
    }
  }
}
