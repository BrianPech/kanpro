"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Sparkles,
} from "lucide-react";
import * as React from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
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
  "/dashboard/candidate": "Dashboard",
  "/dashboard/candidate/discovery": "Explorar Empleos",
  "/dashboard/candidate/applications": "Mis Postulaciones",
  "/dashboard/candidate/documents": "Mis Documentos",
  "/dashboard/candidate/profile": "Mi Perfil Profesional",
  "/dashboard/candidate/profile/edit": "Editar Perfil",
  "/dashboard/candidate/profile/cv": "Mi CV Digital",
  "/dashboard/candidate/profile/preferences": "Preferencias de Empleo",
  "/dashboard/candidate/profile/saved": "Guardados",
  "/dashboard/candidate/saved": "Vacantes Guardadas",
  "/dashboard/candidate/settings": "Ajustes de Cuenta",
  "/dashboard/candidate/notifications/preferences": "Notificaciones",
};

export function CandidateTopbar({
  userName: _userName,
  userInitials: _userInitials,
  plan: _plan,
}: {
  userName?: string;
  userInitials?: string;
  plan?: string;
}) {
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

  const currentTitle = routeNames[pathname] || "Portal Candidato";
  const isRoot = pathname === "/dashboard/candidate";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/15 bg-background/90 backdrop-blur-md px-4 md:px-6 transition-all">
      {/* Left Area: Sidebar Trigger & Breadcrumbs */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 h-8 w-8 rounded-lg hover:bg-muted" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              {isRoot ? (
                <BreadcrumbPage className="font-semibold text-sm text-foreground">
                  Portal Candidato
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href="/dashboard/candidate" />} className="text-xs text-muted-foreground font-medium">
                  Candidato
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isRoot && (
              <>
                <BreadcrumbSeparator className="hidden md:block text-muted-foreground/40" />
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

      {/* Right Area: Action & Notifications */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/candidate/discovery" />}
          className="hidden sm:flex items-center gap-1.5 h-8 text-xs font-semibold rounded-lg border-primary/30 text-primary hover:bg-primary/10"
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
      </div>
    </header>
  );
}
