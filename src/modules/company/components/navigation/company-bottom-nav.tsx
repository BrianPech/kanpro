"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CompanyBottomNavDrawer } from "./company-bottom-nav-drawer";
import { CompanySettingsModal } from "../company-settings-dialog";

export function CompanyBottomNav() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const isHomeActive = pathname === "/dashboard/company";
  const isVacanciesActive = pathname.startsWith("/dashboard/company/vacancies");
  const isApplicantsActive = pathname.startsWith("/dashboard/company/applications");
  const isAttendanceActive = pathname.startsWith("/dashboard/company/attendance");

  // Si el usuario está en otra ruta secundaria del portal de empresa (ej. empleados, nómina, contratos, reportes, perfil, configuración)
  const isOtherRouteActive =
    pathname.startsWith("/dashboard/company") &&
    !isHomeActive &&
    !isVacanciesActive &&
    !isApplicantsActive &&
    !isAttendanceActive;

  const navItems = [
    {
      id: "home",
      label: "Inicio",
      href: "/dashboard/company",
      isActive: isHomeActive,
      iconFilled: (
        <svg viewBox="0 0 24 24" className="size-[22px] sm:size-[24px] fill-current" aria-hidden="true">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      ),
      iconOutline: (
        <svg viewBox="0 0 24 24" className="size-[22px] sm:size-[24px] fill-none stroke-current stroke-[2]" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
        </svg>
      ),
    },
    {
      id: "vacancies",
      label: "Vacantes",
      href: "/dashboard/company/vacancies",
      isActive: isVacanciesActive,
      iconFilled: (
        <svg viewBox="0 0 24 24" className="size-[22px] sm:size-[24px] fill-current" aria-hidden="true">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
        </svg>
      ),
      iconOutline: (
        <svg viewBox="0 0 24 24" className="size-[22px] sm:size-[24px] fill-none stroke-current stroke-[2]" aria-hidden="true">
          <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      ),
    },
    {
      id: "applicants",
      label: "Postulantes",
      href: "/dashboard/company/applications",
      isActive: isApplicantsActive,
      iconFilled: (
        <svg viewBox="0 0 24 24" className="size-[22px] sm:size-[24px] fill-current" aria-hidden="true">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
      iconOutline: (
        <svg viewBox="0 0 24 24" className="size-[22px] sm:size-[24px] fill-none stroke-current stroke-[2]" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-3-3.87" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-2a4 4 0 0 0-4-4H3" />
          <circle cx="9" cy="7" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <circle cx="17" cy="7" r="3" />
        </svg>
      ),
    },
    {
      id: "attendance",
      label: "Asistencia",
      href: "/dashboard/company/attendance",
      isActive: isAttendanceActive,
      iconFilled: (
        <svg viewBox="0 0 24 24" className="size-[22px] sm:size-[24px] fill-current" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 13H11V7h1.5v5.25l4.5 2.67-.75 1.23-3.75-2.15z" />
        </svg>
      ),
      iconOutline: (
        <svg viewBox="0 0 24 24" className="size-[22px] sm:size-[24px] fill-none stroke-current stroke-[2]" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  const isMenuSelected = isDrawerOpen || isOtherRouteActive;

  return (
    <>
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 w-full border-t border-border/80 bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
        <TooltipProvider delay={100}>
          <nav
            aria-label="Navegación principal móvil de la empresa"
            className="h-14 max-w-lg mx-auto px-4 flex items-center justify-around select-none"
          >
            {/* 4 Accesos directos principales */}
            {navItems.map((item) => {
              const isSelected = item.isActive;

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger
                    render={
                      <Link
                        href={item.href}
                        aria-current={isSelected ? "page" : undefined}
                        aria-label={item.label}
                        className={cn(
                          "size-11 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90 cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        )}
                      />
                    }
                  >
                    <div className="flex items-center justify-center shrink-0">
                      {isSelected ? item.iconFilled : item.iconOutline}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* 5to Botón: Menú / Módulos (Abre el Bottom Sheet Drawer) */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    aria-label="Abrir panel de módulos y herramientas de la empresa"
                    aria-expanded={isDrawerOpen}
                    className={cn(
                      "size-11 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-90 cursor-pointer",
                      isMenuSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  />
                }
              >
                <div className="flex items-center justify-center shrink-0">
                  {isMenuSelected ? (
                    <svg viewBox="0 0 24 24" className="size-[22px] sm:size-[24px] fill-current" aria-hidden="true">
                      <rect x="3" y="3" width="7" height="7" rx="2" />
                      <rect x="14" y="3" width="7" height="7" rx="2" />
                      <rect x="14" y="14" width="7" height="7" rx="2" />
                      <rect x="3" y="14" width="7" height="7" rx="2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="size-[22px] sm:size-[24px] fill-none stroke-current stroke-[2]" aria-hidden="true">
                      <rect x="3" y="3" width="7" height="7" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="14" y="3" width="7" height="7" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="14" y="14" width="7" height="7" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="3" y="14" width="7" height="7" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                Módulos & Más
              </TooltipContent>
            </Tooltip>
          </nav>
        </TooltipProvider>
      </div>

      {/* Bottom Sheet Drawer para los módulos y herramientas extra */}
      <CompanyBottomNavDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Modal de Configuración desacoplado para evitar conflictos de montaje */}
      <CompanySettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </>
  );
}
