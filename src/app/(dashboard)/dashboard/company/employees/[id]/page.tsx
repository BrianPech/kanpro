import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import { getEmployeeDossierById } from "@/modules/company/services/company-dossier";
import { EmployeeDossierView } from "@/modules/company/components/dossier/employee-dossier-view";
import { notFound, redirect } from "next/navigation";

export const metadata = {
  title: "Expediente Digital 360",
  description: "Expediente laboral, documentos, historial salarial y vacaciones del empleado.",
};

export default async function EmployeeDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { activeCompanyId } = await getDashboardSession();
  const targetCompanyId = activeCompanyId || user.id;

  const dossier = await getEmployeeDossierById(supabase, id, targetCompanyId);

  if (!dossier) {
    notFound();
  }

  return <EmployeeDossierView dossier={dossier} />;
}
