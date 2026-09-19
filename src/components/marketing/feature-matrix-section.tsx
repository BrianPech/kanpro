"use client";

import React from "react";
import { Check, X, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FeatureMatrixSection() {
  const comparisonRows = [
    {
      feature: "Canal de contacto directo",
      kanpro: "WhatsApp instantáneo en 1 clic",
      kanproSub: "Sin intermediarios ni chats lentos",
      traditional: "Correo electrónico o buzón interno",
      traditionalSub: "Respuestas tardías de 7 a 21 días",
      highlight: true,
    },
    {
      feature: "Tiempo promedio de respuesta",
      kanpro: "Menos de 2 horas",
      kanproSub: "Agendamiento de entrevistas el mismo día",
      traditional: "1 a 3 semanas",
      traditionalSub: "Procesos burocráticos y vacantes inactivas",
      highlight: true,
    },
    {
      feature: "Búsqueda por cercanía y colonia",
      kanpro: "Por colonia específica (Mérida / Playa)",
      kanproSub: "Reduce tiempos y costos de traslado",
      traditional: "Solo por ciudad o estado general",
      traditionalSub: "Traslados de más de 2 horas diarias",
      highlight: false,
    },
    {
      feature: "Comisión por contratación",
      kanpro: "$0 MXN (100% libre de comisión)",
      kanproSub: "Ni a la empresa ni al candidato",
      traditional: "Cobro por desbloquear teléfonos o comisiones",
      traditionalSub: "Altos costos por publicación",
      highlight: false,
    },
    {
      feature: "Verificación legal y SAT",
      kanpro: "Auditoría de 13 requisitos legales SAT",
      kanproSub: "Sello oficial de empresa y expediente laboral",
      traditional: "Sin validación rigurosa",
      traditionalSub: "Riesgo de vacantes fantasma y fraudes",
      highlight: true,
    },
    {
      feature: "Privacidad de documentos sensibles",
      kanpro: "Consentimiento explícito empresa por empresa",
      kanproSub: "Cifrado LFPDPPP en Supabase Storage",
      traditional: "Documentos públicos o sin control",
      traditionalSub: "Información expuesta en la web",
      highlight: false,
    },
  ];

  return (
    <section className="py-16 sm:py-24 border-t border-border/60 bg-background relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative z-10 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold text-xs px-3 py-1 rounded-full">
            <Zap className="size-3.5 mr-1.5 text-primary" />
            Por Qué K&apos;anPro Marca la Diferencia
          </Badge>
          
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            El reclutamiento tradicional vs K&apos;anPro
          </h2>
          
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-xl mx-auto">
            Compara cómo resolvemos los principales cuellos de botella del mercado laboral en el Sureste de México.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden text-left">
          
          {/* Header Row */}
          <div className="grid grid-cols-12 bg-muted/50 border-b border-border/80 p-4 sm:p-5 text-xs font-extrabold text-foreground">
            <div className="col-span-4 sm:col-span-5 text-muted-foreground uppercase tracking-wider">
              Característica
            </div>
            <div className="col-span-4 sm:col-span-4 text-primary flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              <span>Plataforma K&apos;anPro</span>
            </div>
            <div className="col-span-4 sm:col-span-3 text-muted-foreground">
              Portales Tradicionales
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/60">
            {comparisonRows.map((row, idx) => (
              <div 
                key={idx} 
                className={`grid grid-cols-12 p-4 sm:p-5 items-center transition-colors ${
                  row.highlight ? "bg-primary/[0.02]" : "hover:bg-muted/20"
                }`}
              >
                {/* Feature Name */}
                <div className="col-span-4 sm:col-span-5 pr-3 space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-foreground leading-snug">
                    {row.feature}
                  </h4>
                </div>

                {/* K'anPro Value */}
                <div className="col-span-4 sm:col-span-4 pr-3 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-foreground">
                    <div className="size-4.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                    <span className="leading-snug">{row.kanpro}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium pl-6">
                    {row.kanproSub}
                  </p>
                </div>

                {/* Traditional Value */}
                <div className="col-span-4 sm:col-span-3 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <div className="size-4.5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                      <X className="size-3 stroke-[2.5]" />
                    </div>
                    <span className="leading-snug">{row.traditional}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/80 font-medium pl-6">
                    {row.traditionalSub}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
