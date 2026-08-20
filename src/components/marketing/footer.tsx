"use client";

import React from "react";
import Link from "next/link";
import { Kanban, ShieldCheck, ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white text-[var(--color-fiord-950)] py-16 sm:py-24 border-t border-[var(--color-fiord-200)] text-left">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Pre-Footer Action Banner in Fiord-950 */}
        <div className="p-8 sm:p-12 rounded-[28px] bg-[var(--color-fiord-950)] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-bold text-white font-sans tracking-tight">
              ¿Listo para transformar la contratación en tu negocio?
            </h3>
            <p className="text-[14px] text-white/80 leading-relaxed font-medium">
              Publica tu primera vacante en 4 pasos y recibe aspirantes verificados hoy mismo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/register/company"
              className="h-12 px-7 rounded-full bg-white text-[var(--color-fiord-950)] hover:bg-[var(--color-fiord-100)] font-semibold text-[14px] flex items-center gap-2 transition-colors shadow-sm"
            >
              <span>Publicar vacante</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/register/candidate"
              className="h-12 px-7 rounded-full border border-white/30 hover:border-white hover:bg-white/10 text-white font-semibold text-[14px] flex items-center transition-colors"
            >
              <span>Soy candidato</span>
            </Link>
          </div>
        </div>

        {/* Multi-Column Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-[var(--color-fiord-200)] text-[14px]">
          
          {/* Brand Colophon */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-[var(--color-fiord-950)] text-white flex items-center justify-center font-bold">
                <Kanban className="size-4.5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-[var(--color-fiord-950)] font-sans">
                K&apos;anPro
              </span>
            </div>
            <p className="text-[13px] text-[var(--color-fiord-700)] leading-relaxed max-w-sm font-medium">
              Plataforma regional de vinculación laboral directa y verificación documental en el Sureste de México. Operando en Yucatán y Quintana Roo.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[12px] font-mono text-[#047857] font-semibold">
              <ShieldCheck className="size-4" />
              <span>Verificación Legal SAT & Cifrado LFPDPPP</span>
            </div>
          </div>

          {/* Column 1: Empresas */}
          <div className="space-y-3">
            <span className="font-bold text-[13px] text-[var(--color-fiord-950)] uppercase tracking-wider block font-mono">
              Empresas
            </span>
            <ul className="space-y-2.5 text-[13px] text-[var(--color-fiord-700)] font-medium">
              <li>
                <Link href="/register/company" className="hover:text-[var(--color-fiord-950)] transition-colors">
                  Publicar Vacante
                </Link>
              </li>
              <li>
                <Link href="#empresas" className="hover:text-[var(--color-fiord-950)] transition-colors">
                  Applications Inbox
                </Link>
              </li>
              <li>
                <Link href="#verificacion" className="hover:text-[var(--color-fiord-950)] transition-colors">
                  Verificación 13 SAT
                </Link>
              </li>
              <li>
                <Link href="#planes" className="hover:text-[var(--color-fiord-950)] transition-colors">
                  Tarifas 0% Comisión
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Candidatos */}
          <div className="space-y-3">
            <span className="font-bold text-[13px] text-[var(--color-fiord-950)] uppercase tracking-wider block font-mono">
              Candidatos
            </span>
            <ul className="space-y-2.5 text-[13px] text-[var(--color-fiord-700)] font-medium">
              <li>
                <Link href="/register/candidate" className="hover:text-[var(--color-fiord-950)] transition-colors">
                  Crear CV Digital
                </Link>
              </li>
              <li>
                <Link href="#candidatos" className="hover:text-[var(--color-fiord-950)] transition-colors">
                  Expediente Digital
                </Link>
              </li>
              <li>
                <Link href="#empresas" className="hover:text-[var(--color-fiord-950)] transition-colors">
                  Expediente 100%
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-[var(--color-fiord-950)] transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Zonas */}
          <div className="space-y-3">
            <span className="font-bold text-[13px] text-[var(--color-fiord-950)] uppercase tracking-wider block font-mono">
              Zonas
            </span>
            <ul className="space-y-2.5 text-[13px] text-[var(--color-fiord-700)] font-medium">
              <li>
                <Link href="#zonas" className="hover:text-[var(--color-fiord-950)] transition-colors">
                  Mérida & Altabrisa
                </Link>
              </li>
              <li>
                <Link href="#zonas" className="hover:text-[var(--color-fiord-950)] transition-colors">
                  Playa del Carmen 5ta Av.
                </Link>
              </li>
              <li>
                <Link href="#zonas" className="hover:text-[var(--color-fiord-950)] transition-colors">
                  Cancún & Tulum
                </Link>
              </li>
              <li>
                <Link href="#zonas" className="hover:text-[var(--color-fiord-950)] transition-colors">
                  Corredor Industrial
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Regulatory Disclosure & Copyright Block */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] text-[var(--color-fiord-600)] font-mono font-medium">
          <div>
            {`© 2026 K'anPro México. Todos los derechos reservados.`}
          </div>
          <div className="flex items-center gap-6 font-semibold">
            <Link href="/terms" className="hover:text-[var(--color-fiord-950)] transition-colors">Términos de Servicio</Link>
            <Link href="/privacy" className="hover:text-[var(--color-fiord-950)] transition-colors">Aviso de Privacidad</Link>
            <Link href="/contact" className="hover:text-[var(--color-fiord-950)] transition-colors">Contacto</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
