"use client";

import React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

import { useLoginForm } from "../hooks/use-login-form";
import { PremiumTextField } from "./premium-text-field";
import { PhoneOtpAuthForm } from "./phone-otp-auth-form";
import { SocialAuthButtons } from "./social-auth-buttons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
      {/* Tab Switcher: Email vs WhatsApp / SMS */}
      <Tabs defaultValue="email" className="w-full flex flex-col gap-5">
        <TabsList className="w-full grid grid-cols-2 p-1.5 bg-[#f1f5f9] dark:bg-zinc-800/70 rounded-[16px] h-auto border-none">
          <TabsTrigger
            value="email"
            className="py-2.5 rounded-[12px] text-[14px] font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#1f2732] dark:data-[state=active]:text-zinc-50 data-[state=active]:shadow-xs text-[#5c7c9b] dark:text-zinc-400 cursor-pointer"
          >
            Email
          </TabsTrigger>
          <TabsTrigger
            value="phone"
            className="py-2.5 rounded-[12px] text-[14px] font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-[#1f2732] dark:data-[state=active]:text-zinc-50 data-[state=active]:shadow-xs text-[#5c7c9b] dark:text-zinc-400 cursor-pointer"
          >
            WhatsApp / SMS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-0 outline-none">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full flex flex-col items-center gap-5"
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
            <div className="w-full flex justify-end -mt-2">
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
              className="w-full h-[56px] mt-3 rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-[16px] tracking-[-0.2px] shadow-md shadow-[#1f2732]/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
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
          </form>
        </TabsContent>

        <TabsContent value="phone" className="mt-0 outline-none">
          <PhoneOtpAuthForm />
        </TabsContent>
      </Tabs>

      {/* Social Auth Buttons */}
      <SocialAuthButtons />

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
