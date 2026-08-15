"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AuthHeader } from "@/modules/auth/components/auth-header";
import { cn } from "@/lib/utils";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  let viewName = "Iniciar Sesión";
  let backHref: string | undefined = "/";
  let isWide = false;

  if (pathname?.startsWith("/register")) {
    viewName = "Registrarse";
    if (pathname === "/register") {
      backHref = "/login";
      isWide = true;
    } else {
      backHref = "/register";
    }
  } else if (pathname?.startsWith("/forgot-password")) {
    viewName = "Recuperar Contraseña";
    backHref = "/login";
  } else if (pathname?.startsWith("/reset-password")) {
    viewName = "Restablecer Contraseña";
    backHref = "/login";
  } else if (pathname?.startsWith("/verify-email")) {
    viewName = "Verificar Correo";
    backHref = "/login";
  } else if (pathname?.startsWith("/phone-login")) {
    viewName = "Iniciar Sesión";
    backHref = "/login";
  } else {
    // /login
    viewName = "Iniciar Sesión";
    backHref = "/";
  }

  return (
    <main className="min-h-screen w-full bg-white sm:bg-[#f8fafc] dark:bg-zinc-950 flex flex-col items-center justify-start font-sans selection:bg-[#5c7c9b]/20">
      {/* 1. Header curvo con patrón geométrico, título y botón de regreso funcional */}
      <AuthHeader
        title={viewName}
        backHref={backHref}
      />

      {/* 2. Contenedor de tarjeta compartida para las rutas de autenticación */}
      <div
        className={cn(
          "w-full px-7 sm:px-0 sm:-mt-14 z-20 relative pb-16",
          isWide
            ? "max-w-[560px] sm:max-w-[620px]"
            : "max-w-[480px] sm:max-w-[500px]"
        )}
      >
        <div
          className={cn(
            "w-full bg-white dark:bg-zinc-900 sm:rounded-[28px] sm:shadow-[0_16px_40px_rgba(31,39,50,0.08)] sm:dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)] sm:border sm:border-[#d2dbe5]/50 sm:dark:border-zinc-800/80 sm:p-10 flex flex-col items-center",
            isWide && "p-6 sm:p-10 gap-6"
          )}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
