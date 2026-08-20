"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MapPin, ArrowRight, Search } from "lucide-react";

export function CatalogueBand() {
  const [selectedZone, setSelectedZone] = useState("todos");
  const [activeSearch, setActiveSearch] = useState("");

  const vacancies = [
    {
      id: 1,
      title: "Cocinero A / Parrillero",
      company: "Grupo Gastronómico Montejo",
      zone: "merida_altabrisa",
      zoneName: "Mérida · Altabrisa",
      salary: "$14,500 MXN",
      period: "mensual bruto",
      benefits: ["IMSS Día 1", "Propinas", "Comedor", "Uniformes"],
      distance: "A 1.2 km de tu casa",
      badge: "Urgente",
    },
    {
      id: 2,
      title: "Recepcionista Bilingüe",
      company: "Hotel Boutique Riviera Maya",
      zone: "playa_carmen",
      zoneName: "Playa del Carmen · 5ta Av.",
      salary: "$16,800 MXN",
      period: "mensual bruto",
      benefits: ["IMSS", "Vales de Despensa", "Bono", "Transporte"],
      distance: "A 900 m de tu casa",
      badge: "Verificado SAT",
    },
    {
      id: 3,
      title: "Barista / Encargado de Barra",
      company: "Cafetería Especialidad Santa Ana",
      zone: "merida_centro",
      zoneName: "Mérida · Centro & Montejo",
      salary: "$12,500 MXN",
      period: "mensual bruto",
      benefits: ["IMSS", "Propinas Semanales", "Alimentos"],
      distance: "A 1.8 km de tu casa",
      badge: "Nuevo",
    },
    {
      id: 4,
      title: "Auxiliar Contable y Nóminas",
      company: "Operadora Turística del Caribe",
      zone: "cancun",
      zoneName: "Cancún · Av. Tulum",
      salary: "$15,200 MXN",
      period: "mensual bruto",
      benefits: ["Prestaciones de Ley", "Aguinaldo 30 Días", "Fondo"],
      distance: "A 2.5 km de tu casa",
      badge: "Verificado SAT",
    },
    {
      id: 5,
      title: "Mixólogo / Bartender",
      company: "Eco-Resort & Beach Club",
      zone: "tulum",
      zoneName: "Tulum · La Veleta",
      salary: "$18,000 MXN",
      period: "mensual bruto",
      benefits: ["IMSS", "Propinas Diarias", "Transporte Nocturno"],
      distance: "A 1.5 km de tu casa",
      badge: "Destacado",
    },
    {
      id: 6,
      title: "Chófer Repartidor Local",
      company: "Distribuidora Peninsular de Alimentos",
      zone: "merida_centro",
      zoneName: "Mérida · García Ginerés",
      salary: "$13,800 MXN",
      period: "mensual bruto",
      benefits: ["IMSS", "Bono de Ruta", "Seguro de Vida"],
      distance: "A 3.1 km de tu casa",
      badge: "Urgente",
    },
  ];

  const filtered = vacancies.filter((v) => {
    const matchesZone = selectedZone === "todos" || v.zone === selectedZone;
    const matchesQuery = activeSearch === "" || 
      v.title.toLowerCase().includes(activeSearch.toLowerCase()) ||
      v.company.toLowerCase().includes(activeSearch.toLowerCase()) ||
      v.zoneName.toLowerCase().includes(activeSearch.toLowerCase());
    return matchesZone && matchesQuery;
  });

  return (
    <section id="vacantes" className="bg-[var(--color-fiord-50)] text-[var(--color-fiord-950)] py-20 sm:py-28 border-b border-[var(--color-fiord-200)] text-left">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <span className="text-[13px] font-bold text-[var(--color-fiord-800)] tracking-[0.24px] uppercase block font-mono">
            Catálogo de Empleo Directo
          </span>
          
          <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.48px] leading-[1.08] text-[var(--color-fiord-950)] font-sans">
            Explora vacantes verificadas en tu colonia
          </h2>
          
          <p className="text-base sm:text-lg text-[var(--color-fiord-700)] font-normal leading-relaxed tracking-[0.24px]">
            Sin intermediarios ni ofertas fantasma. Salarios reales en pesos (MXN) con desglose de prestaciones y ubicación exacta.
          </p>
        </div>

        {/* Search Bar & Filter Chips */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[var(--color-fiord-600)]" />
              <input
                type="text"
                value={activeSearch}
                onChange={(e) => setActiveSearch(e.target.value)}
                placeholder="Buscar por puesto (ej. Cocinero, Recepcionista, Barista, Chofer)..."
                className="w-full h-12 pl-11 pr-4 rounded-[12px] bg-white border border-[var(--color-fiord-200)] text-[15px] text-[var(--color-fiord-950)] placeholder:text-[var(--color-fiord-600)] focus:outline-none focus:border-[var(--color-fiord-950)] transition-colors shadow-2xs font-medium"
              />
            </div>

            <Link
              href="/dashboard/candidate/discovery"
              className="h-12 px-6 rounded-full bg-[var(--color-fiord-950)] text-white hover:bg-[var(--color-fiord-900)] font-semibold text-[14px] flex items-center justify-center gap-2 shrink-0 transition-colors shadow-xs"
            >
              <span>Ver todas las vacantes</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[
              { id: "todos", label: "Todas las Zonas" },
              { id: "merida_altabrisa", label: "Mérida Altabrisa" },
              { id: "merida_centro", label: "Mérida Centro" },
              { id: "playa_carmen", label: "Playa del Carmen" },
              { id: "cancun", label: "Cancún" },
              { id: "tulum", label: "Tulum" },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setSelectedZone(chip.id)}
                className={`px-4.5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                  selectedZone === chip.id
                    ? "bg-[var(--color-fiord-950)] text-white shadow-xs"
                    : "bg-white text-[var(--color-fiord-800)] border border-[var(--color-fiord-200)] hover:bg-[var(--color-fiord-100)]"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-8 rounded-[20px] bg-white border border-[var(--color-fiord-200)] hover:border-[var(--color-fiord-950)] transition-all space-y-6 flex flex-col justify-between shadow-2xs group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[var(--color-fiord-50)] border border-[var(--color-fiord-200)] text-[var(--color-fiord-900)] text-[11px] font-bold tracking-wider uppercase font-mono">
                    {item.zoneName}
                  </span>
                  <span className="text-[11px] font-bold text-[#047857] font-mono">
                    {item.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight text-[var(--color-fiord-950)] font-sans group-hover:text-[var(--color-fiord-800)] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-[var(--color-fiord-700)] font-medium">
                    {item.company}
                  </p>
                </div>

                <div className="py-2.5 border-y border-[var(--color-fiord-200)]">
                  <span className="text-2xl font-bold font-mono text-[var(--color-fiord-950)] block">
                    {item.salary}
                  </span>
                  <span className="text-[11px] text-[var(--color-fiord-600)] font-mono font-medium">
                    {item.period}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-fiord-600)] font-bold block">
                    Prestaciones incluidas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.benefits.map((b, bIdx) => (
                      <span key={bIdx} className="px-2.5 py-0.5 rounded-full bg-[var(--color-fiord-50)] text-[var(--color-fiord-800)] border border-[var(--color-fiord-200)] text-[11px] font-semibold">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-fiord-200)] flex items-center justify-between">
                <span className="text-[12px] text-[var(--color-fiord-700)] font-mono font-semibold flex items-center gap-1">
                  <MapPin className="size-3.5 text-[var(--color-fiord-950)]" />
                  {item.distance}
                </span>

                <Link
                  href="/register/candidate"
                  className="text-[13px] font-bold text-[var(--color-fiord-950)] hover:underline flex items-center gap-1 transition-colors"
                >
                  <span>Postularme</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
