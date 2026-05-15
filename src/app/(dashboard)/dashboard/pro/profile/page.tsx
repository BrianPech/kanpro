import * as React from "react"
import { User, MapPin, Briefcase, DollarSign, Camera, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/server"

import { ProfileForm } from "./profile-form"

export default async function ProfilePage() {
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
  }

  if (!user) return null

  return (
    <ProfileForm initialProfile={profile} userId={user.id} />
  )
}
