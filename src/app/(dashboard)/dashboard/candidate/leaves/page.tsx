import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCandidateLeavesData } from "@/modules/candidate/services/candidate-leaves";
import { CandidateLeavesView } from "@/modules/candidate/components/leaves/candidate-leaves-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mis Vacaciones & Permisos LFT | K'anPro",
  description: "Consulta de saldo de vacaciones dignas Art. 76 LFT y gestión de permisos laborales.",
};

export default async function CandidateLeavesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const initialData = await getCandidateLeavesData(supabase, user.id);

  return <CandidateLeavesView initialData={initialData} />;
}
