"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Building2, UserCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-16 sm:py-24 border-b border-border bg-background text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border-2 border-foreground bg-card p-8 sm:p-14 lg:p-16 space-y-8 shadow-sm">
          
          <div className="max-w-3xl space-y-4">
            <span className="text-[11px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
              ACTIVA TU PERFIL EN LA PENÍNSULA
            </span>
            
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground font-sans leading-[1.08]">
              Empieza a contratar o encuentra empleo hoy mismo.
            </h2>
            
            <p className="text-sm sm:text-base text-muted-foreground font-mono leading-relaxed">
              Únete a las empresas y profesionistas que ya operan sin intermediarios en Mérida, Playa del Carmen, Cancún y Tulum.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              render={<Link href="/register/company" />}
              className="h-12 px-7 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-mono font-bold text-xs sm:text-sm gap-2 cursor-pointer shadow-2xs"
            >
              <Building2 className="size-4" />
              <span>Publicar Vacante como Empresa</span>
              <ArrowRight className="size-4" />
            </Button>

            <Button
              render={<Link href="/register/candidate" />}
              variant="outline"
              className="h-12 px-7 rounded-xl border-border hover:bg-muted text-foreground font-mono font-bold text-xs sm:text-sm gap-2 cursor-pointer"
            >
              <UserCheck className="size-4" />
              <span>Crear mi Expediente de Candidato</span>
            </Button>
          </div>

          <div className="pt-4 border-t border-border flex flex-wrap items-center gap-6 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
              0% Comisión por colocación
            </span>
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
              13 Puntos SAT para empresas
            </span>
            <span className="flex items-center gap-1.5 text-foreground font-semibold">
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
              Cifrado LFPDPPP para candidatos
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}
