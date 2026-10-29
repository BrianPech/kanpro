"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  Lock,
  FileText,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Send,
  Menu,
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
} from "@/components/ui/icons";
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
import type { DocSection, DocMetadata } from "@/lib/help/docs-server";

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "primeros pasos": Building2,
  "cumplimiento y sat": ShieldCheck,
  "vacantes y proximidad": FileText,
  "vinculacion y candidatos": MessageSquare,
  "postulaciones": Send,
  "seguridad y derechos": Lock,
  "inicio rapido": UserCheck,
};

function getSectionIcon(title: string): React.ComponentType<{ className?: string }> {
  const normalized = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return SECTION_ICONS[normalized] || BookOpen;
}

interface HelpCenterClientProps {
  navigation: {
    empresas: DocSection[];
    candidatos: DocSection[];
  };
}

export function HelpCenterClient({ navigation }: HelpCenterClientProps) {
  const [activeRole, setActiveRole] = useState<"company" | "candidate">("company");
  const roleKey = activeRole === "company" ? "empresas" : "candidatos";

  const sectionsForRole = navigation[roleKey] || [];
  const defaultFirstDocId =
    sectionsForRole[0]?.items[0]?.id || (activeRole === "company" ? "auditoria-sat" : "registro-candidato");

  const [activeDocId, setActiveDocId] = useState<string>(defaultFirstDocId);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"yes" | "no" | null>(null);

  // Filtrado de secciones según la búsqueda en tiempo real
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sectionsForRole;

    const query = searchQuery.toLowerCase();
    return sectionsForRole
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query) ||
            item.badge?.toLowerCase().includes(query) ||
            section.title.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [sectionsForRole, searchQuery]);

  // Metadatos del documento activo
  const currentDocMeta = useMemo(() => {
    for (const section of sectionsForRole) {
      const match = section.items.find((item) => item.id === activeDocId);
      if (match) {
        return {
          sectionTitle: section.title,
          item: match,
        };
      }
    }
    const fallbackItem: DocMetadata = sectionsForRole[0]?.items[0] || {
      id: "inicio",
      slug: "inicio",
      role: roleKey,
      title: "Centro de Ayuda",
      description: "Guía de bienvenida",
      section: "General",
      relativeImportPath: "",
      readTime: "3 min",
    };
    return {
      sectionTitle: fallbackItem.section,
      item: fallbackItem,
    };
  }, [sectionsForRole, activeDocId, roleKey]);

  const handleSelectDoc = (docId: string) => {
    setActiveDocId(docId);
    setFeedbackGiven(null);
    setIsMobileDrawerOpen(false);
  };

  const handleSwitchRole = (newRole: "company" | "candidate") => {
    setActiveRole(newRole);
    setSearchQuery("");
    setFeedbackGiven(null);
    const targetKey = newRole === "company" ? "empresas" : "candidatos";
    const targetSections = navigation[targetKey] || [];
    const firstItem = targetSections[0]?.items[0]?.id;
    if (firstItem) {
      setActiveDocId(firstItem);
    }
  };

  const handleCopyGuideLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/help/${roleKey}/${activeDocId}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("Enlace a la guía copiado al portapapeles");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleFeedback = (type: "yes" | "no") => {
    setFeedbackGiven(type);
    if (type === "yes") {
      toast.success("¡Gracias! Tu opinión nos ayuda a perfeccionar la documentación.");
    } else {
      toast.info("Agradecemos tu reporte. Nuestro equipo técnico revisará esta guía.");
    }
  };

  return (
    <div className="w-full pb-20 sm:pb-28">
      {/* ========================================================= */}
      {/* 1. MOBILE DRAWER TRIGGER BAR                              */}
      {/* ========================================================= */}
      <div className="lg:hidden sticky top-14 z-30 flex items-center justify-between border-b border-border/60 bg-background/95 backdrop-blur-md px-4 py-2.5 shadow-2xs">
        <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs font-semibold rounded-xl border-border bg-card shadow-2xs"
              >
                <Menu className="size-4 text-primary" />
                <span>Explorar Índice ({filteredSections.reduce((acc, s) => acc + s.items.length, 0)})</span>
              </Button>
            }
          />
          <SheetContent
            side="left"
            className="w-[85vw] max-w-sm p-0 flex flex-col z-50 bg-background border-r border-border"
          >
            <SheetHeader className="p-4 border-b border-border/60 text-left">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
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
              <RoleSwitcher activeRole={activeRole} onRoleChange={handleSwitchRole} />

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
                const IconComponent = getSectionIcon(section.title);
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
            {/* Header: Role Switcher Dropdown */}
            <RoleSwitcher activeRole={activeRole} onRoleChange={handleSwitchRole} />

            {/* Interactive Search Trigger / Filter Bar */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Buscar guías en tiempo real..."
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

            {/* Navigation Tree (Auto-Generated from MDX Folders) */}
            <nav className="flex-1 flex flex-col gap-6">
              {filteredSections.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl border border-dashed border-border">
                  No se encontraron guías que coincidan con &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredSections.map((section, idx) => {
                  const SectionIcon = getSectionIcon(section.title);
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
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all group ${
                                  isActive
                                    ? "bg-primary/10 text-primary font-bold border-l-2 border-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                              >
                                <span className="line-clamp-1">{item.title}</span>
                                <div className="flex items-center gap-1 shrink-0 ml-1.5">
                                  {item.badge && (
                                    <Badge
                                      variant={isActive ? "default" : "secondary"}
                                      className="text-[9px] px-1 py-0 h-4 font-mono font-normal"
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
          {/* COLUMN 2: CENTRAL READING CANVAS (MDX CONTENT PREVIEW)   */}
          {/* ======================================================= */}
          <div className="flex-1 min-w-0 py-6 max-w-4xl">
            <article className="space-y-8 sm:space-y-10">
              {/* Breadcrumb Bar & Quick Utilities */}
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

                {/* Quick Share / Open Page Utility */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/help/${roleKey}/${currentDocMeta.item.id}`} />}
                    className="h-8 px-2.5 rounded-lg text-xs gap-1.5"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>Ver página completa</span>
                  </Button>
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

              {/* Document Header */}
              <header className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-mono font-bold text-primary border-primary/30 bg-primary/5"
                  >
                    {currentDocMeta.sectionTitle.toUpperCase()}
                  </Badge>
                  {currentDocMeta.item.badge && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      {currentDocMeta.item.badge}
                    </Badge>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <Clock className="size-3.5" />
                    <span>{currentDocMeta.item.readTime || "3 min de lectura"}</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground font-sans leading-tight">
                  {currentDocMeta.item.title}
                </h1>

                {currentDocMeta.item.description && (
                  <p className="text-sm sm:text-base text-muted-foreground font-normal leading-relaxed text-balance">
                    {currentDocMeta.item.description}
                  </p>
                )}

                {/* Metadata Pill Banner */}
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground border-y border-border/50 py-3">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    <span>
                      Actualizado: <strong>{currentDocMeta.item.updatedAt || "Septiembre 2026"}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    <span>
                      Región: <strong>Mérida, Cancún y Riviera Maya</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-muted-foreground" />
                    <span>
                      Cumplimiento: <strong>Normativa SAT / LFT</strong>
                    </span>
                  </div>
                </div>
              </header>

              {/* Quick Jump Callout */}
              <section className="rounded-2xl border-l-4 border-l-primary border border-border bg-card p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-primary uppercase">
                    <Info className="size-4" />
                    <span>Artículo Oficial MDX</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Esta guía cuenta con versión completa con tablas interactivas, pasos validados y soporte por WhatsApp.
                  </p>
                </div>
                <Button
                  render={<Link href={`/help/${roleKey}/${currentDocMeta.item.id}`} />}
                  size="sm"
                  className="rounded-xl text-xs gap-1.5 shrink-0"
                >
                  <span>Abrir artículo completo</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </section>

              {/* Interactive Feedback Widget */}
              <section className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-foreground">¿Te fue útil esta guía de ayuda?</h4>
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
            </article>
          </div>

          {/* ======================================================= */}
          {/* COLUMN 3: RIGHT STICKY SIDEBAR (TOC & SUPPORT)          */}
          {/* ======================================================= */}
          <aside className="hidden xl:flex flex-col w-64 shrink-0 sticky top-20 h-[calc(100vh-5rem)] py-6 space-y-6 self-start">
            {/* Quick Actions Card */}
            <Card className="rounded-2xl border-border bg-card shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-mono uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                  <BookOpen className="size-3.5 text-primary" />
                  <span>En esta categoría</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sectionsForRole.flatMap((s) => s.items).slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectDoc(item.id)}
                    className={`w-full text-left text-xs p-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      item.id === activeDocId
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span className="line-clamp-1">{item.title}</span>
                    <ChevronRight className="size-3 shrink-0 ml-1.5 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Direct Support Card */}
            <div className="p-5 rounded-2xl bg-muted/40 border border-border space-y-3 text-left">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-primary">
                <MessageSquare className="size-3.5" />
                <span>¿DUDAS CON ESTE PASO?</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Escríbenos directamente por WhatsApp para asistencia personalizada en Mérida y Cancún.
              </p>
              <Button
                render={<Link href="https://wa.me/529990000000" target="_blank" rel="noopener noreferrer" />}
                size="sm"
                className="w-full h-9 rounded-xl text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
              >
                <MessageSquare className="size-3.5" />
                <span>Chatear con Soporte</span>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
