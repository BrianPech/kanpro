"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, UserCheck, Building2, Check, Sparkles } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RegisterOptions() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = React.useState<"candidate" | "company">("candidate");

  const handleNext = () => {
    router.push(`/register/${selectedRole}`);
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* ── Header ── */}
      <header className="flex flex-col gap-1.5 items-center text-center w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide select-none">
          <Sparkles className="size-3.5" />
          <span>Únete a K&apos;anPro</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Selecciona tu Perfil
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
          Elige si te registras como candidato en búsqueda de empleo o como empresa empleadora.
        </p>
      </header>

      {/* ── Roles Selector ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
        {/* Card: Candidato */}
        <button
          type="button"
          onClick={() => setSelectedRole("candidate")}
          className={cn(
            "relative flex flex-col items-center text-center p-5 rounded-2xl border-2 transition-all cursor-pointer select-none gap-3 group",
            selectedRole === "candidate"
              ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
              : "border-border/80 bg-card hover:border-border hover:bg-muted/40"
          )}
        >
          {selectedRole === "candidate" && (
            <div className="absolute top-3 right-3 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <Check className="size-3 stroke-[3]" />
            </div>
          )}

          <div
            className={cn(
              "size-14 rounded-2xl flex items-center justify-center transition-colors shadow-2xs",
              selectedRole === "candidate"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground group-hover:text-foreground"
            )}
          >
            <UserCheck className="size-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              Candidato
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Postúlate a vacantes y destaca tu perfil profesional.
            </p>
          </div>
        </button>

        {/* Card: Empresa */}
        <button
          type="button"
          onClick={() => setSelectedRole("company")}
          className={cn(
            "relative flex flex-col items-center text-center p-5 rounded-2xl border-2 transition-all cursor-pointer select-none gap-3 group",
            selectedRole === "company"
              ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
              : "border-border/80 bg-card hover:border-border hover:bg-muted/40"
          )}
        >
          {selectedRole === "company" && (
            <div className="absolute top-3 right-3 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <Check className="size-3 stroke-[3]" />
            </div>
          )}

          <div
            className={cn(
              "size-14 rounded-2xl flex items-center justify-center transition-colors shadow-2xs",
              selectedRole === "company"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground group-hover:text-foreground"
            )}
          >
            <Building2 className="size-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              Empresa
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Publica ofertas laborales y contrata el mejor talento.
            </p>
          </div>
        </button>
      </div>

      {/* ── Action Button: Continuar ── */}
      <Button
        onClick={handleNext}
        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm sm:text-base shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
      >
        <span>
          Continuar como {selectedRole === "candidate" ? "Candidato" : "Empresa"}
        </span>
        <ArrowRight className="size-4" />
      </Button>

      {/* ── Navigation Links ── */}
      <div className="text-center pt-2 border-t border-border/80 w-full">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/login"
            className="text-foreground font-bold hover:text-primary underline ml-1 transition-colors"
          >
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
