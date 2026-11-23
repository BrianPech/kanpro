"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  LockPasswordIcon,
  Mail01Icon,
  Tick02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { AlertCircle, Loader2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCandidateRegisterForm } from "../hooks/use-candidate-register-form";

interface PasswordRequirementItem {
  id: string;
  label: string;
  met: boolean;
}

export function CandidateRegisterForm() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    watch,
  } = useCandidateRegisterForm();

  const passwordValue = watch("password") ?? "";

  const passwordRequirements = useMemo<PasswordRequirementItem[]>(
    () => [
      {
        id: "min-length",
        label: "Al menos 8 caracteres",
        met: passwordValue.length >= 8,
      },
      {
        id: "uppercase",
        label: "Una letra mayúscula",
        met: /[A-Z]/.test(passwordValue),
      },
      {
        id: "number",
        label: "Un número",
        met: /[0-9]/.test(passwordValue),
      },
    ],
    [passwordValue]
  );

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
          href="/register"
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-[8px] border border-control-border bg-background text-[14px] font-semibold leading-[20px] text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors shrink-0"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={18}
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>Volver a elegir perfil</span>
        </Link>
      </header>

      {/* Contenedor principal: mobile-first pixel-perfect en teléfono, tarjeta centrada en md+ */}
      <main className="w-full flex-1 flex flex-col items-center md:justify-center md:px-6 md:py-8">
        <div className="relative w-full max-w-[402px] md:max-w-[464px] flex-1 md:flex-none flex flex-col px-8 pb-[calc(2rem+env(safe-area-inset-bottom))] md:rounded-[16px] md:border md:border-border md:bg-card md:p-10 md:shadow-xs">
          {/* Botón volver móvil (área táctil 48 × 48 px) */}
          <Link
            href="/register"
            aria-label="Volver a empezar"
            className="md:hidden absolute left-4 top-12 size-[48px] inline-flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Link>

          {/* Marca vertical (solo móvil; en md+ vive en la cabecera) */}
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

          {/* Presentación */}
          <header className="mt-[41px] md:mt-0 flex flex-col items-start gap-2 w-full">
            <h1 className="text-[28px] md:text-[32px] font-bold leading-[39px] md:leading-[40px] tracking-normal text-foreground">
              Crea tu cuenta
            </h1>
            <p className="text-[16px] font-normal leading-[22px] md:leading-[24px] text-muted-foreground">
              Tu próximo empleo y tu vida laboral,
              <br className="md:hidden" />{" "}
              en un solo lugar.
            </p>
          </header>

          {/* Formulario de credenciales */}
          <form
            onSubmit={handleSubmit}
            className="mt-[21px] md:mt-8 flex flex-col w-full"
            noValidate
          >
            <div className="flex flex-col gap-6 w-full">
              {/* Correo electrónico */}
              <div className="flex flex-col gap-2 w-full">
                <Label
                  htmlFor="email"
                  className="text-[12px] md:text-[14px] font-medium leading-[17px] md:leading-[20px] text-foreground"
                >
                  Correo electrónico
                </Label>
                <div className="relative w-full">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center justify-center"
                  >
                    <HugeiconsIcon
                      icon={Mail01Icon}
                      size={20}
                      strokeWidth={1.75}
                    />
                  </span>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className="h-[56px] w-full rounded-[8px] border border-input bg-background pl-[51px] pr-4 text-[14px] md:text-[14px] font-normal leading-[19px] text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                    {...register("email")}
                  />
                </div>
                {errors.email?.message && (
                  <p
                    id="email-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-[12px] font-medium leading-[17px] text-error-foreground"
                  >
                    <AlertCircle
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{errors.email.message}</span>
                  </p>
                )}
              </div>

              {/* Contraseña */}
              <div className="flex flex-col gap-2 w-full">
                <Label
                  htmlFor="password"
                  className="text-[12px] md:text-[14px] font-medium leading-[17px] md:leading-[20px] text-foreground"
                >
                  Contraseña
                </Label>
                <div className="relative w-full">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center justify-center"
                  >
                    <HugeiconsIcon
                      icon={LockPasswordIcon}
                      size={20}
                      strokeWidth={1.75}
                    />
                  </span>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Crea una contraseña"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password
                        ? "password-error password-requirements"
                        : "password-requirements"
                    }
                    className="h-[56px] w-full rounded-[8px] border border-input bg-background pl-[51px] pr-[56px] text-[14px] md:text-[14px] font-normal leading-[19px] text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-[48px] inline-flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
                  >
                    <HugeiconsIcon
                      icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                      size={20}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </button>
                </div>
                {errors.password?.message && (
                  <p
                    id="password-error"
                    role="alert"
                    className="flex items-center gap-1.5 text-[12px] font-medium leading-[17px] text-error-foreground"
                  >
                    <AlertCircle
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{errors.password.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Requisitos de contraseña */}
            <ul
              id="password-requirements"
              aria-label="Requisitos de contraseña"
              className="mt-[22px] md:mt-5 flex flex-col gap-2 w-full"
            >
              {passwordRequirements.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center gap-4 min-h-[20px]"
                >
                  {req.met ? (
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      size={14}
                      strokeWidth={2.25}
                      aria-hidden="true"
                      className="shrink-0 text-success-foreground"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="size-[6px] rounded-full bg-muted-foreground shrink-0"
                    />
                  )}
                  <span
                    className={cn(
                      "text-[14px] leading-[19px] transition-colors",
                      req.met
                        ? "font-medium text-success-foreground"
                        : "font-normal text-muted-foreground"
                    )}
                  >
                    <span className="sr-only">
                      {req.met ? "Cumplido: " : "Pendiente: "}
                    </span>
                    {req.label}
                  </span>
                </li>
              ))}
            </ul>

            {/* Acción principal */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-9 md:mt-8 h-[56px] w-full rounded-[8px] bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center gap-4 text-[14px] font-semibold leading-normal cursor-pointer transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="size-5 animate-spin text-primary-foreground"
                    aria-hidden="true"
                  />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={20}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span>Continuar</span>
                </>
              )}
            </Button>

            {/* Acceso existente */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 min-h-[48px] w-full">
              <span className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                ¿Ya tienes una cuenta?
              </span>
              <Link
                href="/login"
                className="inline-flex items-center justify-center min-h-[48px] px-1 text-[14px] font-semibold leading-normal text-primary hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[6px] transition-colors"
              >
                Iniciar sesión
              </Link>
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
