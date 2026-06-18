import { createClient } from "@/lib/supabase/client";
import { type CandidateProfileFormValues } from "../schemas/candidate.schema";

export const candidateProfileService = {
  async getProfile(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
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
        bio: data.bio,
        phone: data.phone,
        location: data.location,
        skills: data.skills,
        experience: data.experience as unknown as never, // Cast JSONB array
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return updatedData;
  }
};
