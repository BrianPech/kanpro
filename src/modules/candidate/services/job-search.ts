import { createClient } from "@/lib/supabase/client";
import { SearchVacancy } from "../components/job-search-view";

export interface SearchFilters {
  query?: string;
  activeFilters?: string[];
  limit?: number;
}

/**
 * Normalizes text by converting to lowercase, stripping accents, and standardizing common Spanish double letters (rr -> r, ll -> l).
 */
export function normalizeText(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents (á->a, é->e, etc)
    .replace(/rr/g, "r")            // normalize rr -> r (e.g. Desarrollador vs Desarollador)
    .replace(/ll/g, "l")            // normalize ll -> l
    .replace(/[^a-z0-9\s]/g, "")    // remove special symbols
    .trim();
}

/**
 * Smart fuzzy and token matcher capable of matching typos, accents, and partial words.
 */
export function matchFuzzy(text: string, search: string): boolean {
  const normText = normalizeText(text);
  const normSearch = normalizeText(search);

  if (!normSearch) return true;
  if (!normText) return false;

  // Direct substring match on normalized text
  if (normText.includes(normSearch) || normSearch.includes(normText)) return true;

  // Token-by-token matching
  const searchTokens = normSearch.split(/\s+/).filter(Boolean);
  const textTokens = normText.split(/\s+/).filter(Boolean);

  return searchTokens.every((sToken) => {
    return textTokens.some((tToken) => {
      if (tToken.includes(sToken) || sToken.includes(tToken)) return true;
      // Prefix match for minor typos (e.g., desarrollador vs desarollaodor)
      if (sToken.length >= 4 && tToken.length >= 4) {
        const prefixLen = Math.min(4, Math.min(sToken.length, tToken.length));
        if (sToken.substring(0, prefixLen) === tToken.substring(0, prefixLen)) {
          return true;
        }
      }
      return false;
    });
  });
}

interface EmbeddedCompanyProfile {
  id: string;
  company_name: string | null;
  logo_url: string | null;
  contact_phone: string | null;
  verification_status?: string | null;
}

interface RawSearchVacancy {
  id: string;
  title: string;
  description: string;
  location: string | null;
  modality: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  payment_frequency?: string | null;
  contact_phone?: string | null;
  preferred_contact_method?: string | null;
  is_promoted: boolean | null;
  is_featured?: boolean | null;
  category: string | null;
  company_id: string;
  created_at: string;
  zone: string | null;
  skills: string[] | null;
  benefits: string[] | null;
  requirements: string | null;
  company?: EmbeddedCompanyProfile | EmbeddedCompanyProfile[] | null;
}

export const jobSearchService = {
  /**
   * Performs an optimized, tolerant search on active vacancies with database-level
   * filtering, pagination/limit, and embedded company profiles.
   */
  async searchVacancies(filters: SearchFilters): Promise<SearchVacancy[]> {
    const supabase = createClient();
    const { query, activeFilters = [], limit = 50 } = filters;

    let dbQuery = supabase
      .from("vacancies")
      .select(`
        id,
        title,
        description,
        location,
        modality,
        employment_type,
        salary_min,
        salary_max,
        payment_frequency,
        contact_phone,
        preferred_contact_method,
        is_promoted,
        is_featured,
        category,
        company_id,
        created_at,
        zone,
        skills,
        benefits,
        requirements,
        company:company_directory (
          id,
          company_name,
          logo_url,
          contact_phone,
          verification_status
        )
      `)
      .or("status.eq.Activa,status.eq.activa,status.eq.published,is_active.eq.true");

    const trimmedQuery = query?.trim();
    if (trimmedQuery) {
      const term = trimmedQuery.replace(/[%_,()]/g, " ").trim();
      if (term) {
        dbQuery = dbQuery.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }
    }

    dbQuery = dbQuery
      .order("is_promoted", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    const { data: rawVacancies, error } = await dbQuery;

    if (error) {
      console.error("[jobSearchService] Error fetching vacancies from DB:", error.message || error);
      throw error;
    }

    if (!rawVacancies || rawVacancies.length === 0) {
      return [];
    }

    const formattedVacancies: SearchVacancy[] = (rawVacancies as unknown as RawSearchVacancy[]).map((vac) => {
      const comp = Array.isArray(vac.company) ? vac.company[0] : vac.company;
      const compName = comp?.company_name || "Empresa";
      const compLogo = comp?.logo_url || null;
      const compPhone = comp?.contact_phone || null;

      let formattedSalary = "";
      const min = Number(vac.salary_min);
      const max = Number(vac.salary_max);
      if (min && max) {
        formattedSalary = `$${min.toLocaleString()} - $${max.toLocaleString()} MXN`;
      } else if (min) {
        formattedSalary = `Desde $${min.toLocaleString()} MXN`;
      } else if (max) {
        formattedSalary = `Hasta $${max.toLocaleString()} MXN`;
      } else {
        formattedSalary = "Sueldo no especificado";
      }

      return {
        id: vac.id,
        title: vac.title || "",
        companyName: compName,
        companyLogo: compLogo,
        companyPhone: compPhone,
        contactPhone: vac.contact_phone || compPhone,
        preferredContactMethod: vac.preferred_contact_method || "whatsapp",
        paymentFrequency: vac.payment_frequency || "quincenal",
        isVerifiedCompany: comp?.verification_status === "approved",
        location: vac.location || vac.modality || "Remoto",
        employmentType: vac.employment_type || vac.modality || "Tiempo Completo",
        formattedSalary,
        isFeatured: Boolean(vac.is_promoted || vac.is_featured),
        category: vac.category || "General",
        description: vac.description || "",
        skills: vac.skills || [],
        benefits: vac.benefits || [],
        requirements: vac.requirements || null,
        zone: vac.zone || "",
        modality: vac.modality || "",
        createdAt: vac.created_at,
      };
    });

    if (activeFilters.length === 0) {
      return formattedVacancies;
    }

    // Apply active filter chips to the fetched result set
    return formattedVacancies.filter((vac) => {
      const searchableContent = [
        vac.title,
        vac.companyName,
        vac.category,
        vac.location,
        vac.zone || "",
        vac.employmentType,
        vac.description || "",
        ...(Array.isArray(vac.skills) ? vac.skills : [])
      ].join(" ");

      for (const filterChip of activeFilters) {
        if (filterChip && filterChip.trim()) {
          if (!matchFuzzy(searchableContent, filterChip.trim())) {
            return false;
          }
        }
      }

      return true;
    });
  },

  /**
   * Fetches a single vacancy by its ID with full details using embedded company profile.
   */
  async getVacancyById(id: string): Promise<SearchVacancy | null> {
    const supabase = createClient();
    const { data: vac, error } = await supabase
      .from("vacancies")
      .select(`
        id,
        title,
        description,
        location,
        modality,
        employment_type,
        salary_min,
        salary_max,
        payment_frequency,
        contact_phone,
        preferred_contact_method,
        is_promoted,
        is_featured,
        category,
        company_id,
        created_at,
        zone,
        skills,
        benefits,
        requirements,
        company:company_directory (
          id,
          company_name,
          logo_url,
          contact_phone,
          verification_status
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !vac) {
      return null;
    }

    const rawVac = vac as unknown as RawSearchVacancy;
    const comp = Array.isArray(rawVac.company) ? rawVac.company[0] : rawVac.company;
    const compName = comp?.company_name || "Empresa";
    const compLogo = comp?.logo_url || null;
    const compPhone = comp?.contact_phone || null;

    let formattedSalary = "";
    const min = Number(rawVac.salary_min);
    const max = Number(rawVac.salary_max);
    if (min && max) {
      formattedSalary = `$${min.toLocaleString()} - $${max.toLocaleString()} MXN`;
    } else if (min) {
      formattedSalary = `Desde $${min.toLocaleString()} MXN`;
    } else if (max) {
      formattedSalary = `Hasta $${max.toLocaleString()} MXN`;
    } else {
      formattedSalary = "Sueldo no especificado";
    }

    return {
      id: rawVac.id,
      title: rawVac.title || "",
      companyName: compName,
      companyLogo: compLogo,
      companyPhone: compPhone,
      contactPhone: rawVac.contact_phone || compPhone,
      preferredContactMethod: rawVac.preferred_contact_method || "whatsapp",
      paymentFrequency: rawVac.payment_frequency || "quincenal",
      isVerifiedCompany: comp?.verification_status === "approved",
      location: rawVac.location || rawVac.modality || "Remoto",
      employmentType: rawVac.employment_type || rawVac.modality || "Tiempo Completo",
      formattedSalary,
      isFeatured: Boolean(rawVac.is_promoted || rawVac.is_featured),
      category: rawVac.category || "General",
      description: rawVac.description || "",
      skills: rawVac.skills || [],
      benefits: rawVac.benefits || [],
      requirements: rawVac.requirements || null,
      zone: rawVac.zone || "",
      modality: rawVac.modality || "",
      createdAt: rawVac.created_at,
    };
  }
};
