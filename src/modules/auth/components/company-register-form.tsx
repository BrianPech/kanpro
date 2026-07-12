"use client";

import React from "react";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Building, Mail, Lock, Kanban } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import { useCompanyRegisterForm } from "../hooks/use-company-register-form";

export function CompanyRegisterForm() {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    setShowPassword,
    onSubmit,
  } = useCompanyRegisterForm();

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative bg-zinc-50 dark:bg-zinc-950 overflow-hidden box-border font-sans">
      
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-500/5 blur-[120px] dark:bg-zinc-500/2.5" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-zinc-500/5 blur-[120px] dark:bg-zinc-500/2.5" />
      </div>

      {/* Floating Card */}
      <div className="relative w-full max-w-[460px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-8 sm:p-10 shadow-sm z-10 flex flex-col gap-6">
        
        {/* Back Link */}
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group w-fit"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver a opciones
        </Link>

        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="size-14 rounded-[18px] bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 transition-transform hover:scale-105 duration-300">
            <Kanban className="size-6.5 fill-blue-500/5" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-[-0.03em] leading-tight">
            Registro de Empresa
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2.5">
            <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Empresa
            </div>
          </div>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-4.5" onSubmit={handleSubmit(onSubmit)} method="POST" noValidate>
          
          <div className="flex flex-col gap-4.5 animate-in fade-in duration-300">
            {/* Company Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="full_name" className="text-[12.5px] font-bold text-zinc-700 dark:text-zinc-300">
                Nombre de la Empresa
              </label>
              <div className="relative group/input">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-zinc-400 group-focus-within/input:text-blue-600 dark:group-focus-within/input:text-blue-400 transition-colors duration-200" />
                <Input
                  id="full_name"
                  placeholder="TechCorp Inc."
                  {...register("full_name")}
                  className="h-[48px] pl-11 pr-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 rounded-xl text-[14px] font-semibold placeholder:text-zinc-400/80 transition-all duration-200"
                  aria-invalid={!!errors.full_name}
                />
              </div>
              {errors.full_name && <FieldError errors={[errors.full_name]} />}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[12.5px] font-bold text-zinc-700 dark:text-zinc-300">
                Email Corporativo
              </label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-zinc-400 group-focus-within/input:text-blue-600 dark:group-focus-within/input:text-blue-400 transition-colors duration-200" />
                <Input
                  id="email"
                  placeholder="contacto@empresa.com"
                  type="email"
                  {...register("email")}
                  className="h-[48px] pl-11 pr-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 rounded-xl text-[14px] font-semibold placeholder:text-zinc-400/80 transition-all duration-200"
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && <FieldError errors={[errors.email]} />}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[12.5px] font-bold text-zinc-700 dark:text-zinc-300">
                Contraseña
              </label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-zinc-400 group-focus-within/input:text-blue-600 dark:group-focus-within/input:text-blue-400 transition-colors duration-200" />
                <Input
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="w-full h-[48px] pl-11 pr-11 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 rounded-xl text-[14px] font-semibold placeholder:text-zinc-400/80 transition-all duration-200"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer p-1"
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
              className="h-[48px] w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 active:scale-[0.98] disabled:opacity-50 border-0 shadow-sm shadow-blue-500/10 hover:shadow-blue-500/20"
            >
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
              <ArrowRight className="h-4.5 w-4.5" />
            </Button>
          </div>

        </form>

        {/* Footer */}
        <footer className="pt-2 mt-1 w-full border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-3 items-center">
          <p className="text-[13px] text-zinc-500 font-medium">
            ¿Ya tienes una cuenta?{" "}
            <Link 
              href="/login" 
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-0.5 transition-colors tracking-[0.1px]"
            >
              Inicia Sesión
            </Link>
          </p>

          <p className="text-[11px] text-zinc-500 text-center font-medium leading-relaxed max-w-[340px] mx-auto border-t border-zinc-200/30 dark:border-zinc-800/30 pt-3 w-full">
            Al continuar, aceptas nuestros{" "}
            <a className="underline hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors" href="#">
              Términos de Servicio
            </a>{" "}
            y{" "}
            <a className="underline hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors" href="#">
              Política de Privacidad
            </a>
            .
          </p>
        </footer>

      </div>
    </main>
  );
}
