"use client";

import React from "react";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import Link from "next/link";

import { useLoginForm } from "../hooks/use-login-form";
import { FormTextField } from "@/components/form";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    onSubmit,
  } = useLoginForm();

  return (
    <div className="w-full flex flex-col items-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col items-center gap-3.5"
        noValidate
      >
        {/* Email Field Card */}
        <FormTextField
          id="email"
          label="Correo electrónico"
          hintText="tu.correo@ejemplo.com"
          type="email"
          required
          registerProps={register("email")}
          error={errors.email?.message}
          prefixIcon={<Mail className="size-4.5" />}
        />

        {/* Password Field Card */}
        <FormTextField
          id="password"
          label="Contraseña"
          hintText="••••••••"
          type={showPassword ? "text" : "password"}
          required
          registerProps={register("password")}
          error={errors.password?.message}
          prefixIcon={<Lock className="size-4.5" />}
          suffixIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#7d99b3] dark:text-zinc-500 hover:text-[#1f2732] dark:hover:text-zinc-300 transition-colors p-1 cursor-pointer"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <EyeOff className="size-4.5" />
              ) : (
                <Eye className="size-4.5" />
              )}
            </button>
          }
        />

        {/* Forgot Password Link */}
        <div className="w-full flex justify-end -mt-1">
          <Link
            href="/forgot-password"
            className="text-[13px] font-semibold text-[#5c7c9b] hover:text-[#1f2732] dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[54px] mt-1 rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-[15px] sm:text-[16px] tracking-[-0.2px] shadow-md shadow-[#1f2732]/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin text-white/80" />
              <span>Iniciando Sesión...</span>
            </>
          ) : (
            <span>Iniciar Sesión</span>
          )}
        </button>
      </form>

      {/* Navigation Link to Sign Up */}
      <div className="mt-6 text-center">
        <span className="text-[#5c7c9b] dark:text-zinc-400 text-[14px] font-medium">
          ¿No tienes una cuenta?{" "}
        </span>
        <Link
          href="/register"
          className="text-[#1f2732] dark:text-zinc-100 font-bold text-[14px] hover:underline transition-colors"
        >
          Registrarse
        </Link>
      </div>
    </div>
  );
}
