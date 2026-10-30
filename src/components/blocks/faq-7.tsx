"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus, Sparkles, HelpCircle } from "@/components/ui/icons";

const TRANSITION_EASE = [0.22, 1, 0.36, 1] as const;

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  label: string;
  description: string;
  faqs: FAQItem[];
}

export interface Faq7Props {
  badgeText?: string;
  title?: string;
  description?: string;
  categories?: FAQCategory[];
  className?: string;
}

const DEFAULT_CATEGORIES: FAQCategory[] = [
  {
    id: "empresas",
    label: "Empresas y Reclutamiento",
    description: "Publicación de vacantes, selección y contacto directo.",
    faqs: [
      {
        question: "¿K'anPro cobra comisión por cada persona contratada?",
        answer:
          "No. No retenemos comisiones por colocación de personal ni deducimos porcentajes del sueldo del trabajador. La vinculación entre tu negocio y el talento es 100% directa y transparente.",
      },
      {
        question: "¿Cómo funciona la conexión directa por WhatsApp?",
        answer:
          "Al revisar a un aspirante en tu panel de reclutamiento, haces clic en el botón de WhatsApp y se abre un chat con el candidato con mensaje prearmado y enlace para agendar entrevista presencial o virtual.",
      },
      {
        question: "¿Puedo segmentar vacantes por colonias en Mérida o la Riviera Maya?",
        answer:
          "Sí. Puedes asignar la ubicación exacta de tu sucursal (Altabrisa, Montejo, Centro, Playa del Carmen, Cancún Huayacán) para priorizar a los candidatos que viven a menos de 3.5 km de tu centro de trabajo.",
      },
      {
        question: "¿Cómo publico mi primera vacante y cuánto tarda en activarse?",
        answer:
          "El registro de tu empresa y la publicación toman menos de 5 minutos. Una vez validados los datos básicos, la oferta se difunde de inmediato en el catálogo regional.",
      },
    ],
  },
  {
    id: "candidatos",
    label: "Candidatos y Empleo",
    description: "Postulaciones, expediente digital y seguridad para aspirantes.",
    faqs: [
      {
        question: "¿Tiene algún costo registrar mi CV o postularme a vacantes?",
        answer:
          "No. K'anPro es 100% gratuito para todos los trabajadores y profesionistas. Nunca te cobraremos por crear tu expediente, verificar tus datos ni por postularte a las ofertas.",
      },
      {
        question: "¿Cómo me contactan las empresas a las que me postulo?",
        answer:
          "Los reclutadores revisan tu perfil auditado y te envían un mensaje directo por WhatsApp o te llaman por teléfono para agendar la entrevista formal sin intermediarios.",
      },
      {
        question: "¿Qué beneficio tiene completar el expediente al 100%?",
        answer:
          "Los perfiles con expediente completo (INE, CURP, comprobante de domicilio y constancia fiscal) reciben la insignia de Prioridad Máxima y aparecen en las primeras posiciones de búsqueda para empleadores de la región.",
      },
      {
        question: "¿Puedo buscar empleos cercanos a mi domicilio?",
        answer:
          "Sí. La plataforma ordena automáticamente las ofertas laborales por proximidad a tu colonia en Mérida o Quintana Roo para que ahorres tiempo y dinero en traslados diarios.",
      },
    ],
  },
  {
    id: "seguridad",
    label: "Certeza Jurídica y SAT",
    description: "Auditoría fiscal de 13 puntos, privacidad y protección de datos.",
    faqs: [
      {
        question: "¿Qué implica la Auditoría Legal de 13 Puntos SAT?",
        answer:
          "Es una verificación que valida el Acta Constitutiva con folio mercantil, RFC con Constancia 32-D vigente, Domicilio Fiscal y Poder Notarial del representante para otorgar a tu negocio el Sello Oficial de Empresa Confiable en la Península.",
      },
      {
        question: "¿Cómo se protegen los documentos sensibles (INE, CURP, RFC)?",
        answer:
          "Bajo la normativa mexicana LFPDPPP, los documentos sensibles están cifrados en tránsito y reposo. Las empresas deben solicitar acceso explícito y el candidato autorizarlo directamente desde su teléfono.",
      },
      {
        question: "¿K'anPro reemplaza el contrato laboral formal?",
        answer:
          "K'anPro facilita la vinculación directa, el expediente digital y la verificación fiscal. El contrato formal de trabajo y el alta patronal ante el IMSS se formalizan directamente entre la empresa y el trabajador conforme a la Ley Federal del Trabajo.",
      },
    ],
  },
  {
    id: "cobertura",
    label: "Cobertura y Operación",
    description: "Ciudades activas, tipos de puesto y canales de soporte.",
    faqs: [
      {
        question: "¿En qué ciudades opera actualmente K'anPro?",
        answer:
          "Operamos activamente en Cancún, Playa del Carmen, Tulum, Mérida y los principales corredores turísticos, comerciales y logísticos de Quintana Roo y Yucatán.",
      },
      {
        question: "¿Qué tipo de puestos y perfiles se vinculan en la plataforma?",
        answer:
          "Abarcamos personal operativo (hotelería, restaurantes, comercio, logística) y perfiles administrativos, técnicos y gerenciales especializados en las dinámicas del Sureste.",
      },
      {
        question: "¿Ofrecen soporte técnico o asesoría personalizada?",
        answer:
          "Sí. Nuestro equipo de soporte regional está disponible por WhatsApp y correo electrónico para resolver dudas sobre expedientes, validaciones fiscales y gestión de vacantes.",
      },
    ],
  },
];

const FOCUS_VISIBLE_STYLES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function Faq7({
  badgeText = "Centro de Ayuda y Preguntas Frecuentes",
  title = "Respuestas claras a tus dudas laborales",
  description = "Conoce cómo funciona nuestra red de vinculación directa, la validación fiscal del SAT y las garantías para empresas y candidatos en el Sureste.",
  categories = DEFAULT_CATEGORIES,
  className = "",
}: Faq7Props) {
  const shouldReduceMotion = useReducedMotion();
  const [activeTabId, setActiveTabId] = useState<string>(categories[0]?.id || "empresas");
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const activeCategory =
    categories.find((cat) => cat.id === activeTabId) ?? categories[0] ?? DEFAULT_CATEGORIES[0];

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: TRANSITION_EASE },
    },
  };

  return (
    <section
      id="faq"
      className={`w-full bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 text-foreground ${className}`}
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: TRANSITION_EASE }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <Sparkles className="size-3.5" />
            <span>{badgeText}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        </motion.div>

        {/* Rejilla de Categorías y Preguntas */}
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: TRANSITION_EASE }}
          className="mt-10 grid grid-cols-1 gap-8 lg:mt-14 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12"
        >
          {/* Riel Lateral de Categorías */}
          <div
            role="tablist"
            aria-label="Categorías de preguntas"
            aria-orientation="vertical"
            className="flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-28 lg:flex-col lg:self-start lg:overflow-visible lg:pb-0"
          >
            {categories.map((cat) => {
              const isSelected = cat.id === activeTabId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  id={`faq7-tab-${cat.id}`}
                  aria-selected={isSelected}
                  aria-controls={`faq7-panel-${cat.id}`}
                  onClick={() => {
                    setActiveTabId(cat.id);
                    setExpandedIndex(0);
                  }}
                  className={`relative shrink-0 cursor-pointer rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 ${FOCUS_VISIBLE_STYLES} ${
                    isSelected
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="faq7-active-tab"
                      transition={{ duration: 0.35, ease: TRANSITION_EASE }}
                      className="absolute inset-0 rounded-xl bg-card border border-border shadow-xs"
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-between gap-4">
                    <span>{cat.label}</span>
                    <span
                      className={`text-xs tabular-nums font-mono px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-primary/10 text-primary font-bold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {cat.faqs.length}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Panel de Contenido de Preguntas */}
          <div className="min-h-[440px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeCategory.id}
                role="tabpanel"
                id={`faq7-panel-${activeCategory.id}`}
                aria-labelledby={`faq7-tab-${activeCategory.id}`}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                transition={{ duration: 0.3, ease: TRANSITION_EASE }}
                className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
              >
                {/* Cabecera del Panel */}
                <div className="border-b border-border px-6 py-5 sm:px-8 sm:py-6 bg-muted/20">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {activeCategory.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeCategory.description}
                  </p>
                </div>

                {/* Acordeón de Preguntas */}
                <motion.div
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                  initial="hidden"
                  animate="show"
                >
                  {activeCategory.faqs.map((faq, index) => {
                    const isExpanded = expandedIndex === index;
                    return (
                      <motion.div
                        key={faq.question}
                        variants={itemVariants}
                        className={
                          index !== activeCategory.faqs.length - 1
                            ? "border-b border-border"
                            : ""
                        }
                      >
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={`faq7-answer-${activeCategory.id}-${index}`}
                          onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                          className={`group flex w-full cursor-pointer items-center justify-between gap-5 px-6 py-5 text-left sm:px-8 sm:py-6 ${FOCUS_VISIBLE_STYLES}`}
                        >
                          <span className="flex-1 text-sm sm:text-base font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary">
                            {faq.question}
                          </span>
                          <motion.span
                            animate={{ rotate: isExpanded ? 45 : 0 }}
                            transition={{ duration: 0.3, ease: TRANSITION_EASE }}
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                              isExpanded
                                ? "bg-primary text-primary-foreground shadow-2xs"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            }`}
                          >
                            <Plus className="size-4 stroke-[2.5]" />
                          </motion.span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              id={`faq7-answer-${activeCategory.id}-${index}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                height: { duration: 0.35, ease: TRANSITION_EASE },
                                opacity: { duration: 0.25, ease: TRANSITION_EASE },
                              }}
                              className="overflow-hidden bg-muted/15"
                            >
                              <p className="max-w-2xl px-6 pb-6 text-xs sm:text-sm leading-relaxed text-muted-foreground sm:px-8 sm:pb-7">
                                {faq.answer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
