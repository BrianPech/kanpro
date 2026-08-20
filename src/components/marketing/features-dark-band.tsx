"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  UserCheck, 
  ArrowRight, 
  ShieldCheck 
} from "lucide-react";

export function FeaturesDarkBand() {
  const [activeRole, setActiveRole] = useState<"company" | "candidate">("company");

  return (
    <section id="empresas" className="bg-white text-[var(--color-fiord-950)] py-20 sm:py-28 border-b border-[var(--color-fiord-200)] text-left scroll-mt-16">
      <div id="candidatos" className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        
        {/* Section Header & Sub-Nav Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-fiord-200)]">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[13px] font-bold text-[var(--color-fiord-800)] tracking-[0.24px] uppercase block font-mono">
              Suite de Operación y Contratación
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.48px] leading-[1.08] text-[var(--color-fiord-950)] font-sans">
              Herramientas creadas para la realidad laboral del Sureste
            </h2>
          </div>

          <div className="inline-flex p-1 rounded-full bg-[var(--color-fiord-100)] border border-[var(--color-fiord-200)] self-start md:self-auto">
            <button
              onClick={() => setActiveRole("company")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                activeRole === "company"
                  ? "bg-[var(--color-fiord-950)] text-white shadow-xs"
                  : "text-[var(--color-fiord-700)] hover:text-[var(--color-fiord-950)]"
              }`}
            >
              <Building2 className="size-3.5" />
              <span>Para Empresas</span>
            </button>
            <button
              onClick={() => setActiveRole("candidate")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                activeRole === "candidate"
                  ? "bg-[var(--color-fiord-950)] text-white shadow-xs"
                  : "text-[var(--color-fiord-700)] hover:text-[var(--color-fiord-950)]"
              }`}
            >
              <UserCheck className="size-3.5" />
              <span>Para Candidatos</span>
            </button>
          </div>
        </div>

        {/* 3 High-Contrast Feature Cards Grid */}
        {activeRole === "company" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="p-8 rounded-[20px] bg-[var(--color-fiord-50)] border border-[var(--color-fiord-200)] hover:border-[var(--color-fiord-950)] transition-all space-y-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div className="size-11 rounded-full bg-white border border-[var(--color-fiord-200)] text-[var(--color-fiord-950)] flex items-center justify-center font-bold text-sm shadow-2xs">
                  01
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[var(--color-fiord-950)] font-sans">
                  Wizard en 4 pasos con prestaciones de ley
                </h3>
                <p className="text-[14px] text-[var(--color-fiord-700)] leading-relaxed font-medium">
                  Publica vacantes en minutos. Configura sueldo en MXN, colonia exacta de tu sucursal y selecciona beneficios: IMSS, propinas, comedor, transporte y uniformes.
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-white border border-[var(--color-fiord-200)] text-[12px] font-mono text-[var(--color-fiord-700)] space-y-1 font-semibold">
                <div>✓ IMSS Día 1</div>
                <div>✓ Comedor de Personal</div>
                <div>✓ Propinas Semanales</div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-[20px] bg-[var(--color-fiord-50)] border border-[var(--color-fiord-200)] hover:border-[var(--color-fiord-950)] transition-all space-y-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div className="size-11 rounded-full bg-white border border-[var(--color-fiord-200)] text-[var(--color-fiord-950)] flex items-center justify-center font-bold text-sm shadow-2xs">
                  02
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[var(--color-fiord-950)] font-sans">
                  Applications Inbox & Pipeline en vivo
                </h3>
                <p className="text-[14px] text-[var(--color-fiord-700)] leading-relaxed font-medium">
                  Gestiona a tus postulantes ordenados por proximidad a tu sucursal. Clasifica en estados (Pendiente, En revisión, Preseleccionado), califica y agrega notas privadas.
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-white border border-[var(--color-fiord-200)] text-[12px] font-mono text-[var(--color-fiord-700)] flex items-center justify-between font-semibold">
                <span>Calificación de aspirante:</span>
                <span className="text-[#d97706] font-bold">★ 4.9 / 5.0</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-[20px] bg-[var(--color-fiord-50)] border border-[var(--color-fiord-200)] hover:border-[var(--color-fiord-950)] transition-all space-y-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div className="size-11 rounded-full bg-white border border-[var(--color-fiord-200)] text-[var(--color-fiord-950)] flex items-center justify-center font-bold text-sm shadow-2xs">
                  03
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[var(--color-fiord-950)] font-sans">
                  Conexión directa e inmediata en WhatsApp
                </h3>
                <p className="text-[14px] text-[var(--color-fiord-700)] leading-relaxed font-medium">
                  Con un solo clic se dispara una conversación oficial en WhatsApp con el aspirante para agendar su entrevista presencial en cuestión de horas.
                </p>
              </div>

              <Link
                href="/register/company"
                className="w-full h-12 rounded-full bg-[var(--color-fiord-950)] text-white hover:bg-[var(--color-fiord-900)] font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>Empezar a reclutar gratis</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Candidate Card 1 */}
            <div className="p-8 rounded-[20px] bg-[var(--color-fiord-50)] border border-[var(--color-fiord-200)] hover:border-[var(--color-fiord-950)] transition-all space-y-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div className="size-11 rounded-full bg-white border border-[var(--color-fiord-200)] text-[var(--color-fiord-950)] flex items-center justify-center font-bold text-sm shadow-2xs">
                  01
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[var(--color-fiord-950)] font-sans">
                  Búsqueda por cercanía a tu domicilio
                </h3>
                <p className="text-[14px] text-[var(--color-fiord-700)] leading-relaxed font-medium">
                  Encuentra vacantes a menos de 3.5 km de tu casa en Mérida o Quintana Roo. Ahorra 2 horas diarias de transporte público y gastos diarios de pasajes.
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-white border border-[var(--color-fiord-200)] text-[12px] font-mono text-[var(--color-fiord-700)] font-semibold">
                Radio promedio: 10 a 15 minutos de traslado
              </div>
            </div>

            {/* Candidate Card 2 */}
            <div className="p-8 rounded-[20px] bg-[var(--color-fiord-50)] border border-[var(--color-fiord-200)] hover:border-[var(--color-fiord-950)] transition-all space-y-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div className="size-11 rounded-full bg-white border border-[var(--color-fiord-200)] text-[var(--color-fiord-950)] flex items-center justify-center font-bold text-sm shadow-2xs">
                  02
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[var(--color-fiord-950)] font-sans">
                  Expediente 100% y Prioridad Máxima
                </h3>
                <p className="text-[14px] text-[var(--color-fiord-700)] leading-relaxed font-medium">
                  Coteja tu INE, CURP oficial SAT, comprobante y cartas de trabajo. Tu perfil recibe la insignia de Prioridad Máxima ante los departamentos de recursos humanos.
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-white border border-[var(--color-fiord-200)] text-[12px] font-mono text-[#047857] flex items-center justify-between font-bold">
                <span>Insignia de Cotejo Activa</span>
                <span>100% ✓</span>
              </div>
            </div>

            {/* Candidate Card 3 */}
            <div className="p-8 rounded-[20px] bg-[var(--color-fiord-50)] border border-[var(--color-fiord-200)] hover:border-[var(--color-fiord-950)] transition-all space-y-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div className="size-11 rounded-full bg-white border border-[var(--color-fiord-200)] text-[var(--color-fiord-950)] flex items-center justify-center font-bold text-sm shadow-2xs">
                  03
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[var(--color-fiord-950)] font-sans">
                  Postulación en 1 clic y privacidad LFPDPPP
                </h3>
                <p className="text-[14px] text-[var(--color-fiord-700)] leading-relaxed font-medium">
                  Aplica al instante sin llenar formularios repetitivos. Tus documentos sensibles permanecen cifrados y solo se comparten cuando tú lo autorices.
                </p>
              </div>

              <Link
                href="/register/candidate"
                className="w-full h-12 rounded-full bg-[var(--color-fiord-950)] text-white hover:bg-[var(--color-fiord-900)] font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>Crear mi expediente gratis</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

          </div>
        )}

        {/* SAT 13-Point Audit Callout Block */}
        <div id="verificacion" className="p-8 sm:p-10 rounded-[28px] bg-[var(--color-fiord-50)] border border-[var(--color-fiord-200)] space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-fiord-200)]">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[#059669]/15 text-[#047857] flex items-center justify-center">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--color-fiord-950)] font-sans">
                  Protocolo de Verificación Legal SAT (13 Puntos)
                </h3>
                <p className="text-[13px] text-[var(--color-fiord-700)] font-mono font-medium">
                  Auditoría obligatoria de legitimidad para todas las empresas empleadoras
                </p>
              </div>
            </div>

            <span className="px-3.5 py-1 rounded-full bg-[#059669]/15 text-[#047857] border border-[#059669]/25 text-[11px] font-bold font-mono self-start sm:self-auto">
              SELLO DE CONFIANZA PENINSULAR
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[13px] font-mono text-[var(--color-fiord-800)] font-semibold">
            <div className="p-3.5 rounded-[12px] bg-white border border-[var(--color-fiord-200)]">
              1. Acta Constitutiva & Folio
            </div>
            <div className="p-3.5 rounded-[12px] bg-white border border-[var(--color-fiord-200)]">
              2. RFC Activo con CSF SAT
            </div>
            <div className="p-3.5 rounded-[12px] bg-white border border-[var(--color-fiord-200)]">
              3. Domicilio Fiscal Comprobable
            </div>
            <div className="p-3.5 rounded-[12px] bg-white border border-[var(--color-fiord-200)]">
              4. Poder Notarial Representante
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
