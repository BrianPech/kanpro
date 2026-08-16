"use client";

import * as React from "react";
import Link from "next/link";

import { NavMain } from "@/modules/admin/components/nav-main";
import { NavSecondary } from "@/modules/admin/components/nav-secondary";
import { NavUser } from "@/modules/admin/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  UsersIcon,
  Settings2Icon,
  BookOpenIcon,
  KanbanIcon,
  BadgeCheckIcon,
  ShieldCheckIcon,
  HeadphonesIcon,
  ShieldAlertIcon,
  SearchIcon,
} from "lucide-react";

const data = {
  user: {
    name: "Administrador",
    email: "admin@kanpro.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard/admin",
      icon: <LayoutDashboardIcon className="size-4" />,
    },
    {
      title: "Verificación de Expedientes",
      url: "/dashboard/admin/verifications",
      icon: <BadgeCheckIcon className="size-4 text-purple-500" />,
    },
    {
      title: "Moderación y Reportes",
      url: "/dashboard/admin/reports",
      icon: <ShieldAlertIcon className="size-4 text-rose-500" />,
    },
    {
      title: "Soporte Técnico",
      url: "/dashboard/admin/support",
      icon: <HeadphonesIcon className="size-4 text-blue-500" />,
    },
    {
      title: "Usuarios Registrados",
      url: "/dashboard/admin/users",
      icon: <UsersIcon className="size-4" />,
    },
    {
      title: "Administradores y Personal",
      url: "/dashboard/admin/staff",
      icon: <ShieldCheckIcon className="size-4 text-emerald-500" />,
    },
  ],
  navSecondary: [
    {
      title: "Buscar",
      url: "#",
      icon: <SearchIcon className="size-4" />,
    },
    {
      title: "Configuración",
      url: "#",
      icon: <Settings2Icon className="size-4" />,
    },
    {
      title: "Manual de Usuario",
      url: "/docs/manual-usuario",
      icon: <BookOpenIcon className="size-4" />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="border-b border-border/10 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard/admin" />}
              className="hover:bg-sidebar-accent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <KanbanIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-tight">K’anPro Admin</span>
                <span className="truncate text-xs text-muted-foreground font-medium">Panel Central</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t border-border/10">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
