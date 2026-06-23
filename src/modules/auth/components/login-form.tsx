"use client";

import React from "react";
import { Eye, EyeOff, ArrowRight, Shield, Mail, Lock, Kanban } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
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
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative bg-background overflow-hidden box-border font-sans">
      
      {/* Ambient background glows (matching hero section) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/5" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/5 blur-[120px] dark:bg-amber-500/2.5" />
      </div>

      {/* Floating Card */}
      <div className="relative w-full max-w-[480px] bg-card border border-border/80 dark:border-border/10 rounded-[28px] p-8 sm:p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] z-10 flex flex-col gap-6">
        
        {/* Top Logo Icon */}
        <div className="flex flex-col items-center">
          <div className="size-14 rounded-[18px] bg-card border border-border/85 dark:border-border/10 shadow-sm flex items-center justify-center text-primary mb-4 transition-transform hover:scale-105 duration-300">
            <Kanban className="size-6.5 fill-primary/5" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-[-0.03em] leading-tight text-center">
            ¡Hola de nuevo!
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 text-center font-medium">
            ¿Primera vez aquí?{" "}
            <Link
              className="text-primary font-bold hover:underline transition-colors ml-0.5"
              href="/register"
            >
              Registrarse gratis
            </Link>
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4.5"
          noValidate
        >
          {/* Email Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-foreground/85" htmlFor="email">
              Correo electrónico
            </label>
            <div className="relative group/input">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within/input:text-primary transition-colors duration-200" />
              <Input
                id="email"
                placeholder="nombre@empresa.com"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="h-[48px] pl-11 pr-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-[12px] text-[14px] font-medium placeholder:text-muted-foreground/50 transition-all duration-200"
              />
            </div>
            {errors.email && <FieldError errors={[errors.email]} />}
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-foreground/85" htmlFor="password">
              Contraseña
            </label>
            <div className="relative group/input">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within/input:text-primary transition-colors duration-200" />
              <Input
                id="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
                className="w-full h-[48px] pl-11 pr-11 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-[12px] text-[14px] font-medium placeholder:text-muted-foreground/50 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer p-1"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5" />
                ) : (
                  <Eye className="h-4.5 w-4.5" />
                )}
              </button>
            </div>
            {errors.password && <FieldError errors={[errors.password]} />}
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-[48px] w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-[14px] shadow-md shadow-primary/10 tracking-[0.2px] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none border-0"
          >
            {isSubmitting ? "Autenticando..." : "Iniciar Sesión"}
            <ArrowRight className="h-4.5 w-4.5" />
          </Button>

          {/* Recover Password Link */}
          <div className="text-center mt-1">
            <a
              className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              href="#"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </form>

        {/* Alternative Actions */}
        <div className="flex flex-col gap-4.5 items-center">
          <div className="relative flex py-1 items-center w-full">
            <div className="flex-grow border-t border-border/80 dark:border-border/10"></div>
            <span className="flex-shrink mx-4 text-muted-foreground/80 text-[10px] font-bold uppercase tracking-wider">
              o continuar con
            </span>
            <div className="flex-grow border-t border-border/80 dark:border-border/10"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 w-full">
            {/* Google Button with custom SVG */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 h-[42px] rounded-full border border-border bg-card hover:bg-muted/50 text-[13px] font-semibold text-foreground transition-all active:scale-[0.98] cursor-pointer"
            >
              <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Google</span>
            </button>
            
            {/* SSO Button with Shield icon */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 h-[42px] rounded-full border border-border bg-card hover:bg-muted/50 text-[13px] font-semibold text-foreground transition-all active:scale-[0.98] cursor-pointer"
            >
              <Shield className="h-4 w-4 text-muted-foreground/80" />
              <span>SSO</span>
            </button>
          </div>
        </div>

        {/* Legal Footer inside Card */}
        <footer className="pt-2 mt-1 w-full border-t border-border/60 dark:border-border/10">
          <p className="text-[11px] text-muted-foreground text-center font-medium leading-relaxed max-w-[340px] mx-auto">
            Al continuar, aceptas nuestros{" "}
            <a className="underline hover:text-foreground transition-colors" href="#">
              Términos de Servicio
            </a>{" "}
            y{" "}
            <a className="underline hover:text-foreground transition-colors" href="#">
              Política de Privacidad
            </a>
            .
          </p>
        </footer>

      </div>

    </main>
  );
}
