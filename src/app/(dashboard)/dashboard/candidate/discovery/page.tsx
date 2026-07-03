import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { DiscoveryPage } from "@/modules/discovery/components/discovery-page";
import type { Job } from "@/modules/discovery/types";

export const dynamic = "force-dynamic";

export default async function CandidateDiscoveryRoute() {
  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  const candidateId = user?.id || "";

  let candidateSkills: string[] = [];
  let appliedVacancyIds: string[] = [];
  let candidateCity = "";

  if (user) {
    // 2. Fetch candidate skills & location
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills, location")
      .eq("id", user.id)
      .single();

    if (profile?.skills) {
      candidateSkills = profile.skills;
    }

    if (profile?.location) {
      const loc = profile.location.toLowerCase();
      if (loc.includes("mérida")) {
        candidateCity = "Mérida";
      } else if (loc.includes("playa del carmen")) {
        candidateCity = "Playa del Carmen";
      }
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
  let query = supabase
    .from("vacancies")
    .select("*")
    .eq("status", "Activa");

  if (candidateCity) {
    query = query.ilike("location", `%${candidateCity}%`);
  }

  const { data: vacancies } = await query.order("created_at", { ascending: false });

  // 5. Fetch company details for vacancies
  const companies: Record<string, { name: string; logo: string | null; phone: string | null }> = {};
  if (vacancies && vacancies.length > 0) {
    const companyIds = Array.from(
      new Set(vacancies.map((v: any) => v.company_id).filter(Boolean))
    );

    if (companyIds.length > 0) {
      const { data: companyProfiles } = await supabase
        .from("company_profiles")
        .select("id, company_name, logo_url, phone")
        .in("id", companyIds);

      if (companyProfiles) {
        companyProfiles.forEach((comp: any) => {
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
  const dbJobs: Job[] = (vacancies || []).map((vac: any) => {
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
