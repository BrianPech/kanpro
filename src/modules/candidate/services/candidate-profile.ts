import { createClient } from "@/lib/supabase/client";
import { type CandidateProfileFormValues } from "../schemas/candidate.schema";
import { type Json, type Database } from "@/types/supabase";

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
  certifications?: Json | null;
  languages?: Json | null;
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
  address_street?: string | null;
  address_exterior_number?: string | null;
  address_interior_number?: string | null;
  address_neighborhood?: string | null;
  address_postal_code?: string | null;
  address_municipality?: string | null;
  address_state?: string | null;
  is_early_access?: boolean;
}

export interface FormattedCandidateAddress {
  line1: string | null;
  line2: string | null;
}

/**
 * Formats structured INE address fields into two readable lines for the profile summary card.
 */
export function formatCandidateAddress(
  profile: Pick<
    CandidateProfileData,
    | "address_street"
    | "address_exterior_number"
    | "address_interior_number"
    | "address_neighborhood"
    | "address_postal_code"
    | "address_municipality"
    | "address_state"
    | "location"
  > | null
): FormattedCandidateAddress {
  if (!profile) return { line1: null, line2: null };

  const streetBase = [profile.address_street?.trim(), profile.address_exterior_number?.trim()]
    .filter(Boolean)
    .join(" ");
  const interior = profile.address_interior_number?.trim();
  const streetFull = [streetBase, interior ? `interior ${interior}` : ""]
    .filter(Boolean)
    .join(", ");
  const line1 = [streetFull, profile.address_neighborhood?.trim()]
    .filter(Boolean)
    .join(" · ") || null;

  const cityState = [profile.address_municipality?.trim(), profile.address_state?.trim()]
    .filter(Boolean)
    .join(", ");
  const line2 = [profile.address_postal_code?.trim(), cityState]
    .filter(Boolean)
    .join(" · ") || null;

  if (!line1 && !line2 && profile.location?.trim()) {
    return { line1: profile.location.trim(), line2: null };
  }

  return { line1, line2 };
}

/**
 * Returns up to two uppercase initials from the candidate's full name (or email fallback).
 */
export function getCandidateInitials(
  fullName: string | null | undefined,
  email?: string | null
): string {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const emailChar = (email || "").trim()[0];
  return emailChar ? emailChar.toUpperCase() : "KP";
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

interface EmbeddedCandidateProfile {
  headline: string | null;
  bio: string | null;
  skills: string[] | null;
  experience: Json | null;
  education: Json | null;
  certifications: Json | null;
  languages: Json | null;
  portfolio_links: Json | null;
  preferred_zone: string | null;
}

interface EmbeddedPrivateProfile {
  curp: string | null;
  birth_date: string | null;
  rfc: string | null;
  cedula_profesional: string | null;
  address_street: string | null;
  address_exterior_number: string | null;
  address_interior_number: string | null;
  address_neighborhood: string | null;
  address_postal_code: string | null;
  address_municipality: string | null;
  address_state: string | null;
}

interface ProfileWithEmbeds {
  id: string;
  full_name: string | null;
  email: string | null;
  whatsapp_number: string | null;
  avatar_url: string | null;
  location: string | null;
  is_early_access?: boolean | null;
  candidate_profiles: EmbeddedCandidateProfile | EmbeddedCandidateProfile[] | null;
  candidate_private_profiles: EmbeddedPrivateProfile | EmbeddedPrivateProfile[] | null;
}

export const candidateProfileService = {
  /**
   * Safely fetches full candidate profile data directly from `profiles`, `candidate_profiles`,
   * and `candidate_private_profiles` in a single query using PostgREST Resource Embedding
   * (with Auth metadata fallback for immediate display).
   */
  async getProfile(userId: string): Promise<CandidateProfileData | null> {
    const supabase = createClient();

    try {
      const [
        { data: profileDataRaw, error: profileError },
        { data: authUserData }
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, whatsapp_number, avatar_url, location, is_early_access, candidate_profiles ( headline, bio, skills, experience, education, certifications, languages, portfolio_links, preferred_zone ), candidate_private_profiles ( curp, birth_date, rfc, cedula_profesional, address_street, address_exterior_number, address_interior_number, address_neighborhood, address_postal_code, address_municipality, address_state )")
          .eq("id", userId)
          .maybeSingle(),
        supabase.auth.getUser()
      ]);

      if (profileError) {
        console.error("[candidateProfileService] Error fetching base profile:", profileError.message || profileError);
      }

      const profile = profileDataRaw as unknown as ProfileWithEmbeds | null;

      if (!profile) {
        // Fallback to Auth metadata if profiles record is empty
        const authUser = authUserData?.user;
        if (!authUser || authUser.id !== userId) {
          return null;
        }

        const rawAuthBirthDate = (authUser.user_metadata?.birth_date as string | undefined) || null;
        return {
          id: authUser.id,
          full_name: (authUser.user_metadata?.full_name as string | undefined) || null,
          email: authUser.email || null,
          whatsapp_number: (authUser.user_metadata?.whatsapp_number as string | undefined) || null,
          avatar_url: (authUser.user_metadata?.avatar_url as string | undefined) || null,
          location: null,
          headline: null,
          experience_summary: null,
          skills: [],
          experience: [],
          education: [],
          certifications: [],
          languages: [],
          portfolio_links: [],
          cv_url: null,
          is_validated: true,
          is_approved: true,
          show_phone: true,
          curp: null,
          birth_date: normalizeDateToISO(rawAuthBirthDate),
          rfc: null,
          cedula_profesional: null,
          is_early_access: true,
        };
      }

      const candProfileRaw = profile.candidate_profiles;
      const candProfile: EmbeddedCandidateProfile | null = Array.isArray(candProfileRaw)
        ? candProfileRaw[0] ?? null
        : candProfileRaw ?? null;

      const privateProfileRaw = profile.candidate_private_profiles;
      const privateProfile: EmbeddedPrivateProfile | null = Array.isArray(privateProfileRaw)
        ? privateProfileRaw[0] ?? null
        : privateProfileRaw ?? null;

      const rawBirthDate =
        privateProfile?.birth_date ||
        (authUserData?.user?.user_metadata?.birth_date as string | undefined) ||
        null;

      const normalizedBirthDate = normalizeDateToISO(rawBirthDate);

      return {
        id: profile.id,
        full_name: profile.full_name || (authUserData?.user?.user_metadata?.full_name as string | undefined) || null,
        email: profile.email || authUserData?.user?.email || null,
        whatsapp_number: profile.whatsapp_number || (authUserData?.user?.user_metadata?.whatsapp_number as string | undefined) || null,
        avatar_url: profile.avatar_url || null,
        location: profile.location || (candProfile?.preferred_zone ? `Mérida - ${candProfile.preferred_zone}` : null),
        headline: candProfile?.headline || null,
        experience_summary: candProfile?.bio || null,
        skills: candProfile?.skills || [],
        experience: candProfile?.experience || [],
        education: candProfile?.education || [],
        certifications: candProfile?.certifications || [],
        languages: candProfile?.languages || [],
        portfolio_links: candProfile?.portfolio_links || [],
        cv_url: null,
        is_validated: true,
        is_approved: true,
        show_phone: true,
        curp: privateProfile?.curp || null,
        birth_date: normalizedBirthDate,
        rfc: privateProfile?.rfc || null,
        cedula_profesional: privateProfile?.cedula_profesional || null,
        address_street: privateProfile?.address_street || null,
        address_exterior_number: privateProfile?.address_exterior_number || null,
        address_interior_number: privateProfile?.address_interior_number || null,
        address_neighborhood: privateProfile?.address_neighborhood || null,
        address_postal_code: privateProfile?.address_postal_code || null,
        address_municipality: privateProfile?.address_municipality || null,
        address_state: privateProfile?.address_state || null,
        is_early_access: profile.is_early_access ?? true,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[candidateProfileService] Unexpected error in getProfile:", errorMsg);
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
    } catch {
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
      certifications?: Json | null;
      languages?: Json | null;
    }
  ) {
    const supabase = createClient();

    // 1. Update base profiles table
    const basePayload: Database["public"]["Tables"]["profiles"]["Update"] = {
      updated_at: new Date().toISOString(),
    };
    if (data.full_name !== undefined) basePayload.full_name = data.full_name;
    if (data.location !== undefined) basePayload.location = data.location;
    if (data.whatsapp_number !== undefined) basePayload.whatsapp_number = data.whatsapp_number;
    if (data.avatar_url !== undefined) basePayload.avatar_url = data.avatar_url;

    const { error: baseError } = await supabase
      .from("profiles")
      .update(basePayload)
      .eq("id", userId);

    if (baseError) {
      console.error("[candidateProfileService] Error updating profiles table:", baseError.message || baseError);
      throw baseError;
    }

    // 2. Upsert candidate details in candidate_profiles table
    const candidatePayload: Record<string, unknown> = {
      id: userId,
      updated_at: new Date().toISOString(),
    };
    if (data.headline !== undefined) candidatePayload.headline = data.headline || null;
    if (data.experience_summary !== undefined) candidatePayload.bio = data.experience_summary || "";
    if (data.skills !== undefined) candidatePayload.skills = data.skills || [];
    if (data.experience !== undefined) candidatePayload.experience = (data.experience || []) as unknown as Json;
    if (data.education !== undefined) candidatePayload.education = (data.education || []) as unknown as Json;
    if (data.certifications !== undefined) candidatePayload.certifications = (data.certifications || []) as unknown as Json;
    if (data.languages !== undefined) candidatePayload.languages = (data.languages || []) as unknown as Json;
    if (data.portfolio_links !== undefined) candidatePayload.portfolio_links = (data.portfolio_links || []) as unknown as Json;
    if (data.zone !== undefined) candidatePayload.preferred_zone = data.zone;

    const { data: updatedCandidate, error: candidateError } = await supabase
      .from("candidate_profiles")
      .upsert(candidatePayload as never)
      .select()
      .maybeSingle();

    if (candidateError) {
      console.error("[candidateProfileService] Error updating candidate_profiles table:", candidateError.message || candidateError);
      throw candidateError;
    }

    // 3. Upsert private details in candidate_private_profiles if provided
    if (data.curp !== undefined || data.birth_date !== undefined) {
      const privatePayload: Record<string, unknown> = {
        id: userId,
        updated_at: new Date().toISOString(),
      };
      if (data.curp !== undefined) privatePayload.curp = data.curp ? data.curp.trim().toUpperCase() : null;
      if (data.birth_date !== undefined) privatePayload.birth_date = normalizeDateToISO(data.birth_date);

      const { error: privateError } = await supabase
        .from("candidate_private_profiles")
        .upsert(privatePayload as never);

      if (privateError) {
        console.error("[candidateProfileService] Error updating candidate_private_profiles:", privateError.message || privateError);
        throw privateError;
      }
    }

    return {
      ...(updatedCandidate as Record<string, unknown>),
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
