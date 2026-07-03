import { createClient } from "@/lib/supabase/server"

export async function getCompanyDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let companyName = "Empresa"
  let activeVacancies = 0
  let totalApplications = 0
  let reviewingApplications = 0
  let totalConnections = 0
  let recentActivities: any[] = []

  if (user) {
    // 1. Get company name
    const { data: companyData } = await supabase
      .from("company_profiles")
      .select("company_name")
      .eq("id", user.id)
      .single()
    
    if (companyData?.company_name) {
      companyName = companyData.company_name
    }

    // 2. Get active vacancies count and list of vacancies ids
    const { data: vacs } = await supabase
      .from("vacancies")
      .select("id, is_active")
      .eq("company_id", user.id)

    const allVacs = vacs || []
    activeVacancies = allVacs.filter((v: any) => v.is_active).length
    const vacIds = allVacs.map((v: any) => v.id)

    if (vacIds.length > 0) {
      // 3. Get total applications count
      const { count: appCount } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("vacancy_id", vacIds)
      
      totalApplications = appCount || 0

      // 4. Get reviewing/pending applications count
      const { count: revCount } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("vacancy_id", vacIds)
        .in("status", ["En revisión", "Preseleccionado", "Pendiente"])
      
      reviewingApplications = revCount || 0

      // 5. Get recent applications list
      const { data: recentApps } = await supabase
        .from("applications")
        .select(`
          id,
          created_at,
          status,
          vacancies (
            title
          ),
          candidate:profiles (
            id,
            full_name,
            headline,
            skills,
            avatar_url
          )
        `)
        .in("vacancy_id", vacIds)
        .order("created_at", { ascending: false })
        .limit(5)

      recentActivities = (recentApps || []).map((app: any) => {
        let skills: string[] = []
        if (app.candidate?.skills) {
          skills = Array.isArray(app.candidate.skills)
            ? app.candidate.skills
            : String(app.candidate.skills).split(",")
        }
        return {
          id: app.id,
          candidateName: app.candidate?.full_name || "Profesional K'anPro",
          candidateHeadline: app.candidate?.headline || "Candidato",
          candidateAvatar: app.candidate?.avatar_url || null,
          skills: skills.slice(0, 3),
          vacancyTitle: app.vacancies?.title || "Puesto",
          createdAt: app.created_at
        }
      })
    }

    // 6. Get direct connections count
    const { count: connCount } = await supabase
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("recruiter_id", user.id)

    totalConnections = connCount || 0
  }

  return {
    companyName,
    metrics: {
      activeVacancies,
      totalApplications,
      reviewingApplications,
      totalConnections,
    },
    recentActivities,
  }
}

export async function getCompanyProfileData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = {
    company_name: "",
    industry: "",
    website_or_linkedin: "",
    location: ""
  }

  if (user) {
    const { data } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    
    if (data) {
      profile = {
        company_name: data.company_name || "",
        industry: data.industry || "",
        website_or_linkedin: data.website_or_linkedin || "",
        location: data.location || ""
      }
    } else {
      // Fallback a nombre de usuario si no hay perfil de empresa
      const { data: baseProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single()
      if (baseProfile?.full_name) profile.company_name = baseProfile.full_name
    }

    return {
      profile,
      userId: user.id,
    }
  }

  return null
}
