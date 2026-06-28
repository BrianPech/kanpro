"use client";

import * as React from "react";
import { Eye, EyeOff, ArrowRight, ArrowLeft, ShieldAlert, User, Mail, Lock, Kanban } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";

import { useAdminRegisterForm } from "../hooks/use-admin-register-form";

export function AdminRegisterForm() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    onSubmit,
    trigger,
  } = useAdminRegisterForm();

  const [step, setStep] = React.useState(0);

  const handleNextStep = async (e: React.MouseEvent) => {
    e.preventDefault();
    const isValid = await trigger(["fullName", "email"]);
    if (isValid) {
      setStep(1);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative bg-background overflow-hidden box-border font-sans">
      
      {/* Ambient background glows (matching hero section) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/5" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/5 blur-[120px] dark:bg-amber-500/2.5" />
      </div>

      {/* Floating Card */}
      <div className="relative w-full max-w-[460px] bg-card border border-border/80 dark:border-border/10 rounded-[28px] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] z-10 flex flex-col gap-6">
        
        {/* Back Link */}
        {step === 0 ? (
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 group w-fit"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Volver a opciones
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setStep(0)}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 group w-fit cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Volver al paso anterior
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="size-14 rounded-[18px] bg-card border border-border/85 dark:border-border/10 shadow-sm flex items-center justify-center text-primary mb-3 transition-transform hover:scale-105 duration-300">
            <Kanban className="size-6.5 fill-primary/5" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-[-0.03em] leading-tight">
            Registro de Administrador
          </h2>

          <div className="flex items-center justify-center gap-2 mt-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-semibold uppercase tracking-wider animate-pulse">
              <ShieldAlert className="h-3.5 w-3.5" />
              Acceso Temporal
            </div>
            {/* Step Pagination dots */}
            <div className="flex items-center gap-1">
              <div className={cn("h-1.5 rounded-full transition-all duration-300", step === 0 ? "w-4 bg-primary" : "w-1.5 bg-border")} />
              <div className={cn("h-1.5 rounded-full transition-all duration-300", step === 1 ? "w-4 bg-primary" : "w-1.5 bg-border")} />
            </div>
          </div>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-4.5" onSubmit={handleSubmit(onSubmit)} method="POST" noValidate>
          
          {/* STEP 1: Identification */}
          {step === 0 && (
            <div className="flex flex-col gap-4.5 animate-in fade-in duration-300">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullName" className="text-[12.5px] font-semibold text-foreground/85">
                  Nombre Completo
                </label>
                <div className="relative group/input">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within/input:text-primary transition-colors duration-200" />
                  <Input
                    id="fullName"
                    placeholder="Juan Pérez"
                    {...register("fullName")}
                    className="h-[48px] pl-11 pr-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-[12px] text-[14px] font-medium placeholder:text-muted-foreground/50 transition-all duration-200"
                    aria-invalid={!!errors.fullName}
                  />
                </div>
                {errors.fullName && <FieldError errors={[errors.fullName]} />}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[12.5px] font-semibold text-foreground/85">
                  Correo Electrónico
                </label>
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within/input:text-primary transition-colors duration-200" />
                  <Input
                    id="email"
                    placeholder="admin@kanpro.com"
                    type="email"
                    {...register("email")}
                    className="h-[48px] pl-11 pr-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-[12px] text-[14px] font-medium placeholder:text-muted-foreground/50 transition-all duration-200"
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && <FieldError errors={[errors.email]} />}
              </div>

              {/* Siguiente Button */}
              <Button
                type="button"
                onClick={handleNextStep}
                className="h-[48px] w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-[14px] shadow-md shadow-primary/10 tracking-[0.2px] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 border-0"
              >
                Siguiente
                <ArrowRight className="h-4.5 w-4.5" />
              </Button>
            </div>
          )}

          {/* STEP 2: Password */}
          {step === 1 && (
            <div className="flex flex-col gap-4.5 animate-in fade-in duration-300">
              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-[12.5px] font-semibold text-foreground/85">
                  Contraseña
                </label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within/input:text-primary transition-colors duration-200" />
                  <Input
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="w-full h-[48px] pl-11 pr-11 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-[12px] text-[14px] font-medium placeholder:text-muted-foreground/50 transition-all duration-200"
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.password && <FieldError errors={[errors.password]} />}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-[48px] w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-[14px] shadow-md shadow-primary/10 tracking-[0.2px] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 active:scale-[0.98] disabled:opacity-50 border-0"
              >
                {isSubmitting ? "Registrando Administrador..." : "Registrar Administrador"}
                <ArrowRight className="h-4.5 w-4.5" />
              </Button>
            </div>
          )}

        </form>

        {/* Footer */}
        <footer className="pt-2 mt-1 w-full border-t border-border/60 dark:border-border/10 flex flex-col gap-3 items-center">
          <p className="text-[13px] text-muted-foreground font-medium">
            ¿Ya tienes una cuenta?{" "}
            <Link 
              href="/login" 
              className="text-primary font-bold hover:underline ml-0.5 transition-colors tracking-[0.1px]"
            >
              Inicia Sesión
            </Link>
          </p>

          <p className="text-[11px] text-muted-foreground text-center font-medium leading-relaxed max-w-[340px] mx-auto border-t border-border/40 dark:border-border/5 pt-3 w-full">
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
