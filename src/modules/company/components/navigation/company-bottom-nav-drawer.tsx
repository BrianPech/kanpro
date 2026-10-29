"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserPlus,
  UserCheck,
  Clock,
  FileCheck2,
  Star,
  Plane,
  ShieldAlert,
  CreditCard,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  Settings,
  HelpCircle,
  ChevronRight,
  X,
  Sparkles,
  Briefcase,
  Users,
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
import { cn } from "@/lib/utils";

export interface CompanyBottomNavDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings?: () => void;
}

interface NavItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isModal?: boolean;
  badge?: string;
  badgeVariant?: "primary" | "warning" | "muted";
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

const CATEGORIES: NavCategory[] = [
  {
    title: "Gestión de Personal & Expedientes",
    items: [
      {
        title: "Plantilla de Empleados",
        description: "Directorio de empleados, puestos, salarios y estatus",
        href: "/dashboard/company/employees",
        icon: UserCheck,
      },
      {
        title: "Contratos & Bajas",
        description: "Documentos laborales, vigencias y actas de separación",
        href: "/dashboard/company/contracts",
        icon: FileCheck2,
      },
      {
        title: "Evaluaciones 360",
        description: "Desempeño continuo, objetivos y retroalimentación",
        href: "/dashboard/company/evaluations",
        icon: Star,
      },
    ],
  },
  {
    title: "Tiempo, Asistencia & Operaciones",
    items: [
      {
        title: "Control de Asistencia",
        description: "Checador diario, retardos, faltas y justificaciones",
        href: "/dashboard/company/attendance",
        icon: Clock,
      },
      {
        title: "Vacaciones & Permisos LFT",
        description: "Cálculo de días disponibles por antigüedad y autorizaciones",
        href: "/dashboard/company/leaves",
        icon: Plane,
        badge: "LFT 2026",
        badgeVariant: "primary",
      },
      {
        title: "Incidencias Laborales",
        description: "Faltas injustificadas, retardos e incapacidades",
        href: "/dashboard/company/incidents",
        icon: ShieldAlert,
      },
    ],
  },
  {
    title: "Compensación & Finanzas",
    items: [
      {
        title: "Nómina & Pagos",
        description: "Cálculo, dispersión salarial y recibos",
        href: "/dashboard/company/payroll",
        icon: CreditCard,
      },
      {
        title: "Centro de Reportes",
        description: "Métricas de personal, auditoría y descargas Excel / CSV",
        href: "/dashboard/company/reports",
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    title: "Atracción de Talento",
    items: [
      {
        title: "Bolsa de Vacantes",
        description: "Publicación de ofertas y perfiles de puesto",
        href: "/dashboard/company/vacancies",
        icon: Briefcase,
      },
      {
        title: "Postulantes & Reclutamiento",
        description: "Candidatos, entrevistas y flujo de contratación",
        href: "/dashboard/company/applications",
        icon: Users,
      },
    ],
  },
  {
    title: "Organización & Ajustes",
    items: [
      {
        title: "Perfil Corporativo",
        description: "Datos comerciales, logo y razón social",
        href: "/dashboard/company/profile",
        icon: Building2,
      },
      {
        title: "Sello de Verificación",
        description: "Validación de autenticidad e insignia oficial",
        href: "/dashboard/company/verification",
        icon: ShieldCheck,
      },
      {
        title: "Configuración General",
        description: "Tema visual, notificaciones y seguridad",
        href: "#",
        icon: Settings,
        isModal: true,
      },
      {
        title: "Centro de Ayuda & Soporte",
        description: "Atención técnica y preguntas frecuentes",
        href: "#",
        icon: HelpCircle,
      },
    ],
  },
];

export function CompanyBottomNavDrawer({
  open,
  onOpenChange,
  onOpenSettings,
}: CompanyBottomNavDrawerProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "#") return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle swipeDirection="down">
      <DrawerContent className="[--drawer-inset:0px] max-h-[88vh] rounded-t-[28px] rounded-b-none border-x-0 border-b-0 border-t border-border/70 bg-card text-card-foreground shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera del Drawer */}
        <DrawerHeader className="px-5 pt-3 pb-3 border-b border-border/40 flex flex-row items-center justify-between shrink-0">
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <DrawerTitle className="text-base font-extrabold tracking-tight text-foreground">
                Módulos & Herramientas RH
              </DrawerTitle>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="size-2.5" />
                Canary Early Access
              </span>
            </div>
            <DrawerDescription className="text-xs text-muted-foreground mt-0.5 truncate">
              Centro de control completo para la gestión de tu organización
            </DrawerDescription>
          </div>

          <DrawerClose
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 ml-2 cursor-pointer"
                aria-label="Cerrar menú de módulos"
              />
            }
          >
            <X className="size-4" />
          </DrawerClose>
        </DrawerHeader>

        {/* Contenido deslizable con categorías */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-4 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
          {/* Tarjeta de Acción Rápida Destacada: Registrar Empleado */}
          <Link
            href="/dashboard/company/employees?action=new"
            onClick={() => onOpenChange(false)}
            className="group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-primary via-primary/95 to-primary/85 text-primary-foreground shadow-md transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-primary-foreground shadow-xs">
                <UserPlus className="size-5" />
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-tight block truncate">
                    Registrar Nuevo Empleado
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-white/25 text-white">
                    Directo
                  </span>
                </div>
                <span className="text-[11px] text-primary-foreground/80 font-medium block truncate">
                  Alta al padrón de personal con salario, puesto y RFC
                </span>
              </div>
            </div>
            <ChevronRight className="size-5 text-primary-foreground/70 group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </Link>

          {/* Bloques de Categorías */}
          {CATEGORIES.map((category) => (
            <div key={category.title} className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground/80 px-1 block">
                {category.title}
              </span>

              <div className="grid grid-cols-1 gap-1">
                {category.items.map((item) => {
                  const isActive = isItemActive(item.href);
                  const Icon = item.icon;

                  if (item.isModal) {
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => {
                          onOpenChange(false);
                          if (onOpenSettings) {
                            onOpenSettings();
                          }
                        }}
                        className="group w-full flex items-center justify-between p-2.5 rounded-xl border border-border/30 hover:border-border/70 bg-card hover:bg-muted/50 transition-all duration-150 active:scale-[0.99] text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-xl bg-muted/60 text-muted-foreground group-hover:text-foreground group-hover:bg-muted flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-foreground block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-medium block truncate">
                              {item.description}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "group flex items-center justify-between p-2.5 rounded-xl border transition-all duration-150 active:scale-[0.99] cursor-pointer",
                        isActive
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "border-border/30 hover:border-border/70 bg-card hover:bg-muted/50 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-2xs",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "bg-muted/60 text-muted-foreground group-hover:text-foreground group-hover:bg-muted"
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-xs block truncate",
                                isActive ? "font-extrabold text-primary" : "font-bold text-foreground"
                              )}
                            >
                              {item.title}
                            </span>
                            {item.badge && (
                              <span
                                className={cn(
                                  "text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0",
                                  item.badgeVariant === "primary" &&
                                    "bg-primary/15 text-primary border border-primary/25",
                                  item.badgeVariant === "muted" &&
                                    "bg-muted text-muted-foreground border border-border/50",
                                  !item.badgeVariant &&
                                    "bg-muted text-muted-foreground"
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground font-medium block truncate">
                            {item.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isActive && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
                            Activo
                          </span>
                        )}
                        <ChevronRight
                          className={cn(
                            "size-4 transition-all",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground/30 group-hover:text-muted-foreground group-hover:translate-x-0.5"
                          )}
                        />
                      </div>
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
