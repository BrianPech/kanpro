"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CirclePercent,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Kanban,
  Scale,
  Lock,
  Headphones,
  Sparkles,
} from "@/components/ui/icons";

export function FeaturesDarkBand() {
  const features = [
    {
      title: "0% Comisiones por Éxito",
      description:
        "Sin deducciones de sueldos ni tarifas del 20% al 30% como las agencias de reclutamiento tradicionales.",
      icon: <CirclePercent className="size-6" />,
    },
    {
      title: "Contacto en 1-Clic por WhatsApp",
      description:
        "Inicia conversaciones directas con candidatos preseleccionados con plantillas de entrevista precargadas.",
      icon: <MessageSquare className="size-6" />,
    },
    {
      title: "Expedientes Auditados SAT",
      description:
        "Cotejo de RFC, Constancia de Situación Fiscal y Razón Social de 13 puntos para evitar fraudes.",
      icon: <ShieldCheck className="size-6" />,
    },
    {
      title: "Filtro Hiperlocal por Colonia",
      description:
        "Delimita vacantes en Mérida, Cancún y Playa del Carmen para priorizar personal a menos de 3.5 km.",
      icon: <MapPin className="size-6" />,
    },
    {
      title: "Pipeline Kanban en Vivo",
      description:
        "Controla cada postulación en tiempo real en etapas: en revisión, preseleccionado, citado y contratado.",
      icon: <Kanban className="size-6" />,
    },
    {
      title: "Cumplimiento LFT & NOM-035",
      description:
        "Módulos integrados para evaluaciones de clima laboral, actas administrativas y contratos digitales.",
      icon: <Scale className="size-6" />,
    },
    {
      title: "Protección de Datos LFPDPPP",
      description:
        "Documentos sensibles (INE, CURP) cifrados con acceso únicamente bajo autorización del trabajador.",
      icon: <Lock className="size-6" />,
    },
    {
      title: "Soporte Regional en el Sureste",
      description:
        "Asistencia dedicada para empresas y candidatos con equipo basado en Yucatán y Quintana Roo.",
      icon: <Headphones className="size-6" />,
    },
  ];

  return (
    <section id="features" className="w-full py-20 sm:py-28 lg:py-32 bg-transparent text-foreground relative overflow-hidden">
      
      {/* Sutil halo ambiental con tokens de shadcn */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-primary/5 blur-[140px]"
        aria-hidden="true"
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12 sm:space-y-16">
        
        {/* Section Header */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <Badge
            variant="outline"
            className="text-xs font-mono font-bold uppercase tracking-wider text-primary border-primary/20 bg-primary/5 px-3.5 py-1 rounded-full gap-1.5 shadow-2xs"
          >
            <Sparkles className="size-3.5" />
            <span>Suite de Operación y Contratación</span>
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground font-sans leading-[1.08] text-balance">
            Herramientas creadas para la realidad del Sureste
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground font-normal leading-relaxed text-balance">
            Todo lo necesario para publicar vacantes, verificar expedientes y vincular talento en Mérida, Cancún y la Riviera Maya sin fricción.
          </p>
        </div>

        {/* Aceternity-style Grid con tokens de shadcn */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>

      </div>
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col py-10 relative group/feature transition-colors duration-200 border-border",
        // Mobile (1 col)
        "border-b last:border-b-0",
        // Tablet (2 cols: md)
        "md:border-b md:last:border-b-0",
        index % 2 === 0 ? "md:border-l md:border-r" : "md:border-r",
        (index === 6 || index === 7) && "md:border-b-0",
        // Desktop (4 cols: lg)
        "lg:border-r",
        (index === 0 || index === 4) ? "lg:border-l" : "lg:border-l-0",
        index < 4 ? "lg:border-b" : "lg:border-b-0"
      )}
    >
      {/* Hover Background Gradients using shadcn muted token */}
      {index < 4 ? (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-t from-muted/60 to-transparent pointer-events-none" />
      ) : (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-b from-muted/60 to-transparent pointer-events-none" />
      )}

      {/* Icon */}
      <div className="mb-4 relative z-10 px-8 sm:px-10 text-muted-foreground group-hover/feature:text-primary transition-colors duration-200">
        {icon}
      </div>

      {/* Title with left pill indicator */}
      <div className="text-base sm:text-lg font-bold mb-2 relative z-10 px-8 sm:px-10 text-foreground">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-border group-hover/feature:bg-primary transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block">
          {title}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs sm:text-sm text-muted-foreground max-w-xs relative z-10 px-8 sm:px-10 leading-relaxed font-normal">
        {description}
      </p>
    </div>
  );
};
