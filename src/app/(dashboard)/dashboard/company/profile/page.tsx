import * as React from "react";
import { CompanyProfileForm } from "@/modules/company/components/company-profile-form";
import { getCompanyProfileData } from "@/modules/company/services/company-dashboard";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";

export default async function CompanyProfilePage() {
  const { activeCompanyId } = await getDashboardSession();
  const data = await getCompanyProfileData(activeCompanyId);

  if (!data) return null;

  const { profile, userId } = data;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <CompanyProfileForm initialProfile={profile || {}} userId={userId} />
    </div>
  );
}
