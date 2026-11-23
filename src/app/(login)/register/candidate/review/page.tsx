import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCandidateOnboardingDraft } from "@/modules/auth/services/candidate-ine.service";
import { CandidateIneReviewForm } from "@/modules/auth/components/candidate-ine-review-form";

export const metadata: Metadata = {
  title: "Revisa tus datos",
  description:
    "Revisa y confirma los datos personales leídos de tu INE para completar tu perfil de candidato.",
};

export default async function CandidateIneReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const draft = user
    ? await getCandidateOnboardingDraft(supabase, user.id)
    : null;

  return <CandidateIneReviewForm defaultValues={draft?.personal} />;
}
