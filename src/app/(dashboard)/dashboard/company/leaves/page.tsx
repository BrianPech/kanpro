import * as React from "react";
import { getCompanyVacationRequests } from "@/modules/company/services/company-dossier";
import { CompanyLeavesView } from "@/modules/company/components/leaves/company-leaves-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vacaciones & Permisos LFT | K'anPro",
  description: "Gestión y autorización de vacaciones conforme a la Ley Federal del Trabajo y permisos.",
};

export default async function CompanyLeavesPage() {
  const data = await getCompanyVacationRequests();

  return (
    <CompanyLeavesView
      initialRequests={data.requests}
      companyName={data.companyName}
      stats={data.stats}
      employees={data.employees}
    />
  );
}
