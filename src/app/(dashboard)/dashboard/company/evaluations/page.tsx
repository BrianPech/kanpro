import * as React from "react";
import { EvaluationsView } from "@/modules/company/components/evaluations-view";
import { getCompanyEvaluationsData } from "@/modules/company/services/company-evaluations";

export const metadata = {
  title: "Evaluación de Desempeño 360 | K'anPro",
  description: "Evaluación periódica de competencias, fortalezas y planes de desarrollo del trabajador.",
};

export default async function CompanyEvaluationsPage() {
  const { evaluations, employees, nom035Surveys, nom035Metrics, companyName } =
    await getCompanyEvaluationsData();

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
