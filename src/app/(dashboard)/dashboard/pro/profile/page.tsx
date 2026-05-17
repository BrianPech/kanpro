import * as React from "react"

import { ProfileForm } from "@/modules/pro/components/profile-form"
import { getProProfileData } from "@/modules/pro/services/pro-dashboard"

export default async function ProfilePage() {
  const data = await getProProfileData()

  if (!data) return null

  const { profile, services, userId } = data

  return (
    <ProfileForm initialProfile={profile} userId={userId} initialServices={services} />
  )
}

