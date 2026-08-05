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

    const finalLocation = profile.location || currentLoc || "Mérida";

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

    // 3. Update company_profiles extension table (using update first, fallback to upsert)
    const companyPayload = {
      company_name: profile.company_name,
      industry: profile.industry || "General",
      fiscal_address: finalLocation || profile.address_details || "Mérida, Yucatán",
      website_url: profile.website || null,
      logo_url: profile.logo_url || null,
      banner_url: profile.banner_url || null,
      description: profile.description || null,
      contact_phone: profile.phone || null,
      company_size: profile.company_size || null,
      address_details: profile.address_details || null,
      operation_hours: profile.operation_hours || null,
      social_links: {
        instagram: profile.instagram_url || null,
        facebook: profile.facebook_url || null,
        has_transport: profile.has_transport,
        benefit_canteen: profile.benefit_canteen,
        benefit_tips: profile.benefit_tips,
        benefit_imss: profile.benefit_imss,
        benefit_uniforms: profile.benefit_uniforms,
        benefit_growth: profile.benefit_growth,
      },
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRows, error: updateErr } = await supabase
      .from("company_profiles")
      .update(companyPayload as any)
      .eq("id", userId)
      .select("id");

    if (updateErr) throw updateErr;

    if (!updatedRows || updatedRows.length === 0) {
      const { error: upsertErr } = await supabase
        .from("company_profiles")
        .upsert({
          id: userId,
          rfc: "XAXX010101000",
          ...(companyPayload as any),
        });

      if (upsertErr) throw upsertErr;
    }
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
      salary_min: vacancy.salary_min && !isNaN(Number(vacancy.salary_min)) ? Number(vacancy.salary_min) : null,
      salary_max: vacancy.salary_max && !isNaN(Number(vacancy.salary_max)) ? Number(vacancy.salary_max) : null,
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
        applied_at,
        vacancy_id,
        vacancies (
          id,
          title,
          company_id
        ),
        candidate:candidate_profiles (
          id,
          headline,
          bio,
          skills,
          experience,
          education,
          profiles (
            id,
            full_name,
            location,
            avatar_url,
            email,
            whatsapp_number
          )
        )
      `)
      .order("applied_at", { ascending: false });

    if (error) throw error;

    const flattened = (data || []).map((app: any) => {
      const candidateObj = app.candidate;
      const candidateProfile = Array.isArray(candidateObj) ? candidateObj[0] : candidateObj;
      const baseProfile = candidateProfile?.profiles
        ? (Array.isArray(candidateProfile.profiles) ? candidateProfile.profiles[0] : candidateProfile.profiles)
        : {};

      return {
        ...app,
        candidate: candidateProfile ? {
          id: candidateProfile.id,
          full_name: baseProfile.full_name,
          location: baseProfile.location,
          avatar_url: baseProfile.avatar_url,
          email: baseProfile.email,
          headline: candidateProfile.headline,
          bio: candidateProfile.bio,
          phone: baseProfile.whatsapp_number,
          skills: candidateProfile.skills,
          experience: candidateProfile.experience,
          education: candidateProfile.education,
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
