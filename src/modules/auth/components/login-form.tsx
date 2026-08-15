"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import Link from "next/link";

import { useLoginForm } from "../hooks/use-login-form";
import { PremiumTextField } from "./premium-text-field";
import { PhoneOtpAuthForm } from "./phone-otp-auth-form";
import { SocialAuthButtons } from "./social-auth-buttons";

export function LoginForm() {
  const [authMode, setAuthMode] = useState<"email" | "phone">("email");

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
      {authMode === "email" ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full flex flex-col items-center gap-4"
          noValidate
        >
          {/* Email Field Card */}
          <PremiumTextField
            id="email"
            label="Email"
            hintText="vijaybhuva90@gmail.com"
            type="email"
            registerProps={register("email")}
            error={errors.email?.message}
          />

          {/* Password Field Card */}
          <PremiumTextField
            id="password"
            label="Password"
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
            className="w-full h-[56px] mt-1 rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-[16px] tracking-[-0.2px] shadow-md shadow-[#1f2732]/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin text-white/80" />
                <span>Cargando...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>

          {/* Alternate Login Divider */}
          <div className="relative my-2 w-full flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#d2dbe5]/50 dark:border-zinc-800" />
            </div>
            <div className="relative bg-white dark:bg-zinc-900 px-3 text-[12px] font-semibold text-[#7d99b3] dark:text-zinc-500 uppercase tracking-wider">
              o continúa con
            </div>
          </div>

          {/* Social Auth & Phone Auth (Google, LinkedIn, WhatsApp/SMS) */}
          <SocialAuthButtons onPhoneClick={() => setAuthMode("phone")} />
        </form>
      ) : (
        <div className="w-full flex flex-col items-center gap-4">
          <header className="text-center mb-1">
            <h2 className="text-[22px] font-extrabold text-[#2f3c4b] dark:text-zinc-50 tracking-[-0.5px]">
              Acceso con WhatsApp / SMS
            </h2>
            <p className="text-[13px] text-[#5c7c9b] dark:text-zinc-400 mt-1 font-medium">
              Ingresa tu número para recibir tu código de acceso
            </p>
          </header>

          <PhoneOtpAuthForm />

          {/* Switch back to email button */}
          <button
            type="button"
            onClick={() => setAuthMode("email")}
            className="mt-2 text-[14px] font-semibold text-[#5c7c9b] hover:text-[#1f2732] dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors flex items-center gap-2 py-1 cursor-pointer"
          >
            <Mail className="size-4" />
            <span>Volver a iniciar con correo y contraseña</span>
          </button>
        </div>
      )}

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
