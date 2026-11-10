"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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
    label: "Empresas & Operación RH",
    description: "Reclutamiento, radar de talento, checador QR y expediente digital.",
    faqs: [
      {
        question: "¿K'anPro cobra comisión por cada persona contratada?",
        answer:
          "No. No cobramos comisiones por colocación de personal ni deducimos porcentajes del sueldo del trabajador. La vinculación entre tu negocio y el talento es 100% directa y transparente.",
      },
      {
        question: "¿Cómo funciona el Checador QR de asistencia y geocercas GPS?",
        answer:
          "Desde tu panel de Asistencia generas un Cartel QR oficial para imprimir y colocar en tu sucursal. Los colaboradores escanean el código desde la cámara de su teléfono móvil; el sistema valida su coordenada geográfica, calcula la puntualidad con la tolerancia de 15 minutos por ley y registra retardos o asistencias en tiempo real sin requerir hardware biométrico costoso.",
      },
      {
        question: "¿Qué es el Radar de Talento Peninsular y cómo se usa?",
        answer:
          "Es un motor de búsqueda proactivo que te permite explorar perfiles disponibles en Mérida, Cancún, Playa del Carmen, Tulum, Cozumel y Chetumal. Puedes filtrar por puesto deseado, habilidades y experiencia, e invitar directamente a candidatos calificados a tus vacantes abiertas en un clic.",
      },
      {
        question: "¿Cómo gestiono el Expediente Digital 360 y las Vacaciones LFT de mi plantilla?",
        answer:
          "Cada empleado contratado cuenta con un expediente centralizado con sus datos fiscales (RFC, CURP, NSS), salario diario integrado (SDI), contratos y constancias. Además, el módulo de Vacaciones Dignas (Art. 76 LFT) calcula automáticamente los días de descanso acumulados por antigüedad y permite autorizar o denegar solicitudes con un clic.",
      },
      {
        question: "¿Cómo publico mi primera vacante y cuánto tarda en activarse?",
        answer:
          "El wizard guiado toma 4 pasos: puesto y horario, ubicación y sueldo en MXN, descripción detallada y beneficios (IMSS, propinas, comedor, transporte). Una vez publicada, se indexa al instante en la bolsa peninsular.",
      },
    ],
  },
  {
    id: "candidatos",
    label: "Candidatos & Colaboradores",
    description: "Bolsa de trabajo, expediente verificado y portal del empleado.",
    faqs: [
      {
        question: "¿Tiene algún costo registrar mi CV o postularme a vacantes?",
        answer:
          "No. K'anPro es 100% gratuito para todos los trabajadores y profesionistas. Nunca te cobraremos por crear tu expediente, verificar tus datos ni por postularte a las ofertas de empleo.",
      },
      {
        question: "¿Qué ocurre con mi cuenta una vez que soy contratado por una empresa?",
        answer:
          "Tu cuenta evoluciona a tu Portal del Empleado oficial. Desde allí puedes marcar tu asistencia diaria escaneando el código QR de tu sucursal, revisar y firmar tus contratos laborales digitales y consultar tu saldo de vacaciones por ley para solicitar descansos.",
      },
      {
        question: "¿Cómo sé que una oferta de trabajo es legítima y no un fraude?",
        answer:
          "Todas las empresas empleadoras con el distintivo 'Empresa Verificada' pasaron por una auditoría legal corporativa ante K'anPro, validando su Acta Constitutiva, Razón Social y RFC ante el SAT. Además, todas las vacantes publican su salario real en MXN y prestaciones obligatorias.",
      },
      {
        question: "¿Cómo funciona el cálculo de Vacaciones Dignas (Art. 76 LFT)?",
        answer:
          "Conforme a la reforma laboral mexicana, acumulas un mínimo de 12 días laborables pagados al cumplir tu primer año, aumentando 2 días por cada año adicional hasta llegar a 20. El sistema calcula tus días automáticamente según tu fecha de ingreso.",
      },
      {
        question: "¿Cómo se protegen mis documentos personales (INE, CURP, comprobantes)?",
        answer:
          "Tus documentos se resguardan cifrados conforme a la Ley Federal de Protección de Datos Personales (LFPDPPP). Solo las empresas a cuyas vacantes te postules o que cuenten con tu autorización expresa tienen acceso a cotejar tu documentación.",
      },
    ],
  },
  {
    id: "seguridad",
    label: "Certeza Jurídica & SAT",
    description: "Auditoría legal de 13 puntos, cumplimiento LFT y contratos digitales.",
    faqs: [
      {
        question: "¿Qué es el Sello de Verificación de 13 Requisitos SAT?",
        answer:
          "Es el proceso de debida diligencia de K'anPro para personas morales y físicas con actividad empresarial: cotejamos denominación social, Acta Constitutiva en PDF, RFC válido de 12 o 13 posiciones, Constancia de Situación Fiscal (CSF) actualizada, domicilio fiscal, identificación oficial y Poder Notarial del representante legal.",
      },
      {
        question: "¿Qué validez tienen los contratos y firmas digitales en la plataforma?",
        answer:
          "Los contratos laborales generados en la plataforma se apegan a los lineamientos de la Ley Federal del Trabajo (tiempo determinado, indeterminado, obra determinada o periodo de prueba) y permiten estampar firma electrónica con registro de fecha, hora y trazabilidad legal.",
      },
    ],
  },
  {
    id: "cobertura",
    label: "Cobertura en la Península",
    description: "Presencia regional, turnos y sectores operativos.",
    faqs: [
      {
        question: "¿En qué ciudades opera actualmente K'anPro?",
        answer:
          "Operamos activamente en los polos turísticos y urbanos del Sureste: Cancún, Playa del Carmen, Tulum, Cozumel, Chetumal (Quintana Roo) y Mérida (Yucatán), con filtros específicos por zonas y colonias.",
      },
      {
        question: "¿Qué tipo de puestos y sectores atiende la plataforma?",
        answer:
          "Especialmente personal operativo, técnico y administrativo para hotelería, restaurantes, comercio minorista, logística, mantenimiento, construcción y servicios corporativos propios de la economía regional.",
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
