import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { JobSearchView, SearchVacancy } from "@/modules/candidate/components/job-search-view";

export const dynamic = "force-dynamic";

export default async function CandidateDiscoveryRoute() {
  const supabase = await createClient();

  // 1. Fetch active vacancies
  const { data: vacancies } = await supabase
    .from("vacancies")
    .select(`
      id,
      title,
      location,
      modality,
      employment_type,
      salary_min,
      salary_max,
      is_featured,
      category,
      company_id,
      created_at
    `)
    .or("status.eq.Activa,status.eq.activa,status.eq.published,is_active.eq.true")
    .order("created_at", { ascending: false });

  // 2. Fetch company profiles
  const companies: Record<string, { company_name: string; logo_url: string | null }> = {};
  if (vacancies && vacancies.length > 0) {
    const companyIds = Array.from(
      new Set(vacancies.map((v: any) => v.company_id).filter(Boolean))
    );

    if (companyIds.length > 0) {
      const { data: companyProfiles } = await supabase
        .from("company_profiles")
        .select("id, company_name, logo_url")
        .in("id", companyIds);

      if (companyProfiles) {
        companyProfiles.forEach((comp: any) => {
          companies[comp.id] = {
            company_name: comp.company_name || "Empresa",
            logo_url: comp.logo_url || null,
          };
        });
      }
    }
  }

  // 3. Format vacancies into SearchVacancy list
  const searchVacancies: SearchVacancy[] = (vacancies || []).map((vac: any) => {
    const compInfo = companies[vac.company_id];
    const compName = compInfo?.company_name || "Empresa";
    const compLogo = compInfo?.logo_url || null;

    let formattedSalary = "";
    const min = Number(vac.salary_min);
    const max = Number(vac.salary_max);
    if (min && max) {
      formattedSalary = `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    } else if (min) {
      formattedSalary = `Desde $${min.toLocaleString()}`;
    } else if (max) {
      formattedSalary = `Hasta $${max.toLocaleString()}`;
    } else {
      formattedSalary = "Sueldo competitivo";
    }

    return {
      id: vac.id,
      title: vac.title,
      companyName: compName,
      companyLogo: compLogo,
      location: vac.location || vac.modality || "Remoto",
      employmentType: vac.employment_type || vac.modality || "Tiempo Completo",
      formattedSalary,
      isFeatured: !!vac.is_featured,
      category: vac.category || "General",
    };
  });

  return <JobSearchView initialVacancies={searchVacancies} />;
}
