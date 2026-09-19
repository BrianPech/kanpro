"use client";

import React from "react";
import { Check, X, Kanban } from "lucide-react";

export function ComparisonSection() {
  const comparisonRows = [
    {
      feature: "Comisión por contratación / colocación",
      kanpro: "0% — Sin deducciones sobre el salario",
      traditional: "15% a 30% del sueldo anual o cuotas fijas altas",
      kanproPass: true,
    },
    {
      feature: "Canal de contacto y agendado",
      kanpro: "WhatsApp directo en 1-clic con plantilla",
      traditional: "Correos desatendidos o llamadas trianguladas",
      kanproPass: true,
    },
    {
      feature: "Tiempo promedio de primer contacto",
      kanpro: "< 2 Horas el mismo día",
      traditional: "1 a 3 Semanas de espera",
      kanproPass: true,
    },
    {
      feature: "Geolocalización por cercanía real",
      kanpro: "Por colonia específica (< 3 km de casa)",
      traditional: "Por estado o municipio general sin filtro de ruta",
      kanproPass: true,
    },
    {
      feature: "Expediente laboral digital (INE, CURP, comprobante)",
      kanpro: "Centralizado, validado y con permiso expreso",
      traditional: "Copias impresas sueltas sin protección de datos",
      kanproPass: true,
    },
    {
      feature: "Auditoría legal de empresas empleadoras",
      kanpro: "13 Puntos SAT (RFC, 32-D, Acta, IMSS)",
      traditional: "Sin verificación previa de legitimidad patronal",
      kanproPass: true,
    },
  ];

  return (
    <section id="comparativa" className="py-16 sm:py-24 border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-left">
        
        {/* Header Block */}
        <div className="space-y-2 max-w-3xl">
          <span className="text-[11px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
            [04] EFICIENCIA ECONÓMICA Y OPERATIVA
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground font-sans">
            K&apos;anPro vs Métodos Tradicionales de Reclutamiento
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono">
            Comparativa directa de costos, tiempos de colocación y control documental.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
          
          <div className="grid grid-cols-12 bg-muted/60 border-b border-border font-mono text-xs font-bold text-foreground py-3.5 px-4 sm:px-6">
            <div className="col-span-5 sm:col-span-4">Criterio Operativo</div>
            <div className="col-span-4 sm:col-span-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-black">
              <Kanban className="size-3.5" />
              <span>K&apos;anPro Sureste</span>
            </div>
            <div className="col-span-3 sm:col-span-4 text-muted-foreground">Portales / Agencias</div>
          </div>

          <div className="divide-y divide-border">
            {comparisonRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 items-center py-4 px-4 sm:px-6 text-xs gap-3 hover:bg-muted/20 transition-colors"
              >
                <div className="col-span-12 sm:col-span-4 font-bold text-foreground font-sans">
                  {row.feature}
                </div>

                <div className="col-span-6 sm:col-span-4 font-mono font-bold text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                  <div className="size-4.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                  <span className="leading-snug">{row.kanpro}</span>
                </div>

                <div className="col-span-6 sm:col-span-4 font-mono text-muted-foreground flex items-start gap-2">
                  <div className="size-4.5 rounded bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5 border border-border">
                    <X className="size-3 stroke-[2.5]" />
                  </div>
                  <span className="leading-snug">{row.traditional}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
