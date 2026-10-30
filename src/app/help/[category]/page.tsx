import { redirect } from "next/navigation";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function HelpCategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  if (category.includes("candidato")) {
    redirect("/help/candidatos/registro-candidato");
  }
  redirect("/help/empresas/alta-empresa");
}
