"use client";

import React from "react";
import Link from "next/link";
import { Check, ArrowRight, Building2, UserCheck, ShieldCheck } from "lucide-react";

export function PricingDarkBand() {
  const candidateBenefits = [
    "CV Digital estructurado para el Sureste",
    "Búsqueda por cercanía a colonia (< 3 km)",
    "Expediente Laboral Digital (INE, CURP, comprobante)",
    "Postulaciones ilimitadas en 1 clic",
    "Contacto directo por WhatsApp con la empresa",
    "Control de privacidad y cifrado LFPDPPP",
    "100% Gratuito de por vida — Sin cobros ocultos",
  ];

  const companyStandardBenefits = [
    "Wizard de publicación asistida en 4 pasos",
    "Configuración de prestaciones mexicanas (IMSS, comedor)",
    "Applications Inbox con calificaciones internas",
    "1-Clic de apertura directa en WhatsApp",
    "Solicitud de acceso seguro a documentos",
    "0% de comisiones por colocación de personal",
  ];

  const companyVerifiedBenefits = [
    "Todo lo incluido en el esquema Empresa",
    "Sello Oficial de Verificación Legal SAT (13 Puntos)",
    "Prioridad de visibilidad ante candidatos certificados",
    "Validación de Acta Constitutiva y RFC 32-D",
    "Exportación de aspirantes en formato CSV",
    "Soporte prioritario para recursos humanos",
  ];

  return (
    <section id="planes" className="bg-white text-[var(--color-fiord-950)] py-20 sm:py-28 border-b border-[var(--color-fiord-200)] text-left">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <span className="text-[13px] font-bold text-[var(--color-fiord-800)] tracking-[0.24px] uppercase block font-mono">
            Estructura de Tarifas Transparentes
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.48px] leading-[1.08] text-[var(--color-fiord-950)] font-sans">
            Acceso directo. Cero comisiones sobre el sueldo.
          </h2>
          <p className="text-base sm:text-lg text-[var(--color-fiord-700)] leading-relaxed">
            No retenemos porcentajes sobre el salario del trabajador ni cobramos porcentajes de colocación a los negocios.
          </p>
        </div>

        {/* 3-Card Subscription Grid with Featured Fiord-950 Plan Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Card 1: Candidatos (Free) */}
          <div className="p-8 rounded-[20px] bg-[var(--color-fiord-50)] border border-[var(--color-fiord-200)] flex flex-col justify-between space-y-8 shadow-2xs">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-full bg-white border border-[var(--color-fiord-200)] text-[#047857] flex items-center justify-center font-bold">
                    <UserCheck className="size-5" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#059669]/15 text-[#047857] text-[11px] font-bold font-mono">
                    100% GRATIS
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-fiord-950)] font-sans">
                  Candidato
                </h3>
                <p className="text-[13px] text-[var(--color-fiord-700)] leading-relaxed font-medium">
                  Para personas en busca de empleo en Mérida, Playa del Carmen o Cancún.
                </p>
              </div>

              <div className="py-4 border-y border-[var(--color-fiord-200)]">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-mono text-[var(--color-fiord-950)]">$0</span>
                  <span className="text-[12px] font-mono text-[var(--color-fiord-600)] font-medium">MXN / Siempre gratis</span>
                </div>
              </div>

              <ul className="space-y-3">
                {candidateBenefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-[var(--color-fiord-800)] font-medium">
                    <Check className="size-4 text-[#059669] shrink-0 mt-0.5 stroke-[3]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/register/candidate"
              className="w-full h-12 rounded-full border border-[var(--color-fiord-200)] bg-white hover:bg-[var(--color-fiord-100)] text-[var(--color-fiord-950)] font-semibold text-[14px] flex items-center justify-center gap-2 transition-all shadow-2xs"
            >
              <span>Crear CV de Candidato</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Card 2: Empresa Estándar */}
          <div className="p-8 rounded-[20px] bg-[var(--color-fiord-50)] border border-[var(--color-fiord-200)] flex flex-col justify-between space-y-8 shadow-2xs">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-full bg-white border border-[var(--color-fiord-200)] text-[var(--color-fiord-950)] flex items-center justify-center font-bold">
                    <Building2 className="size-5" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white border border-[var(--color-fiord-200)] text-[11px] font-bold text-[var(--color-fiord-950)] font-mono">
                    SIN COMISIÓN
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-fiord-950)] font-sans">
                  Empresa
                </h3>
                <p className="text-[13px] text-[var(--color-fiord-700)] leading-relaxed font-medium">
                  Para restaurantes, hoteles, comercios y empresas del Sureste.
                </p>
              </div>

              <div className="py-4 border-y border-[var(--color-fiord-200)]">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-mono text-[var(--color-fiord-950)]">0%</span>
                  <span className="text-[12px] font-mono text-[var(--color-fiord-600)] font-medium">Comisión por contratación</span>
                </div>
              </div>

              <ul className="space-y-3">
                {companyStandardBenefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-[var(--color-fiord-800)] font-medium">
                    <Check className="size-4 text-[var(--color-fiord-950)] shrink-0 mt-0.5 stroke-[3]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/register/company"
              className="w-full h-12 rounded-full bg-white border border-[var(--color-fiord-200)] hover:bg-[var(--color-fiord-100)] text-[var(--color-fiord-950)] font-semibold text-[14px] flex items-center justify-center gap-2 transition-all shadow-2xs"
            >
              <span>Publicar como Empresa</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Card 3: Featured Plan Card in Deep Fiord-950 */}
          <div className="p-8 rounded-[20px] bg-[var(--color-fiord-950)] text-white flex flex-col justify-between space-y-8 shadow-lg relative">
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="size-10 rounded-full bg-white/15 text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="size-5" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white text-[var(--color-fiord-950)] text-[11px] font-bold font-mono uppercase tracking-wider">
                    MÁS RECOMENDADO
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white font-sans">
                  Empresa Verificada SAT
                </h3>
                <p className="text-[13px] text-white/80 leading-relaxed font-medium">
                  Con Sello Oficial de Auditoría 13 Puntos para máxima confianza ante aspirantes.
                </p>
              </div>

              <div className="py-4 border-y border-white/20">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-mono text-white">Sello SAT</span>
                  <span className="text-[12px] font-mono text-white/80">· 13 Puntos Auditados</span>
                </div>
              </div>

              <ul className="space-y-3">
                {companyVerifiedBenefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-white/95 font-medium">
                    <Check className="size-4 text-white shrink-0 mt-0.5 stroke-[3]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/register/company"
              className="w-full h-12 rounded-full bg-white text-[var(--color-fiord-950)] hover:bg-[var(--color-fiord-100)] font-bold text-[14px] flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span>Verificar Empresa y Publicar</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
