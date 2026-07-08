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

    // 1. Retrieve the current location from profiles view to ensure it is not overwritten
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("location")
      .eq("id", userId)
      .single();

    const currentLoc = currentProfile?.location || "";

    // Use current location if the incoming location is empty/invalid
    const finalLocation = (profile.location && profile.location.includes(" - "))
      ? profile.location
      : (currentLoc || null);

    // 2. Perform strictly an update filtered by the userId
    const { error } = await supabase
      .from("company_profiles")
      .update({
        company_name: profile.company_name,
        industry: profile.industry,
        website_or_linkedin: profile.website_or_linkedin,
        location: finalLocation,
        logo_url: profile.logo_url || null,
        description: profile.description || null,
        phone: profile.phone || null,
        company_size: profile.company_size || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

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
      recruiter_id: companyId,
      title: vacancy.title,
      description: vacancy.description || vacancy.requirements || "",
      requirements: vacancy.requirements || vacancy.description || "",
      modality: vacancy.modality,
      location: vacancy.location || vacancy.zone || null,
      zone: vacancy.zone || vacancy.location || null,
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
      salary: vacancy.salary_range || formatSalaryRange(
        vacancy.salary_min,
        vacancy.salary_max,
        vacancy.currency,
      ),
      salary_range: vacancy.salary_range || formatSalaryRange(
        vacancy.salary_min,
        vacancy.salary_max,
        vacancy.currency,
      ),
      skills: splitCsv(vacancy.skills),
      status: "Activa",
      is_active: true,
    });

    if (error) throw error;
  },

  async updateVacancyStatus(vacancyId: string, status: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("vacancies")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", vacancyId);

    if (error) throw error;
  },

  async getApplications(companyId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        created_at,
        vacancy_id,
        vacancies (
          id,
          title,
          company_id
        ),
        candidate:profiles (
          id,
          full_name,
          headline,
          bio,
          phone,
          location,
          skills,
          avatar_url,
          experience,
          education,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Filter records in memory to match vacancy owner
    return (data || []).filter((app: any) => app.vacancies?.company_id === companyId);
  },

  async updateApplicationStatus(applicationId: string, status: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (error) throw error;
  },
};

