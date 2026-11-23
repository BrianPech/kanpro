import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCandidateOnboardingDraft } from "@/modules/auth/services/candidate-ine.service";
import { CandidateIneAddressForm } from "@/modules/auth/components/candidate-ine-address-form";

export const metadata: Metadata = {
  title: "Tu dirección",
  description:
    "Revisa y confirma la dirección extraída de tu INE para completar tu perfil de candidato.",
};

export default async function CandidateIneAddressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const draft = user
    ? await getCandidateOnboardingDraft(supabase, user.id)
    : null;

  return <CandidateIneAddressForm defaultValues={draft?.address} />;
}
