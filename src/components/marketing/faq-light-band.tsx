"use client";

import React, { useState } from "react";
import { ChevronDown, Building2, UserCheck } from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border border-[var(--color-fiord-200)] bg-white rounded-[16px] overflow-hidden transition-colors shadow-2xs">
      <button
        onClick={onToggle}
        className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left font-semibold text-[16px] text-[var(--color-fiord-950)] hover:bg-[var(--color-fiord-50)] transition-colors cursor-pointer select-none"
      >
        <span className="leading-snug">{question}</span>
        <div className={`size-6 rounded-full flex items-center justify-center shrink-0 border border-[var(--color-fiord-200)] text-[var(--color-fiord-700)] transition-transform duration-200 ${isOpen ? "rotate-180 bg-[var(--color-fiord-950)] text-white" : ""}`}>
          <ChevronDown className="size-3.5" />
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-[14px] text-[var(--color-fiord-700)] font-medium leading-relaxed border-t border-[var(--color-fiord-200)] pt-4">
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
      a: "No. No retenemos comisiones por colocación de personal ni deducimos porcentajes del sueldo del trabajador. La vinculación es 100% directa y transparente.",
    },
    {
      q: "¿Cómo funciona la conexión directa por WhatsApp?",
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

  const faqs = activeRole === "company" ? companyFaqs : candidateFaqs;

  return (
    <section id="faq" className="bg-[var(--color-fiord-50)] text-[var(--color-fiord-950)] py-20 sm:py-28 border-b border-[var(--color-fiord-200)] text-left">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <span className="text-[13px] font-bold text-[var(--color-fiord-800)] tracking-[0.24px] uppercase block font-mono">
            Preguntas Frecuentes
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.48px] leading-[1.08] text-[var(--color-fiord-950)] font-sans">
            Todo lo que necesitas saber
          </h2>
          <p className="text-base sm:text-lg text-[var(--color-fiord-700)] font-normal leading-relaxed">
            Respuestas claras y concretas sobre la operación en Yucatán y Quintana Roo.
          </p>

          <div className="inline-flex p-1 rounded-full bg-white border border-[var(--color-fiord-200)] mt-4 shadow-2xs">
            <button
              onClick={() => {
                setActiveRole("company");
                setOpenIdx(0);
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                activeRole === "company"
                  ? "bg-[var(--color-fiord-950)] text-white shadow-xs"
                  : "text-[var(--color-fiord-700)] hover:text-[var(--color-fiord-950)]"
              }`}
            >
              <Building2 className="size-3.5" />
              <span>Dudas de Empresas</span>
            </button>
            <button
              onClick={() => {
                setActiveRole("candidate");
                setOpenIdx(0);
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                activeRole === "candidate"
                  ? "bg-[var(--color-fiord-950)] text-white shadow-xs"
                  : "text-[var(--color-fiord-700)] hover:text-[var(--color-fiord-950)]"
              }`}
            >
              <UserCheck className="size-3.5" />
              <span>Dudas de Candidatos</span>
            </button>
          </div>
        </div>

        {/* Accordions */}
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

      </div>
    </section>
  );
}
