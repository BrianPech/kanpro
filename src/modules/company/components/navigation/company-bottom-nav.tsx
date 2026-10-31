"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "@/components/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getLockedModuleBadge } from "@/modules/company/config/demo-rollout";
import { CompanyBottomNavDrawer } from "./company-bottom-nav-drawer";
import { CompanyQuickActionsSheet } from "./company-quick-actions-sheet";
import { CompanySettingsModal } from "../company-settings-dialog";

export interface CompanyBottomNavProps {
  enabledModules?: string[];
}

export function CompanyBottomNav({ enabledModules }: CompanyBottomNavProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const isHomeActive = pathname === "/dashboard/company";
  const isEmployeesActive = pathname.startsWith("/dashboard/company/employees");
  const isAttendanceActive = pathname.startsWith("/dashboard/company/attendance");
  const attendanceLockBadge = getLockedModuleBadge(
    "/dashboard/company/attendance",
    enabledModules
  );

  // Si el usuario está en otra ruta secundaria del portal de empresa
  const isOtherRouteActive =
    pathname.startsWith("/dashboard/company") &&
    !isHomeActive &&
    !isEmployeesActive &&
    !isAttendanceActive;

  const isMenuSelected = isDrawerOpen || isOtherRouteActive;

  return (
    <>
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 w-full border-t border-border/80 bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
        <TooltipProvider delay={100}>
          <nav
            aria-label="Navegación principal móvil de la empresa"
            className="h-16 max-w-lg mx-auto px-3 flex items-center justify-around select-none"
          >
            {/* 1. Inicio */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href="/dashboard/company"
                    aria-current={isHomeActive ? "page" : undefined}
                    aria-label="Inicio"
                    className={cn(
                      "size-12 flex flex-col items-center justify-center rounded-2xl transition-all duration-150 active:scale-90 cursor-pointer gap-0.5",
                      isHomeActive
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  />
                }
              >
                <div className="flex items-center justify-center shrink-0">
                  {isHomeActive ? (
                    <svg viewBox="0 0 24 24" className="size-[22px] fill-current" aria-hidden="true">
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="size-[22px] fill-none stroke-current stroke-[2]" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
                    </svg>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-none">Inicio</span>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                Inicio
              </TooltipContent>
            </Tooltip>

            {/* 2. Plantilla */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href="/dashboard/company/employees"
                    aria-current={isEmployeesActive ? "page" : undefined}
                    aria-label="Plantilla de empleados"
                    className={cn(
                      "size-12 flex flex-col items-center justify-center rounded-2xl transition-all duration-150 active:scale-90 cursor-pointer gap-0.5",
                      isEmployeesActive
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  />
                }
              >
                <div className="flex items-center justify-center shrink-0">
                  {isEmployeesActive ? (
                    <svg viewBox="0 0 24 24" className="size-[22px] fill-current" aria-hidden="true">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="size-[22px] fill-none stroke-current stroke-[2]" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-3-3.87" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-2a4 4 0 0 0-4-4H3" />
                      <circle cx="9" cy="7" r="4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <circle cx="17" cy="7" r="3" />
                    </svg>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-none">Plantilla</span>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                Plantilla
              </TooltipContent>
            </Tooltip>

            {/* 3. BOTÓN CENTRAL ELEVADO RH (+) */}
            <div className="relative -top-3 flex flex-col items-center shrink-0">
              <button
                type="button"
                onClick={() => setIsQuickActionsOpen(true)}
                aria-label="Abrir acciones rápidas de Recursos Humanos"
                aria-expanded={isQuickActionsOpen}
                className={cn(
                  "size-13 rounded-full bg-gradient-to-tr from-primary to-primary/85 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-background transition-all duration-200 active:scale-90 hover:scale-105 cursor-pointer",
                  isQuickActionsOpen && "rotate-45"
                )}
              >
                <Plus className="size-6 stroke-[2.5]" />
              </button>
              <span className="text-[10px] font-extrabold text-primary mt-0.5 select-none tracking-tight">
                Acción RH
              </span>
            </div>

            {/* 4. Asistencia */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href={attendanceLockBadge ? "#" : "/dashboard/company/attendance"}
                    onClick={(e) => {
                      if (attendanceLockBadge) {
                        e.preventDefault();
                        toast.info(
                          `Asistencia & Checador se habilitará en la ${attendanceLockBadge} de la DEMO.`
                        );
                      }
                    }}
                    aria-current={isAttendanceActive ? "page" : undefined}
                    aria-label="Asistencia y checador"
                    className={cn(
                      "size-12 flex flex-col items-center justify-center rounded-2xl transition-all duration-150 active:scale-90 cursor-pointer gap-0.5",
                      attendanceLockBadge
                        ? "opacity-55 text-muted-foreground"
                        : isAttendanceActive
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  />
                }
              >
                <div className="flex items-center justify-center shrink-0">
                  {isAttendanceActive ? (
                    <svg viewBox="0 0 24 24" className="size-[22px] fill-current" aria-hidden="true">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 13H11V7h1.5v5.25l4.5 2.67-.75 1.23-3.75-2.15z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="size-[22px] fill-none stroke-current stroke-[2]" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-none">Asistencia</span>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                {attendanceLockBadge ? `Asistencia (${attendanceLockBadge})` : "Asistencia"}
              </TooltipContent>
            </Tooltip>

            {/* 5. Menú Módulos RH (Drawer) */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    aria-label="Abrir panel de módulos y herramientas de la empresa"
                    aria-expanded={isDrawerOpen}
                    className={cn(
                      "size-12 flex flex-col items-center justify-center rounded-2xl transition-all duration-150 active:scale-90 cursor-pointer gap-0.5",
                      isMenuSelected
                        ? "text-primary font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  />
                }
              >
                <div className="flex items-center justify-center shrink-0">
                  {isMenuSelected ? (
                    <svg viewBox="0 0 24 24" className="size-[22px] fill-current" aria-hidden="true">
                      <rect x="3" y="3" width="7" height="7" rx="2" />
                      <rect x="14" y="3" width="7" height="7" rx="2" />
                      <rect x="14" y="14" width="7" height="7" rx="2" />
                      <rect x="3" y="14" width="7" height="7" rx="2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="size-[22px] fill-none stroke-current stroke-[2]" aria-hidden="true">
                      <rect x="3" y="3" width="7" height="7" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="14" y="3" width="7" height="7" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="14" y="14" width="7" height="7" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="3" y="14" width="7" height="7" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-none">Más RH</span>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                Módulos & Más
              </TooltipContent>
            </Tooltip>
          </nav>
        </TooltipProvider>
      </div>

      {/* Action Sheet rápido para acciones frecuentes con el pulgar */}
      <CompanyQuickActionsSheet
        open={isQuickActionsOpen}
        onOpenChange={setIsQuickActionsOpen}
        enabledModules={enabledModules}
      />

      {/* Bottom Sheet Drawer para el catálogo completo de módulos */}
      <CompanyBottomNavDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        enabledModules={enabledModules}
      />

      {/* Modal de Configuración desacoplado */}
      <CompanySettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </>
  );
}
