import * as React from "react"
import { CompanyProfileForm } from "@/modules/company/components/company-profile-form"
import { getCompanyProfileData } from "@/modules/company/services/company-dashboard"

export default async function CompanyProfilePage() {
  const data = await getCompanyProfileData()

  if (!data) return null

  const { profile, userId } = data


  return (
    <div className="flex-grow min-h-screen bg-fiord-50/20 dark:bg-[#18181B] px-6 sm:px-10 lg:px-14 py-8 pb-28 md:pb-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      <CompanyProfileForm initialProfile={profile} userId={userId} />
    </div>
  )
}
