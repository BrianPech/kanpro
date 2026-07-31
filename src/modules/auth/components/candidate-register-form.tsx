"use client";

import React, { useState } from "react";
import { Calendar, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

import { useCandidateRegisterForm } from "../hooks/use-candidate-register-form";
import { AuthHeader } from "./auth-header";
import { PremiumTextField } from "./premium-text-field";

export function CandidateRegisterForm() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    onSubmit,
  } = useCandidateRegisterForm();

  return (
    <main className="min-h-screen w-full bg-white dark:bg-zinc-950 flex flex-col items-center justify-start pb-12 font-sans selection:bg-[#5c7c9b]/20">
      <div className="w-full max-w-[480px] flex flex-col items-center">
        {/* 1. Dark Curved Header Section with "Sign Up" Title & Back Button */}
        <AuthHeader
          title="Sign Up"
          backHref="/register"
        />

        {/* 2. Form Area */}
        <div className="w-full px-7 sm:px-8 mt-2 flex flex-col items-center">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full flex flex-col items-center gap-4"
            noValidate
          >
            {/* Full Name Field Card */}
            <PremiumTextField
              id="fullName"
              label="Nombre completo"
              hintText="Juan Pérez"
              type="text"
              registerProps={register("fullName")}
              error={errors.fullName?.message}
            />

            {/* Date of Birth Field Card */}
            <PremiumTextField
              id="birthDate"
              label="Fecha de nacimiento"
              hintText="DD/MM/AAAA"
              type="text"
              registerProps={register("birthDate")}
              error={errors.birthDate?.message}
              suffixIcon={
                <Calendar className="size-5 text-[#5c7c9b] dark:text-zinc-500" />
              }
            />

            {/* Teléfono / WhatsApp Field Card */}
            <PremiumTextField
              id="whatsappNumber"
              label="Teléfono / WhatsApp"
              hintText="+52 998 123 4567"
              type="tel"
              registerProps={register("whatsappNumber")}
              error={errors.whatsappNumber?.message}
            />

            {/* Email Field Card */}
            <PremiumTextField
              id="email"
              label="Correo electrónico"
              hintText="juan.perez@correo.com"
              type="email"
              registerProps={register("email")}
              error={errors.email?.message}
            />

            {/* Password Field Card */}
            <PremiumTextField
              id="password"
              label="Contraseña"
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

            {/* Sign Up Action Button (Capsule/Pill shape: height 56px, rounded 16px) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[56px] mt-4 rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-[16px] tracking-[-0.2px] shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 animate-spin text-white/80" />
                  <span>Creando Cuenta...</span>
                </>
              ) : (
                <span>Crear Cuenta de Candidato</span>
              )}
            </button>

            {/* Navigation Link to Login */}
            <div className="mt-5 text-center">
              <span className="text-[#5c7c9b] dark:text-zinc-400 text-[14px] font-medium">
                ¿Ya tienes una cuenta?{" "}
              </span>
              <Link
                href="/login"
                className="text-[#1f2732] dark:text-zinc-100 font-bold text-[14px] hover:underline transition-colors"
              >
                Inicia Sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
