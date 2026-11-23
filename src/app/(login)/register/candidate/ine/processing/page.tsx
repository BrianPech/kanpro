import type { Metadata } from "next";
import { CandidateIneProcessing } from "@/modules/auth/components/candidate-ine-processing";

export const metadata: Metadata = {
  title: "Procesando imágenes",
  description:
    "Estamos leyendo tus datos personales y tu dirección de la INE.",
};

export default function CandidateIneProcessingPage() {
  return <CandidateIneProcessing />;
}
