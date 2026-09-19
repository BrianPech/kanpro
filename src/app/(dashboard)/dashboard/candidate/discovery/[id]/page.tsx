import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DiscoveryVacancyDetailPage({ params }: PageProps) {
  const { id } = await params;
  redirect("/dashboard/candidate/vacancies/" + id);
}
