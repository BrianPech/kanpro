"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  Building2,
  Briefcase,
  Users,
  UserCheck,
  ShieldCheck,
  Settings,
  HelpCircle,
  Clock,
  ShieldAlert,
  FileCheck2,
  CreditCard,
  Star,
  FileSpreadsheet,
  UserPlus,
  Plus,
  Layers,
  ChevronRight,
} from "@/components/ui/icons";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavUser } from "@/components/shared/nav-user";
import { cn } from "@/lib/utils";
import { CompanySettingsModal } from "../company-settings-dialog";

export interface SubMenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  description?: string;
  badge?: string;
}

export interface PrimarySection {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  action?: {
    label: string;
    url: string;
    icon: React.ElementType;
  };
  items: SubMenuItem[];
}

export const companySections: PrimarySection[] = [
  {
    id: "analytics",
    label: "Inicio & Analítica",
    shortLabel: "Inicio",
    icon: LayoutDashboard,
    description: "Métricas operativas y centros de reportes ejecutivos.",
    items: [
      {
        title: "Dashboard General",
        url: "/dashboard/company",
        icon: LayoutDashboard,
        description: "Resumen de empleados, alertas y actividades.",
      },
      {
        title: "Centro de Reportes",
        url: "/dashboard/company/reports",
        icon: FileSpreadsheet,
        description: "Exportaciones de nómina, asistencias y personal.",
      },
    ],
  },
  {
    id: "people",
    label: "Gestión de Personal",
    shortLabel: "Personal",
    icon: Users,
    description: "Administración de empleados, expedientes y contratos.",
    action: {
      label: "+ Registrar Empleado",
      url: "/dashboard/company/employees?action=new",
      icon: UserPlus,
    },
    items: [
      {
        title: "Plantilla de Empleados",
        url: "/dashboard/company/employees",
        icon: UserCheck,
        description: "Directorio completo de empleados activos e inactivos.",
      },
      {
        title: "Contratos & Bajas",
        url: "/dashboard/company/contracts",
        icon: FileCheck2,
        description: "Seguimiento de contratos, periodos de prueba y renovaciones.",
      },
      {
        title: "Evaluaciones 360",
        url: "/dashboard/company/evaluations",
        icon: Star,
        description: "Desempeño, competencias y feedback continuo.",
      },
    ],
  },
  {
    id: "operations",
    label: "Operaciones & Asistencia",
    shortLabel: "Operaciones",
    icon: Clock,
    description: "Control horario, checador, ausencias e incidencias.",
    items: [
      {
        title: "Asistencia & Checador",
        url: "/dashboard/company/attendance",
        icon: Clock,
        description: "Marcajes biométricos, retardos y turnos en tiempo real.",
      },
      {
        title: "Vacaciones & Permisos",
        url: "/dashboard/company/leaves",
        icon: Layers,
        description: "Solicitudes de descanso, días económicos y aprobaciones.",
      },
      {
        title: "Incidencias Laborales",
        url: "/dashboard/company/incidents",
        icon: ShieldAlert,
        description: "Justificantes, faltas, actas administrativas y notas.",
      },
    ],
  },
  {
    id: "payroll",
    label: "Compensaciones",
    shortLabel: "Nómina",
    icon: CreditCard,
    description: "Cálculo y dispersión de salarios y recibos fiscales.",
    items: [
      {
        title: "Nómina & Pagos",
        url: "/dashboard/company/payroll",
        icon: CreditCard,
        description: "Periodos de nómina, dispersiones bancarias y recibos.",
      },
    ],
  },
  {
    id: "company",
    label: "Mi Empresa",
    shortLabel: "Empresa",
    icon: Building2,
    description: "Configuración corporativa, datos fiscales y acreditaciones.",
    items: [
      {
        title: "Perfil Corporativo",
        url: "/dashboard/company/profile",
        icon: Building2,
        description: "Razón social, logo, sucursales y datos de contacto.",
      },
      {
        title: "Áreas & Departamentos",
        url: "/dashboard/company/areas",
        icon: Layers,
        description: "Estructura organizacional, departamentos y áreas operativas.",
      },
      {
        title: "Sello de Verificación",
        url: "/dashboard/company/verification",
        icon: ShieldCheck,
        description: "Expediente digital y verificación de certeza laboral.",
      },
    ],
  },
  {
    id: "recruitment",
    label: "Reclutamiento",
    shortLabel: "Talento",
    icon: Briefcase,
    description: "Atracción de talento, vacantes y selección de candidatos.",
    action: {
      label: "+ Publicar Vacante",
      url: "/dashboard/company/vacancies/new",
      icon: Plus,
    },
    items: [
      {
        title: "Mis Vacantes",
        url: "/dashboard/company/vacancies",
        icon: Briefcase,
        description: "Convocatorias abiertas, borradores y archivo.",
      },
      {
        title: "Postulantes & Selección",
        url: "/dashboard/company/applications",
        icon: Users,
        description: "Pipeline de candidatos y seguimiento de entrevistas.",
      },
    ],
  },
];

export function CompanySidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile, setOpen } = useSidebar();
  const isItemActive = React.useCallback(
    (url: string) => {
      if (url === "/dashboard/company") {
        return pathname === url;
      }
      return pathname === url || (url !== "#" && pathname.startsWith(url + "/"));
    },
    [pathname]
  );

  const currentSectionId = React.useMemo(() => {
    for (const section of companySections) {
      if (section.items.some((item) => isItemActive(item.url))) {
        return section.id;
      }
    }
    return companySections[0].id;
  }, [isItemActive]);

  const [activeSectionId, setActiveSectionId] = React.useState<string>(currentSectionId);

  React.useEffect(() => {
    setActiveSectionId(currentSectionId);
  }, [currentSectionId]);

  const activeSection =
    companySections.find((s) => s.id === activeSectionId) || companySections[0];

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className={cn(
        "p-0 overflow-hidden *:data-[sidebar=sidebar]:flex-row",
        className
      )}
    >
      {/* 1. SIDEBAR PRIMARIA: Barra Compacta de Iconos (Categorías Principales) */}
      <Sidebar
        collapsible="none"
        className="w-14 border-r border-sidebar-border bg-sidebar shrink-0 flex flex-col justify-between select-none"
      >
        {/* Header con Isotipo K'anPro */}
        <SidebarHeader className="h-14 flex items-center justify-center p-0 border-none shrink-0">
          <SidebarMenu className="w-full items-center">
            <SidebarMenuItem className="w-full flex items-center justify-center">
              <SidebarMenuButton
                size="icon"
                render={<Link href="/dashboard/company" />}
                tooltip={{
                  children: "K'anPro Portal Empresa",
                  hidden: false,
                  side: "right",
                  sideOffset: 12,
                }}
                onClick={() => {
                  setActiveSectionId("analytics");
                  if (isMobile) setOpenMobile(false);
                }}
                className="size-10 p-0 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer has-[>svg:first-child]:pl-0 has-[>svg:last-child]:pr-0"
              >
                <Kanban className="size-5 shrink-0" />
                <span className="sr-only">K&apos;anPro Empresa</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Contenido: Iconos de las Categorías Principales */}
        <SidebarContent className="flex-1 py-3 px-0 overflow-hidden flex flex-col items-center">
          <SidebarGroup className="p-0 w-full flex flex-col items-center">
            <SidebarGroupContent className="w-full flex flex-col items-center">
              <SidebarMenu className="gap-2 items-center w-full">
                {companySections.map((section) => {
                  const isActive = activeSection.id === section.id;

                  return (
                    <SidebarMenuItem key={section.id} className="w-full flex items-center justify-center">
                      <SidebarMenuButton
                        size="icon"
                        render={<Link href={section.items[0].url} />}
                        tooltip={{
                          children: section.label,
                          hidden: false,
                          side: "right",
                          sideOffset: 12,
                        }}
                        onClick={() => {
                          setActiveSectionId(section.id);
                          setOpen(true);
                          if (isMobile) setOpenMobile(false);
                        }}
                        isActive={isActive}
                        className={cn(
                          "size-10 p-0 flex items-center justify-center rounded-xl transition-all duration-150 relative cursor-pointer has-[>svg:first-child]:pl-0 has-[>svg:last-child]:pr-0",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-xs hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                        )}
                      >
                        <section.icon className="size-5 shrink-0" />
                        <span className="sr-only">{section.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer: Configuración & Menú Compacto de Usuario */}
        <SidebarFooter className="p-0 pb-3 space-y-2 flex flex-col items-center w-full border-none shrink-0">
          <SidebarMenu className="w-full items-center">
            <SidebarMenuItem className="w-full flex items-center justify-center">
              <CompanySettingsModal
                trigger={
                  <SidebarMenuButton
                    size="icon"
                    tooltip={{
                      children: "Configuración de Empresa",
                      hidden: false,
                      side: "right",
                      sideOffset: 12,
                    }}
                    className="size-10 p-0 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground cursor-pointer has-[>svg:first-child]:pl-0 has-[>svg:last-child]:pr-0"
                  >
                    <Settings className="size-5 shrink-0" />
                    <span className="sr-only">Configuración</span>
                  </SidebarMenuButton>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="w-full flex items-center justify-center">
            <NavUser compact={true} />
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* 2. SIDEBAR SECUNDARIA: Panel de Sub-Opciones del Módulo Seleccionado */}
      <Sidebar
        collapsible="none"
        className="w-auto flex-1 min-w-0 bg-sidebar flex flex-col justify-between"
      >
        {/* Header Secundario: Título de Categoría */}
        <SidebarHeader className="px-3.5 py-3.5 pb-2 shrink-0 border-b-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <activeSection.icon className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-foreground truncate tracking-tight">
                {activeSection.label}
              </h2>
              <p className="text-[10px] text-muted-foreground truncate font-medium">
                {activeSection.shortLabel}
              </p>
            </div>
          </div>
        </SidebarHeader>

        {/* Contenido: Lista de Sub-Opciones */}
        <SidebarContent className="p-0 overflow-hidden flex-1 min-h-0">
          <ScrollArea className="h-full w-full px-2.5 py-2">
            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {activeSection.items.map((item) => {
                    const isActive = isItemActive(item.url);

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          render={<Link href={item.url} />}
                          isActive={isActive}
                          tooltip={item.title}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false);
                          }}
                          className={cn(
                            "h-auto py-2 px-2.5 rounded-xl gap-2.5 items-start transition-all cursor-pointer",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-xs ring-1 ring-border/40"
                              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          )}
                        >
                          <div
                            className={cn(
                              "size-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "bg-sidebar-accent/80 text-muted-foreground"
                            )}
                          >
                            <item.icon className="size-3.5" />
                          </div>

                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold truncate text-foreground">
                                {item.title}
                              </span>
                              {item.badge && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-extrabold uppercase px-1.5 py-0 border-primary/20 bg-primary/5 text-primary tracking-wide shrink-0"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-[10px] text-muted-foreground/80 line-clamp-1 font-normal mt-0.5 leading-tight">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {isActive && (
                            <ChevronRight className="size-3.5 text-primary ml-auto self-center shrink-0" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Acción Primaria Contextual */}
            {activeSection.action && (
              <div className="mt-4 pt-3 border-t border-sidebar-border/60">
                <Button
                  size="sm"
                  render={<Link href={activeSection.action.url} />}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                  className="w-full font-semibold text-xs cursor-pointer"
                >
                  <activeSection.action.icon data-icon="inline-start" />
                  <span>{activeSection.action.label}</span>
                </Button>
              </div>
            )}
          </ScrollArea>
        </SidebarContent>

        {/* Footer Secundario: Soporte & Enlaces de Asistencia */}
        <SidebarFooter className="border-t-0 p-2.5 shrink-0 bg-sidebar/80">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                render={<Link href="/dashboard/company/reports" />}
                className="h-8 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 cursor-pointer"
              >
                <HelpCircle className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">Soporte & Guías K&apos;anPro</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </Sidebar>
  );
}
