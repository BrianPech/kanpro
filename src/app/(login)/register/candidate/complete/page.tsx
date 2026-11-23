import type { Metadata } from "next";
import { CandidateRegistrationComplete } from "@/modules/auth/components/candidate-registration-complete";

export const metadata: Metadata = {
  title: "Tu cuenta está lista",
  description:
    "Ya puedes explorar vacantes y completar tu currículum desde Mi perfil en Kanpro.",
};

export default function CandidateRegistrationCompletePage() {
  return <CandidateRegistrationComplete />;
}
