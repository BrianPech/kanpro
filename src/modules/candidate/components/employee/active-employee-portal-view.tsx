"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Plane,
  FileCheck2,
  ShieldCheck,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  MapPin,
  FileText,
  Sparkles,
  BadgeCheck,
  Palmtree,
  User,
  Compass,
  Search,
  Bookmark,
  Share2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatSalaryDisplay } from "@/lib/formatters";
import type {
  ActiveEmploymentData,
  CandidateDashboardData,
  VacancyItem,
} from "@/modules/candidate/services/candidate-dashboard";
import { ForcePasswordChangeAlert } from "../password/force-password-change-alert";

export interface ActiveEmployeePortalViewProps {
  employment: ActiveEmploymentData;
  initialData: CandidateDashboardData;
}

export function ActiveEmployeePortalView({
  employment,
  initialData,
}: ActiveEmployeePortalViewProps) {
  const [showJobMarket, setShowJobMarket] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  // Company logo fallback initials
  const companyInitials = useMemo(() => {
    if (!employment.companyName) return "EM";
    const parts = employment.companyName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return employment.companyName.substring(0, 2).toUpperCase();
  }, [employment.companyName]);

  // Vacation percentage
  const vacationTakenPercent = useMemo(() => {
    if (employment.vacationDaysTotal <= 0) return 0;
    const pct = Math.round(
      (employment.vacationDaysTaken / employment.vacationDaysTotal) * 100
    );
    return Math.min(100, Math.max(0, pct));
  }, [employment.vacationDaysTotal, employment.vacationDaysTaken]);

  // Filtered vacancies for the internal mobility section
  const filteredVacancies = useMemo(() => {
    const list = initialData.nearbyVacancies || [];
    if (!jobSearchQuery.trim()) return list.slice(0, 6);
    const q = jobSearchQuery.toLowerCase().trim();
    return list
      .filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.companyName.toLowerCase().includes(q) ||
          v.location.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [initialData.nearbyVacancies, jobSearchQuery]);

  const toggleSaveJob = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info("Vacante retirada de guardados");
      } else {
        next.add(id);
        toast.success("Vacante guardada");
      }
      return next;
    });
  };

  const shareJob = (e: React.MouseEvent, job: VacancyItem) => {
    e.stopPropagation();
    const url = `${window.location.origin}/dashboard/candidate/vacancies/${job.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Enlace de vacante copiado");
    } else {
      toast.info(`Enlace: ${url}`);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-16 font-sans">
      {/* ── 0. FORCE PASSWORD CHANGE SECURITY ALERT (DIRECT EMPLOYEE CREATION) ── */}
      <ForcePasswordChangeAlert
        forcePasswordChange={Boolean(employment.forcePasswordChange || initialData.forcePasswordChange)}
      />

      {/* ── 1. URGENT PENDING CONTRACT SIGNATURE BANNER ── */}
      {employment.contract?.isPendingSignature && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <FileCheck2 className="size-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-100">
                  ¡Tienes un contrato laboral pendiente de firma digital!
                </h2>
                <span className="size-2 rounded-full bg-amber-500 animate-ping" />
              </div>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 font-medium">
                {employment.companyName} ha emitido tu contrato laboral (Folio:{" "}
                <span className="font-mono font-semibold">{employment.contract.folio}</span>).
                Revisa las cláusulas y estampa tu firma legal con validez oficial LFT.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/candidate/contracts"
            className="shrink-0 w-full sm:w-auto"
          >
            <Button className="w-full sm:w-auto h-10 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 cursor-pointer shadow-xs">
              <FileCheck2 className="size-3.5" />
              Firmar Contrato Ahora
            </Button>
          </Link>
        </div>
      )}

      {/* ── 2. CORPORATE IDENTITY HERO CARD ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* Company Avatar / Logo */}
            <Avatar className="size-16 sm:size-20 rounded-2xl border-2 border-border/60 shadow-md ring-2 ring-primary/20 shrink-0">
              <AvatarImage
                src={employment.companyLogoUrl || ""}
                alt={employment.companyName}
                className="object-cover"
              />
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-black text-xl sm:text-2xl">
                {companyInitials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full gap-1.5"
                >
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Empleado Activo
                </Badge>
                {employment.department && (
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-semibold py-0.5 px-2.5 rounded-full"
                  >
                    {employment.department}
                  </Badge>
                )}
                {employment.employeeCode && (
                  <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted/70 px-2 py-0.5 rounded-md">
                    No. {employment.employeeCode}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
                {employment.jobTitle || "Puesto Asignado"}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  <Building2 className="size-3.5 text-primary" />
                  {employment.companyName}
                </span>
                {employment.companyRfc && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[11px]">RFC: {employment.companyRfc}</span>
                  </>
                )}
                {employment.companyAddress && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      <span className="truncate max-w-[200px]">{employment.companyAddress}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge Group */}
          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-border/50">
            <div className="flex items-center gap-2 text-xs bg-muted/60 border border-border/60 rounded-xl px-3 py-1.5">
              <Calendar className="size-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground">Antigüedad:</span>
              <span className="font-bold text-foreground">{employment.seniorityFormatted}</span>
            </div>

            {employment.hireDate && (
              <div className="flex items-center gap-2 text-xs bg-muted/60 border border-border/60 rounded-xl px-3 py-1.5">
                <Clock className="size-3.5 text-primary shrink-0" />
                <span className="text-muted-foreground">Ingreso:</span>
                <span className="font-semibold text-foreground font-mono">{employment.hireDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. FOUR KEY OPERATIONAL KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: MI JORNADA HOY */}
        <Card className="p-5 rounded-3xl border-border/70 hover:border-primary/40 transition-all shadow-2xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Mi Jornada Hoy
              </span>
              <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Clock className="size-4" />
              </div>
            </div>

            {employment.todayAttendance?.hasCheckedIn ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground font-mono">
                    {employment.todayAttendance.checkInTime}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2 py-0.5"
                  >
                    Entrada
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {employment.todayAttendance.hasCheckedOut
                    ? `Salida: ${employment.todayAttendance.checkOutTime}`
                    : "Turno en curso"}
                </p>
                {employment.todayAttendance.delayMinutes > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold mt-1"
                  >
                    +{employment.todayAttendance.delayMinutes} min retardo
                  </Badge>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-lg font-bold text-foreground block">
                  Sin Registro
                </span>
                <p className="text-xs text-muted-foreground">
                  Horario habitual: {employment.workSchedule || "08:00 - 17:00"}
                </p>
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 px-2 py-0.5 mt-1"
                >
                  Pendiente de checador
                </Badge>
              </div>
            )}
          </div>

          <div className="pt-4 mt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Control de Asistencia LFT</span>
            <CheckCircle2 className="size-3.5 text-emerald-500" />
          </div>
        </Card>

        {/* CARD 2: VACACIONES LFT */}
        <Card className="p-5 rounded-3xl border-border/70 hover:border-primary/40 transition-all shadow-2xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Vacaciones LFT
              </span>
              <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Palmtree className="size-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {employment.vacationDaysAvailable}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  días disponibles
                </span>
              </div>
              <Progress value={vacationTakenPercent} className="h-1.5" />
              <p className="text-[11px] text-muted-foreground">
                De {employment.vacationDaysTotal} días por ley • {employment.vacationDaysTaken} gozados
              </p>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-border/50">
            <Link href="/dashboard/candidate/leaves" className="w-full block">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 px-2 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 justify-between cursor-pointer rounded-xl"
              >
                <span>Solicitar Permiso</span>
                <ArrowUpRight className="size-3" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* CARD 3: MI CONTRATO LABORAL */}
        <Card className="p-5 rounded-3xl border-border/70 hover:border-primary/40 transition-all shadow-2xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Mi Contrato
              </span>
              <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <FileCheck2 className="size-4" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-black font-mono text-foreground block truncate">
                {employment.contract?.folio || "KNP-CT-FORMAL"}
              </span>
              <p className="text-xs text-muted-foreground">
                Tipo: {employment.contract?.contractType || "Indeterminado"}
              </p>
              {employment.contract?.isPendingSignature ? (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 px-2 py-0.5"
                >
                  Firma requerida
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2 py-0.5"
                >
                  Firmado & Vigente
                </Badge>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-border/50">
            <Link href="/dashboard/candidate/contracts" className="w-full block">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 px-2 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 justify-between cursor-pointer rounded-xl"
              >
                <span>Ver Contratos</span>
                <ArrowUpRight className="size-3" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* CARD 4: NÓMINA & SUELDO */}
        <Card className="p-5 rounded-3xl border-border/70 hover:border-primary/40 transition-all shadow-2xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Nómina & Sueldo
              </span>
              <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <DollarSign className="size-4" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                {employment.baseSalaryMonthly
                  ? formatSalaryDisplay(employment.baseSalaryMonthly)
                  : "En Contrato"}
              </span>
              <p className="text-xs text-muted-foreground capitalize">
                Pago: {employment.paymentFrequency || "Quincenal"}
              </p>
              <Badge
                variant="secondary"
                className="text-[10px] font-medium bg-muted/80 text-muted-foreground"
              >
                Documentos Oficiales LFT
              </Badge>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-border/50">
            <Link href="/dashboard/candidate/documents" className="w-full block">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 px-2 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 justify-between cursor-pointer rounded-xl"
              >
                <span>Mis Documentos</span>
                <ArrowUpRight className="size-3" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* ── 4. SELF-SERVICE QUICK ACTIONS BAR ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-muted/40 border border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Accesos Rápidos de Autogestión
            </h2>
            <p className="text-xs text-muted-foreground">
              Herramientas oficiales para gestionar tu relación laboral con {employment.companyName}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link href="/dashboard/candidate/leaves">
            <Button
              variant="outline"
              className="w-full h-auto py-3 px-3.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 border-border/70 hover:bg-card hover:border-primary/50 transition-all cursor-pointer shadow-2xs"
            >
              <Plane className="size-5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-foreground">Solicitar Permiso</span>
              <span className="text-[10px] text-muted-foreground">Vacaciones LFT</span>
            </Button>
          </Link>

          <Link href="/dashboard/candidate/contracts">
            <Button
              variant="outline"
              className="w-full h-auto py-3 px-3.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 border-border/70 hover:bg-card hover:border-primary/50 transition-all cursor-pointer shadow-2xs"
            >
              <FileCheck2 className="size-5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold text-foreground">Contratos Laborales</span>
              <span className="text-[10px] text-muted-foreground">Firmas y Adendas</span>
            </Button>
          </Link>

          <Link href="/dashboard/candidate/documents">
            <Button
              variant="outline"
              className="w-full h-auto py-3 px-3.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 border-border/70 hover:bg-card hover:border-primary/50 transition-all cursor-pointer shadow-2xs"
            >
              <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-foreground">Mis Documentos</span>
              <span className="text-[10px] text-muted-foreground">RFC, CURP, IMSS</span>
            </Button>
          </Link>

          <Link href="/dashboard/candidate/profile">
            <Button
              variant="outline"
              className="w-full h-auto py-3 px-3.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 border-border/70 hover:bg-card hover:border-primary/50 transition-all cursor-pointer shadow-2xs"
            >
              <User className="size-5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-foreground">Perfil Laboral</span>
              <span className="text-[10px] text-muted-foreground">Habilidades y CV</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 5. SECONDARY COLLAPSIBLE SECTION: BOLSA DE EMPLEO & MOVILIDAD INTERNA ── */}
      <div className="rounded-3xl border border-border/70 bg-card overflow-hidden shadow-2xs transition-all">
        <button
          type="button"
          onClick={() => setShowJobMarket(!showJobMarket)}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Compass className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  Bolsa de Empleo & Movilidad Interna
                </h2>
                <Badge variant="secondary" className="text-[10px] font-semibold py-0.5 px-2">
                  Secundario
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Explora vacantes activas en el sureste mexicano para crecimiento profesional o recomendaciones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-primary hidden sm:inline-block">
              {showJobMarket ? "Ocultar vacantes" : "Explorar vacantes"}
            </span>
            <div className="size-8 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              {showJobMarket ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </div>
          </div>
        </button>

        {showJobMarket && (
          <div className="p-5 sm:p-6 pt-0 border-t border-border/60 space-y-4 animate-in fade-in duration-200">
            {/* Search Input */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  placeholder="Buscar vacante por puesto, empresa o ciudad..."
                  className="pl-10 h-10 rounded-2xl bg-muted/40 border-border/70 text-xs"
                />
              </div>

              <Link href="/dashboard/candidate/discovery" className="shrink-0">
                <Button className="h-10 px-4 rounded-2xl text-xs font-bold gap-1.5 cursor-pointer shadow-2xs">
                  <span>Ver todas las vacantes</span>
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </Link>
            </div>

            {/* Vacancy Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {filteredVacancies.map((job) => {
                const isSaved = savedJobIds.has(job.id);
                return (
                  <div
                    key={job.id}
                    onClick={() => {
                      window.location.href = `/dashboard/candidate/vacancies/${job.id}`;
                    }}
                    className="p-4 rounded-2xl border border-border/60 bg-muted/20 hover:bg-card hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-2xs group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {job.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => toggleSaveJob(e, job.id)}
                            className="p-1 rounded-md text-muted-foreground hover:text-primary transition-colors"
                            aria-label="Guardar empleo"
                          >
                            <Bookmark
                              className={cn(
                                "size-3.5",
                                isSaved && "fill-primary text-primary"
                              )}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => shareJob(e, job)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Compartir empleo"
                          >
                            <Share2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="size-3 text-primary shrink-0" />
                        <span className="truncate">{job.companyName}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-medium py-0 px-2 bg-muted/70 text-muted-foreground"
                        >
                          <MapPin className="size-2.5 mr-1" />
                          {job.location}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-medium py-0 px-2 bg-muted/70 text-muted-foreground"
                        >
                          {job.employmentType}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {job.formattedSalary}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[11px] font-bold text-primary gap-1"
                      >
                        <span>Detalles</span>
                        <ArrowUpRight className="size-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
