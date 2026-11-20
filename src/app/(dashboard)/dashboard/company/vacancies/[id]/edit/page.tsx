import * as React from "react";
import { VacancyEditFormView } from "@/modules/company/components/vacancy-edit-form-view";
import { createClient } from "@/lib/supabase/server";
import { companyTenantService } from "@/modules/company/services/company-tenant.service";
import {
  CompanyVacanciesService,
  type VacancyRow,
  type VacancyWizardCompanyPrefill,
} from "@/modules/company/services/company-vacancies";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVacancyPage({ params }: PageProps) {
  const { id } = await params;
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

  let initialVacancy: VacancyRow | null = null;
  let companyPrefill: VacancyWizardCompanyPrefill | null = null;
  try {
    const service = new CompanyVacanciesService(supabase);
    [initialVacancy, companyPrefill] = await Promise.all([
      service.getVacancyById(companyId, id),
      service.getWizardCompanyPrefill(companyId, user.id),
    ]);
  } catch (err) {
    console.error("Error loading vacancy for editing:", err);
  }

  return (
    <VacancyEditFormView
      userId={user.id}
      vacancyId={id}
      initialVacancy={initialVacancy}
      companyPrefill={companyPrefill}
    />
  );
}
