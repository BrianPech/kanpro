"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2, RefreshCw, CheckCircle2, ArrowRight } from "@/components/ui/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authService } from "../services/auth-service";

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [cooldown, setCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (!email) {
      toast.error("Correo no disponible", {
        description: "No se proporcionó una dirección de correo para el reenvío.",
      });
      return;
    }

    if (cooldown > 0 || isResending) return;

    setIsResending(true);

    try {
      await authService.resendVerificationEmail(email);
      toast.success("Correo enviado", {
        description: "Hemos reenviado el enlace de verificación a tu bandeja de entrada.",
      });
      setCooldown(60);
    } catch (error: unknown) {
      console.error("Error al reenviar correo de verificación:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo reenviar el correo. Inténtalo de nuevo más tarde.";
      toast.error("Error al reenviar", {
        description: errorMessage,
      });
    } finally {
      setIsResending(false);
    }
  }, [email, cooldown, isResending]);

  return (
    <div className="w-full flex flex-col items-center gap-5 text-center">
      {/* Icon Badge */}
      <div className="relative">
        <div className="size-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
          <Mail className="size-10 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full ring-4 ring-card shadow-sm">
          <CheckCircle2 className="size-4" />
        </div>
      </div>

      {/* Heading */}
      <header className="flex flex-col gap-1.5 items-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Revisa tu bandeja de entrada
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed max-w-sm">
          Hemos enviado un enlace de confirmación para activar tu cuenta en K&apos;anPro.
        </p>
      </header>

      {/* Email Chip */}
      {email ? (
        <div className="inline-flex items-center gap-2 bg-muted/60 border border-border px-4 py-2 rounded-full my-0.5 max-w-full">
          <Mail className="size-4 text-muted-foreground shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-foreground truncate">
            {email}
          </span>
        </div>
      ) : null}

      {/* Instructions */}
      <div className="text-xs text-muted-foreground leading-relaxed max-w-md bg-amber-500/10 border border-amber-500/20 text-foreground/90 rounded-xl p-3.5 text-left">
        <p>
          Haz clic en el enlace dentro del correo para confirmar tu cuenta. Si no lo ves en unos minutos, revisa tu carpeta de <span className="font-bold">spam</span> o promociones.
        </p>
      </div>

      {/* Resend Action */}
      <div className="w-full flex flex-col gap-3 pt-1">
        <Button
          type="button"
          onClick={handleResend}
          disabled={isResending || cooldown > 0 || !email}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm sm:text-base shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
        >
          {isResending ? (
            <>
              <Loader2 className="size-4 animate-spin text-primary-foreground/80" />
              <span>Enviando correo...</span>
            </>
          ) : cooldown > 0 ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              <span>Reenviar correo ({cooldown}s)</span>
            </>
          ) : (
            <>
              <RefreshCw className="size-4" />
              <span>Reenviar correo de verificación</span>
            </>
          )}
        </Button>
      </div>

      {/* Navigation to Login */}
      <div className="pt-3 border-t border-border/80 w-full flex items-center justify-center">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          ¿Ya confirmaste tu correo?{" "}
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-foreground font-bold hover:text-primary transition-colors underline ml-1"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </p>
      </div>
    </div>
  );
}
