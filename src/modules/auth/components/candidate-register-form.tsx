"use client";

import React, { useMemo } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  Check,
  Circle,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCandidateRegisterForm } from "../hooks/use-candidate-register-form";
import { FormTextField, FormDateField } from "@/components/form";

export function CandidateRegisterForm() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    onSubmit,
    setValue,
    watch,
  } = useCandidateRegisterForm();

  const birthDateValue = watch("birthDate");
  const passwordValue = watch("password") || "";

  // Password criteria indicators
  const passwordCriteria = useMemo(() => {
    return {
      hasMinLength: passwordValue.length >= 8,
      hasUppercase: /[A-Z]/.test(passwordValue),
      hasNumber: /[0-9]/.test(passwordValue),
    };
  }, [passwordValue]);

  return (
    <div className="w-full flex flex-col items-center gap-5">
      {/* ── 1. Header de Tarjeta ── */}
      <div className="flex flex-col items-center text-center gap-1.5 w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide select-none">
          <Sparkles className="size-3.5" />
          <span>Perfil de Candidato</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Crea tu Cuenta
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
          Postúlate a vacantes verificadas, conoce sueldos transparentes y prestaciones de ley.
        </p>
      </div>

      {/* ── 2. Formulario de Registro (Nombre, Fecha de Nacimiento, Email y Contraseña) ── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col items-center gap-3.5"
        noValidate
      >
        {/* Full Name Field */}
        <FormTextField
          id="fullName"
          label="Nombre completo"
          hintText="ej. Juan Pérez Morales"
          type="text"
          required
          registerProps={register("fullName")}
          error={errors.fullName?.message}
          prefixIcon={<User className="size-4" />}
        />

        {/* Date of Birth Field con DatePicker interactivo y dropdowns de mes/año */}
        <FormDateField
          id="birthDate"
          label="Fecha de nacimiento"
          required
          value={birthDateValue}
          onChange={(val) => setValue("birthDate", val, { shouldValidate: true })}
          error={errors.birthDate?.message}
          helperText="Mínimo 15 años conforme a la LFT para contrataciones."
        />

        {/* Email Field */}
        <FormTextField
          id="email"
          label="Correo electrónico"
          hintText="tu.correo@ejemplo.com"
          type="email"
          required
          registerProps={register("email")}
          error={errors.email?.message}
          prefixIcon={<Mail className="size-4" />}
        />

        {/* Password Field */}
        <div className="w-full space-y-1.5">
          <FormTextField
            id="password"
            label="Contraseña"
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
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            }
          />

          {/* Criterios dinámicos de contraseña */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 px-1 text-[11px] select-none">
            <span
              className={`flex items-center gap-1 transition-colors ${
                passwordCriteria.hasMinLength
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {passwordCriteria.hasMinLength ? (
                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="size-2 text-muted-foreground/60 fill-current" />
              )}
              Mínimo 8 caracteres
            </span>

            <span
              className={`flex items-center gap-1 transition-colors ${
                passwordCriteria.hasUppercase
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {passwordCriteria.hasUppercase ? (
                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="size-2 text-muted-foreground/60 fill-current" />
              )}
              1 mayúscula
            </span>

            <span
              className={`flex items-center gap-1 transition-colors ${
                passwordCriteria.hasNumber
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {passwordCriteria.hasNumber ? (
                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="size-2 text-muted-foreground/60 fill-current" />
              )}
              1 número
            </span>
          </div>
        </div>

        {/* Sign Up Action Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm sm:text-base shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin text-primary-foreground/80" />
              <span>Creando cuenta de candidato...</span>
            </>
          ) : (
            <>
              <span>Crear Cuenta de Candidato</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        {/* Legal & Privacy Disclaimer */}
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-1">
          Al crear tu cuenta, aceptas nuestros{" "}
          <Link
            href="/terms"
            className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
          >
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link
            href="/privacy"
            className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
          >
            Aviso de Privacidad
          </Link>
          .
        </p>

        {/* Navigation Link to Login and Company */}
        <div className="flex flex-col items-center gap-2 pt-3 border-t border-border/80 w-full text-center">
          <p className="text-sm text-muted-foreground font-medium">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/login"
              className="text-primary font-bold hover:underline transition-colors ml-1"
            >
              Inicia Sesión
            </Link>
          </p>

          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Building2 className="size-3.5 text-muted-foreground" />
            <span>¿Buscas contratar personal?</span>
            <Link
              href="/register/company"
              className="text-foreground font-semibold hover:text-primary underline ml-0.5 transition-colors"
            >
              Regístrate como Empresa
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
