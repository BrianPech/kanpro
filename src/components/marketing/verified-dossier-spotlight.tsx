"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  FileCheck, 
  CheckCircle2, 
  Building2, 
  UserCheck, 
  FileText, 
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function VerifiedDossierSpotlight() {
  const [activeTrustTab, setActiveTrustTab] = useState<"candidate" | "company">("candidate");

  return (
    <section id="expediente" className="py-16 sm:py-24 border-t border-border/60 bg-background relative overflow-hidden">
      
      {/* Glow background */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold text-xs px-3 py-1 rounded-full">
            <ShieldCheck className="size-3.5 mr-1.5" />
            Confianza y Seguridad Blindada
          </Badge>
          
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Verificación real para relaciones laborales serias
          </h2>
          
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl mx-auto">
            Eliminamos vacantes fantasma y perfiles falsos. En K&apos;anPro cada empresa y candidato cuenta con expediente digital verificado.
          </p>

          {/* Pill Selector */}
          <div className="inline-flex p-1.5 rounded-2xl bg-muted/60 border border-border/80 shadow-2xs mt-4">
            <button
              onClick={() => setActiveTrustTab("candidate")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTrustTab === "candidate"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Expediente del Candidato (0-100%)</span>
            </button>

            <button
              onClick={() => setActiveTrustTab("company")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTrustTab === "company"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              <Building2 className="size-4 text-primary" />
              <span>Verificación Legal de Empresa (13 Puntos SAT)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Dual Trust Display */}
        {activeTrustTab === "candidate" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Explanation */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="space-y-2">
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold text-xs px-3 py-1 rounded-full">
                  Expediente Digital Laboral
                </Badge>
                <h3 className="text-xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Tus documentos oficiales en un solo expediente seguro
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                  Las empresas del Sureste contratan primero a postulantes con expediente completo. Sube tu documentación una sola vez y compártela bajo tu estricto consentimiento.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/60">
                  <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileCheck className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">Identificación y CURP Oficial</h4>
                    <p className="text-xs text-muted-foreground">Cotejo de INE/Pasaporte y Clave Única de Población para trámites de nómina.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/60">
                  <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">Constancias Laborales y Recomendaciones</h4>
                    <p className="text-xs text-muted-foreground">Acredita tu experiencia previa con cartas de finiquito y cartas de recomendación.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/60">
                  <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Lock className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">Privacidad y Cifrado LFPDPPP</h4>
                    <p className="text-xs text-muted-foreground">Tus documentos nunca son públicos. Solo la empresa que tú autorices puede revisarlos.</p>
                  </div>
                </div>
              </div>

              <Button
                render={<Link href="/register/candidate" />}
                className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs gap-2 cursor-pointer"
              >
                <span>Crear mi Expediente Digital</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>

            {/* Right Column: Visual Mockup */}
            <div className="lg:col-span-6">
              <Card className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-primary text-primary-foreground font-extrabold flex items-center justify-center text-sm shadow-2xs">
                      AG
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                        Alejandro Gómez
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      </h4>
                      <p className="text-xs text-muted-foreground font-semibold">Bartender / Mixólogo • Mérida, Yucatán</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold text-xs">
                    Prioridad Máxima
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-foreground">Nivel de Expediente Digital</span>
                    <span className="text-emerald-600 font-mono">100% Completado</span>
                  </div>
                  <Progress value={100} className="h-2.5 bg-muted" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="size-4 text-primary shrink-0" />
                      <span className="text-xs font-bold text-foreground truncate">INE_Front_Back.pdf</span>
                    </div>
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="size-4 text-primary shrink-0" />
                      <span className="text-xs font-bold text-foreground truncate">Comprobante_CFE.pdf</span>
                    </div>
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="size-4 text-primary shrink-0" />
                      <span className="text-xs font-bold text-foreground truncate">Constancia_Laboral.pdf</span>
                    </div>
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="size-4 text-primary shrink-0" />
                      <span className="text-xs font-bold text-foreground truncate">Certificacion_Ingles.pdf</span>
                    </div>
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2.5">
                  <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Expediente listo para postulación directa y contratación formal en menos de 24 horas.</span>
                </div>
              </Card>
            </div>

          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Explanation */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-xs px-3 py-1 rounded-full">
                  Validación Legal Corporativa
                </Badge>
                <h3 className="text-xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Insignia Oficial de 13 Puntos Fiscales SAT
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                  Las empresas verificadas en K&apos;anPro reciben hasta 4x más postulaciones de candidatos calificados. Validamos la autenticidad jurídica para garantizar un entorno seguro de contratación.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/60">
                  <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">Razón Social y Régimen SAT</h4>
                    <p className="text-xs text-muted-foreground">Validación de Persona Moral o Persona Física con Actividad Empresarial y RFC activo.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/60">
                  <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FileCheck className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">Acta Constitutiva y Poder Notarial</h4>
                    <p className="text-xs text-muted-foreground">Cotejo de facultades legales del representante ante notario público.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/60">
                  <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">Insignia de Empresa Verificada</h4>
                    <p className="text-xs text-muted-foreground">Tus ofertas se destacan automáticamente sobre cualquier publicación no validada.</p>
                  </div>
                </div>
              </div>

              <Button
                render={<Link href="/register/company" />}
                className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs gap-2 cursor-pointer"
              >
                <span>Registrar Empresa y Validar Cuenta</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>

            {/* Right Column: Visual Mockup */}
            <div className="lg:col-span-6">
              <Card className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-primary/10 text-primary font-extrabold flex items-center justify-center text-sm shadow-2xs">
                      <Building2 className="size-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                        Operadora de Hoteles Maya S.A. de C.V.
                      </h4>
                      <p className="text-xs text-muted-foreground font-semibold">RFC: OHM180412ABC • Hotelería & Turismo</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold text-xs">
                    Auditado SAT
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-foreground">Checklist de 13 Requisitos Legales</span>
                    <span className="text-emerald-600 font-mono">13 de 13 Completados</span>
                  </div>
                  <Progress value={100} className="h-2.5 bg-muted" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-muted-foreground pt-1">
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Acta Constitutiva</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Constancia SAT</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Poder Notarial</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">INE Rep. Legal</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-foreground font-semibold flex items-center gap-2.5">
                  <ShieldCheck className="size-5 text-primary shrink-0" />
                  <span>Sello Corporativo K&apos;anPro activo en todas tus ofertas laborales del Sureste.</span>
                </div>
              </Card>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
