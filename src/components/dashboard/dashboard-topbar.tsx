"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Plus,
  Settings,
} from "lucide-react";
import * as React from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/modules/notifications/components/notification-bell";

type DashboardTopbarProps = {
  userName: string;
  userInitials: string;
  plan: string;
  role: "company" | "candidate" | "admin";
};

export function DashboardTopbar({
  userName,
  userInitials,
  plan,
  role,
}: DashboardTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    loadUser();
  }, [supabase]);

  const profileHref =
    role === "company"
      ? "/dashboard/company/profile"
      : role === "candidate"
        ? "/dashboard/candidate/profile"
        : "/dashboard/admin";

  const settingsHref =
    role === "company"
      ? "/dashboard/company/settings"
      : role === "candidate"
        ? "/dashboard/candidate/settings"
        : "/dashboard/admin/settings";

  const handleLogout = () => {
    window.location.href = "/auth/logout";
  };

  const firstName = userName ? userName.trim().split(" ")[0] : "Empresa";

  // Dynamic header resolution based on current active route
  const getHeaderInfo = () => {
    if (role === "company") {
      if (pathname === "/dashboard/company") {
        return {
          title: `Hola, ${firstName} 👋`,
          subtitle: "Aquí está el resumen de tus vacantes hoy",
        };
      }
      if (pathname?.includes("/vacancies/new")) {
        return {
          title: "Publicar Oferta Express",
          subtitle: "Crea una oferta de empleo para captar candidatos rápidamente.",
        };
      }
      if (pathname?.includes("/vacancies") && pathname?.includes("/edit")) {
        return {
          title: "Editar Vacante",
          subtitle: "Modifica los detalles y compensación de tu oferta de empleo.",
        };
      }
      if (pathname?.startsWith("/dashboard/company/vacancies")) {
        return {
          title: "Gestionar Vacantes",
          subtitle: "Controla las ofertas activas y marca las plazas cubiertas desde tu panel.",
        };
      }
      if (pathname?.startsWith("/dashboard/company/applications")) {
        return {
          title: "Bandeja de Postulantes",
          subtitle: "Revisa y gestiona los candidatos postulados a tus vacantes.",
        };
      }
      if (pathname?.startsWith("/dashboard/company/profile")) {
        return {
          title: "Perfil de Empresa",
          subtitle: "Completa la información de tu negocio para destacar ante los candidatos.",
        };
      }
      if (pathname?.startsWith("/dashboard/company/settings")) {
        return {
          title: "Ajustes Corporativos",
          subtitle: "Personaliza la apariencia, notificaciones y preferencias de tu cuenta.",
        };
      }
      if (pathname?.startsWith("/dashboard/company/radar")) {
        return {
          title: "Radar de Candidatos",
          subtitle: "Encuentra talento activo disponible en tu zona.",
        };
      }
      return {
        title: `Hola, ${firstName} 👋`,
        subtitle: "Panel de Empresa K'anPro",
      };
    }

    return {
      title: "Panel K'anPro",
      subtitle: "",
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <header className="hidden md:flex sticky top-0 z-40 h-20 shrink-0 items-center justify-between bg-background/80 backdrop-blur-md px-6 md:px-10 border-b border-border/10 transition-all duration-300">
      
      {/* Left Area: Dynamic Header Title & Subtitle */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 md:hidden" />
        
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[20px] font-[800] text-[#1f2732] dark:text-zinc-100 tracking-[-0.4px] leading-tight">
            {headerInfo.title}
          </h2>
          {headerInfo.subtitle && (
            <p className="text-[14px] font-medium text-[#5c7c9b] dark:text-zinc-400 mt-0.5">
              {headerInfo.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Area: Actions & Profile */}
      <div className="flex items-center gap-4">
        
        {role === "company" && (
          /* CTA + Nueva Vacante Button */
          <Link href="/dashboard/company/vacancies/new" className="shrink-0">
            <Button className="bg-[#1f2732] dark:bg-zinc-100 hover:bg-[#253240] dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold px-4 py-2.5 text-xs sm:text-sm rounded-[14px] h-10 flex items-center gap-2 border-none transition-all active:scale-[0.98] cursor-pointer shadow-xs">
              <Plus className="size-4.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Nueva Vacante</span>
            </Button>
          </Link>
        )}

        {/* Notifications Dropdown */}
        {userId ? (
          <NotificationBell userId={userId} />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="relative h-11 w-11 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-200"
          >
            <Bell className="h-6 w-6" />
          </Button>
        )}

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto rounded-full p-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2.5 border border-border/10 transition-all cursor-pointer"
            >
              <div className="hidden md:flex md:flex-col md:items-end pl-2.5 pr-1">
                <span className="text-[14px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {userName}
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
                  {plan}
                </span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-[14px] font-bold text-zinc-100 dark:text-zinc-900 border border-border/10 shrink-0 shadow-2xs">
                {userInitials}
              </div>
              <ChevronDown className="mr-1 size-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-xl border border-border/20 shadow-lg p-1.5"
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="px-3 py-2">
              <div className="grid gap-0.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                  {userName}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                  {plan}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 border-t border-border/10" />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="rounded-lg px-3 py-2 cursor-pointer flex items-center gap-2 text-xs font-semibold">
                <Link href={profileHref}>
                  <User className="h-4 w-4" />
                  <span>Mi perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg px-3 py-2 cursor-pointer flex items-center gap-2 text-xs font-semibold">
                <Link href={settingsHref}>
                  <Settings className="h-4 w-4" />
                  <span>Configuración & Ajustes</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1 border-t border-border/10" />
            <DropdownMenuItem 
              variant="destructive" 
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 cursor-pointer focus:bg-rose-50/80 dark:focus:bg-rose-950/20 focus:text-rose-600 dark:focus:text-rose-400 flex items-center gap-2 text-xs font-semibold"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}
