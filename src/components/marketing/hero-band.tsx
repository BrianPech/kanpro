"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, UserCheck } from "lucide-react";

export function HeroBand() {
  return (
    <section className="bg-gradient-to-b from-[var(--color-fiord-50)] via-white to-white text-[var(--color-fiord-950)] pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-[var(--color-fiord-200)] text-left">
      
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Eyebrow Pill */}
        <div className="flex justify-start">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[var(--color-fiord-200)] text-[12px] font-semibold text-[var(--color-fiord-800)] tracking-[0.24px] shadow-2xs">
            <span className="size-2 rounded-full bg-[#059669]" />
            <span>La Red de Empleo Directo del Sureste de México</span>
          </div>
        </div>

        {/* Hero Title & Subhead */}
        <div className="space-y-6 max-w-5xl">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-bold tracking-[-0.035em] leading-[1.02] text-[var(--color-fiord-950)] font-sans text-balance">
            Contratación y empleo. Directo y sin comisiones.
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-[var(--color-fiord-700)] font-normal leading-[1.4] max-w-3xl tracking-[0.24px]">
            Conectamos empresas verificadas y trabajadores en Mérida, Playa del Carmen y Cancún. Con expedientes laborales 100% cotejados, contacto instantáneo en WhatsApp y 0% de comisiones por sueldo.
          </p>
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/register/company"
            className="h-12 px-7 rounded-full bg-[var(--color-fiord-950)] text-white hover:bg-[var(--color-fiord-900)] font-semibold text-[15px] flex items-center gap-2 transition-all shadow-xs"
          >
            <span>Publicar vacante gratis</span>
            <ArrowRight className="size-4" />
          </Link>

          <Link
            href="/register/candidate"
            className="h-12 px-7 rounded-full border border-[var(--color-fiord-200)] bg-white hover:bg-[var(--color-fiord-50)] text-[var(--color-fiord-950)] font-semibold text-[15px] flex items-center gap-2 transition-all shadow-2xs"
          >
            <UserCheck className="size-4 text-[#059669]" />
            <span>Crear mi CV de candidato</span>
          </Link>
        </div>

        {/* High-Contrast Fiord Product Mockup Frame (Solo el marco sin contenido) */}
        <div className="pt-4">
          <div className="rounded-[28px] bg-white border border-[var(--color-fiord-200)] p-6 sm:p-8 relative overflow-hidden shadow-xs space-y-6">
            
            {/* Mockup Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-fiord-200)]">
              <div className="flex items-center gap-3">
                <div className="size-3 rounded-full bg-[#ef4444]" />
                <div className="size-3 rounded-full bg-[#f59e0b]" />
                <div className="size-3 rounded-full bg-[#10b981]" />
                <span className="text-[13px] font-mono text-[var(--color-fiord-600)] font-semibold pl-2">
                  kanpro.mx/app
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1 rounded-full bg-[#059669]/10 text-[#047857] border border-[#059669]/20 text-[11px] font-bold font-mono">
                  SISTEMA EN VIVO · YUCATÁN & RIVIERA MAYA
                </span>
              </div>
            </div>

            {/* Clean Empty Viewport Frame Canvas */}
            <div className="rounded-[20px] bg-[var(--color-fiord-50)] border border-[var(--color-fiord-200)] min-h-[260px] sm:min-h-[360px] w-full flex items-center justify-center relative overflow-hidden" />

          </div>
        </div>

      </div>
    </section>
  );
}
