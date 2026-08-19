"use client";

import React from "react";
import { Layers, Briefcase, Users } from "lucide-react";

export function FeaturesSection() {
  return (
    <section id="features" className="py-12 md:py-[88px] border-t border-border bg-muted/10 relative">
      <div className="container mx-auto px-6">
        
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16 space-y-4">
          <h2 className="font-sans font-medium text-3xl md:text-[40px] leading-[1.2] tracking-[-0.4px] text-foreground">
            Conexión Real para Negocios Reales
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Simplificamos la búsqueda de empleo en el sureste eliminando los procesos burocráticos y uniendo a las partes de forma directa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          
          {/* Feature 1 */}
          <div className="p-8 rounded-[20px] border border-border/60 dark:border-border/10 bg-card transition-colors duration-300">
            <div className="size-12 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary mb-6">
              <Layers className="size-6" />
            </div>
            <h3 className="text-[20px] font-medium leading-[1.4] text-foreground mb-3">Buscador Geográfico / Por Zona</h3>
            <p className="text-[14px] font-normal leading-[1.43] text-muted-foreground">
              Filtra vacantes y candidatos por cercanía, sector o zona en Mérida y Playa del Carmen, reduciendo los tiempos de traslado diarios.
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
  );
}
