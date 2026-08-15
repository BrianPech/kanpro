import { createClient } from "@/lib/supabase/client";
import { type CandidateProfileFormValues } from "../schemas/candidate.schema";
import { type Json } from "@/types/supabase";

export interface CandidateProfileData {
  id: string;
  full_name: string | null;
  email: string | null;
  headline: string | null;
  experience_summary: string | null;
  whatsapp_number: string | null;
  location: string | null;
  skills: string[] | null;
  experience: Json | null;
  education: Json | null;
  portfolio_links: Json | null;
  avatar_url: string | null;
  cv_url: string | null;
  is_validated: boolean | null;
  is_approved: boolean | null;
  show_phone: boolean | null;
  curp: string | null;
  birth_date: string | null;
  rfc?: string | null;
  cedula_profesional?: string | null;
}

/**
 * Normalizes any date string (DD/MM/YYYY, ISO, timestamp) to standard HTML5 / Postgres YYYY-MM-DD
 */
export function normalizeDateToISO(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, "0");
    const month = ddmmyyyy[2].padStart(2, "0");
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // Fallback Date parser
  const timestamp = Date.parse(trimmed);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return trimmed;
}

export const candidateProfileService = {
  /**
   * Safely fetches full candidate profile data directly from `profiles`, `candidate_profiles`,
   * and `candidate_private_profiles` (with Auth metadata fallback for immediate display).
   */
  async getProfile(userId: string): Promise<CandidateProfileData | null> {
    const supabase = createClient();

    try {
      const [
        { data: profile, error: profileError },
        { data: candProfile, error: candError },
        { data: privateProfile, error: privateError },
        { data: authUserData }
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, whatsapp_number, avatar_url, location")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("candidate_profiles")
          .select("id, headline, bio, skills, experience, education, portfolio_links, preferred_zone")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("candidate_private_profiles")
          .select("curp, birth_date, rfc, cedula_profesional")
          .eq("id", userId)
          .maybeSingle(),
        supabase.auth.getUser()
      ]);

      if (profileError) {
        console.error("[candidateProfileService] Error fetching base profile:", profileError.message || profileError);
      }

      if (candError) {
        console.warn("[candidateProfileService] Warning fetching candidate_profiles:", candError.message || candError);
      }

      if (privateError) {
        console.warn("[candidateProfileService] Warning fetching candidate_private_profiles:", privateError.message || privateError);
      }

      if (!profile) {
        return null;
      }

      const rawBirthDate =
        privateProfile?.birth_date ||
        (authUserData?.user?.user_metadata?.birth_date as string) ||
        null;

      const normalizedBirthDate = normalizeDateToISO(rawBirthDate);

      return {
        id: profile.id,
        full_name: profile.full_name || authUserData?.user?.user_metadata?.full_name || null,
        email: profile.email || authUserData?.user?.email || null,
        whatsapp_number: profile.whatsapp_number || authUserData?.user?.user_metadata?.whatsapp_number || null,
        avatar_url: profile.avatar_url || null,
        location: profile.location || (candProfile?.preferred_zone ? `Mérida - ${candProfile.preferred_zone}` : null),
        headline: candProfile?.headline || null,
        experience_summary: candProfile?.bio || null,
        skills: candProfile?.skills || [],
        experience: candProfile?.experience || [],
        education: candProfile?.education || [],
        portfolio_links: candProfile?.portfolio_links || [],
        cv_url: null,
        is_validated: true,
        is_approved: true,
        show_phone: true,
        curp: privateProfile?.curp || null,
        birth_date: normalizedBirthDate,
        rfc: privateProfile?.rfc || null,
        cedula_profesional: privateProfile?.cedula_profesional || null,
      };
    } catch (err: any) {
      console.error("[candidateProfileService] Unexpected error in getProfile:", err?.message || err);
      return null;
    }
  },

  /**
   * Fetches total count of saved vacancies for the candidate
   */
  async getSavedVacanciesCount(userId: string): Promise<number> {
    const supabase = createClient();
    try {
      const { count, error } = await supabase
        .from("saved_vacancies")
        .select("*", { count: "exact", head: true })
        .eq("candidate_id", userId);

      if (error) {
        console.warn("[candidateProfileService] Warning fetching saved vacancies count:", error.message || error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      return 0;
    }
  },

  /**
   * Updates candidate profile across base `profiles`, extended `candidate_profiles`, and `candidate_private_profiles`
   */
  async updateProfile(
    userId: string,
    data: Partial<CandidateProfileFormValues> & {
      avatar_url?: string | null;
      curp?: string | null;
      birth_date?: string | null;
    }
  ) {
    const supabase = createClient();

    // 1. Update base profiles table
    const basePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (data.full_name !== undefined) basePayload.full_name = data.full_name;
    if (data.location !== undefined) basePayload.location = data.location;
    if (data.whatsapp_number !== undefined) basePayload.whatsapp_number = data.whatsapp_number;
    if (data.avatar_url !== undefined) basePayload.avatar_url = data.avatar_url;

    const { error: baseError } = await supabase
      .from("profiles")
      .update(basePayload as any)
      .eq("id", userId);

    if (baseError) {
      console.error("[candidateProfileService] Error updating profiles table:", baseError.message || baseError);
      throw baseError;
    }

    // 2. Upsert candidate details in candidate_profiles table
    const candidatePayload: Record<string, any> = {
      id: userId,
      updated_at: new Date().toISOString(),
    };
    if (data.headline !== undefined) candidatePayload.headline = data.headline || null;
    if (data.experience_summary !== undefined) candidatePayload.bio = data.experience_summary || "";
    if (data.skills !== undefined) candidatePayload.skills = data.skills || [];
    if (data.experience !== undefined) candidatePayload.experience = (data.experience || []) as unknown as Json;
    if (data.education !== undefined) candidatePayload.education = (data.education || []) as unknown as Json;
    if (data.portfolio_links !== undefined) candidatePayload.portfolio_links = (data.portfolio_links || []) as unknown as Json;
    if (data.zone !== undefined) candidatePayload.preferred_zone = data.zone;

    const { data: updatedCandidate, error: candidateError } = await supabase
      .from("candidate_profiles")
      .upsert(candidatePayload)
      .select()
      .maybeSingle();

    if (candidateError) {
      console.error("[candidateProfileService] Error updating candidate_profiles table:", candidateError.message || candidateError);
      throw candidateError;
    }

    // 3. Upsert private details in candidate_private_profiles if provided
    if (data.curp !== undefined || data.birth_date !== undefined) {
      const privatePayload: Record<string, any> = {
        id: userId,
        updated_at: new Date().toISOString(),
      };
      if (data.curp !== undefined) privatePayload.curp = data.curp ? data.curp.trim().toUpperCase() : null;
      if (data.birth_date !== undefined) privatePayload.birth_date = normalizeDateToISO(data.birth_date);

      const { error: privateError } = await supabase
        .from("candidate_private_profiles")
        .upsert(privatePayload);

      if (privateError) {
        console.error("[candidateProfileService] Error updating candidate_private_profiles:", privateError.message || privateError);
      }
    }

    return {
      ...updatedCandidate,
      full_name: data.full_name,
      location: data.location,
      avatar_url: data.avatar_url,
    };
  },

  /**
   * Updates location & preferred zone for radar K'anPro
   */
  async updateLocation(userId: string, city: string, zone: string) {
    const supabase = createClient();
    const locationStr = `${city} - ${zone}`;

    try {
      await supabase.auth.updateUser({
        data: { location: locationStr, city, zone }
      });
    } catch (e) {}

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        location: locationStr,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (profileErr) {
      console.warn("[candidateProfileService] Warning updating profiles location:", profileErr.message || profileErr);
    }

    const { error: candErr } = await supabase
      .from("candidate_profiles")
      .upsert({
        id: userId,
        preferred_zone: zone,
        updated_at: new Date().toISOString()
      });

    if (candErr) {
      console.warn("[candidateProfileService] Warning updating candidate_profiles location:", candErr.message || candErr);
    }

    return locationStr;
  }
};
