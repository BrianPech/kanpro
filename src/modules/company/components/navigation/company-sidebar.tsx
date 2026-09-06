"use client";

import * as React from "react";
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
  PlusCircle,
  Clock,
  ShieldAlert,
  FileCheck2,
  CreditCard,
  ChevronDown,
  Plane,
  Star,
  FileSpreadsheet,
  X,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { NavUser } from "@/components/shared/nav-user";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CompanySettingsModal } from "../company-settings-dialog";

export function CompanySidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const sections = [
    {
      label: "Inicio & Analítica",
      isCollapsible: true,
      defaultOpen: false,
      items: [
        {
          title: "Dashboard General",
          url: "/dashboard/company",
          icon: LayoutDashboard,
        },
        {
          title: "Centro de Reportes",
          url: "/dashboard/company/reports",
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      label: "Atracción de Talento",
      isCollapsible: true,
      defaultOpen: false,
      items: [
        {
          title: "Mis Vacantes",
          url: "/dashboard/company/vacancies",
          icon: Briefcase,
        },
        {
          title: "Postulantes & Selección",
          url: "/dashboard/company/applications",
          icon: Users,
        },
      ],
    },
    {
      label: "Gestión de Personal",
      isCollapsible: true,
      defaultOpen: false,
      items: [
        {
          title: "Plantilla de Empleados",
          url: "/dashboard/company/employees",
          icon: UserCheck,
        },
        {
          title: "Contratos & Bajas",
          url: "/dashboard/company/contracts",
          icon: FileCheck2,
        },
        {
          title: "Evaluaciones 360",
          url: "/dashboard/company/evaluations",
          icon: Star,
        },
      ],
    },
    {
      label: "Operaciones & Asistencia",
      isCollapsible: true,
      defaultOpen: false,
      items: [
        {
          title: "Asistencia & Checador",
          url: "/dashboard/company/attendance",
          icon: Clock,
        },
        {
          title: "Vacaciones & Permisos",
          url: "/dashboard/company/leaves",
          icon: Plane,
        },
        {
          title: "Incidencias Laborales",
          url: "/dashboard/company/incidents",
          icon: ShieldAlert,
        },
      ],
    },
    {
      label: "Compensaciones",
      isCollapsible: true,
      defaultOpen: false,
      items: [
        {
          title: "Nómina & Pagos",
          url: "/dashboard/company/payroll",
          icon: CreditCard,
        },
      ],
    },
    {
      label: "Mi Empresa",
      isCollapsible: true,
      defaultOpen: false,
      items: [
        {
          title: "Perfil Corporativo",
          url: "/dashboard/company/profile",
          icon: Building2,
        },
        {
          title: "Sello de Verificación",
          url: "/dashboard/company/verification",
          icon: ShieldCheck,
        },
      ],
    },
  ];

  const secondaryNav = [
    {
      title: "Publicar Oferta",
      url: "/dashboard/company/vacancies/new",
      icon: PlusCircle,
    },
    {
      title: "Configuración",
      url: "/dashboard/company/settings",
      icon: Settings,
      isModal: true,
    },
    {
      title: "Soporte K'anPro",
      url: "#",
      icon: HelpCircle,
    },
  ];

  const isItemActive = React.useCallback(
    (url: string) => {
      if (url === "/dashboard/company") {
        return pathname === url;
      }
      return pathname === url || (url !== "#" && pathname.startsWith(url + "/"));
    },
    [pathname]
  );

  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach((section) => {
      const hasActive = section.items.some((item) => isItemActive(item.url));
      initial[section.label] = hasActive || section.defaultOpen;
    });
    return initial;
  });

  React.useEffect(() => {
    sections.forEach((section) => {
      if (section.items.some((item) => isItemActive(item.url))) {
        setOpenSections((prev) =>
          prev[section.label] ? prev : { ...prev, [section.label]: true }
        );
      }
    });
  }, [pathname, isItemActive, sections]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="py-3 px-3 shrink-0 flex flex-row items-center justify-between">
        <SidebarMenu className="flex-1 min-w-0">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard/company" />}
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
              className="hover:bg-sidebar-accent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Kanban className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-tight text-sidebar-foreground">
                  K&apos;anPro
                </span>
                <span className="truncate text-xs text-muted-foreground font-medium">
                  Portal Empresa
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            onClick={() => setOpenMobile(false)}
            aria-label="Cerrar menú lateral"
          >
            <X className="size-4" />
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent className="p-0 overflow-hidden flex-1 min-h-0">
        <ScrollArea className="h-full w-full px-2 py-2">
          {sections.map((section) => {
            if (section.isCollapsible) {
              const isOpen = !!openSections[section.label];
              return (
                <Collapsible
                  key={section.label}
                  open={isOpen}
                  onOpenChange={(open) =>
                    setOpenSections((prev) => ({
                      ...prev,
                      [section.label]: open,
                    }))
                  }
                  className="group/collapsible mb-2.5"
                >
                  <SidebarGroup className="p-0">
                    <CollapsibleTrigger className="w-full flex items-center justify-between px-2.5 py-1.5 cursor-pointer select-none rounded-lg hover:bg-sidebar-accent/50 transition-colors">
                      <SidebarGroupLabel className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground/80 pointer-events-none p-0 cursor-pointer">
                        {section.label}
                      </SidebarGroupLabel>
                      <ChevronDown className="size-3.5 text-muted-foreground/60 transition-transform duration-200 group-data-[state=closed]/collapsible:-rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarGroupContent className="pt-1">
                        <SidebarMenu className="gap-0.5">
                          {section.items.map((item) => {
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
                                    "h-9 rounded-xl px-2.5 gap-2.5 text-xs font-semibold transition-all",
                                    isActive
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-xs"
                                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                                  )}
                                >
                                  <item.icon className="size-4 shrink-0" />
                                  <span>{item.title}</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>
              );
            }

            return (
              <SidebarGroup key={section.label} className="p-0 mb-2.5">
                <SidebarGroupLabel className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground/80 px-2.5">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {section.items.map((item) => {
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
                              "h-9 rounded-xl px-2.5 gap-2.5 text-xs font-semibold transition-all",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-xs"
                                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                            )}
                          >
                            <item.icon className="size-4 shrink-0" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] md:pb-2 shrink-0 bg-sidebar space-y-1">
        <SidebarMenu className="gap-0.5">
          {secondaryNav.map((item) => {
            const isActive = isItemActive(item.url);
            const isPrimaryAction = item.title === "Publicar Oferta";

            if (item.isModal) {
              return (
                <SidebarMenuItem key={item.title}>
                  <CompanySettingsModal
                    trigger={
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={cn(
                          "h-9 rounded-xl px-2.5 gap-2.5 text-xs font-semibold transition-all cursor-pointer",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-xs"
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        )}
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    }
                  />
                </SidebarMenuItem>
              );
            }

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
                    "h-9 rounded-xl px-2.5 gap-2.5 text-xs font-semibold transition-all",
                    isPrimaryAction
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-xs mb-1"
                      : isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        <div className="pt-1 border-t border-sidebar-border">
          <NavUser />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
