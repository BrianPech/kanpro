"use client";

import React from "react";
import {
  Users,
  Briefcase,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Inbox,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyStatusBadge } from "../shared/company-status-badge";
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
        <Card className="p-5 space-y-4 hover:ring-primary/40 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Briefcase className="size-5" />
            </div>
            <CompanyStatusBadge
              status="info"
              label={`${kpis.pendingReviewApplications} por revisar`}
            />
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {kpis.openVacanciesCount}
            </div>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Vacantes Activas
            </p>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>
              {kpis.openVacanciesCount > 0
                ? "Publicadas en K'anPro"
                : "Sin vacantes abiertas"}
            </span>
            <span className="text-primary font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Gestionar
              <ArrowUpRight className="size-3" />
            </span>
          </div>
        </Card>
      </Link>

      {/* KPI 2: Postulaciones Recibidas */}
      <Link href="/dashboard/company/applications" className="group block focus:outline-none">
        <Card className="p-5 space-y-4 hover:ring-amber-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Inbox className="size-5" />
            </div>
            <CompanyStatusBadge
              status={kpis.pendingReviewApplications > 0 ? "warning" : "success"}
              label={
                kpis.pendingReviewApplications > 0
                  ? `${kpis.pendingReviewApplications} pendientes`
                  : "Al día"
              }
            />
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {kpis.totalApplicationsReceived}
            </div>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Postulaciones Totales
            </p>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>
              {kpis.totalApplicationsReceived > 0
                ? "Candidatos registrados"
                : "Esperando postulantes"}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Bandeja
              <ArrowUpRight className="size-3" />
            </span>
          </div>
        </Card>
      </Link>

      {/* KPI 3: Empleados Activos */}
      <Link href="/dashboard/company/employees" className="group block focus:outline-none">
        <Card className="p-5 space-y-4 hover:ring-emerald-500/40 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="size-5" />
            </div>
            <Badge
              variant="outline"
              className="text-xs font-semibold px-2.5 py-0.5 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1"
            >
              <TrendingUp className="size-3" />
              <span>{kpis.retentionRate}% Retención</span>
            </Badge>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {kpis.activeEmployees}
            </div>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Empleados Activos
            </p>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>
              {kpis.onboardingEmployees > 0
                ? `${kpis.onboardingEmployees} en inducción`
                : "Plantilla contratada"}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Ver equipo
              <ArrowUpRight className="size-3" />
            </span>
          </div>
        </Card>
      </Link>

      {/* KPI 4: Puntualidad & Asistencia Hoy */}
      <Link href="/dashboard/company/attendance" className="group block focus:outline-none">
        <Card className="p-5 space-y-4 hover:ring-primary/40 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="size-5" />
            </div>
            <CompanyStatusBadge
              status={kpis.punctualityRate >= 95 ? "success" : "warning"}
              label={`${kpis.punctualityRate}% Puntualidad`}
            />
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {kpis.absentCountToday === 0
                ? "100%"
                : `${kpis.absentCountToday} Ausencia(s)`}
            </div>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Asistencia Turno de Hoy
            </p>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>
              {kpis.lateArrivalsToday > 0
                ? `${kpis.lateArrivalsToday} retardos reportados`
                : "Sin incidencias hoy"}
            </span>
            <span className="text-primary font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Checador
              <ArrowUpRight className="size-3" />
            </span>
          </div>
        </Card>
      </Link>
    </div>
  );
}
