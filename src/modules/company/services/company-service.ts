import { createClient } from "@/lib/supabase/client";
import { type CompanyProfileFormValues } from "../schemas/company.schema";

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
  async updateProfile(userId: string, profile: CompanyProfileFormValues) {
    const supabase = createClient();

    // 1. Retrieve the current location from profiles base to ensure it is not overwritten
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

    // 2. Update the base profiles table first (FK target must exist)
    const { error: baseError } = await supabase
      .from("profiles")
      .update({
        full_name: profile.company_name,
        avatar_url: profile.logo_url || null,
        location: finalLocation,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (baseError) throw baseError;

    // 3. Upsert into company_profiles extension table second (respecting FK constraints)
    const { error: companyError } = await supabase
      .from("company_profiles")
      .upsert({
        id: userId,
        company_name: profile.company_name,
        industry: profile.industry,
        website_or_linkedin: profile.website || null,
        logo_url: profile.logo_url || null,
        description: profile.description || null,
        phone: profile.phone || null,
        company_size: profile.company_size || null,
        updated_at: new Date().toISOString(),
      });

    if (companyError) throw companyError;
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
      application_deadline: vacancy.application_deadline || null,
      benefits: splitCsv(vacancy.benefits),
      salary_min: vacancy.salary_min ?? null,
      salary_max: vacancy.salary_max ?? null,
      currency: vacancy.currency || "USD",
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
          location,
          avatar_url,
          email,
          candidate_profiles (
            headline,
            bio,
            phone,
            skills,
            experience,
            education
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const flattened = (data || []).map((app: any) => {
      // Find candidate profiles extension and merge it for backwards compatibility with legacy layout
      const extension = app.candidate?.candidate_profiles;
      const extensionObj = Array.isArray(extension) ? extension[0] : extension;
      
      return {
        ...app,
        candidate: app.candidate ? {
          id: app.candidate.id,
          full_name: app.candidate.full_name,
          location: app.candidate.location,
          avatar_url: app.candidate.avatar_url,
          email: app.candidate.email,
          headline: extensionObj?.headline || null,
          bio: extensionObj?.bio || null,
          phone: extensionObj?.phone || null,
          skills: extensionObj?.skills || null,
          experience: extensionObj?.experience || null,
          education: extensionObj?.education || null,
        } : null
      };
    });
    
    // Filter records in memory to match vacancy owner
    return flattened.filter((app: any) => app.vacancies?.company_id === companyId);
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
