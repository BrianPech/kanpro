import React from "react";
import Link from "next/link";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { CompanyRegisterForm } from "@/modules/auth/components/company-register-form";

export default function CompanyRegisterPage() {
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
      <CompanyRegisterForm />
    </AuthShell>
  );
}
