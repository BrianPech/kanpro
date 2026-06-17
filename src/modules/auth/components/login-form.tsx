"use client";

import * as React from "react";
import { Eye, EyeOff, ArrowRight, Cloud, Shield, Mail, Lock, Server, TrendingUp } from "lucide-react";
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
    <main className="min-h-screen w-full flex bg-background font-sans overflow-hidden">
      
      {/* CSS Styles for background glow, async floating widgets, and shimmers */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes aurora {
          0%, 100% { transform: translate(0, 0) scale(1); filter: blur(80px); }
          50% { transform: translate(60px, -40px) scale(1.15); filter: blur(100px); }
        }
        @keyframes floatY1 {
          0%, 100% { transform: translateY(0) rotate(0.5deg); }
          50% { transform: translateY(-12px) rotate(-0.5deg); }
        }
        @keyframes floatY2 {
          0%, 100% { transform: translateY(0) rotate(-0.5deg); }
          50% { transform: translateY(-7px) rotate(0.5deg); }
        }
        @keyframes floatY3 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-1deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        .animate-aurora {
          animation: aurora 18s ease-in-out infinite alternate;
        }
        .animate-float-1 {
          animation: floatY1 7s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: floatY2 5.5s ease-in-out infinite;
        }
        .animate-float-3 {
          animation: floatY3 9s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite ease-in-out;
        }
        .glass-widget {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-widget:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
          transform: scale(1.02);
        }
      `}} />

      {/* Left Column: Visual Universe (Hidden on mobile) */}
      <section className="hidden lg:flex lg:w-[55%] bg-[#030303] flex-col justify-between p-12 relative overflow-hidden border-r border-zinc-800/30">
        
        {/* Animated Aurora Gradient Glows */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-primary/15 animate-aurora pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[280px] h-[280px] rounded-full bg-indigo-600/10 animate-aurora pointer-events-none" style={{ animationDelay: "-6s" }} />

        {/* Brand Header */}
        <div className="z-10 flex items-center gap-2">
          <span className="text-[22px] font-bold text-white tracking-tighter">
            K&apos;anPro
          </span>
        </div>

        {/* Narrative & Floating Glass Widgets */}
        <div className="flex-grow flex flex-col justify-center gap-12 z-10 my-auto">
          
          <div className="max-w-[450px]">
            <h1 className="text-[42px] font-bold text-white tracking-[-0.04em] leading-[1.1] mb-4">
              El control absoluto de tu ecosistema profesional.
            </h1>
            <p className="text-[15px] text-zinc-400 font-medium leading-relaxed">
              Gestión de talento, candidatos y flujos de trabajo centralizados en una consola de alto rendimiento.
            </p>
          </div>

          {/* Floating Widget Stack Area */}
          <div className="relative w-full h-[320px] max-w-[480px] mt-6">
            
            {/* Widget 1: Network Activity (Pulse & Graph) */}
            <div className="absolute top-0 left-0 w-[240px] glass-widget rounded-[16px] p-4 animate-float-1">
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Servicio Activo</span>
                </div>
                <Server className="h-3.5 w-3.5 text-zinc-500" />
              </div>
              <div className="text-[20px] font-bold text-white tracking-tight">99.98% Uptime</div>
              
              {/* Simple Sparkline SVG */}
              <div className="h-10 w-full mt-3">
                <svg className="w-full h-full" viewBox="0 0 100 40" fill="none" preserveAspectRatio="none">
                  <path
                    d="M0 35 Q15 20 30 25 T60 10 T90 28 T100 5"
                    stroke="var(--color-primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M0 35 Q15 20 30 25 T60 10 T90 28 T100 5 L100 40 L0 40 Z"
                    fill="url(#sparkline-grad)"
                    opacity="0.12"
                  />
                  <defs>
                    <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Widget 2: Candidate Profile Match (Sophia Martinez) */}
            <div className="absolute top-10 right-0 w-[260px] glass-widget rounded-[20px] p-4 animate-float-2 z-20">
              <div className="flex gap-3 items-center">
                <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-[14px] text-white">
                  SM
                </div>
                <div className="flex-grow">
                  <div className="text-[13px] font-bold text-white leading-tight">Sofía Martínez</div>
                  <div className="text-[11px] text-zinc-500 font-semibold leading-tight">Lead React Dev</div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">98% Match</span>
                </div>
              </div>
              
              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3.5">
                <span className="text-[10px] font-semibold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">React</span>
                <span className="text-[10px] font-semibold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">Next.js</span>
                <span className="text-[10px] font-semibold text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">TypeScript</span>
              </div>
            </div>

            {/* Widget 3: Recruitment Pipeline progress */}
            <div className="absolute bottom-0 left-[60px] w-[260px] glass-widget rounded-[20px] p-4.5 animate-float-3 z-10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Embudo de Candidatos</span>
                <TrendingUp className="h-3.5 w-3.5 text-zinc-500" />
              </div>
              
              {/* Progress bars */}
              <div className="flex flex-col gap-2.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-zinc-300">Entrevistas (12)</span>
                    <span className="text-zinc-500">80%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "80%" }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-zinc-300">Propuestas (4)</span>
                    <span className="text-zinc-500">45%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "45%" }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer info */}
        <div className="z-10 text-[12px] font-semibold text-zinc-600 tracking-wide uppercase">
          K&apos;anPro Console // Enterprise Cloud System
        </div>

      </section>

      {/* Right Column: Console Entry Login Form */}
      <section className="flex-1 bg-background flex items-center justify-center p-6 md:p-12 lg:p-16">
        <div className="w-full max-w-[420px] flex flex-col gap-8">
          
          <header className="flex flex-col gap-1">
            <div className="lg:hidden flex items-center gap-1.5 mb-3">
              <span className="text-[18px] font-bold tracking-tighter text-foreground">
                K&apos;anPro
              </span>
            </div>
            <h2 className="text-[28px] md:text-[32px] font-bold text-foreground tracking-[-0.03em] leading-tight">
              Bienvenido de nuevo
            </h2>
            <p className="text-[14px] text-muted-foreground mt-0.5">
              Ingresa tus credenciales para acceder a tu panel de control.
            </p>
          </header>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4.5"
            noValidate
          >
            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground/80" htmlFor="email">
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
                  className="h-[50px] pl-11 pr-4 bg-zinc-100/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/50 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-[12px] text-[14px] font-medium placeholder:text-muted-foreground/50 transition-all duration-200"
                />
              </div>
              {errors.email && <FieldError errors={[errors.email]} />}
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-[13px] font-semibold text-foreground/80" htmlFor="password">
                  Contraseña
                </label>
                <a
                  className="text-[13px] font-bold text-primary hover:underline transition-colors"
                  href="#"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within/input:text-primary transition-colors duration-200" />
                <Input
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  className="w-full h-[50px] pl-11 pr-11 bg-zinc-100/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/50 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-[12px] text-[14px] font-medium placeholder:text-muted-foreground/50 transition-all duration-200"
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
              className="h-[50px] w-full rounded-[12px] bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-[15px] shadow-lg shadow-primary/15 tracking-[0.2px] transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none border-0"
            >
              {isSubmitting ? "Autenticando..." : "Iniciar Sesión"}
              <ArrowRight className="h-4.5 w-4.5" />
            </Button>
          </form>

          {/* Alternative Actions */}
          <div className="flex flex-col gap-6 items-center mt-6">
            <div className="relative flex py-1 items-center w-full">
              <div className="flex-grow border-t border-zinc-200/50 dark:border-zinc-800/30"></div>
              <span className="flex-shrink mx-4 text-zinc-400 dark:text-zinc-500 text-[11px] font-bold uppercase tracking-wider">
                O continuar con
              </span>
              <div className="flex-grow border-t border-zinc-200/50 dark:border-zinc-800/30"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                type="button"
                className="flex items-center justify-center gap-2.5 h-[48px] rounded-[12px] border border-zinc-200/60 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/30 hover:bg-white/80 dark:hover:bg-zinc-900/60 text-[14px] font-semibold text-foreground transition-all active:scale-[0.98] cursor-pointer"
              >
                <Cloud className="h-5 w-5 text-muted-foreground/80" />
                <span>Google</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2.5 h-[48px] rounded-[12px] border border-zinc-200/60 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/30 hover:bg-white/80 dark:hover:bg-zinc-900/60 text-[14px] font-semibold text-foreground transition-all active:scale-[0.98] cursor-pointer"
              >
                <Shield className="h-5 w-5 text-muted-foreground/80" />
                <span>SSO</span>
              </button>
            </div>
            
            <p className="text-[13px] text-muted-foreground mt-2 font-medium">
              ¿No tienes una cuenta?
              <Link
                className="text-primary font-bold hover:underline ml-1 transition-colors tracking-[0.1px]"
                href="/register"
              >
                Registrarse
              </Link>
            </p>
          </div>

          {/* Legal Footer */}
          <footer className="pt-6 border-t border-zinc-200/50 dark:border-zinc-850/30 mt-6 w-full">
            <div className="flex gap-4 justify-center text-[12px] font-medium text-muted-foreground">
              <a className="hover:text-foreground transition-colors" href="#">
                Términos
              </a>
              <span>•</span>
              <a className="hover:text-foreground transition-colors" href="#">
                Privacidad
              </a>
              <span>•</span>
              <a className="hover:text-foreground transition-colors" href="#">
                Ayuda
              </a>
            </div>
          </footer>

        </div>
      </section>

    </main>
  );
}
