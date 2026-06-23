"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Loader2, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type EstimatorState = "idle" | "loading" | "success";

interface EstimationResult {
  skills: string[];
  minRate: number;
  maxRate: number;
  matchCount: number;
  category: string;
}

export function CtaBanner() {
  const [description, setDescription] = useState("");
  const [estimateState, setEstimateState] = useState<EstimatorState>("idle");
  const [result, setResult] = useState<EstimationResult | null>(null);

  const handleEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setEstimateState("loading");

    // Simulate AI analysis delay
    setTimeout(() => {
      const text = description.toLowerCase();
      let skills: string[] = [];
      let minRate = 8000;
      let maxRate = 14000;
      let matchCount = 150;
      let category = "Servicios Generales";

      if (text.includes("next") || text.includes("react") || text.includes("frontend") || text.includes("web") || text.includes("tecnologia") || text.includes("programador")) {
        skills = ["React.js", "WordPress", "Soporte TI", "Redes Sociales"];
        minRate = 15000;
        maxRate = 35000;
        matchCount = 42;
        category = "Tecnología & Diseño Web";
      } else if (text.includes("hotel") || text.includes("turismo") || text.includes("recepcionista") || text.includes("concierge") || text.includes("camarista")) {
        skills = ["Inglés Bilingüe", "Servicio al Cliente", "PMS Hotelero", "Resolución de Quejas"];
        minRate = 10000;
        maxRate = 18000;
        matchCount = 118;
        category = "Hotelería & Turismo";
      } else if (text.includes("cocinero") || text.includes("bartender") || text.includes("mesero") || text.includes("chef") || text.includes("restaurante") || text.includes("cocina") || text.includes("bar")) {
        skills = ["Distintivo H", "Coctelería", "Preparación de Alimentos", "Manipulación de Alimentos"];
        minRate = 8000;
        maxRate = 15000;
        matchCount = 142;
        category = "Gastronomía & Bares";
      } else if (text.includes("spa") || text.includes("terapeuta") || text.includes("masajista") || text.includes("wellness")) {
        skills = ["Masoterapia", "Tratamientos Corporales", "Servicio de Lujo", "Cosmiatría"];
        minRate = 12000;
        maxRate = 22000;
        matchCount = 95;
        category = "Spa & Wellness";
      } else if (text.includes("ventas") || text.includes("comercio") || text.includes("cajero") || text.includes("tienda") || text.includes("boutique") || text.includes("vendedor")) {
        skills = ["Facilidad de Palabra", "Punto de Venta", "Cierre de Ventas", "Inventario"];
        minRate = 7000;
        maxRate = 12000;
        matchCount = 154;
        category = "Ventas & Comercio";
      } else {
        skills = ["Atención al Cliente", "Trabajo en Equipo", "Inglés Básico", "Puntualidad"];
        minRate = 8000;
        maxRate = 13000;
        matchCount = 120;
        category = "Servicios Generales";
      }

      setResult({ skills, minRate, maxRate, matchCount, category });
      setEstimateState("success");
    }, 2000);
  };

  const handleReset = () => {
    setDescription("");
    setEstimateState("idle");
    setResult(null);
  };

  return (
    <section className="container mx-auto px-6 py-20">
      <div className="relative rounded-[20px] bg-card border border-border/80 dark:border-border/10 overflow-hidden min-h-[460px] flex flex-col lg:grid lg:grid-cols-2">
        
        {/* Left Column (Input & Estimator form) */}
        <div className="relative p-8 sm:p-12 flex flex-col justify-between z-10 lg:border-r border-border/60 dark:border-border/10">
          
          {/* Subtle Diagonal Stripe Overlay */}
          <div className="absolute inset-0 text-neutral-900/[0.02] dark:text-white/[0.03] pointer-events-none" 
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 12px)",
              backgroundSize: "24px 24px"
            }} 
          />

          <div className="space-y-4 text-left relative">
            <h3 className="text-3xl sm:text-[32px] font-medium leading-[1.19] tracking-[-0.32px] text-foreground">
              Simula el salario del puesto que buscas o necesitas
            </h3>
            <p className="text-muted-foreground text-[14px] font-normal leading-[1.43]">
              Calculamos el promedio de ingresos mensuales en Playa del Carmen en base a las habilidades solicitadas para el mercado local.
            </p>
          </div>

          <form onSubmit={handleEstimate} className="mt-8 relative z-20 space-y-4">
            <div className="bg-muted/50 dark:bg-muted/20 rounded-[12px] p-4 flex flex-col justify-between min-h-[140px] border border-border/60 dark:border-border/15 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
              <div className="w-full">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Describir puesto local
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={estimateState === "loading"}
                  placeholder="Describe el puesto que buscas o necesitas (ej: Cocinero para restaurante en la Quinta Avenida, Recepcionista bilingüe en Playacar)..."
                  className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground/80 text-[14px] font-normal leading-[1.43] focus:outline-none focus:ring-0 resize-none h-[64px]"
                />
              </div>
              <div className="flex justify-end items-center pt-2">
                <button
                  type="submit"
                  disabled={!description.trim() || estimateState === "loading"}
                  className="bg-primary hover:bg-primary/95 disabled:opacity-50 text-primary-foreground text-sm font-semibold tracking-[0.24px] h-10 px-5 rounded-full inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
                >
                  <span>Simular</span>
                  {estimateState === "loading" ? (
                    <Loader2 className="size-3.5 animate-spin text-primary-foreground" />
                  ) : (
                    <Sparkles className="size-3.5 text-primary-foreground fill-primary-foreground/10" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column (Visual Showcase / Interactive Glow Output) */}
        <div className="relative bg-muted/20 dark:bg-muted/5 p-8 sm:p-12 flex flex-col justify-center items-center overflow-hidden min-h-[280px] lg:min-h-full">
          
          {/* Ambient Glow */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full transition-all duration-1000 blur-[80px] pointer-events-none ${
            estimateState === "idle" 
              ? "bg-primary/5 dark:bg-primary/10" 
              : estimateState === "loading" 
                ? "bg-primary/15 dark:bg-primary/25 scale-125 animate-pulse" 
                : "bg-primary/10 dark:bg-primary/15"
          }`} />

          {estimateState === "idle" && (
            <div className="relative text-center space-y-4">
              {/* Glowing Pill Mockup (Matches image style) */}
              <div className="inline-flex items-center justify-center bg-card border border-border/80 dark:border-border/10 rounded-full px-6 py-3">
                <span className="text-[14px] font-semibold tracking-[0.16px] text-foreground">
                  Describe el puesto
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground max-w-[240px] leading-normal">
                Ingresa una descripción a la izquierda para analizar las habilidades y sueldos locales estimados.
              </p>
            </div>
          )}

          {estimateState === "loading" && (
            <div className="relative text-center space-y-3 z-10">
              <Loader2 className="size-8 animate-spin text-primary mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">Analizando requerimientos...</p>
                <p className="text-[10px] text-muted-foreground">Extrayendo habilidades y sueldos de mercado en la Riviera Maya</p>
              </div>
            </div>
          )}

          {estimateState === "success" && result && (
            <div className="w-full max-w-sm relative z-10 text-left space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Results Details Card */}
              <div className="bg-card border border-border/60 dark:border-border/10 rounded-[20px] p-6 space-y-4">
                
                {/* Result header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                      Categoría local
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {result.category}
                    </span>
                  </div>
                  <span className="bg-primary/10 text-primary text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Datos Listos
                  </span>
                </div>

                {/* Rates Estimation */}
                <div className="space-y-1 pt-1">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Salario mensual estimado
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[32px] font-medium leading-[1.19] tracking-[-0.32px] text-foreground">
                      ${result.minRate.toLocaleString()} - ${result.maxRate.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">MXN / mes</span>
                  </div>
                </div>

                {/* Extracted Skills */}
                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Habilidades requeridas
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded-[8px] font-semibold border border-border/60 dark:border-border/10"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/60 dark:border-border/10 pt-4 flex items-center gap-2 text-[12px] text-muted-foreground">
                  <TrendingUp className="size-3.5 text-primary shrink-0" />
                  <span>
                    Conecta con <strong className="text-foreground font-semibold">{result.matchCount}</strong> candidatos disponibles en Playa del Carmen para este perfil.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button className="h-12 px-6 rounded-full flex-1 justify-center bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm tracking-[0.24px] transition-all duration-200 border-none" asChild>
                  <Link href="/register">Registrar vacante gratis</Link>
                </Button>
                <button
                  onClick={handleReset}
                  className="h-12 px-6 rounded-full flex-1 justify-center border border-border hover:bg-muted text-foreground font-semibold text-sm tracking-[0.24px] transition-all duration-200 cursor-pointer"
                >
                  Volver a simular
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
