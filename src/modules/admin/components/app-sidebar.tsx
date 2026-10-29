"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  BadgeCheck,
  ShieldAlert,
  Headphones,
  Users,
  UserCog,
  Settings,
  BookOpen,
  KanproIsotype,
  FileText,
  Activity,
  PlusCircle,
  HelpCircle,
} from "@/components/ui/icons";
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
import { cn } from "@/lib/utils";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const sections = [
    {
      label: "General",
      items: [
        {
          title: "Dashboard Central",
          url: "/dashboard/admin",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Operaciones & Moderación",
      items: [
        {
          title: "Verificación de Expedientes",
          url: "/dashboard/admin/verifications",
          icon: BadgeCheck,
        },
        {
          title: "Moderación y Reportes",
          url: "/dashboard/admin/reports",
          icon: ShieldAlert,
        },
        {
          title: "Soporte Técnico & Tickets",
          url: "/dashboard/admin/support",
          icon: Headphones,
        },
      ],
    },
    {
      label: "Comunidad & Accesos",
      items: [
        {
          title: "Directorio de Usuarios",
          url: "/dashboard/admin/users",
          icon: Users,
        },
        {
          title: "Administradores & Staff",
          url: "/dashboard/admin/staff",
          icon: ShieldCheck,
        },
      ],
    },
  ];

  const secondaryNav = [
    {
      title: "Configuración del Sistema",
      url: "/dashboard/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <Sidebar variant="inset" {...props}>
      {/* Header */}
      <SidebarHeader className="py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard/admin" />}
              className="hover:bg-sidebar-accent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <KanproIsotype className="size-4.5" variant="white" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-tight text-sidebar-foreground">
                  K&apos;anPro Admin
                </span>
                <span className="truncate text-xs text-muted-foreground font-medium">
                  Panel Central
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content Navigation Groups */}
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
                      !["/dashboard/admin"].includes(item.url));

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
        ))}

        {/* Secondary Navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 px-2">
            Administración
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

      {/* Footer */}
      <SidebarFooter className="p-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
