"use client";

import React from "react";
import { Eye, EyeOff, Loader2, Building2, Mail, Lock } from "lucide-react";
import Link from "next/link";

import { useCompanyRegisterForm } from "../hooks/use-company-register-form";
import { FormTextField } from "@/components/form";

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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex flex-col items-center gap-3.5"
      noValidate
    >
      <h2 className="text-[26px] font-extrabold text-[#2f3c4b] dark:text-zinc-50 tracking-[-1px] text-center mt-2 sm:mt-0 mb-1">
        Registro de Empresa
      </h2>

      {/* Company Name */}
      <FormTextField
        id="full_name"
        label="Nombre de la Empresa"
        hintText="TechCorp Inc."
        type="text"
        required
        registerProps={register("full_name")}
        error={errors.full_name?.message}
        prefixIcon={<Building2 className="size-4.5" />}
      />

      {/* Corporate Email */}
      <FormTextField
        id="email"
        label="Email Corporativo"
        hintText="contacto@empresa.com"
        type="email"
        required
        registerProps={register("email")}
        error={errors.email?.message}
        prefixIcon={<Mail className="size-4.5" />}
      />

      {/* Password */}
      <FormTextField
        id="password"
        label="Contraseña"
        hintText="••••••••"
        type={showPassword ? "text" : "password"}
        required
        registerProps={register("password")}
        error={errors.password?.message}
        prefixIcon={<Lock className="size-4.5" />}
        suffixIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-[#7d99b3] dark:text-zinc-500 hover:text-[#1f2732] dark:hover:text-zinc-300 transition-colors p-1 cursor-pointer"
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? (
              <EyeOff className="size-4.5" />
            ) : (
              <Eye className="size-4.5" />
            )}
          </button>
        }
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-[54px] mt-2 rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-[15px] sm:text-[16px] tracking-[-0.2px] shadow-md shadow-[#1f2732]/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin text-white/80" />
            <span>Creando cuenta...</span>
          </>
        ) : (
          <span>Crear Cuenta de Empresa</span>
        )}
      </button>

      {/* Navigation Link to Login */}
      <div className="mt-2 text-center">
        <span className="text-[#5c7c9b] dark:text-zinc-400 text-[14px] font-medium">
          ¿Ya tienes una cuenta?{" "}
        </span>
        <Link
          href="/login"
          className="text-[#1f2732] dark:text-zinc-100 font-bold text-[14px] hover:underline transition-colors"
        >
          Inicia Sesión
        </Link>
      </div>
    </form>
  );
}
