import * as React from "react";
import { CompanyReportsView } from "@/modules/company/components/reports/company-reports-view";

export const metadata = {
  title: "Centro de Reportes & Analítica | K'anPro",
  description: "Descarga de reportes oficiales de asistencia, nómina, rotación y analítica de personal.",
};

export default function CompanyReportsPage() {
  return <CompanyReportsView />;
}
