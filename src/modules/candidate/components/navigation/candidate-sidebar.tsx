"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Bookmark02Icon,
  Briefcase01Icon,
  Calendar03Icon,
  File01Icon,
  File02Icon,
  HelpCircleIcon,
  Home01Icon,
  Settings01Icon,
  Shield01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
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

const CANDIDATE_NAV_GROUPS: NavGroup[] = [
  {
    id: "bolsa",
    label: "Bolsa de empleo",
    items: [
      { title: "Vacantes", url: "/dashboard/candidate", icon: Home01Icon },
      {
        title: "Postulaciones",
        url: "/dashboard/candidate/applications",
        icon: File01Icon,
      },
      {
        title: "Guardados",
        url: "/dashboard/candidate/saved",
        icon: Bookmark02Icon,
      },
    ],
  },
  {
    id: "trabajo",
    label: "Mi trabajo",
    items: [
      {
        title: "Contratos",
        url: "/dashboard/candidate/contracts",
        icon: File02Icon,
      },
      {
        title: "Permisos y vacaciones",
        url: "/dashboard/candidate/leaves",
        icon: Calendar03Icon,
      },
      {
        title: "Documentos",
        url: "/dashboard/candidate/documents",
        icon: Shield01Icon,
      },
    ],
  },
  {
    id: "cuenta",
    label: "Mi cuenta",
    items: [
      {
        title: "Mi perfil",
        url: "/dashboard/candidate/profile",
        icon: UserCircleIcon,
      },
      {
        title: "Configuración",
        url: "/dashboard/candidate/settings",
        icon: Settings01Icon,
      },
    ],
  },
];

const EMPLOYEE_NAV_GROUPS: NavGroup[] = [
  {
    id: "mi-empleo",
    label: "Mi empleo",
    items: [
      { title: "Mi portal", url: "/dashboard/candidate", icon: Home01Icon },
      {
        title: "Contratos",
        url: "/dashboard/candidate/contracts",
        icon: File02Icon,
      },
      {
        title: "Permisos y vacaciones",
        url: "/dashboard/candidate/leaves",
        icon: Calendar03Icon,
      },
      {
        title: "Incidencias",
        url: "/dashboard/candidate/incidents",
        icon: Alert02Icon,
      },
      {
        title: "Documentos",
        url: "/dashboard/candidate/documents",
        icon: Shield01Icon,
      },
    ],
  },
  {
    id: "carrera",
    label: "Bolsa y carrera",
    items: [
      {
        title: "Postulaciones",
        url: "/dashboard/candidate/applications",
        icon: Briefcase01Icon,
      },
      {
        title: "Mi perfil",
        url: "/dashboard/candidate/profile",
        icon: UserCircleIcon,
      },
      {
        title: "Configuración",
        url: "/dashboard/candidate/settings",
        icon: Settings01Icon,
      },
    ],
  },
];

export interface CandidateSidebarProps
  extends React.ComponentProps<typeof Sidebar> {
  isEmployee?: boolean;
}

export function CandidateSidebar({
  isEmployee = false,
  className,
  ...props
}: CandidateSidebarProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const navGroups = isEmployee ? EMPLOYEE_NAV_GROUPS : CANDIDATE_NAV_GROUPS;

  const isItemActive = React.useCallback(
    (url: string) => {
      if (url === "/dashboard/candidate") {
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
      {/* Marca (idéntica a CompanySidebar) */}
      <SidebarHeader className="px-5 pt-0 pb-3 gap-3 bg-sidebar">
        <div className="min-h-[64px] flex items-center pt-[5px]">
          <Link
            href="/dashboard/candidate"
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

        <div className="h-px w-full bg-border mt-1" />
      </SidebarHeader>

      {/* Navegación principal */}
      <SidebarContent className="bg-sidebar overflow-hidden">
        <ScrollArea className="h-full px-3">
          <div className="flex flex-col gap-4 pb-4">
            {navGroups.map((group) => (
              <SidebarGroup key={group.id} className="p-0 gap-0.5">
                <SidebarGroupLabel className="h-auto px-2 pb-1 text-[12px] font-semibold leading-[15px] text-muted-foreground">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item) => {
                    const active = isItemActive(item.url);

                    return (
                      <SidebarMenuItem key={item.url}>
                        <Link
                          href={item.url}
                          onClick={handleNavClick}
                          aria-current={active ? "page" : undefined}
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
                            aria-hidden="true"
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
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </div>
        </ScrollArea>
      </SidebarContent>

      {/* Pie lateral: Centro de ayuda (idéntico a CompanySidebar) */}
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
            aria-hidden="true"
            className="shrink-0"
          />
          <span className="truncate">Centro de ayuda</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
