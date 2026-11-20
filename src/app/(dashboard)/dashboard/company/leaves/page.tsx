import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { getCompanyVacationRequests } from "@/modules/company/services/company-dossier";
import { CompanyLeavesView } from "@/modules/company/components/leaves/company-leaves-view";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vacaciones & Permisos LFT",
  description: "Gestión y autorización de vacaciones conforme a la Ley Federal del Trabajo y permisos.",
};

export default async function CompanyLeavesPage() {
  const [{ activeCompanyId }, supabase] = await Promise.all([
    getDashboardSession(),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetCompanyId = activeCompanyId || user?.id || "";
  const data = await getCompanyVacationRequests(supabase, targetCompanyId);

  return (
    <CompanyLeavesView
      initialRequests={data.requests}
      companyName={data.companyName}
      initialApprovalMode={data.approvalMode}
      stats={data.stats}
      employees={data.employees}
    />
  );
}
