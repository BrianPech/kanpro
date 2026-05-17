import { createClient } from "@/lib/supabase/client";

export const companyService = {
  async updateProfile(userId: string, profile: any) {
    const supabase = createClient();
    const { error } = await supabase
      .from("company_profiles")
      .upsert({
        id: userId,
        company_name: profile.company_name,
        industry: profile.industry,
        website_or_linkedin: profile.website_or_linkedin,
        location: profile.location,
        updated_at: new Date().toISOString()
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
    const { error } = await supabase
      .from("vacancies")
      .insert({
        company_id: companyId,
        title: vacancy.title,
        description: vacancy.description,
        modality: vacancy.modality,
        salary: vacancy.salary,
        skills: vacancy.skills.split(",").map((s: string) => s.trim()),
        status: "Activa",
      });

    if (error) throw error;
  }
};
