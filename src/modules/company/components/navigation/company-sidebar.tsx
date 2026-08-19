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
import { NavUser } from "@/components/shared/nav-user";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function CompanySidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
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
          title: "Mis Vacantes",
          url: "/dashboard/company/vacancies",
          icon: Briefcase,
        },
        {
          title: "Postulantes",
          url: "/dashboard/company/applications",
          icon: Users,
        },
        {
          title: "Colaboradores",
          url: "/dashboard/company/employees",
          icon: UserCheck,
        },
      ],
    },
    {
      label: "Mi Empresa",
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
    },
    {
      title: "Soporte K'anPro",
      url: "#",
      icon: HelpCircle,
    },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard/company" />}
              className="hover:bg-sidebar-accent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="p-0 mb-3">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 px-2">
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
                        render={<Link href={item.url} />}
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "h-9 rounded-lg px-2.5 gap-2.5 text-sm font-medium transition-all",
                          isActive &&
                            "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
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
        ))}

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 px-2">
            Acciones Rápidas
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
                          "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
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

      <SidebarFooter className="p-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
