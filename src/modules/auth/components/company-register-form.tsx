"use client";

import React from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  Check,
  Circle,
  User,
} from "@/components/ui/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormTextField } from "@/components/form";
import { useCompanyRegisterForm } from "../hooks/use-company-register-form";
import { cn } from "@/lib/utils";

export function CompanyRegisterForm() {
  const {
    credentialsRegister,
    credentialsErrors,
    isSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordCriteria,
    passwordsMatch,
    handleRegisterSubmit,
  } = useCompanyRegisterForm();

  return (
    <div className="w-full flex flex-col items-center gap-5 select-none">
      {/* ── Brand Header (Título + Subtítulo con link) ── */}
      <div className="flex flex-col items-center text-center gap-1.5 w-full">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Registro de Empresa
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/login"
            className="text-foreground font-semibold underline underline-offset-4 hover:text-primary transition-colors"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>

      <form
        onSubmit={handleRegisterSubmit}
        className="w-full flex flex-col items-center gap-3.5"
        noValidate
      >
        {/* Correo Corporativo */}
        <div className="w-full space-y-1">
          <FormTextField
            id="email"
            label="Email Corporativo"
            hintText="contacto@empresa.com"
            type="email"
            required
            registerProps={credentialsRegister("email")}
            error={credentialsErrors.email?.message}
            prefixIcon={<Mail className="size-4" />}
          />
        </div>

        {/* Contraseña Segura */}
        <div className="w-full space-y-1.5">
          <FormTextField
            id="password"
            label="Contraseña"
            hintText="••••••••"
            type={showPassword ? "text" : "password"}
            required
            registerProps={credentialsRegister("password")}
            error={credentialsErrors.password?.message}
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
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 px-0.5 text-[11px] select-none">
            <span
              className={cn(
                "flex items-center gap-1 transition-colors",
                passwordCriteria.hasMinLength
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground"
              )}
            >
              {passwordCriteria.hasMinLength ? (
                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="size-2 text-muted-foreground/60 fill-current" />
              )}
              Mínimo 8 caracteres
            </span>

            <span
              className={cn(
                "flex items-center gap-1 transition-colors",
                passwordCriteria.hasUppercase
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground"
              )}
            >
              {passwordCriteria.hasUppercase ? (
                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="size-2 text-muted-foreground/60 fill-current" />
              )}
              1 mayúscula
            </span>

            <span
              className={cn(
                "flex items-center gap-1 transition-colors",
                passwordCriteria.hasNumber
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground"
              )}
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

        {/* Confirmar Contraseña */}
        <div className="w-full space-y-1">
          <FormTextField
            id="confirmPassword"
            label="Confirmar contraseña"
            hintText="••••••••"
            type={showConfirmPassword ? "text" : "password"}
            required
            registerProps={credentialsRegister("confirmPassword")}
            error={credentialsErrors.confirmPassword?.message}
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
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            }
          />
          {!passwordsMatch && (
            <p className="text-[11px] text-destructive px-0.5">
              Las contraseñas deben ser idénticas.
            </p>
          )}
        </div>

        {/* Botón Principal (Create Account) */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 mt-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin text-primary-foreground/80" />
              <span>Creando cuenta de empresa...</span>
            </>
          ) : (
            <>
              <span>Crear Cuenta</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        {/* Aviso Legal */}
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-1 mt-1">
          Al continuar, aceptas nuestros{" "}
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

        {/* Enlace alternativo para candidatos */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-border/60 w-full text-center">
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
