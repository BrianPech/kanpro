import { createClient } from "@/lib/supabase/client";
import { SearchVacancy } from "../components/job-search-view";

export interface SearchFilters {
  query?: string;
  activeFilters?: string[];
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

export const jobSearchService = {
  /**
   * Performs an optimized, tolerant search on active vacancies.
   */
  async searchVacancies(filters: SearchFilters): Promise<SearchVacancy[]> {
    const supabase = createClient();
    const { query, activeFilters = [] } = filters;

    // 1. Fetch all active vacancies from Supabase
    const { data: rawVacancies, error } = await supabase
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
        is_promoted,
        category,
        company_id,
        created_at,
        zone,
        skills
      `)
      .or("status.eq.Activa,status.eq.activa,status.eq.published,is_active.eq.true")
      .order("is_promoted", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[jobSearchService] Error fetching vacancies from DB:", error.message || error);
      throw error;
    }

    if (!rawVacancies || rawVacancies.length === 0) {
      return [];
    }

    // 2. Fetch company profiles in batch
    const companyIds = Array.from(
      new Set(rawVacancies.map((v: any) => v.company_id).filter(Boolean))
    ) as string[];

    const companies: Record<string, { company_name: string; logo_url: string | null }> = {};

    if (companyIds.length > 0) {
      const { data: companyProfiles } = await supabase
        .from("company_directory")
        .select("id, company_name, logo_url")
        .in("id", companyIds);

      if (companyProfiles) {
        companyProfiles.forEach((comp: any) => {
          companies[comp.id] = {
            company_name: comp.company_name || "Empresa",
            logo_url: comp.logo_url || null,
          };
        });
      }
    }

    // 3. Format vacancies
    const formattedVacancies: SearchVacancy[] = rawVacancies.map((vac: any) => {
      const compInfo = companies[vac.company_id];
      const compName = compInfo?.company_name || "Empresa";
      const compLogo = compInfo?.logo_url || null;

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
        location: vac.location || vac.modality || "Remoto",
        employmentType: vac.employment_type || vac.modality || "Tiempo Completo",
        formattedSalary,
        isFeatured: !!vac.is_promoted,
        category: vac.category || "General",
        description: vac.description || "",
        skills: vac.skills || [],
        zone: vac.zone || "",
      } as SearchVacancy & { description?: string; skills?: string[]; zone?: string };
    });

    // 4. Apply tolerant filtering logic (query + every active filter chip)
    return formattedVacancies.filter((vac: any) => {
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

      // Check text search query
      if (query && query.trim()) {
        if (!matchFuzzy(searchableContent, query.trim())) {
          return false;
        }
      }

      // Check every active filter chip
      for (const filterChip of activeFilters) {
        if (filterChip && filterChip.trim()) {
          if (!matchFuzzy(searchableContent, filterChip.trim())) {
            return false;
          }
        }
      }

      return true;
    });
  }
};
