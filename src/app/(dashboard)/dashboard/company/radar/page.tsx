import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import {
  CandidateRadarView,
  type CandidateDirectoryItem,
  type VacancyOption,
} from "@/modules/company/components/radar/candidate-radar-view";

export const dynamic = "force-dynamic";

export default async function CandidateRadarPage() {
  const [{ activeCompanyId }, supabase] = await Promise.all([
    getDashboardSession(),
    createClient(),
  ]);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const targetCompanyId = activeCompanyId || user.id;

  // 1. Obtener perfil de la empresa para determinar ubicación y nombre
  const { data: companyProfile } = await supabase
    .from("company_profiles")
    .select("company_name, fiscal_address")
    .eq("id", targetCompanyId)
    .maybeSingle();

  const companyAddress = companyProfile?.fiscal_address || "";
  let companyCity = "";
  if (companyAddress.includes(" - ")) {
    companyCity = companyAddress.split(" - ")[0].trim();
  } else if (companyAddress) {
    companyCity = companyAddress.split(",")[0].trim();
  }

  // 2. Obtener vacantes activas de la empresa para poder invitar candidatos
  const { data: vacanciesData } = await supabase
    .from("vacancies")
    .select("id, title, location")
    .eq("company_id", targetCompanyId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const vacancies: VacancyOption[] = (vacanciesData || []).map((v) => ({
    id: v.id,
    title: v.title,
    location: v.location,
  }));

  // 3. Consultar candidatos del directorio oficial (candidate_directory view)
  const { data: candidatesData } = await supabase
    .from("candidate_directory")
    .select("*")
    .limit(60);

  const candidates: CandidateDirectoryItem[] = candidatesData || [];

  return (
    <CandidateRadarView
      candidates={candidates}
      companyCity={companyCity}
      vacancies={vacancies}
    />
  );
}
