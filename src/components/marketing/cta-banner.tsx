"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Building2, UserCheck, MessageSquare, ShieldCheck, MapPin, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import { cn } from "@/lib/utils";

interface OrbitingIconWithLabelProps {
  icon: React.ReactNode;
  label?: string;
  labelPosition?: "left" | "right";
  iconClass?: string;
}

function OrbitingIconWithLabel({
  icon,
  label,
  labelPosition = "right",
  iconClass,
}: OrbitingIconWithLabelProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Icon Circle */}
      <div className={cn(
        "flex size-10 items-center justify-center rounded-full border border-border bg-card shadow-xs text-foreground/80 transition-transform hover:scale-110 z-20",
        iconClass
      )}>
        {icon}
      </div>

      {/* Label Badge */}
      {label && (
        <div
          className={cn(
            "absolute flex items-center z-10 pointer-events-none transition-opacity duration-300",
            labelPosition === "left" ? "right-11 flex-row" : "left-11 flex-row"
          )}
        >
          {labelPosition === "right" && (
            <>
              <div className="size-1.5 rotate-45 border-b border-l border-border bg-card -mr-[4px] z-10" />
              <div className="bg-card border border-border text-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-xs">
                {label}
              </div>
            </>
          )}
          {labelPosition === "left" && (
            <>
              <div className="bg-card border border-border text-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-xs">
                {label}
              </div>
              <div className="size-1.5 rotate-45 border-t border-r border-border bg-card -ml-[4px] z-10" />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function CtaBanner() {
  return (
    <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24" id="cta-banner">
      <div className="relative rounded-[32px] bg-card border border-border/80 overflow-hidden min-h-[460px] grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-12 lg:p-16 items-center shadow-sm">
        
        {/* Subtle Background Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px"
          }} 
        />

        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-6 flex flex-col justify-center text-left relative z-10 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 self-start bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-3.5 py-1 rounded-full">
            <Sparkles className="size-3.5" />
            <span>Únete a la Red de Empleo del Sureste</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12]">
            ¿Listo para transformar tu forma de{" "}
            <span className="text-primary">contratar o trabajar</span>?
          </h2>

          {/* Subheading */}
          <p className="text-muted-foreground text-xs sm:text-base font-medium leading-relaxed max-w-xl">
            Conectamos en tiempo real a empresas y talento local en Mérida, Playa del Carmen, Cancún y la Riviera Maya. Sin intermediarios, sin comisiones y con verificación digital.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              render={<Link href="/register/company" />}
              className="h-12 px-7 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer" 
            >
              <Building2 className="size-4" />
              <span>Publicar Vacante Gratis</span>
              <ArrowRight className="size-4" />
            </Button>
            
            <Button 
              render={<Link href="/register/candidate" />}
              variant="outline"
              className="h-12 px-7 rounded-2xl border-border/80 hover:bg-muted text-foreground font-bold text-xs sm:text-sm cursor-pointer gap-2" 
            >
              <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Crear CV de Candidato</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Orbiting Graphic */}
        <div className="lg:col-span-6 flex items-center justify-center relative min-h-[340px] lg:min-h-[400px] overflow-hidden">
          
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full bg-primary/10 blur-[80px] pointer-events-none" />

          {/* Graphic Container */}
          <div className="absolute inset-0 flex items-center justify-center scale-[0.8] sm:scale-95 lg:scale-100 transition-transform duration-300">
            
            {/* Outer Circle */}
            <OrbitingCircles radius={150} duration={26} reverse={true} iconSize={40}>
              <OrbitingIconWithLabel 
                icon={<MessageSquare className="size-5 text-emerald-500" />} 
                label="WhatsApp Directo" 
                labelPosition="right"
                iconClass="bg-emerald-500/10 border-emerald-500/20"
              />
              <OrbitingIconWithLabel 
                icon={<ShieldCheck className="size-5 text-amber-500" />} 
                label="Verificación SAT" 
                labelPosition="left"
                iconClass="bg-amber-500/10 border-amber-500/20"
              />
              <OrbitingIconWithLabel 
                icon={<MapPin className="size-5 text-primary" />} 
                label="Filtro por Colonia" 
                labelPosition="right"
                iconClass="bg-primary/10 border-primary/20"
              />
            </OrbitingCircles>

            {/* Inner Circle */}
            <OrbitingCircles radius={80} duration={18} reverse={false} iconSize={36}>
              <OrbitingIconWithLabel 
                icon={<Building2 className="size-4.5 text-primary" />} 
                iconClass="bg-primary/10 border-primary/20"
              />
              <OrbitingIconWithLabel 
                icon={<UserCheck className="size-4.5 text-emerald-500" />} 
                iconClass="bg-emerald-500/10 border-emerald-500/20"
              />
            </OrbitingCircles>

            {/* Center Logo Icon */}
            <div className="relative z-30 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 duration-200">
              <Kanban className="size-7" />
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
