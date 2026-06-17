"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useCandidateRegisterForm } from "../hooks/use-candidate-register-form";

// Custom Facebook Icon SVG
const FacebookIcon = () => (
  <svg className="h-4.5 w-4.5 fill-[#1877F2] text-[#1877F2] shrink-0" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// Custom Google Icon SVG
const GoogleIcon = () => (
  <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#EA4335"
      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 14.99 1 12 1 7.24 1 3.2 3.73 1.24 7.7l3.96 3.07C6.18 7.55 8.84 5.04 12 5.04z"
    />
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.57v2.96h3.87c2.26-2.08 3.56-5.14 3.56-8.68z"
    />
    <path
      fill="#FBBC05"
      d="M5.2 10.77c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27L1.24 3.16C.45 4.74 0 6.51 0 8.5s.45 3.76 1.24 5.34l3.96-3.07z"
    />
    <path
      fill="#34A853"
      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.87-2.96c-1.08.72-2.47 1.16-4.09 1.16-3.16 0-5.82-2.51-6.8-5.73L1.24 13.62C3.2 17.58 7.24 23 12 23z"
    />
  </svg>
);

export function CandidateRegisterForm() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    onSubmit,
  } = useCandidateRegisterForm();

  const [passwordValue, setPasswordValue] = React.useState("");

  const getPasswordStrength = (val: string) => {
    if (!val) return 0;
    let score = 0;
    if (val.length >= 8) score += 1;
    if (/\d/.test(val) || /[^A-Za-z0-9]/.test(val)) score += 1;
    if (/[A-Z]/.test(val)) score += 1;
    return score;
  };

  const strengthScore = getPasswordStrength(passwordValue);

  const getStrengthLabel = (score: number) => {
    if (score === 0) return "Muy Débil";
    if (score === 1) return "Débil";
    if (score === 2) return "Media";
    return "Fuerte";
  };

  const getStrengthColor = (score: number) => {
    if (score === 1) return "text-rose-500 dark:text-rose-400";
    if (score === 2) return "text-amber-500 dark:text-amber-400";
    if (score === 3) return "text-emerald-500 dark:text-emerald-400";
    return "text-muted-foreground";
  };

  const getStrengthBg = (score: number) => {
    if (score === 1) return "bg-rose-500";
    if (score === 2) return "bg-amber-500";
    if (score === 3) return "bg-emerald-500";
    return "bg-zinc-200 dark:bg-zinc-800";
  };

  const passwordRegister = register("password");

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 relative overflow-hidden transition-colors duration-300 bg-background">

      {/* Embedded Style Block for animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Floating Glass Console Container */}
      <div className="w-full max-w-[540px] z-10 animate-fade-in-up">
        <div className="animate-float backdrop-blur-xl bg-white/75 dark:bg-zinc-950/60 border border-zinc-200/50 dark:border-zinc-800/40 rounded-[28px] p-6 md:p-10 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] transition-all duration-300">
          
          {/* Back button */}
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 group mb-6"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Volver a opciones
          </Link>

          {/* Header */}
          <header className="flex flex-col gap-1 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-[20px] font-bold tracking-tighter text-foreground">
                K&apos;anPro
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded-full uppercase tracking-wider">
                Candidato
              </span>
            </div>
            <h1 className="text-[28px] md:text-[32px] font-bold text-foreground tracking-[-0.03em] leading-tight mt-2">
              Crea tu cuenta profesional
            </h1>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              Descubre oportunidades, postula a vacantes y potencia tu carrera.
            </p>
          </header>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              className="flex items-center justify-center gap-2.5 h-[48px] rounded-[12px] border border-zinc-200/60 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/30 hover:bg-white/80 dark:hover:bg-zinc-900/60 text-[14px] font-semibold text-foreground transition-all active:scale-[0.98] cursor-pointer"
            >
              <GoogleIcon />
              <span>Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2.5 h-[48px] rounded-[12px] border border-zinc-200/60 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/30 hover:bg-white/80 dark:hover:bg-zinc-900/60 text-[14px] font-semibold text-foreground transition-all active:scale-[0.98] cursor-pointer"
            >
              <FacebookIcon />
              <span>Facebook</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-zinc-200/50 dark:border-zinc-800/30"></div>
            <span className="flex-shrink mx-4 text-zinc-400 dark:text-zinc-500 text-[11px] font-bold uppercase tracking-wider">o continuar con correo</span>
            <div className="flex-grow border-t border-zinc-200/50 dark:border-zinc-800/30"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground/80" htmlFor="fullName">
                Nombre completo
              </label>
              <div className="relative group/input">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within/input:text-primary transition-colors duration-200" />
                <Input
                  id="fullName"
                  placeholder="Ej. Carlos Mendoza"
                  {...register("fullName")}
                  className="h-[50px] pl-11 pr-4 bg-zinc-100/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/50 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-[12px] text-[14px] font-medium placeholder:text-muted-foreground/50 transition-all duration-200"
                />
              </div>
              {errors.fullName && <FieldError errors={[errors.fullName]} />}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground/80" htmlFor="email">
                Correo electrónico
              </label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within/input:text-primary transition-colors duration-200" />
                <Input
                  id="email"
                  placeholder="nombre@correo.com"
                  type="email"
                  {...register("email")}
                  className="h-[50px] pl-11 pr-4 bg-zinc-100/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/50 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-[12px] text-[14px] font-medium placeholder:text-muted-foreground/50 transition-all duration-200"
                />
              </div>
              {errors.email && <FieldError errors={[errors.email]} />}
            </div>

            {/* Passwords Grid (Row on md+) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground/80" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within/input:text-primary transition-colors duration-200" />
                  <Input
                    id="password"
                    placeholder="Mínimo 8 caracteres"
                    type={showPassword ? "text" : "password"}
                    {...passwordRegister}
                    onChange={(e) => {
                      passwordRegister.onChange(e);
                      setPasswordValue(e.target.value);
                    }}
                    className="h-[50px] pl-11 pr-11 bg-zinc-100/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/50 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-[12px] text-[14px] font-medium placeholder:text-muted-foreground/50 transition-all duration-200"
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

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground/80" htmlFor="confirmPassword">
                  Confirmar contraseña
                </label>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within/input:text-primary transition-colors duration-200" />
                  <Input
                    id="confirmPassword"
                    placeholder="Repetir contraseña"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    className="h-[50px] pl-11 pr-11 bg-zinc-100/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/50 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-[12px] text-[14px] font-medium placeholder:text-muted-foreground/50 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.confirmPassword && <FieldError errors={[errors.confirmPassword]} />}
              </div>
            </div>

            {/* Password strength indicator */}
            {passwordValue.length > 0 && (
              <div className="flex flex-col gap-2 mt-1 p-3 rounded-[12px] bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/30 dark:border-zinc-800/20">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="font-semibold text-muted-foreground">Fuerza de la contraseña:</span>
                  <span className={cn("font-bold transition-colors", getStrengthColor(strengthScore))}>
                    {getStrengthLabel(strengthScore)}
                  </span>
                </div>
                
                {/* Strength meter bar */}
                <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
                  <div className={cn("h-full rounded-full transition-all duration-300", strengthScore >= 1 ? getStrengthBg(strengthScore) : "bg-zinc-200 dark:bg-zinc-800")} />
                  <div className={cn("h-full rounded-full transition-all duration-300", strengthScore >= 2 ? getStrengthBg(strengthScore) : "bg-zinc-200 dark:bg-zinc-800")} />
                  <div className={cn("h-full rounded-full transition-all duration-300", strengthScore >= 3 ? getStrengthBg(strengthScore) : "bg-zinc-200 dark:bg-zinc-800")} />
                </div>

                {/* Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mt-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <div className={cn("h-1.5 w-1.5 rounded-full transition-all", passwordValue.length >= 8 ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700")} />
                    <span className={passwordValue.length >= 8 ? "text-emerald-500/90" : "text-muted-foreground"}>Mínimo 8 carac.</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <div className={cn("h-1.5 w-1.5 rounded-full transition-all", /\d/.test(passwordValue) || /[^A-Za-z0-9]/.test(passwordValue) ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700")} />
                    <span className={/\d/.test(passwordValue) || /[^A-Za-z0-9]/.test(passwordValue) ? "text-emerald-500/90" : "text-muted-foreground"}>Número o Símbolo</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <div className={cn("h-1.5 w-1.5 rounded-full transition-all", /[A-Z]/.test(passwordValue) ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700")} />
                    <span className={/[A-Z]/.test(passwordValue) ? "text-emerald-500/90" : "text-muted-foreground"}>Mayúscula</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-[50px] w-full rounded-[12px] bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-[15px] shadow-lg shadow-primary/15 tracking-[0.2px] transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none border-0"
            >
              {isSubmitting ? "Creando tu cuenta..." : "Crear cuenta"}
              <ArrowRight className="h-4.5 w-4.5" />
            </Button>
          </form>

          {/* Footer */}
          <footer className="mt-8 text-center text-[13px] text-muted-foreground font-medium">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/login"
              className="text-primary font-bold hover:underline transition-all tracking-[0.1px] ml-1"
            >
              Inicia Sesión
            </Link>
          </footer>

        </div>
      </div>
    </main>
  );
}

