import type { Metadata } from "next";
import { CandidateIneAddressForm } from "@/modules/auth/components/candidate-ine-address-form";

export const metadata: Metadata = {
  title: "Tu dirección",
  description:
    "Revisa y confirma la dirección extraída de tu INE para completar tu perfil de candidato.",
};

export default function CandidateIneAddressPage() {
  return <CandidateIneAddressForm />;
}
