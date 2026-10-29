"use client";

import React from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* ── Form Header ── */}
      <div className="flex flex-col items-center text-center gap-1.5 w-full">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          ¡Bienvenido de nuevo!
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
          Ingresa tus credenciales para acceder a tu cuenta de K&apos;anPro.
        </p>
      </div>

      {/* ── Form: Email & Password Only ── */}
      <form
        method="post"
        action="#"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        className="space-y-4 w-full"
        noValidate
      >
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold text-foreground">
            Correo electrónico
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="ej. tu.correo@ejemplo.com"
              autoComplete="email"
              className="h-11 pl-10 rounded-xl bg-card border-input text-foreground placeholder:text-muted-foreground text-xs sm:text-sm shadow-2xs focus-visible:ring-2 focus-visible:ring-ring/30"
              {...register("email")}
            />
          </div>
          {errors.email?.message && (
            <p className="text-xs font-semibold text-destructive mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-bold text-foreground">
              Contraseña
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-11 pl-10 pr-10 rounded-xl bg-card border-input text-foreground placeholder:text-muted-foreground text-xs sm:text-sm shadow-2xs focus-visible:ring-2 focus-visible:ring-ring/30"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password?.message && (
            <p className="text-xs font-semibold text-destructive mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 mt-2 rounded-xl text-sm sm:text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer gap-2 transition-all duration-150"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Iniciando sesión...</span>
            </>
          ) : (
            <>
              <span>Iniciar Sesión</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
