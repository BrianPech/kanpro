"use client"

import * as React from "react"
import { Briefcase, FileText, Settings, User, LayoutDashboard, CreditCard, Sparkles, LogOut, Shield, Users, Flag, Globe } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

type Role = "pro" | "company" | "candidate" | "admin"

export function AppSidebar({ role = "pro" }: { role?: Role }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error logging out:", error)
    } else {
      router.push("/login")
      router.refresh()
    }
  }

  // Navigation Items by Role
  const navigation = {
    admin: [
      { title: "Dashboard", url: "/dashboard/admin", icon: LayoutDashboard },
      { title: "Usuarios", url: "/dashboard/admin/users", icon: Users },
      { title: "Moderación", url: "/dashboard/admin/content", icon: Flag },
      { title: "Configuración", url: "/dashboard/admin/settings", icon: Globe },
    ],
    pro: [
      { title: "Dashboard", url: "/dashboard/pro", icon: LayoutDashboard },
      { title: "Mis Servicios", url: "/dashboard/pro/services", icon: Briefcase },
      { title: "Propuestas", url: "/dashboard/pro/proposals", icon: FileText },
      { title: "Ingresos", url: "/dashboard/pro/earnings", icon: CreditCard },
      { title: "Perfil Público", url: "/dashboard/pro/profile", icon: User },
    ],
    company: [
      { title: "Dashboard", url: "/dashboard/company", icon: LayoutDashboard },
      { title: "Talento", url: "/dashboard/company/talent", icon: User },
      { title: "Proyectos", url: "/dashboard/company/projects", icon: Briefcase },
      { title: "Perfil Empresa", url: "/dashboard/company/profile", icon: User },
    ],
    candidate: [
      { title: "Dashboard", url: "/dashboard/candidate", icon: LayoutDashboard },
      { title: "Ofertas", url: "/dashboard/candidate/jobs", icon: Briefcase },
      { title: "Mi CV", url: "/dashboard/candidate/resume", icon: FileText },
    ]
  }
  const activeRole = pathname.startsWith("/dashboard/admin")
    ? "admin"
    : pathname.startsWith("/dashboard/company") 
      ? "company" 
      : pathname.startsWith("/dashboard/candidate") 
        ? "candidate" 
        : "pro"

  const items = navigation[activeRole]

  return (
    <Sidebar variant="floating" className="hidden md:flex border-none">
      <SidebarHeader className="h-20 px-6 flex items-center justify-center border-none">
        <div className="w-full flex items-center gap-2">
          <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center shadow-md">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="text-[20px] font-semibold text-foreground tracking-[-0.04em]">
            K'anPro
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
              {items.map((item) => {
                const isActive = pathname.startsWith(item.url) && item.url !== "/dashboard/pro" || pathname === item.url
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className="h-[44px] rounded-[14px] px-3.5 hover:bg-muted/60 text-muted-foreground hover:text-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm transition-all duration-300 group"
                    >
                      <Link href={item.url} className="flex items-center gap-3.5 w-full">
                        <item.icon className={`h-[18px] w-[18px] transition-colors ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                        <span className={`text-[14px] tracking-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="h-[44px] rounded-[14px] px-3.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-300 group w-full justify-start"
            >
              <LogOut className="h-[18px] w-[18px] text-muted-foreground group-hover:text-destructive transition-colors" />
              <span className="text-[14px] font-medium tracking-tight">
                Cerrar Sesión
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
