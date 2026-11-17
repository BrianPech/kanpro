import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CompanyAreasView } from "@/modules/company/components/areas/company-areas-view";
import { CompanyAreasService } from "@/modules/company/services/company-areas";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";

export const metadata = {
  title: "Áreas & Departamentos",
  description:
    "Gestor de estructura organizacional, departamentos y áreas operativas de la empresa.",
};

export default async function CompanyAreasPage() {
  const [{ activeCompanyId }, supabase] = await Promise.all([
    getDashboardSession(),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const targetCompanyId = activeCompanyId || user.id;

  let initialDepartments: Awaited<ReturnType<typeof CompanyAreasService.getCompanyDepartments>> = [];
  try {
    initialDepartments = await CompanyAreasService.getCompanyDepartments(
      supabase,
      targetCompanyId
    );
  } catch (err) {
    console.error("[CompanyAreasPage] Error loading initial departments:", err);
  }

  return <CompanyAreasView initialDepartments={initialDepartments} />;
}
