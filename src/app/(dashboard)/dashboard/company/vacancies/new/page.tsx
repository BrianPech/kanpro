import * as React from "react";
import { VacancyFormView } from "@/modules/company/components/vacancy-form-view";
import { createClient } from "@/lib/supabase/server";
import { companyTenantService } from "@/modules/company/services/company-tenant.service";
import {
  CompanyVacanciesService,
  type VacancyWizardCompanyPrefill,
} from "@/modules/company/services/company-vacancies";
import { redirect } from "next/navigation";

export default async function NewVacancyPage() {
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

  let companyPrefill: VacancyWizardCompanyPrefill | null = null;
  try {
    const service = new CompanyVacanciesService(supabase);
    companyPrefill = await service.getWizardCompanyPrefill(companyId, user.id);
  } catch (err) {
    console.error("Error loading company prefill:", err);
  }

  return <VacancyFormView userId={companyId} companyPrefill={companyPrefill} />;
}
