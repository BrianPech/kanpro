import type { Metadata } from "next";
import { CandidateRegisterForm } from "@/modules/auth/components/candidate-register-form";

export const metadata: Metadata = {
  title: "Crea tu cuenta",
  description:
    "Crea tu cuenta de candidato en Kanpro. Tu próximo empleo y tu vida laboral, en un solo lugar.",
};

export default function CandidateRegisterPage() {
  return <CandidateRegisterForm />;
}
