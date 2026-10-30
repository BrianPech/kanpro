"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  KanproIsotype,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  Briefcase,
  ShieldCheck,
  Compass,
  UserCheck,
  Sparkles,
  TrendingUp,
  FileText,
  BookOpen,
  BarChart3,
  HelpCircle,
  type IconComponent,
} from "@/components/ui/icons";

const TRANSITION_EASE = [0.22, 1, 0.36, 1] as const;

export interface NavItem {
  icon: IconComponent;
  title: string;
  description: string;
  href?: string;
}

export interface FeaturedCard {
  tag: string;
  title: string;
  description: string;
  href?: string;
  ctaText?: string;
}

export interface NavCategory {
  items: NavItem[];
  featured: FeaturedCard;
}

export interface Navigation14Props {
  brandName?: string;
  brandHref?: string;
  categories?: Record<string, NavCategory>;
  directLinks?: Array<{ label: string; href: string }>;
  loginText?: string;
  loginHref?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  className?: string;
}

const DEFAULT_CATEGORIES: Record<string, NavCategory> = {
  Empresas: {
    items: [
      {
        icon: Briefcase,
        title: "Publicación de Vacantes",
        description: "Publica ofertas laborales con difusión en Mérida, Cancún y Riviera Maya.",
        href: "/register/company",
      },
      {
        icon: ShieldCheck,
        title: "Expediente Digital SAT",
        description: "Validación automática de CURP, RFC y autenticidad jurídica laboral.",
        href: "/register/company",
      },
      {
        icon: Sparkles,
        title: "Candidatos Verificados",
        description: "Acceso inmediato a talento operativo evaluado y disponible hoy.",
        href: "/dashboard/company/candidates",
      },
    ],
    featured: {
      tag: "0% Comisiones",
      title: "Garantía de Contratación Directa",
      description: "Conecta con personal calificado sin intermediarios ni tarifas abusivas sobre sueldos.",
      href: "/register/company",
      ctaText: "Publicar Vacante",
    },
  },
  Candidatos: {
    items: [
      {
        icon: Compass,
        title: "Explorar Vacantes",
        description: "Cientos de empleos verificados en Cancún, Mérida y Playa del Carmen.",
        href: "/dashboard/candidate/discovery",
      },
      {
        icon: UserCheck,
        title: "Expediente Digital 1-Clic",
        description: "Crea tu perfil laboral respaldado por constancias oficiales gratis.",
        href: "/register/candidate",
      },
      {
        icon: TrendingUp,
        title: "Postulación por WhatsApp",
        description: "Contacto directo con el reclutador sin formularios eternos.",
        href: "/dashboard/candidate/discovery",
      },
    ],
    featured: {
      tag: "100% Gratis",
      title: "Empleos con Certeza Jurídica",
      description: "Empresas auditadas y salarios reales bajo contrato formal y prestaciones de ley.",
      href: "/dashboard/candidate/discovery",
      ctaText: "Buscar Empleo",
    },
  },
  Recursos: {
    items: [
      {
        icon: FileText,
        title: "Comparativa K'anPro",
        description: "Diferencias clave frente a bolsas tradicionales y agencias de staffing.",
        href: "#comparativa",
      },
      {
        icon: BookOpen,
        title: "Documentación Oficial",
        description: "Manuales operativos, guías fiscales SAT y procesos de contratación.",
        href: "/help",
      },
      {
        icon: HelpCircle,
        title: "Preguntas Frecuentes",
        description: "Todo sobre validación de expedientes, CFDI y alta patronal.",
        href: "#faq",
      },
    ],
    featured: {
      tag: "Centro de Ayuda",
      title: "Documentación y Soporte",
      description: "Aprende a gestionar expedientes digitales, altas y contratos sin intermediarios.",
      href: "/help",
      ctaText: "Ver Documentación",
    },
  },
};

const DEFAULT_DIRECT_LINKS = [
  { label: "Comparativa", href: "#comparativa" },
  { label: "Documentación", href: "/help" },
  { label: "Preguntas Frecuentes", href: "#faq" },
];

const FOCUS_VISIBLE_STYLES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function Navigation14({
  brandName = "K’anPro",
  brandHref = "/",
  categories = DEFAULT_CATEGORIES,
  directLinks = DEFAULT_DIRECT_LINKS,
  loginText = "Iniciar Sesión",
  loginHref = "/login",
  primaryCtaText = "Registrarse",
  primaryCtaHref = "/register",
  className = "",
}: Navigation14Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileCategory, setActiveMobileCategory] = useState<string | null>("Empresas");
  const headerRef = useRef<HTMLElement>(null);

  const categoryKeys = Object.keys(categories);

  useEffect(() => {
    if (!activeCategory && !mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveCategory(null);
        setMobileMenuOpen(false);
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveCategory(null);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeCategory, mobileMenuOpen]);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-border transition-colors ${className}`}
      onMouseLeave={() => setActiveCategory(null)}
    >
      <div className="relative w-full">
        {/* Barra Principal de Navegación */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: TRANSITION_EASE }}
          aria-label="Navegación principal"
          className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          {/* Lado Izquierdo: Marca & Menú Desktop */}
          <div className="flex items-center gap-8">
            <Link
              href={brandHref}
              className={`group flex items-center gap-3 transition-opacity hover:opacity-90 ${FOCUS_VISIBLE_STYLES} rounded-xl`}
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform duration-200 group-hover:scale-105">
                <KanproIsotype className="size-5.5" variant="white" />
              </div>
              <span className="font-sans text-xl font-bold tracking-tight text-foreground">
                {brandName}
              </span>
            </Link>

            {/* Triggers de Categoría con Pestaña Animada */}
            <div className="hidden items-center gap-1 md:flex">
              {categoryKeys.map((key) => {
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onMouseEnter={() => setActiveCategory(key)}
                    onFocus={() => setActiveCategory(key)}
                    onClick={() => setActiveCategory((prev) => (prev === key ? null : key))}
                    aria-expanded={isActive}
                    aria-controls="nav14-panel"
                    className={`relative flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${FOCUS_VISIBLE_STYLES} ${
                      isActive
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav14-trigger"
                        className="absolute inset-0 rounded-full bg-muted/80"
                        transition={{ duration: 0.3, ease: TRANSITION_EASE }}
                      />
                    )}
                    <span className="relative z-10">{key}</span>
                    <motion.span
                      className="relative z-10"
                      animate={{ rotate: isActive ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: TRANSITION_EASE }}
                    >
                      <ChevronDown className="size-3.5" />
                    </motion.span>
                  </button>
                );
              })}

              {/* Enlaces Directos */}
              {directLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onMouseEnter={() => setActiveCategory(null)}
                  className={`rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground ${FOCUS_VISIBLE_STYLES}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Lado Derecho: Acciones de Usuario (Desktop) */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href={loginHref}
              className={`rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground hover:bg-muted/40 ${FOCUS_VISIBLE_STYLES}`}
            >
              {loginText}
            </Link>
            <Link
              href={primaryCtaHref}
              className={`inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition-transform duration-150 hover:bg-primary/90 active:scale-[0.98] ${FOCUS_VISIBLE_STYLES}`}
            >
              <span>{primaryCtaText}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Botón Móvil (Hamburguesa / Cerrar) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="nav14-mobile"
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              className={`flex size-10 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted/50 ${FOCUS_VISIBLE_STYLES}`}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </motion.nav>

        {/* Panel Mega Desplegable (Desktop - Sobrepuesto flotante sin layout shift) */}
        <AnimatePresence>
          {activeCategory && categories[activeCategory] && (
            <motion.div
              id="nav14-panel"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: TRANSITION_EASE }}
              className="absolute top-full left-0 right-0 w-full border-b border-border bg-background/98 backdrop-blur-xl shadow-2xl md:block hidden overflow-hidden z-50"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: TRANSITION_EASE }}
                  className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8"
                >
                  {/* Cuadrícula de 3 Ítems por Categoría */}
                  <div className="grid gap-2 sm:grid-cols-3">
                    {categories[activeCategory].items.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href || "#"}
                        onClick={() => setActiveCategory(null)}
                        className={`group flex h-full flex-col rounded-2xl p-4 transition-colors duration-200 hover:bg-muted/50 ${FOCUS_VISIBLE_STYLES}`}
                      >
                        <span className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors duration-200 group-hover:border-primary/40 group-hover:text-primary">
                          <item.icon className="size-4.5" />
                        </span>
                        <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                          {item.title}
                          <ArrowRight className="size-3.5 text-primary opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                        </span>
                        <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                          {item.description}
                        </span>
                      </Link>
                    ))}
                  </div>

                  {/* Tarjeta Destacada Lateral (Featured Card) */}
                  <Link
                    href={categories[activeCategory].featured.href || "#"}
                    onClick={() => setActiveCategory(null)}
                    className={`group flex flex-col justify-between rounded-2xl bg-secondary/50 p-5 border border-border/80 transition-all duration-200 hover:bg-secondary/80 hover:border-primary/30 ${FOCUS_VISIBLE_STYLES}`}
                  >
                    <span className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                      {categories[activeCategory].featured.tag}
                    </span>
                    <span className="mt-6">
                      <span className="block text-sm font-bold text-foreground">
                        {categories[activeCategory].featured.title}
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                        {categories[activeCategory].featured.description}
                      </span>
                      <span className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <span>{categories[activeCategory].featured.ctaText || "Conoce más"}</span>
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </Link>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menú Móvil Desplegable (Sobrepuesto en móvil) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="nav14-mobile"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: TRANSITION_EASE }}
              className="absolute top-full left-0 right-0 w-full border-b border-border bg-background/98 backdrop-blur-xl shadow-2xl md:hidden overflow-hidden max-h-[calc(100vh-5rem)] overflow-y-auto z-50"
            >
              <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
                {categoryKeys.map((catKey) => {
                  const isExpanded = activeMobileCategory === catKey;
                  return (
                    <div key={catKey} className="border-b border-border/40 last:border-b-0">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMobileCategory((prev) => (prev === catKey ? null : catKey))
                        }
                        aria-expanded={isExpanded}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/50 ${FOCUS_VISIBLE_STYLES}`}
                      >
                        <span>{catKey}</span>
                        <motion.span
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.25, ease: TRANSITION_EASE }}
                        >
                          <ChevronDown className="size-4 text-muted-foreground" />
                        </motion.span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: TRANSITION_EASE }}
                            className="overflow-hidden"
                          >
                            <div className="grid gap-1 px-2 pb-3 pt-1">
                              {categories[catKey].items.map((item) => (
                                <Link
                                  key={item.title}
                                  href={item.href || "#"}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className={`flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/50 ${FOCUS_VISIBLE_STYLES}`}
                                >
                                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary">
                                    <item.icon className="size-4" />
                                  </span>
                                  <div>
                                    <span className="block text-sm font-medium text-foreground">
                                      {item.title}
                                    </span>
                                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                                      {item.description}
                                    </span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Enlaces Directos Móviles */}
                <div className="py-2">
                  {directLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50 ${FOCUS_VISIBLE_STYLES}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                {/* CTAs Móviles */}
                <div className="mt-3 grid gap-2.5 pt-3 border-t border-border">
                  <Link
                    href={loginHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-full border border-border px-5 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted/50 ${FOCUS_VISIBLE_STYLES}`}
                  >
                    {loginText}
                  </Link>
                  <Link
                    href={primaryCtaHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 ${FOCUS_VISIBLE_STYLES}`}
                  >
                    {primaryCtaText}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
