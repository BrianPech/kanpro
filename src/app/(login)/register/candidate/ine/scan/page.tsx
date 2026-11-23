import type { Metadata } from "next";
import {
  CandidateIneScanner,
  type IneScanStep,
} from "@/modules/auth/components/candidate-ine-scanner";

export const metadata: Metadata = {
  title: "Escaneo de INE",
  description:
    "Escanea el frente y reverso de tu INE con la cámara de tu dispositivo.",
};

const VALID_STEPS: ReadonlySet<string> = new Set([
  "front-scan",
  "front-review",
  "back-scan",
  "back-review",
]);

interface CandidateIneScanPageProps {
  searchParams: Promise<{ step?: string }>;
}

export default async function CandidateIneScanPage({
  searchParams,
}: CandidateIneScanPageProps) {
  const { step } = await searchParams;
  const initialStep: IneScanStep =
    step && VALID_STEPS.has(step) ? (step as IneScanStep) : "front-scan";

  return <CandidateIneScanner initialStep={initialStep} />;
}
