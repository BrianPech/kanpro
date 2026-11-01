"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  UserCheck, 
  ArrowRight, 
  MapPin
} from "@/components/ui/icons";
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
                  Captura con prestaciones de ley y turnos
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Establece el puesto, número de plazas, rango salarial en MXN, turnos (matutino, mixto, nocturno) y catálogo de prestaciones (IMSS, propinas, comedor subsidiado y transporte).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs font-mono">
                <div className="text-[10px] text-muted-foreground">Prestaciones & Turnos:</div>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-foreground text-background px-2 py-0.5 rounded text-[10px] font-bold">IMSS Ley</span>
                  <span className="bg-foreground text-background px-2 py-0.5 rounded text-[10px] font-bold">Comedor</span>
                  <span className="bg-foreground text-background px-2 py-0.5 rounded text-[10px] font-bold">Matutino</span>
                </div>
              </div>
            </div>

            {/* Empresa Step 2 */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-mono">
                  <span className="font-bold text-foreground">PASO 02 / SELECCIÓN</span>
                  <span className="text-muted-foreground">RADAR & ATS</span>
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans">
                  Radar peninsular y pipeline con estrellas
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Invita talento calificado en Cancún, Mérida y Riviera Maya desde el radar. Gestiona tu pipeline por etapas (Por Revisar, Preselección, Entrevistas y Contratados) con notas internas.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Sofía Dzib Pech</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">★ 5.0 · Preseleccionada</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Expediente Verificado · Centro Mérida</div>
              </div>
            </div>

            {/* Empresa Step 3 */}
            <div className="p-6 rounded-2xl border-2 border-foreground bg-card space-y-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-mono">
                  <span className="font-bold text-foreground">PASO 03 / OPERACIÓN</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">CHECADOR & LFT</span>
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans">
                  Checador QR de sucursal y Expediente 360
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Genera el cartel QR de tu sucursal con geocerca GPS y tolerancia de 15 minutos. Consulta el expediente integral de tu colaborador y gestiona solicitudes de Vacaciones LFT.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  render={<Link href="/register/company" />}
                  className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-mono font-bold text-xs gap-2 cursor-pointer shadow-2xs"
                >
                  <span>Registrar Empresa y Probar</span>
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
                  <span className="text-muted-foreground">OFERTAS VERIFICADAS</span>
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans">
                  Sueldos reales y empresas auditadas SAT
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Explora vacantes verificadas en tu ciudad o zona en Quintana Roo y Yucatán con salarios transparentes en MXN. Cero ofertas fantasma, sin intermediarios ni comisiones sobre tu sueldo.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-foreground font-bold">
                  <MapPin className="size-3.5 text-foreground" />
                  <span>Sureste: Mérida, Cancún, Riviera Maya</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Salarios en MXN y prestaciones de ley transparentes</div>
              </div>
            </div>

            {/* Candidato Step 2 */}
            <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-mono">
                  <span className="font-bold text-foreground">PASO 02 / EXPEDIENTE</span>
                  <span className="text-muted-foreground">1-CLIC & PRIVACIDAD</span>
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans">
                  Sube tus documentos una vez y postúlate
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Carga tu INE, CURP, comprobante domiciliario y CV en PDF. Tus datos están cifrados y seguros bajo la ley LFPDPPP, permitiéndote aplicar a cualquier vacante en un clic.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Expediente Certificado</span>
                  <span className="text-emerald-600 font-bold">100% Digital ✓</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Protección de Datos LFPDPPP activa</div>
              </div>
            </div>

            {/* Candidato Step 3 */}
            <div className="p-6 rounded-2xl border-2 border-foreground bg-card space-y-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-mono">
                  <span className="font-bold text-foreground">PASO 03 / COLABORADOR</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">PORTAL DEL EMPLEADO</span>
                </div>
                <h3 className="text-lg font-bold text-foreground font-sans">
                  Checador con cámara y Vacaciones LFT
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Al ser contratado, tu cuenta se convierte en tu Portal de Colaborador: marca tu asistencia escaneando el QR de tu trabajo, firma contratos digitales y pide tus vacaciones de ley.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  render={<Link href="/register/candidate" />}
                  className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-mono font-bold text-xs gap-2 cursor-pointer shadow-2xs"
                >
                  <span>Crear mi Cuenta Gratis</span>
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
