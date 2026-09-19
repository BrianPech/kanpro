"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock, Phone, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
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

  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      setIsSocialSubmitting(true);
      const supabase = createClient();
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || "";

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      console.error("Error en autenticación social:", err);
      const msg = err instanceof Error ? err.message : "No se pudo conectar con el proveedor";
      toast.error("Error al iniciar sesión con redes", { description: msg });
    } finally {
      setIsSocialSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col lg:grid lg:grid-cols-12 font-sans selection:bg-primary/20 p-2 sm:p-3 lg:p-4 gap-4 overflow-x-hidden">
      {/* ── LEFT COLUMN: Exact Landing Page Signature Gradient & Warm Cream Wash ── */}
      <div className="lg:col-span-6 xl:col-span-7 relative overflow-hidden bg-[#faf8f2] text-foreground rounded-3xl lg:rounded-[32px] p-6 sm:p-10 lg:p-14 xl:p-16 flex flex-col justify-between min-h-[500px] lg:min-h-0 lg:h-[calc(100vh-2rem)] border border-border/80 shadow-sm">
        {/* Exact Landing Page Layer 1 */}
        <div
          className="pointer-events-none absolute inset-0 blur-[90px] md:blur-[130px]"
          style={{
            background:
              "linear-gradient(rgba(0,0,0,0) 0%, rgba(200,230,255,0.12) 28%, rgb(255,255,255) 18%, rgb(150,200,255) 68%, rgb(100,130,200) 100%)",
            mixBlendMode: "multiply",
          }}
          aria-hidden="true"
        />
        {/* Exact Landing Page Layer 2 */}
        <div
          className="pointer-events-none absolute inset-0 blur-[90px] md:blur-[130px]"
          style={{
            background:
              "linear-gradient(rgba(0,0,0,0) 0%, rgba(200,230,255,0.22) 34%, rgb(255,255,255) 66%, rgb(150,200,255) 82%, rgb(100,130,200) 100%)",
            mixBlendMode: "multiply",
          }}
          aria-hidden="true"
        />

        {/* Top: Back to Landing Page Button + Brand Logo */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-white/80 dark:border-zinc-800 text-foreground text-xs font-bold shadow-2xs hover:bg-white dark:hover:bg-zinc-900 transition-all group"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Volver al inicio</span>
          </Link>

          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="size-8 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
              K&apos;
            </div>
            <span className="font-black text-base tracking-tight text-foreground">K&apos;anPro</span>
          </Link>
        </div>

        {/* Middle: Main Copy */}
        <div className="relative z-10 my-auto py-8 max-w-lg space-y-3.5">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
            Comienza con Nosotros
          </h1>
          <p className="text-sm sm:text-base text-foreground/80 font-medium leading-relaxed">
            Accede a las mejores vacantes verificadas en el Sureste de México con transparencia salarial, prestaciones de ley y cálculo de cercanía geográfica.
          </p>
        </div>

        {/* Bottom: 3 Step Visual Cards with refined Glassmorphism */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
          {/* Card 1: Active / Frosted Highlighted Glass */}
          <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-white dark:border-zinc-700/80 text-foreground rounded-2xl p-4 flex flex-col justify-between min-h-[115px] shadow-lg shadow-black/5">
            <div className="size-6 rounded-full bg-foreground text-background font-black text-xs flex items-center justify-center shadow-xs">
              1
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Paso 1</span>
              <span className="font-extrabold text-xs sm:text-sm text-foreground leading-snug block mt-0.5">Inicia sesión en tu cuenta</span>
            </div>
          </div>

          {/* Card 2: Translucent Frosted Glass */}
          <div className="bg-white/45 dark:bg-white/10 backdrop-blur-xl border border-white/60 dark:border-white/15 text-foreground rounded-2xl p-4 flex flex-col justify-between min-h-[115px] shadow-2xs">
            <div className="size-6 rounded-full bg-foreground/10 text-foreground font-black text-xs flex items-center justify-center">
              2
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/60 block">Paso 2</span>
              <span className="font-bold text-xs sm:text-sm text-foreground/90 leading-snug block mt-0.5">Explora vacantes cercanas</span>
            </div>
          </div>

          {/* Card 3: Translucent Frosted Glass */}
          <div className="bg-white/45 dark:bg-white/10 backdrop-blur-xl border border-white/60 dark:border-white/15 text-foreground rounded-2xl p-4 flex flex-col justify-between min-h-[115px] shadow-2xs">
            <div className="size-6 rounded-full bg-foreground/10 text-foreground font-black text-xs flex items-center justify-center">
              3
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/60 block">Paso 3</span>
              <span className="font-bold text-xs sm:text-sm text-foreground/90 leading-snug block mt-0.5">Postúlate al instante</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: shadcn/ui Login Form with strict theme tokens ── */}
      <div className="lg:col-span-6 xl:col-span-5 p-6 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-center lg:h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-6">
          
          {/* Form Header */}
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Iniciar Sesión
            </h2>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              Ingresa tus credenciales para acceder a tu cuenta.
            </p>
          </div>

          {/* Fast Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin("google")}
              disabled={isSocialSubmitting}
              className="h-11 rounded-2xl border-border bg-card text-foreground hover:bg-muted text-xs sm:text-sm font-semibold gap-2 cursor-pointer shadow-2xs"
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 11.3 0 14s.7 5.3 1.9 7.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              Google
            </Button>

            <Link href="/phone-login" className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-2xl border-border bg-card text-foreground hover:bg-muted text-xs sm:text-sm font-semibold gap-2 cursor-pointer shadow-2xs"
              >
                <Phone className="size-4 text-muted-foreground" />
                Teléfono
              </Button>
            </Link>
          </div>

          {/* Separator */}
          <div className="relative my-4">
            <Separator className="bg-border" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground font-bold uppercase tracking-wider">
              O
            </span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            
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
                  className="h-11 pl-10 rounded-2xl bg-card border-input text-foreground placeholder:text-muted-foreground text-xs sm:text-sm shadow-2xs focus-visible:ring-2 focus-visible:ring-ring/30"
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
                  className="h-11 pl-10 pr-10 rounded-2xl bg-card border-input text-foreground placeholder:text-muted-foreground text-xs sm:text-sm shadow-2xs focus-visible:ring-2 focus-visible:ring-ring/30"
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
              className="w-full h-11 mt-2 rounded-2xl text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer gap-2 transition-all duration-150"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="pt-2 text-center text-xs text-muted-foreground font-medium">
            <span>¿No tienes una cuenta? </span>
            <Link href="/register" className="font-bold text-foreground hover:underline ml-1">
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
