"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  MapPin, 
  ArrowRight, 
  Navigation,
  Users
} from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function LocalZonesCoverage() {
  const [selectedCity, setSelectedCity] = useState<"merida" | "quintana_roo">("merida");

  const meridaZones = [
    { name: "Mérida Centro & Santiago", type: "Gastronomía, Comercio y Hotelería", openJobs: 42, activeCandidates: 280 },
    { name: "Altabrisa & Vista Alegre", type: "Corporativo, Salud y Comercio", openJobs: 38, activeCandidates: 215 },
    { name: "Paseo de Montejo & Itzimná", type: "Restaurantes, Boutiques y Servicios", openJobs: 29, activeCandidates: 190 },
    { name: "Ciudad Caucel & Poniente", type: "Servicios Generales, Operativo y Logística", openJobs: 35, activeCandidates: 340 },
    { name: "Francisco de Montejo & Las Américas", type: "Comercio, Retail y Administrativo", openJobs: 24, activeCandidates: 220 },
    { name: "Chuburná & Cordemex / Periférico", type: "Industrial, Almacén y Distribución", openJobs: 31, activeCandidates: 175 },
  ];

  const qrooZones = [
    { name: "Playa del Carmen Centro & 5ta Av.", type: "Hotelería, Bares, Spas y Retail", openJobs: 56, activeCandidates: 410 },
    { name: "Playacar & Zona Turística", type: "Resorts All-Inclusive y Mantenimiento", openJobs: 44, activeCandidates: 320 },
    { name: "Cancún Centro & Av. Tulum", type: "Corporativo, Servicios y Comercio", openJobs: 48, activeCandidates: 390 },
    { name: "Cancún Zona Hotelera & Puerto Cancún", type: "Gastronomía de Lujo y Hotelería", openJobs: 62, activeCandidates: 450 },
    { name: "Tulum & Aldea Zama", type: "Eco-Hoteles, Boutiques y Bienestar", openJobs: 33, activeCandidates: 210 },
    { name: "Cozumel & Riviera Maya Sur", type: "Turismo, Buceo y Operación Hotelera", openJobs: 22, activeCandidates: 160 },
  ];

  const currentZones = selectedCity === "merida" ? meridaZones : qrooZones;

  return (
    <section id="zonas" className="py-16 sm:py-24 border-t border-border/60 bg-muted/10 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[450px] h-[450px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10 space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
          <div className="space-y-3 text-left">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold text-xs px-3 py-1 rounded-full">
              <Navigation className="size-3.5 mr-1.5" />
              Cobertura Geográfica en el Sureste
            </Badge>
            
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              El talento indicado en la colonia correcta
            </h2>
            
            <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-xl">
              Reducir los tiempos diarios de transporte es la clave para evitar la rotación laboral. Conectamos empresas y profesionales por zonas estratégicas.
            </p>
          </div>

          {/* City Toggle Buttons */}
          <div className="inline-flex p-1.5 rounded-2xl bg-card border border-border shadow-xs self-start md:self-auto">
            <button
              onClick={() => setSelectedCity("merida")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                selectedCity === "merida"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              <MapPin className="size-4" />
              <span>Mérida, Yucatán</span>
            </button>

            <button
              onClick={() => setSelectedCity("quintana_roo")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                selectedCity === "quintana_roo"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
            >
              <MapPin className="size-4" />
              <span>Quintana Roo & Riviera</span>
            </button>
          </div>
        </div>

        {/* Zones Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {currentZones.map((zone, idx) => (
            <Card 
              key={idx} 
              className="bg-card border border-border/70 hover:border-primary/50 transition-all duration-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs hover:shadow-sm text-left flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="size-4" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {zone.openJobs} vacantes activas
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-foreground tracking-tight">
                  {zone.name}
                </h3>

                <p className="text-xs text-muted-foreground font-medium leading-snug">
                  {zone.type}
                </p>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Users className="size-3.5 text-primary" />
                  {zone.activeCandidates} candidatos locales
                </span>

                <Link
                  href="/dashboard/candidate/discovery"
                  className="font-bold text-primary hover:underline text-xs flex items-center gap-1"
                >
                  <span>Explorar</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Local Advantage Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-extrabold text-foreground">
              ¿Tu empresa opera en otra localidad del Sureste?
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              K&apos;anPro cubre Valladolid, Progreso, Umán, Kanasín, Cozumel, Chetumal y toda la península.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              nativeButton={false}
              render={<Link href="/register/company" />}
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs gap-2 cursor-pointer"
            >
              <span>Publicar en mi Zona</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

      </div>
    </section>
  );
}
