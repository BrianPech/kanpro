"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

export function RegionalIndex() {
  const [selectedRegion, setSelectedRegion] = useState<"yucatan" | "qroo">("yucatan");

  const yucatanCorridors = [
    { name: "Mérida Centro & Paseo de Montejo", focus: "Hotelería boutique, Gastronomía de autor, Corporativo", metric: "35+ Empresas" },
    { name: "Altabrisa & Periférico Norte", focus: "Salud especializada, Retail, Gastronomía, Automotriz", metric: "48+ Empresas" },
    { name: "García Ginerés & Colonia México", focus: "Servicios profesionales, Consultorías, Oficinas", metric: "24+ Empresas" },
    { name: "Francisco de Montejo & Chuburná", focus: "Comercio local, Logística urbana, Talleres y Alimentos", metric: "30+ Empresas" },
    { name: "Ciudad Caucel & Las Américas", focus: "Comercio vecinal, Farmacias, Cadenas y Sucursales", metric: "28+ Empresas" },
    { name: "Umán & Corredor Industrial", focus: "Manufactura, Almacenamiento, Distribución y CEDIS", metric: "19+ Empresas" },
  ];

  const qrooCorridors = [
    { name: "Playa del Carmen Centro & 5ta Avenida", focus: "Turismo internacional, Restaurantes, Clubes, Retail", metric: "52+ Empresas" },
    { name: "Playacar & Zona Ejidal", focus: "Hotelería, Mantenimiento técnico, Servicios de playa", metric: "34+ Empresas" },
    { name: "Cancún Centro & Av. Tulum", focus: "Clínicas, Comercio metropolitano, Sector administrativo", metric: "41+ Empresas" },
    { name: "Cancún Zona Hotelera & Huayacán", focus: "Hospitalidad de lujo, Restaurantes, A&B, Residencial", metric: "45+ Empresas" },
    { name: "Tulum Centro & La Veleta", focus: "Eco-hotelería, Hospitalidad, Wellness, Gastronomía", metric: "29+ Empresas" },
    { name: "Cozumel & Puerto Morelos", focus: "Operación de muelles, Buceo, Transporte marítimo", metric: "18+ Empresas" },
  ];

  const corridors = selectedRegion === "yucatan" ? yucatanCorridors : qrooCorridors;

  return (
    <section id="zonas" className="py-16 sm:py-24 border-b border-border bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-left">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground uppercase">
              <MapPin className="size-4 text-foreground" />
              <span>COBERTURA TERRITORIAL DE EMPLEO</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground font-sans">
              Corredores económicos activos en la Península
            </h2>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-card border border-border self-start md:self-auto">
            <button
              onClick={() => setSelectedRegion("yucatan")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedRegion === "yucatan"
                  ? "bg-foreground text-background shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mérida, Yucatán
            </button>
            <button
              onClick={() => setSelectedRegion("qroo")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedRegion === "qroo"
                  ? "bg-foreground text-background shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Quintana Roo & Riviera Maya
            </button>
          </div>
        </div>

        {/* Matrix Grid of Corridors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {corridors.map((c, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-border bg-card hover:border-foreground transition-all space-y-3 shadow-2xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-foreground font-sans leading-snug">
                    {c.name}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    {c.metric}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {c.focus}
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between font-mono text-[11px]">
                <Link
                  href={`/dashboard/candidate/discovery?loc=${encodeURIComponent(c.name.split(" ")[0])}`}
                  className="font-bold text-foreground hover:underline inline-flex items-center gap-1"
                >
                  <span>Explorar vacantes</span>
                  <ArrowRight className="size-3" />
                </Link>
                <span className="text-muted-foreground">Filtro &lt; 3 km</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
