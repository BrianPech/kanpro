"use client";

import React from "react";
import { Eye, EyeOff, Loader2, Network } from "lucide-react";
import Link from "next/link";

import { useLoginForm } from "../hooks/use-login-form";
import { AuthHeader } from "./auth-header";
import { PremiumTextField } from "./premium-text-field";

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
    <main className="min-h-screen w-full bg-white sm:bg-[#f8fafc] dark:bg-zinc-950 flex flex-col items-center justify-start font-sans selection:bg-[#5c7c9b]/20">
      {/* 1. Full-Width Dark Curved Header Section */}
      <AuthHeader
        showLogoCard={true}
        logoIcon={<Network className="size-8 sm:size-10 text-white" />}
      />

      {/* 2. Form Area: Direct on white background for Mobile (100% Flutter fidelity), Elevated Card for Desktop */}
      <div className="w-full max-w-[480px] sm:max-w-[500px] px-7 sm:px-0 sm:-mt-14 z-20 relative pb-16">
        <div className="w-full bg-white dark:bg-zinc-900 sm:rounded-[28px] sm:shadow-[0_16px_40px_rgba(31,39,50,0.08)] sm:dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)] sm:border sm:border-[#d2dbe5]/50 sm:dark:border-zinc-800/80 sm:p-10 flex flex-col items-center">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full flex flex-col items-center gap-5"
            noValidate
          >
            {/* Large bold title */}
            <h1 className="text-[32px] font-extrabold text-[#2f3c4b] dark:text-zinc-50 tracking-[-1px] text-center mt-2 sm:mt-0 mb-1">
              Login
            </h1>

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

            {/* Login Button (Capsule/Pill shape: height 56px, rounded 16px) */}
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

            {/* Navigation Link to Sign Up */}
            <div className="mt-4 text-center">
              <span className="text-[#5c7c9b] dark:text-zinc-400 text-[14px] font-medium">
                Don't have any account?{" "}
              </span>
              <Link
                href="/register"
                className="text-[#1f2732] dark:text-zinc-100 font-bold text-[14px] hover:underline transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
