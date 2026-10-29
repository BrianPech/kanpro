"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, Building2, UserCheck, MessageSquare, HelpCircle, ArrowRight } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div
      className={`rounded-2xl border bg-card text-card-foreground transition-all duration-200 overflow-hidden shadow-xs ${
        isOpen ? "border-primary/40 ring-1 ring-primary/20 shadow-sm" : "border-border hover:border-border/80"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left font-semibold text-sm sm:text-base text-foreground hover:bg-muted/40 transition-colors cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <span className="leading-snug">{question}</span>
        <div
          className={`size-7 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 ${
            isOpen
              ? "rotate-180 bg-primary text-primary-foreground border-primary"
              : "border-border bg-muted/60 text-muted-foreground"
          }`}
        >
          <ChevronDown className="size-4" />
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-muted-foreground font-normal leading-relaxed border-t border-border/70 pt-4 bg-muted/20">
          {answer}
        </div>
      )}
    </div>
  );
}

export function FaqLightBand() {
  const [activeRole, setActiveRole] = useState<"company" | "candidate">("company");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const companyFaqs = [
    {
      q: "¿K'anPro cobra comisión por cada persona contratada?",
      a: "No. No retenemos comisiones por colocación de personal ni deducimos porcentajes del sueldo del trabajador. La vinculación entre tu negocio y el talento es 100% directa y transparente.",
    },
    {
      q: "¿Cómo funciona la conexión directa por WhatsApp?",
      a: "Al revisar a un aspirante en tu Applications Inbox, das clic en el botón de WhatsApp y se abre un chat con el candidato incluyendo el mensaje prearmado con los datos del puesto y la cita para entrevista presencial o virtual.",
    },
    {
      q: "¿Qué implica la Auditoría Legal de 13 Puntos SAT?",
      a: "Es una verificación que valida tu Acta Constitutiva con folio mercantil, RFC con Constancia de Situación Fiscal vigente, Domicilio Fiscal y Poder Notarial del representante para otorgar a tu negocio el Sello Oficial de Empresa Confiable en la Península.",
    },
    {
      q: "¿Cómo puedo consultar los documentos oficiales del aspirante (INE, CURP)?",
      a: "Bajo la normativa mexicana LFPDPPP, los documentos sensibles están protegidos con cifrado. Presionas 'Solicitar Acceso' y el candidato recibe una notificación directa que debe autorizar explícitamente desde su teléfono.",
    },
    {
      q: "¿Puedo segmentar vacantes por colonias en Mérida o la Riviera Maya?",
      a: "Sí. Puedes asignar la ubicación exacta de tu sucursal (Altabrisa, Montejo, Centro, Playa del Carmen, Cancún Huayacán) para priorizar a los candidatos que viven a menos de 3.5 km de tu centro de trabajo.",
    },
  ];

  const candidateFaqs = [
    {
      q: "¿Tiene algún costo registrar mi CV o postularme a vacantes?",
      a: "No. K'anPro es 100% gratuito para todos los trabajadores y profesionistas. Nunca te cobraremos por crear tu expediente, verificar tus datos ni por postularte a las ofertas.",
    },
    {
      q: "¿Mis identificaciones oficiales (INE, comprobantes) son públicas?",
      a: "No. Tu expediente digital está completamente protegido y cifrado. Ninguna empresa puede ver tus documentos sensibles a menos que tú aceptes expresamente su solicitud de acceso para fines de contratación.",
    },
    {
      q: "¿Cómo me contactan las empresas a las que me postulo?",
      a: "Los reclutadores revisan tu perfil auditado y te envían un mensaje directo por WhatsApp o te llaman por teléfono para agendar la entrevista formal.",
    },
    {
      q: "¿Qué beneficio tiene completar el expediente al 100%?",
      a: "Los perfiles con expediente completo (INE, CURP, comprobante de domicilio y constancia fiscal) reciben la insignia de Prioridad Máxima y aparecen en las primeras posiciones de búsqueda para los empleadores de la región.",
    },
    {
      q: "¿Puedo buscar empleos cercanos a mi domicilio?",
      a: "Sí. La plataforma ordena automáticamente las ofertas laborales por proximidad a tu colonia en Mérida o Quintana Roo para que ahorres tiempo y dinero en traslados diarios.",
    },
  ];

  const faqs = activeRole === "company" ? companyFaqs : candidateFaqs;

  return (
    <section id="faq" className="w-full bg-transparent text-foreground py-20 sm:py-28 lg:py-32 text-left relative overflow-hidden">
      
      {/* Sutil halo ambiental con tokens de shadcn */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full bg-primary/5 blur-[130px]"
        aria-hidden="true"
      />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        
        {/* Section Header */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <Badge
            variant="outline"
            className="text-xs font-mono font-bold uppercase tracking-wider text-primary border-primary/20 bg-primary/5 px-3.5 py-1 rounded-full gap-1.5 shadow-2xs"
          >
            <HelpCircle className="size-3.5" />
            <span>Preguntas Frecuentes</span>
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground font-sans leading-[1.08] text-balance">
            Todo lo que necesitas saber
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground font-normal leading-relaxed text-balance">
            Respuestas claras y concretas sobre la contratación directa, verificación legal y operación en Yucatán y Quintana Roo.
          </p>

          {/* Role Switcher using shadcn semantic tokens */}
          <div className="inline-flex p-1.5 rounded-2xl bg-muted border border-border mt-4 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setActiveRole("company");
                setOpenIdx(0);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeRole === "company"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="size-4 text-primary" />
              <span>Para Empresas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole("candidate");
                setOpenIdx(0);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeRole === "candidate"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCheck className="size-4 text-primary" />
              <span>Para Candidatos</span>
            </button>
          </div>
        </div>

        {/* Accordions List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <FAQItem
              key={idx}
              question={faq.q}
              answer={faq.a}
              isOpen={openIdx === idx}
              onToggle={() => setOpenIdx(openIdx === idx ? null : idx)}
            />
          ))}
        </div>

        {/* Support Direct Assistance Callout */}
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
              <MessageSquare className="size-4 text-primary" />
              <span>¿Tienes alguna otra duda o caso especial?</span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal max-w-xl">
              Nuestro equipo regional en Mérida y Cancún te atiende directamente por WhatsApp en horario laboral.
            </p>
          </div>

          <Button
            render={<Link href="/contact" />}
            variant="outline"
            className="h-11 px-6 rounded-2xl border-border bg-background hover:bg-muted text-foreground font-semibold text-xs sm:text-sm shrink-0 cursor-pointer shadow-2xs gap-2"
          >
            <span>Contactar a Soporte</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>

      </div>
    </section>
  );
}
