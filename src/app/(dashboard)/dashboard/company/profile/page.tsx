import * as React from "react"
import { createClient } from "@/lib/supabase/server"
import { CompanyProfileForm } from "./company-profile-form"

export default async function CompanyProfilePage() {
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
  }

  if (!user) return null

  return (
    <div className="p-6 md:p-12 lg:p-16 max-w-[1000px] mx-auto w-full">
      <div className="mb-12">
        <h1 className="text-[40px] font-medium tracking-tight text-foreground mb-2">Perfil de Empresa</h1>
        <p className="text-[16px] text-muted-foreground">Completa la información de tu empresa para empezar a publicar proyectos.</p>
      </div>
      <CompanyProfileForm initialProfile={profile} userId={user.id} />
    </div>
  )
}
