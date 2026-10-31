"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  UserPlus,
  Clock,
  CalendarCheck,
  ShieldAlert,
  FileCheck2,
  FileSpreadsheet,
  ChevronRight,
  X,
  Zap,
  Lock,
} from "@/components/ui/icons";
import { getLockedModuleBadge } from "@/modules/company/config/demo-rollout";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CompanyQuickActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabledModules?: string[];
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badge?: string;
  isPrimary?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "new-employee",
    title: "Registrar Empleado",
    description: "Alta directa de personal con salario, puesto y datos fiscales",
    href: "/dashboard/company/employees?action=new",
    icon: UserPlus,
    iconBg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badge: "Prioritario",
    isPrimary: true,
  },
  {
    id: "attendance",
    title: "Pase de Asistencia & Checador",
    description: "Consultar entradas, retardos y registrar checadas de hoy",
    href: "/dashboard/company/attendance",
    icon: Clock,
    iconBg: "bg-blue-500/15 dark:bg-blue-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "leaves",
    title: "Vacaciones & Permisos LFT",
    description: "Revisar saldo de días según la Ley Federal del Trabajo",
    href: "/dashboard/company/leaves",
    icon: CalendarCheck,
    iconBg: "bg-amber-500/15 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "incidents",
    title: "Incidencias Laborales",
    description: "Registrar faltas, permisos sin goce, retardos o incapacidades",
    href: "/dashboard/company/incidents",
    icon: ShieldAlert,
    iconBg: "bg-rose-500/15 dark:bg-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "contracts",
    title: "Contratos & Bajas",
    description: "Expedientes laborales, vigencias y documentación de ceses",
    href: "/dashboard/company/contracts",
    icon: FileCheck2,
    iconBg: "bg-purple-500/15 dark:bg-purple-500/20",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "reports",
    title: "Centro de Reportes",
    description: "Exportar listas de empleados y nómina a Excel o CSV",
    href: "/dashboard/company/reports",
    icon: FileSpreadsheet,
    iconBg: "bg-teal-500/15 dark:bg-teal-500/20",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
];

export function CompanyQuickActionsSheet({
  open,
  onOpenChange,
  enabledModules,
}: CompanyQuickActionsSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle swipeDirection="down">
      <DrawerContent className="[--drawer-inset:0px] max-h-[85vh] rounded-t-[28px] rounded-b-none border-x-0 border-b-0 border-t border-border/70 bg-card text-card-foreground shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera del Action Sheet */}
        <DrawerHeader className="px-5 pt-3 pb-3 border-b border-border/40 flex flex-row items-center justify-between shrink-0">
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Zap className="size-3.5 fill-primary" />
              </div>
              <DrawerTitle className="text-base font-extrabold tracking-tight text-foreground">
                Acciones Rápidas RH
              </DrawerTitle>
            </div>
            <DrawerDescription className="text-xs text-muted-foreground mt-0.5 truncate">
              Operaciones de personal disponibles para resolver con el pulgar
            </DrawerDescription>
          </div>

          <DrawerClose
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 ml-2 cursor-pointer"
                aria-label="Cerrar acciones rápidas"
              />
            }
          >
            <X className="size-4" />
          </DrawerClose>
        </DrawerHeader>

        {/* Lista de Acciones con áreas táctiles amplias (>= 52px de altura) */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3.5 space-y-2 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const lockBadge = getLockedModuleBadge(action.href, enabledModules);
            const isLocked = Boolean(lockBadge);
            const displayBadge = lockBadge || action.badge;

            return (
              <Link
                key={action.id}
                href={isLocked ? "#" : action.href}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    toast.info(
                      `${action.title} se habilitará en la ${lockBadge} de la DEMO.`
                    );
                    return;
                  }
                  onOpenChange(false);
                }}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-2xl border transition-all duration-150 active:scale-[0.98] cursor-pointer select-none",
                  isLocked
                    ? "opacity-65 bg-card/60 border-border/30"
                    : action.isPrimary
                    ? "bg-primary/5 hover:bg-primary/10 border-primary/30 shadow-2xs"
                    : "bg-card hover:bg-muted/50 border-border/40 hover:border-border/70"
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      "size-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs",
                      isLocked
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : cn(action.iconBg, action.iconColor)
                    )}
                  >
                    {isLocked ? <Lock className="size-5" /> : <Icon className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-foreground block truncate">
                        {action.title}
                      </span>
                      {displayBadge && (
                        <span
                          className={cn(
                            "text-[10px] font-extrabold px-1.5 py-0.2 rounded-md shrink-0",
                            isLocked
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          )}
                        >
                          {displayBadge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium block truncate mt-0.5">
                      {action.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
