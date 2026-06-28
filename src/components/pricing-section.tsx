"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

export function PricingSection() {
  const [activePricingTab, setActivePricingTab] = useState<"candidate" | "company">("candidate");

  const candidateFeatures = [
    "CV Digital Premium estructurado",
    "Ubicación visible por zona en Felipe Carrillo Puerto",
    "Control de Privacidad (oculta/muestra tu número)",
    "Botón de postulación directa por WhatsApp",
    "Acceso a vacantes exclusivas de la zona",
  ];

  const companyFeatures = [
    "Publicación instantánea de vacantes",
    "Exploración ilimitada del catálogo de candidatos",
    "Filtros avanzados por zona, sector y habilidades",
    "Acceso directo a WhatsApp en un solo click",
    "Opción de solicitar Sello de Calidad K'anPro",
  ];

  return (
    <section id="pricing" className="relative overflow-hidden bg-background py-12 md:py-[88px] border-t border-border">
      
      {/* Centered purple/indigo radial glow */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[650px] h-[350px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.25] dark:opacity-[0.15] pointer-events-none" 
        style={{ 
          backgroundImage: "linear-gradient(to right, rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.06) 1px, transparent 1px)", 
          backgroundSize: "32px 32px" 
        }} 
      />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16 space-y-4">
          <h2 className="font-sans font-medium text-3xl md:text-[40px] leading-[1.2] tracking-[-0.4px] text-foreground">
            Planes Simples y Directos
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Sin comisiones por contratación. Elige tu perfil para comenzar a conectar de inmediato en Felipe Carrillo Puerto.
          </p>
        </div>

        {/* Tab Toggle pill selector (Mobile-Only) */}
        <div className="flex md:hidden justify-center mb-8">
          <div className="inline-flex p-1 rounded-full bg-muted/50 border border-border shrink-0">
            <button
              onClick={() => setActivePricingTab("candidate")}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                activePricingTab === "candidate"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              Para Trabajar
            </button>
            <button
              onClick={() => setActivePricingTab("company")}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                activePricingTab === "company"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              Para Contratar
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 max-w-4xl mx-auto items-stretch">
          
          {/* Candidate Card (Para Trabajar) */}
          <div className={`bg-card border border-border/80 dark:border-border/10 rounded-[20px] p-8 relative flex-col justify-between min-h-[520px] transition-colors duration-200 ${
            activePricingTab === "candidate" ? "flex" : "hidden md:flex"
          }`}>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-[24px] font-medium leading-[1.33] text-foreground">Candidato</h3>
                <p className="text-xs text-muted-foreground">Para personas buscando empleo local</p>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Crea tu CV Digital Premium, destaca tu zona en Felipe Carrillo Puerto y conecta directamente con empleadores locales en WhatsApp.
              </p>

              <div className="border-t border-border/50 my-6" />

              <div className="space-y-4">
                <div className="text-[10px] font-bold text-foreground uppercase tracking-widest">
                  El plan Candidato incluye:
                </div>
                <ul className="space-y-3">
                  {candidateFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-muted-foreground leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/register/candidate"
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold h-12 rounded-full text-center w-full flex items-center justify-center transition-all text-sm tracking-[0.24px]"
              >
                Comenzar como Profesional
              </Link>
            </div>
          </div>

          {/* Company Card (Para Contratar - Popular) */}
          <div className={`bg-primary text-primary-foreground rounded-[20px] p-8 relative flex-col justify-between min-h-[520px] transition-colors duration-200 ${
            activePricingTab === "company" ? "flex" : "hidden md:flex"
          }`}>
            
            {/* POPULAR badge */}
            <span className="bg-background text-primary font-semibold text-[10px] px-3 py-1 rounded-full absolute -top-3 right-8 tracking-wider uppercase">
              Popular
            </span>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-[24px] font-medium leading-[1.33] text-primary-foreground">Empresa</h3>
                <p className="text-xs text-primary-foreground/80">Para negocios, hoteles y comercios locales</p>
              </div>

              <p className="text-xs sm:text-sm text-primary-foreground/90 leading-relaxed">
                Encuentra candidatos de confianza, filtra por fraccionamiento o sector y contáctalos de manera directa e inmediata sin pagar tarifas.
              </p>

              <div className="border-t border-primary-foreground/20 my-6" />

              <div className="space-y-4">
                <div className="text-[10px] font-bold text-primary-foreground/80 uppercase tracking-widest">
                  El plan Empresa incluye:
                </div>
                <ul className="space-y-3">
                  {companyFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="size-4 text-primary-foreground shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-primary-foreground/90 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/register/company"
                className="bg-background text-foreground hover:bg-background/90 font-semibold h-12 rounded-full text-center w-full flex items-center justify-center transition-all text-sm tracking-[0.24px]"
              >
                Comenzar como Empresa
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
