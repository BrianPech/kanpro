import { createClient } from "@/lib/supabase/server"

export async function getCompanyDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let companyName = "Empresa"

  if (user) {
    const { data } = await supabase
      .from("company_profiles")
      .select("company_name")
      .eq("id", user.id)
      .single()
    
    if (data?.company_name) {
      companyName = data.company_name
    }
  }

  return {
    companyName,
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
