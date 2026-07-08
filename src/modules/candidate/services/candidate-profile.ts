import { createClient } from "@/lib/supabase/client";
import { type CandidateProfileFormValues } from "../schemas/candidate.schema";
import { type Json } from "@/types/supabase";

export const candidateProfileService = {
  async getProfile(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles_view")
      .select("id, full_name, headline, experience_summary, whatsapp_number, location, skills, experience, portfolio_links, is_validated, is_approved, show_phone")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, data: CandidateProfileFormValues) {
    const supabase = createClient();

    // 1. Update the base profiles table first (FK target must exist)
    const { error: baseError } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        location: data.location,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (baseError) throw baseError;

    // 2. Upsert candidate details in the candidate_profiles extension table second
    const { data: updatedData, error } = await supabase
      .from("candidate_profiles")
      .upsert({
        id: userId,
        headline: data.headline || null,
        experience_summary: data.experience_summary || "",
        whatsapp_number: data.whatsapp_number || "",
        skills: data.skills || [],
        experience: (data.experience || []) as unknown as Json,
        portfolio_links: (data.portfolio_links || []) as unknown as Json,
        show_phone: !!data.show_phone,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Return the combined candidate details for frontend state updates
    return {
      ...updatedData,
      full_name: data.full_name,
      location: data.location,
    };
  }
};
