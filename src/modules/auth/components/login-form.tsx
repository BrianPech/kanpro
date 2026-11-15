"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginForm } from "../hooks/use-login-form";

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
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="w-full max-w-[432px] flex flex-col gap-6">
      {/* Encabezado de acceso */}
      <div className="flex flex-col items-center text-center">
        <h1 className="text-[28px] sm:text-[32px] font-semibold leading-[40px] tracking-[-0.8px] text-foreground">
          Inicia sesión en Kanpro
        </h1>
      </div>

      {/* Formulario */}
      <form
        method="post"
        action="#"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        className="flex flex-col gap-6 w-full"
        noValidate
      >
        <div className="flex flex-col gap-5 w-full">
          {/* Correo electrónico */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="email"
              className="text-[14px] font-semibold leading-[20px] text-foreground"
            >
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className="h-[52px] rounded-[8px] border-input bg-card px-[14px] text-[16px] leading-[24px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
              {...register("email")}
            />
            {errors.email?.message && (
              <p className="text-xs font-semibold text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="password"
              className="text-[14px] font-semibold leading-[20px] text-foreground"
            >
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                className="h-[52px] rounded-[8px] border-input bg-card pl-[14px] pr-[52px] text-[16px] leading-[24px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-1 top-1/2 -translate-y-1/2 size-[44px] flex items-center justify-center text-foreground/80 hover:text-foreground transition-colors cursor-pointer rounded-[6px]"
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            {errors.password?.message && (
              <p className="text-xs font-semibold text-destructive">
                {errors.password.message}
              </p>
            )}

            {/* Preferencia de sesión y recuperación */}
            <div className="min-h-[36px] flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <label
                htmlFor="remember-me"
                className="inline-flex items-center gap-2 cursor-pointer select-none"
              >
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                  className="size-[18px] rounded-[4px] border-input bg-card dark:bg-card"
                />
                <span className="text-[14px] font-medium leading-[20px] text-foreground">
                  Mantener mi sesión iniciada
                </span>
              </label>

              <Link
                href="/forgot-password"
                className="text-[14px] font-medium leading-[20px] text-link hover:underline underline-offset-4 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
        </div>

        {/* Botón principal */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[43px] rounded-[8px] bg-primary text-primary-foreground hover:bg-primary-hover text-[14px] font-semibold leading-[19px] cursor-pointer gap-2 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Iniciando sesión...</span>
            </>
          ) : (
            <span>Iniciar sesión</span>
          )}
        </Button>

        {/* Enlace al registro */}
        <div className="min-h-[32px] flex items-center justify-center gap-2 text-[14px] leading-[20px]">
          <span className="text-muted-foreground font-normal">
            ¿Todavía no tienes cuenta?
          </span>
          <Link
            href="/register"
            className="font-semibold text-link hover:underline underline-offset-4 transition-colors"
          >
            Crea una cuenta
          </Link>
        </div>
      </form>
    </div>
  );
}
