import * as React from "react";
import { VacancyEditFormView } from "@/modules/company/components/vacancy-edit-form-view";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVacancyPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <VacancyEditFormView userId={user.id} vacancyId={id} />;
}
