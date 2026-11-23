import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailContent } from "@/modules/auth/components/verify-email-content";

export const metadata: Metadata = {
  title: "Verifica tu correo",
  description:
    "Ingresa el código de 6 dígitos que enviamos a tu correo electrónico para activar tu cuenta de Kanpro.",
};

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh w-full bg-background flex flex-col items-center justify-center font-sans">
          <p className="text-[14px] font-medium text-muted-foreground animate-pulse">
            Cargando verificación...
          </p>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
