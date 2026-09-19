"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, X, ArrowRight, MapPin, Kanban } from "lucide-react";

export function ComparisonLightBand() {
  const [selectedRegion, setSelectedRegion] = useState<"yucatan" | "qroo">("yucatan");

  const comparisonData = [
    {
      metric: "Comisiones por colocación",
      kanpro: "0% — Sin deducciones sobre el salario",
      traditional: "15% a 30% del salario anual o tarifas ocultas",
    },
    {
      metric: "Canal de contacto y entrevista",
      kanpro: "WhatsApp directo en 1-clic con plantilla",
      traditional: "Correos desatendidos o intermediarios",
    },
    {
      metric: "Tiempo promedio de respuesta",
      kanpro: "< 2 Horas el mismo día",
      traditional: "1 a 3 Semanas de espera",
    },
    {
      metric: "Búsqueda por cercanía a colonia",
      kanpro: "Radio exacto (< 3 km de casa)",
      traditional: "Por estado o municipio general",
    },
    {
      metric: "Expediente digital cotejado",
      kanpro: "INE, CURP, comprobante y LFPDPPP",
      traditional: "Copias impresas sueltas sin control",
    },
    {
      metric: "Auditoría patronal de empresas",
      kanpro: "13 Puntos SAT (RFC, 32-D, Acta)",
      traditional: "Sin validación previa de legalidad",
    },
  ];

  const yucatanCorridors = [
    { name: "Mérida Centro & Paseo de Montejo", focus: "Hotelería boutique, Gastronomía de autor, Corporativo", companies: "35+ Empresas" },
    { name: "Altabrisa & Periférico Norte", focus: "Salud especializada, Retail, Gastronomía, Automotriz", companies: "48+ Empresas" },
    { name: "García Ginerés & Colonia México", focus: "Servicios profesionales, Consultorías, Oficinas", companies: "24+ Empresas" },
    { name: "Francisco de Montejo & Chuburná", focus: "Comercio local, Logística urbana, Talleres y Alimentos", companies: "30+ Empresas" },
    { name: "Ciudad Caucel & Las Américas", focus: "Comercio vecinal, Farmacias, Cadenas y Sucursales", companies: "28+ Empresas" },
    { name: "Umán & Corredor Industrial", focus: "Manufactura, Almacenamiento, Distribución y CEDIS", companies: "19+ Empresas" },
  ];

  const qrooCorridors = [
    { name: "Playa del Carmen Centro & 5ta Avenida", focus: "Turismo internacional, Restaurantes, Clubes, Retail", companies: "52+ Empresas" },
    { name: "Playacar & Zona Ejidal", focus: "Hotelería, Mantenimiento técnico, Servicios de playa", companies: "34+ Empresas" },
    { name: "Cancún Centro & Av. Tulum", focus: "Clínicas, Comercio metropolitano, Sector administrativo", companies: "41+ Empresas" },
    { name: "Cancún Zona Hotelera & Huayacán", focus: "Hospitalidad de lujo, Restaurantes, A&B, Residencial", companies: "45+ Empresas" },
    { name: "Tulum Centro & La Veleta", focus: "Eco-hotelería, Hospitalidad, Wellness, Gastronomía", companies: "29+ Empresas" },
    { name: "Cozumel & Puerto Morelos", focus: "Operación de muelles, Buceo, Transporte marítimo", companies: "18+ Empresas" },
  ];

  const activeCorridors = selectedRegion === "yucatan" ? yucatanCorridors : qrooCorridors;

  return (
    <section className="bg-[var(--color-fiord-50)] text-[var(--color-fiord-950)] py-20 sm:py-28 border-b border-[var(--color-fiord-200)] text-left">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* Comparison Block */}
        <div className="space-y-10">
          <div className="space-y-3 max-w-3xl">
            <span className="text-[13px] font-bold text-[var(--color-fiord-800)] tracking-[0.24px] uppercase block font-mono">
              Eficiencia Económica
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.48px] leading-[1.08] text-[var(--color-fiord-950)] font-sans">
              K&apos;anPro vs Métodos Tradicionales
            </h2>
            <p className="text-base sm:text-lg text-[var(--color-fiord-700)] font-normal leading-relaxed">
              La diferencia entre intermediarios costosos y una plataforma de vinculación directa.
            </p>
          </div>

          {/* Table Container */}
          <div className="rounded-[20px] bg-white border border-[var(--color-fiord-200)] overflow-hidden shadow-2xs">
            <div className="grid grid-cols-12 bg-[var(--color-fiord-100)] border-b border-[var(--color-fiord-200)] p-5 text-[13px] font-bold text-[var(--color-fiord-950)]">
              <div className="col-span-5 sm:col-span-4">Criterio Operativo</div>
              <div className="col-span-4 sm:col-span-4 text-[var(--color-fiord-950)] flex items-center gap-1.5 font-black">
                <Kanban className="size-4 text-[var(--color-fiord-950)]" />
                <span>K&apos;anPro Sureste</span>
              </div>
              <div className="col-span-3 sm:col-span-4 text-[var(--color-fiord-600)]">Agencias / Tradicionales</div>
            </div>

            <div className="divide-y divide-[var(--color-fiord-200)]">
              {comparisonData.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 items-center p-5 text-[14px] gap-3 hover:bg-[var(--color-fiord-50)]/70 transition-colors"
                >
                  <div className="col-span-12 sm:col-span-4 font-bold text-[var(--color-fiord-950)]">
                    {row.metric}
                  </div>

                  <div className="col-span-6 sm:col-span-4 font-bold text-[#047857] flex items-start gap-2 text-[13px]">
                    <div className="size-4.5 rounded-full bg-[#059669]/15 text-[#047857] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                    <span>{row.kanpro}</span>
                  </div>

                  <div className="col-span-6 sm:col-span-4 text-[var(--color-fiord-600)] flex items-start gap-2 text-[13px] font-medium">
                    <div className="size-4.5 rounded-full bg-[var(--color-fiord-100)] text-[var(--color-fiord-600)] flex items-center justify-center shrink-0 mt-0.5 border border-[var(--color-fiord-200)]">
                      <X className="size-3 stroke-[2.5]" />
                    </div>
                    <span>{row.traditional}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regional Corridor Block */}
        <div id="zonas" className="space-y-10 pt-10 border-t border-[var(--color-fiord-200)]">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="text-[13px] font-bold text-[var(--color-fiord-800)] tracking-[0.24px] uppercase block font-mono">
                Cobertura Territorial
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.48px] leading-[1.08] text-[var(--color-fiord-950)] font-sans">
                Corredores de empleo activo en la Península
              </h2>
            </div>

            <div className="inline-flex p-1 rounded-full bg-white border border-[var(--color-fiord-200)] shadow-2xs">
              <button
                onClick={() => setSelectedRegion("yucatan")}
                className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                  selectedRegion === "yucatan"
                    ? "bg-[var(--color-fiord-950)] text-white shadow-xs"
                    : "text-[var(--color-fiord-700)] hover:text-[var(--color-fiord-950)]"
                }`}
              >
                Mérida, Yucatán
              </button>
              <button
                onClick={() => setSelectedRegion("qroo")}
                className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                  selectedRegion === "qroo"
                    ? "bg-[var(--color-fiord-950)] text-white shadow-xs"
                    : "text-[var(--color-fiord-700)] hover:text-[var(--color-fiord-950)]"
                }`}
              >
                Quintana Roo & Riviera Maya
              </button>
            </div>
          </div>

          {/* Corridors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCorridors.map((c, i) => (
              <div
                key={i}
                className="p-6 rounded-[20px] bg-white border border-[var(--color-fiord-200)] hover:border-[var(--color-fiord-950)] transition-all space-y-4 flex flex-col justify-between shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[16px] text-[var(--color-fiord-950)] font-sans">
                      {c.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-fiord-50)] border border-[var(--color-fiord-200)] text-[11px] font-bold text-[#047857] shrink-0 font-mono">
                      {c.companies}
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--color-fiord-700)] leading-relaxed font-medium">
                    {c.focus}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--color-fiord-200)] flex items-center justify-between text-[12px] font-medium text-[var(--color-fiord-950)]">
                  <span className="flex items-center gap-1 text-[var(--color-fiord-600)] font-mono font-medium">
                    <MapPin className="size-3.5 text-[var(--color-fiord-950)]" />
                    Filtro &lt; 3 km
                  </span>
                  <Link
                    href={`/dashboard/candidate/discovery?loc=${encodeURIComponent(c.name.split(" ")[0])}`}
                    className="text-[var(--color-fiord-950)] hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Ver vacantes</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
