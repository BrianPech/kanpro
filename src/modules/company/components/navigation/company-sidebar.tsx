"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  BarChartIcon,
  Briefcase01Icon,
  Building03Icon,
  Calendar03Icon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  CompassIcon,
  File02Icon,
  HelpCircleIcon,
  Home01Icon,
  InboxIcon,
  Invoice01Icon,
  Layers01Icon,
  Settings01Icon,
  StarIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { Lock } from "@/components/ui/icons";
import {
  getLockedModuleBadge,
  isCompanyRouteAllowed,
} from "@/modules/company/config/demo-rollout";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CompanySwitcher } from "./company-switcher";
import type { UserCompanyItem } from "@/modules/company/services/company-tenant.service";
import { cn } from "@/lib/utils";

type HugeIconType = typeof Home01Icon;

interface NavItem {
  title: string;
  url: string;
  icon: HugeIconType;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const COMPANY_NAV_GROUPS: NavGroup[] = [
  {
    id: "empresa",
    label: "Empresa",
    items: [
      { title: "Inicio", url: "/dashboard/company", icon: Home01Icon },
      {
        title: "Plantilla",
        url: "/dashboard/company/employees",
        icon: UserGroupIcon,
      },
      {
        title: "Asistencia",
        url: "/dashboard/company/attendance",
        icon: Clock01Icon,
      },
      {
        title: "Permisos y vacaciones",
        url: "/dashboard/company/leaves",
        icon: Calendar03Icon,
      },
      {
        title: "Incidencias",
        url: "/dashboard/company/incidents",
        icon: Alert02Icon,
      },
      {
        title: "Contratos",
        url: "/dashboard/company/contracts",
        icon: File02Icon,
      },
      { title: "Nómina", url: "/dashboard/company/payroll", icon: Invoice01Icon },
    ],
  },
  {
    id: "reclutamiento",
    label: "Reclutamiento",
    items: [
      {
        title: "Vacantes",
        url: "/dashboard/company/vacancies",
        icon: Briefcase01Icon,
      },
      {
        title: "Postulaciones",
        url: "/dashboard/company/applications",
        icon: InboxIcon,
      },
      {
        title: "Radar de talento",
        url: "/dashboard/company/radar",
        icon: CompassIcon,
      },
    ],
  },
  {
    id: "administracion",
    label: "Administración",
    items: [
      { title: "Áreas", url: "/dashboard/company/areas", icon: Layers01Icon },
      {
        title: "Evaluaciones",
        url: "/dashboard/company/evaluations",
        icon: StarIcon,
      },
      {
        title: "Reportes",
        url: "/dashboard/company/reports",
        icon: BarChartIcon,
      },
      {
        title: "Configuración",
        url: "/dashboard/company/settings",
        icon: Settings01Icon,
      },
      {
        title: "Perfil de empresa",
        url: "/dashboard/company/profile",
        icon: Building03Icon,
      },
      {
        title: "Verificación",
        url: "/dashboard/company/verification",
        icon: CheckmarkBadge01Icon,
      },
    ],
  },
];

export interface CompanySidebarProps
  extends React.ComponentProps<typeof Sidebar> {
  enabledModules?: string[];
  companies?: UserCompanyItem[];
  activeCompanyId?: string;
}

export function CompanySidebar({
  className,
  enabledModules,
  companies = [],
  activeCompanyId,
  ...props
}: CompanySidebarProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const isItemActive = React.useCallback(
    (url: string) => {
      if (url === "/dashboard/company") {
        return pathname === url;
      }
      return pathname === url || pathname.startsWith(`${url}/`);
    },
    [pathname]
  );

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      {...props}
      className={cn(
        "border-none bg-sidebar text-sidebar-foreground select-none",
        className
      )}
    >
      {/* Marca y selector de empresa */}
      <SidebarHeader className="px-5 pt-0 pb-3 gap-3 bg-sidebar">
        <div className="min-h-[64px] flex items-center pt-[5px]">
          <Link
            href="/dashboard/company"
            onClick={handleNavClick}
            aria-label="K'anPro - Inicio"
            className="relative h-[43.667px] w-[117.087px] shrink-0"
          >
            <Image
              src="/images/kanpro-mark-light.svg"
              alt=""
              width={34}
              height={38}
              priority
              className="absolute left-0 top-0 h-[38.261px] w-[34.435px] dark:hidden"
            />
            <Image
              src="/images/kanpro-mark-dark.svg"
              alt=""
              width={34}
              height={38}
              priority
              className="absolute left-0 top-0 h-[38.261px] w-[34.435px] hidden dark:block"
            />
            <span className="absolute left-[42.09px] top-[14.67px] text-[24.232px] font-semibold leading-none whitespace-nowrap">
              <span className="text-[#0b0b0b] dark:text-white">an </span>
              <span className="text-link">Pro</span>
            </span>
          </Link>
        </div>

        <CompanySwitcher
          variant="sidebar"
          companies={companies}
          activeCompanyId={activeCompanyId}
        />

        <div className="h-px w-full bg-border mt-1" />
      </SidebarHeader>

      {/* Navegación principal */}
      <SidebarContent className="bg-sidebar overflow-hidden">
        <ScrollArea className="h-full px-3">
          <div className="flex flex-col gap-4 pb-4">
            {COMPANY_NAV_GROUPS.map((group) => (
              <SidebarGroup key={group.id} className="p-0 gap-0.5">
                <SidebarGroupLabel className="h-auto px-2 pb-1 text-[12px] font-semibold leading-[15px] text-muted-foreground">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item) => {
                    const active = isItemActive(item.url);
                    const allowed = isCompanyRouteAllowed(
                      item.url,
                      enabledModules
                    );
                    const lockedBadge = !allowed
                      ? getLockedModuleBadge(item.url, enabledModules)
                      : null;

                    return (
                      <SidebarMenuItem key={item.url}>
                        {allowed ? (
                          <Link
                            href={item.url}
                            onClick={handleNavClick}
                            className={cn(
                              "flex items-center gap-2 min-h-[36px] w-full pl-2 pr-1.5 py-2 rounded-[8px] text-[13.5px] font-medium leading-[19px] transition-colors",
                              active
                                ? "bg-sidebar-accent text-link"
                                : "text-foreground hover:bg-background/60 dark:hover:bg-background/30"
                            )}
                          >
                            <HugeiconsIcon
                              icon={item.icon}
                              size={20}
                              strokeWidth={1.75}
                              className="shrink-0"
                            />
                            <span className="flex-1 truncate">{item.title}</span>
                            {active && (
                              <span
                                aria-hidden="true"
                                className="h-4 w-[2px] rounded-full bg-link shrink-0"
                              />
                            )}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              toast.info(
                                lockedBadge ? `${item.title} (${lockedBadge})` : item.title,
                                {
                                  description:
                                    "Este módulo se habilitará progresivamente en una próxima fase del despliegue.",
                                }
                              )
                            }
                            className="flex items-center gap-2 min-h-[36px] w-full pl-2 pr-1.5 py-2 rounded-[8px] text-[13.5px] font-medium leading-[19px] text-muted-foreground opacity-70 hover:bg-background/40 transition-colors cursor-pointer text-left"
                          >
                            <HugeiconsIcon
                              icon={item.icon}
                              size={20}
                              strokeWidth={1.75}
                              className="shrink-0"
                            />
                            <span className="flex-1 truncate">{item.title}</span>
                            <Lock className="size-3.5 shrink-0" />
                          </button>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </div>
        </ScrollArea>
      </SidebarContent>

      {/* Pie lateral: Centro de ayuda */}
      <SidebarFooter className="px-5 pt-2 pb-5 bg-sidebar gap-2">
        <div className="h-px w-full bg-border" />
        <Link
          href="/contact"
          onClick={handleNavClick}
          className="flex items-center gap-2 min-h-[36px] w-full pl-2.5 pr-2 py-2 rounded-[8px] text-[14px] font-medium leading-[19px] text-foreground hover:bg-background/60 dark:hover:bg-background/30 transition-colors"
        >
          <HugeiconsIcon
            icon={HelpCircleIcon}
            size={20}
            strokeWidth={1.75}
            className="shrink-0"
          />
          <span className="truncate">Centro de ayuda</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
