import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { JobSearchView, SearchVacancy } from "@/modules/candidate/components/job-search-view";

export const dynamic = "force-dynamic";

async function getDiscoveryVacancies(): Promise<SearchVacancy[]> {
  const supabase = await createClient();

  // 1. Fetch active vacancies
  const { data: vacancies } = await supabase
    .from("vacancies")
    .select(`
      id,
      title,
      description,
      location,
      modality,
      employment_type,
      salary_min,
      salary_max,
      payment_frequency,
      contact_phone,
      preferred_contact_method,
      is_featured,
      is_promoted,
      category,
      skills,
      benefits,
      requirements,
      zone,
      company_id,
      created_at
    `)
    .or("status.eq.Activa,status.eq.activa,status.eq.published,is_active.eq.true")
    .order("created_at", { ascending: false });

  // 2. Fetch company profiles with authenticated session (anon has no table grants)
  const companies: Record<
    string,
    {
      company_name: string;
      logo_url: string | null;
      contact_phone: string | null;
      verification_status: string | null;
    }
  > = {};
  if (vacancies && vacancies.length > 0) {
    const companyIds = Array.from(
      new Set(vacancies.map((v) => v.company_id).filter(Boolean))
    ) as string[];

    if (companyIds.length > 0) {
      const { data: companyDirectoryRows } = await supabase
        .from("company_directory")
        .select("id, company_name, logo_url, contact_phone, verification_status")
        .in("id", companyIds);

      if (companyDirectoryRows) {
        companyDirectoryRows.forEach((comp) => {
          if (!comp.id) return;
          companies[comp.id] = {
            company_name: comp.company_name || "Empresa",
            logo_url: comp.logo_url || null,
            contact_phone: comp.contact_phone || null,
            verification_status: comp.verification_status || null,
          };
        });
      }
    }
  }

  // 3. Format vacancies into SearchVacancy list
  return (vacancies || []).map((vac) => {
    const compInfo = companies[vac.company_id];
    const compName = compInfo?.company_name || "Empresa";
    const compLogo = compInfo?.logo_url || null;
    const compPhone = compInfo?.contact_phone || null;

    let formattedSalary = "";
    const min = Number(vac.salary_min);
    const max = Number(vac.salary_max);
    if (min && max) {
      formattedSalary = `$${min.toLocaleString()} - $${max.toLocaleString()} MXN`;
    } else if (min) {
      formattedSalary = `Desde $${min.toLocaleString()} MXN`;
    } else if (max) {
      formattedSalary = `Hasta $${max.toLocaleString()} MXN`;
    } else {
      formattedSalary = "Sueldo no especificado";
    }

    return {
      id: vac.id,
      title: vac.title,
      companyName: compName,
      companyLogo: compLogo,
      companyPhone: compPhone,
      contactPhone: vac.contact_phone || compPhone,
      preferredContactMethod: vac.preferred_contact_method || "whatsapp",
      paymentFrequency: vac.payment_frequency || "quincenal",
      isVerifiedCompany: compInfo?.verification_status === "approved",
      location: vac.location || vac.modality || "Remoto",
      employmentType: vac.employment_type || vac.modality || "Tiempo Completo",
      formattedSalary,
      isFeatured: !!(vac.is_featured || vac.is_promoted),
      category: vac.category || "General",
      description: vac.description || "",
      skills: vac.skills || [],
      benefits: vac.benefits || [],
      requirements: vac.requirements || null,
      zone: vac.zone || "",
      modality: vac.modality || "",
      createdAt: vac.created_at,
    };
  });
}

export default async function CandidateDiscoveryRoute() {
  const searchVacancies = await getDiscoveryVacancies();

  return <JobSearchView initialVacancies={searchVacancies} />;
}
