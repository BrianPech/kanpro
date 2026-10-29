"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  PlusCircle, 
  Users, 
  MessageSquare, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  UserCheck, 
  FileCheck, 
  Clock 
} from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<"hire" | "work">("hire");

  const employerSteps = [
    {
      step: "01",
      icon: PlusCircle,
      title: "1. Publica tu vacante en 4 pasos",
      description: "Define el puesto, el rango salarial en pesos (MXN), la colonia específica y selecciona beneficios como IMSS, propinas, comedor o transporte.",
      mockup: (
        <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-2.5 text-left text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
            <span className="font-extrabold text-foreground">Nueva Vacante</span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.2 rounded-full">Paso 2 de 4</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">Puesto requerido:</span>
            <div className="font-extrabold text-foreground bg-muted/50 p-2 rounded-lg">Cocinero A - Mérida Centro</div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground pt-1">
            <span>Sueldo: $13,500 MXN</span>
            <span className="text-primary">IMSS + Propinas</span>
          </div>
        </div>
      ),
    },
    {
      step: "02",
      icon: Users,
      title: "2. Recibe y gestiona candidatos",
      description: "Monitorea tu Applications Inbox en tiempo real. Organiza a tus postulantes en estados: Pendientes, En revisión o Preseleccionados.",
      mockup: (
        <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-2.5 text-left text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
            <span className="font-extrabold text-foreground">Applications Inbox</span>
            <Badge className="text-[9px] font-bold bg-indigo-500/10 text-indigo-600">3 Nuevos</Badge>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 flex items-center justify-between">
            <div>
              <div className="font-extrabold text-foreground">Mauricio Romero</div>
              <div className="text-[10px] text-muted-foreground">Mérida Centro (a 1.5 km)</div>
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">★ 4.9</span>
          </div>
        </div>
      ),
    },
    {
      step: "03",
      icon: MessageSquare,
      title: "3. Contacto directo por WhatsApp",
      description: "Abre un chat directo con el candidato en WhatsApp sin fricción. Agenda entrevistas presenciales o por videollamada de inmediato.",
      mockup: (
        <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-2.5 text-left text-xs">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold pb-1.5 border-b border-border/50">
            <MessageSquare className="size-3.5" />
            <span>Chat de WhatsApp Listo</span>
          </div>
          <p className="text-[11px] italic text-foreground bg-muted/50 p-2.5 rounded-lg leading-snug">
            {'"Hola Mauricio, vimos tu perfil en K\'anPro y nos gustaría agendar tu entrevista mañana a las 11:00 AM..."'}
          </p>
        </div>
      ),
    },
  ];

  const candidateSteps = [
    {
      step: "01",
      icon: FileCheck,
      title: "1. Crea tu CV y Expediente Digital",
      description: "Sube tu INE, CURP y constancias una sola vez. Alcanza el 100% de nivel de expediente para tener prioridad máxima ante los reclutadores.",
      mockup: (
        <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-2 text-left text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-border/50">
            <span className="font-extrabold text-foreground">Expediente Laboral</span>
            <span className="text-primary font-bold font-mono">100%</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1 text-foreground"><CheckCircle2 className="size-3 text-emerald-500" /> INE Cotejada</span>
            <span className="flex items-center gap-1 text-foreground"><CheckCircle2 className="size-3 text-emerald-500" /> CURP Oficial</span>
            <span className="flex items-center gap-1 text-foreground"><CheckCircle2 className="size-3 text-emerald-500" /> Comprobante</span>
            <span className="flex items-center gap-1 text-foreground"><CheckCircle2 className="size-3 text-emerald-500" /> Constancias</span>
          </div>
        </div>
      ),
    },
    {
      step: "02",
      icon: MapPin,
      title: "2. Filtra vacantes por cercanía",
      description: "Explora oportunidades de empleo cerca de tu casa en Mérida o Quintana Roo. Visualiza el salario real y todas las prestaciones.",
      mockup: (
        <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-2 text-left text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-border/50">
            <span className="font-extrabold text-foreground">Restaurante Altabrisa</span>
            <span className="font-mono font-bold text-emerald-600">$15,000/mes</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="size-3 text-primary" />
            <span>A 1.2 km de tu casa (10 min en transporte)</span>
          </div>
        </div>
      ),
    },
    {
      step: "03",
      icon: MessageSquare,
      title: "3. Postúlate y conecta por WhatsApp",
      description: "Aplica con un solo clic y envía tu expediente directamente al departamento de recursos humanos para confirmar tu entrevista.",
      mockup: (
        <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-2 text-left text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-border/50">
            <span className="font-extrabold text-foreground">Postulación Enviada</span>
            <Badge className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600">Exitosa</Badge>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-2">
            <MessageSquare className="size-3.5 text-emerald-600" />
            <span>¡Reclutador notificado en WhatsApp!</span>
          </div>
        </div>
      ),
    },
  ];

  const currentSteps = activeTab === "hire" ? employerSteps : candidateSteps;

  return (
    <section className="py-16 sm:py-24 border-t border-border/60 bg-background relative overflow-hidden">
      
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10 space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
          <div className="space-y-3 text-left">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold text-xs px-3 py-1 rounded-full">
              <Clock className="size-3.5 mr-1.5 text-primary" />
              Proceso Transparente
            </Badge>
            
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Cómo funciona K&apos;anPro
            </h2>
            
            <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-xl">
              Diseñado para que empresas y candidatos cierren contrataciones en cuestión de horas en lugar de semanas.
            </p>
          </div>

          {/* Toggle pill selector */}
          <div className="inline-flex p-1.5 rounded-2xl bg-card border border-border shadow-xs self-start md:self-auto">
            <button
              onClick={() => setActiveTab("hire")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === "hire"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              <Building2 className="size-4" />
              <span>Para Contratar</span>
            </button>

            <button
              onClick={() => setActiveTab("work")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === "work"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              <UserCheck className="size-4" />
              <span>Para Trabajar</span>
            </button>
          </div>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {currentSteps.map((item, index) => {
            const Icon = item.icon;

            return (
              <div 
                key={index} 
                className="flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-muted/20 border border-border/70 hover:border-primary/50 transition-all duration-200 shadow-2xs hover:shadow-xs space-y-6 text-left"
              >
                <div className="space-y-4">
                  {/* Step number badge & Icon */}
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm shadow-2xs">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-xl font-extrabold font-mono text-muted-foreground/50">
                      {item.step}
                    </span>
                  </div>

                  {/* Text Content */}
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Micro Mockup preview */}
                <div className="pt-2">
                  {item.mockup}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Bar */}
        <div className="pt-4 flex justify-center">
          <Button
            render={
              <Link 
                href={activeTab === "hire" ? "/register/company" : "/register/candidate"} 
              />
            }
            className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm shadow-xs gap-2 cursor-pointer"
          >
            <span>{activeTab === "hire" ? "Comenzar como Empresa Gratis" : "Crear mi Perfil de Candidato"}</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>

      </div>
    </section>
  );
}
