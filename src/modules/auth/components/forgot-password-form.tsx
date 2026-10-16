"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, MailCheck, ArrowLeft, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "../schemas/forgot-password.schema";
import { authService } from "../services/auth-service";
import { FormTextField } from "@/components/form";

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
    mode: "onTouched",
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

  return isSubmitted ? (
    /* Success View */
    <div className="w-full flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300 gap-4">
      <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1 shadow-sm">
        <MailCheck className="size-8" />
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          ¡Revisa tu correo!
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
          Hemos enviado un enlace seguro para restablecer tu contraseña a:
        </p>
        <p className="font-bold text-sm text-foreground pt-1">
          {submittedEmail}
        </p>
      </div>

      <div className="w-full mt-4 flex flex-col gap-2.5">
        <Link href="/login" className="w-full">
          <Button className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm sm:text-base shadow-xs gap-2">
            <ArrowLeft className="size-4" />
            <span>Volver a Iniciar Sesión</span>
          </Button>
        </Link>

        <button
          type="button"
          onClick={() => setIsSubmitted(false)}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground py-2 transition-colors cursor-pointer"
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
      <div className="flex flex-col items-center text-center gap-1.5 w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide select-none">
          <KeyRound className="size-3.5" />
          <span>Seguridad de Cuenta</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          ¿Olvidaste tu contraseña?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
          Ingresa tu correo electrónico registrado y te enviaremos las instrucciones de recuperación.
        </p>
      </div>

      {/* Email Input */}
      <FormTextField
        id="email"
        label="Correo electrónico"
        hintText="ej. tu.correo@ejemplo.com"
        type="email"
        required
        registerProps={register("email")}
        error={errors.email?.message}
        prefixIcon={<Mail className="size-4" />}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 mt-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm sm:text-base shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin text-primary-foreground/80" />
            <span>Enviando enlace...</span>
          </>
        ) : (
          <span>Enviar enlace de recuperación</span>
        )}
      </Button>

      {/* Back to Login Link */}
      <div className="text-center pt-2 border-t border-border/80 w-full">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground font-semibold transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver al inicio de sesión</span>
        </Link>
      </div>
    </form>
  );
}
