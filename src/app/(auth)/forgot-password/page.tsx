import React, { Suspense } from "react";
import { ForgotPasswordForm } from "@/modules/auth/components/forgot-password-form";
import { Loader2 } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#fafafc] dark:bg-zinc-950 p-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground mt-4 animate-pulse">
            Cargando recuperación de contraseña...
          </p>
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
