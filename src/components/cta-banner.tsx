"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Hotel, ChefHat, MessageSquare, Users, Briefcase, MapPin, Kanban } from "lucide-react";
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
        "flex size-10 items-center justify-center rounded-full border border-border bg-card dark:bg-card/90 dark:border-border/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-foreground/80 transition-transform hover:scale-110 z-20",
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
              {/* Arrow pointing left */}
              <div className="size-1.5 rotate-45 border-b border-l border-border dark:border-border/15 bg-card dark:bg-[#16181a] -mr-[4px] z-10" />
              <div className="bg-card dark:bg-[#16181a] border border-border dark:border-border/15 text-foreground dark:text-neutral-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                {label}
              </div>
            </>
          )}
          {labelPosition === "left" && (
            <>
              <div className="bg-card dark:bg-[#16181a] border border-border dark:border-border/15 text-foreground dark:text-neutral-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                {label}
              </div>
              {/* Arrow pointing right */}
              <div className="size-1.5 rotate-45 border-t border-r border-border dark:border-border/15 bg-card dark:bg-[#16181a] -ml-[4px] z-10" />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function CtaBanner() {
  return (
    <section className="container mx-auto px-6 py-16 md:py-24" id="cta-banner">
      <div className="relative rounded-[24px] bg-card border border-border/80 dark:border-border/10 overflow-hidden min-h-[480px] grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-12 lg:p-16 items-center">
        
        {/* Subtle Stripe / Grid Overlay */}
        <div className="absolute inset-0 text-neutral-900/[0.01] dark:text-white/[0.02] pointer-events-none" 
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 12px)",
            backgroundSize: "24px 24px"
          }} 
        />

        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-6 flex flex-col justify-center text-left relative z-10 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 self-start bg-primary/10 dark:bg-primary/20 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full">
            <Sparkles className="size-3.5 fill-primary/10" />
            <span>Nuestra Plataforma</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
            ¿Listo para contratar en la <span className="text-primary">Riviera Maya</span>?
          </h2>

          {/* Subheading */}
          <p className="text-muted-foreground text-sm sm:text-base font-normal leading-relaxed max-w-xl">
            Conectamos de forma directa al mejor talento de Playa del Carmen con hoteles, restaurantes, spas y comercios locales. Sin intermediarios, sin burocracia y directo a WhatsApp.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
            <Button 
              className="h-12 px-6 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm tracking-[0.24px] transition-all duration-200 border-none shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group cursor-pointer" 
              asChild
            >
              <Link href="/register/company">
                Publicar Vacante Gratis
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button 
              variant="outline"
              className="h-12 px-6 rounded-full border border-border hover:bg-muted text-foreground font-semibold text-sm tracking-[0.24px] transition-all duration-200 cursor-pointer" 
              asChild
            >
              <Link href="/discovery">
                Explorar Candidatos
              </Link>
            </Button>
          </div>
        </div>

        {/* Right Column: Orbiting Circles Graphic */}
        <div className="lg:col-span-6 flex items-center justify-center relative min-h-[380px] lg:min-h-[440px] overflow-hidden">
          
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full bg-primary/10 dark:bg-primary/5 blur-[80px] pointer-events-none" />

          {/* Scaled Graphic Container */}
          <div className="absolute inset-0 flex items-center justify-center scale-[0.8] sm:scale-95 lg:scale-100 xl:scale-105 transition-transform duration-300">
            
            {/* Outer Circle (Radius 160) */}
            <OrbitingCircles radius={160} duration={28} reverse={true} iconSize={40}>
              <OrbitingIconWithLabel 
                icon={<MessageSquare className="size-5" />} 
                label="WhatsApp Directo" 
                labelPosition="right"
                iconClass="text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5 dark:bg-emerald-500/20"
              />
              <OrbitingIconWithLabel 
                icon={<Users className="size-5" />} 
                label="Candidatos Activos" 
                labelPosition="left"
                iconClass="text-primary bg-primary/10 border-primary/20 shadow-primary/5 dark:bg-primary/20"
              />
              <OrbitingIconWithLabel 
                icon={<MapPin className="size-5" />} 
                label="Filtro por Zona" 
                labelPosition="right"
                iconClass="text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5 dark:bg-amber-500/20"
              />
              <OrbitingIconWithLabel 
                icon={<Briefcase className="size-5" />} 
                iconClass="text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5 dark:bg-blue-500/20"
              />
            </OrbitingCircles>

            {/* Inner Circle (Radius 88) */}
            <OrbitingCircles radius={88} duration={20} reverse={false} iconSize={40}>
              <OrbitingIconWithLabel 
                icon={<Hotel className="size-5" />} 
                label="Hotelería" 
                labelPosition="left"
                iconClass="text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5 dark:bg-purple-500/20"
              />
              <OrbitingIconWithLabel 
                icon={<ChefHat className="size-5" />} 
                label="Gastronomía" 
                labelPosition="right"
                iconClass="text-orange-500 bg-orange-500/10 border-orange-500/20 shadow-orange-500/5 dark:bg-orange-500/20"
              />
              <OrbitingIconWithLabel 
                icon={<Sparkles className="size-5" />} 
                iconClass="text-teal-500 bg-teal-500/10 border-teal-500/20 shadow-teal-500/5 dark:bg-teal-500/20"
              />
            </OrbitingCircles>

            {/* Center Brand Icon */}
            <div className="relative z-30 flex size-16 items-center justify-center rounded-[20px] bg-gradient-to-tr from-primary to-primary-bright shadow-[0_0_35px_rgba(73,79,223,0.35)] text-primary-foreground border border-white/10 dark:border-white/5 transition-transform hover:scale-105 duration-300">
              <Kanban className="size-7 fill-white/10" />
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
