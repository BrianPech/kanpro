import React from "react";
import Link from "next/link";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { RegisterOptions } from "@/modules/auth/components/register-options";

export default function RegisterPage() {
  return (
    <AuthShell
      headerRight={
        <div className="flex items-center justify-end gap-2 text-[14px] leading-[20px] whitespace-nowrap">
          <span className="text-muted-foreground font-normal">
            ¿Ya tienes cuenta?
          </span>
          <Link
            href="/login"
            className="font-semibold text-link hover:underline underline-offset-4 transition-colors"
          >
            Inicia sesión
          </Link>
        </div>
      }
    >
      <RegisterOptions />
    </AuthShell>
  );
}
