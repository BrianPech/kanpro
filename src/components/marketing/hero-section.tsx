"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Building2,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  MapPin,
  Sparkles,
  Zap,
  Check,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Corridor {
  id: string;
  name: string;
  location: string;
  jobsCount: number;
}

const REGIONAL_CORRIDORS: Corridor[] = [
  { id: "merida_norte", name: "Mérida Norte", location: "Altabrisa · Montejo", jobsCount: 420 },
  { id: "merida_centro", name: "Mérida Centro", location: "Centro Histórico", jobsCount: 290 },
  { id: "playa_del_carmen", name: "Playa del Carmen", location: "5ta Avenida · Centro", jobsCount: 510 },
  { id: "cancun", name: "Cancún", location: "Av. Huayacán · Centro", jobsCount: 480 },
  { id: "tulum", name: "Tulum", location: "La Veleta · Aldea Zama", jobsCount: 190 },
];

export function HeroSection() {
  const [activeRole, setActiveRole] = useState<"company" | "candidate">("company");
  const [selectedCorridor, setSelectedCorridor] = useState<string>("merida_norte");

  const currentCorridor =
    REGIONAL_CORRIDORS.find((c) => c.id === selectedCorridor) || REGIONAL_CORRIDORS[0];

  return (
    <section className="relative w-full overflow-hidden bg-transparent text-foreground pt-6 pb-16 sm:pt-10 sm:pb-20 lg:pt-14 lg:pb-28 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 2-Column Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Value Proposition, Dual CTAs & Trust Signals */}
          <div className="lg:col-span-7 space-y-7">
            
            {/* Top Regional Status Eyebrow using shadcn semantic tokens */}
            <div className="inline-flex flex-wrap items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border text-muted-foreground backdrop-blur-md shadow-2xs">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-primary" />
              </span>
              <span className="text-[11px] sm:text-xs font-semibold tracking-wide uppercase text-foreground">
                Red de Empleo Directo del Sureste
              </span>
              <span className="text-border">|</span>
              <span className="text-[11px] sm:text-xs font-bold text-primary">
                0% Comisiones
              </span>
            </div>

            {/* Headline & Core Pitch */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-black tracking-tight text-foreground leading-[1.06] text-balance">
                Contratación y empleo formal.{" "}
                <span className="text-primary underline decoration-primary/30 decoration-wavy decoration-2 underline-offset-8">
                  Directo, verificado
                </span>{" "}
                y sin intermediarios.
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground font-normal leading-relaxed max-w-2xl">
                Conectamos empresas líderes y trabajadores en{" "}
                <strong className="text-foreground font-semibold">
                  Mérida, Cancún y la Riviera Maya
                </strong>
                . Expedientes laborales 100% auditados con 13 puntos SAT, contacto instantáneo por WhatsApp y cero comisiones sobre sueldos.
              </p>
            </div>

            {/* Dual Action CTAs using shadcn Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              <Button
                render={<Link href="/register/company" />}
                size="lg"
                className="h-13 px-7 rounded-2xl text-base font-semibold gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Building2 className="size-5" />
                <span>Publicar Vacante como Empresa</span>
                <ArrowRight className="size-4" />
              </Button>

              <Button
                render={<Link href="/register/candidate" />}
                variant="outline"
                size="lg"
                className="h-13 px-6 rounded-2xl text-base font-semibold gap-2.5 border-border bg-card/60 hover:bg-accent text-foreground backdrop-blur-md transition-all cursor-pointer shadow-2xs"
              >
                <UserCheck className="size-5 text-primary" />
                <span>Crear Expediente de Candidato</span>
              </Button>
            </div>

            {/* Trust Badges & Direct Guarantees */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span className="text-foreground font-medium">0% Comisión</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="size-4 text-primary shrink-0" />
                <span className="text-foreground font-medium">13 Puntos SAT</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <MessageSquare className="size-4 text-primary shrink-0" />
                <span className="text-foreground font-medium">WhatsApp &lt; 2 hrs</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <MapPin className="size-4 text-primary shrink-0" />
                <span className="text-foreground font-medium">Filtro por Colonia</span>
              </div>
            </div>

            {/* Hyperlocal Regional Corridor Pills */}
            <div id="zonas" className="pt-3 border-t border-border space-y-2.5 scroll-mt-24">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  Corredores con vacantes activas hoy:
                </span>
                <span className="text-[11px] font-mono text-primary font-semibold hidden sm:inline">
                  +{currentCorridor.jobsCount} ofertas en {currentCorridor.name}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {REGIONAL_CORRIDORS.map((corridor) => {
                  const isSelected = selectedCorridor === corridor.id;
                  return (
                    <button
                      key={corridor.id}
                      type="button"
                      onClick={() => setSelectedCorridor(corridor.id)}
                      className={`text-xs font-medium px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                          : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <span>{corridor.name}</span>
                      <span className="ml-1 text-[10px] opacity-70">({corridor.jobsCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Platform Showcase (Live Dual Simulation) */}
          <div className="lg:col-span-5 relative">
            
            {/* Ambient Background Glow Effect using primary color token */}
            <div className="absolute -inset-2 rounded-3xl bg-primary/10 blur-2xl opacity-60 pointer-events-none" />

            {/* Main Interactive Showcase Card with shadcn tokens */}
            <div className="relative rounded-3xl border border-border bg-card text-card-foreground shadow-xl backdrop-blur-xl overflow-hidden">
              
              {/* Window Header / Browser Chrome */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-destructive/60" />
                  <div className="size-2.5 rounded-full bg-muted-foreground/40" />
                  <div className="size-2.5 rounded-full bg-primary/60" />
                  <span className="text-[11px] font-mono font-medium text-muted-foreground pl-2">
                    kanpro.mx/operacion
                  </span>
                </div>

                <Badge variant="outline" className="border-border text-foreground text-[10px] font-mono font-bold gap-1.5 bg-background/50">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span>SISTEMA EN VIVO</span>
                </Badge>
              </div>

              {/* Persona Switcher Selector */}
              <div className="p-4 sm:p-5 pb-3">
                <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted border border-border">
                  <button
                    type="button"
                    onClick={() => setActiveRole("company")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      activeRole === "company"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Building2 className="size-4 text-primary" />
                    <span>Vista Empresa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRole("candidate")}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      activeRole === "candidate"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <UserCheck className="size-4 text-primary" />
                    <span>Vista Candidato</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Viewport Container */}
              <div className="p-4 sm:p-5 pt-0">
                <AnimatePresence mode="wait">
                  {activeRole === "company" ? (
                    <motion.div
                      key="company-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Candidate Match Card in Company Pipeline */}
                      <div className="p-4.5 rounded-2xl border border-border bg-card shadow-xs space-y-3.5">
                        
                        {/* Header: Candidate ID & Scoring */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold font-sans text-sm border border-primary/20">
                              CM
                              <span className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-primary border-2 border-card" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-bold text-foreground">
                                  Carlos Mendoza P.
                                </h3>
                                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5">
                                  SAT 100%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-medium">
                                Cocinero A / Parrillero Especializado
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <Badge variant="secondary" className="font-mono font-extrabold text-xs text-primary bg-primary/10 gap-1">
                              <Sparkles className="size-3" />
                              98% Match
                            </Badge>
                            <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">
                              Afinidad IA
                            </span>
                          </div>
                        </div>

                        {/* Verified Credentials Pills */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-foreground">
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/50 border border-border">
                            <ShieldCheck className="size-3.5 text-primary shrink-0" />
                            <span className="truncate">CSF &amp; RFC Auditados</span>
                          </div>
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/50 border border-border">
                            <MapPin className="size-3.5 text-primary shrink-0" />
                            <span className="truncate">A 1.4 km · {currentCorridor.name}</span>
                          </div>
                        </div>

                        {/* Direct WhatsApp Instant Action */}
                        <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              <MessageSquare className="size-3.5 text-primary" />
                              WhatsApp Directo Listo
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground bg-background">
                              Sin intermediarios
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            Plantilla precargada con vacante y propuesta de entrevista presencial en tu sucursal.
                          </p>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            render={<Link href="/register/company" />}
                            size="sm"
                            className="h-9.5 rounded-xl font-semibold text-xs gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <MessageSquare className="size-3.5" />
                            <span>Contactar Candidato</span>
                          </Button>

                          <Button
                            render={<Link href="/register/company" />}
                            variant="outline"
                            size="sm"
                            className="h-9.5 rounded-xl font-semibold text-xs gap-1.5 border-border text-foreground hover:bg-accent cursor-pointer"
                          >
                            <span>Ver Expediente SAT</span>
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </div>

                      </div>

                      {/* ROI & Economy Banner for Company */}
                      <div className="px-4 py-3 rounded-2xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Zap className="size-4 text-primary shrink-0" />
                          <span className="font-medium text-muted-foreground">
                            Ahorro estimado en esta vacante:
                          </span>
                        </div>
                        <span className="font-mono font-bold text-foreground">
                          $14,500 MXN en comisiones
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="candidate-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Job Opportunity Card in Candidate View */}
                      <div className="p-4.5 rounded-2xl border border-border bg-card shadow-xs space-y-3.5">
                        
                        {/* Header: Company & Salary */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] font-mono font-bold uppercase">
                                {currentCorridor.name}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5">
                                Empleador Verificado ✓
                              </Badge>
                            </div>
                            <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                              Recepcionista Bilingüe &amp; Concierge
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium">
                              Hotel Boutique Riviera Maya · Turno Matutino
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono text-base font-black text-foreground block">
                              $16,800 MXN
                            </span>
                            <span className="text-[10px] font-mono text-primary font-semibold block">
                              Sueldo Neto Mensual
                            </span>
                          </div>
                        </div>

                        {/* Benefits Checklist */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-foreground">
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/50 border border-border">
                            <Check className="size-3.5 text-primary stroke-[2.5] shrink-0" />
                            <span>IMSS desde el Día 1</span>
                          </div>
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/50 border border-border">
                            <Check className="size-3.5 text-primary stroke-[2.5] shrink-0" />
                            <span>Propinas semanales</span>
                          </div>
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/50 border border-border">
                            <Check className="size-3.5 text-primary stroke-[2.5] shrink-0" />
                            <span>Comedor gratuito</span>
                          </div>
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-muted/50 border border-border">
                            <MapPin className="size-3.5 text-primary shrink-0" />
                            <span>A 900 m de tu casa</span>
                          </div>
                        </div>

                        {/* Candidate Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            render={<Link href="/register/candidate" />}
                            size="sm"
                            className="h-9.5 rounded-xl font-semibold text-xs gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <span>Postularme en 1 Clic</span>
                            <ArrowRight className="size-3.5" />
                          </Button>

                          <Button
                            render={<Link href="/dashboard/candidate/discovery" />}
                            variant="outline"
                            size="sm"
                            className="h-9.5 rounded-xl font-semibold text-xs gap-1.5 border-border text-foreground hover:bg-accent cursor-pointer"
                          >
                            <span>Ver Todas las Ofertas</span>
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </div>

                      </div>

                      {/* Candidate Guarantee Banner */}
                      <div className="px-4 py-3 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-4 text-primary shrink-0" />
                          <span className="font-medium text-foreground">
                            Garantía K'anPro: Vacante 100% real sin estafas
                          </span>
                        </div>
                        <Badge variant="outline" className="font-mono font-bold text-primary border-primary/20 bg-background">
                          Auditoría SAT
                        </Badge>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Quick Status Footer */}
              <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="size-3.5 text-muted-foreground" />
                  Tiempo de respuesta promedio: <strong className="text-foreground font-semibold">42 min</strong>
                </span>
                <span className="font-mono font-semibold text-primary">
                  +{currentCorridor.jobsCount} activos hoy
                </span>
              </div>

            </div>

            {/* Floating Trust Seal 1 (SAT Verification) */}
            <div className="hidden sm:flex absolute -bottom-5 -left-5 p-3 rounded-2xl bg-card border border-border shadow-xl backdrop-blur-md items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <ShieldCheck className="size-5" />
              </div>
              <div className="text-left">
                <span className="block text-[11px] font-bold text-foreground">
                  Auditoría Legal de 13 Puntos
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  RFC, IMSS y Razón Social Validados
                </span>
              </div>
            </div>

            {/* Floating Stat Pill 2 (Live WhatsApp Connection) */}
            <div className="hidden sm:flex absolute -top-4 -right-4 p-2.5 px-3.5 rounded-2xl bg-card border border-border shadow-xl backdrop-blur-md items-center gap-2.5">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-primary" />
              </span>
              <span className="text-[11px] font-mono font-bold text-foreground">
                WhatsApp 1-Clic Activo
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
