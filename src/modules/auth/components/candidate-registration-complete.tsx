"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

interface CandidateRegistrationCompleteProps {
  vacanciesHref?: string;
}

export function CandidateRegistrationComplete({
  vacanciesHref = "/dashboard/candidate",
}: CandidateRegistrationCompleteProps) {
  return (
    <div className="min-h-dvh w-full bg-background md:bg-muted/30 text-foreground flex flex-col items-center md:justify-between font-sans selection:bg-primary/20">
      {/* Cabecera para tablet y escritorio */}
      <header className="hidden md:flex w-full items-center justify-between px-8 lg:px-12 py-5 shrink-0">
        <Link
          href="/"
          aria-label="Kanpro - Ir al inicio"
          className="inline-flex items-center gap-3 min-h-[48px] rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none"
        >
          <Image
            src="/images/kanpro-mark-light.svg"
            alt=""
            width={34}
            height={38}
            priority
            className="h-[38px] w-[34px] dark:hidden"
          />
          <Image
            src="/images/kanpro-mark-dark.svg"
            alt=""
            width={34}
            height={38}
            priority
            className="hidden h-[38px] w-[34px] dark:block"
          />
          <span className="text-[22px] font-bold leading-none tracking-tight text-foreground">
            Kanpro
          </span>
        </Link>
      </header>

      {/* Contenedor principal: mobile-first pixel-perfect en teléfono, tarjeta centrada en md+ */}
      <main className="w-full flex-1 flex flex-col items-center md:justify-center md:px-6 md:py-8">
        <div className="w-full max-w-[402px] md:max-w-[464px] flex-1 md:flex-none flex flex-col justify-between px-8 pt-[248px] pb-[calc(34px+env(safe-area-inset-bottom))] md:rounded-[16px] md:border md:border-border md:bg-card md:p-10 md:shadow-xs">
          {/* Contenido / Registro listo */}
          <div className="flex flex-col items-start gap-6 w-full">
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="text-primary shrink-0"
            />
            <h1 className="text-[28px] md:text-[32px] font-bold leading-[39px] md:leading-[40px] tracking-normal text-foreground">
              Tu cuenta está lista
            </h1>
            <p className="text-[16px] font-normal leading-[22px] md:leading-[24px] text-muted-foreground">
              Ya puedes explorar vacantes y completar tu currículum desde Mi
              perfil.
            </p>
          </div>

          {/* Acción principal en zona del pulgar */}
          <Link
            href={vacanciesHref}
            className="mt-10 h-[56px] w-full rounded-[8px] bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center gap-4 text-[14px] font-semibold leading-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={20}
              strokeWidth={2}
              aria-hidden="true"
            />
            <span>Ver vacantes</span>
          </Link>
        </div>
      </main>

      {/* Pie de página para tablet y escritorio */}
      <footer className="hidden md:flex w-full min-h-[64px] items-center justify-between gap-4 px-8 lg:px-12 py-4 text-[13px] leading-[18px] shrink-0">
        <p className="text-muted-foreground font-normal">
          © 2026 Kanpro. México.
        </p>
        <nav
          aria-label="Enlaces legales y soporte"
          className="flex items-center gap-6 font-medium text-link"
        >
          <Link
            href="/privacy"
            className="inline-flex items-center min-h-[48px] hover:underline underline-offset-4 transition-colors"
          >
            Aviso de privacidad
          </Link>
          <Link
            href="/terms"
            className="inline-flex items-center min-h-[48px] hover:underline underline-offset-4 transition-colors"
          >
            Términos
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center min-h-[48px] hover:underline underline-offset-4 transition-colors"
          >
            Soporte
          </Link>
        </nav>
      </footer>
    </div>
  );
}
