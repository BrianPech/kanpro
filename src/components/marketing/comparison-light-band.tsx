"use client";

import React from "react";
import Link from "next/link";
import { Check, Info, Kanban, Sparkles, ArrowRight } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface ComparisonRow {
  title: string;
  tooltip: string;
  kanpro: React.ReactNode;
  bolsas: React.ReactNode;
  agencias: React.ReactNode;
}

export function ComparisonLightBand() {
  const rows: ComparisonRow[] = [
    {
      title: "Comisión por contratación",
      tooltip: "Porcentaje o cobro sobre el salario acordado del colaborador contratado.",
      kanpro: (
        <div className="flex items-center gap-1.5 text-primary font-bold">
          <Check className="size-4 text-primary stroke-[2.5] shrink-0" />
          <span>0% (Sin comisiones sobre salario)</span>
        </div>
      ),
      bolsas: <span>0% (Cobro por anuncio publicado)</span>,
      agencias: <span className="font-semibold text-foreground">15% a 30% del sueldo anual</span>,
    },
    {
      title: "Canal directo de contacto",
      tooltip: "Medio instantáneo para coordinar entrevistas y enviar mensajes sin intermediarios.",
      kanpro: (
        <div className="flex items-center gap-1.5 text-primary font-bold">
          <Check className="size-4 text-primary stroke-[2.5] shrink-0" />
          <span>WhatsApp directo en 1-clic</span>
        </div>
      ),
      bolsas: <span>Correo o buzón en portal web</span>,
      agencias: <span>Intermediario de la agencia</span>,
    },
    {
      title: "Tiempo de primera respuesta",
      tooltip: "Velocidad promedio desde la publicación hasta la primera postulación interactiva.",
      kanpro: (
        <div className="flex items-center gap-1.5 text-primary font-bold">
          <Check className="size-4 text-primary stroke-[2.5] shrink-0" />
          <span>&lt; 2 Horas el mismo día</span>
        </div>
      ),
      bolsas: <span>1 a 2 semanas</span>,
      agencias: <span>3 a 6 semanas</span>,
    },
    {
      title: "Filtro hiperlocal de cercanía",
      tooltip: "Búsqueda por radio estricto al centro de trabajo para evitar deserción por transporte.",
      kanpro: (
        <div className="flex items-center gap-1.5 text-primary font-bold">
          <Check className="size-4 text-primary stroke-[2.5] shrink-0" />
          <span>Radio exacto (&lt; 3 km de casa)</span>
        </div>
      ),
      bolsas: <span>Solo estado o municipio general</span>,
      agencias: <span>Búsqueda manual aleatoria</span>,
    },
    {
      title: "Expediente auditado 13 Pts SAT",
      tooltip: "Cotejo oficial de RFC, Constancia 32-D, Acta Constitutiva y antecedentes.",
      kanpro: (
        <div className="flex items-center gap-1.5 text-primary font-bold">
          <Check className="size-4 text-primary stroke-[2.5] shrink-0" />
          <span>100% Auditado (32-D positivo)</span>
        </div>
      ),
      bolsas: <span className="text-muted-foreground/60">— (Sin validación)</span>,
      agencias: <span>Opcional con costo adicional</span>,
    },
    {
      title: "Expediente digital unificado",
      tooltip: "Cotejo de INE, CURP, comprobante domiciliario y consentimiento LFPDPPP.",
      kanpro: (
        <div className="flex items-center gap-1.5 text-primary font-bold">
          <Check className="size-4 text-primary stroke-[2.5] shrink-0" />
          <span>Perfil digital verificado en 1-clic</span>
        </div>
      ),
      bolsas: <span>CVs en PDF sin cotejo</span>,
      agencias: <span>Copias impresas en papel</span>,
    },
    {
      title: "Prevención de inasistencia (Ghosting)",
      tooltip: "Confirmaciones automáticas vía WhatsApp antes de la cita de entrevista.",
      kanpro: (
        <div className="flex items-center gap-1.5 text-primary font-bold">
          <Check className="size-4 text-primary stroke-[2.5] shrink-0" />
          <span>Recordatorio WhatsApp activo</span>
        </div>
      ),
      bolsas: <span className="text-muted-foreground/60">Alta tasa de inasistencia (&gt;50%)</span>,
      agencias: <span>Confirmación por llamada</span>,
    },
    {
      title: "Inversión estimada por 5 contratos",
      tooltip: "Cálculo promedio de costo por cubrir cinco puestos operativos o administrativos.",
      kanpro: (
        <div className="text-primary font-black">
          <span>$0 MXN en comisiones</span>
        </div>
      ),
      bolsas: <span>$7,500 - $15,000 MXN</span>,
      agencias: <span className="font-semibold text-foreground">$50,000 - $120,000 MXN</span>,
    },
  ];

  return (
    <TooltipProvider delay={100}>
      <section id="comparativa" className="w-full py-20 sm:py-28 lg:py-32 bg-transparent text-foreground text-left relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header Block */}
          <div className="space-y-4 max-w-3xl">
            <Badge
              variant="outline"
              className="text-xs font-mono font-bold uppercase tracking-wider text-primary border-primary/20 bg-primary/5 px-3.5 py-1 rounded-full gap-1.5 shadow-2xs"
            >
              <Sparkles className="size-3.5" />
              <span>Matriz Comparativa de Mercado</span>
            </Badge>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground font-sans leading-[1.08] text-balance">
              K&apos;anPro vs Métodos Tradicionales
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground font-normal leading-relaxed text-balance">
              Compara cómo K&apos;anPro revoluciona el reclutamiento regional eliminando intermediarios lentos y tarifas abusivas sobre los salarios en Yucatán y Quintana Roo.
            </p>
          </div>

          {/* Webflow-style Comparison Table */}
          <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-left">
                {/* Definición de anchos de columna */}
                <colgroup>
                  <col className="w-[31%]" />
                  <col className="w-[27%]" />
                  <col className="w-[21%]" />
                  <col className="w-[21%]" />
                </colgroup>

                {/* Table Header: Simetría y alineación perfecta estilo Webflow */}
                <thead>
                  <tr>
                    {/* Columna 1: Esquema / Título */}
                    <th className="p-6 align-top border-b border-border bg-card">
                      <div className="flex flex-col justify-between h-full min-h-[190px]">
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider font-mono">
                            <Kanban className="size-3.5" />
                            <span>PLATAFORMA DIRECTA</span>
                          </div>
                          <h3 className="text-xl font-black text-foreground tracking-tight">
                            Esquema Operativo
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Comparativa técnica de contratación y costos en la Península de Yucatán.
                          </p>
                        </div>
                        <div className="pt-3">
                          <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-muted-foreground block">
                            Criterios Evaluados ↓
                          </span>
                        </div>
                      </div>
                    </th>

                    {/* Columna 2: K'anPro (Columna Tintada Continua CMS Style) */}
                    <th className="p-6 align-top bg-primary/5 border-x border-primary/20 border-b border-primary/20">
                      <div className="flex flex-col justify-between h-full min-h-[190px] space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-primary">
                              K’anPro Sureste
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-bold tracking-wide">
                              DIRECTO
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-foreground">
                              0%
                            </span>
                            <span className="text-xs font-bold text-primary">
                              comisión por éxito
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            Sin deducciones sobre salario
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Vinculación formal directa por WhatsApp. Sin porcentajes sobre salarios ni intermediarios.
                        </p>
                      </div>
                    </th>

                    {/* Columna 3: Bolsas Masivas */}
                    <th className="p-6 align-top border-b border-border bg-card">
                      <div className="flex flex-col justify-between h-full min-h-[190px] space-y-4">
                        <div className="space-y-1.5">
                          <span className="text-base font-bold text-foreground block">
                            Bolsas Masivas
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-bold text-foreground">
                              Por vacante
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            Cobro por post / créditos
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Portales nacionales (OCC, Indeed). Cobro por publicación de anuncio sin filtro de distancia.
                        </p>
                      </div>
                    </th>

                    {/* Columna 4: Agencias de RH */}
                    <th className="p-6 align-top border-b border-border bg-card">
                      <div className="flex flex-col justify-between h-full min-h-[190px] space-y-4">
                        <div className="space-y-1.5">
                          <span className="text-base font-bold text-foreground block">
                            Agencias de RH
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-bold text-foreground">
                              15% - 30%
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              anual
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            1 a 2 meses de sueldo
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Headhunters y agencias tradicionales. Cobro de 1 a 2 meses de sueldo por contratación.
                        </p>
                      </div>
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="group hover:bg-muted/30 transition-colors">
                      {/* Criterio con Tooltip (i) */}
                      <td className="p-4 sm:px-6 sm:py-4 border-b border-border/50 text-sm font-medium text-foreground bg-card">
                        <div className="flex items-center gap-2">
                          <span>{row.title}</span>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  type="button"
                                  className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground transition-colors cursor-help"
                                  aria-label={`Información sobre ${row.title}`}
                                />
                              }
                            >
                              <Info className="size-3.5" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs">
                              {row.tooltip}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>

                      {/* K'anPro (Columna Tintada Continua) */}
                      <td className="p-4 sm:px-6 sm:py-4 bg-primary/5 border-x border-primary/20 border-b border-primary/20 text-sm">
                        {row.kanpro}
                      </td>

                      {/* Bolsas Masivas */}
                      <td className="p-4 sm:px-6 sm:py-4 border-b border-border/50 text-sm text-muted-foreground bg-card">
                        {row.bolsas}
                      </td>

                      {/* Agencias Tradicionales */}
                      <td className="p-4 sm:px-6 sm:py-4 border-b border-border/50 text-sm text-muted-foreground bg-card">
                        {row.agencias}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Table Footer: Fila de Acción (CTA) Perfectamente Nivelada */}
                <tfoot>
                  <tr>
                    <td className="p-4 sm:p-6 bg-card" />
                    
                    {/* Botón CTA K'anPro en su columna */}
                    <td className="p-4 sm:p-6 bg-primary/5 border-x border-primary/20 border-b-2 border-primary/20 rounded-b-2xl">
                      <Link
                        href="/register/company"
                        className="inline-flex w-full items-center justify-center gap-1.5 h-10 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-[0.98]"
                      >
                        <span>Publicar Vacante Directa</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </td>

                    <td className="p-4 sm:p-6 bg-card text-center">
                      <span className="text-xs text-muted-foreground font-medium">
                        Portal nacional abierto
                      </span>
                    </td>

                    <td className="p-4 sm:p-6 bg-card text-center">
                      <span className="text-xs text-muted-foreground font-medium">
                        Contrato mercantil cerrado
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      </section>
    </TooltipProvider>
  );
}
