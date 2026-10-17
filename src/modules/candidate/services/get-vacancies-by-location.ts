"use server";

import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/modules/discovery/types";

export async function getVacanciesByLocation(
  searchQuery?: string,
  locationQuery?: string,
  categoryQuery?: string,
  modalityQuery?: string,
  page: number = 0,
  limit: number = 20
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
    .select(`
      id,
      title,
      location,
      modality,
      salary_min,
      salary_max,
      employment_type,
      category,
      seniority,
      skills,
      created_at,
      description,
      benefits,
      status,
      company_id,
      company:company_profiles (
        id,
        company_name,
        logo_url
      )
    `)
    .or("status.eq.Activa,status.eq.activa,status.eq.published,is_active.eq.true");

  if (searchQuery) {
    const sanitized = searchQuery.replace(/[(),]/g, " ").trim();
    if (sanitized) {
      const term = `%${sanitized}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term}`);
    }
  }

  if (locationQuery) {
    query = query.ilike("location", `%${locationQuery}%`);
  } else if (candidateCity) {
    query = query.ilike("location", `%${candidateCity}%`);
  }

  if (categoryQuery) {
    query = query.ilike("category", `%${categoryQuery}%`);
  }

  if (modalityQuery) {
    query = query.ilike("modality", `%${modalityQuery}%`);
  }

  query = query.order("created_at", { ascending: false });

  if (limit > 0) {
    query = query.range(page * limit, (page + 1) * limit - 1);
  }

  const { data: vacancies, error } = await query;

  if (error) {
    console.error("Error fetching vacancies in Server Action:", error);
    throw new Error("Error al consultar las vacantes");
  }

  if (!vacancies || vacancies.length === 0) {
    return [];
  }

  interface EmbeddedCompanyInfo {
    id: string;
    company_name: string | null;
    logo_url: string | null;
  }

  interface DBVacancyItem {
    id: string;
    title: string;
    location: string | null;
    modality: string | null;
    salary_min: number | null;
    salary_max: number | null;
    employment_type: string | null;
    category: string | null;
    seniority: string | null;
    skills: string[] | null;
    created_at: string;
    description: string;
    benefits: string[] | null;
    status: string | null;
    company_id: string;
    company?: EmbeddedCompanyInfo | EmbeddedCompanyInfo[] | null;
  }

  // 2. Format result to conform with Job interface using embedded company info
  return (vacancies as unknown as DBVacancyItem[]).map((vac) => {
    const comp = Array.isArray(vac.company) ? vac.company[0] : vac.company;
    const companyName = comp?.company_name || "Empresa";
    const logoUrl = comp?.logo_url || null;
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
      companyPhone: null,
    };
  });
}
