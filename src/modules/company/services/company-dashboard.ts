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
    // 1. Get company name
    const { data: companyData } = await supabase
      .from("company_profiles")
      .select("company_name")
      .eq("id", user.id)
      .single()

    if (companyData?.company_name) {
      companyName = companyData.company_name
    }

    // 2. Fetch top 3 most recent published vacancies ordered by created_at DESC (Optimized DB query)
    const { data: pubVacsData } = await supabase
      .from("vacancies")
      .select("id, title, location, zone, salary_min, salary_max, category, employment_type, created_at, is_active")
      .eq("company_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3)

    const publishedVacanciesRaw = pubVacsData || []
    latestVacancies = publishedVacanciesRaw.slice(0, 2)

    // Compute application counts per vacancy for top 3
    publishedVacancies = await Promise.all(
      publishedVacanciesRaw.map(async (v: any) => {
        const { count } = await supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("vacancy_id", v.id)

        return {
          ...v,
          applicationsCount: count || 0,
        }
      })
    )

    // 3. Count total active vacancies efficiently from DB
    const { count: activeCount } = await supabase
      .from("vacancies")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.id)
      .eq("is_active", true)

    activeVacancies = activeCount || 0

    // 4. Count total paused/inactive vacancies efficiently from DB
    const { count: pausedCount } = await supabase
      .from("vacancies")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.id)
      .eq("is_active", false)

    pausedVacancies = pausedCount || 0

    // 5. Get all vacancy IDs to fetch application stats
    const { data: allVacIdsData } = await supabase
      .from("vacancies")
      .select("id")
      .eq("company_id", user.id)

    const vacIds = (allVacIdsData || []).map((v: any) => v.id)

    let recentAppDates: any[] = []

    if (vacIds.length > 0) {
      // Total applications count
      const { count: appCount } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("vacancy_id", vacIds)

      totalApplications = appCount || 0

      // Reviewing/pending applications count
      const { count: revCount } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .in("vacancy_id", vacIds)
        .in("status", ["En revisión", "Preseleccionado", "Pendiente"])

      reviewingApplications = revCount || 0

      // Recent applications list (limit 5)
      const { data: recentApps } = await supabase
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
        .limit(5)

      recentActivities = (recentApps || []).map((app: any) => {
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

      // Fetch dates of recent applications for weekly flow chart (last 14 days)
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

      const { data: appDates } = await supabase
        .from("applications")
        .select("applied_at")
        .in("vacancy_id", vacIds)
        .gte("applied_at", fourteenDaysAgo.toISOString())

      recentAppDates = appDates || []
    }

    // 6. Get direct connections count
    const { count: connCount } = await (supabase
      .from("connections" as any) as any)
      .select("id", { count: "exact", head: true })
      .eq("recruiter_id", user.id)

    totalConnections = connCount || 0

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
    const { data: vacCategoriesData } = await supabase
      .from("vacancies")
      .select("category")
      .eq("company_id", user.id)

    const categoryCounts: Record<string, number> = {}
    let totalCatVacs = 0

    const categoriesList = vacCategoriesData || []
    categoriesList.forEach((v: any) => {
      const cat = v.category || "General"
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
      totalCatVacs++
    })

    const fiordColors = ["#3e546d", "#5c7c9b", "#aabccf", "#7d99b3"]
    let pieData: { name: string; value: number; color: string }[] = []

    const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])

    if (sortedCategories.length > 0 && totalCatVacs > 0) {
      pieData = sortedCategories.slice(0, 3).map(([name, count], index) => ({
        name,
        value: Math.round((count / totalCatVacs) * 100),
        color: fiordColors[index % fiordColors.length],
      }))
    } else {
      pieData = [
        { name: "Operativo", value: 60, color: "#3e546d" },
        { name: "Comercial", value: 30, color: "#5c7c9b" },
        { name: "Servicio", value: 10, color: "#aabccf" },
      ]
    }

    const goalRatio = totalCatVacs > 0 ? Math.round((activeVacancies / totalCatVacs) * 100) : 100

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

    const { data: baseProfile } = await supabase
      .from("profiles")
      .select("full_name, username, location, avatar_url")
      .eq("id", user.id)
      .single();

    const { data: rawCompanyData } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const companyData = rawCompanyData as any;

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
