import type { Metadata } from "next";
import { CandidateIneReviewForm } from "@/modules/auth/components/candidate-ine-review-form";

export const metadata: Metadata = {
  title: "Revisa tus datos",
  description:
    "Revisa y confirma los datos personales leídos de tu INE para completar tu perfil de candidato.",
};

export default function CandidateIneReviewPage() {
  return <CandidateIneReviewForm />;
}
