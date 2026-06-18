import type { Database } from "@/types/supabase";

export type VacancyRow = Database["public"]["Tables"]["vacancies"]["Row"];
export type CompanyProfileRow = Database["public"]["Tables"]["company_profiles"]["Row"];

export interface Job {
  id: VacancyRow["id"];
  title: VacancyRow["title"];
  company: CompanyProfileRow["company_name"];
  companyLogo: string;
  logoUrl: CompanyProfileRow["logo_url"];
  location: string;
  salaryMin: number;
  salaryMax: number;
  salaryFormatted: string;
  type: string;
  category: string;
  experience: string;
  skills: string[];
  postedAt: string;
  featured: boolean;
  description: VacancyRow["description"];
  benefits: string[];
  isFromDb: boolean;
  companyPhone: CompanyProfileRow["phone"];
}
