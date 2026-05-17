import { createClient } from "@/lib/supabase/server"

export async function getProDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profileName = "Profesional"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let services: any[] = []

  if (user) {
    // Intentar obtener el nombre del perfil profesional
    const { data: proProfile } = await supabase
      .from("professional_profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    if (proProfile?.full_name) {
      profileName = proProfile.full_name.split(" ")[0] // Solo el primer nombre
    } else {
      // Fallback al perfil base
      const { data: baseProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()
      
      if (baseProfile?.full_name) {
        profileName = baseProfile.full_name.split(" ")[0]
      }
    }

    // Obtener los servicios reales
    const { data: servicesData } = await supabase
      .from("services")
      .select("*")
      .eq("professional_id", user.id)
      .limit(2) // Mostrar solo los 2 primeros en el dashboard

    services = servicesData || []
  }

  return {
    profileName,
    services,
  }
}

export async function getProServices() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("professional_id", user.id)
    .order("created_at", { ascending: false })

  return {
    services: services || [],
    userId: user.id,
  }
}

export async function getProProfileData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = {
    full_name: "",
    headline: "",
    bio: "",
    category: "",
    location: "",
    birth_date: "",
    phone: "",
    hourly_rate: "",
    skills: [] as string[],
    avatar_url: ""
  }

  if (user) {
    const { data } = await supabase
      .from("professional_profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    
    if (data) {
      profile = {
        full_name: data.full_name || "",
        headline: data.headline || "",
        bio: data.bio || "",
        category: data.category || "",
        location: data.location || "",
        birth_date: data.birth_date || "",
        phone: data.phone || "",
        hourly_rate: data.hourly_rate?.toString() || "",
        skills: data.skills || [],
        avatar_url: data.avatar_url || ""
      }
    } else {
      // Fallback a nombre de usuario si no hay perfil profesional
      const { data: baseProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single()
      if (baseProfile?.full_name) profile.full_name = baseProfile.full_name
    }
    // Obtener también los servicios para la vista previa
    const { data: services } = await supabase
      .from("services")
      .select("*")
      .eq("professional_id", user.id)

    return {
      profile,
      services: services || [],
      userId: user.id,
    }
  }

  return null
}
