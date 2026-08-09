import { createClient } from "@/lib/supabase/server"

export async function getCompanyDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const weekDaysOrdered = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  let companyName = "Empresa"
  let activeVacancies = 0
  let pausedVacancies = 0
  let totalApplications = 0
  let reviewingApplications = 0
  let totalConnections = 0
  let recentActivities: any[] = []
  let latestVacancies: any[] = []
  let publishedVacancies: any[] = []
  let pendingTasks: { id: string; text: string; completed: boolean }[] = []

  if (user) {
    // 1. Parallel Batch 1: Fetch company profile, all vacancies for this company, and connections count
    const [companyRes, vacanciesRes, connectionsRes] = await Promise.all([
      supabase
        .from("company_profiles")
        .select("company_name")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("vacancies")
        .select("id, title, location, zone, salary_min, salary_max, category, employment_type, created_at, is_active")
        .eq("company_id", user.id)
        .order("created_at", { ascending: false }),
      (supabase.from("connections" as any) as any)
        .select("id", { count: "exact", head: true })
        .eq("recruiter_id", user.id)
    ]);

    if (companyRes.data?.company_name) {
      companyName = companyRes.data.company_name
    }

    totalConnections = connectionsRes.count || 0

    const allVacancies = vacanciesRes.data || []
    activeVacancies = allVacancies.filter((v: any) => v.is_active !== false).length
    pausedVacancies = allVacancies.filter((v: any) => v.is_active === false).length

    const publishedVacanciesRaw = allVacancies.slice(0, 3)
    latestVacancies = publishedVacanciesRaw.slice(0, 2)
    const vacIds = allVacancies.map((v: any) => v.id)

    let recentAppDates: any[] = []

    // 2. Parallel Batch 2: Applications metrics & recent activities if company has vacancies
    if (vacIds.length > 0) {
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

      const [
        pubVacCounts,
        totalAppsRes,
        reviewingAppsRes,
        recentAppsRes,
        appDatesRes
      ] = await Promise.all([
        // Count applications per top vacancy
        Promise.all(
          publishedVacanciesRaw.map(async (v: any) => {
            const { count } = await supabase
              .from("applications")
              .select("id", { count: "exact", head: true })
              .eq("vacancy_id", v.id)
            return { ...v, applicationsCount: count || 0 }
          })
        ),
        // Total applications
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .in("vacancy_id", vacIds),
        // Reviewing/pending applications
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .in("vacancy_id", vacIds)
          .in("status", ["En revisión", "Preseleccionado", "Pendiente"]),
        // Recent applications list
        supabase
          .from("applications")
          .select(`
            id,
            applied_at,
            status,
            vacancies (
              title
            ),
            candidate:candidate_profiles (
              id,
              headline,
              skills,
              profiles (
                id,
                full_name,
                avatar_url
              )
            )
          `)
          .in("vacancy_id", vacIds)
          .order("applied_at", { ascending: false })
          .limit(5),
        // Application dates for weekly flow chart
        supabase
          .from("applications")
          .select("applied_at")
          .in("vacancy_id", vacIds)
          .gte("applied_at", fourteenDaysAgo.toISOString())
      ])

      publishedVacancies = pubVacCounts
      totalApplications = totalAppsRes.count || 0
      reviewingApplications = reviewingAppsRes.count || 0
      recentAppDates = appDatesRes.data || []

      recentActivities = (recentAppsRes.data || []).map((app: any) => {
        const candidateProfile = Array.isArray(app.candidate) ? app.candidate[0] : app.candidate;
        const baseProfile = candidateProfile?.profiles
          ? (Array.isArray(candidateProfile.profiles) ? candidateProfile.profiles[0] : candidateProfile.profiles)
          : {};

        let skills: string[] = []
        if (candidateProfile?.skills) {
          skills = Array.isArray(candidateProfile.skills)
            ? candidateProfile.skills
            : String(candidateProfile.skills).split(",")
        }
        return {
          id: app.id,
          candidateName: baseProfile?.full_name || "Profesional K'anPro",
          candidateHeadline: candidateProfile?.headline || "Candidato",
          candidateAvatar: baseProfile?.avatar_url || null,
          skills: skills.slice(0, 3),
          vacancyTitle: app.vacancies?.title || "Puesto",
          createdAt: app.applied_at || app.created_at
        }
      })
    }

    // 7. Dynamically construct real pending tasks from database status
    if (reviewingApplications > 0) {
      pendingTasks.push({
        id: "task-rev-apps",
        text: `Revisar ${reviewingApplications} postulaciones pendientes`,
        completed: false,
      })
    }

    if (latestVacancies.length > 0) {
      const activeVac = latestVacancies.find((v: any) => v.is_active !== false)
      if (activeVac) {
        pendingTasks.push({
          id: `task-vac-${activeVac.id}`,
          text: `Monitorear candidatos para "${activeVac.title}"`,
          completed: false,
        })
      }
    } else {
      pendingTasks.push({
        id: "task-create-first-vac",
        text: "Publicar tu primera oferta de empleo activa",
        completed: false,
      })
    }

    if (pausedVacancies > 0) {
      pendingTasks.push({
        id: "task-paused-vacs",
        text: `Revisar ${pausedVacancies} vacante(s) actualmente en pausa`,
        completed: false,
      })
    }

    if (companyName && companyName !== "Empresa") {
      pendingTasks.push({
        id: "task-profile-verified",
        text: `Verificar información de contacto de ${companyName}`,
        completed: true,
      })
    } else {
      pendingTasks.push({
        id: "task-profile-incomplete",
        text: "Completar nombre comercial y WhatsApp en Mi Perfil",
        completed: false,
      })
    }

    // 8. Calculate Weekly Flow Data (Flujo Semanal)
    const daysMap = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    const dailyCounts: Record<string, number> = {
      Lunes: 0,
      Martes: 0,
      Miércoles: 0,
      Jueves: 0,
      Viernes: 0,
      Sábado: 0,
      Domingo: 0,
    }

    let thisWeekTotal = 0
    let prevWeekTotal = 0
    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 7)

    recentAppDates.forEach((app: any) => {
      const appDateStr = app.applied_at || app.created_at;
      const appDate = appDateStr ? new Date(appDateStr) : new Date();
      if (appDate >= sevenDaysAgo) {
        thisWeekTotal++
        const dayName = daysMap[appDate.getDay()]
        if (dailyCounts[dayName] !== undefined) {
          dailyCounts[dayName]++
        }
      } else {
        prevWeekTotal++
      }
    })

    const weeklyFlowData = weekDaysOrdered.map((day) => ({
      day,
      candidatos: dailyCounts[day] || 0,
    }))

    const weeklyAverage = Math.round(thisWeekTotal / 7)
    const growthPercent = prevWeekTotal > 0
      ? Math.round(((thisWeekTotal - prevWeekTotal) / prevWeekTotal) * 100)
      : thisWeekTotal > 0 ? 100 : 0

    // 9. Calculate Monthly Effectiveness & Category Distribution (Efectividad del Mes)
    const categoryCounts: Record<string, number> = {}
    let totalCompanyVacs = allVacancies.length

    allVacancies.forEach((v: any) => {
      const cat = v.category || "General"
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })

    const fiordColors = ["#3e546d", "#5c7c9b", "#aabccf", "#7d99b3", "#475569", "#64748b"]
    let pieData: { name: string; value: number; color: string }[] = []

    const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])

    if (sortedCategories.length > 0 && totalCompanyVacs > 0) {
      pieData = sortedCategories.slice(0, 4).map(([name, count], index) => ({
        name,
        value: Math.round((count / totalCompanyVacs) * 100),
        color: fiordColors[index % fiordColors.length],
      }))
    } else {
      pieData = [
        { name: "Sin Vacantes", value: 100, color: "#94a3b8" }
      ]
    }

    // Real Goal Ratio calculation:
    let goalRatio = 0
    if (totalApplications > 0 && allVacancies.length > 0) {
      const { count: processedCount } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("vacancy_id", vacIds)
        .neq("status", "Pendiente")

      const handled = processedCount || 0
      goalRatio = Math.min(100, Math.round((handled / totalApplications) * 100))
    } else if (totalCompanyVacs > 0) {
      goalRatio = Math.min(100, Math.round((activeVacancies / totalCompanyVacs) * 100))
    } else {
      goalRatio = 0
    }

    return {
      companyName,
      metrics: {
        activeVacancies,
        pausedVacancies,
        totalApplications,
        reviewingApplications,
        totalConnections,
      },
      recentActivities,
      latestVacancies,
      publishedVacancies,
      pendingTasks,
      weeklyAnalytics: {
        flowData: weeklyFlowData,
        average: weeklyAverage,
        growthPercent,
      },
      monthlyAnalytics: {
        pieData,
        goalPercent: goalRatio,
      },
    }
  }

  return {
    companyName,
    metrics: {
      activeVacancies: 0,
      pausedVacancies: 0,
      totalApplications: 0,
      reviewingApplications: 0,
      totalConnections: 0,
    },
    recentActivities: [],
    latestVacancies: [],
    publishedVacancies: [],
    pendingTasks: [],
    weeklyAnalytics: {
      flowData: weekDaysOrdered.map((day) => ({ day, candidatos: 0 })),
      average: 0,
      growthPercent: 0,
    },
    monthlyAnalytics: {
      pieData: [
        { name: "Operativo", value: 60, color: "#3e546d" },
        { name: "Comercial", value: 30, color: "#5c7c9b" },
        { name: "Servicio", value: 10, color: "#aabccf" },
      ],
      goalPercent: 100,
    },
  }
}

export async function getCompanyProfileData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = {
    company_name: "",
    industry: "",
    website_or_linkedin: "",
    location: "",
    phone: "",
    company_size: "",
    description: "",
    logo_url: "",
    banner_url: "",
    instagram_url: "",
    facebook_url: "",
    address_details: "",
    has_transport: false,
    benefit_canteen: false,
    benefit_tips: false,
    benefit_imss: false,
    benefit_uniforms: false,
    benefit_growth: false,
    operation_hours: ""
  }

  if (user) {
    const metaDisplayName = user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.company_name || "";

    // Parallel execution for profiles base and company_profiles extension
    const [baseProfileRes, rawCompanyRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, username, location, avatar_url")
        .eq("id", user.id)
        .single(),
      supabase
        .from("company_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
    ]);

    const baseProfile = baseProfileRes.data as any;
    const companyData = rawCompanyRes.data as any;

    if (companyData) {
      const social = (companyData.social_links as any) || {};
      const rawCompName = companyData.company_name;
      const validCompName = (rawCompName && rawCompName.trim() !== "Nueva Empresa" && rawCompName.trim() !== "")
        ? rawCompName
        : (metaDisplayName || baseProfile?.full_name || baseProfile?.username || "");

      profile = {
        company_name: validCompName,
        industry: companyData.industry || "",
        website_or_linkedin: companyData.website_url || "",
        location: companyData.fiscal_address || baseProfile?.location || "",
        phone: companyData.contact_phone || "",
        company_size: companyData.company_size || "",
        description: companyData.description || "",
        logo_url: companyData.logo_url || baseProfile?.avatar_url || "",
        banner_url: companyData.banner_url || "",
        instagram_url: social.instagram || "",
        facebook_url: social.facebook || "",
        address_details: companyData.address_details || "",
        has_transport: !!social.has_transport,
        benefit_canteen: !!social.benefit_canteen,
        benefit_tips: !!social.benefit_tips,
        benefit_imss: !!social.benefit_imss,
        benefit_uniforms: !!social.benefit_uniforms,
        benefit_growth: !!social.benefit_growth,
        operation_hours: companyData.operation_hours || ""
      }
    } else {
      profile.company_name = metaDisplayName || baseProfile?.full_name || baseProfile?.username || "";
      profile.location = baseProfile?.location || "";
      profile.logo_url = baseProfile?.avatar_url || "";
    }

    return {
      profile,
      userId: user.id,
    }
  }

  return null
}
