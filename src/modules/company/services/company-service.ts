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

    const finalLocation = profile.location || "Mérida";

    const companyPayload: any = {
      company_name: profile.company_name,
      legal_name: profile.legal_name || null,
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

    if (profile.rfc && profile.rfc.trim() !== "") {
      companyPayload.rfc = profile.rfc.toUpperCase().trim();
    }
    if (profile.fiscal_regime) {
      companyPayload.entity_type = profile.fiscal_regime;
    }

    const profileUpdates: any = {
      full_name: profile.company_name,
      avatar_url: profile.logo_url || null,
      location: finalLocation,
      whatsapp_number: profile.phone || null,
      updated_at: new Date().toISOString(),
    };

    // Parallel update for base profiles and company_profiles extension
    const [baseRes, updateRes] = await Promise.all([
      supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId),
      supabase
        .from("company_profiles")
        .update(companyPayload)
        .eq("id", userId)
        .select("id")
    ]);

    if (baseRes.error) throw baseRes.error;
    if (updateRes.error) throw updateRes.error;

    if (!updateRes.data || updateRes.data.length === 0) {
      const { error: upsertErr } = await supabase
        .from("company_profiles")
        .upsert({
          id: userId,
          rfc: profile.rfc?.toUpperCase().trim() || "XAXX010101000",
          ...companyPayload,
        });

      if (upsertErr) throw upsertErr;
    }
  },

  async getVacancies(companyId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vacancies")
      .select("*")
      .or(`company_id.eq.${companyId},recruiter_id.eq.${companyId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
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
    } as any);

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

    // 1. Fetch company vacancy IDs (both company_id and recruiter_id)
    const { data: userVacs, error: vacError } = await supabase
      .from("vacancies")
      .select("id")
      .or(`company_id.eq.${companyId},recruiter_id.eq.${companyId}`);

    if (vacError) {
      console.error("[companyService] Error fetching vacancies for applications:", vacError);
    }

    const vacIds = (userVacs || []).map((v) => v.id).filter(Boolean);

    if (vacIds.length === 0) return [];

    // 2. Fetch applications filtered directly in PostgreSQL
    const { data, error } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        notes,
        rating,
        interview_details,
        hired_at,
        applied_at,
        updated_at,
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
      .in("vacancy_id", vacIds)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error(
        "[companyService] Error fetching applications:",
        error.message || error.details || error
      );
      throw error;
    }

    return (data || []).map((app: any) => {
      const candidateObj = app.candidate || app.candidate_profiles;
      const candidateProfile = Array.isArray(candidateObj) ? candidateObj[0] : candidateObj;
      const baseProfile = candidateProfile?.profiles
        ? (Array.isArray(candidateProfile.profiles) ? candidateProfile.profiles[0] : candidateProfile.profiles)
        : {};

      const vacObj = app.vacancies;
      const vacancy = Array.isArray(vacObj) ? vacObj[0] : vacObj;

      return {
        ...app,
        notes: app.notes || "",
        rating: app.rating ?? 5,
        interview_details: app.interview_details || null,
        hired_at: app.hired_at || null,
        vacancies: vacancy || { id: app.vacancy_id, title: "Vacante", company_id: companyId },
        candidate: {
          id: candidateProfile?.id || app.candidate_id || "",
          full_name: baseProfile.full_name || "Profesional K'anPro",
          location: baseProfile.location || "Local",
          avatar_url: baseProfile.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
          email: baseProfile.email || "",
          headline: candidateProfile?.headline || "Candidato",
          bio: candidateProfile?.bio || "Sin biografía disponible.",
          phone: baseProfile.whatsapp_number || "",
          skills: candidateProfile?.skills || [],
          experience: candidateProfile?.experience || [],
          education: candidateProfile?.education || [],
        },
      };
    });
  },

  async updateApplicationStatus(applicationId: string, status: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (error) throw error;
  },

  async updateApplicationNotes(applicationId: string, notes: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("applications")
      .update({ notes: notes.trim(), updated_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (error) throw error;
  },

  async updateApplicationRating(applicationId: string, rating: number) {
    const supabase = createClient();
    const { error } = await supabase
      .from("applications")
      .update({ rating, updated_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (error) throw error;
  },

  async updateApplicationInterview(applicationId: string, interviewDetails: any) {
    const supabase = createClient();
    const { error } = await supabase
      .from("applications")
      .update({ 
        interview_details: interviewDetails,
        status: "Entrevista",
        updated_at: new Date().toISOString() 
      })
      .eq("id", applicationId);

    if (error) throw error;
  },
};
