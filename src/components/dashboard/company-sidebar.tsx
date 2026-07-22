"use client";

import * as React from "react";
import {
  Settings,
  LayoutDashboard,
  Kanban,
  Building2,
  Briefcase,
  Users,
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
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function CompanySidebar() {
  const pathname = usePathname();

  const sections = [
    {
      label: "General",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard/company",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Reclutamiento",
      items: [
        {
          title: "Vacantes",
          url: "/dashboard/company/vacancies",
          icon: Briefcase,
        },
        {
          title: "Postulantes",
          url: "/dashboard/company/applications",
          icon: Users,
        },
      ],
    },
    {
      label: "Empresa",
      items: [
        {
          title: "Perfil",
          url: "/dashboard/company/profile",
          icon: Building2,
        },
      ],
    },
  ];

  return (
    <Sidebar
      variant="floating"
      className="hidden md:flex p-3 bg-transparent border-none"
    >
      <SidebarHeader className="h-20 px-6 flex items-center justify-start">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fiord-950 dark:bg-fiord-50 text-white dark:text-fiord-950 shadow-sm">
            <Kanban className="h-4.5 w-4.5" />
          </div>
          <span className="text-[18px] font-bold text-fiord-900 dark:text-fiord-50 tracking-[-0.03em]">
            K&apos;an<span className="text-fiord-550">Pro</span>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 space-y-5">
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="p-0">
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-fiord-500 dark:text-fiord-400 mb-2 px-3">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.url ||
                    (pathname.startsWith(item.url) &&
                      !["/dashboard/company"].includes(item.url));

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className="h-10 rounded-xl px-3 gap-3 transition-all duration-200 border border-transparent 
                          text-fiord-700 dark:text-fiord-300 hover:text-fiord-950 dark:hover:text-fiord-50 hover:bg-fiord-50 dark:hover:bg-fiord-900/40
                          data-[active=true]:bg-fiord-950 dark:data-[active=true]:bg-fiord-50 
                          data-[active=true]:text-white dark:data-[active=true]:text-fiord-950 
                          data-[active=true]:shadow-sm"
                      >
                        <Link
                          href={item.url}
                          className="flex w-full items-center gap-3"
                        >
                          <item.icon
                            className={`size-4 shrink-0 transition-colors ${isActive ? "text-white dark:text-fiord-950" : "text-fiord-500 dark:text-fiord-400"}`}
                          />
                          <span
                            className={`text-[13px] tracking-tight ${isActive ? "font-semibold" : "font-medium"}`}
                          >
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 dark:border-fiord-800/40">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard/company/settings"}
              tooltip="Configuración"
              className="h-10 rounded-xl px-3 gap-3 transition-all duration-200 border border-transparent 
                text-fiord-700 dark:text-fiord-300 hover:text-fiord-950 dark:hover:text-fiord-50 hover:bg-fiord-50 dark:hover:bg-fiord-900/40
                data-[active=true]:bg-fiord-950 dark:data-[active=true]:bg-fiord-50 
                data-[active=true]:text-white dark:data-[active=true]:text-fiord-950 
                data-[active=true]:shadow-sm"
            >
              <Link
                href="/dashboard/company/settings"
                className="flex w-full items-center gap-3"
              >
                <Settings
                  className={`size-4 shrink-0 transition-colors ${pathname === "/dashboard/company/settings"
                      ? "text-white dark:text-fiord-950"
                      : "text-fiord-500 dark:text-fiord-400"
                    }`}
                />
                <span
                  className={`text-[13px] tracking-tight ${pathname === "/dashboard/company/settings"
                      ? "font-semibold"
                      : "font-medium"
                    }`}
                >
                  Configuración
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
