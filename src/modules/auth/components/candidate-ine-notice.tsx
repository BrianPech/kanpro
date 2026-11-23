"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Camera01Icon,
  IdentityCardIcon,
  SmartPhone01Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CandidateIneNoticeProps {
  onStartScan?: () => void;
  backHref?: string;
  scanHref?: string;
}

const PREPARATION_TIPS = [
  {
    id: "front-and-back",
    title: "Frente y reverso",
    description: "Escanearemos ambas caras de tu INE.",
    icon: IdentityCardIcon,
    rotateIcon: false,
  },
  {
    id: "good-light",
    title: "Buena luz, sin reflejos",
    description: "Coloca la INE sobre una superficie plana.",
    icon: Sun03Icon,
    rotateIcon: false,
  },
  {
    id: "landscape-phone",
    title: "Gira tu teléfono",
    description: "Usa el teléfono en horizontal para encuadrar.",
    icon: SmartPhone01Icon,
    rotateIcon: true,
  },
] as const;

export function CandidateIneNotice({
  onStartScan,
  backHref = "/verify-email",
  scanHref = "/register/candidate/ine/scan",
}: CandidateIneNoticeProps) {
  const router = useRouter();

  const handleStartScan = () => {
    if (onStartScan) {
      onStartScan();
      return;
    }

    router.push(scanHref);
  };

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

        <Link
          href={backHref}
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-[8px] border border-control-border bg-background text-[14px] font-semibold leading-[20px] text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors shrink-0"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={18}
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>Volver al correo</span>
        </Link>
      </header>

      {/* Contenedor principal: mobile-first pixel-perfect en teléfono, tarjeta centrada en md+ */}
      <main className="w-full flex-1 flex flex-col items-center md:justify-center md:px-6 md:py-8">
        <div className="relative w-full max-w-[402px] md:max-w-[464px] flex-1 md:flex-none flex flex-col px-8 pb-[calc(2rem+env(safe-area-inset-bottom))] md:rounded-[16px] md:border md:border-border md:bg-card md:p-10 md:shadow-xs">
          {/* Barra superior móvil: volver (48 × 48 px) + título "Registro" */}
          <div className="md:hidden -mx-4 pt-12 flex items-center gap-4">
            <Link
              href={backHref}
              aria-label="Volver al correo"
              className="size-[48px] inline-flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors shrink-0"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </Link>
            <span className="text-[20px] font-semibold leading-[28px] text-foreground">
              Registro
            </span>
          </div>

          {/* Ilustración circular */}
          <div className="mt-4 md:mt-0 mx-auto size-[128px] rounded-full bg-muted flex items-center justify-center shrink-0">
            <HugeiconsIcon
              icon={IdentityCardIcon}
              size={64}
              strokeWidth={1.75}
              aria-hidden="true"
              className="text-primary"
            />
          </div>

          {/* Presentación */}
          <header className="mt-6 flex flex-col items-center text-center w-full">
            <h1 className="text-[28px] md:text-[32px] font-bold leading-[39px] md:leading-[40px] tracking-normal text-foreground">
              Ten tu INE
              <br className="md:hidden" />{" "}
              a la mano
            </h1>
            <p className="mt-[18px] md:mt-3 text-[16px] font-normal leading-[22px] md:leading-[24px] text-muted-foreground">
              La usaremos para leer tus datos
              <br className="md:hidden" />{" "}
              y preparar tu perfil.
            </p>
          </header>

          {/* Recomendaciones de preparación */}
          <ul
            aria-label="Recomendaciones para escanear tu INE"
            className="mt-7 md:mt-8 flex flex-col gap-4 w-full"
          >
            {PREPARATION_TIPS.map((tip) => (
              <li
                key={tip.id}
                className="flex items-start gap-4 min-h-[64px] w-full"
              >
                <span
                  aria-hidden="true"
                  className="size-[24px] flex items-center justify-center shrink-0 text-primary"
                >
                  <HugeiconsIcon
                    icon={tip.icon}
                    size={20}
                    strokeWidth={1.75}
                    className={cn(tip.rotateIcon && "-rotate-90")}
                  />
                </span>
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-[16px] font-normal leading-[22px] text-foreground">
                    {tip.title}
                  </p>
                  <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                    {tip.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* Nota de permiso de cámara */}
          <p className="mt-12 md:mt-8 text-center text-[14px] font-normal leading-[19px] text-muted-foreground">
            Te pediremos permiso para usar
            <br className="md:hidden" />{" "}
            la cámara al comenzar.
          </p>

          {/* Acción principal */}
          <Button
            type="button"
            onClick={handleStartScan}
            className="mt-[42px] md:mt-6 h-[56px] w-full rounded-[8px] bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center gap-4 text-[14px] font-semibold leading-normal cursor-pointer transition-colors"
          >
            <HugeiconsIcon
              icon={Camera01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Comenzar escaneo</span>
          </Button>
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
