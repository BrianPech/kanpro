"use client";

import React from "react";
import Link from "next/link";
import { Check, ArrowRight, Building2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  const candidateList = [
    "CV Digital Profesional estructurado para el Sureste",
    "Filtro de vacantes por cercanía geográfica (< 3 km)",
    "Expediente Laboral Digital (INE, CURP, comprobante)",
    "Postulaciones ilimitadas en 1 solo clic",
    "Contacto directo por WhatsApp con la empresa",
    "Control de privacidad empresa por empresa (LFPDPPP)",
    "100% Gratuito de por vida — Sin cargos ocultos",
  ];

  const companyList = [
    "Publicación asistida con Wizard en 4 pasos",
    "Configuración de prestaciones de ley y superiores mexicanas",
    "Applications Inbox & Pipeline con calificaciones internas",
    "Contacto directo e inmediato al WhatsApp del aspirante",
    "Solicitud de acceso seguro a documentos del expediente",
    "Auditoría y Sello de Verificación Legal SAT (13 Puntos)",
    "0% de comisiones por contratación o colocación",
  ];

  return (
    <section id="tarifas" className="py-16 sm:py-24 border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-left">
        
        {/* Header Block */}
        <div className="space-y-2 max-w-3xl">
          <span className="text-[11px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
            [05] CONTRATO DE TARIFAS TRANSPARENTES
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground font-sans">
            Acceso directo. 0% de comisión sobre el salario.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono">
            No retenemos porcentajes sobre el sueldo de los trabajadores ni cobramos comisión por contratación a los negocios.
          </p>
        </div>

        {/* 2 Honest Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
          
          {/* Candidate Card */}
          <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card flex flex-col justify-between space-y-8 shadow-2xs">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="size-9 rounded-lg bg-muted flex items-center justify-center text-foreground">
                    <UserCheck className="size-4.5" />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    SIEMPRE GRATIS
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground font-sans">
                  Para Candidatos y Trabajadores
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Para profesionistas y operativos en Mérida, Playa del Carmen, Cancún y Tulum.
                </p>
              </div>

              <div className="flex items-baseline gap-2 py-3 border-y border-border">
                <span className="text-4xl font-black font-mono text-foreground">$0</span>
                <span className="text-xs font-mono text-muted-foreground">MXN / Siempre gratis de por vida</span>
              </div>

              <ul className="space-y-2.5">
                {candidateList.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-foreground font-medium">
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              render={<Link href="/register/candidate" />}
              className="w-full h-11 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-mono font-bold text-xs cursor-pointer shadow-2xs"
            >
              <span>Crear Cuenta de Candidato</span>
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </div>

          {/* Company Card */}
          <div className="p-6 sm:p-8 rounded-2xl border-2 border-foreground bg-card flex flex-col justify-between space-y-8 shadow-sm">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="size-9 rounded-lg bg-foreground text-background flex items-center justify-center">
                    <Building2 className="size-4.5" />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-foreground bg-muted border border-border px-2 py-0.5 rounded">
                    EMPRESAS SURESTE
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground font-sans">
                  Para Empresas y Negocios
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Para restaurantes, hoteles, talleres, constructoras, comercios y corporativos.
                </p>
              </div>

              <div className="flex items-baseline gap-2 py-3 border-y border-border">
                <span className="text-4xl font-black font-mono text-foreground">0%</span>
                <span className="text-xs font-mono text-muted-foreground">Comisión por contratación</span>
              </div>

              <ul className="space-y-2.5">
                {companyList.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-foreground font-medium">
                    <Check className="size-3.5 text-foreground shrink-0 mt-0.5 stroke-[2.5]" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              render={<Link href="/register/company" />}
              className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-mono font-bold text-xs cursor-pointer gap-1.5 shadow-2xs"
            >
              <span>Registrar Empresa y Publicar</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>

        </div>

      </div>
    </section>
  );
}
