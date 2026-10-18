"use client";

import * as React from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Plus,
  ArrowUpRight,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  Layers,
  CalendarCheck,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateToDisplay } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { CompanyDashboardData } from "../types/dashboard";

const getInitials = (name?: string | null) => {
  if (!name || typeof name !== "string" || !name.trim()) return "KP";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "KP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((parts[0][0] || "") + (parts[1][0] || "")).toUpperCase() || "KP";
};

const STATUS_BADGE_VARIANTS: Record<
  string,
  { label: string; className: string }
> = {
  Pendiente: {
    label: "Pendiente",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  },
  Nuevo: {
    label: "Nuevo",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  },
  "En revisión": {
    label: "En Revisión",
    className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
  },
  Preseleccionado: {
    label: "Preseleccionado",
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  },
  Entrevista: {
    label: "Entrevista",
    className: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
  },
  Contratado: {
    label: "Contratado",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  Descartado: {
    label: "Descartado",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
  Rechazado: {
    label: "Rechazado",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
};

export function DashboardView({
  companyName = "Mi Empresa",
  kpis,
  alerts = [],
  openVacanciesList = [],
  applicationsSummary,
  recentCandidates = [],
  todayAttendance = [],
}: CompanyDashboardData) {
  const [mobileTab, setMobileTab] = React.useState<"candidates" | "vacancies" | "pipeline">("candidates");

  const totalApps = applicationsSummary?.total || kpis?.totalApplicationsReceived || 0;
  const inReviewCount =
    (applicationsSummary?.inReview || 0) + (applicationsSummary?.pending || 0);
  const shortlistedCount = applicationsSummary?.shortlisted || 0;
  const hiredCount = applicationsSummary?.hired || 0;

  const inReviewPct = totalApps > 0 ? Math.round((inReviewCount / totalApps) * 100) : 0;
  const shortlistedPct = totalApps > 0 ? Math.round((shortlistedCount / totalApps) * 100) : 0;
  const hiredPct = totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0;

  const presentCount = (todayAttendance || []).filter((a) => a.status === "presente").length;

  return (
    <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8 font-sans">
      {/* 1. Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              Portal Empresa
            </span>
            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10 font-bold gap-1 px-2.5 py-0.5 rounded-full shadow-2xs">
              ✨ Empresa Pionera • Acceso Anticipado
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground truncate">
            {`Dashboard • ${companyName}`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-none">
            Gestión integral de empleados, asistencia, vacaciones y nómina.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/dashboard/company/reports" />}
            className="cursor-pointer text-xs font-semibold h-9"
          >
            <FileSpreadsheet className="size-3.5 mr-1.5" />
            <span>Reportes</span>
          </Button>
          <Button
            size="sm"
            render={<Link href="/dashboard/company/employees?action=new" />}
            className="cursor-pointer text-xs font-bold gap-1.5 bg-primary text-primary-foreground h-9 shadow-xs"
          >
            <UserPlus className="size-3.5" />
            <span>+ Registrar Empleado</span>
          </Button>
        </div>
      </div>

      {/* 2. Alertas Operativas */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2.5">
          {alerts.slice(0, 2).map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.severity === "critical" ? "destructive" : "default"}
              className="rounded-xl border border-border/80 p-3 sm:p-4"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="w-full">
                <AlertTitle className="font-semibold text-xs sm:text-sm">
                  {alert.title}
                </AlertTitle>
                <AlertDescription className="text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mt-0.5">
                  <span className="text-muted-foreground">{alert.description}</span>
                  {alert.actionUrl && (
                    <Link
                      href={alert.actionUrl}
                      className="font-bold underline shrink-0 hover:opacity-80 inline-flex items-center gap-1 text-primary"
                    >
                      <span>{alert.actionLabel || "Ver detalle"}</span>
                      <ArrowUpRight className="size-3" />
                    </Link>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* 3. Tarjetas KPI Métricas Clave (2x2 en mobile, 4 cols en desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
        {/* KPI 1: Plantilla Activa */}
        <Link
          href="/dashboard/company/employees"
          className="group block rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="h-full rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xs transition-all p-3 sm:p-4.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground truncate">
                Plantilla Activa
              </span>
              <div className="size-7 sm:size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <UserCheck className="size-3.5 sm:size-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                {kpis.activeEmployees}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate flex items-center justify-between">
                <span>{kpis.totalEmployees} empleados</span>
                <ArrowUpRight className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </p>
            </div>
          </Card>
        </Link>

        {/* KPI 2: Asistencia Hoy */}
        <Link
          href="/dashboard/company/attendance"
          className="group block rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="h-full rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xs transition-all p-3 sm:p-4.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground truncate">
                Asistencia Hoy
              </span>
              <div className="size-7 sm:size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Clock className="size-3.5 sm:size-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                {kpis.punctualityRate}%
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate flex items-center justify-between">
                <span>{presentCount} presentes</span>
                <ArrowUpRight className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </p>
            </div>
          </Card>
        </Link>

        {/* KPI 3: Vacantes Activas */}
        <Link
          href="/dashboard/company/vacancies"
          className="group block rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="h-full rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xs transition-all p-3 sm:p-4.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground truncate">
                Vacantes Activas
              </span>
              <div className="size-7 sm:size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Briefcase className="size-3.5 sm:size-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                {kpis.openVacanciesCount}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate flex items-center justify-between">
                <span>Fase 2</span>
                <ArrowUpRight className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </p>
            </div>
          </Card>
        </Link>

        {/* KPI 4: Postulaciones */}
        <Link
          href="/dashboard/company/applications"
          className="group block rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="h-full rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xs transition-all p-3 sm:p-4.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground truncate">
                Postulaciones
              </span>
              <div className="size-7 sm:size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="size-3.5 sm:size-4" />
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                {kpis.totalApplicationsReceived}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate flex items-center justify-between">
                <span>{kpis.pendingReviewApplications} pendientes</span>
                <ArrowUpRight className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* 4. Acciones Rápidas (Horizontal Scrollable Pills en Mobile) */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          <Button
            size="sm"
            render={<Link href="/dashboard/company/employees?action=new" />}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl shrink-0 gap-1.5 bg-primary text-primary-foreground shadow-xs cursor-pointer"
          >
            <UserPlus className="size-3.5" />
            <span>+ Empleado</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/dashboard/company/applications" />}
            className="h-9 px-3 text-xs font-medium rounded-xl shrink-0 gap-1.5 bg-card hover:bg-muted/60 cursor-pointer"
          >
            <Users className="size-3.5 text-primary" />
            <span>Postulantes</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/dashboard/company/employees" />}
            className="h-9 px-3 text-xs font-medium rounded-xl shrink-0 gap-1.5 bg-card hover:bg-muted/60 cursor-pointer"
          >
            <UserCheck className="size-3.5 text-primary" />
            <span>Plantilla</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/dashboard/company/attendance" />}
            className="h-9 px-3 text-xs font-medium rounded-xl shrink-0 gap-1.5 bg-card hover:bg-muted/60 cursor-pointer"
          >
            <Clock className="size-3.5 text-primary" />
            <span>Asistencia</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/dashboard/company/reports" />}
            className="h-9 px-3 text-xs font-medium rounded-xl shrink-0 gap-1.5 bg-card hover:bg-muted/60 cursor-pointer"
          >
            <FileSpreadsheet className="size-3.5 text-primary" />
            <span>Reportes</span>
          </Button>
        </div>
      </div>

      {/* 5. Mobile Tabs Navigation (< lg) */}
      <div className="lg:hidden space-y-4">
        {/* Segmented Control Buttons */}
        <div className="grid grid-cols-3 p-1 bg-muted/60 rounded-xl border border-border/60 text-xs font-semibold gap-1">
          <button
            type="button"
            onClick={() => setMobileTab("candidates")}
            className={cn(
              "py-2 px-2 text-center rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer",
              mobileTab === "candidates"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="size-3.5 shrink-0" />
            <span className="truncate">Candidatos</span>
            {(recentCandidates?.length || totalApps) > 0 && (
              <span className="size-4.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                {recentCandidates?.length || totalApps}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("vacancies")}
            className={cn(
              "py-2 px-2 text-center rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer",
              mobileTab === "vacancies"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Briefcase className="size-3.5 shrink-0" />
            <span className="truncate">Vacantes</span>
            {kpis.openVacanciesCount > 0 && (
              <span className="size-4.5 rounded-full bg-muted text-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                {kpis.openVacanciesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("pipeline")}
            className={cn(
              "py-2 px-2 text-center rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer",
              mobileTab === "pipeline"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="size-3.5 shrink-0" />
            <span className="truncate">Embudo</span>
          </button>
        </div>

        {/* Tab 1: Postulantes Recientes */}
        {mobileTab === "candidates" && (
          <Card className="rounded-xl border border-border shadow-xs overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b border-border/60">
              <div>
                <CardTitle className="text-sm font-bold">
                  Postulaciones Recientes
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Candidatos aplicados recientemente
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/dashboard/company/applications" />}
                className="text-xs font-semibold h-8 px-2.5 cursor-pointer text-primary"
              >
                <span>Ver todas ({totalApps})</span>
                <ChevronRight className="size-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentCandidates && recentCandidates.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {recentCandidates.slice(0, 6).map((cand) => {
                    const statusConfig =
                      STATUS_BADGE_VARIANTS[cand.status] || {
                        label: cand.status,
                        className: "bg-muted text-muted-foreground",
                      };
                    const initials = getInitials(cand.candidateName);

                    return (
                      <Link
                        key={cand.id}
                        href="/dashboard/company/applications"
                        className="p-3.5 flex items-center justify-between gap-2.5 hover:bg-muted/40 transition-colors block"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="size-9 rounded-full border border-border shrink-0">
                            {cand.candidateAvatar && (
                              <AvatarImage
                                src={cand.candidateAvatar}
                                alt={cand.candidateName}
                              />
                            )}
                            <AvatarFallback className="text-[11px] font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-bold text-foreground truncate">
                                {cand.candidateName}
                              </p>
                              {cand.isEarlyAccess && (
                                <Badge variant="outline" className="text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 px-1 py-0 h-4 shrink-0">
                                  Pionero
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {cand.vacancyTitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusConfig.className}`}
                          >
                            {statusConfig.label}
                          </Badge>
                          <ChevronRight className="size-4 text-muted-foreground/60" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <Users className="size-7 mx-auto text-muted-foreground/40" />
                  <p className="text-xs font-semibold text-foreground">
                    Sin postulaciones recientes
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Los candidatos que apliquen a tus vacantes aparecerán aquí.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Vacantes Activas */}
        {mobileTab === "vacancies" && (
          <Card className="rounded-xl border border-border shadow-xs overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b border-border/60">
              <div>
                <CardTitle className="text-sm font-bold">
                  Vacantes Activas
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Ofertas laborales con afluencia de talento
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/dashboard/company/vacancies" />}
                className="text-xs font-semibold h-8 px-2.5 cursor-pointer text-primary"
              >
                <span>Ver todas ({kpis.openVacanciesCount})</span>
                <ChevronRight className="size-3.5 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {openVacanciesList && openVacanciesList.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {openVacanciesList.map((vac) => (
                    <Link
                      key={vac.id}
                      href={`/dashboard/company/applications?vacancy_id=${vac.id}`}
                      className="p-3.5 flex items-center justify-between gap-2.5 hover:bg-muted/40 transition-colors block"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {vac.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="truncate">{vac.category}</span>
                          <span>•</span>
                          <span className="truncate">{vac.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        >
                          {vac.applicationsCount} cand.
                        </Badge>
                        <ChevronRight className="size-4 text-muted-foreground/60" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <Briefcase className="size-7 mx-auto text-muted-foreground/40" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                      No tienes vacantes activas
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Publica tu primera oferta para empezar a recibir candidatos.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    render={<Link href="/dashboard/company/vacancies/new" />}
                    className="text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="size-3.5 mr-1.5" />
                    <span>Publicar Vacante</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Embudo & Plan */}
        {mobileTab === "pipeline" && (
          <div className="space-y-4">
            {/* Embudo de Selección */}
            <Card className="rounded-xl border border-border shadow-xs">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold">
                  Embudo de Selección
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Distribución de candidatos en el proceso
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">En Revisión / Nuevos</span>
                    <span className="text-foreground font-semibold">
                      {inReviewCount} ({inReviewPct}%)
                    </span>
                  </div>
                  <Progress value={inReviewPct} className="h-2 rounded-full" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Preseleccionados</span>
                    <span className="text-foreground font-semibold">
                      {shortlistedCount} ({shortlistedPct}%)
                    </span>
                  </div>
                  <Progress value={shortlistedPct} className="h-2 rounded-full" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Contratados</span>
                    <span className="text-foreground font-bold">
                      {hiredCount} ({hiredPct}%)
                    </span>
                  </div>
                  <Progress value={hiredPct} className="h-2 rounded-full" />
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href="/dashboard/company/applications" />}
                    className="w-full text-xs font-semibold rounded-xl cursor-pointer h-9 justify-center"
                  >
                    <span>Ver bandeja de selección</span>
                    <ArrowUpRight className="size-3.5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 6. Bloque Principal de 2 Columnas (Visible únicamente en Pantallas Desktop >= lg) */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda (7 / 12 cols): Vacantes y Postulaciones */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Vacantes en Difusión */}
          <Card className="rounded-xl border border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base font-bold">
                  Vacantes Activas
                </CardTitle>
                <CardDescription className="text-xs">
                  Ofertas laborales con mayor afluencia de candidatos.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/dashboard/company/vacancies" />}
                className="text-xs font-semibold cursor-pointer"
              >
                Ver todas ({kpis.openVacanciesCount})
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {openVacanciesList && openVacanciesList.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {openVacanciesList.map((vac) => (
                    <div
                      key={vac.id}
                      className="p-4 sm:px-6 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <Link
                          href={`/dashboard/company/vacancies`}
                          className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate block"
                        >
                          {vac.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{vac.category}</span>
                          <span>•</span>
                          <span>{vac.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold px-2.5 py-0.5 rounded-md"
                        >
                          {vac.applicationsCount}{" "}
                          {vac.applicationsCount === 1 ? "candidato" : "candidatos"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          render={
                            <Link
                              href={`/dashboard/company/applications?vacancy_id=${vac.id}`}
                            />
                          }
                          className="size-8 rounded-lg cursor-pointer"
                          title="Ver candidatos"
                        >
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <Briefcase className="size-8 mx-auto text-muted-foreground/50" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      No tienes vacantes activas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Publica tu primera oferta de empleo para empezar a recibir postulantes.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    render={<Link href="/dashboard/company/vacancies/new" />}
                    className="text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="size-3.5 mr-1.5" />
                    <span>Publicar Vacante</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Postulaciones Recientes */}
          <Card className="rounded-xl border border-border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base font-bold">
                  Postulaciones Recientes
                </CardTitle>
                <CardDescription className="text-xs">
                  Últimos candidatos registrados para tus ofertas.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/dashboard/company/applications" />}
                className="text-xs font-semibold cursor-pointer"
              >
                Ver todas ({totalApps})
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentCandidates && recentCandidates.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {recentCandidates.slice(0, 5).map((cand) => {
                    const statusConfig =
                      STATUS_BADGE_VARIANTS[cand.status] || {
                        label: cand.status,
                        className: "bg-muted text-muted-foreground",
                      };
                    const initials = getInitials(cand.candidateName);

                    return (
                      <div
                        key={cand.id}
                        className="p-4 sm:px-6 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="size-9 rounded-full border border-border shrink-0">
                            {cand.candidateAvatar && (
                              <AvatarImage
                                src={cand.candidateAvatar}
                                alt={cand.candidateName}
                              />
                            )}
                            <AvatarFallback className="text-xs font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-bold text-foreground truncate">
                                {cand.candidateName}
                              </p>
                              {cand.isEarlyAccess && (
                                <Badge variant="outline" className="text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 px-1.5 py-0 h-4.5 shrink-0">
                                  Pionero
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {cand.vacancyTitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusConfig.className}`}
                          >
                            {statusConfig.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
                            {cand.appliedAt ? formatDateToDisplay(cand.appliedAt) : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <Users className="size-8 mx-auto text-muted-foreground/50" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Sin postulaciones recientes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Los candidatos que apliquen a tus vacantes aparecerán en esta lista.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha (5 / 12 cols): Embudo, Accesos y Suscripción */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Embudo de Selección (Pipeline) */}
          <Card className="rounded-xl border border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                Embudo de Selección
              </CardTitle>
              <CardDescription className="text-xs">
                Distribución de postulantes en el proceso de contratación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">
                    En Revisión / Nuevos
                  </span>
                  <span className="text-foreground">
                    {inReviewCount} ({inReviewPct}%)
                  </span>
                </div>
                <Progress value={inReviewPct} className="h-2 rounded-full" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">
                    Preseleccionados / Entrevista
                  </span>
                  <span className="text-foreground">
                    {shortlistedCount} ({shortlistedPct}%)
                  </span>
                </div>
                <Progress value={shortlistedPct} className="h-2 rounded-full" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Contratados</span>
                  <span className="text-foreground font-bold">
                    {hiredCount} ({hiredPct}%)
                  </span>
                </div>
                <Progress value={hiredPct} className="h-2 rounded-full bg-muted" />
              </div>
            </CardContent>
            <CardFooter className="pt-0 pb-4 px-6">
              <Link
                href="/dashboard/company/applications"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Ver bandeja de selección</span>
                <ArrowUpRight className="size-3" />
              </Link>
            </CardFooter>
          </Card>

          {/* 2. Acciones Rápidas */}
          <Card className="rounded-xl border border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                Acciones Rápidas
              </CardTitle>
              <CardDescription className="text-xs">
                Accesos directos a las operaciones más frecuentes.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                render={<Link href="/dashboard/company/employees?action=new" />}
                className="h-11 justify-start px-3.5 text-xs font-semibold rounded-xl cursor-pointer"
              >
                <UserPlus className="size-4 mr-2 text-primary" />
                <span>Registrar Empleado</span>
              </Button>
              <Button
                variant="outline"
                render={<Link href="/dashboard/company/employees" />}
                className="h-11 justify-start px-3.5 text-xs font-semibold rounded-xl cursor-pointer"
              >
                <UserCheck className="size-4 mr-2 text-primary" />
                <span>Plantilla</span>
              </Button>
              <Button
                variant="outline"
                render={<Link href="/dashboard/company/attendance" />}
                className="h-11 justify-start px-3.5 text-xs font-semibold rounded-xl cursor-pointer"
              >
                <Clock className="size-4 mr-2 text-primary" />
                <span>Asistencia</span>
              </Button>
              <Button
                variant="outline"
                render={<Link href="/dashboard/company/vacations" />}
                className="h-11 justify-start px-3.5 text-xs font-semibold rounded-xl cursor-pointer"
              >
                <CalendarCheck className="size-4 mr-2 text-primary" />
                <span>Vacaciones</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

