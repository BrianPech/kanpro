"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  ChevronRight,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
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
import { cn } from "@/lib/utils";

const candidateRouteNames: Record<string, string> = {
  "/dashboard/candidate": "Inicio",
  "/dashboard/candidate/discovery": "Buscar vacantes",
  "/dashboard/candidate/applications": "Postulaciones",
  "/dashboard/candidate/saved": "Guardados",
  "/dashboard/candidate/contracts": "Contratos",
  "/dashboard/candidate/leaves": "Permisos y vacaciones",
  "/dashboard/candidate/incidents": "Incidencias",
  "/dashboard/candidate/documents": "Documentos",
  "/dashboard/candidate/profile": "Mi perfil",
  "/dashboard/candidate/profile/edit": "Editar perfil",
  "/dashboard/candidate/profile/cv": "Mi CV digital",
  "/dashboard/candidate/profile/preferences": "Preferencias",
  "/dashboard/candidate/profile/saved": "Guardados",
  "/dashboard/candidate/settings": "Configuración",
  "/dashboard/candidate/notifications/preferences": "Notificaciones",
  "/dashboard/candidate/inbox": "Notificaciones",
};

export function CandidateTopbar({
  userName,
  userInitials,
  isEmployee = false,
}: {
  userName?: string;
  userInitials?: string;
  plan?: string;
  isEmployee?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string>("");
  const [userAvatar, setUserAvatar] = React.useState<string>("");

  React.useEffect(() => {
    const supabase = createClient();
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "");
        setUserAvatar(
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : ""
        );
      }
    }
    void loadUser();
  }, []);

  const isRoot = pathname === "/dashboard/candidate";
  const hideOnMobileHome = isRoot && !isEmployee;

  const currentTitle =
    candidateRouteNames[pathname] ||
    (pathname.includes("/vacancies/") ? "Detalle de vacante" : "Inicio");

  const displayName = userName || "Candidato";
  const initials =
    userInitials ||
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") ||
    "KP";

  const handleLogout = () => {
    window.location.href = "/auth/logout";
  };

  return (
    <header
      className={cn(
        "h-16 shrink-0 items-center justify-between gap-2 bg-sidebar px-4 md:px-8 select-none",
        hideOnMobileHome ? "hidden md:flex" : "flex"
      )}
    >
      {/* Ruta actual + trigger móvil (idéntico a CompanyTopbar) */}
      <div className="flex items-center gap-2.5 min-w-0">
        <SidebarTrigger className="md:hidden -ml-1 size-9 hover:bg-background/60 shrink-0" />
        <nav
          aria-label="Ruta actual"
          className="flex items-center gap-2.5 text-[14px] leading-[19px] min-w-0"
        >
          <Link
            href="/dashboard/candidate"
            className="font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            {isEmployee ? "Empleado" : "Candidato"}
          </Link>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">
            {currentTitle}
          </span>
        </nav>
      </div>

      {/* Controles globales: Notificaciones y Menú de cuenta (idéntico a CompanyTopbar) */}
      <div className="flex items-center gap-2 shrink-0">
        {userId ? (
          <NotificationBell userId={userId} />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notificaciones"
            onClick={() => router.push("/dashboard/candidate/inbox")}
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
                alt={displayName}
                className="rounded-[12px] object-cover"
              />
              <AvatarFallback className="rounded-[12px] bg-sidebar-accent text-link font-bold text-[15px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-[14px] font-medium leading-[19px] text-foreground whitespace-nowrap">
              {displayName}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            side="bottom"
            sideOffset={8}
            className="w-[280px] rounded-[16px] p-0 shadow-xl border border-border bg-card overflow-hidden z-50"
          >
            {/* Resumen del usuario */}
            <div className="px-[16px] py-[14px] border-b border-border flex items-center gap-[12px] text-left">
              <Avatar className="size-[40px] rounded-[8px] shrink-0 after:hidden">
                <AvatarImage
                  src={userAvatar}
                  alt={displayName}
                  className="rounded-[8px] object-cover"
                />
                <AvatarFallback className="rounded-[8px] bg-sidebar-accent text-link font-semibold text-[13px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <span className="truncate font-semibold text-[14px] leading-[20px] text-foreground block">
                  {displayName}
                </span>
                {userEmail && (
                  <span className="truncate text-[12px] leading-[16px] text-muted-foreground block font-normal">
                    {userEmail}
                  </span>
                )}
              </div>
            </div>

            <DropdownMenuGroup className="p-2">
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/candidate/profile")}
                className="min-h-[40px] rounded-[8px] px-3 text-[13.5px] font-medium cursor-pointer gap-2.5"
              >
                <UserIcon className="size-4 text-muted-foreground" />
                <span>Mi perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/candidate/saved")}
                className="min-h-[40px] rounded-[8px] px-3 text-[13.5px] font-medium cursor-pointer gap-2.5"
              >
                <Bookmark className="size-4 text-muted-foreground" />
                <span>Vacantes guardadas</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/candidate/settings")}
                className="min-h-[40px] rounded-[8px] px-3 text-[13.5px] font-medium cursor-pointer gap-2.5"
              >
                <SettingsIcon className="size-4 text-muted-foreground" />
                <span>Configuración</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <div className="border-t border-border p-2">
              <DropdownMenuItem
                onClick={handleLogout}
                className="min-h-[40px] rounded-[8px] px-3 text-[13.5px] font-medium text-destructive focus:text-destructive cursor-pointer gap-2.5"
              >
                <LogOutIcon className="size-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
