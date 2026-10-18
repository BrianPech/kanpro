"use client";

import React from "react";
import {
  Users,
  Briefcase,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Inbox,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { WorkforceKPIs } from "../../types/dashboard";

interface WorkforceKPIGridProps {
  kpis: WorkforceKPIs;
}

export function WorkforceKPIGrid({ kpis }: WorkforceKPIGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Vacantes Activas */}
      <Link href="/dashboard/company/vacancies" className="group block focus:outline-none">
        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-3 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Briefcase className="size-5.5" />
            </div>
            <Badge
              variant="outline"
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border-primary/20"
            >
              {kpis.pendingReviewApplications} por revisar
            </Badge>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {kpis.openVacanciesCount}
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-0.5">
              Vacantes Activas
            </p>
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>
              {kpis.openVacanciesCount > 0
                ? "Publicadas en el feed K'anPro"
                : "Sin vacantes abiertas"}
            </span>
            <span className="text-primary font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Gestionar
              <ArrowUpRight className="size-3" />
            </span>
          </div>
        </Card>
      </Link>

      {/* KPI 2: Postulaciones Recibidas */}
      <Link href="/dashboard/company/applications" className="group block focus:outline-none">
        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-3 shadow-xs hover:border-amber-500/40 hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Inbox className="size-5.5" />
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] font-bold px-2.5 py-0.5 rounded-full border-transparent",
                kpis.pendingReviewApplications > 0
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              )}
            >
              {kpis.pendingReviewApplications > 0
                ? `${kpis.pendingReviewApplications} pendientes`
                : "Al día"}
            </Badge>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {kpis.totalApplicationsReceived}
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-0.5">
              Postulaciones Totales
            </p>
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>
              {kpis.totalApplicationsReceived > 0
                ? "Candidatos registrados"
                : "Esperando postulantes"}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Bandeja
              <ArrowUpRight className="size-3" />
            </span>
          </div>
        </Card>
      </Link>

      {/* KPI 3: Empleados Activos */}
      <Link href="/dashboard/company/employees" className="group block focus:outline-none">
        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-3 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="size-5.5" />
            </div>
            <Badge
              variant="outline"
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1"
            >
              <TrendingUp className="size-3" />
              <span>{kpis.retentionRate}% Retención</span>
            </Badge>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {kpis.activeEmployees}
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-0.5">
              Empleados Activos
            </p>
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>
              {kpis.onboardingEmployees > 0
                ? `${kpis.onboardingEmployees} en inducción`
                : "Plantilla contratada"}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Ver equipo
              <ArrowUpRight className="size-3" />
            </span>
          </div>
        </Card>
      </Link>

      {/* KPI 4: Puntualidad & Asistencia Hoy */}
      <Link href="/dashboard/company/attendance" className="group block focus:outline-none">
        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-3 shadow-xs hover:border-indigo-500/40 hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="size-5.5" />
            </div>
            <Badge
              variant="outline"
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
            >
              {kpis.punctualityRate}% Puntualidad
            </Badge>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {kpis.absentCountToday === 0
                ? "100%"
                : `${kpis.absentCountToday} Ausencia(s)`}
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-0.5">
              Asistencia Turno de Hoy
            </p>
          </div>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>
              {kpis.lateArrivalsToday > 0
                ? `${kpis.lateArrivalsToday} retardos reportados`
                : "Sin incidencias hoy"}
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Checador
              <ArrowUpRight className="size-3" />
            </span>
          </div>
        </Card>
      </Link>
    </div>
  );
}
