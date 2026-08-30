"use client";

import * as React from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  UserCheck,
  Clock,
  Plus,
  ArrowUpRight,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  ShieldCheck,
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
import { formatDateToDisplay } from "@/lib/formatters";
import type { CompanyDashboardData } from "../types/dashboard";

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
  subscriptionSummary,
  applicationsSummary,
  recentCandidates = [],
  todayAttendance = [],
}: CompanyDashboardData) {
  const totalApps = applicationsSummary?.total || kpis.totalApplicationsReceived || 0;
  const inReviewCount =
    (applicationsSummary?.inReview || 0) + (applicationsSummary?.pending || 0);
  const shortlistedCount = applicationsSummary?.shortlisted || 0;
  const hiredCount = applicationsSummary?.hired || 0;

  const inReviewPct = totalApps > 0 ? Math.round((inReviewCount / totalApps) * 100) : 0;
  const shortlistedPct = totalApps > 0 ? Math.round((shortlistedCount / totalApps) * 100) : 0;
  const hiredPct = totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0;

  const presentCount = todayAttendance.filter((a) => a.status === "presente").length;

  return (
    <div className="w-full space-y-6 sm:space-y-8 font-sans">
      {/* 1. Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {`Dashboard • ${companyName}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen ejecutivo de atracción de talento, postulaciones y colaboradores.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/dashboard/company/reports" />}
            className="cursor-pointer text-xs font-semibold"
          >
            <FileSpreadsheet className="size-4 mr-1.5" />
            <span>Reportes</span>
          </Button>
          <Button
            size="sm"
            render={<Link href="/dashboard/company/vacancies/new" />}
            className="cursor-pointer text-xs font-bold gap-1.5 bg-primary text-primary-foreground"
          >
            <Plus className="size-4" />
            <span>Publicar Vacante</span>
          </Button>
        </div>
      </div>

      {/* 2. Alertas Operativas */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.slice(0, 2).map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.severity === "critical" ? "destructive" : "default"}
              className="rounded-xl border border-border"
            >
              <AlertCircle className="size-4" />
              <AlertTitle className="font-semibold text-sm">{alert.title}</AlertTitle>
              <AlertDescription className="text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
                <span>{alert.description}</span>
                {alert.actionUrl && (
                  <Link
                    href={alert.actionUrl}
                    className="font-bold underline shrink-0 hover:opacity-80"
                  >
                    {alert.actionLabel || "Ver detalle"}
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* 3. Tarjetas KPI Métricas Clave (Default shadcn/ui style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Vacantes Activas */}
        <Card className="rounded-xl border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vacantes Activas
            </CardTitle>
            <Briefcase className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {kpis.openVacanciesCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Ofertas en difusión pública
            </p>
          </CardContent>
          <CardFooter className="pt-2 pb-4 px-6 border-t border-border/40">
            <Link
              href="/dashboard/company/vacancies"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Ver todas las vacantes</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </CardFooter>
        </Card>

        {/* KPI 2: Total Postulaciones */}
        <Card className="rounded-xl border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Postulaciones
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {kpis.totalApplicationsReceived}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis.pendingReviewApplications} pendientes de revisar
            </p>
          </CardContent>
          <CardFooter className="pt-2 pb-4 px-6 border-t border-border/40">
            <Link
              href="/dashboard/company/applications"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Revisar candidatos</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </CardFooter>
        </Card>

        {/* KPI 3: Colaboradores Activos */}
        <Card className="rounded-xl border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plantilla Activa
            </CardTitle>
            <UserCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {kpis.activeEmployees}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis.totalEmployees} colaboradores en total
            </p>
          </CardContent>
          <CardFooter className="pt-2 pb-4 px-6 border-t border-border/40">
            <Link
              href="/dashboard/company/employees"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Ver plantilla</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </CardFooter>
        </Card>

        {/* KPI 4: Asistencia Hoy */}
        <Card className="rounded-xl border border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Asistencia Hoy
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {kpis.punctualityRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {presentCount} presentes en turno
            </p>
          </CardContent>
          <CardFooter className="pt-2 pb-4 px-6 border-t border-border/40">
            <Link
              href="/dashboard/company/attendance"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Registro de asistencia</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* 4. Bloque Principal de 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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
                    const initials = cand.candidateName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();

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
                            <p className="text-sm font-bold text-foreground truncate">
                              {cand.candidateName}
                            </p>
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
                            {formatDateToDisplay(cand.appliedAt)}
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
                render={<Link href="/dashboard/company/vacancies/new" />}
                className="h-11 justify-start px-3.5 text-xs font-semibold rounded-xl cursor-pointer"
              >
                <Plus className="size-4 mr-2 text-primary" />
                <span>Nueva Vacante</span>
              </Button>
              <Button
                variant="outline"
                render={<Link href="/dashboard/company/applications" />}
                className="h-11 justify-start px-3.5 text-xs font-semibold rounded-xl cursor-pointer"
              >
                <Users className="size-4 mr-2 text-primary" />
                <span>Postulantes</span>
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
            </CardContent>
          </Card>

          {/* 3. Estado de la Cuenta & Suscripción */}
          <Card className="rounded-xl border border-border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  Suscripción & Plan
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                >
                  {subscriptionSummary?.status === "active" ? "Activo" : "En Prueba"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {subscriptionSummary?.planName || "Plan Pro"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground font-medium">
                  Vacantes Destacadas
                </span>
                <span className="font-bold text-foreground">
                  {subscriptionSummary?.featuredVacanciesUsed || 0} /{" "}
                  {subscriptionSummary?.featuredVacanciesAllowance || 3}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground font-medium">
                  Verificación Legal
                </span>
                <div className="flex items-center gap-1 font-bold text-foreground">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  <span>
                    {subscriptionSummary?.verificationStatus === "approved"
                      ? "Verificada"
                      : "En Auditoría"}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-1 pb-4 px-6">
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/dashboard/company/settings" />}
                className="w-full text-xs font-semibold rounded-xl cursor-pointer"
              >
                Configurar Cuenta & Facturación
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

