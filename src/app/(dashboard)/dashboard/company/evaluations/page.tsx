import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { EvaluationsView } from "@/modules/company/components/evaluations-view";
import { getCompanyEvaluationsData } from "@/modules/company/services/company-evaluations";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Evaluación de Desempeño 360 | K'anPro",
  description: "Evaluación periódica de competencias, fortalezas y planes de desarrollo del trabajador.",
};

export default async function CompanyEvaluationsPage() {
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

  const { evaluations, employees, nom035Surveys, nom035Metrics, companyName } =
    await getCompanyEvaluationsData(supabase, targetCompanyId);

  return (
    <EvaluationsView
      initialEvaluations={evaluations}
      employees={employees}
      nom035Surveys={nom035Surveys}
      nom035Metrics={nom035Metrics}
      companyName={companyName}
    />
  );
}
