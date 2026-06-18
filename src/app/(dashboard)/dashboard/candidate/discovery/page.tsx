import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { DiscoveryPage } from "@/modules/discovery/components/discovery-page";

export const dynamic = "force-dynamic";

export default async function CandidateDiscoveryRoute() {
  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  const candidateId = user?.id || "";

  let candidateSkills: string[] = [];
  let appliedVacancyIds: string[] = [];

  if (user) {
    // 2. Fetch candidate skills
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills")
      .eq("id", user.id)
      .single();

    if (profile?.skills) {
      candidateSkills = profile.skills;
    }

    // 3. Fetch candidate's current applications to mark them as "Applied"
    const { data: applications } = await supabase
      .from("applications")
      .select("vacancy_id")
      .eq("candidate_id", user.id);

    if (applications) {
      appliedVacancyIds = applications.map((app: { vacancy_id: string }) => app.vacancy_id);
    }
  }

  // 4. Fetch active vacancies from Supabase
  const { data: vacancies } = await supabase
    .from("vacancies")
    .select("*")
    .eq("status", "Activa")
    .order("created_at", { ascending: false });

  // 5. Fetch company details for vacancies
  const companies: Record<string, { name: string; logo: string | null; phone: string | null }> = {};
  if (vacancies && vacancies.length > 0) {
    const companyIds = Array.from(
      new Set(vacancies.map((v) => v.company_id).filter(Boolean))
    );

    if (companyIds.length > 0) {
      const { data: companyProfiles } = await supabase
        .from("company_profiles")
        .select("id, company_name, logo_url, phone")
        .in("id", companyIds);

      if (companyProfiles) {
        companyProfiles.forEach((comp) => {
          companies[comp.id] = {
            name: comp.company_name || "Empresa",
            logo: comp.logo_url || null,
            phone: comp.phone || null,
          };
        });
      }
    }
  }

  // 6. Format database vacancies
  const dbJobs = (vacancies || []).map((vac) => {
    const companyInfo = companies[vac.company_id];
    const companyName = companyInfo?.name || "Empresa";
    const logoUrl = companyInfo?.logo || null;
    const companyInitials = companyName.substring(0, 2).toUpperCase();

    return {
      id: vac.id,
      title: vac.title,
      company: companyName,
      companyLogo: companyInitials,
      logoUrl: logoUrl,
      location: vac.location || vac.modality || "Remoto",
      salaryMin: Number(vac.salary_min) || 0,
      salaryMax: Number(vac.salary_max) || 0,
      salaryFormatted: vac.salary || "Sueldo no especificado",
      type: vac.employment_type || vac.modality || "Full-time",
      category: vac.category || "Development",
      experience: vac.seniority || "Senior",
      skills: vac.skills || [],
      postedAt: vac.created_at
        ? new Date(vac.created_at).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          })
        : "Reciente",
      featured: false,
      description: vac.description,
      benefits: vac.benefits || [],
      isFromDb: true,
      companyPhone: companyInfo?.phone || null,
    };
  });

  return (
    <DiscoveryPage
      showNav={false}
      dbJobs={dbJobs}
      candidateSkills={candidateSkills}
      appliedVacancyIds={appliedVacancyIds}
      candidateId={candidateId}
    />
  );
}
