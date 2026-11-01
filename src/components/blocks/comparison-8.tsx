"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Minus, X, Sparkles } from "@/components/ui/icons";

const TRANSITION_EASE = [0.22, 1, 0.36, 1] as const;

export type ComparisonStatus = "yes" | "partial" | "no";

export interface ComparisonCell {
  status: ComparisonStatus;
  note?: string;
}

export interface ComparisonRow {
  feature: string;
  cells: ComparisonCell[];
}

export interface ComparisonCategory {
  title: string;
  rows: ComparisonRow[];
}

export interface ComparisonColumn {
  name: string;
  detail: string;
  featured?: boolean;
}

export interface Comparison8Props {
  title?: string;
  description?: string;
  columns?: ComparisonColumn[];
  categories?: ComparisonCategory[];
  footnote?: string;
  className?: string;
}

const DEFAULT_COLUMNS: ComparisonColumn[] = [
  {
    name: "K’anPro",
    detail: "Red de empleo directo y validación legal",
    featured: true,
  },
  {
    name: "Bolsas Tradicionales",
    detail: "Portales de empleo genéricos",
    featured: false,
  },
  {
    name: "Agencias de Staffing",
    detail: "Intermediarias de contratación",
    featured: false,
  },
];

const DEFAULT_CATEGORIES: ComparisonCategory[] = [
  {
    title: "Modelo Económico y Costos",
    rows: [
      {
        feature: "Comisión por contratación",
        cells: [
          { status: "yes", note: "0% (Sin retención sobre sueldos)" },
          { status: "partial", note: "Cobro recurrente por anuncio" },
          { status: "no", note: "15% a 30% del sueldo anual" },
        ],
      },
      {
        feature: "Publicación de vacantes",
        cells: [
          { status: "yes", note: "Acceso y gestión transparente" },
          { status: "partial", note: "Pago previo obligatorio" },
          { status: "no", note: "Tarifa inicial elevada" },
        ],
      },
      {
        feature: "Transparencia de sueldos",
        cells: [
          { status: "yes", note: "Sueldos obligatorios en MXN" },
          { status: "no", note: "Sueldos ocultos / 'A convenir'" },
          { status: "partial", note: "Negociación según intermediario" },
        ],
      },
    ],
  },
  {
    title: "Atracción y Radar de Talento",
    rows: [
      {
        feature: "Radar proactivo de candidatos",
        cells: [
          { status: "yes", note: "Búsqueda activa e invitación en 1 clic" },
          { status: "no", note: "Espera pasiva de postulaciones" },
          { status: "partial", note: "Base interna de agencia con cargo" },
        ],
      },
      {
        feature: "Canal de contacto directo",
        cells: [
          { status: "yes", note: "WhatsApp directo sin intermediarios" },
          { status: "no", note: "Buzón web o correo lento" },
          { status: "no", note: "Filtro obligatorio de agencia" },
        ],
      },
      {
        feature: "Filtro hiperlocal por zona",
        cells: [
          { status: "yes", note: "Mérida, Cancún, Riviera Maya, Tulum" },
          { status: "partial", note: "Solo estado o municipio general" },
          { status: "partial", note: "Búsqueda manual aleatoria" },
        ],
      },
    ],
  },
  {
    title: "Operación Laboral y Cumplimiento LFT",
    rows: [
      {
        feature: "Control de Asistencia & Checador QR",
        cells: [
          { status: "yes", note: "Cartel QR oficial y geocercas GPS" },
          { status: "no", note: "No disponible en portales de empleo" },
          { status: "partial", note: "Reloj checador físico costoso" },
        ],
      },
      {
        feature: "Expediente Digital 360",
        cells: [
          { status: "yes", note: "RFC, CURP, NSS, contratos y salarios" },
          { status: "no", note: "Solo CV en PDF sin verificar" },
          { status: "partial", note: "Archiveros físicos en papel" },
        ],
      },
      {
        feature: "Vacaciones Dignas Art. 76 LFT",
        cells: [
          { status: "yes", note: "Cálculo legal automático y solicitudes" },
          { status: "no", note: "No disponible en portales de empleo" },
          { status: "partial", note: "Hojas de Excel manuales" },
        ],
      },
    ],
  },
  {
    title: "Certeza Jurídica y Validación SAT",
    rows: [
      {
        feature: "Auditoría fiscal de empresas (13 puntos)",
        cells: [
          { status: "yes", note: "Acta Constitutiva, CSF y RFC cotejados" },
          { status: "no", note: "Sin verificación (Riesgo de fraude)" },
          { status: "partial", note: "Validación externa con costo" },
        ],
      },
      {
        feature: "Portal del Colaborador Móvil",
        cells: [
          { status: "yes", note: "Checador con cámara y contratos web" },
          { status: "no", note: "Inexistente tras la contratación" },
          { status: "partial", note: "Apps pesadas de terceros" },
        ],
      },
      {
        feature: "Protección de datos personales",
        cells: [
          { status: "yes", note: "Cifrado LFPDPPP con consentimiento" },
          { status: "partial", note: "Información expuesta en la web" },
          { status: "partial", note: "Compartido con terceros" },
        ],
      },
    ],
  },
];

const LEGEND_ITEMS: Array<{ status: ComparisonStatus; label: string }> = [
  { status: "yes", label: "Incluido" },
  { status: "partial", label: "Parcial o con costo extra" },
  { status: "no", label: "No disponible" },
];

const GRID_COLS =
  "grid grid-cols-[minmax(200px,1.5fr)_minmax(190px,1.2fr)_minmax(170px,1fr)_minmax(170px,1fr)]";

const CONTAINER_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const ROW_VARIANTS = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.45, ease: TRANSITION_EASE } },
};

function StatusIcon({ status, featured }: { status: ComparisonStatus; featured?: boolean }) {
  if (status === "yes") {
    return (
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
          featured
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "border border-primary/40 text-primary bg-primary/10"
        }`}
        aria-hidden="true"
      >
        <Check className="size-3.5 stroke-[2.5]" />
      </span>
    );
  }

  if (status === "partial") {
    return (
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground bg-muted/30"
        aria-hidden="true"
      >
        <Minus className="size-3.5 stroke-[2.5]" />
      </span>
    );
  }

  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/70"
      aria-hidden="true"
    >
      <X className="size-3.5 stroke-[2.5]" />
    </span>
  );
}

function StatusCell({ cell, featured }: { cell: ComparisonCell; featured?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <StatusIcon status={cell.status} featured={featured} />
      {cell.note ? (
        <span
          className={`text-xs sm:text-sm leading-snug ${
            featured
              ? "font-semibold text-foreground"
              : "text-muted-foreground font-medium"
          }`}
        >
          {cell.note}
        </span>
      ) : (
        <span className="sr-only">No disponible</span>
      )}
    </div>
  );
}

export function Comparison8({
  title = "Certeza jurídica y agilidad sin comisiones abusivas",
  description = "Compara cómo K'anPro transforma la vinculación laboral en Cancún, Mérida y la Riviera Maya frente a bolsas de trabajo genéricas y agencias de staffing tradicionales.",
  columns = DEFAULT_COLUMNS,
  categories = DEFAULT_CATEGORIES,
  footnote = "Evaluación comparativa basada en especificaciones comerciales públicas y estándares operativos del mercado laboral en México, 2026.",
  className = "",
}: Comparison8Props) {
  return (
    <section
      id="comparativa"
      className={`w-full bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 text-foreground ${className}`}
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* Encabezado y Leyenda de Estatus */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: TRANSITION_EASE }}
          className="mb-10 grid gap-6 sm:mb-12 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
              <Sparkles className="size-3.5" />
              <span>Matriz Comparativa Regional</span>
            </div>
            <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          </div>

          {/* Chips de Leyenda */}
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:justify-end select-none">
            {LEGEND_ITEMS.map((item) => (
              <li key={item.status} className="flex items-center gap-2">
                <StatusIcon status={item.status} />
                <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Tabla Matriz con Scroll Horizontal en Móvil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: TRANSITION_EASE }}
          className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-foreground/5"
        >
          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              {/* Cabecera de Columnas */}
              <div className={`${GRID_COLS} border-b border-border bg-muted/20`}>
                <div className="sticky left-0 z-10 flex items-end bg-card px-6 py-5 lg:px-8">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Capacidades Clave
                  </span>
                </div>
                {columns.map((col) => (
                  <div
                    key={col.name}
                    className={`px-5 py-5 ${
                      col.featured
                        ? "border-x border-border/80 bg-primary/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {col.featured && (
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-2xs">
                          <Sparkles className="size-3.5" />
                        </span>
                      )}
                      <span
                        className={`text-sm sm:text-base font-bold ${
                          col.featured ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {col.name}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {col.detail}
                    </p>
                  </div>
                ))}
              </div>

              {/* Secciones y Filas de Comparación */}
              {categories.map((category, catIdx) => (
                <motion.div
                  key={category.title}
                  variants={CONTAINER_VARIANTS}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                >
                  {/* Encabezado de Categoría */}
                  <div className={`${GRID_COLS} border-b border-border bg-muted/40`}>
                    <div className="sticky left-0 z-10 bg-card px-6 pb-2.5 pt-5 lg:px-8">
                      <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                        {category.title}
                      </h3>
                    </div>
                    <div className="border-x border-border/80 bg-primary/5" />
                    <div />
                    <div />
                  </div>

                  {/* Filas de la Categoría */}
                  {category.rows.map((row, rowIdx) => {
                    const isLast =
                      catIdx === categories.length - 1 &&
                      rowIdx === category.rows.length - 1;
                    return (
                      <motion.div
                        key={row.feature}
                        variants={ROW_VARIANTS}
                        className={`${GRID_COLS} ${
                          isLast ? "" : "border-b border-border"
                        } transition-colors hover:bg-muted/20`}
                      >
                        {/* Nombre del Feature (Sticky) */}
                        <div className="sticky left-0 z-10 flex items-center bg-card px-6 py-4 lg:px-8">
                          <span className="text-xs sm:text-sm font-semibold text-foreground">
                            {row.feature}
                          </span>
                        </div>

                        {/* Celdas de Evaluación */}
                        {row.cells.map((cell, colIdx) => (
                          <div
                            key={colIdx}
                            className={`flex items-center px-5 py-4 ${
                              columns[colIdx]?.featured
                                ? "border-x border-border/80 bg-primary/5"
                                : ""
                            }`}
                          >
                            <StatusCell
                              cell={cell}
                              featured={columns[colIdx]?.featured}
                            />
                          </div>
                        ))}
                      </motion.div>
                    );
                  })}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sombra de Desplazamiento en Pantallas Pequeñas */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent lg:hidden" />
        </motion.div>

        {/* Nota al Pie */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: TRANSITION_EASE }}
          className="mt-6 text-xs leading-relaxed text-muted-foreground flex flex-wrap items-center gap-1.5"
        >
          <span>{footnote}</span>
          <span className="lg:hidden font-medium text-foreground">
            Desliza horizontalmente para comparar todas las opciones.
          </span>
        </motion.p>
      </div>
    </section>
  );
}
