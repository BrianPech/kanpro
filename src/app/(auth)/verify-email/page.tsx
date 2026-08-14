import { Suspense } from "react";
import { VerifyEmailContent } from "@/modules/auth/components/verify-email-content";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen w-full bg-white sm:bg-[#f8fafc] dark:bg-zinc-950 flex flex-col items-center justify-center font-sans">
          <div className="flex items-center gap-2 text-[#5c7c9b] font-medium">
            <span className="animate-pulse">Cargando verificación...</span>
          </div>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
