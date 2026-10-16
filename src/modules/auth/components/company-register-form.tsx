"use client";

import React, { useMemo } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Mail,
  Lock,
  ArrowRight,
  Check,
  Circle,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCompanyRegisterForm } from "../hooks/use-company-register-form";
import { FormTextField } from "@/components/form";

export function CompanyRegisterForm() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    onSubmit,
    watch,
  } = useCompanyRegisterForm();

  const passwordValue = watch("password") || "";

  // Dynamic Password Criteria Indicators
  const passwordCriteria = useMemo(() => {
    return {
      hasMinLength: passwordValue.length >= 8,
      hasUppercase: /[A-Z]/.test(passwordValue),
      hasNumber: /[0-9]/.test(passwordValue),
    };
  }, [passwordValue]);

  return (
    <div className="w-full flex flex-col items-center gap-5">
      {/* ── 1. Form Header ── */}
      <div className="flex flex-col items-center text-center gap-1.5 w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide select-none">
          <Building2 className="size-3.5" />
          <span>Perfil de Empresa</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Registro de Empresa
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
          Publica vacantes, contrata el mejor talento calificado y gestiona tu plantilla laboral.
        </p>
      </div>

      {/* ── 2. Main Registration Form (Email & Contraseña Únicamente) ── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col items-center gap-3.5"
        noValidate
      >
        {/* Company Name */}
        <FormTextField
          id="full_name"
          label="Nombre de la Empresa o Razón Social"
          hintText="ej. Corporativo Maya S.A. de C.V."
          type="text"
          required
          registerProps={register("full_name")}
          error={errors.full_name?.message}
          prefixIcon={<Building2 className="size-4" />}
        />

        {/* Corporate Email */}
        <FormTextField
          id="email"
          label="Correo Corporativo o de Contacto"
          hintText="recursos.humanos@empresa.com"
          type="email"
          required
          registerProps={register("email")}
          error={errors.email?.message}
          prefixIcon={<Mail className="size-4" />}
        />

        {/* Password */}
        <div className="w-full space-y-1.5">
          <FormTextField
            id="password"
            label="Contraseña segura"
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

          {/* Dynamic Password Checklist */}
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

        {/* Submit Action Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm sm:text-base shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin text-primary-foreground/80" />
              <span>Creando cuenta de empresa...</span>
            </>
          ) : (
            <>
              <span>Crear Cuenta de Empresa</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        {/* Legal & Terms Notice */}
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-1">
          Al registrar tu empresa, aceptas los{" "}
          <Link
            href="/terms"
            className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
          >
            Términos de Servicio
          </Link>{" "}
          y el{" "}
          <Link
            href="/privacy"
            className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
          >
            Aviso de Privacidad
          </Link>
          .
        </p>

        {/* Navigation Switch to Candidate Registration */}
        <div className="flex flex-col items-center gap-2 pt-3 border-t border-border/80 w-full text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <User className="size-3.5 text-muted-foreground" />
            <span>¿Buscas empleo en el Sureste?</span>
            <Link
              href="/register/candidate"
              className="text-foreground font-semibold hover:text-primary underline ml-0.5 transition-colors"
            >
              Regístrate como Candidato
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
