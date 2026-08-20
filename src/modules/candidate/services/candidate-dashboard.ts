import { createClient } from "@/lib/supabase/server";
import { parseLocation, cleanCityName } from "@/lib/formatters";
import { getCoordsForZone, haversineDistanceKm, GEO_CONFIG } from "@/config/geo";

export interface CandidateApplication {

  id: string
  vacancy_id?: string
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
  created_at: string
  salary_min: number | null
  salary_max: number | null
  companyPhone: string | null
}

export interface VacancyItem {
  id: string
  title: string
  companyName: string
  companyLogo: string | null
  location: string
  zone?: string
  city?: string
  employmentType: string
  formattedSalary: string
  isFeatured: boolean
  category: string
  createdAt?: string
  distanceKm?: number | null
  distanceBadge?: string | null
  salary_min?: number | null
  salary_max?: number | null
  modality?: string
  skills?: string[]
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
  featuredVacancies: VacancyItem[]
  nearbyVacancies: VacancyItem[]
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
      },
      featuredVacancies: [],
      nearbyVacancies: []
    }
  }

  // 2. Fetch candidate profile
  const [{ data: baseProfile }, { data: candProfile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, whatsapp_number, avatar_url, location")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("candidate_profiles")
      .select("id, headline, bio, skills, experience, portfolio_links, preferred_zone")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const profileData = baseProfile ? {
    id: baseProfile.id,
    full_name: baseProfile.full_name || "Candidato",
    headline: candProfile?.headline || null,
    experience_summary: candProfile?.bio || null,
    location: baseProfile.location || (candProfile?.preferred_zone ? `Mérida - ${candProfile.preferred_zone}` : null),
    skills: candProfile?.skills || null,
    avatar_url: baseProfile.avatar_url || null,
    is_approved: true,
    is_validated: true,
    experience: candProfile?.experience || null,
    cv_url: null
  } : null;

  let completionScore = 0
  if (profileData) {
    if (profileData.full_name && profileData.full_name !== "Candidato") completionScore += 20
    if (profileData.headline) completionScore += 15
    if (profileData.experience_summary) completionScore += 15
    if (profileData.location) completionScore += 10
    if (profileData.skills && profileData.skills.length > 0) completionScore += 15
    if (profileData.avatar_url) completionScore += 15
    if (profileData.experience && Array.isArray(profileData.experience) && profileData.experience.length > 0) completionScore += 10
  }

  // 3. Fetch candidate applications
  const { data: dbApplications } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      applied_at,
      vacancy_id,
      vacancy:vacancies (
        id,
        title,
        location,
        modality,
        skills,
        salary_min,
        salary_max,
        created_at,
        company_id
      )
    `)
    .eq("candidate_id", user.id)
    .order("applied_at", { ascending: false })

  interface DBApplication {
    id: string
    status: string
    applied_at: string | null
    created_at?: string | null
    vacancy: {
      id: string
      title: string
      location: string | null
      modality: string
      skills: string[] | null
      salary_min: number | null
      salary_max: number | null
      created_at: string
      company_id: string
    } | null
  }

  const typedApplications = (dbApplications as unknown as DBApplication[]) || []

  // 4. Fetch ALL active vacancies (flexible status & is_active checks)
  const { data: rawVacancies, error: vacErr } = await supabase
    .from("vacancies")
    .select(`
      id,
      title,
      location,
      modality,
      employment_type,
      salary_min,
      salary_max,
      is_promoted,
      category,
      company_id,
      created_at,
      status,
      is_active,
      zone
    `)
    .or("is_active.eq.true,status.eq.Activa,status.eq.activa,status.eq.published,status.eq.Publicada")
    .order("created_at", { ascending: false });

  if (vacErr) {
    console.error("[getCandidateDashboardData] Error fetching vacancies:", vacErr.message || vacErr);
  }

  const allActiveVacancies = rawVacancies || [];

  // 5. Gather company IDs to fetch company profiles in batch
  const companyIds = Array.from(
    new Set([
      ...typedApplications.map((app) => app.vacancy?.company_id).filter(Boolean),
      ...allActiveVacancies.map((vac: any) => vac.company_id).filter(Boolean),
    ])
  ) as string[];

  const companies: Record<string, { company_name: string; logo_url: string | null; phone: string | null }> = {};

  if (companyIds.length > 0) {
    const { data: companyProfiles } = await supabase
      .from("company_profiles")
      .select("id, company_name, logo_url, contact_phone")
      .in("id", companyIds);

    if (companyProfiles) {
      companyProfiles.forEach((comp: any) => {
        companies[comp.id] = {
          company_name: comp.company_name || "Empresa",
          logo_url: comp.logo_url || null,
          phone: comp.contact_phone || null
        };
      });
    }
  }

  // 6. Format applications
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

    const appDateStr = app.applied_at || app.created_at
    const appliedDate = appDateStr
      ? new Date(appDateStr).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      : "Reciente"

    return {
      id: app.id,
      vacancy_id: vacancy?.id || (app as any).vacancy_id || "",
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
      created_at: appDateStr || new Date().toISOString(),
      salary_min: vacancy?.salary_min ?? null,
      salary_max: vacancy?.salary_max ?? null,
      companyPhone: companyInfo?.phone || null
    }
  })

  const total = formattedApplications.length
  const reviewing = formattedApplications.filter(
    (app) => app.status === "En revisión" || app.status === "Preseleccionado"
  ).length
  const hired = formattedApplications.filter((app) => app.status === "Contratado").length

  // 7. Sort vacancies by real geographic proximity and city match
  const candidateLocation = profileData?.location || "";
  const parsedCandidateLoc = parseLocation(candidateLocation);
  const candidateCity = cleanCityName(parsedCandidateLoc.city);
  const candidateCoords =
    getCoordsForZone(candidateLocation) ||
    getCoordsForZone(parsedCandidateLoc.zone) ||
    (GEO_CONFIG[candidateCity]?.coords ?? null);

  // Helper formatter for vacancy items
  const formatVacancyItem = (vac: any): VacancyItem => {
    const compInfo = companies[vac.company_id]
    const compName = compInfo?.company_name || "Empresa"
    const compLogo = compInfo?.logo_url || null

    let formattedSalary = ""
    const min = Number(vac.salary_min)
    const max = Number(vac.salary_max)
    if (min && max) {
      formattedSalary = `$${min.toLocaleString()} - $${max.toLocaleString()} MXN`
    } else if (min) {
      formattedSalary = `Desde $${min.toLocaleString()} MXN`
    } else if (max) {
      formattedSalary = `Hasta $${max.toLocaleString()} MXN`
    } else {
      formattedSalary = "Sueldo no especificado"
    }

    const cleanCity = cleanCityName(vac.location || "");
    const displayLocation = vac.zone && cleanCity
      ? `${vac.zone}, ${cleanCity}`
      : vac.location || vac.zone || vac.modality || "Ubicación no especificada";

    let distanceBadge: string | null = null;
    let distanceKm: number | null = null;

    if (candidateCoords) {
      const vacCoords =
        getCoordsForZone(`${cleanCity} - ${vac.zone || ""}`) ||
        getCoordsForZone(vac.zone) ||
        getCoordsForZone(cleanCity) ||
        (GEO_CONFIG[cleanCity]?.coords ?? null);

      if (vacCoords) {
        distanceKm = haversineDistanceKm(candidateCoords.lat, candidateCoords.lng, vacCoords.lat, vacCoords.lng);
        if (distanceKm < 1.5) {
          distanceBadge = "< 1.5 km (Misma zona)";
        } else if (distanceKm < 10) {
          distanceBadge = `${distanceKm.toFixed(1)} km cerca`;
        } else if (distanceKm < 35) {
          distanceBadge = `${distanceKm.toFixed(0)} km (${cleanCity})`;
        } else {
          distanceBadge = `${distanceKm.toFixed(0)} km`;
        }
      }
    } else if (candidateCity && cleanCity.toLowerCase() === candidateCity.toLowerCase()) {
      distanceBadge = `En tu ciudad (${cleanCity})`;
    }

    return {
      id: vac.id,
      title: vac.title,
      companyName: compName,
      companyLogo: compLogo,
      location: displayLocation,
      zone: vac.zone || "",
      city: cleanCity,
      employmentType: vac.employment_type || vac.modality || "Tiempo Completo",
      formattedSalary,
      isFeatured: !!(vac.is_promoted || vac.is_featured),
      category: vac.category || "General",
      createdAt: vac.created_at,
      distanceKm,
      distanceBadge,
      salary_min: min || null,
      salary_max: max || null,
      modality: vac.modality || "Presencial",
      skills: vac.skills || []
    }
  }


  // Featured vacancies (promoted or top vacancies)
  const promotedList = allActiveVacancies.filter((v: any) => v.is_promoted || v.is_featured);
  const featuredDb = promotedList.length > 0 ? promotedList : allActiveVacancies.slice(0, 4);

  // Nearby vacancies: sorted accurately using Haversine distance and city match
  const sortedNearbyDb = [...allActiveVacancies].sort((a: any, b: any) => {
    // 1. If candidate has known GPS / Zone coordinates, calculate true Haversine distance
    if (candidateCoords) {
      const cityA = cleanCityName(a.location || "");
      const cityB = cleanCityName(b.location || "");

      const coordsA =
        getCoordsForZone(`${cityA} - ${a.zone || ""}`) ||
        getCoordsForZone(a.zone) ||
        getCoordsForZone(cityA) ||
        (GEO_CONFIG[cityA]?.coords ?? null);

      const coordsB =
        getCoordsForZone(`${cityB} - ${b.zone || ""}`) ||
        getCoordsForZone(b.zone) ||
        getCoordsForZone(cityB) ||
        (GEO_CONFIG[cityB]?.coords ?? null);

      if (coordsA && coordsB) {
        const distA = haversineDistanceKm(candidateCoords.lat, candidateCoords.lng, coordsA.lat, coordsA.lng);
        const distB = haversineDistanceKm(candidateCoords.lat, candidateCoords.lng, coordsB.lat, coordsB.lng);
        if (Math.abs(distA - distB) > 0.2) {
          return distA - distB;
        }
      } else if (coordsA && !coordsB) {
        return -1;
      } else if (!coordsA && coordsB) {
        return 1;
      }
    }

    // 2. City-level match fallback
    if (candidateCity) {
      const cityA = cleanCityName(a.location || "");
      const cityB = cleanCityName(b.location || "");
      const matchA = cityA.toLowerCase() === candidateCity.toLowerCase();
      const matchB = cityB.toLowerCase() === candidateCity.toLowerCase();
      if (matchA && !matchB) return -1;
      if (!matchA && matchB) return 1;
    }

    // 3. Keep newer vacancies first
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const featuredVacancies = featuredDb.map(formatVacancyItem);
  const nearbyVacancies = sortedNearbyDb.map(formatVacancyItem);

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
    },
    featuredVacancies,
    nearbyVacancies
  }
}
