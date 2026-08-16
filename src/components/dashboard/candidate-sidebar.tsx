"use client";

import * as React from "react";
import {
  User,
  LayoutDashboard,
  Kanban,
  Compass,
  FileText,
  ShieldCheck,
  Settings,
  HelpCircle,
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
import { NavUser } from "@/components/nav-user";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function CandidateSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const navigation = [
    {
      title: "Dashboard",
      url: "/dashboard/candidate",
      icon: LayoutDashboard,
    },
    { 
      title: "Explorar Empleos", 
      url: "/dashboard/candidate/discovery", 
      icon: Compass 
    },
    {
      title: "Mis Postulaciones",
      url: "/dashboard/candidate/applications",
      icon: FileText,
    },
    {
      title: "Expediente Digital",
      url: "/dashboard/candidate/documents",
      icon: ShieldCheck,
    },
    { 
      title: "Mi Perfil Profesional", 
      url: "/dashboard/candidate/profile", 
      icon: User 
    },
  ];

  const secondaryNav = [
    {
      title: "Ajustes de Cuenta",
      url: "/dashboard/candidate/settings",
      icon: Settings,
    },
    {
      title: "Centro de Ayuda",
      url: "#",
      icon: HelpCircle,
    },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/60 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard/candidate" />}
              className="hover:bg-sidebar-accent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Kanban className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-tight text-sidebar-foreground">K&apos;anPro</span>
                <span className="truncate text-xs text-muted-foreground font-medium">Portal Candidato</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 px-2">
            Plataforma
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (pathname.startsWith(item.url) &&
                    !["/dashboard/candidate"].includes(item.url));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "h-9 rounded-lg px-2.5 gap-2.5 text-sm font-medium transition-all",
                        isActive &&
                          "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
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

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 px-2">
            Soporte y Ajustes
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {secondaryNav.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "h-9 rounded-lg px-2.5 gap-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all",
                        isActive &&
                          "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      )}
                    >
                      <item.icon className="size-3.5 shrink-0" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
