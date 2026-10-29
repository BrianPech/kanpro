"use client";

import React from "react";
import Link from "next/link";
import {
  UserPlus,
  Briefcase,
  FileCheck2,
  CalendarCheck,
  CreditCard,
  Zap,
  ArrowUpRight,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuickActionItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge: string;
  badgeColor: string;
  iconBg: string;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    title: "Nueva Vacante",
    description: "Publicar oferta en K'anPro",
    icon: Briefcase,
    href: "/dashboard/company/vacancies/new",
    badge: "Atracción",
    badgeColor: "bg-primary/10 text-primary border-primary/20",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    title: "Dar de Alta",
    description: "Registrar nuevo colaborador",
    icon: UserPlus,
    href: "/dashboard/company/employees",
    badge: "Personal",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Revisar Checador",
    description: "Asistencias e incidencias de hoy",
    icon: CalendarCheck,
    href: "/dashboard/company/attendance",
    badge: "Turno",
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  {
    title: "Generar Contrato",
    description: "Crear documento con firma digital",
    icon: FileCheck2,
    href: "/dashboard/company/contracts",
    badge: "Legal",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Cerrar Nómina",
    description: "Pre-cálculo y layout bancario",
    icon: CreditCard,
    href: "/dashboard/company/payroll",
    badge: "Finanzas",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    title: "Matriz 9-Box",
    description: "Desempeño y potencial NOM-035",
    icon: Zap,
    href: "/dashboard/company/evaluations",
    badge: "RH 360",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
];

export function QuickActionsCard() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Zap className="size-3.5" />
          </div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">
            Acciones Rápidas
          </h3>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Operación inmediata
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className="group block focus:outline-none"
            >
              <Card className="h-full p-4 space-y-3 hover:ring-1 hover:ring-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1">
                  <div
                    className={cn(
                      "size-9 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                      action.iconBg
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                    {action.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">
                    {action.description}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-3xl w-fit",
                    action.badgeColor
                  )}
                >
                  {action.badge}
                </Badge>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
