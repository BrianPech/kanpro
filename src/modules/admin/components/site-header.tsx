"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeNames: Record<string, string> = {
  "/dashboard/admin": "Dashboard",
  "/dashboard/admin/verifications": "Verificación de Expedientes",
  "/dashboard/admin/reports": "Moderación y Reportes",
  "/dashboard/admin/support": "Soporte Técnico",
  "/dashboard/admin/users": "Usuarios Registrados",
  "/dashboard/admin/staff": "Administradores y Personal",
  "/dashboard/admin/staff/new": "Nuevo Administrador",
  "/dashboard/admin/settings": "Configuración del Sistema",
  "/dashboard/admin/sla": "Monitor de SLAs",
};

export function SiteHeader() {
  const pathname = usePathname();
  const currentTitle = routeNames[pathname] || "Panel Central";
  const isRoot = pathname === "/dashboard/admin";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/15 bg-background/90 backdrop-blur-md px-4 md:px-6 transition-all">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 h-8 w-8 rounded-lg hover:bg-muted" />
        <Separator
          orientation="vertical"
          className="mx-1 h-5 data-[orientation=vertical]:h-5"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {isRoot ? (
                <BreadcrumbPage className="font-bold text-sm text-foreground">
                  Admin Dashboard
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href="/dashboard/admin" />} className="text-xs text-muted-foreground font-medium">
                  Admin
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isRoot && (
              <>
                <BreadcrumbSeparator className="text-muted-foreground/40" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-bold text-sm text-foreground">
                    {currentTitle}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
