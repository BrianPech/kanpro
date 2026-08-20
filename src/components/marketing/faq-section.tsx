"use client";

import React, { useState } from "react";
import { ChevronDown, Building2, UserCheck } from "lucide-react";

interface FAQItemProps {
  num: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ num, question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border border-border bg-card rounded-xl overflow-hidden transition-colors">
      <button
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-bold text-xs sm:text-sm text-foreground hover:bg-muted/30 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">{num}</span>
          <span className="leading-snug">{question}</span>
        </div>
        <div className={`size-5 rounded flex items-center justify-center shrink-0 border border-border text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180 bg-foreground text-background" : ""}`}>
          <ChevronDown className="size-3.5" />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-muted-foreground font-normal leading-relaxed border-t border-border pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

export function FaqSection() {
  const [activeTab, setActiveTab] = useState<"company" | "candidate">("company");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const companyFaqs = [
    {
      q: "¿K'anPro cobra comisión por cada persona contratada?",
      a: "No. No retenemos comisiones por colocación de personal ni deducimos porcentajes del sueldo del trabajador. La vinculación es 100% directa.",
    },
    {
      q: "¿Cómo funciona la conexión de 1-clic por WhatsApp?",
      a: "Al revisar a un aspirante en tu Applications Inbox, das clic en el botón de WhatsApp y se abre un chat con el candidato incluyendo el mensaje prearmado con los datos del puesto y la cita para entrevista.",
    },
    {
      q: "¿Qué implica la Auditoría Legal de 13 Puntos SAT?",
      a: "Es una verificación que valida tu Acta Constitutiva con folio mercantil, RFC con Constancia de Situación Fiscal vigente, Domicilio Fiscal y Poder Notarial del representante para otorgar a tu negocio el Sello de Empresa Confiable.",
    },
    {
      q: "¿Cómo puedo consultar los documentos oficiales del aspirante (INE, CURP)?",
      a: "Bajo la normativa mexicana LFPDPPP, los documentos sensibles están protegidos. Presionas 'Solicitar Acceso' y el candidato recibe una solicitud que debe autorizar explícitamente.",
    },
    {
      q: "¿Puedo segmentar vacantes por colonias en Mérida o la Riviera Maya?",
      a: "Sí. Puedes asignar la ubicación exacta de tu sucursal (Altabrisa, Montejo, Centro, Playa del Carmen) para priorizar a los candidatos que viven a menos de 3.5 km de tu centro de trabajo.",
    },
  ];

  const candidateFaqs = [
    {
      q: "¿Tiene algún costo registrar mi CV o postularme a vacantes?",
      a: "No. K'anPro es 100% gratuito para todos los trabajadores y profesionistas. Nunca te cobraremos por crear tu expediente ni por aplicar a ofertas.",
    },
    {
      q: "¿Mis identificaciones oficiales (INE, comprobantes) son públicas?",
      a: "No. Tu expediente digital está protegido y cifrado. Ninguna empresa puede ver tus documentos sensibles a menos que tú aceptes expresamente su solicitud de acceso.",
    },
    {
      q: "¿Cómo me contactan las empresas a las que me postulo?",
      a: "Los reclutadores revisan tu perfil y te envían un mensaje directo por WhatsApp o te llaman por teléfono para agendar la entrevista.",
    },
    {
      q: "¿Qué beneficio tiene completar el expediente al 100%?",
      a: "Los perfiles con expediente completo (INE, CURP, comprobante y referencias) reciben la insignia de Prioridad Máxima y aparecen en las primeras posiciones de búsqueda para los empleadores.",
    },
    {
      q: "¿Puedo buscar empleos cercanos a mi domicilio?",
      a: "Sí. La plataforma ordena las ofertas laborales por proximidad a tu colonia en Mérida o Quintana Roo para que ahorres tiempo y dinero en transporte.",
    },
  ];

  const faqs = activeTab === "company" ? companyFaqs : candidateFaqs;

  return (
    <section id="faq" className="py-16 sm:py-24 border-b border-border bg-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-left">
        
        {/* Header Block */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
            DESPACHO DE CONSULTAS DIRECTAS
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground font-sans">
            Preguntas Frecuentes
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono">
            Respuestas claras y concretas sobre la operación en Yucatán y Quintana Roo.
          </p>

          <div className="inline-flex p-1 rounded-xl bg-card border border-border mt-3">
            <button
              onClick={() => {
                setActiveTab("company");
                setOpenIdx(0);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "company"
                  ? "bg-foreground text-background shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="size-3.5" />
              <span>Dudas de Empresas</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("candidate");
                setOpenIdx(0);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "candidate"
                  ? "bg-foreground text-background shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCheck className="size-3.5" />
              <span>Dudas de Candidatos</span>
            </button>
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-2.5">
          {faqs.map((faq, idx) => (
            <FAQItem
              key={idx}
              num={`[0${idx + 1}]`}
              question={faq.q}
              answer={faq.a}
              isOpen={openIdx === idx}
              onToggle={() => setOpenIdx(openIdx === idx ? null : idx)}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
