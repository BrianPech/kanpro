import * as React from "react";
import { EvaluationsView } from "@/modules/company/components/evaluations-view";

export const metadata = {
  title: "Evaluación de Desempeño 360 | K'anPro",
  description: "Evaluación periódica de competencias, fortalezas y planes de desarrollo del trabajador.",
};

export default function CompanyEvaluationsPage() {
  return <EvaluationsView />;
}
