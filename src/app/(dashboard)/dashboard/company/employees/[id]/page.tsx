import * as React from "react";
import { getEmployeeDossierById } from "@/modules/company/services/company-dossier";
import { EmployeeDossierView } from "@/modules/company/components/dossier/employee-dossier-view";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Expediente Digital 360 | K'anPro",
  description: "Expediente laboral, documentos, historial salarial y vacaciones del colaborador.",
};

export default async function EmployeeDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dossier = await getEmployeeDossierById(id);

  if (!dossier) {
    notFound();
  }

  return <EmployeeDossierView dossier={dossier} />;
}
