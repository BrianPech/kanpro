import * as React from "react"
import { CompanyProfileForm } from "@/modules/company/components/company-profile-form"
import { getCompanyProfileData } from "@/modules/company/services/company-dashboard"

export default async function CompanyProfilePage() {
  const data = await getCompanyProfileData()

  if (!data) return null

  const { profile, userId } = data


  return (
    <div className="p-6 md:p-12 lg:p-16 max-w-[1000px] mx-auto w-full">
      <div className="mb-12">
        <h1 className="text-[40px] font-medium tracking-tight text-foreground mb-2">Perfil de Empresa</h1>
        <p className="text-[16px] text-muted-foreground">Completa la información de tu empresa para empezar a publicar proyectos.</p>
      </div>
      <CompanyProfileForm initialProfile={profile} userId={userId} />
    </div>
  )
}
