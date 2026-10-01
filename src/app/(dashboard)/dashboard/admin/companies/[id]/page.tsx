import { notFound, redirect } from "next/navigation";
import { getCompanyVerificationById } from "@/app/(dashboard)/dashboard/admin/verifications/actions";
import { CompanyAuditClient } from "@/modules/admin/components/company-audit-view";

export const metadata = {
  title: "Ficha Diagnóstica 360° | K'anPro Admin",
  description: "Diagnóstico operacional, fiscal, legal y documental de la empresa en K'anPro.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDiagnosticDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    redirect("/dashboard/admin/users");
  }

  const company = await getCompanyVerificationById(id);

  if (!company) {
    notFound();
  }

  return <CompanyAuditClient company={company} />;
}
