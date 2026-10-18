"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  UserPlus,
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
import { CompanyTopbarUser } from "./company-topbar-user";

const companyRouteNames: Record<string, string> = {
  "/dashboard/company": "Dashboard",
  "/dashboard/company/attendance": "Asistencia y Checador",
  "/dashboard/company/incidents": "Incidencias Laborales",
  "/dashboard/company/contracts": "Contratos y Vencimientos",
  "/dashboard/company/leaves": "Vacaciones y Permisos",
  "/dashboard/company/evaluations": "Evaluaciones 360",
  "/dashboard/company/payroll": "Nómina y Dispersión",
  "/dashboard/company/reports": "Centro de Reportes",
  "/dashboard/company/vacancies": "Mis Vacantes",
  "/dashboard/company/vacancies/new": "Publicar Oferta",
  "/dashboard/company/applications": "Postulantes",
  "/dashboard/company/employees": "Empleados",
  "/dashboard/company/profile": "Perfil Corporativo",
  "/dashboard/company/verification": "Verificación de Empresa",
  "/dashboard/company/settings": "Configuración",
  "/dashboard/company/radar": "Radar de Talento",
};

export function DashboardTopbar({
  userName,
  userInitials,
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
  const isEmployeesPage = pathname === "/dashboard/company/employees";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/15 bg-background/90 backdrop-blur-md px-4 md:px-6 transition-all">
      {/* Left Area: Sidebar Trigger & Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger className="-ml-1 h-8 w-8 rounded-lg hover:bg-muted hidden md:flex shrink-0" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto hidden md:block shrink-0"
        />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="min-w-0 flex-nowrap">
            {isRoot ? (
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="font-bold text-sm sm:text-base text-foreground truncate">
                  Portal Empresa
                </BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem className="hidden md:block shrink-0">
                  <BreadcrumbLink render={<Link href="/dashboard/company" />} className="text-xs text-muted-foreground font-medium">
                    Empresa
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block text-muted-foreground/40 shrink-0" />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="font-bold text-sm sm:text-base text-foreground truncate">
                    {currentTitle}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right Area: Action, Notifications & Mobile User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {role === "company" && isEmployeesPage && (
          <Button
            size="sm"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-register-employee-modal"));
            }}
            className="font-semibold px-2.5 sm:px-3 h-8 rounded-lg flex items-center gap-1.5 shadow-xs text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            data-testid="register-employee-btn"
          >
            <UserPlus className="size-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Registrar Empleado</span>
            <span className="sm:hidden">Registrar</span>
          </Button>
        )}

        {userId ? (
          <NotificationBell userId={userId} />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
          >
            <Bell className="size-4" />
          </Button>
        )}

        {/* Avatar y Dropdown de Usuario visible en vista móvil */}
        <div className="flex md:hidden items-center ml-0.5">
          <CompanyTopbarUser
            initialName={userName}
            initialInitials={userInitials}
          />
        </div>
      </div>
    </header>
  );
}

export { DashboardTopbar as CompanyTopbar };
