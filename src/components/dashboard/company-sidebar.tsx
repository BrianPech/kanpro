"use client";

import * as React from "react";
import {
  Settings,
  LayoutDashboard,
  Kanban,
  Building2,
  Briefcase,
  Users,
  Sparkles,
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
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function CompanySidebar() {
  const pathname = usePathname();

  const navigation = [
    {
      title: "Dashboard",
      url: "/dashboard/company",
      icon: LayoutDashboard,
    },
    {
      title: "Radar de Talentos",
      url: "/dashboard/company/radar",
      icon: Sparkles,
    },
    {
      title: "Perfil Empresa",
      url: "/dashboard/company/profile",
      icon: Building2,
    },
    {
      title: "Gestionar Vacantes",
      url: "/dashboard/company/vacancies",
      icon: Briefcase,
    },
    {
      title: "Bandeja Postulantes",
      url: "/dashboard/company/applications",
      icon: Users,
    },
    {
      title: "Configuración",
      url: "/dashboard/company/settings",
      icon: Settings,
    },
  ];

  return (
    <Sidebar
      variant="inset"
      collapsible="none"
      className="hidden md:flex border-r border-border/20 bg-zinc-50/50 dark:bg-zinc-950/40 peer"
      data-variant="inset"
      data-state="expanded"
    >
      <SidebarHeader className="h-20 px-6 flex items-center justify-center border-b border-border/10">
        <div className="flex w-full items-center gap-2.5 transition-all duration-300">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-100 transition-all duration-300">
            <Kanban className="h-4.5 w-4.5 text-zinc-100 dark:text-zinc-900" />
          </div>
          <span className="text-[18px] font-bold text-zinc-900 dark:text-zinc-50 tracking-[-0.03em]">
            K&apos;anPro
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.18em] font-semibold text-zinc-400 dark:text-zinc-500 mb-4 px-2">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigation.map((item) => {
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
                      className="h-10 rounded-lg px-3 gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 data-[active=true]:bg-primary/10 dark:data-[active=true]:bg-primary/20 data-[active=true]:text-primary dark:data-[active=true]:text-primary-foreground transition-all duration-200 border border-transparent data-[active=true]:border-primary/10"
                    >
                      <Link
                        href={item.url}
                        className="flex w-full items-center gap-3"
                      >
                        <item.icon
                          className={`size-4 shrink-0 transition-colors ${isActive ? "text-primary dark:text-primary-foreground" : "text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"}`}
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
      </SidebarContent>
    </Sidebar>
  );
}
