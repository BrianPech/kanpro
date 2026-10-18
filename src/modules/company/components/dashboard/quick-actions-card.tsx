"use client";

import React from "react";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Users,
  UserPlus,
  FileSignature,
  QrCode,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  {
    title: "Publicar Vacante",
    description: "Crear oferta en el feed K'anPro",
    href: "/dashboard/company/vacancies/new",
    icon: PlusCircle,
    iconBg: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
    badge: "Atracción",
    badgeColor: "bg-primary/10 text-primary border-primary/20",
  },
  {
    title: "Explorar Radar",
    description: "Buscar candidatos disponibles",
    href: "/dashboard/company/radar",
    icon: Search,
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white",
    badge: "Búsqueda",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    title: "Bandeja de Postulantes",
    description: "Revisar y filtrar aplicaciones",
    href: "/dashboard/company/applications",
    icon: Users,
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white",
    badge: "Candidatos",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  {
    title: "Alta de Empleado",
    description: "Registrar nuevo empleado",
    href: "/dashboard/company/employees",
    icon: UserPlus,
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
    badge: "Plantilla",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    title: "Nuevo Contrato",
    description: "Generar con firma digital",
    href: "/dashboard/company/contracts",
    icon: FileSignature,
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white",
    badge: "Legal",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  {
    title: "Kiosko de Asistencia",
    description: "Checador QR en sucursal",
    href: "/dashboard/company/attendance",
    icon: QrCode,
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white",
    badge: "Turnos",
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
];

export function QuickActionsCard() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Zap className="size-3.5" />
          </div>
          <h3 className="text-sm font-extrabold text-foreground tracking-tight">
            Acciones Rápidas
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
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
              <Card className="h-full rounded-2xl border border-border/50 bg-card p-3.5 space-y-2.5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1">
                  <div
                    className={cn(
                      "size-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
                      action.iconBg
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <ArrowUpRight className="size-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                    {action.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 leading-snug">
                    {action.description}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] font-bold px-1.5 py-0 rounded-md w-fit border",
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
