"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { AlertCircle, Loader2 } from "@/components/ui/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  candidateAddressSchema,
  type CandidateAddressValues,
  type ExtractedIneData,
} from "../schemas/candidate-onboarding.schema";
import { saveCandidateAddressAction } from "../actions/candidate-onboarding.actions";

const INE_EXTRACTED_STORAGE_KEY = "kanpro_ine_extracted_v1";

export type CandidateIneAddressValues = CandidateAddressValues;

interface CandidateIneAddressFormProps {
  defaultValues?: Partial<CandidateIneAddressValues>;
  backHref?: string;
  nextHref?: string;
  onConfirm?: (values: CandidateIneAddressValues) => Promise<void> | void;
}

const INPUT_CLASS =
  "h-[56px] w-full rounded-[8px] border border-input bg-background px-[15px] text-[14px] md:text-[14px] font-normal leading-[19px] text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30";

export function CandidateIneAddressForm({
  defaultValues,
  backHref = "/register/candidate/review",
  nextHref = "/register/candidate/complete",
  onConfirm,
}: CandidateIneAddressFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CandidateIneAddressValues>({
    resolver: zodResolver(candidateAddressSchema),
    defaultValues: {
      postalCode: defaultValues?.postalCode ?? "",
      state: defaultValues?.state ?? "",
      municipality: defaultValues?.municipality ?? "",
      neighborhood: defaultValues?.neighborhood ?? "",
      street: defaultValues?.street ?? "",
      exteriorNumber: defaultValues?.exteriorNumber ?? "",
      interiorNumber: defaultValues?.interiorNumber ?? "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(INE_EXTRACTED_STORAGE_KEY);
      if (!raw) return;
      const extracted = JSON.parse(raw) as ExtractedIneData;
      if (extracted.postalCode && !getValues("postalCode")) {
        setValue("postalCode", extracted.postalCode);
      }
      if (extracted.state && !getValues("state")) {
        setValue("state", extracted.state);
      }
      if (extracted.municipality && !getValues("municipality")) {
        setValue("municipality", extracted.municipality);
      }
      if (extracted.neighborhood && !getValues("neighborhood")) {
        setValue("neighborhood", extracted.neighborhood);
      }
      if (extracted.street && !getValues("street")) {
        setValue("street", extracted.street);
      }
      if (extracted.exteriorNumber && !getValues("exteriorNumber")) {
        setValue("exteriorNumber", extracted.exteriorNumber);
      }
      if (extracted.interiorNumber && !getValues("interiorNumber")) {
        setValue("interiorNumber", extracted.interiorNumber);
      }
    } catch {
      // ignore invalid sessionStorage
    }
  }, [getValues, setValue]);

  const onSubmit: SubmitHandler<CandidateIneAddressValues> = async (data) => {
    if (onConfirm) {
      await onConfirm(data);
      return;
    }

    const result = await saveCandidateAddressAction(data);
    if (!result.success) {
      toast.error("No se pudo guardar tu dirección", {
        description: result.error,
      });
      return;
    }

    try {
      sessionStorage.removeItem(INE_EXTRACTED_STORAGE_KEY);
    } catch {
      // ignore
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
          <span>Volver a datos personales</span>
        </Link>
      </header>

      {/* Contenedor principal: mobile-first pixel-perfect en teléfono, tarjeta centrada en md+ */}
      <main className="w-full flex-1 flex flex-col items-center md:justify-center md:px-6 md:py-8">
        <div className="relative w-full max-w-[402px] md:max-w-[540px] flex-1 md:flex-none flex flex-col px-8 pb-[calc(2rem+env(safe-area-inset-bottom))] md:rounded-[16px] md:border md:border-border md:bg-card md:p-10 md:shadow-xs">
          {/* Barra superior móvil: volver (48 × 48 px) + título "Registro" */}
          <div className="md:hidden -mx-4 pt-12 flex items-center gap-4">
            <Link
              href={backHref}
              aria-label="Volver a datos personales"
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

          {/* Presentación */}
          <header className="mt-4 md:mt-0 flex flex-col items-start gap-[9px] w-full">
            <h1 className="text-[28px] md:text-[32px] font-bold leading-[39px] md:leading-[40px] tracking-normal text-foreground">
              Tu dirección
            </h1>
            <p className="text-[16px] font-normal leading-[22px] md:leading-[24px] text-muted-foreground">
              Dirección extraída de tu INE.
              <br className="md:hidden" />{" "}
              Revísala y corrige lo necesario.
            </p>
          </header>

          {/* Formulario de domicilio */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-3 md:mt-6 flex flex-col w-full"
            noValidate
          >
            <div className="flex flex-col gap-2 md:gap-4 w-full">
              {/* Código postal + Estado (apilados en móvil, 2 columnas en md+) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <Label
                    htmlFor="postalCode"
                    className="text-[12px] md:text-[14px] font-medium leading-[17px] md:leading-[20px] text-foreground"
                  >
                    Código postal
                  </Label>
                  <Input
                    id="postalCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    autoComplete="postal-code"
                    placeholder="5 dígitos"
                    aria-invalid={Boolean(errors.postalCode)}
                    aria-describedby={
                      errors.postalCode ? "postalCode-error" : undefined
                    }
                    className={INPUT_CLASS}
                    {...register("postalCode")}
                  />
                  {errors.postalCode?.message && (
                    <p
                      id="postalCode-error"
                      role="alert"
                      className="flex items-center gap-1.5 text-[12px] font-medium leading-[17px] text-error-foreground"
                    >
                      <AlertCircle
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{errors.postalCode.message}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <Label
                    htmlFor="state"
                    className="text-[12px] md:text-[14px] font-medium leading-[17px] md:leading-[20px] text-foreground"
                  >
                    Estado
                  </Label>
                  <Input
                    id="state"
                    type="text"
                    autoComplete="address-level1"
                    placeholder="Ingresa tu estado"
                    aria-invalid={Boolean(errors.state)}
                    aria-describedby={errors.state ? "state-error" : undefined}
                    className={INPUT_CLASS}
                    {...register("state")}
                  />
                  {errors.state?.message && (
                    <p
                      id="state-error"
                      role="alert"
                      className="flex items-center gap-1.5 text-[12px] font-medium leading-[17px] text-error-foreground"
                    >
                      <AlertCircle
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{errors.state.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Municipio + Colonia (apilados en móvil, 2 columnas en md+) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <Label
                    htmlFor="municipality"
                    className="text-[12px] md:text-[14px] font-medium leading-[17px] md:leading-[20px] text-foreground"
                  >
                    Municipio o alcaldía
                  </Label>
                  <Input
                    id="municipality"
                    type="text"
                    autoComplete="address-level2"
                    placeholder="Ingresa tu municipio o alcaldía"
                    aria-invalid={Boolean(errors.municipality)}
                    aria-describedby={
                      errors.municipality ? "municipality-error" : undefined
                    }
                    className={INPUT_CLASS}
                    {...register("municipality")}
                  />
                  {errors.municipality?.message && (
                    <p
                      id="municipality-error"
                      role="alert"
                      className="flex items-center gap-1.5 text-[12px] font-medium leading-[17px] text-error-foreground"
                    >
                      <AlertCircle
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{errors.municipality.message}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <Label
                    htmlFor="neighborhood"
                    className="text-[12px] md:text-[14px] font-medium leading-[17px] md:leading-[20px] text-foreground"
                  >
                    Colonia
                  </Label>
                  <Input
                    id="neighborhood"
                    type="text"
                    autoComplete="address-level3"
                    placeholder="Ingresa tu colonia"
                    aria-invalid={Boolean(errors.neighborhood)}
                    aria-describedby={
                      errors.neighborhood ? "neighborhood-error" : undefined
                    }
                    className={INPUT_CLASS}
                    {...register("neighborhood")}
                  />
                  {errors.neighborhood?.message && (
                    <p
                      id="neighborhood-error"
                      role="alert"
                      className="flex items-center gap-1.5 text-[12px] font-medium leading-[17px] text-error-foreground"
                    >
                      <AlertCircle
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{errors.neighborhood.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Calle */}
              <div className="flex flex-col gap-2 w-full">
                <Label
                  htmlFor="street"
                  className="text-[12px] md:text-[14px] font-medium leading-[17px] md:leading-[20px] text-foreground"
                >
                  Calle
                </Label>
                <Input
                  id="street"
                  type="text"
                  autoComplete="street-address"
                  placeholder="Nombre de la calle"
                  aria-invalid={Boolean(errors.street)}
                  aria-describedby={errors.street ? "street-error" : undefined}
                  className={INPUT_CLASS}
                  {...register("street")}
                />
                {errors.street?.message && (
                  <p
                    id="street-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-[12px] font-medium leading-[17px] text-error-foreground"
                  >
                    <AlertCircle
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{errors.street.message}</span>
                  </p>
                )}
              </div>

              {/* Núm. exterior + Interior (opcional) — 2 columnas siempre */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <Label
                    htmlFor="exteriorNumber"
                    className="text-[12px] md:text-[14px] font-medium leading-[17px] md:leading-[20px] text-foreground"
                  >
                    Núm. exterior
                  </Label>
                  <Input
                    id="exteriorNumber"
                    type="text"
                    placeholder="Núm. exterior"
                    aria-invalid={Boolean(errors.exteriorNumber)}
                    aria-describedby={
                      errors.exteriorNumber ? "exteriorNumber-error" : undefined
                    }
                    className={INPUT_CLASS}
                    {...register("exteriorNumber")}
                  />
                  {errors.exteriorNumber?.message && (
                    <p
                      id="exteriorNumber-error"
                      role="alert"
                      className="flex items-center gap-1.5 text-[12px] font-medium leading-[17px] text-error-foreground"
                    >
                      <AlertCircle
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{errors.exteriorNumber.message}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <Label
                    htmlFor="interiorNumber"
                    className="text-[12px] md:text-[14px] font-medium leading-[17px] md:leading-[20px] text-foreground"
                  >
                    Interior (opcional)
                  </Label>
                  <Input
                    id="interiorNumber"
                    type="text"
                    placeholder="Opcional"
                    className={INPUT_CLASS}
                    {...register("interiorNumber")}
                  />
                </div>
              </div>
            </div>

            {/* Acción principal */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-[42px] md:mt-8 h-[56px] w-full rounded-[8px] bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center gap-4 text-[14px] font-semibold leading-normal cursor-pointer transition-colors"
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
                    icon={ArrowRight01Icon}
                    size={20}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span>Confirmar dirección</span>
                </>
              )}
            </Button>
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
