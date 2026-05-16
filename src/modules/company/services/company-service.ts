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
  }
};
