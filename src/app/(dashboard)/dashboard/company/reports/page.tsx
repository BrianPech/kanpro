import * as React from "react";
import { getCompanyReportsData } from "@/modules/company/services/company-reports";
import { CompanyReportsView } from "@/modules/company/components/reports/company-reports-view";

export const metadata = {
  title: "Centro de Reportes & Analítica Oficial",
  description:
    "Descarga de reportes oficiales de plantilla, nómina, contratos, vacaciones LFT y desempeño 100% en tiempo real.",
};

export default async function CompanyReportsPage() {
  const reportsData = await getCompanyReportsData();

  return <CompanyReportsView initialData={reportsData} />;
}
