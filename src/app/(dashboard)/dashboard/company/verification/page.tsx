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
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <CompanyVerificationView
        userId={data.companyId}
        initialData={data.verificationData}
      />
    </div>
  );
}
