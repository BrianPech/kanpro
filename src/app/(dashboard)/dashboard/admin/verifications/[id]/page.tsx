import { notFound, redirect } from "next/navigation";
import { getCompanyVerificationById, getCandidateVerificationById } from "../actions";
import { CompanyAuditClient } from "./company-audit-client";

export const metadata = {
  title: "Auditoría de Expediente | K'anPro Admin",
  description: "Auditoría fiscal, legal y documental de la empresa en K'anPro.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyVerificationDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    redirect("/dashboard/admin/verifications");
  }

  const company = await getCompanyVerificationById(id);

  if (!company) {
    notFound();
  }

  return <CompanyAuditClient company={company} />;
}
