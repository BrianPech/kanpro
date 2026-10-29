"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowRight, Lock, KeyRound } from "@/components/ui/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "../schemas/reset-password.schema";
import { authService } from "../services/auth-service";
import { FormTextField } from "@/components/form";

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    try {
      await authService.updatePassword(values.password);
      setIsSuccess(true);
      toast.success("¡Tu contraseña ha sido actualizada con éxito!");
    } catch (error: unknown) {
      console.error("Error al actualizar contraseña:", error);
      let errorMessage = "No se pudo actualizar la contraseña. Inténtalo de nuevo.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error("Error al restablecer contraseña", { description: errorMessage });
    }
  };

  return isSuccess ? (
    /* Success View */
    <div className="w-full flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300 gap-4">
      <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1 shadow-sm">
        <CheckCircle2 className="size-8" />
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          ¡Contraseña Actualizada!
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
          Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión de forma segura.
        </p>
      </div>

      <div className="w-full mt-4">
        <Link href="/login" className="w-full">
          <Button className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm sm:text-base shadow-xs gap-2">
            <span>Iniciar Sesión</span>
            <ArrowRight className="size-4" />
          </Button>
        </Link>
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
          <span>Restablecer Clave</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Nueva Contraseña
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
          Crea una nueva contraseña segura para proteger tu cuenta de K&apos;anPro.
        </p>
      </div>

      {/* Password Field */}
      <FormTextField
        id="password"
        label="Nueva Contraseña"
        hintText="••••••••"
        type={showPassword ? "text" : "password"}
        required
        registerProps={register("password")}
        error={errors.password?.message}
        prefixIcon={<Lock className="size-4" />}
        suffixIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      />

      {/* Confirm Password Field */}
      <FormTextField
        id="confirmPassword"
        label="Confirmar Nueva Contraseña"
        hintText="••••••••"
        type={showConfirmPassword ? "text" : "password"}
        required
        registerProps={register("confirmPassword")}
        error={errors.confirmPassword?.message}
        prefixIcon={<Lock className="size-4" />}
        suffixIcon={
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
            aria-label={
              showConfirmPassword
                ? "Ocultar confirmación"
                : "Mostrar confirmación"
            }
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      />

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 mt-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm sm:text-base shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin text-primary-foreground/80" />
            <span>Guardando contraseña...</span>
          </>
        ) : (
          <span>Guardar Nueva Contraseña</span>
        )}
      </Button>
    </form>
  );
}
