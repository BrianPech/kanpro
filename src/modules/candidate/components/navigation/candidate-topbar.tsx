"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Sparkles,
} from "@/components/ui/icons";
import * as React from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NotificationBell } from "@/modules/notifications/components/notification-bell";

const routeNames: Record<string, string> = {
  "/dashboard/candidate": "Mi Portal",
  "/dashboard/candidate/discovery": "Explorar Empleos",
  "/dashboard/candidate/applications": "Mis Postulaciones",
  "/dashboard/candidate/documents": "Mis Documentos",
  "/dashboard/candidate/contracts": "Mis Contratos",
  "/dashboard/candidate/leaves": "Vacaciones & Permisos",
  "/dashboard/candidate/profile": "Mi Perfil Profesional",
  "/dashboard/candidate/profile/edit": "Editar Perfil",
  "/dashboard/candidate/profile/cv": "Mi CV Digital",
  "/dashboard/candidate/profile/preferences": "Preferencias de Empleo",
  "/dashboard/candidate/profile/saved": "Guardados",
  "/dashboard/candidate/saved": "Vacantes Guardadas",
  "/dashboard/candidate/settings": "Ajustes de Cuenta",
  "/dashboard/candidate/notifications/preferences": "Notificaciones",
  "/dashboard/candidate/inbox": "Bandeja de Entrada",
  "/dashboard/candidate/attendance": "Control de Asistencia",
};

export function CandidateTopbar({
  userName,
  userInitials,
  plan: _plan,
}: {
  userName?: string;
  userInitials?: string;
  plan?: string;
}) {
  const pathname = usePathname();
  const supabase = createClient();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [userAvatar, setUserAvatar] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserAvatar(user.user_metadata?.avatar_url || null);
      }
    }
    loadUser();
  }, [supabase]);

  const currentTitle = routeNames[pathname] || "Mi Portal";
  const isRoot = pathname === "/dashboard/candidate";

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-background/80 backdrop-blur-md px-4 md:px-6 transition-all select-none">
      {/* Left Area: Sidebar Trigger (hidden on mobile) & Title / Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Sidebar Trigger is strictly for desktop/tablet; hidden on mobile */}
        <SidebarTrigger className="-ml-1 h-8 w-8 rounded-lg hover:bg-muted hidden md:flex shrink-0" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto hidden md:block shrink-0"
        />

        {/* Mobile Title View: Brand Emblem + Current Section Title */}
        <div className="flex md:hidden items-center gap-2 min-w-0">
          <Link
            href="/dashboard/candidate"
            className="flex items-center gap-1.5 font-extrabold text-sm text-foreground tracking-tight shrink-0"
          >
            <span className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20">
              K
            </span>
            <span className="font-black text-foreground">K&apos;anPro</span>
          </Link>
          <span className="text-muted-foreground/40 text-xs shrink-0">•</span>
          <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">
            {currentTitle}
          </span>
        </div>

        {/* Desktop Breadcrumbs */}
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              {isRoot ? (
                <BreadcrumbPage className="font-semibold text-sm text-foreground">
                  Portal Candidato
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  render={<Link href="/dashboard/candidate" />}
                  className="text-xs text-muted-foreground font-medium"
                >
                  Candidato
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isRoot && (
              <>
                <BreadcrumbSeparator className="text-muted-foreground/40" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-sm text-foreground">
                    {currentTitle}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right Area: Action, Notifications & Profile Avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard/candidate/discovery" />}
          className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold rounded-4xl border-primary/30 text-primary hover:bg-primary/10"
        >
          <Sparkles className="size-3.5" />
          <span>Ver Vacantes</span>
        </Button>

        {userId ? (
          <NotificationBell userId={userId} />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <Bell className="size-4" />
          </Button>
        )}

        {/* Profile Button next to Notifications */}
        <Link
          href="/dashboard/candidate/profile"
          aria-label="Ir a mi perfil"
          className="flex items-center justify-center size-8.5 rounded-full ring-1 ring-border/80 hover:ring-primary/60 transition-all active:scale-95 cursor-pointer ml-0.5"
        >
          <Avatar className="size-8 rounded-full border border-border/80">
            {userAvatar && (
              <AvatarImage src={userAvatar} alt={userName || "Perfil"} />
            )}
            <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
              {userInitials || "CP"}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
