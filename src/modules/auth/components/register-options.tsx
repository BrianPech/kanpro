"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthHeader } from "./auth-header";

export function RegisterOptions() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = React.useState<"candidate" | "company">("candidate");

  const handleNext = () => {
    router.push(`/register/${selectedRole}`);
  };

  return (
    <main className="min-h-screen w-full bg-white dark:bg-zinc-950 flex flex-col items-center justify-start pb-12 font-sans selection:bg-[#5c7c9b]/20">
      <div className="w-full max-w-[560px] flex flex-col items-center">
        {/* 1. Dark Curved Header */}
        <AuthHeader
          title="Crear Cuenta"
          backHref="/login"
        />

        {/* 2. Content Container */}
        <div className="w-full px-6 sm:px-8 mt-2 flex flex-col items-center gap-6">
          <header className="flex flex-col gap-1.5 items-center text-center">
            <h1 className="text-[28px] font-extrabold text-[#2f3c4b] dark:text-zinc-50 tracking-[-1px]">
              Selecciona tu perfil
            </h1>
            <p className="text-[14px] text-[#5c7c9b] dark:text-zinc-400 font-medium max-w-sm leading-relaxed">
              Elige si te registras como candidato en búsqueda de empleo o como empresa.
            </p>
          </header>

          {/* Roles Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* Card Candidato */}
            <button
              type="button"
              onClick={() => setSelectedRole("candidate")}
              className={cn(
                "flex flex-col items-center gap-4 bg-[#f5f7fa] dark:bg-zinc-900 border-2 rounded-[20px] p-6 shadow-[0_4px_10px_rgba(0,0,0,0.03)] transition-all cursor-pointer select-none text-center",
                selectedRole === "candidate"
                  ? "border-[#1f2732] bg-white dark:bg-zinc-800/80 shadow-md"
                  : "border-transparent hover:border-[#aabccf]/40 opacity-80 hover:opacity-100"
              )}
            >
              <div className="w-24 h-24 flex items-center justify-center rounded-full bg-[#1f2732]/5 p-3">
                <svg className="w-full h-full text-[#1f2732]" viewBox="0 0 200 200" fill="none">
                  <circle cx="100" cy="100" r="80" fill="currentColor" fillOpacity="0.05" />
                  <path d="M85 140C85 125 90 115 100 115C110 115 115 125 115 140H85Z" fill="currentColor" fillOpacity="0.8" />
                  <circle cx="100" cy="102" r="14" fill="currentColor" fillOpacity="0.8" />
                </svg>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-[18px] font-bold text-[#1f2732] dark:text-zinc-100">
                  Candidato
                </h3>
                <p className="text-[12px] text-[#5c7c9b] dark:text-zinc-400 font-medium leading-relaxed">
                  Postula a vacantes y destaca tu perfil profesional.
                </p>
              </div>
            </button>

            {/* Card Empresa */}
            <button
              type="button"
              onClick={() => setSelectedRole("company")}
              className={cn(
                "flex flex-col items-center gap-4 bg-[#f5f7fa] dark:bg-zinc-900 border-2 rounded-[20px] p-6 shadow-[0_4px_10px_rgba(0,0,0,0.03)] transition-all cursor-pointer select-none text-center",
                selectedRole === "company"
                  ? "border-[#1f2732] bg-white dark:bg-zinc-800/80 shadow-md"
                  : "border-transparent hover:border-[#aabccf]/40 opacity-80 hover:opacity-100"
              )}
            >
              <div className="w-24 h-24 flex items-center justify-center rounded-full bg-[#1f2732]/5 p-3">
                <svg className="w-full h-full text-[#1f2732]" viewBox="0 0 200 200" fill="none">
                  <circle cx="100" cy="100" r="80" fill="currentColor" fillOpacity="0.05" />
                  <rect x="65" y="60" width="70" height="80" rx="4" fill="currentColor" fillOpacity="0.7" />
                  <rect x="75" y="75" width="12" height="12" rx="2" fill="white" />
                  <rect x="113" y="75" width="12" height="12" rx="2" fill="white" />
                  <rect x="75" y="95" width="12" height="12" rx="2" fill="white" />
                  <rect x="113" y="95" width="12" height="12" rx="2" fill="white" />
                </svg>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-[18px] font-bold text-[#1f2732] dark:text-zinc-100">
                  Empresa
                </h3>
                <p className="text-[12px] text-[#5c7c9b] dark:text-zinc-400 font-medium leading-relaxed">
                  Publica ofertas laborales y contrata el mejor talento.
                </p>
              </div>
            </button>
          </div>

          {/* Action Button: Siguiente */}
          <button
            onClick={handleNext}
            className="w-full h-[56px] rounded-[16px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-[16px] tracking-[-0.2px] shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] mt-2"
          >
            <span>Siguiente</span>
            <ArrowRight className="size-5" />
          </button>

          {/* Navigation Links */}
          <div className="flex flex-col items-center gap-2 text-center mt-2 pt-4 border-t border-[#d2dbe5]/40 dark:border-zinc-800 w-full">
            <p className="text-[14px] text-[#5c7c9b] dark:text-zinc-400 font-medium">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/login"
                className="text-[#1f2732] dark:text-zinc-100 font-bold hover:underline"
              >
                Inicia Sesión
              </Link>
            </p>
            <p className="text-[12px] text-[#5c7c9b]/80 dark:text-zinc-500 font-medium">
              ¿Acceso administrativo?{" "}
              <Link
                href="/register/admin"
                className="text-amber-600 font-semibold hover:underline"
              >
                Registrar Administrador
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
