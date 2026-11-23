import type { Metadata } from "next";
import { CandidateIneNotice } from "@/modules/auth/components/candidate-ine-notice";

export const metadata: Metadata = {
  title: "Ten tu INE a la mano",
  description:
    "Prepara tu INE para leer tus datos y configurar tu perfil de candidato en Kanpro.",
};

export default function CandidateIneNoticePage() {
  return <CandidateIneNotice />;
}
