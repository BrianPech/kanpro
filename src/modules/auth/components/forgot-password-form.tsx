"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { KeyRound, Loader2, MailCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "../schemas/forgot-password.schema";
import { authService } from "../services/auth-service";
import { AuthHeader } from "./auth-header";
import { PremiumTextField } from "./premium-text-field";

export function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      await authService.resetPasswordForEmail(values.email);
      setSubmittedEmail(values.email);
      setIsSubmitted(true);
      toast.success("Correo de recuperación enviado con éxito.");
    } catch (error: unknown) {
      console.error("Error al solicitar recuperación de contraseña:", error);
      let errorMessage = "Ocurrió un error al procesar tu solicitud.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error("Error", { description: errorMessage });
    }
  };

  return (
    <main className="min-h-screen w-full bg-white sm:bg-[#f8fafc] dark:bg-zinc-950 flex flex-col items-center justify-start font-sans selection:bg-[#5c7c9b]/20">
      {/* 1. Header Section */}
      <AuthHeader
        backHref="/login"
        showLogoCard={true}
        logoIcon={<KeyRound className="size-8 sm:size-10 text-white" />}
      />

      {/* 2. Responsive Card Container */}
      <div className="w-full max-w-[480px] sm:max-w-[500px] px-7 sm:px-0 sm:-mt-14 z-20 relative pb-16">
        <div className="w-full bg-white dark:bg-zinc-900 sm:rounded-[28px] sm:shadow-[0_16px_40px_rgba(31,39,50,0.08)] sm:dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)] sm:border sm:border-[#d2dbe5]/50 sm:dark:border-zinc-800/80 sm:p-10 flex flex-col items-center">
          {isSubmitted ? (
            /* Success View */
            <div className="w-full flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="size-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 shadow-sm">
                <MailCheck className="size-8" />
              </div>

              <h1 className="text-[26px] font-extrabold text-[#2f3c4b] dark:text-zinc-50 tracking-[-0.5px]">
                ¡Revisa tu correo!
              </h1>

              <p className="text-[#5c7c9b] dark:text-zinc-400 text-[14px] leading-relaxed mt-3 max-w-[360px]">
                Hemos enviado un enlace para restablecer tu contraseña a{" "}
                <span className="font-bold text-[#1f2732] dark:text-zinc-200">
                  {submittedEmail}
                </span>
                . Haz clic en el enlace del correo para continuar.
              </p>

              <div className="w-full mt-8 flex flex-col gap-3">
                <Link
                  href="/login"
                  className="w-full h-[56px] rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-[16px] tracking-[-0.2px] shadow-md shadow-[#1f2732]/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <ArrowLeft className="size-5" />
                  <span>Volver a Iniciar Sesión</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-[#5c7c9b] hover:text-[#1f2732] dark:text-zinc-400 dark:hover:text-zinc-200 font-semibold text-[14px] py-2 transition-colors"
                >
                  ¿No recibiste el correo? Reintentar
                </button>
              </div>
            </div>
          ) : (
            /* Form View */
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="w-full flex flex-col items-center gap-5"
              noValidate
            >
              <div className="text-center mb-1">
                <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#2f3c4b] dark:text-zinc-50 tracking-[-1px]">
                  ¿Olvidaste tu contraseña?
                </h1>
                <p className="text-[#5c7c9b] dark:text-zinc-400 text-[14px] leading-relaxed mt-2 max-w-[380px]">
                  Ingresa tu correo electrónico registrado y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              {/* Email Input */}
              <PremiumTextField
                id="email"
                label="Correo Electrónico"
                hintText="tucorreo@ejemplo.com"
                type="email"
                registerProps={register("email")}
                error={errors.email?.message}
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[56px] mt-2 rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-[16px] tracking-[-0.2px] shadow-md shadow-[#1f2732]/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin text-white/80" />
                    <span>Enviando enlace...</span>
                  </>
                ) : (
                  <span>Enviar enlace de recuperación</span>
                )}
              </button>

              {/* Back to Login Link */}
              <div className="mt-3 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-[#5c7c9b] hover:text-[#1f2732] dark:text-zinc-400 dark:hover:text-zinc-200 font-bold text-[14px] transition-colors"
                >
                  <ArrowLeft className="size-4" />
                  <span>Volver al inicio de sesión</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
