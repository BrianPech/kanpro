import React, { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { LoginForm } from "@/modules/auth/components/login-form";
import { ChevronLeft, Loader2 } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <AuthShell
      headerRight={
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] w-auto sm:w-[166px] px-3 rounded-[8px] border border-control-border bg-background text-[14px] font-semibold leading-[20px] text-foreground hover:bg-muted/50 transition-colors shrink-0"
        >
          <ChevronLeft className="size-4 shrink-0" />
          <span>Volver al inicio</span>
        </Link>
      }
    >
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground mt-4 animate-pulse">
              Cargando inicio de sesión...
            </p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
