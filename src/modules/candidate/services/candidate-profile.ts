import { createClient } from "@/lib/supabase/client";
import { type CandidateProfileFormValues } from "../schemas/candidate.schema";

export const candidateProfileService = {
  async getProfile(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, headline, experience_summary, whatsapp_number, location, skills, experience, portfolio_links, is_validated, is_approved, show_phone")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, data: CandidateProfileFormValues) {
    const supabase = createClient();
    const { data: updatedData, error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        headline: data.headline,
        experience_summary: data.experience_summary,
        whatsapp_number: data.whatsapp_number as any,
        location: data.location,
        skills: data.skills,
        experience: data.experience as any,
        portfolio_links: data.portfolio_links as any,
        show_phone: data.show_phone,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return updatedData;
  }
};
