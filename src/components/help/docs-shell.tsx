"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Building2,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  Lock,
  FileText,
  BookOpen,
  ChevronRight,
  Send,
  Menu,
  ExternalLink,
} from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { RoleSwitcher, type HelpRole } from "@/components/help/role-switcher";
import type { DocSection } from "@/lib/help/docs-server";

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

interface DocsShellProps {
  navigation: {
    empresas: DocSection[];
    candidatos: DocSection[];
  };
  children: React.ReactNode;
}

export function DocsShell({ navigation, children }: DocsShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isCandidate = pathname.includes("/candidatos");
  const activeRole: HelpRole = isCandidate ? "candidate" : "company";
  const catalogKey = isCandidate ? "candidatos" : "empresas";

  const sectionsForRole = navigation[catalogKey] || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Filtrado de temas en tiempo real
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

  const handleRoleChange = (newRole: HelpRole) => {
    setSearchQuery("");
    setIsMobileDrawerOpen(false);
    if (newRole === "company") {
      router.push("/help/empresas/alta-empresa");
    } else {
      router.push("/help/candidatos/registro-candidato");
    }
  };

  const totalTopicsCount = filteredSections.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <div className="w-full">
      {/* ========================================================= */}
      {/* 1. BARRA SUPERIOR PARA MÓVILES (STICKY)                  */}
      {/* ========================================================= */}
      <div className="lg:hidden sticky top-14 z-30 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-4 py-2.5 shadow-2xs">
        <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs font-semibold rounded-lg border-border bg-card shadow-2xs cursor-pointer"
              >
                <Menu className="size-4 text-primary" />
                <span>Explorar Índice ({totalTopicsCount})</span>
              </Button>
            }
          />
          <SheetContent
            side="left"
            className="w-[85vw] max-w-sm p-0 flex flex-col z-50 bg-background border-r border-border"
          >
            <SheetHeader className="p-4 border-b border-border text-left">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen className="size-4" />
                </div>
                <div>
                  <SheetTitle className="text-sm font-semibold">Documentación K&apos;anPro</SheetTitle>
                  <SheetDescription className="text-xs">
                    Navega por temas y requerimientos
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Selector de rol y buscador dentro del drawer */}
            <div className="p-3 border-b border-border bg-muted/20 space-y-2">
              <RoleSwitcher activeRole={activeRole} onRoleChange={handleRoleChange} />

              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Filtrar temas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 text-xs rounded-lg bg-background border-border"
                />
              </div>
            </div>

            {/* Enlaces de navegación del drawer */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {filteredSections.map((section, idx) => {
                const IconComponent = getSectionIcon(section.title);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-1.5 px-2 text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                      <IconComponent className="size-3.5 text-primary" />
                      <span>{section.title}</span>
                    </div>
                    <ul className="space-y-0.5">
                      {section.items.map((item) => {
                        const itemHref = `/help/${catalogKey}/${item.id}`;
                        const isActive = pathname === itemHref;
                        return (
                          <li key={item.id}>
                            <Link
                              href={itemHref}
                              onClick={() => setIsMobileDrawerOpen(false)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                isActive
                                  ? "bg-accent text-accent-foreground font-semibold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                              }`}
                            >
                              <span className="line-clamp-1">{item.title}</span>
                              {item.badge && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1 py-0 h-3.5 shrink-0 ml-1 font-mono font-normal"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Enlace de soporte WhatsApp en footer de drawer */}
            <div className="p-3 border-t border-border bg-muted/20">
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

        <span className="text-xs font-medium text-muted-foreground capitalize">
          {activeRole === "company" ? "Para Empresas" : "Para Candidatos"}
        </span>
      </div>

      {/* ========================================================= */}
      {/* 2. CONTENEDOR PRINCIPAL: SIDEBAR + CANVAS DE LECTURA      */}
      {/* ========================================================= */}
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex w-full gap-8 lg:gap-10 items-start">
          {/* ======================================================= */}
          {/* BARRA LATERAL IZQUIERDA (DESKTOP STICKY)                 */}
          {/* ======================================================= */}
          <aside
            aria-label="Índice de documentación"
            className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 sticky top-16 h-[calc(100vh-4.5rem)] overflow-y-auto border-r border-border py-6 pr-6 gap-6 self-start [scrollbar-gutter:stable]"
          >
            {/* Selector de Rol (Segmented Tabs) */}
            <RoleSwitcher activeRole={activeRole} onRoleChange={handleRoleChange} />

            {/* Buscador de temas en tiempo real */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Buscar guías en tiempo real..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-14 text-xs rounded-lg bg-muted/40 border-border focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <Kbd className="text-[10px] font-mono font-medium text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded">
                  ⌘K
                </Kbd>
              </div>
            </div>

            {/* Árbol de navegación por categorías */}
            <nav className="flex-1 flex flex-col gap-6">
              {filteredSections.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl border border-dashed border-border">
                  No se encontraron guías que coincidan con &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                filteredSections.map((section, idx) => {
                  const SectionIcon = getSectionIcon(section.title);
                  return (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 px-2 text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
                        <SectionIcon className="size-3.5 text-primary" />
                        <span>{section.title}</span>
                      </div>
                      <ul className="flex flex-col gap-0.5">
                        {section.items.map((item) => {
                          const itemHref = `/help/${catalogKey}/${item.id}`;
                          const isActive = pathname === itemHref;
                          return (
                            <li key={item.id}>
                              <Link
                                href={itemHref}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all group ${
                                  isActive
                                    ? "bg-accent text-accent-foreground font-semibold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
                                        ? "text-foreground opacity-100 translate-x-0.5"
                                        : "opacity-0 group-hover:opacity-60"
                                    }`}
                                  />
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })
              )}
            </nav>

            {/* Tarjeta de soporte regional en el pie del sidebar */}
            <div className="pt-4 border-t border-border">
              <Card className="rounded-xl border-border bg-card p-3 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-foreground">Soporte Operativo Sureste</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ¿Dudas con tu Opinión 32-D o vacante? Conecta con nuestro equipo local.
                </p>
                <Link
                  href="https://wa.me/529990000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <span>Abrir chat de WhatsApp</span>
                  <ExternalLink className="size-3" />
                </Link>
              </Card>
            </div>
          </aside>

          {/* ======================================================= */}
          {/* LIENZO CENTRAL DE LECTURA (CONTENIDO DEL ARTÍCULO)       */}
          {/* ======================================================= */}
          <main className="flex-1 min-w-0 py-6 max-w-5xl">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
