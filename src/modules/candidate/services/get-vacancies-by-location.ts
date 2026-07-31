"use server";

import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/modules/discovery/types";

export async function getVacanciesByLocation(
  searchQuery?: string,
  locationQuery?: string
): Promise<Job[]> {
  const supabase = await createClient();

  // Paso A: Filtro Duro por Ciudad (default to candidate's city)
  let candidateCity = "";
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("location")
      .eq("id", user.id)
      .single();
    if (profile?.location) {
      const loc = profile.location.toLowerCase();
      if (loc.includes("mérida")) {
        candidateCity = "Mérida";
      } else if (loc.includes("playa del carmen")) {
        candidateCity = "Playa del Carmen";
      }
    }
  }

  let query = supabase
    .from("vacancies")
    .select("id, title, location, modality, salary_min, salary_max, employment_type, category, seniority, skills, created_at, description, benefits, status, company_id")
    .or("status.eq.Activa,status.eq.activa,status.eq.published,is_active.eq.true");

  if (searchQuery) {
    const term = `%${searchQuery}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term}`);
  }

  if (locationQuery) {
    query = query.ilike("location", `%${locationQuery}%`);
  } else if (candidateCity) {
    query = query.ilike("location", `%${candidateCity}%`);
  }

  query = query.order("created_at", { ascending: false });

  const { data: vacancies, error } = await query;

  if (error) {
    console.error("Error fetching vacancies in Server Action:", error);
    throw new Error("Error al consultar las vacantes");
  }

  if (!vacancies || vacancies.length === 0) {
    return [];
  }

  // 2. Fetch company details for vacancies
  const companyIds = Array.from(
    new Set(vacancies.map((v: any) => v.company_id).filter(Boolean))
  );

  const companies: Record<string, { name: string; logo: string | null; phone: string | null }> = {};
  
  if (companyIds.length > 0) {
    const { data: companyProfiles } = await supabase
      .from("company_profiles")
      .select("id, company_name, logo_url, contact_phone")
      .in("id", companyIds);

    if (companyProfiles) {
      companyProfiles.forEach((comp: any) => {
        companies[comp.id] = {
          name: comp.company_name || "Empresa",
          logo: comp.logo_url || null,
          phone: comp.contact_phone || null,
        };
      });
    }
  }

  // 3. Format result to conform with Job interface
  return vacancies.map((vac: any) => {
    const companyInfo = companies[vac.company_id];
    const companyName = companyInfo?.name || "Empresa";
    const logoUrl = companyInfo?.logo || null;
    const companyInitials = companyName.substring(0, 2).toUpperCase();

    let formattedSalary = "";
    if (vac.salary_min || vac.salary_max) {
      const min = Number(vac.salary_min);
      const max = Number(vac.salary_max);
      if (min && max) {
        formattedSalary = `MXN ${min.toLocaleString()} - ${max.toLocaleString()}`;
      } else if (min) {
        formattedSalary = `Desde MXN ${min.toLocaleString()}`;
      } else if (max) {
        formattedSalary = `Hasta MXN ${max.toLocaleString()}`;
      }
    }
    if (!formattedSalary) {
      formattedSalary = "Sueldo no especificado";
    }

    return {
      id: vac.id,
      title: vac.title,
      company: companyName,
      companyLogo: companyInitials,
      logoUrl: logoUrl,
      location: vac.location || vac.modality || "Remoto",
      salaryMin: Number(vac.salary_min) || 0,
      salaryMax: Number(vac.salary_max) || 0,
      salaryFormatted: formattedSalary,
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
}
