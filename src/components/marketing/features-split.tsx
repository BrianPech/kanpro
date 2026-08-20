"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  UserCheck, 
  ArrowRight, 
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeaturesSplit() {
  const [selectedSuite, setSelectedSuite] = useState<"empresa" | "candidato">("empresa");

  return (
    <section id="despacho" className="py-16 sm:py-24 border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border text-left">
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
              [02] ARQUITECTURA DE OPERACIÓN DIRECTA
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground font-sans">
              Dos despachos. Un solo flujo sin intermediarios.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono">
              Selecciona tu perfil operativo para explorar las herramientas integradas.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border self-start md:self-auto">
            <button
              onClick={() => setSelectedSuite("empresa")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedSuite === "empresa"
                  ? "bg-foreground text-background shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="size-3.5" />
              <span>Despacho Empresas</span>
            </button>
            <button
              onClick={() => setSelectedSuite("candidato")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedSuite === "candidato"
                  ? "bg-foreground text-background shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCheck className="size-3.5" />
              <span>Despacho Candidatos</span>
            </button>
          </div>
        </div>

        {/* Dynamic Studio Layout based on selectedSuite */}
        {selectedSuite === "empresa" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            
            {/* Empresa Step 1 */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-mono">
                  <span className="font-bold text-foreground">PASO 01 / PUBLICACIÓN</span>
                  <span className="text-muted-foreground">WIZARD EN 4 PASOS</span>
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans">
                  Captura con prestaciones de ley y superiores
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Establece el puesto, rango salarial en MXN, colonia exacta de tu sucursal y marca las prestaciones (IMSS, propinas, comedor subsidiado, transporte y uniformes).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs font-mono">
                <div className="text-[10px] text-muted-foreground">Prestaciones Seleccionadas:</div>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-foreground text-background px-2 py-0.5 rounded text-[10px] font-bold">IMSS Día 1</span>
                  <span className="bg-foreground text-background px-2 py-0.5 rounded text-[10px] font-bold">Comedor</span>
                  <span className="bg-foreground text-background px-2 py-0.5 rounded text-[10px] font-bold">Propinas</span>
                </div>
              </div>
            </div>

            {/* Empresa Step 2 */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-mono">
                  <span className="font-bold text-foreground">PASO 02 / PIPELINE</span>
                  <span className="text-muted-foreground">APPLICATIONS INBOX</span>
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans">
                  Clasificación y notas internas de candidatos
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Monitorea postulantes ordenados por cercanía geográfica. Organiza estados (Pendientes, En revisión, Preseleccionados o Descartados) y asigna calificaciones internas.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Mauricio Romero</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">★ 4.9 · Preseleccionado</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Expediente 100% · Altabrisa (a 1.2 km)</div>
              </div>
            </div>

            {/* Empresa Step 3 */}
            <div className="p-6 rounded-2xl border-2 border-foreground bg-card space-y-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-mono">
                  <span className="font-bold text-foreground">PASO 03 / CONTACTO</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">SIN INTERMEDIARIOS</span>
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans">
                  Entrevistas directas en WhatsApp en minutos
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Haz clic en el botón de WhatsApp para iniciar conversación con el candidato con la plantilla oficial de tu empresa y agendar la cita presencial de inmediato.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  render={<Link href="/register/company" />}
                  className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-mono font-bold text-xs gap-2 cursor-pointer shadow-2xs"
                >
                  <span>Publicar Vacante Ahora</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>

          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            
            {/* Candidato Step 1 */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-mono">
                  <span className="font-bold text-foreground">PASO 01 / CERCANÍA</span>
                  <span className="text-muted-foreground">FILTRO POR COLONIA</span>
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans">
                  Empleo a minutos de tu domicilio
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Filtra ofertas laborales en tu colonia o zona de influencia en Mérida o Quintana Roo. Ahorra 2 horas diarias de transporte público y gastos de pasajes.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-foreground font-bold">
                  <MapPin className="size-3.5 text-foreground" />
                  <span>Radio Máximo: 3.5 km</span>
                </div>
                <div className="text-[10px] text-muted-foreground">12 vacantes encontradas cerca de tu casa</div>
              </div>
            </div>

            {/* Candidato Step 2 */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-mono">
                  <span className="font-bold text-foreground">PASO 02 / EXPEDIENTE</span>
                  <span className="text-muted-foreground">NIVEL 0 - 100%</span>
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans">
                  Sube tus papeles una vez y obtén Prioridad
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Coteja tu INE, CURP oficial SAT, comprobante domiciliario y cartas de trabajo. Al completar el 100%, tu perfil recibe la insignia de Prioridad Máxima.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Expediente Certificado</span>
                  <span className="text-emerald-600 font-bold">100% Completo ✓</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Protección de Datos LFPDPPP activa</div>
              </div>
            </div>

            {/* Candidato Step 3 */}
            <div className="p-6 rounded-2xl border-2 border-foreground bg-card space-y-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-mono">
                  <span className="font-bold text-foreground">PASO 03 / APLICACIÓN</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">1 SOLO CLIC</span>
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans">
                  Postulación inmediata y chat con RRHH
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Aplica con un solo clic. El equipo de contratación de la empresa revisa tu expediente y te escribe por WhatsApp para agendar tu entrevista.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  render={<Link href="/register/candidate" />}
                  className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-mono font-bold text-xs gap-2 cursor-pointer shadow-2xs"
                >
                  <span>Crear mi Expediente Gratis</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
