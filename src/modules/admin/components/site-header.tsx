"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  LogOutIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/modules/notifications/components/notification-bell";

const ADMIN_ROUTE_NAMES: Record<string, string> = {
  "/dashboard/admin": "Dashboard Central",
  "/dashboard/admin/verifications": "Verificación de expedientes",
  "/dashboard/admin/reports": "Moderación y reportes",
  "/dashboard/admin/support": "Soporte y tickets",
  "/dashboard/admin/users": "Usuarios",
  "/dashboard/admin/staff": "Administradores y staff",
  "/dashboard/admin/staff/new": "Nuevo administrador",
  "/dashboard/admin/settings": "Configuración",
};

function getAdminRouteTitle(pathname: string): string {
  if (ADMIN_ROUTE_NAMES[pathname]) {
    return ADMIN_ROUTE_NAMES[pathname];
  }
  if (pathname.startsWith("/dashboard/admin/verifications/")) {
    return "Detalle de verificación";
  }
  if (pathname.startsWith("/dashboard/admin/support/tickets/")) {
    return "Detalle de ticket";
  }
  if (pathname.startsWith("/dashboard/admin/companies/")) {
    return "Detalle de empresa";
  }
  return "Dashboard Central";
}

export interface SiteHeaderProps {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  userInitials?: string;
}

export function SiteHeader({
  userId,
  userName = "Administrador",
  userEmail = "",
  userAvatar = "",
  userInitials = "AD",
}: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const currentTitle = getAdminRouteTitle(pathname);

  const handleLogout = () => {
    window.location.href = "/auth/logout";
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 bg-sidebar px-4 md:px-8 select-none">
      {/* Ruta actual + trigger móvil */}
      <div className="flex items-center gap-2.5 min-w-0">
        <SidebarTrigger className="md:hidden -ml-1 size-9 hover:bg-background/60 shrink-0" />
        <nav
          aria-label="Ruta actual"
          className="flex items-center gap-2.5 text-[14px] leading-[19px] min-w-0"
        >
          <Link
            href="/dashboard/admin"
            className="font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Administración
          </Link>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">
            {currentTitle}
          </span>
        </nav>
      </div>

      {/* Controles globales: Notificaciones y Menú de cuenta */}
      <div className="flex items-center gap-2 shrink-0">
        {userId ? (
          <NotificationBell userId={userId} />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notificaciones"
            className="relative size-[44px] rounded-[8px] text-foreground hover:bg-background/60 cursor-pointer"
          >
            <Bell className="size-5" />
          </Button>
        )}

        <div className="h-6 w-px bg-border mx-1" aria-hidden="true" />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2 rounded-[12px] pr-2 hover:bg-background/60 transition-colors cursor-pointer shrink-0 select-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label="Abrir menú de usuario"
              />
            }
          >
            <Avatar className="size-[44px] rounded-[12px] shrink-0 after:hidden">
              <AvatarImage
                src={userAvatar}
                alt={userName}
                className="rounded-[12px] object-cover"
              />
              <AvatarFallback className="rounded-[12px] bg-sidebar-accent text-link font-bold text-[15px]">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-[14px] font-medium leading-[19px] text-foreground whitespace-nowrap">
              {userName}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            side="bottom"
            sideOffset={8}
            className="w-[280px] rounded-[16px] p-0 shadow-xl border border-border bg-card overflow-hidden z-50"
          >
            {/* Resumen del administrador */}
            <div className="px-[16px] py-[14px] border-b border-border flex items-center gap-[12px] text-left">
              <Avatar className="size-[40px] rounded-[8px] shrink-0 after:hidden">
                <AvatarImage
                  src={userAvatar}
                  alt={userName}
                  className="rounded-[8px] object-cover"
                />
                <AvatarFallback className="rounded-[8px] bg-sidebar-accent text-link font-semibold text-[13px]">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <span className="truncate font-semibold text-[14px] leading-[20px] text-foreground block">
                  {userName}
                </span>
                {userEmail && (
                  <span className="truncate text-[12px] leading-[16px] text-muted-foreground block font-normal">
                    {userEmail}
                  </span>
                )}
              </div>
            </div>

            {/* Accesos rápidos */}
            <DropdownMenuGroup className="p-[8px] flex flex-col gap-[2px]">
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/admin/staff")}
                className="h-[40px] px-[10px] rounded-[8px] flex items-center gap-[10px] text-[14px] font-medium leading-[20px] text-foreground hover:bg-muted/60 focus:bg-muted/60 cursor-pointer outline-none select-none"
              >
                <ShieldCheckIcon className="size-[16px] text-muted-foreground shrink-0" />
                <span className="truncate">Administradores y staff</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/dashboard/admin/settings")}
                className="h-[40px] px-[10px] rounded-[8px] flex items-center gap-[10px] text-[14px] font-medium leading-[20px] text-foreground hover:bg-muted/60 focus:bg-muted/60 cursor-pointer outline-none select-none"
              >
                <SettingsIcon className="size-[16px] text-muted-foreground shrink-0" />
                <span className="truncate">Configuración del sistema</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {/* Cerrar sesión */}
            <div className="border-t border-border p-[8px]">
              <DropdownMenuItem
                onClick={handleLogout}
                className="h-[40px] px-[10px] rounded-[8px] flex items-center gap-[10px] text-[14px] font-medium leading-[20px] text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer outline-none select-none"
              >
                <LogOutIcon className="size-[16px] shrink-0" />
                <span className="truncate">Cerrar sesión</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
