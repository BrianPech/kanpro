"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Eye, EyeOff, Loader2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompanyRegisterForm } from "../hooks/use-company-register-form";

export function CompanyRegisterForm() {
  const {
    credentialsRegister,
    credentialsErrors,
    isSubmitting,
    showPassword,
    setShowPassword,
    handleRegisterSubmit,
  } = useCompanyRegisterForm();

  return (
    <div className="w-full max-w-[432px] flex flex-col gap-6">
      {/* Encabezado del registro */}
      <div className="flex flex-col items-center text-center gap-2">
        <h1 className="text-[28px] sm:text-[32px] font-semibold leading-[40px] tracking-[-0.8px] text-foreground">
          Crea tu cuenta de empresa
        </h1>
        <p className="text-[16px] font-normal leading-[24px] text-muted-foreground">
          Ingresa tu correo y crea una contraseña.
        </p>
      </div>

      {/* Formulario */}
      <form
        onSubmit={handleRegisterSubmit}
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
              placeholder="nombre@empresa.mx"
              autoComplete="email"
              aria-invalid={Boolean(credentialsErrors.email)}
              className="h-[52px] rounded-[8px] border-input bg-card px-[14px] text-[16px] leading-[24px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
              {...credentialsRegister("email")}
            />
            {credentialsErrors.email?.message ? (
              <p className="text-xs font-semibold text-destructive">
                {credentialsErrors.email.message}
              </p>
            ) : (
              <p className="text-[14px] font-normal leading-[20px] text-muted-foreground">
                Usa el correo del dueño de la empresa o un correo corporativo.
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
                placeholder="Crea una contraseña"
                autoComplete="new-password"
                aria-invalid={Boolean(credentialsErrors.password)}
                className="h-[52px] rounded-[8px] border-input bg-card pl-[14px] pr-[52px] text-[16px] leading-[24px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
                {...credentialsRegister("password")}
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
            {credentialsErrors.password?.message ? (
              <p className="text-xs font-semibold text-destructive">
                {credentialsErrors.password.message}
              </p>
            ) : (
              <p className="text-[14px] font-normal leading-[20px] text-muted-foreground">
                Mínimo 8 caracteres, una mayúscula y un número.
              </p>
            )}
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
              <span>Creando cuenta...</span>
            </>
          ) : (
            <span>Continuar</span>
          )}
        </Button>

        {/* Volver a elegir perfil */}
        <Link
          href="/register"
          className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 text-[14px] font-semibold leading-[20px] text-link hover:underline underline-offset-4 transition-colors"
        >
          <ChevronLeft className="size-4 shrink-0" />
          <span>Volver a elegir perfil</span>
        </Link>
      </form>
    </div>
  );
}
