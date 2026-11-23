"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Mail01Icon,
  PencilEdit02Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { AlertCircle, Loader2 } from "@/components/ui/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { authService } from "../services/auth-service";

const OTP_SLOTS = [0, 1, 2, 3, 4, 5] as const;

export function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    if (value.length > 0) {
      setErrorMessage(null);
    }
  }, []);

  const handleVerifySubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!email) {
        setErrorMessage(
          "No encontramos el correo a verificar. Vuelve al registro e inténtalo de nuevo."
        );
        return;
      }

      if (code.length < 6) {
        setErrorMessage("Ingresa los 6 dígitos del código de verificación.");
        return;
      }

      setErrorMessage(null);
      setIsVerifying(true);

      try {
        const res = await authService.verifyEmailOtp(email, code);
        toast.success("Correo verificado", {
          description: "Tu cuenta está lista para continuar.",
        });
        router.push(
          res.role === "company" ? "/onboarding" : "/register/candidate/ine"
        );
        router.refresh();
      } catch (error: unknown) {
        console.error("Error al verificar código de correo:", error);
        const msg =
          error instanceof Error
            ? error.message
            : "El código es inválido o expiró. Solicita uno nuevo.";
        setErrorMessage(msg);
      } finally {
        setIsVerifying(false);
      }
    },
    [code, email, router]
  );

  const handleResend = useCallback(async () => {
    if (!email) {
      toast.error("Correo no disponible", {
        description:
          "No se proporcionó una dirección de correo para el reenvío.",
      });
      return;
    }

    if (cooldown > 0 || isResending) return;

    setIsResending(true);

    try {
      await authService.resendVerificationEmail(email);
      toast.success("Código reenviado", {
        description:
          "Enviamos un nuevo código de verificación a tu bandeja de entrada.",
      });
      setCooldown(60);
    } catch (error: unknown) {
      console.error("Error al reenviar correo de verificación:", error);
      const msg =
        error instanceof Error
          ? error.message
          : "No se pudo reenviar el código. Inténtalo de nuevo más tarde.";
      toast.error("Error al reenviar", {
        description: msg,
      });
    } finally {
      setIsResending(false);
    }
  }, [email, cooldown, isResending]);

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
          href="/register/candidate"
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-[8px] border border-control-border bg-background text-[14px] font-semibold leading-[20px] text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors shrink-0"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={18}
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>Volver al registro</span>
        </Link>
      </header>

      {/* Contenedor principal: mobile-first pixel-perfect en teléfono, tarjeta centrada en md+ */}
      <main className="w-full flex-1 flex flex-col items-center md:justify-center md:px-6 md:py-8">
        <div className="relative w-full max-w-[402px] md:max-w-[464px] flex-1 md:flex-none flex flex-col px-8 pb-[calc(2rem+env(safe-area-inset-bottom))] md:rounded-[16px] md:border md:border-border md:bg-card md:p-10 md:shadow-xs">
          {/* Botón volver móvil (área táctil 48 × 48 px) */}
          <Link
            href="/register/candidate"
            aria-label="Volver al registro"
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
              Verifica tu correo
            </h1>
            <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
              Enviamos un código de 6 dígitos a
            </p>
            <p className="text-[16px] font-semibold leading-[22px] text-foreground break-all">
              {email || "tu@correo.com"}
            </p>
          </header>

          {/* Cambiar correo */}
          <div className="mt-[5px] flex items-start">
            <Link
              href="/register/candidate"
              className="inline-flex items-center gap-4 min-h-[48px] text-[14px] font-medium leading-normal text-primary hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[6px] transition-colors"
            >
              <HugeiconsIcon
                icon={PencilEdit02Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Cambiar correo</span>
            </Link>
          </div>

          {/* Formulario OTP */}
          <form
            onSubmit={handleVerifySubmit}
            className="mt-6 flex flex-col w-full"
            noValidate
          >
            <Label
              htmlFor="otp-code"
              className="text-[14px] font-normal leading-[19px] text-foreground"
            >
              Código de 6 dígitos
            </Label>

            <div className="mt-[13px] w-full flex justify-center">
              <InputOTP
                id="otp-code"
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={handleCodeChange}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "otp-error" : undefined}
                containerClassName="w-full justify-center"
              >
                <InputOTPGroup className="w-full justify-center gap-2 rounded-none">
                  {OTP_SLOTS.map((slotIndex) => (
                    <InputOTPSlot
                      key={slotIndex}
                      index={slotIndex}
                      className="h-[56px] w-[48px] md:flex-1 md:max-w-[56px] rounded-[8px] first:rounded-[8px] last:rounded-[8px] border border-input first:border bg-background text-[22px] font-semibold leading-none text-foreground shadow-none data-[active=true]:border-2 data-[active=true]:border-primary data-[active=true]:ring-0 aria-invalid:border-destructive"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {errorMessage && (
              <p
                id="otp-error"
                role="alert"
                className="mt-2 flex items-center gap-1.5 text-[12px] font-medium leading-[17px] text-error-foreground"
              >
                <AlertCircle
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{errorMessage}</span>
              </p>
            )}

            {/* Reenviar código */}
            <div className="mt-8 flex flex-col items-start">
              <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                ¿No recibiste el correo?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || cooldown > 0}
                className="mt-[5px] inline-flex items-center gap-4 min-h-[48px] text-[14px] font-medium leading-normal text-primary hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[6px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <HugeiconsIcon
                  icon={RefreshIcon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className={cn(isResending && "animate-spin")}
                />
                <span>
                  {isResending
                    ? "Enviando código..."
                    : cooldown > 0
                      ? `Reenviar código (${cooldown}s)`
                      : "Reenviar código"}
                </span>
              </button>
            </div>

            {/* Acción principal */}
            <Button
              type="submit"
              disabled={isVerifying}
              className="mt-16 md:mt-8 h-[56px] w-full rounded-[8px] bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center gap-4 text-[14px] font-semibold leading-normal cursor-pointer transition-colors"
            >
              {isVerifying ? (
                <>
                  <Loader2
                    className="size-5 animate-spin text-primary-foreground"
                    aria-hidden="true"
                  />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <span>Verificar correo</span>
                </>
              )}
            </Button>

            {/* Ayuda bandeja de correo */}
            <div className="mt-4 flex items-center gap-4 min-h-[48px] w-full">
              <HugeiconsIcon
                icon={Mail01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
              <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                Revisa también spam o promociones.
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
