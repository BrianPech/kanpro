"use client";

import * as React from "react";

import { NavDocuments } from "@/modules/admin/components/nav-documents";
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
  ChartBarIcon,
  FolderIcon,
  ListIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  CommandIcon,
  ShieldCheckIcon,
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
      title: "Usuarios Registrados",
      url: "/dashboard/admin/users",
      icon: <UsersIcon />,
    },
    {
      title: "Administradores y Personal",
      url: "/dashboard/admin/staff",
      icon: <ShieldCheckIcon />,
    },
    {
      title: "Analytics",
      url: "#",
      icon: <ChartBarIcon />,
    },
    {
      title: "Proyectos",
      url: "#",
      icon: <FolderIcon />,
    },
    {
      title: "Ciclo de Vida",
      url: "#",
      icon: <ListIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "#",
      icon: <SearchIcon />,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: <DatabaseIcon />,
    },
    {
      name: "Reports",
      url: "#",
      icon: <FileChartColumnIcon />,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: <FileIcon />,
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
                  K'anPro
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
