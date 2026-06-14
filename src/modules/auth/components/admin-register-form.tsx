"use client";

import * as React from "react";
import { Eye, EyeOff, ArrowRight, ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field";

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
  } = useAdminRegisterForm();

  return (
    <main className="flex flex-col min-h-screen w-full items-center justify-center bg-background font-sans p-6 md:p-12 transition-colors duration-300">
      <div className="w-full max-w-[480px] flex flex-col gap-8">
        
        <Link href="/register" className="flex items-center gap-2 text-[14px] font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          Volver a opciones
        </Link>

        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[12px] font-medium w-fit mb-1 animate-pulse">
            <ShieldAlert className="h-3.5 w-3.5" />
            Acceso Temporal de Administrador
          </div>
          <h1 className="text-[32px] font-medium text-foreground tracking-[-0.32px] leading-[1.19]">
            Registro de Administrador
          </h1>
          <p className="text-[16px] text-muted-foreground tracking-[0.24px] leading-[1.5]">
            Configure una cuenta de administración para supervisar y moderar la plataforma.
          </p>
        </header>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)} method="POST" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Nombre Completo</Label>
            <Input
              id="fullName"
              placeholder="Juan Pérez"
              {...register("fullName")}
              className="h-[56px] px-4 text-[16px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && <FieldError errors={[errors.fullName]} />}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Correo Electrónico</Label>
            <Input
              id="email"
              placeholder="admin@kanpro.com"
              type="email"
              {...register("email")}
              className="h-[56px] px-4 text-[16px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
              aria-invalid={!!errors.email}
            />
            {errors.email && <FieldError errors={[errors.email]} />}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-[16px] font-semibold text-foreground tracking-[0.16px]">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="w-full h-[56px] px-4 pr-12 text-[16px] rounded-[12px] focus-visible:ring-primary/20 transition-all"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <FieldError errors={[errors.password]} />}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-[48px] w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-[16px] font-semibold tracking-[0.24px] transition-all mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? "Registrando Administrador..." : "Registrar Administrador"}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </form>

        <p className="text-[14px] text-muted-foreground text-center mt-2 font-normal">
          ¿Ya tienes una cuenta?
          <Link href="/" className="text-[16px] font-bold text-primary hover:underline ml-1.5 transition-colors tracking-[0.24px]">
            Iniciar Sesión
          </Link>
        </p>

      </div>
    </main>
  );
}
