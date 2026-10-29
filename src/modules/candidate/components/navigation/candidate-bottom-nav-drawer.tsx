"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  FileText,
  Bookmark,
  ShieldCheck,
  FileCheck2,
  Plane,
  Settings,
  HelpCircle,
  ChevronRight,
  X,
  Sparkles,
  Clock,
  User,
  Briefcase,
} from "@/components/ui/icons";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CandidateBottomNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEmployee?: boolean;
}

interface NavItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

export function CandidateBottomNavDrawer({
  open,
  onOpenChange,
  isEmployee = false,
}: CandidateBottomNavDrawerProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "#") return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Categorías para Colaboradores con empleo activo
  const employeeCategories: NavCategory[] = [
    {
      title: "Bolsa de Trabajo & Movilidad",
      items: [
        {
          title: "Explorar Vacantes",
          description: "Nuevas ofertas laborales verificadas con prestaciones de ley",
          href: "/dashboard/candidate/discovery",
          icon: Compass,
          badge: "Bolsa de Empleo",
        },
        {
          title: "Mis Postulaciones",
          description: "Seguimiento de procesos de selección y postulaciones",
          href: "/dashboard/candidate/applications",
          icon: FileText,
        },
        {
          title: "Vacantes Guardadas",
          description: "Ofertas que marcaste como favoritas para revisar luego",
          href: "/dashboard/candidate/saved",
          icon: Bookmark,
        },
      ],
    },
    {
      title: "Expediente & Documentos Laborales",
      items: [
        {
          title: "Mis Documentos",
          description: "Expediente digital, RFC, CURP, NSS y constancias",
          href: "/dashboard/candidate/documents",
          icon: ShieldCheck,
        },
        {
          title: "Mis Contratos",
          description: "Contratos de trabajo, vigencias y acuerdos oficiales",
          href: "/dashboard/candidate/contracts",
          icon: FileCheck2,
        },
        {
          title: "Vacaciones & Permisos",
          description: "Solicitudes de días de descanso LFT y permisos",
          href: "/dashboard/candidate/leaves",
          icon: Plane,
        },
      ],
    },
    {
      title: "Cuenta & Soporte",
      items: [
        {
          title: "Mi Perfil Profesional",
          description: "CV digital, experiencia laboral y habilidades",
          href: "/dashboard/candidate/profile",
          icon: User,
        },
        {
          title: "Ajustes de Cuenta",
          description: "Seguridad, cambio de contraseña y notificaciones",
          href: "/dashboard/candidate/settings",
          icon: Settings,
        },
        {
          title: "Centro de Ayuda",
          description: "Preguntas frecuentes, guías y asistencia técnica",
          href: "/help",
          icon: HelpCircle,
        },
      ],
    },
  ];

  // Categorías para Candidatos buscando empleo
  const candidateCategories: NavCategory[] = [
    {
      title: "Búsqueda & Oportunidades",
      items: [
        {
          title: "Vacantes Guardadas",
          description: "Empleos guardados para revisar y postularte luego",
          href: "/dashboard/candidate/saved",
          icon: Bookmark,
        },
        {
          title: "Explorar Empleos",
          description: "Radar de vacantes verificadas en la región",
          href: "/dashboard/candidate/discovery",
          icon: Compass,
        },
        {
          title: "Mis Postulaciones",
          description: "Estatus de tus aplicaciones y entrevistas",
          href: "/dashboard/candidate/applications",
          icon: FileText,
        },
      ],
    },
    {
      title: "Expediente & Documentación",
      items: [
        {
          title: "Mis Documentos & CV",
          description: "Sube tu identificación, comprobantes y currículum",
          href: "/dashboard/candidate/documents",
          icon: ShieldCheck,
        },
        {
          title: "Mi Perfil Profesional",
          description: "Edita tu información pública y preferencias laborales",
          href: "/dashboard/candidate/profile",
          icon: User,
        },
      ],
    },
    {
      title: "Configuración & Ayuda",
      items: [
        {
          title: "Ajustes de Cuenta",
          description: "Seguridad y notificaciones de vacantes",
          href: "/dashboard/candidate/settings",
          icon: Settings,
        },
        {
          title: "Centro de Ayuda",
          description: "Guías para candidatos y soporte técnico",
          href: "/help",
          icon: HelpCircle,
        },
      ],
    },
  ];

  const categories = isEmployee ? employeeCategories : candidateCategories;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle swipeDirection="down">
      <DrawerContent className="[--drawer-inset:0px] max-h-[88vh] rounded-t-[28px] rounded-b-none border-x-0 border-b-0 border-t border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera del Drawer */}
        <DrawerHeader className="px-5 pt-3 pb-3 border-b border-border/60 flex flex-row items-center justify-between shrink-0">
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <DrawerTitle className="text-base font-extrabold tracking-tight text-foreground">
                {isEmployee ? "Más Opciones & Bolsa de Empleo" : "Más Opciones de Candidato"}
              </DrawerTitle>
              <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="size-2.5 mr-1" />
                {isEmployee ? "Colaborador" : "Candidato"}
              </Badge>
            </div>
            <DrawerDescription className="text-xs text-muted-foreground mt-0.5 truncate">
              {isEmployee
                ? "Explora nuevas vacantes, expediente digital y configuración"
                : "Herramientas adicionales para la búsqueda de empleo y perfil"}
            </DrawerDescription>
          </div>

          <DrawerClose
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 ml-2 cursor-pointer"
                aria-label="Cerrar menú de opciones"
              />
            }
          >
            <X className="size-4" />
          </DrawerClose>
        </DrawerHeader>

        {/* Contenido deslizable con categorías */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-4 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
          {/* Tarjeta de Acción Rápida para Colaborador: Explorar Bolsa de Empleo */}
          {isEmployee && (
            <Link
              href="/dashboard/candidate/discovery"
              onClick={() => onOpenChange(false)}
              className="group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-primary via-primary/95 to-primary/85 text-primary-foreground shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-primary-foreground shadow-2xs">
                  <Compass className="size-5" />
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black tracking-tight block truncate">
                      Bolsa de Empleo Regional
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-white/25 text-white">
                      Explorar
                    </span>
                  </div>
                  <span className="text-[11px] text-primary-foreground/85 font-medium block truncate">
                    Descubre vacantes verificadas y crecimiento profesional
                  </span>
                </div>
              </div>
              <ChevronRight className="size-5 text-primary-foreground/70 group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>
          )}

          {/* Bloques de Categorías */}
          {categories.map((category) => (
            <div key={category.title} className="space-y-1.5">
              <h4 className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {category.title}
              </h4>

              <div className="space-y-1">
                {category.items.map((item) => {
                  const active = isItemActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-2xl transition-all duration-150 active:scale-[0.99] cursor-pointer",
                        active
                          ? "bg-primary/10 border border-primary/25 text-primary font-bold shadow-2xs"
                          : "bg-muted/40 hover:bg-muted text-foreground border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground group-hover:text-foreground border border-border/60"
                          )}
                        >
                          <Icon className="size-4.5" />
                        </div>

                        <div className="text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold block truncate">
                              {item.title}
                            </span>
                            {item.badge && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 font-bold bg-primary/10 text-primary border-primary/20"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {item.description}
                          </span>
                        </div>
                      </div>

                      <ChevronRight
                        className={cn(
                          "size-4 shrink-0 transition-transform group-hover:translate-x-0.5 ml-2",
                          active ? "text-primary" : "text-muted-foreground/60"
                        )}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
