"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { AlertCircle } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

interface CandidateIneProcessingProps {
  error?: string | null;
  onRetry?: () => void;
  retryHref?: string;
}

export function CandidateIneProcessing({
  error = null,
  onRetry,
  retryHref = "/register/candidate/ine/scan",
}: CandidateIneProcessingProps) {
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

      {/* Contenido centrado: vertical en móvil, tarjeta centrada en md+ */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-8 pb-[env(safe-area-inset-bottom)] md:px-6 md:py-8">
        <div
          role={error ? "alert" : "status"}
          aria-live="polite"
          className="w-full max-w-[338px] md:max-w-[464px] flex flex-col items-center gap-6 text-center md:rounded-[16px] md:border md:border-border md:bg-card md:p-12 md:shadow-xs"
        >
          {error ? (
            <>
              <div className="size-[64px] rounded-full bg-error flex items-center justify-center shrink-0">
                <AlertCircle
                  className="size-8 text-error-foreground"
                  aria-hidden="true"
                />
              </div>

              <div className="flex flex-col items-center gap-4 w-full">
                <h1 className="text-[28px] font-bold leading-[39px] tracking-normal text-foreground">
                  No pudimos leer tu INE
                </h1>
                <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
                  {error}
                </p>
              </div>

              {onRetry ? (
                <Button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 h-[56px] w-full rounded-[8px] bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center gap-4 text-[14px] font-semibold cursor-pointer transition-colors"
                >
                  <HugeiconsIcon
                    icon={RefreshIcon}
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>Reintentar escaneo</span>
                </Button>
              ) : (
                <Link
                  href={retryHref}
                  className="mt-2 h-[56px] w-full rounded-[8px] bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center gap-4 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <HugeiconsIcon
                    icon={RefreshIcon}
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>Reintentar escaneo</span>
                </Link>
              )}
            </>
          ) : (
            <>
              {/* Loader animado (1 vuelta/s lineal = 1080° en 3s según Figma Motion) */}
              <div className="size-[64px] flex items-center justify-center shrink-0">
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={64}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="text-primary animate-spin motion-reduce:animate-none"
                />
              </div>

              <div className="flex flex-col items-center gap-4 w-full">
                <h1 className="text-[28px] font-bold leading-[39px] tracking-normal text-foreground">
                  Procesando imágenes
                </h1>
                <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
                  Estamos leyendo tus datos personales y tu dirección de la INE.
                  Espera un momento.
                </p>
              </div>
            </>
          )}
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
