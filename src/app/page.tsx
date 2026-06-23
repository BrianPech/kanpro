"use client";

import React from "react";
import Link from "next/link";
import { 
  Layers,
  Kanban,
  Users,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { HowItWorks } from "@/components/how-it-works";
import { CtaBanner } from "@/components/cta-banner";
import { PricingSection } from "@/components/pricing-section";
import { JobsBanner } from "@/components/jobs-banner";
import { Footer } from "@/components/footer";

export default function Home() {

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <Navbar />

      {/* Main content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 lg:px-8 py-6 md:py-10">
          <HeroSection />
        </section>

        {/* Features section */}
        <section id="features" className="py-[88px] border-t border-border bg-muted/10 relative">
          <div className="container mx-auto px-6">
            
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="font-sans font-medium text-3xl md:text-[40px] leading-[1.2] tracking-[-0.4px] text-foreground">
                Conexión Real para Negocios Reales
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
                Simplificamos la búsqueda de empleo en Playa del Carmen eliminando los procesos burocráticos y uniendo a las partes de forma directa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="p-8 rounded-[20px] border border-border/60 dark:border-border/10 bg-card transition-colors duration-300">
                <div className="size-12 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Layers className="size-6" />
                </div>
                <h3 className="text-[20px] font-medium leading-[1.4] text-foreground mb-3">Buscador Geográfico / Por Zona</h3>
                <p className="text-[14px] font-normal leading-[1.43] text-muted-foreground">
                  Filtra vacantes y candidatos por cercanía, sector o fraccionamiento en Playa del Carmen, reduciendo los tiempos de traslado diarios.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-[20px] border border-border/60 dark:border-border/10 bg-card transition-colors duration-300">
                <div className="size-12 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Briefcase className="size-6" />
                </div>
                <h3 className="text-[20px] font-medium leading-[1.4] text-foreground mb-3">Contacto Directo por WhatsApp</h3>
                <p className="text-[14px] font-normal leading-[1.43] text-muted-foreground">
                  Olvídate de las esperas en chats internos lentos. Inicia una conversación directa con el reclutador o candidato con un solo click.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-[20px] border border-border/60 dark:border-border/10 bg-card transition-colors duration-300">
                <div className="size-12 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Users className="size-6" />
                </div>
                <h3 className="text-[20px] font-medium leading-[1.4] text-foreground mb-3">Sello de Calidad K'anPro</h3>
                <p className="text-[14px] font-normal leading-[1.43] text-muted-foreground">
                  Revisamos y validamos manualmente los perfiles locales para asegurar que las empresas conecten con personas reales y confiables.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Cómo funciona section */}
        <HowItWorks />

        {/* CTA Banner */}
        <CtaBanner />

        {/* Precios section */}
        <PricingSection />

        {/* Jobs Discovery Banner */}
        <JobsBanner />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
