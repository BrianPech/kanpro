"use client";

import * as React from "react";

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
  CommandIcon,
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
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Verificación de Expedientes",
      url: "/dashboard/admin/verifications",
      icon: <BadgeCheckIcon />,
    },
    {
      title: "Moderación y Reportes",
      url: "/dashboard/admin/reports",
      icon: <ShieldAlertIcon />,
    },
    {
      title: "Soporte Técnico",
      url: "/dashboard/admin/support",
      icon: <HeadphonesIcon />,
    },
    {
      title: "Usuarios Registrados",
      url: "/dashboard/admin/users",
      icon: <UsersIcon />,
    },
    {
      title: "Administradores y Personal",
      url: "/dashboard/admin/staff",
      icon: <ShieldCheckIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Buscar",
      url: "#",
      icon: <SearchIcon />,
    },
    {
      title: "Configuración",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "Manual de Usuario",
      url: "/docs/manual-usuario",
      icon: <BookOpenIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard/admin">
                <CommandIcon className="size-5!" />
                <span className="text-base font-bold tracking-tight">
                  K’anPro
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

