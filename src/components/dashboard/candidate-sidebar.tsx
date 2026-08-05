"use client";

import * as React from "react";
import {
  User,
  LayoutDashboard,
  Kanban,
  Compass,
  FileText,
  ShieldCheck,
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

export function CandidateSidebar() {
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
      title: "Mi Perfil", 
      url: "/dashboard/candidate/profile", 
      icon: User 
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
          <SidebarGroupLabel className="text-[12px] uppercase tracking-[0.18em] font-bold text-zinc-400 dark:text-zinc-500 mb-4 px-2">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (pathname.startsWith(item.url) &&
                    !["/dashboard/candidate"].includes(item.url));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`h-12 sm:h-13 rounded-[16px] px-4 gap-4 transition-all duration-200 ${
                        isActive
                          ? "!bg-[#1f2732] dark:!bg-zinc-100 !text-white dark:!text-zinc-900 font-bold shadow-sm hover:!bg-[#253240] dark:hover:!bg-zinc-200"
                          : "!text-[#5c7c9b] dark:!text-zinc-400 hover:!bg-[#ebeef3] dark:hover:!bg-zinc-900/80 hover:!text-[#1f2732] dark:hover:!text-zinc-100 font-semibold"
                      }`}
                    >
                      <Link
                        href={item.url}
                        className="flex w-full items-center gap-4"
                      >
                        <item.icon
                          className={`size-[22px] shrink-0 transition-colors ${
                            isActive
                              ? "!text-white dark:!text-zinc-900"
                              : "!text-[#5c7c9b] dark:!text-zinc-400 group-hover/menu-button:!text-[#1f2732] dark:group-hover/menu-button:!text-zinc-100"
                          }`}
                        />
                        <span
                          className={`text-[15px] sm:text-[16px] tracking-tight ${
                            isActive
                              ? "font-bold !text-white dark:!text-zinc-900"
                              : "font-semibold !text-[#5c7c9b] dark:!text-zinc-400 group-hover/menu-button:!text-[#1f2732] dark:group-hover/menu-button:!text-zinc-100"
                          }`}
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
