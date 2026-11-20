import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CandidateIncidentsService } from "@/modules/candidate/services/candidate-incidents";
import { CandidateIncidentsView } from "@/modules/candidate/components/incidents/candidate-incidents-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mis Incidencias | K'anPro",
  description: "Consulta tus incidencias y reconocimientos, acéptalos o registra tu descargo.",
};

export default async function CandidateIncidentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const incidents = await new CandidateIncidentsService(supabase).listMyIncidents();

  return <CandidateIncidentsView initialIncidents={incidents} />;
}
