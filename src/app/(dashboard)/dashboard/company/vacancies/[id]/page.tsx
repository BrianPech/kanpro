import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { companyTenantService } from "@/modules/company/services/company-tenant.service";
import {
  CompanyVacanciesService,
  type VacancyDetailData,
} from "@/modules/company/services/company-vacancies";
import { VacancyDetailView } from "@/modules/company/components/vacancy-detail-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VacancyDetailPage({ params }: PageProps) {
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

  let initialDetail: VacancyDetailData | null = null;
  try {
    const service = new CompanyVacanciesService(supabase);
    initialDetail = await service.getVacancyDetail(companyId, id);
  } catch (err) {
    console.error("Error loading vacancy detail:", err);
  }

  return <VacancyDetailView initialDetail={initialDetail} />;
}
