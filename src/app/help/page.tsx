"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  Scale,
  Lock,
  HelpCircle,
  FileText,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Send,
  Menu,
  X,
  ExternalLink,
  Copy,
  Check,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ThumbsUp,
  ThumbsDown,
  Layers,
  Smartphone,
  Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { RoleSwitcher } from "@/components/help/role-switcher";
import { toast } from "sonner";

// Types for Documentation Hierarchy
interface DocItem {
  id: string;
  title: string;
  badge?: string;
  isNew?: boolean;
}

interface DocSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: DocItem[];
}

interface RoleDocs {
  roleName: string;
  roleDescription: string;
  sections: DocSection[];
}

// Docs data structure (Wireframe Outline - Propuesta 3)
const DOCS_DATA: Record<"company" | "candidate", RoleDocs> = {
  company: {
    roleName: "Para Empresas y Patrones",
    roleDescription: "Guías operativas B2B, cumplimiento SAT y atracción de talento local",
    sections: [
      {
        title: "Primeros Pasos",
        icon: Building2,
        items: [
          { id: "alta-empresa", title: "Registro y alta fiscal de empresa", badge: "Esencial" },
          { id: "sucursales-sureste", title: "Gestión de sucursales (Mérida y Cancún)" },
          { id: "invitar-equipo", title: "Permisos y roles de reclutadores" },
        ],
      },
      {
        title: "Validación SAT & Legal",
        icon: ShieldCheck,
        items: [
          { id: "auditoria-sat", title: "Auditoría de 13 Puntos y Opinión 32-D", badge: "Obligatorio" },
          { id: "sello-confiable", title: "Obtención del Sello de Empresa Confiable", isNew: true },
          { id: "cumplimiento-lft", title: "Alineación con LFT y NOM-035" },
        ],
      },
      {
        title: "Vacantes & Proximidad",
        icon: FileText,
        items: [
          { id: "publicar-vacante", title: "Publicar oferta con 0% comisiones", badge: "0% Cobro" },
          { id: "filtro-radio-3km", title: "Segmentación hiperlocal (< 3 km)" },
          { id: "rutas-transporte", title: "Conexión con rutas Va y Ven" },
        ],
      },
      {
        title: "Vinculación & Entrevistas",
        icon: MessageSquare,
        items: [
          { id: "inbox-kanban", title: "Gestión del Pipeline de Postulaciones" },
          { id: "whatsapp-1clic", title: "Protocolo WhatsApp y Anti-Inasistencia", badge: "Directo" },
          { id: "expedientes-descarga", title: "Descarga segura de expedientes 360" },
        ],
      },
      {
        title: "Soporte & Facturación",
        icon: HelpCircle,
        items: [
          { id: "faq-empresas", title: "Preguntas Frecuentes Patronales" },
          { id: "canal-soporte-b2b", title: "Mesa de Ayuda Regional Sureste" },
        ],
      },
    ],
  },
  candidate: {
    roleName: "Para Candidatos y Talento",
    roleDescription: "Guías de empleo formal, expediente digital y postulación directa",
    sections: [
      {
        title: "Inicio Rápido",
        icon: UserCheck,
        items: [
          { id: "como-funciona", title: "Cómo encontrar trabajo en 3 pasos", badge: "100% Gratis" },
          { id: "garantia-antifraude", title: "Garantía de gratuidad y alerta antifraude" },
        ],
      },
      {
        title: "Expediente Digital 360",
        icon: BookOpen,
        items: [
          { id: "crear-expediente", title: "Armado de perfil digital en 3 minutos", badge: "Esencial" },
          { id: "documentos-requeridos", title: "Subir INE, CURP y comprobante oficial" },
          { id: "insignia-verificado", title: "Insignia de Expediente 100% Verificado", isNew: true },
        ],
      },
      {
        title: "Búsqueda Hiperlocal",
        icon: MapPin,
        items: [
          { id: "filtro-colonia", title: "Encontrar vacantes a < 3 km de tu casa", badge: "Hiperlocal" },
          { id: "ahorro-traslados", title: "Cálculo de tiempos de traslado diario" },
        ],
      },
      {
        title: "Postulación por WhatsApp",
        icon: MessageSquare,
        items: [
          { id: "postular-directo", title: "Contacto en 1-clic con la empresa", badge: "Directo" },
          { id: "confirmar-entrevista", title: "Protocolo de confirmación de entrevista" },
          { id: "que-hacer-sin-respuesta", title: "Qué hacer si una empresa no responde" },
        ],
      },
      {
        title: "Seguridad & Privacidad",
        icon: Lock,
        items: [
          { id: "privacidad-datos", title: "Quién puede ver tu documentación (LFPDPPP)" },
          { id: "faq-candidatos", title: "Preguntas Frecuentes del Candidato" },
        ],
      },
    ],
  },
};

export default function HelpCenterDocsPage() {
  const [activeRole, setActiveRole] = useState<"company" | "candidate">("company");
  const [activeDocId, setActiveDocId] = useState<string>("auditoria-sat");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"yes" | "no" | null>(null);

  // Filtered sections based on search query
  const filteredSections = useMemo(() => {
    const roleData = DOCS_DATA[activeRole];
    if (!searchQuery.trim()) return roleData.sections;

    const query = searchQuery.toLowerCase();
    return roleData.sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.badge?.toLowerCase().includes(query) ||
            section.title.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [activeRole, searchQuery]);

  // Find active doc item metadata
  const currentDocMeta = useMemo(() => {
    const roleData = DOCS_DATA[activeRole];
    for (const section of roleData.sections) {
      const match = section.items.find((item) => item.id === activeDocId);
      if (match) {
        return {
          sectionTitle: section.title,
          item: match,
        };
      }
    }
    // Default fallback
    return {
      sectionTitle: roleData.sections[1].title,
      item: roleData.sections[1].items[0],
    };
  }, [activeRole, activeDocId]);

  const handleSelectDoc = (docId: string) => {
    setActiveDocId(docId);
    setFeedbackGiven(null);
    setIsMobileDrawerOpen(false);
  };

  const handleSwitchRole = (newRole: "company" | "candidate") => {
    setActiveRole(newRole);
    setSearchQuery("");
    setFeedbackGiven(null);
    // Set default item for the selected role
    if (newRole === "company") {
      setActiveDocId("auditoria-sat");
    } else {
      setActiveDocId("como-funciona");
    }
  };

  const handleCopyGuideLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("Enlace de la guía copiado al portapapeles");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleFeedback = (type: "yes" | "no") => {
    setFeedbackGiven(type);
    if (type === "yes") {
      toast.success("¡Gracias por tu retroalimentación!", {
        description: "Nos alegra que esta guía haya resuelto tu duda.",
      });
    } else {
      toast.info("Gracias por avisarnos", {
        description: "Nuestro equipo regional revisará esta guía para hacerla más clara.",
      });
    }
  };

  return (
    <div className="w-full">
      {/* ========================================================= */}
      {/* 1. MOBILE STICKY SUB-HEADER (DRAWER TRIGGER)             */}
      {/* ========================================================= */}
      <div className="sticky top-20 z-30 w-full bg-background/95 backdrop-blur-md border-b border-border/80 lg:hidden px-4 h-14 flex items-center justify-between shadow-2xs">
        <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9 px-3 rounded-xl border-border text-xs font-semibold shadow-2xs"
              />
            }
          >
            <Menu className="size-4 text-primary" />
            <span>Índice de Guías</span>
            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0 h-4">
              {activeRole === "company" ? "Empresas" : "Candidatos"}
            </Badge>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-[85vw] max-w-sm p-0 flex flex-col bg-card border-r border-border"
          >
            <SheetHeader className="p-4 border-b border-border/60 bg-muted/30 text-left">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <BookOpen className="size-4" />
                </div>
                <div>
                  <SheetTitle className="text-sm font-bold">Documentación K&apos;anPro</SheetTitle>
                  <SheetDescription className="text-xs">
                    Navega por temas y requerimientos
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Role Switcher inside Drawer */}
            <div className="p-3 border-b border-border/60 bg-muted/10 space-y-2">
              <RoleSwitcher
                activeRole={activeRole}
                onRoleChange={handleSwitchRole}
              />

              {/* Drawer Search */}
              <div className="relative mt-2.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Filtrar temas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 text-xs rounded-lg bg-background border-border"
                />
              </div>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {filteredSections.map((section, idx) => {
                const IconComponent = section.icon;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 px-2 text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                      <IconComponent className="size-3.5 text-primary" />
                      <span>{section.title}</span>
                    </div>
                    <ul className="space-y-0.5">
                      {section.items.map((item) => {
                        const isActive = item.id === activeDocId;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectDoc(item.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                isActive
                                  ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                              }`}
                            >
                              <span className="line-clamp-1">{item.title}</span>
                              {item.badge && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1 py-0 h-3.5 shrink-0 ml-1 font-mono"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Drawer Bottom Support Link */}
            <div className="p-3 border-t border-border/60 bg-muted/20">
              <Link
                href="https://wa.me/529990000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
              >
                <MessageSquare className="size-3.5" />
                <span>Soporte WhatsApp Mérida</span>
              </Link>
            </div>
          </SheetContent>
        </Sheet>

        {/* Current Guide Quick Indicator on Mobile */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground max-w-[200px] sm:max-w-xs truncate">
          <span className="truncate font-medium text-foreground">{currentDocMeta.item.title}</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN 3-COLUMN CONTINUOUS DOCS WRAPPER                  */}
      {/* ========================================================= */}
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex w-full gap-8 items-start">
          
          {/* ======================================================= */}
          {/* COLUMN 1: DESKTOP STICKY LEFT SIDEBAR                   */}
          {/* ======================================================= */}
          <aside
            aria-label="Índice de documentación"
            className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto border-r border-border py-6 pr-6 gap-6 [scrollbar-gutter:stable] self-start"
          >
            {/* Header: Role Switcher Dropdown (Estilo VersionSwitcher / DropdownMenu) */}
            <RoleSwitcher
              activeRole={activeRole}
              onRoleChange={handleSwitchRole}
            />

            {/* Interactive Search Trigger / Filter Bar */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Buscar guías (ej. 32-D, WhatsApp)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-14 text-xs rounded-xl bg-card border-border shadow-2xs focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                <Kbd className="text-[10px] font-mono font-semibold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded">
                  ⌘K
                </Kbd>
              </div>
            </div>

            {/* Navigation Tree */}
            <nav className="flex-1 flex flex-col gap-6">
              {filteredSections.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl border border-dashed border-border">
                  No se encontraron guías que coincidan con &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredSections.map((section, idx) => {
                  const SectionIcon = section.icon;
                  return (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 px-2 text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                        <SectionIcon className="size-3.5 text-primary" />
                        <span>{section.title}</span>
                      </div>
                      <ul className="flex flex-col gap-0.5">
                        {section.items.map((item) => {
                          const isActive = item.id === activeDocId;
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectDoc(item.id)}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer group ${
                                  isActive
                                    ? "bg-primary/10 text-primary font-semibold shadow-2xs border-l-2 border-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                }`}
                              >
                                <span className="line-clamp-1">{item.title}</span>
                                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                  {item.isNew && (
                                    <Badge
                                      variant="default"
                                      className="text-[9px] px-1.5 py-0 h-4 bg-primary text-primary-foreground font-mono"
                                    >
                                      Nuevo
                                    </Badge>
                                  )}
                                  {item.badge && !item.isNew && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0 h-4 font-mono text-muted-foreground border-border"
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                  <ChevronRight
                                    className={`size-3 transition-transform ${
                                      isActive
                                        ? "text-primary opacity-100 translate-x-0.5"
                                        : "opacity-0 group-hover:opacity-60"
                                    }`}
                                  />
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })
              )}
            </nav>

            {/* Sidebar Bottom Regional Badge */}
            <div className="pt-4 border-t border-border/60">
              <div className="rounded-xl border border-border/70 bg-card p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-foreground">Soporte Operativo Sureste</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  ¿Dudas con tu Opinión 32-D o vacante? Conecta con nuestro equipo local.
                </p>
                <Link
                  href="https://wa.me/529990000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  <span>Abrir chat de WhatsApp</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>
          </aside>

          {/* ======================================================= */}
          {/* COLUMN 2: CENTRAL READING CANVAS (LAYOUT SKELETON)       */}
          {/* ======================================================= */}
          <div className="flex-1 min-w-0 py-6 max-w-4xl">
            <article className="space-y-8 sm:space-y-10">

              {/* 2.1 Breadcrumb Bar & Quick Utilities */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink render={<Link href="/" />}>Inicio</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink render={<Link href="/help" />}>Centro de Ayuda</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <span className="text-muted-foreground capitalize">
                        {activeRole === "company" ? "Empresas" : "Candidatos"}
                      </span>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-semibold text-foreground line-clamp-1">
                        {currentDocMeta.item.title}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>

                {/* Quick Share / Copy Utility */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyGuideLink}
                    className="h-8 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copiar enlace</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 2.2 Document Header (Title, Badges, Meta) */}
              <header className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono font-bold text-primary border-primary/30 bg-primary/5">
                    {currentDocMeta.sectionTitle.toUpperCase()}
                  </Badge>
                  {currentDocMeta.item.badge && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      {currentDocMeta.item.badge}
                    </Badge>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <Clock className="size-3.5" />
                    <span>Lectura: 3 min</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground font-sans leading-tight">
                  {currentDocMeta.item.title}
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground font-normal leading-relaxed text-balance">
                  {activeRole === "company"
                    ? "Protocolo operativo estandarizado para la verificación patronal, publicación de ofertas sin comisiones y conexión laboral en la península de Yucatán."
                    : "Guía paso a paso para postularte a vacantes formales verificadas, contactar al reclutador por WhatsApp y proteger la privacidad de tus documentos."}
                </p>

                {/* Metadata Pill Banner */}
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground border-y border-border/50 py-3">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    <span>Actualizado: <strong>Septiembre 2026</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    <span>Región: <strong>Mérida, Cancún y Riviera Maya</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-muted-foreground" />
                    <span>Cumplimiento: <strong>Normativa SAT / LFT</strong></span>
                  </div>
                </div>
              </header>

              {/* 2.3 Layout Callout Box (Estilo Supabase / Stripe Note) */}
              <section className="rounded-2xl border-l-4 border-l-primary border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-primary uppercase">
                  <Info className="size-4" />
                  <span>RESUMEN OPERATIVO DE ESTA GUÍA</span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {activeRole === "company"
                    ? "Esta sección detalla los requerimientos técnicos y fiscales que garantizan que tu empresa obtenga el Sello de Confiabilidad ante los candidatos locales sin intermediarios ni tarifas ocultas."
                    : "Esta sección te muestra cómo estructurar tu perfil digital gratuito para recibir invitaciones de entrevista directas sin intermediarios y con total seguridad de tus datos personales."}
                </p>
              </section>

              {/* 2.4 Wireframe Content Structure: Step-by-Step Flow */}
              <section className="space-y-8">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground font-sans tracking-tight">
                    Flujo de Implementación Paso a Paso
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Sigue esta secuencia operativa para completar el proceso en menos de 5 minutos.
                  </p>
                </div>

                {/* Paso 1 Card Wireframe */}
                <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="size-7 rounded-lg bg-primary text-primary-foreground font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      01
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {activeRole === "company"
                        ? "Paso 1: Validación de Requisitos Fiscales Previos"
                        : "Paso 1: Creación del Perfil y Datos Básicos"}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-10">
                    {activeRole === "company"
                      ? "Verifica que cuentas con tu RFC de persona física o moral y tu opinión de cumplimiento 32-D emitida por el SAT con fecha no mayor a 30 días."
                      : "Ingresa tu número telefónico para vincular tu WhatsApp directo. No solicitamos datos bancarios ni cobramos cuotas de acceso."}
                  </p>

                  {/* Wireframe Mockup Frame Placeholder */}
                  <div className="ml-10 rounded-xl border border-dashed border-border bg-muted/30 p-4 sm:p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                      <Layers className="size-5" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground font-semibold">
                      [ Contenedor de Captura / Mockup Visual del Formulario ]
                    </span>
                    <span className="text-[11px] text-muted-foreground/70 max-w-sm">
                      Espacio reservado para ilustraciones interactivas, capturas del portal o diagramas de flujo.
                    </span>
                  </div>
                </div>

                {/* Paso 2 Card Wireframe */}
                <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="size-7 rounded-lg bg-primary text-primary-foreground font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      02
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {activeRole === "company"
                        ? "Paso 2: Carga de Documentación en la Plataforma"
                        : "Paso 2: Validación de INE y Comprobante de Domicilio"}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-10">
                    {activeRole === "company"
                      ? "Arrastra el archivo PDF oficial emitido por el SAT. El motor de K'anPro cotejará el código QR y folio fiscal en tiempo real sin almacenamiento innecesario de claves privadas."
                      : "Sube una fotografía nítida de tu identificación oficial. Nuestro sistema encripta los datos para garantizar el cumplimiento con la ley LFPDPPP."}
                  </p>

                  {/* Interactive Checklist Wireframe */}
                  <div className="ml-10 space-y-2 p-3 sm:p-4 rounded-xl bg-muted/20 border border-border">
                    <div className="text-xs font-mono font-bold text-foreground uppercase">
                      Checklist de Verificación Rápida:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <label className="flex items-center gap-2 p-1.5 rounded-lg bg-card border border-border/50 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-primary accent-primary" />
                        <span>Formato oficial PDF o Imagen legible</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 rounded-lg bg-card border border-border/50 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-primary accent-primary" />
                        <span>Código QR o Folio visible sin tachaduras</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 rounded-lg bg-card border border-border/50 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-primary accent-primary" />
                        <span>Vigencia menor a 30 días</span>
                      </label>
                      <label className="flex items-center gap-2 p-1.5 rounded-lg bg-card border border-border/50 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-primary accent-primary" />
                        <span>Domicilio en Yucatán o Quintana Roo</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Paso 3 Card Wireframe */}
                <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="size-7 rounded-lg bg-primary text-primary-foreground font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      03
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {activeRole === "company"
                        ? "Paso 3: Activación Inmediata del Sello de Empresa Confiable"
                        : "Paso 3: Postulación en 1-Clic por WhatsApp"}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-10">
                    {activeRole === "company"
                      ? "Una vez validado el documento, tu perfil patronal muestra la insignia verificada y tus vacantes adquieren prioridad de visualización en el mapa hiperlocal."
                      : "Al encontrar una vacante compatible a menos de 3 km de tu casa, presiona el botón de WhatsApp para enviar tu ficha laboral directamente al reclutador."}
                  </p>
                </div>
              </section>

              {/* 2.5 Alert Warning / Pro-Tip Callout Box */}
              <section className="rounded-2xl border-l-4 border-l-amber-500 border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                  <AlertTriangle className="size-4" />
                  <span>CONSIDERACIÓN IMPORTANTE DE CUMPLIMIENTO</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {activeRole === "company"
                    ? "K'anPro nunca solicita contraseñas CIEC o llaves privadas e.firma. Solo se valida el documento público 32-D para proteger la integridad fiscal de tu negocio."
                    : "K'anPro es 100% gratuito para el trabajador. Si alguien te pide depósitos por adelantado o exámenes médicos de costo, repórtalo de inmediato a nuestra línea de soporte."}
                </p>
              </section>

              {/* 2.6 Interactive Guide Feedback Widget */}
              <section className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-foreground">
                    ¿Te fue útil esta guía de ayuda?
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Tus comentarios ayudan a mejorar la documentación para toda la comunidad del Sureste.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={feedbackGiven === "yes" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFeedback("yes")}
                    className="h-9 px-3.5 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <ThumbsUp className="size-3.5" />
                    <span>Sí, me sirvió</span>
                  </Button>
                  <Button
                    variant={feedbackGiven === "no" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleFeedback("no")}
                    className="h-9 px-3.5 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <ThumbsDown className="size-3.5" />
                    <span>No resolvió mi duda</span>
                  </Button>
                </div>
              </section>

              {/* 2.7 Next / Previous Article Pagination Cards */}
              <nav aria-label="Navegación entre guías" className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => toast.info("Navegando a la guía previa en el índice")}
                  className="rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                    <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" />
                    <span>GUÍA ANTERIOR</span>
                  </span>
                  <p className="text-sm font-bold text-foreground mt-1 group-hover:text-primary transition-colors line-clamp-1">
                    {activeRole === "company"
                      ? "Registro y alta fiscal de empresa"
                      : "Garantía de gratuidad y alerta antifraude"}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => toast.info("Navegando a la siguiente guía en el índice")}
                  className="rounded-2xl border border-border bg-card p-4 text-right hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <span className="text-[11px] font-mono text-muted-foreground flex items-center justify-end gap-1">
                    <span>SIGUIENTE GUÍA</span>
                    <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                  <p className="text-sm font-bold text-foreground mt-1 group-hover:text-primary transition-colors line-clamp-1">
                    {activeRole === "company"
                      ? "Obtención del Sello de Empresa Confiable"
                      : "Armado de perfil digital en 3 minutos"}
                  </p>
                </button>
              </nav>

            </article>
          </div>

          {/* ======================================================= */}
          {/* COLUMN 3: DESKTOP RIGHT SIDEBAR (TOC & SUPPORT)        */}
          {/* ======================================================= */}
          <aside
            aria-label="Contenido de esta página"
            className="hidden xl:flex flex-col w-64 shrink-0 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto py-6 pl-6 border-l border-border/50 text-xs gap-6 self-start [scrollbar-gutter:stable]"
          >
            {/* Table of Contents */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                EN ESTA GUÍA
              </div>
              <ul className="space-y-2 border-l border-border pl-3 text-muted-foreground">
                <li>
                  <a
                    href="#resumen"
                    className="block hover:text-primary transition-colors text-foreground font-medium"
                  >
                    Resumen operativo
                  </a>
                </li>
                <li>
                  <a href="#paso-1" className="block hover:text-primary transition-colors">
                    01. Requisitos previos
                  </a>
                </li>
                <li>
                  <a href="#paso-2" className="block hover:text-primary transition-colors">
                    02. Carga y verificación
                  </a>
                </li>
                <li>
                  <a href="#paso-3" className="block hover:text-primary transition-colors">
                    03. Activación y sello
                  </a>
                </li>
                <li>
                  <a href="#cumplimiento" className="block hover:text-primary transition-colors">
                    Consideraciones legales
                  </a>
                </li>
                <li>
                  <a href="#retroalimentacion" className="block hover:text-primary transition-colors">
                    Retroalimentación
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Widget Card */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-foreground text-xs">Mesa de Ayuda WhatsApp</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Atención personalizada con asesores de vinculación laboral en Mérida y Riviera Maya.
              </p>
              <div className="space-y-1.5 pt-1">
                <Button
                  render={<Link href="https://wa.me/529990000000" target="_blank" rel="noopener noreferrer" />}
                  size="sm"
                  className="w-full h-8 rounded-lg text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                >
                  <MessageSquare className="size-3.5" />
                  <span>Escribir al Asesor</span>
                </Button>
                <div className="text-[10px] text-muted-foreground text-center">
                  Tiempo estimado: <strong>&lt; 15 minutos</strong>
                </div>
              </div>
            </div>

            {/* Documentation Version Tag */}
            <div className="text-[10px] font-mono text-muted-foreground/80 space-y-1">
              <div>K&apos;anPro Docs v2.4 (2026)</div>
              <div>Ambiente Seguro TLS 1.3</div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
