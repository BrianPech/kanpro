"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Briefcase, 
  User, 
  DollarSign, 
  Layers, 
  Send, 
  Star 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<"hire" | "work">("hire");

  return (
    <section className="py-12 md:py-[88px] border-t border-border bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-6xl">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-16">
          <div className="space-y-3 text-left">
            <h2 className="font-sans font-medium text-3xl md:text-[40px] leading-[1.2] tracking-[-0.4px] text-foreground">
              Cómo funciona
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
              K&apos;anPro facilita la conexión y contratación directa entre candidatos y empresas de Felipe Carrillo Puerto en tres sencillos pasos.
            </p>
          </div>

          {/* Toggle pill selector */}
          <div className="inline-flex p-1 rounded-full bg-muted/50 border border-border shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("hire")}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                activeTab === "hire"
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              Para contratar
            </button>
            <button
              onClick={() => setActiveTab("work")}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                activeTab === "work"
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              Para trabajar
            </button>
          </div>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          {activeTab === "hire" ? (
            // Employers Flow
            <>
              {/* Step 1 */}
              <div className="flex flex-col items-stretch space-y-4 group">
                <div className="aspect-[1.6] rounded-[20px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/60 dark:border-border/10 p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 relative">
                  
                  {/* Mock UI: Job Creator */}
                  <div className="w-full bg-background border border-border/60 dark:border-border/15 rounded-[12px] p-4 space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Nueva vacante</span>
                      <span className="size-2 rounded-full bg-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold text-foreground">Título del puesto:</div>
                      <div className="text-xs font-bold text-foreground border border-border/60 dark:border-border/15 rounded-[8px] px-2.5 py-1.5 bg-muted/30">
                        Cocinero A - Colonia Centro
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-1 text-[9px] text-muted-foreground">
                      <span>Sueldo: $12,500 MXN/mes</span>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Urgente</span>
                    </div>
                  </div>

                  <div className="absolute bottom-3 right-3 size-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                </div>
                <div className="text-left space-y-1.5 px-1">
                  <h3 className="text-[16px] font-semibold leading-[1.5] tracking-[0.16px] text-foreground">1. Publica tu vacante gratis</h3>
                  <p className="text-[14px] font-normal leading-[1.43] text-muted-foreground">
                    Crea tu vacante en segundos. Define el perfil, la zona específica de la ciudad y el sueldo ofrecido sin formularios complejos.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-stretch space-y-4 group">
                <div className="aspect-[1.6] rounded-[20px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/60 dark:border-border/10 p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 relative">
                  
                  {/* Mock UI: AI Match Proposal */}
                  <div className="w-full bg-background border border-border/60 dark:border-border/15 rounded-[12px] p-4 space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                        SR
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">Sofia Rodriguez</div>
                        <div className="text-[9px] text-muted-foreground">Recepcionista Bilingüe</div>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                        Sello Calidad
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[8px] bg-muted px-2 py-0.5 rounded-[8px] text-muted-foreground font-semibold">Inglés Bilingüe</span>
                      <span className="text-[8px] bg-muted px-2 py-0.5 rounded-[8px] text-muted-foreground font-semibold">Servicio Cliente</span>
                      <span className="text-[8px] bg-muted px-2 py-0.5 rounded-[8px] text-muted-foreground font-semibold">Colonia Centro</span>
                    </div>
                  </div>

                  <div className="absolute bottom-3 right-3 size-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                </div>
                <div className="text-left space-y-1.5 px-1">
                  <h3 className="text-[16px] font-semibold leading-[1.5] tracking-[0.16px] text-foreground">2. Contacto directo por WhatsApp</h3>
                  <p className="text-[14px] font-normal leading-[1.43] text-muted-foreground">
                    Explora el catálogo de candidatos locales por zona. Selecciona a tu candidato e inicia un chat directo con un solo click.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-stretch space-y-4 group">
                <div className="aspect-[1.6] rounded-[20px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/60 dark:border-border/10 p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 relative">
                  
                  {/* Mock UI: WhatsApp Template */}
                  <div className="w-full bg-background border border-border/60 dark:border-border/15 rounded-[12px] p-4 space-y-3 text-left">
                    <div className="flex items-center justify-between border-b border-border/60 dark:border-border/15 pb-2">
                      <span className="text-[10px] font-bold text-foreground flex items-center gap-1">
                        <Layers className="size-3 text-primary" /> Contacto Directo
                      </span>
                      <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-full">Plantilla OK</span>
                    </div>
                    <div className="space-y-1.5 border border-primary/20 bg-primary/5 rounded-lg p-2">
                      <div className="text-[8px] text-primary font-bold">Mensaje a enviar:</div>
                      <div className="text-[9px] italic text-foreground leading-snug">
                        "Hola Sofia, vi tu perfil en K'anPro y nos interesa agendar una entrevista..."
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-3 right-3 size-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                </div>
                <div className="text-left space-y-1.5 px-1">
                  <h3 className="text-[16px] font-semibold leading-[1.5] tracking-[0.16px] text-foreground">3. Contratación inmediata</h3>
                  <p className="text-[14px] font-normal leading-[1.43] text-muted-foreground">
                    Realiza la entrevista y coordina los términos de contratación directamente en WhatsApp. Contrata en horas en lugar de semanas.
                  </p>
                </div>
              </div>
            </>
          ) : (
            // Candidates Flow
            <>
              {/* Step 1 */}
              <div className="flex flex-col items-stretch space-y-4 group">
                <div className="aspect-[1.6] rounded-[20px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/60 dark:border-border/10 p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 relative">
                  
                  {/* Mock UI: Professional Profile */}
                  <div className="w-full bg-background border border-border/60 dark:border-border/15 rounded-[12px] p-4 space-y-3.5 text-left">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <User className="size-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Mateo Silva</div>
                        <div className="text-[9px] text-muted-foreground">Bartender / Mixólogo</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold">
                      <Star className="size-3.5 fill-amber-500" />
                      <Star className="size-3.5 fill-amber-500" />
                      <Star className="size-3.5 fill-amber-500" />
                      <Star className="size-3.5 fill-amber-500" />
                      <Star className="size-3.5 fill-amber-500" />
                      <span className="text-muted-foreground text-[9px] font-normal ml-1">(42 opiniones)</span>
                    </div>
                    <div className="border-t border-border/60 dark:border-border/15 pt-2 flex items-center justify-between text-[9px] text-muted-foreground">
                      <span>Zona: Col. Emiliano Zapata, FCP</span>
                      <span className="font-bold text-foreground">$14,000/mes</span>
                    </div>
                  </div>

                  <div className="absolute bottom-3 right-3 size-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                </div>
                <div className="text-left space-y-1.5 px-1">
                  <h3 className="text-[16px] font-semibold leading-[1.5] tracking-[0.16px] text-foreground">1. Crea tu CV Premium</h3>
                  <p className="text-[14px] font-normal leading-[1.43] text-muted-foreground">
                    Muestra quién eres, qué sabes hacer, tu experiencia en Felipe Carrillo Puerto y la zona específica de la ciudad donde vives.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-stretch space-y-4 group">
                <div className="aspect-[1.6] rounded-[20px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/60 dark:border-border/10 p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 relative">
                  
                  {/* Mock UI: Application Tracker */}
                  <div className="w-full bg-background border border-border/60 dark:border-border/15 rounded-[12px] p-4 space-y-3.5 text-left">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-foreground">Auxiliar Administrativo</div>
                      <div className="text-[9px] text-muted-foreground">Restaurante Local Centro</div>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-border/60 dark:border-border/15">
                      <span className="text-[9px] text-muted-foreground font-semibold">Canal de postulación:</span>
                      <span className="bg-primary/10 text-primary text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Send className="size-2.5" /> WhatsApp Directo
                      </span>
                    </div>
                  </div>

                  <div className="absolute bottom-3 right-3 size-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                </div>
                <div className="text-left space-y-1.5 px-1">
                  <h3 className="text-[16px] font-semibold leading-[1.5] tracking-[0.16px] text-foreground">2. Explora y postúlate</h3>
                  <p className="text-[14px] font-normal leading-[1.43] text-muted-foreground">
                    Encuentra vacantes filtrando por cercanía a tu casa. Postúlate e inicia un chat de WhatsApp con el reclutador al instante.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-stretch space-y-4 group">
                <div className="aspect-[1.6] rounded-[20px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/60 dark:border-border/10 p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 relative">
                  
                  {/* Mock UI: Secure Payments */}
                  <div className="w-full bg-background border border-border/60 dark:border-border/15 rounded-[12px] p-4 space-y-3.5 text-left">
                    <div className="flex items-center justify-between border-b border-border/60 dark:border-border/15 pb-2">
                      <span className="text-[10px] font-bold text-foreground flex items-center gap-0.5">
                        <DollarSign className="size-3 text-primary" /> Entrevista Directa
                      </span>
                      <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <CheckCircle2 className="size-2.5" /> Confirmado
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground">Respuesta del Reclutador:</div>
                      <div className="text-[11px] italic text-foreground leading-snug">"¡Hola Mateo! Nos gustó tu CV. ¿Puedes presentarte mañana a las 10:00 AM?"</div>
                    </div>
                  </div>

                  <div className="absolute bottom-3 right-3 size-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                </div>
                <div className="text-left space-y-1.5 px-1">
                  <h3 className="text-[16px] font-semibold leading-[1.5] tracking-[0.16px] text-foreground">3. Contratación rápida</h3>
                  <p className="text-[14px] font-normal leading-[1.43] text-muted-foreground">
                    Coordina los detalles de la entrevista, acuerda las condiciones y comienza a trabajar rápido a través de WhatsApp.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </section>
  );
}
