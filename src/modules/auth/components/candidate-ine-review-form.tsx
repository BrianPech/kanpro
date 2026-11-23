"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  candidatePersonalReviewSchema,
  type CandidatePersonalReviewInput,
  type CandidatePersonalReviewValues,
  type ExtractedIneData,
} from "../schemas/candidate-onboarding.schema";
import { saveCandidatePersonalReviewAction } from "../actions/candidate-onboarding.actions";

const INE_EXTRACTED_STORAGE_KEY = "kanpro_ine_extracted_v1";

export type CandidateIneReviewValues = CandidatePersonalReviewValues;

interface CandidateIneReviewFormProps {
  defaultValues?: Partial<CandidatePersonalReviewInput>;
  backHref?: string;
  nextHref?: string;
  onConfirm?: (values: CandidatePersonalReviewValues) => Promise<void> | void;
}

function formatIsoToDisplayDate(iso?: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day} / ${month} / ${year}`;
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
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<
    CandidatePersonalReviewInput,
    unknown,
    CandidatePersonalReviewValues
  >({
    resolver: zodResolver(candidatePersonalReviewSchema),
    defaultValues: {
      fullName: defaultValues?.fullName ?? "",
      birthDate: defaultValues?.birthDate ?? "",
      whatsappNumber: defaultValues?.whatsappNumber ?? "",
      curp: defaultValues?.curp,
      gender: defaultValues?.gender,
      electorKey: defaultValues?.electorKey,
      ineValidityYear: defaultValues?.ineValidityYear,
    },
    mode: "onTouched",
  });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(INE_EXTRACTED_STORAGE_KEY);
      if (!raw) return;
      const extracted = JSON.parse(raw) as ExtractedIneData;
      if (extracted.fullName && !getValues("fullName")) {
        setValue("fullName", extracted.fullName);
      }
      if (extracted.birthDate && !getValues("birthDate")) {
        setValue("birthDate", formatIsoToDisplayDate(extracted.birthDate));
      }
      if (extracted.curp && !getValues("curp")) {
        setValue("curp", extracted.curp);
      }
      if (extracted.gender && !getValues("gender")) {
        setValue("gender", extracted.gender);
      }
      if (extracted.electorKey && !getValues("electorKey")) {
        setValue("electorKey", extracted.electorKey);
      }
      if (extracted.ineValidityYear && !getValues("ineValidityYear")) {
        setValue("ineValidityYear", extracted.ineValidityYear);
      }
    } catch {
      // ignore invalid sessionStorage
    }
  }, [getValues, setValue]);

  const onSubmit: SubmitHandler<CandidatePersonalReviewValues> = async (
    data
  ) => {
    if (onConfirm) {
      await onConfirm(data);
      return;
    }

    const result = await saveCandidatePersonalReviewAction(data);
    if (!result.success) {
      toast.error("No se pudieron guardar tus datos", {
        description: result.error,
      });
      return;
    }

    router.push(nextHref);
    router.refresh();
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
                    placeholder="Tu nombre completo"
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
                    placeholder="DD / MM / AAAA"
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
