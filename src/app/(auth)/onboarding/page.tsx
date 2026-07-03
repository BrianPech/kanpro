import React, { Suspense } from "react";
import { OnboardingClient } from "./onboarding-client";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#fafafc] dark:bg-zinc-950 p-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground mt-4 animate-pulse">
            Cargando onboarding...
          </p>
        </div>
      }
    >
      <OnboardingClient />
    </Suspense>
  );
}
