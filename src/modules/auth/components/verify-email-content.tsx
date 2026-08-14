"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AuthHeader } from "./auth-header";
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
    <main className="min-h-screen w-full bg-white sm:bg-[#f8fafc] dark:bg-zinc-950 flex flex-col items-center justify-start font-sans selection:bg-[#5c7c9b]/20">
      {/* 1. Header */}
      <AuthHeader title="Verificación" backHref="/login" />

      {/* 2. Container */}
      <div className="w-full max-w-[520px] px-6 sm:px-0 sm:-mt-14 z-20 relative pb-16">
        <div className="w-full bg-white dark:bg-zinc-900 sm:rounded-[28px] sm:shadow-[0_16px_40px_rgba(31,39,50,0.08)] sm:dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)] sm:border sm:border-[#d2dbe5]/50 sm:dark:border-zinc-800/80 p-8 sm:p-10 flex flex-col items-center gap-6 text-center">
          {/* Icon Badge */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1f2732]/5 dark:bg-zinc-800 flex items-center justify-center shadow-inner transition-transform hover:scale-105 duration-300">
              <Mail className="size-10 sm:size-12 text-[#1f2732] dark:text-zinc-100" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full ring-4 ring-white dark:ring-zinc-900 shadow-sm">
              <CheckCircle2 className="size-4" />
            </div>
          </div>

          {/* Heading */}
          <header className="flex flex-col gap-2 items-center">
            <h1 className="text-[26px] sm:text-[30px] font-extrabold text-[#2f3c4b] dark:text-zinc-50 tracking-[-1px]">
              Revisa tu bandeja de entrada
            </h1>
            <p className="text-[14px] text-[#5c7c9b] dark:text-zinc-400 font-medium leading-relaxed max-w-sm">
              Hemos enviado un enlace de confirmación para activar tu cuenta en K&apos;anPro.
            </p>
          </header>

          {/* Email Chip */}
          {email ? (
            <div className="inline-flex items-center gap-2 bg-[#f5f7fa] dark:bg-zinc-800/80 border border-[#d2dbe5]/60 dark:border-zinc-700/60 px-4 py-2 rounded-full my-1 max-w-full">
              <Mail className="size-4 text-[#5c7c9b] dark:text-zinc-400 shrink-0" />
              <span className="text-[14px] font-bold text-[#1f2732] dark:text-zinc-100 truncate">
                {email}
              </span>
            </div>
          ) : null}

          {/* Instructions */}
          <p className="text-[13px] text-[#5c7c9b]/90 dark:text-zinc-400 font-normal leading-relaxed max-w-md bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-[16px] p-4">
            Haz clic en el botón de confirmación dentro del correo recibido. Si no lo encuentras en unos minutos, revisa tu carpeta de <span className="font-semibold text-[#1f2732] dark:text-zinc-200">spam</span> o correo no deseado.
          </p>

          {/* Resend Action */}
          <div className="w-full flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || cooldown > 0 || !email}
              className="w-full h-[52px] rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-[15px] tracking-[-0.2px] shadow-md shadow-[#1f2732]/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isResending ? (
                <>
                  <Loader2 className="size-4 animate-spin text-white/80" />
                  <span>Enviando correo...</span>
                </>
              ) : cooldown > 0 ? (
                <>
                  <RefreshCw className="size-4 text-white/60 animate-spin" />
                  <span>Reenviar correo ({cooldown}s)</span>
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  <span>Reenviar correo de verificación</span>
                </>
              )}
            </button>
          </div>

          {/* Navigation to Login */}
          <div className="pt-4 border-t border-[#d2dbe5]/40 dark:border-zinc-800 w-full flex items-center justify-center">
            <p className="text-[14px] text-[#5c7c9b] dark:text-zinc-400 font-medium">
              ¿Ya confirmaste tu correo?{" "}
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-[#1f2732] dark:text-zinc-100 font-bold hover:underline"
              >
                <span>Iniciar Sesión</span>
                <ArrowRight className="size-4" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
