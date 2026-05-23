import { createClient } from "@/lib/supabase/client";

function splitCsv(value?: string) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function formatSalaryRange(
  min?: number | null,
  max?: number | null,
  currency = "USD",
) {
  if (min == null && max == null) return null;

  if (min != null && max != null) {
    return `${currency} ${min.toLocaleString("en-US")} - ${max.toLocaleString("en-US")}`;
  }

  if (min != null) {
    return `${currency} ${min.toLocaleString("en-US")}`;
  }

  if (max != null) {
    return `${currency} ${max.toLocaleString("en-US")}`;
  }

  return null;
}

export const companyService = {
  async updateProfile(userId: string, profile: any) {
    const supabase = createClient();
    const { error } = await supabase.from("company_profiles").upsert({
      id: userId,
      company_name: profile.company_name,
      industry: profile.industry,
      website_or_linkedin: profile.website_or_linkedin,
      location: profile.location,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  },

  async getVacancies(companyId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vacancies")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async createVacancy(companyId: string, vacancy: any) {
    const supabase = createClient();
    const { error } = await supabase.from("vacancies").insert({
      company_id: companyId,
      title: vacancy.title,
      description: vacancy.description,
      modality: vacancy.modality,
      location: vacancy.location || null,
      category: vacancy.category || null,
      seniority: vacancy.seniority || null,
      contract_type: vacancy.contract_type || null,
      employment_type: vacancy.employment_type || null,
      vacancies_count: vacancy.vacancies_count ?? 1,
      application_deadline: vacancy.application_deadline || null,
      benefits: splitCsv(vacancy.benefits),
      salary_min: vacancy.salary_min ?? null,
      salary_max: vacancy.salary_max ?? null,
      currency: vacancy.currency || "USD",
      salary: formatSalaryRange(
        vacancy.salary_min,
        vacancy.salary_max,
        vacancy.currency,
      ),
      skills: splitCsv(vacancy.skills),
      status: "Activa",
    });

    if (error) throw error;
  },
};
