"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  MapPin, 
  Building2, 
  UserCheck, 
  MessageSquare, 
  ShieldCheck, 
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const [selectedCorridor, setSelectedCorridor] = useState<string>("todos");
  const [activeJobId, setActiveJobId] = useState<number>(1);

  const liveJobs = [
    {
      id: 1,
      corridor: "merida_norte",
      corridorLabel: "Mérida · Altabrisa",
      title: "Cocinero A / Parrillero",
      company: "Grupo Gastronómico Montejo",
      salary: "$14,500 MXN / mes",
      shift: "Turno Vespertino",
      distance: "A 1.4 km de tu colonia",
      benefits: ["IMSS Día 1", "Propinas Semanales", "Comedor Empleados", "Uniformes"],
      verifiedSAT: true,
      whatsappReady: true,
    },
    {
      id: 2,
      corridor: "playa_centro",
      corridorLabel: "Playa del Carmen · 5ta Av.",
      title: "Recepcionista Bilingüe",
      company: "Hotel Boutique Riviera Maya",
      salary: "$16,800 MXN / mes",
      shift: "Turno Matutino",
      distance: "A 900 m de tu colonia",
      benefits: ["IMSS", "Vales de Despensa", "Bono Puntualidad", "Transporte"],
      verifiedSAT: true,
      whatsappReady: true,
    },
    {
      id: 3,
      corridor: "merida_centro",
      corridorLabel: "Mérida · Centro & Montejo",
      title: "Barista / Encargado de Barra",
      company: "Cafetería Especialidad Santa Ana",
      salary: "$12,500 MXN / mes",
      shift: "Turno Mixto",
      distance: "A 2.1 km de tu colonia",
      benefits: ["IMSS", "Propinas", "Descuento en Alimentos", "Capacitación"],
      verifiedSAT: true,
      whatsappReady: true,
    },
    {
      id: 4,
      corridor: "cancun",
      corridorLabel: "Cancún · Av. Tulum & Huayacán",
      title: "Auxiliar Contable y Administrativo",
      company: "Operadora Turística del Caribe",
      salary: "$15,200 MXN / mes",
      shift: "Lunes a Viernes",
      distance: "A 3.5 km de tu colonia",
      benefits: ["Prestaciones de Ley", "Aguinaldo 30 Días", "Caja de Ahorro"],
      verifiedSAT: true,
      whatsappReady: true,
    },
    {
      id: 5,
      corridor: "tulum",
      corridorLabel: "Tulum · La Veleta",
      title: "Mixólogo / Bartender",
      company: "Eco-Resort & Club Tulum",
      salary: "$18,000 MXN / mes",
      shift: "Turno Nocturno",
      distance: "A 1.8 km de tu colonia",
      benefits: ["IMSS", "Propinas Diarias", "Transporte Nocturno", "Comedor"],
      verifiedSAT: true,
      whatsappReady: true,
    },
  ];

  const filteredJobs = selectedCorridor === "todos"
    ? liveJobs
    : liveJobs.filter((j) => j.corridor === selectedCorridor);

  const activeJob = liveJobs.find((j) => j.id === activeJobId) || liveJobs[0];

  return (
    <section className="border-b border-border bg-background relative overflow-hidden">
      
      {/* Top Main Hero Title Block */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-16 sm:pb-12 text-left space-y-6">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-muted text-[11px] font-mono font-bold text-muted-foreground border border-border">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>PLIEGO REGIONAL DE TRABAJO DIRECTO · YUCATÁN & QUINTANA ROO</span>
        </div>

        <div className="space-y-4 max-w-5xl">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground font-sans leading-[1.05] text-balance">
            El mercado de empleo del Sureste. Sin agencias. Sin intermediarios.
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground font-normal leading-relaxed max-w-3xl">
            Conectamos negocios y trabajadores en Mérida, Playa del Carmen y Cancún. Expedientes laborales 100% verificados, contacto directo en WhatsApp y 0% de comisiones por contratación.
          </p>
        </div>

        {/* Dual Actions Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            render={<Link href="/register/company" />}
            className="h-12 px-7 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-mono font-bold text-xs sm:text-sm gap-2 shadow-2xs cursor-pointer"
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
            <span>Crear Expediente de Candidato</span>
          </Button>

          <div className="hidden lg:flex items-center gap-4 pl-4 text-xs font-mono text-muted-foreground border-l border-border">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
              0% Comisión
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              13 Puntos SAT
            </span>
          </div>
        </div>

      </div>

      {/* Tablón de Vacantes Activo (Interactive Live Ledger) */}
      <div id="tablon" className="border-t border-border bg-muted/20 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Header of the Tablón */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <h2 className="text-base sm:text-lg font-mono font-black text-foreground uppercase tracking-tight">
                  [01] TABLÓN DE CONTRATACIÓN REGIONAL EN VIVO
                </h2>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Vacantes auditadas con rango salarial transparente y prestaciones desglosadas por colonia.
              </p>
            </div>

            {/* Corridor Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-muted-foreground mr-1 hidden sm:inline">
                Corredor:
              </span>
              {[
                { id: "todos", label: "Todas las Zonas" },
                { id: "merida_norte", label: "Mérida Altabrisa" },
                { id: "merida_centro", label: "Mérida Centro" },
                { id: "playa_centro", label: "Playa del Carmen" },
                { id: "cancun", label: "Cancún" },
                { id: "tulum", label: "Tulum" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCorridor(c.id)}
                  className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    selectedCorridor === c.id
                      ? "bg-foreground text-background font-bold border-foreground shadow-2xs"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Split Board: Left List + Right Inspection Terminal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left items-start">
            
            {/* Left: Job List Items */}
            <div className="lg:col-span-6 space-y-2.5">
              {filteredJobs.map((job) => {
                const isSelected = activeJob.id === job.id;

                return (
                  <div
                    key={job.id}
                    onClick={() => setActiveJobId(job.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-card border-foreground shadow-xs ring-1 ring-foreground"
                        : "bg-card/70 border-border hover:border-foreground/50 hover:bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-muted border border-border text-foreground">
                            {job.corridorLabel}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            SAT Verificado ✓
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-extrabold text-foreground font-sans">
                          {job.title}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          {job.company}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs sm:text-sm font-extrabold text-foreground block">
                          {job.salary}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {job.shift}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-3 mt-3 border-t border-border/60 text-[10px] font-mono text-muted-foreground">
                      <span className="flex items-center gap-1 text-foreground font-semibold">
                        <MapPin className="size-3 text-foreground" />
                        {job.distance}
                      </span>
                      <span>·</span>
                      <span>{job.benefits.slice(0, 2).join(" · ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Inspection & Action Terminal (The Authentic Dispatch Sheet) */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border-2 border-foreground bg-card p-6 sm:p-7 space-y-6 shadow-sm">
                
                {/* Header of Inspect Terminal */}
                <div className="flex items-start justify-between pb-4 border-b border-border">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                      FICHA TÉCNICA DE CONTRATACIÓN DIRECTA
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-foreground font-sans">
                      {activeJob.title}
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground">
                      Empleador: <strong className="text-foreground">{activeJob.company}</strong>
                    </p>
                  </div>

                  <div className="size-10 rounded-xl bg-foreground text-background flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    <Building2 className="size-5" />
                  </div>
                </div>

                {/* Economic & Proximity Metrics */}
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase block">Compensación Bruta</span>
                    <span className="text-base font-extrabold text-foreground">{activeJob.salary}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase block">Ubicación y Radio</span>
                    <span className="text-xs font-bold text-foreground">{activeJob.corridorLabel}</span>
                  </div>
                </div>

                {/* Benefits Breakdown */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold uppercase text-muted-foreground block">
                    Esquema de Prestaciones de Ley y Superiores:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {activeJob.benefits.map((b, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border text-xs font-medium text-foreground">
                        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp Direct Dispatch Trigger */}
                <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                    <MessageSquare className="size-4" />
                    <span>Conexión de 1-Clic por WhatsApp</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Al postularte, el reclutador recibe tu CV digital verificado y se abre de inmediato una conversación directa sin intermediarios.
                  </p>
                </div>

                {/* Action CTA */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    render={
                      <Link 
                        href={`/dashboard/candidate/discovery?q=${encodeURIComponent(activeJob.title)}`} 
                      />
                    }
                    variant="outline"
                    className="h-11 rounded-xl border-border hover:bg-muted font-mono font-bold text-xs text-foreground cursor-pointer"
                  >
                    <span>Ver Todas las Vacantes</span>
                  </Button>

                  <Button
                    render={<Link href="/register/candidate" />}
                    className="h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-mono font-bold text-xs gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Postularme Ahora</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>

    </section>
  );
}
