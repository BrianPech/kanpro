"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/modules/notifications/components/notification-bell";
import { CompanyTopbarUser } from "./company-topbar-user";
import type { UserCompanyItem } from "@/modules/company/services/company-tenant.service";

const companyRouteNames: Record<string, string> = {
  "/dashboard/company": "Inicio",
  "/dashboard/company/employees": "Plantilla",
  "/dashboard/company/attendance": "Asistencia",
  "/dashboard/company/leaves": "Permisos y vacaciones",
  "/dashboard/company/incidents": "Incidencias",
  "/dashboard/company/contracts": "Contratos",
  "/dashboard/company/payroll": "Nómina",
  "/dashboard/company/vacancies": "Vacantes",
  "/dashboard/company/vacancies/new": "Nueva vacante",
  "/dashboard/company/applications": "Postulaciones",
  "/dashboard/company/radar": "Radar de talento",
  "/dashboard/company/areas": "Áreas",
  "/dashboard/company/evaluations": "Evaluaciones",
  "/dashboard/company/reports": "Reportes",
  "/dashboard/company/settings": "Configuración",
  "/dashboard/company/profile": "Perfil de empresa",
  "/dashboard/company/verification": "Verificación",
};

export function DashboardTopbar({
  userName,
  userInitials,
}: {
  userName?: string;
  userInitials?: string;
  plan?: string;
  role?: "company" | "candidate" | "admin";
  companies?: UserCompanyItem[];
  activeCompanyId?: string;
}) {
  const pathname = usePathname();
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    void loadUser();
  }, []);

  const currentTitle =
    companyRouteNames[pathname] ||
    (pathname.includes("/vacancies/") ? "Detalle de vacante" : "Inicio");

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 bg-sidebar px-4 md:px-8">
      {/* Ruta actual + trigger móvil */}
      <div className="flex items-center gap-2.5 min-w-0">
        <SidebarTrigger className="md:hidden -ml-1 size-9 hover:bg-background/60 shrink-0" />
        <nav
          aria-label="Ruta actual"
          className="flex items-center gap-2.5 text-[14px] leading-[19px] min-w-0"
        >
          <Link
            href="/dashboard/company"
            className="font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Empresas
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

        <CompanyTopbarUser
          initialName={userName}
          initialInitials={userInitials}
          showName
        />
      </div>
    </header>
  );
}

export { DashboardTopbar as CompanyTopbar };
