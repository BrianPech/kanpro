import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CandidateSettingsClient } from "@/modules/candidate/components/candidate-settings-client";

export default async function CandidateSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <CandidateSettingsClient
      user={{
        id: user.id,
        email: user.email || "",
        fullName: profile?.full_name || "Candidato",
      }}
    />
  );
}
