import * as React from "react";
import { CompanyVerificationView } from "@/modules/company/components/company-verification-view";
import { getCompanyVerificationServerData } from "@/modules/company/services/company-verification.server";
import { redirect } from "next/navigation";

export default async function CompanyVerificationPage() {
  const data = await getCompanyVerificationServerData();

  if (!data) {
    redirect("/dashboard/company");
  }

  return (
    <div className="flex-grow min-h-screen bg-fiord-50/20 dark:bg-[#18181B] px-6 sm:px-10 lg:px-14 py-8 pb-28 md:pb-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      <CompanyVerificationView
        userId={data.companyId}
        initialData={data.verificationData}
      />
    </div>
  );
}
