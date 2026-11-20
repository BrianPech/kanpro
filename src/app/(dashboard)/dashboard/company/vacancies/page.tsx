import * as React from "react";
import { VacanciesManager } from "@/modules/company/components/vacancies-manager";
import { createClient } from "@/lib/supabase/server";
import { companyTenantService } from "@/modules/company/services/company-tenant.service";
import {
  CompanyVacanciesService,
  type VacancyManagerProfileSummary,
} from "@/modules/company/services/company-vacancies";
import { redirect } from "next/navigation";

export default async function VacanciesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { companyId } = await companyTenantService.resolveActiveCompanyScope(
    user.id,
    supabase
  );

  let initialProfile: VacancyManagerProfileSummary | null = null;
  try {
    const service = new CompanyVacanciesService(supabase);
    initialProfile = await service.getManagerProfileSummary(
      companyId,
      user.id
    );
  } catch (err) {
    console.error("Error loading company profile summary:", err);
  }

  return (
    <VacanciesManager userId={companyId} initialProfile={initialProfile} />
  );
}
