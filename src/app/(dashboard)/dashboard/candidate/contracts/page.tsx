import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCandidateContracts } from "@/modules/candidate/services/candidate-contracts";
import { CandidateContractsView } from "@/modules/candidate/components/contracts/candidate-contracts-view";

export const dynamic = "force-dynamic";

export default async function CandidateContractsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [contractsResult, { data: baseProfile }, { data: privateProfile }] =
    await Promise.all([
      getCandidateContracts(supabase, user.id),
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("candidate_private_profiles")
        .select("rfc, curp")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  return (
    <CandidateContractsView
      initialContracts={contractsResult.contracts}
      candidateName={baseProfile?.full_name || "Candidato"}
      candidateRfc={privateProfile?.rfc || null}
      candidateCurp={privateProfile?.curp || null}
    />
  );
}
