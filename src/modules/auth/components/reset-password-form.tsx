"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "../schemas/reset-password.schema";
import { authService } from "../services/auth-service";
import { PremiumTextField } from "./premium-text-field";

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
    <div className="w-full flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="size-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 shadow-sm">
        <CheckCircle2 className="size-8" />
      </div>

      <h1 className="text-[26px] font-extrabold text-[#2f3c4b] dark:text-zinc-50 tracking-[-0.5px]">
        ¡Contraseña Actualizada!
      </h1>

      <p className="text-[#5c7c9b] dark:text-zinc-400 text-[14px] leading-relaxed mt-3 max-w-[360px]">
        Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
      </p>

      <div className="w-full mt-8">
        <Link
          href="/login"
          className="w-full h-[56px] rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-[16px] tracking-[-0.2px] shadow-md shadow-[#1f2732]/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>Iniciar Sesión</span>
          <ArrowRight className="size-5" />
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
      <div className="text-center mb-1">
        <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#2f3c4b] dark:text-zinc-50 tracking-[-1px]">
          Nueva Contraseña
        </h1>
        <p className="text-[#5c7c9b] dark:text-zinc-400 text-[14px] leading-relaxed mt-2 max-w-[380px]">
          Crea una nueva contraseña segura para tu cuenta.
        </p>
      </div>

      {/* Password Field */}
      <PremiumTextField
        id="password"
        label="Nueva Contraseña"
        hintText="••••••••"
        type={showPassword ? "text" : "password"}
        registerProps={register("password")}
        error={errors.password?.message}
        suffixIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-[#7d99b3] dark:text-zinc-500 hover:text-[#1f2732] dark:hover:text-zinc-300 transition-colors p-1"
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? (
              <EyeOff className="size-5" />
            ) : (
              <Eye className="size-5" />
            )}
          </button>
        }
      />

      {/* Confirm Password Field */}
      <PremiumTextField
        id="confirmPassword"
        label="Confirmar Nueva Contraseña"
        hintText="••••••••"
        type={showConfirmPassword ? "text" : "password"}
        registerProps={register("confirmPassword")}
        error={errors.confirmPassword?.message}
        suffixIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showConfirmPassword)}
            className="text-[#7d99b3] dark:text-zinc-500 hover:text-[#1f2732] dark:hover:text-zinc-300 transition-colors p-1"
            aria-label={
              showConfirmPassword
                ? "Ocultar confirmación"
                : "Mostrar confirmación"
            }
          >
            {showConfirmPassword ? (
              <EyeOff className="size-5" />
            ) : (
              <Eye className="size-5" />
            )}
          </button>
        }
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
            <span>Guardando...</span>
          </>
        ) : (
          <span>Guardar Nueva Contraseña</span>
        )}
      </button>
    </form>
  );
}
