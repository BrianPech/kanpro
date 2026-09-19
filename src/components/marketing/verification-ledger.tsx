"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Check, ArrowRight, Building2, UserCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VerificationLedger() {
  const [activeLedger, setActiveLedger] = useState<"sat" | "expediente">("sat");

  const satRules = [
    { code: "SAT-01", title: "Acta Constitutiva con Folio Mercantil", requirement: "Poderes y constitución legal vigente ante Registro Público", tag: "OBLIGATORIO" },
    { code: "SAT-02", title: "Constancia de Situación Fiscal (CSF)", requirement: "RFC activo registrado ante el SAT en Yucatán o Q. Roo", tag: "OBLIGATORIO" },
    { code: "SAT-03", title: "Comprobante de Domicilio Fiscal", requirement: "Validación de centro de trabajo físico comprobable", tag: "OBLIGATORIO" },
    { code: "SAT-04", title: "Poder Notarial del Representante", requirement: "Facultades para contratación y actos administrativos", tag: "OBLIGATORIO" },
    { code: "SAT-05", title: "Opinión de Cumplimiento 32-D SAT", requirement: "Sentido positivo de obligaciones fiscales federales", tag: "AUDITADO" },
    { code: "SAT-06", title: "Registro Patronal IMSS", requirement: "Inscripción patronal para altas inmediatas de personal", tag: "AUDITADO" },
    { code: "SAT-07", title: "Validación de Teléfono y Dominio", requirement: "Canal corporativo verificado para contacto seguro", tag: "AUDITADO" },
    { code: "SAT-08", title: "Convenio de Privacidad LFPDPPP", requirement: "Protección estricta de datos personales de aspirantes", tag: "AUDITADO" },
  ];

  const expedienteRules = [
    { code: "EXP-01", title: "Identificación Oficial (INE / Pasaporte)", requirement: "Anverso y reverso cotejados contra padrón oficial", tag: "COTEJADO" },
    { code: "EXP-02", title: "CURP Certificada por RENAPO", requirement: "Validación con clave oficial del Registro Nacional", tag: "COTEJADO" },
    { code: "EXP-03", title: "Comprobante de Domicilio (< 90 días)", requirement: "Validación de cercanía y colonia de residencia", tag: "COTEJADO" },
    { code: "EXP-04", title: "Constancia de Situación Fiscal SAT", requirement: "Para timbrado y alta de nómina sin demoras", tag: "OPCIONAL" },
    { code: "EXP-05", title: "Número de Seguridad Social (NSS)", requirement: "Afiliación IMSS para cobertura médica laboral", tag: "OPCIONAL" },
    { code: "EXP-06", title: "Cartas de Recomendación y Referencias", requirement: "Historial laboral previo validado con empleadores", tag: "VALIDADO" },
  ];

  const items = activeLedger === "sat" ? satRules : expedienteRules;

  return (
    <section id="auditoria" className="py-16 sm:py-24 border-b border-border bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border text-left">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground uppercase">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>[03] PROTOCOLO DE AUDITORÍA Y SEGURIDAD</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground font-sans">
              Seguridad jurídica y verificación documental
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono">
              Auditoría fiscal para empresas registradas y cifrado LFPDPPP para expedientes de trabajadores.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-card border border-border self-start md:self-auto">
            <button
              onClick={() => setActiveLedger("sat")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeLedger === "sat"
                  ? "bg-foreground text-background shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="size-3.5" />
              <span>Auditoría SAT (13 Puntos)</span>
            </button>
            <button
              onClick={() => setActiveLedger("expediente")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeLedger === "expediente"
                  ? "bg-foreground text-background shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCheck className="size-3.5" />
              <span>Expediente Laboral Digital</span>
            </button>
          </div>
        </div>

        {/* Ledger Table Matrix */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs text-left">
          
          <div className="px-5 py-3.5 bg-muted/60 border-b border-border flex items-center justify-between font-mono text-xs font-bold text-foreground">
            <span>
              {activeLedger === "sat" ? "CRITERIOS DE VERIFICACIÓN FISCAL Y CORPORATIVA" : "CHECKLIST DOCUMENTAL DEL CANDIDATO"}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase">
              {activeLedger === "sat" ? "NORMA SAT YUCATÁN / Q. ROO" : "NORMATIVA LFPDPPP MÉXICO"}
            </span>
          </div>

          <div className="divide-y divide-border">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="font-mono text-xs font-bold text-muted-foreground w-16 shrink-0">
                    {item.code}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground font-sans">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      {item.requirement}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-muted border border-border text-foreground">
                    {item.tag}
                  </span>
                  <div className="size-5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ledger Footer */}
          <div className="p-5 bg-muted/40 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="size-4 text-foreground shrink-0" />
              <span>
                {activeLedger === "sat"
                  ? "Las empresas verificadas reciben el Sello Oficial de Confianza en el Sureste."
                  : "Los archivos sensibles del candidato están cifrados y solo se comparten con tu permiso."}
              </span>
            </div>

            <Button
              render={
                <Link 
                  href={activeLedger === "sat" ? "/register/company" : "/register/candidate"} 
                />
              }
              className="h-9 px-4 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-mono font-bold text-xs shrink-0 gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>{activeLedger === "sat" ? "Verificar Empresa" : "Subir Documentos"}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>

        </div>

      </div>
    </section>
  );
}
