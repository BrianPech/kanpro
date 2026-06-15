"use client";

import * as React from "react";
import {
  Briefcase,
  Settings,
  User,
  LayoutDashboard,
  Sparkles,
  Users,
  Flag,
  Compass,
  Building2,
  MessageSquare,
  Handshake,
  ClipboardCheck,
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
  SidebarRail,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Role = "company" | "candidate" | "admin";

export function AppSidebar({ role = "candidate" }: { role?: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const navigation = {
    admin: [
      { title: "Dashboard", url: "/dashboard/admin", icon: LayoutDashboard },
      { title: "Usuarios", url: "/dashboard/admin/users", icon: Users },
      { title: "Monitor de SLAs", url: "/dashboard/admin/sla", icon: ClipboardCheck },
      { title: "Soporte Directo", url: "/dashboard/admin/messages", icon: MessageSquare },
      { title: "Match Manual", url: "/dashboard/admin/match", icon: Handshake },
      { title: "Moderación", url: "/dashboard/admin/content", icon: Flag },
      {
        title: "Ajustes Sistema",
        url: "/dashboard/admin/settings",
        icon: Settings,
      },
    ],
    company: [
      { title: "Dashboard", url: "/dashboard/company", icon: LayoutDashboard },
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
      { title: "Configuración", url: "/dashboard/settings", icon: Settings },
    ],
    candidate: [
      {
        title: "Dashboard",
        url: "/dashboard/candidate",
        icon: LayoutDashboard,
      },
      { title: "Explorar Empleos", url: "/dashboard/discovery", icon: Compass },
      { title: "Configuración", url: "/dashboard/settings", icon: Settings },
    ],
  };
  const activeRole = pathname.startsWith("/dashboard/admin")
    ? "admin"
    : pathname.startsWith("/dashboard/company")
      ? "company"
      : pathname.startsWith("/dashboard/candidate")
        ? "candidate"
        : role;

  const items = navigation[activeRole];

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className="hidden md:flex border-none"
    >
      <SidebarHeader className="h-20 px-6 flex items-center justify-center border-none group-data-[collapsible=icon]:px-2">
        <div className="flex w-full items-center gap-2 transition-all duration-300 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-foreground shadow-md transition-all duration-300 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="text-[20px] font-semibold text-foreground tracking-[-0.04em] group-data-[collapsible=icon]:hidden">
            K&apos;anPro
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2 group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="group-data-[collapsible=icon]:p-0">
          <SidebarGroupLabel className="text-[12px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/60 mb-4 px-2 group-data-[collapsible=icon]:hidden">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (pathname.startsWith(item.url) &&
                    ![
                      "/dashboard/company",
                      "/dashboard/admin",
                      "/dashboard/candidate",
                    ].includes(item.url));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-11 rounded-[14px] px-3.5 gap-3.5 hover:bg-muted/60 text-muted-foreground hover:text-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm transition-all duration-300 group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:mx-auto! group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:gap-0! group-data-[collapsible=icon]:px-0!"
                    >
                      <Link
                        href={item.url}
                        className="flex w-full items-center gap-3.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                      >
                        <item.icon
                          className={`size-4 shrink-0 transition-colors ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                        />
                        <span
                          className={`text-[14px] tracking-tight group-data-[collapsible=icon]:hidden ${isActive ? "font-semibold" : "font-medium"}`}
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

      <SidebarRail />
    </Sidebar>
  );
}
