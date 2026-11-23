"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Calendar03Icon,
  Call02Icon,
  CheckmarkCircle02Icon,
  PencilEdit02Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { AlertCircle, Loader2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeDateToISO, normalizePhone } from "@/lib/formatters";

const candidateReviewSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Ingresa tu nombre completo")
    .max(100, "El nombre es muy largo"),
  birthDate: z
    .string()
    .trim()
    .min(1, "Ingresa tu fecha de nacimiento")
    .refine((val) => {
      const compact = val.replace(/\s+/g, "");
      const iso = normalizeDateToISO(compact);
      if (!iso) return false;
      const [year, month, day] = iso.split("-").map(Number);
      if (!year || !month || !day) return false;
      const date = new Date(year, month - 1, day);
      return !isNaN(date.getTime()) && date.getDate() === day;
    }, "Ingresa una fecha válida (DD / MM / AAAA)")
    .refine((val) => {
      const compact = val.replace(/\s+/g, "");
      const iso = normalizeDateToISO(compact);
      if (!iso) return false;
      const [year, month, day] = iso.split("-").map(Number);
      const birth = new Date(year, month - 1, day);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const hadBirthday =
        today.getMonth() > birth.getMonth() ||
        (today.getMonth() === birth.getMonth() &&
          today.getDate() >= birth.getDate());
      return (hadBirthday ? age : age - 1) >= 15;
    }, "Debes tener al menos 15 años."),
  whatsappNumber: z
    .string()
    .trim()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const clean = normalizePhone(val);
      return clean ? clean.startsWith("+") && clean.length >= 12 && clean.length <= 16 : false;
    }, "Ingresa un número de celular válido (10 dígitos)"),
});

export type CandidateIneReviewValues = z.infer<typeof candidateReviewSchema>;

interface CandidateIneReviewFormProps {
  defaultValues?: Partial<CandidateIneReviewValues>;
  backHref?: string;
  nextHref?: string;
  onConfirm?: (values: CandidateIneReviewValues) => Promise<void> | void;
}

export function CandidateIneReviewForm({
  defaultValues,
  backHref = "/register/candidate/ine/scan?step=back-review",
  nextHref = "/register/candidate/address",
  onConfirm,
}: CandidateIneReviewFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CandidateIneReviewValues>({
    resolver: zodResolver(candidateReviewSchema),
    defaultValues: {
      fullName: defaultValues?.fullName ?? "",
      birthDate: defaultValues?.birthDate ?? "",
      whatsappNumber: defaultValues?.whatsappNumber ?? "",
    },
    mode: "onTouched",
  });

  const onSubmit: SubmitHandler<CandidateIneReviewValues> = async (data) => {
    if (onConfirm) {
      await onConfirm(data);
      return;
    }
    router.push(nextHref);
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
          <span>Volver a revisar INE</span>
        </Link>
      </header>

      {/* Contenedor principal: mobile-first pixel-perfect en teléfono, tarjeta centrada en md+ */}
      <main className="w-full flex-1 flex flex-col items-center md:justify-center md:px-6 md:py-8">
        <div className="relative w-full max-w-[402px] md:max-w-[464px] flex-1 md:flex-none flex flex-col px-8 pb-[calc(2rem+env(safe-area-inset-bottom))] md:rounded-[16px] md:border md:border-border md:bg-card md:p-10 md:shadow-xs">
          {/* Botón volver móvil (área táctil 48 × 48 px) */}
          <Link
            href={backHref}
            aria-label="Volver a revisar INE"
            className="md:hidden absolute left-4 top-12 size-[48px] inline-flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Link>

          {/* Marca vertical (solo móvil) */}
          <div className="md:hidden pt-[72px] flex flex-col items-center justify-center gap-4 select-none">
            <div className="relative h-[80px] w-[72px] shrink-0">
              <Image
                src="/images/kanpro-mark-light.svg"
                alt=""
                width={72}
                height={80}
                priority
                className="h-[80px] w-[72px] dark:hidden"
              />
              <Image
                src="/images/kanpro-mark-dark.svg"
                alt=""
                width={72}
                height={80}
                priority
                className="hidden h-[80px] w-[72px] dark:block"
              />
            </div>
            <span className="text-[28px] font-bold leading-[39px] tracking-normal text-foreground">
              Kanpro
            </span>
          </div>

          {/* Estado: Datos de tu INE */}
          <div className="mt-[9px] md:mt-0 mx-auto md:mx-0 inline-flex items-center gap-4 text-primary">
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span className="text-[12px] font-medium leading-[17px]">
              Datos de tu INE
            </span>
          </div>

          {/* Presentación */}
          <header className="mt-3 flex flex-col items-start gap-2 w-full">
            <h1 className="text-[28px] md:text-[32px] font-bold leading-[39px] md:leading-[40px] tracking-normal text-foreground">
              Revisa tus datos
            </h1>
            <p className="text-[16px] font-normal leading-[22px] md:leading-[24px] text-muted-foreground">
              Leímos estos datos de tu INE.
              <br className="md:hidden" />{" "}
              Revísalos y corrige lo necesario.
            </p>
          </header>

          {/* Formulario de datos básicos */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-[21px] md:mt-6 flex flex-col w-full"
            noValidate
          >
            <div className="flex flex-col gap-6 w-full">
              {/* Nombre completo */}
              <div className="flex flex-col gap-2 w-full">
                <Label
                  htmlFor="fullName"
                  className="text-[12px] md:text-[14px] font-medium leading-[17px] md:leading-[20px] text-foreground"
                >
                  Nombre completo
                </Label>
                <div className="relative w-full">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center justify-center"
                  >
                    <HugeiconsIcon
                      icon={UserCircleIcon}
                      size={20}
                      strokeWidth={1.75}
                    />
                  </span>
                  <Input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Ana Martínez López"
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={
                      errors.fullName ? "fullName-error" : undefined
                    }
                    className="h-[56px] w-full rounded-[8px] border border-input bg-background pl-[51px] pr-4 text-[14px] md:text-[14px] font-normal leading-[19px] text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                    {...register("fullName")}
                  />
                </div>
                {errors.fullName?.message && (
                  <p
                    id="fullName-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-[12px] font-medium leading-[17px] text-error-foreground"
                  >
                    <AlertCircle
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{errors.fullName.message}</span>
                  </p>
                )}
              </div>

              {/* Fecha de nacimiento */}
              <div className="flex flex-col gap-2 w-full">
                <Label
                  htmlFor="birthDate"
                  className="text-[12px] md:text-[14px] font-medium leading-[17px] md:leading-[20px] text-foreground"
                >
                  Fecha de nacimiento
                </Label>
                <div className="relative w-full">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center justify-center"
                  >
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      size={20}
                      strokeWidth={1.75}
                    />
                  </span>
                  <Input
                    id="birthDate"
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday"
                    placeholder="14 / 08 / 1996"
                    aria-invalid={Boolean(errors.birthDate)}
                    aria-describedby={
                      errors.birthDate ? "birthDate-error" : "birthDate-helper"
                    }
                    className="h-[56px] w-full rounded-[8px] border border-input bg-background pl-[51px] pr-4 text-[14px] md:text-[14px] font-normal leading-[19px] text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                    {...register("birthDate")}
                  />
                </div>
                {errors.birthDate?.message ? (
                  <p
                    id="birthDate-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-[12px] font-medium leading-[17px] text-error-foreground"
                  >
                    <AlertCircle
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{errors.birthDate.message}</span>
                  </p>
                ) : (
                  <p
                    id="birthDate-helper"
                    className="text-[14px] font-normal leading-[19px] text-muted-foreground"
                  >
                    Debes tener al menos 15 años.
                  </p>
                )}
              </div>

              {/* WhatsApp (opcional) */}
              <div className="flex flex-col gap-2 w-full">
                <Label
                  htmlFor="whatsappNumber"
                  className="text-[12px] md:text-[14px] font-medium leading-[17px] md:leading-[20px] text-foreground"
                >
                  WhatsApp (opcional)
                </Label>
                <div className="relative w-full">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center justify-center"
                  >
                    <HugeiconsIcon
                      icon={Call02Icon}
                      size={20}
                      strokeWidth={1.75}
                    />
                  </span>
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+52 · Tu número de celular"
                    aria-invalid={Boolean(errors.whatsappNumber)}
                    aria-describedby={
                      errors.whatsappNumber ? "whatsapp-error" : undefined
                    }
                    className="h-[56px] w-full rounded-[8px] border border-input bg-background pl-[51px] pr-4 text-[14px] md:text-[14px] font-normal leading-[19px] text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                    {...register("whatsappNumber")}
                  />
                </div>
                {errors.whatsappNumber?.message && (
                  <p
                    id="whatsapp-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-[12px] font-medium leading-[17px] text-error-foreground"
                  >
                    <AlertCircle
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{errors.whatsappNumber.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Acción principal */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-[26px] md:mt-8 h-[56px] w-full rounded-[8px] bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center gap-4 text-[14px] font-semibold leading-normal cursor-pointer transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="size-5 animate-spin text-primary-foreground"
                    aria-hidden="true"
                  />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>Confirmar mis datos</span>
                </>
              )}
            </Button>

            {/* Ayuda: Datos editables */}
            <div className="mt-6 flex items-center gap-4 min-h-[48px] w-full">
              <HugeiconsIcon
                icon={PencilEdit02Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
              <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                Puedes corregirlos antes de confirmar.
              </p>
            </div>
          </form>
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
