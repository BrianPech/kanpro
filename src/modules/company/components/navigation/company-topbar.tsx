"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Plus,
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

const companyRouteNames: Record<string, string> = {
  "/dashboard/company": "Dashboard",
  "/dashboard/company/vacancies": "Mis Vacantes",
  "/dashboard/company/vacancies/new": "Publicar Oferta",
  "/dashboard/company/applications": "Postulantes",
  "/dashboard/company/employees": "Colaboradores",
  "/dashboard/company/profile": "Perfil Corporativo",
  "/dashboard/company/verification": "Verificación de Empresa",
  "/dashboard/company/settings": "Configuración",
  "/dashboard/company/radar": "Radar de Talento",
};

export function DashboardTopbar({
  userName: _userName,
  userInitials: _userInitials,
  plan: _plan,
  role = "company",
}: {
  userName?: string;
  userInitials?: string;
  plan?: string;
  role?: "company" | "candidate" | "admin";
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

  const currentTitle = companyRouteNames[pathname] || (pathname.includes("/vacancies/") ? "Detalle de Vacante" : "Portal Empresa");
  const isRoot = pathname === "/dashboard/company";

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
                  Portal Empresa
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href="/dashboard/company" />} className="text-xs text-muted-foreground font-medium">
                  Empresa
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
        {role === "company" && (
          <Button
            size="sm"
            render={<Link href="/dashboard/company/vacancies/new" />}
            className="font-semibold px-3 h-8 rounded-lg flex items-center gap-1.5 shadow-xs text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Nueva Vacante</span>
          </Button>
        )}

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

export { DashboardTopbar as CompanyTopbar };
