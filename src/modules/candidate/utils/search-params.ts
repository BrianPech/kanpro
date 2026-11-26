export type CandidateSearchModality =
  | "all"
  | "presencial"
  | "hibrido"
  | "remoto";

export interface CandidateSearchFilters {
  q: string;
  location: string;
  modality: CandidateSearchModality;
}

const VALID_MODALITIES = new Set<CandidateSearchModality>([
  "all",
  "presencial",
  "hibrido",
  "remoto",
]);

export function parseCandidateSearchParams(
  params?: Record<string, string | string[] | undefined>
): CandidateSearchFilters {
  const pick = (key: string): string => {
    const raw = params?.[key];
    return typeof raw === "string" ? raw.trim() : "";
  };

  const rawModality = pick("modality").toLowerCase() as CandidateSearchModality;
  const modality: CandidateSearchModality = VALID_MODALITIES.has(rawModality)
    ? rawModality
    : "all";

  return {
    q: pick("q"),
    location: pick("location"),
    modality,
  };
}

export function buildCandidateSearchUrl(
  filters: Partial<CandidateSearchFilters>
): string {
  const params = new URLSearchParams();
  const q = filters.q?.trim();
  const location = filters.location?.trim();
  const modality = filters.modality;

  if (q) params.set("q", q);
  if (location) params.set("location", location);
  if (modality && modality !== "all") params.set("modality", modality);

  const queryString = params.toString();
  return queryString
    ? `/dashboard/candidate?${queryString}`
    : "/dashboard/candidate";
}
