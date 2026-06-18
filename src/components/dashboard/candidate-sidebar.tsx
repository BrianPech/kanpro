"use client";

import * as React from "react";
import {
  Settings,
  LayoutDashboard,
  Sparkles,
  Compass,
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
      title: "Configuración", 
      url: "/dashboard/candidate/settings", 
      icon: Settings 
    },
  ];

  return (
    <Sidebar
      variant="inset"
      collapsible="none"
      className="hidden md:flex border-none peer"
      data-variant="inset"
      data-state="expanded"
    >
      <SidebarHeader className="h-20 px-6 flex items-center justify-center border-none">
        <div className="flex w-full items-center gap-2 transition-all duration-300">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-foreground shadow-md transition-all duration-300">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="text-[20px] font-semibold text-foreground tracking-[-0.04em]">
            K&apos;anPro
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[12px] uppercase tracking-[0.2em] font-semibold text-muted-foreground/60 mb-4 px-2">
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
                      className="h-11 rounded-[14px] px-3.5 gap-3.5 hover:bg-muted/60 text-muted-foreground hover:text-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm transition-all duration-300"
                    >
                      <Link
                        href={item.url}
                        className="flex w-full items-center gap-3.5"
                      >
                        <item.icon
                          className={`size-4 shrink-0 transition-colors ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                        />
                        <span
                          className={`text-[14px] tracking-tight ${isActive ? "font-semibold" : "font-medium"}`}
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
