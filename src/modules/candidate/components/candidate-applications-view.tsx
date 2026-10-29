"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  RotateCw, 
  X, 
  WifiOff, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  ExternalLink, 
  FileText, 
  FileCheck2, 
  PenTool, 
  Video, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Check, 
  Circle, 
  LayoutGrid, 
  List, 
  ArrowUp, 
  ArrowDown, 
  ArrowUpDown, 
  CalendarCheck, 
  CalendarClock, 
  CalendarPlus, 
  Copy, 
  Loader2, 
  Search, 
  ArrowUpRight, 
  CheckCheck,
} from "@/components/ui/icons";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { 
  type CandidateDashboardData, 
  type CandidateApplication, 
  type CandidateContractSummary 
} from "../services/candidate-dashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CandidateContractModal } from "./contracts/candidate-contract-modal";
import { RescheduleInterviewModal } from "./interviews/reschedule-interview-modal";
import { respondToInterviewAction } from "../actions/interviews";

interface CandidateApplicationsViewProps {
  initialData: CandidateDashboardData;
}

function formatSalary(min?: number | null, max?: number | null): string {
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()} MXN`;
  if (min) return `Desde $${min.toLocaleString()} MXN`;
  if (max) return `Hasta $${max.toLocaleString()} MXN`;
  return "Sueldo no especificado";
}

function buildGoogleCalendarUrl(app: CandidateApplication): string | null {
  if (!app.interviewDetails) return null;
  const interview = app.interviewDetails;
  let startDate: Date;

  if (interview.scheduledInterviewAt) {
    startDate = new Date(interview.scheduledInterviewAt);
  } else if (interview.scheduledAt) {
    startDate = new Date(interview.scheduledAt);
  } else if (interview.date) {
    const time = interview.time ? `${interview.time}:00` : "10:00:00";
    startDate = new Date(`${interview.date}T${time}`);
  } else {
    return null;
  }

  if (isNaN(startDate.getTime())) return null;

  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hr
  const formatGCal = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

  const title = encodeURIComponent(`Entrevista: ${app.position} en ${app.company}`);
  const details = encodeURIComponent(
    `Entrevista de trabajo para la vacante: ${app.position}\n` +
    `Empresa: ${app.company}\n` +
    `Modalidad: ${interview.modality === "virtual" ? "Virtual (Videollamada)" : "Presencial"}\n` +
    (interview.locationOrLink ? `Enlace / Ubicación: ${interview.locationOrLink}\n` : "") +
    (interview.notes ? `Instrucciones del reclutador: ${interview.notes}\n` : "") +
    `\nSincronizado vía K'anPro.`
  );
  const location = encodeURIComponent(
    interview.locationOrLink || (interview.modality === "virtual" ? "Videollamada" : "Oficinas de la empresa")
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGCal(startDate)}/${formatGCal(endDate)}&details=${details}&location=${location}`;
}

function ApplicationStatusBadge({ 
  status, 
  statusLabel 
}: { 
  status: string; 
  statusLabel: string; 
}) {
  if (status === "Contratado") {
    return (
      <Badge 
        variant="outline" 
        className="gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 rounded-md px-2.5 py-0.5 select-none"
      >
        <CheckCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
        <span>{statusLabel}</span>
      </Badge>
    );
  }

  if (status === "Preseleccionado" || status === "En revisión" || status === "Entrevista") {
    return (
      <Badge 
        variant="outline" 
        className="gap-1 text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 rounded-md px-2.5 py-0.5 select-none"
      >
        <Clock className="size-3 text-amber-600 dark:text-amber-400" />
        <span>{statusLabel}</span>
      </Badge>
    );
  }

  if (status === "Descartado") {
    return (
      <Badge 
        variant="outline" 
        className="gap-1 text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25 rounded-md px-2.5 py-0.5 select-none"
      >
        <X className="size-3 text-rose-600 dark:text-rose-400" />
        <span>{statusLabel}</span>
      </Badge>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className="gap-1 text-[11px] font-medium py-0.5 px-2.5 bg-muted/60 text-muted-foreground border-border/60 rounded-md select-none"
    >
      <Clock className="size-3 text-muted-foreground" />
      <span>{statusLabel}</span>
    </Badge>
  );
}

export function CandidateApplicationsView({ initialData }: CandidateApplicationsViewProps) {
  const router = useRouter();
  const searchInputId = React.useId();
  const { profile, applications } = initialData;

  // View mode switcher: "cards" | "table"
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("cards");

  // Search and filter tab state
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedFilterIndex, setSelectedFilterIndex] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [hasError, setHasError] = React.useState<boolean>(false);

  // Selected application for detail modal
  const [selectedApp, setSelectedApp] = React.useState<CandidateApplication | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState<boolean>(false);

  // Contract modal state
  const [selectedContract, setSelectedContract] = React.useState<CandidateContractSummary | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = React.useState<boolean>(false);

  // Reschedule interview modal state
  const [rescheduleTarget, setRescheduleTarget] = React.useState<CandidateApplication | null>(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = React.useState<boolean>(false);
  const [confirmingAppId, setConfirmingAppId] = React.useState<string | null>(null);
  const [copiedAppId, setCopiedAppId] = React.useState<string | null>(null);

  const handleOpenContract = (contract: CandidateContractSummary) => {
    setSelectedContract(contract);
    setIsContractModalOpen(true);
  };

  const handleOpenReschedule = (app: CandidateApplication) => {
    setRescheduleTarget(app);
    setIsRescheduleModalOpen(true);
  };

  const handleConfirmInterview = async (applicationId: string) => {
    try {
      setConfirmingAppId(applicationId);
      const res = await respondToInterviewAction({
        applicationId,
        response: "confirm",
      });
      if (!res.success) {
        throw new Error(res.error || "Error al confirmar la entrevista");
      }
      toast.success("¡Asistencia confirmada!", {
        description: res.message || "La empresa ha sido notificada de tu confirmación.",
      });
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al confirmar la entrevista";
      toast.error(message);
    } finally {
      setConfirmingAppId(null);
    }
  };

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAppId(id);
    toast.success("Enlace copiado al portapapeles");
    setTimeout(() => setCopiedAppId(null), 2500);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    router.refresh();
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  const handleOpenDetail = (app: CandidateApplication) => {
    setSelectedApp(app);
    setIsSheetOpen(true);
  };

  // Filter application counts
  const inReviewCount = React.useMemo(
    () => applications.filter((a) => a.status === "Pendiente" || a.status === "En revisión").length,
    [applications]
  );

  const inSelectionCount = React.useMemo(
    () => applications.filter((a) => a.status === "Preseleccionado" || a.status === "Entrevista" || a.status === "Contratado").length,
    [applications]
  );

  const discardedCount = React.useMemo(
    () => applications.filter((a) => a.status === "Descartado").length,
    [applications]
  );

  const filterTabs = [
    { id: 0, label: "Todas", count: applications.length },
    { id: 1, label: "En revisión", count: inReviewCount },
    { id: 2, label: "Entrevistas / Selección", count: inSelectionCount },
    { id: 3, label: "Finalizadas", count: discardedCount },
  ];

  // Combined search & status filtering
  const filteredApplications = React.useMemo(() => {
    let list = [...applications];

    // Status category filter
    if (selectedFilterIndex === 1) {
      list = list.filter((a) => a.status === "Pendiente" || a.status === "En revisión");
    } else if (selectedFilterIndex === 2) {
      list = list.filter((a) => a.status === "Preseleccionado" || a.status === "Entrevista" || a.status === "Contratado");
    } else if (selectedFilterIndex === 3) {
      list = list.filter((a) => a.status === "Descartado");
    }

    // Text search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.position.toLowerCase().includes(q) ||
          a.company.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q)
      );
    }

    return list;
  }, [applications, selectedFilterIndex, searchQuery]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-16 font-sans">
      
      {/* ── 0. SEARCH & CATEGORIES HEADER (Coherent with Candidate Dashboard) ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <label htmlFor={searchInputId} className="sr-only">
              Buscar en mis postulaciones por puesto, empresa o ubicación
            </label>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id={searchInputId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por puesto, empresa o ubicación..."
              className="h-11 rounded-2xl bg-card border-border/70 pl-10 pr-10 text-xs sm:text-sm placeholder:text-muted-foreground shadow-2xs focus-visible:ring-primary/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Explore Catalog CTA */}
          <Link href="/dashboard/candidate/discovery" className="shrink-0">
            <Button className="h-11 px-5 rounded-2xl text-xs sm:text-sm font-semibold gap-2 shadow-xs cursor-pointer w-full sm:w-auto">
              <Sparkles className="size-4" />
              Explorar nuevas vacantes
            </Button>
          </Link>
        </div>

        {/* Status Pills (identical to Dashboard Category Chips) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar pt-1" role="tablist" aria-label="Filtrar por estatus de postulación">
          {filterTabs.map((tab) => {
            const isSelected = selectedFilterIndex === tab.id;
            return (
              <Badge
                key={tab.id}
                variant={isSelected ? "default" : "outline"}
                onClick={() => setSelectedFilterIndex(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all shadow-2xs select-none",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border-border/70"
                )}
              >
                {tab.label} ({tab.count})
              </Badge>
            );
          })}
        </div>
      </div>

      {/* ── 1. SECTION HEADING & VIEW CONTROLS (Coherent with Dashboard / Empleos Cerca de Ti) ── */}
      <section className="space-y-4 pt-1" aria-labelledby="applications-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
                <FileText className="size-4" />
              </div>
              <h2 id="applications-heading" className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Mis Postulaciones
              </h2>
              <Badge variant="secondary" className="px-2.5 py-0.5 rounded-full text-xs font-semibold">
                {filteredApplications.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitorea en tiempo real el avance de tus procesos de selección, entrevistas y contratos.
            </p>
          </div>

          {/* Controls: View Mode & Refresh */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1 bg-card border border-border/70 p-1 rounded-2xl shadow-2xs" role="group" aria-label="Modo de visualización">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className={cn(
                  "h-7 text-xs rounded-xl px-2.5 font-medium gap-1 cursor-pointer transition-all",
                  viewMode === "cards" ? "shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-3" />
                <span>Tarjetas</span>
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={cn(
                  "h-7 text-xs rounded-xl px-2.5 font-medium gap-1 cursor-pointer transition-all",
                  viewMode === "table" ? "shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-3" />
                <span>Tabla</span>
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-9 px-3 rounded-xl border-border/70 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
              aria-label="Actualizar postulaciones"
            >
              <RotateCw className={cn("size-3.5", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          </div>
        </div>

        {/* ── 2. FEED CONTENT AREA (CARDS OR TABLE) ── */}
        {isLoading ? (
          /* Skeleton Loader */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-border/70 rounded-3xl p-5 space-y-4 shadow-2xs"
              >
                <div className="flex items-start gap-4">
                  <Skeleton className="size-12 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4 rounded-md" />
                    <Skeleton className="h-5 w-1/2 rounded-md" />
                    <Skeleton className="h-3.5 w-1/3 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-md" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : hasError ? (
          /* Error State */
          <div className="rounded-3xl bg-card border border-destructive/30 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="size-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4 border border-destructive/20 shadow-2xs">
              <WifiOff className="size-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              Error al consultar postulaciones
            </h3>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
              No pudimos conectar con el servidor para sincronizar tus postulaciones en este momento.
            </p>
            <Button
              onClick={handleRefresh}
              className="h-9 px-4 rounded-xl text-xs font-semibold shadow-xs cursor-pointer gap-2"
            >
              <RotateCw className="size-3.5" />
              <span>Reintentar</span>
            </Button>
          </div>
        ) : filteredApplications.length === 0 ? (
          /* Empty State matching Dashboard & Discovery */
          <div className="rounded-3xl bg-card border border-border/70 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="size-14 rounded-2xl bg-muted text-foreground flex items-center justify-center mb-4 border border-border/70 shadow-2xs">
              <Briefcase className="size-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              {searchQuery || selectedFilterIndex !== 0
                ? "No se encontraron postulaciones con estos filtros"
                : "Aún no te has postulado a ninguna vacante"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
              {searchQuery || selectedFilterIndex !== 0
                ? "Intenta buscar con otros términos o limpia los filtros activos para ver todo tu historial."
                : "Encuentra ofertas laborales acordes a tu perfil en la sección de exploración y postúlate con un solo clic."}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {(searchQuery || selectedFilterIndex !== 0) && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedFilterIndex(0);
                  }}
                  className="h-9 px-4 rounded-xl border-border/70 text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Limpiar filtros
                </Button>
              )}
              <Link href="/dashboard/candidate/discovery">
                <Button 
                  className="h-9 px-4 rounded-xl text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
                >
                  <Sparkles className="size-3.5" />
                  Explorar vacantes
                </Button>
              </Link>
            </div>
          </div>
        ) : viewMode === "table" ? (
          /* TanStack Table View */
          <CandidateApplicationsTable
            data={filteredApplications}
            onOpenDetail={handleOpenDetail}
            onOpenContract={handleOpenContract}
          />
        ) : (
          /* Cards View matching Candidate Dashboard */
          <div className="space-y-3">
            {filteredApplications.map((app) => {
              const companyInitials = app.company ? app.company.substring(0, 2).toUpperCase() : "EM";

              return (
                <div
                  key={app.id}
                  onClick={() => handleOpenDetail(app)}
                  className="bg-card border border-border/70 hover:border-border hover:bg-muted/30 rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-2xs transition-colors duration-150 cursor-pointer relative overflow-hidden group"
                >
                  {/* Top Row: Company Avatar + Position + Status Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Avatar */}
                      <Avatar className="size-12 rounded-2xl ring-1 ring-border/60 shrink-0 shadow-2xs">
                        {app.logoUrl ? (
                          <AvatarImage src={app.logoUrl} alt={app.company} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="rounded-2xl font-bold text-xs bg-muted text-foreground">
                          {companyInitials}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info Header */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground truncate flex items-center gap-1">
                            {app.company}
                            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
                          {app.position}
                        </h3>

                        {/* Metadata Pills */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap pt-0.5">
                          <Badge variant="secondary" className="gap-1 text-[11px] font-medium py-0.5 px-2 bg-muted/60 text-muted-foreground border-border/60">
                            <MapPin className="size-3 shrink-0" />
                            <span>{app.location}</span>
                          </Badge>
                          <Badge variant="secondary" className="gap-1 text-[11px] font-medium py-0.5 px-2 bg-muted/60 text-muted-foreground border-border/60">
                            <Calendar className="size-3 shrink-0" />
                            <span>Postulado {app.appliedDate}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge Pill */}
                    <div className="shrink-0 self-start">
                      <ApplicationStatusBadge status={app.status} statusLabel={app.statusLabel} />
                    </div>
                  </div>

                  {/* Stepper Progress Bar */}
                  <ApplicationStepper status={app.status} progress={app.progress} />

                  {/* Scheduled Interview Interactive Section */}
                  {app.interviewDetails && (
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      className="p-4 sm:p-5 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 space-y-3.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                            {app.interviewDetails.modality === "virtual" ? (
                              <Video className="size-4.5" />
                            ) : (
                              <MapPin className="size-4.5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-foreground">
                                Entrevista {app.interviewDetails.modality === "virtual" ? "Virtual" : "Presencial"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                              <Calendar className="size-3.5" />
                              <span>
                                {app.interviewDetails.date}
                                {app.interviewDetails.time ? ` a las ${app.interviewDetails.time} hrs` : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center self-start sm:self-auto">
                          {app.interviewDetails.status === "confirmed" ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-xs gap-1.5 px-2.5 py-1">
                              <CalendarCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Asistencia Confirmada</span>
                            </Badge>
                          ) : app.interviewDetails.status === "reschedule_requested" ? (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold text-xs gap-1.5 px-2.5 py-1">
                              <CalendarClock className="size-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Reagendamiento Solicitado</span>
                            </Badge>
                          ) : app.interviewDetails.status === "cancelled" ? (
                            <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold text-xs gap-1 px-2.5 py-1">
                              <X className="size-3.5" />
                              <span>Cancelada</span>
                            </Badge>
                          ) : app.interviewDetails.status === "completed" ? (
                            <Badge className="bg-muted text-muted-foreground border-border font-bold text-xs gap-1 px-2.5 py-1">
                              <Check className="size-3.5" />
                              <span>Concluida</span>
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold text-xs gap-1.5 px-2.5 py-1">
                              <Clock className="size-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Confirmación Pendiente</span>
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Location or Video Link */}
                      {app.interviewDetails.locationOrLink && (
                        <div className="bg-background/90 dark:bg-card/90 rounded-xl p-3 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {app.interviewDetails.modality === "virtual" ? (
                              <Video className="size-4 text-primary shrink-0" />
                            ) : (
                              <MapPin className="size-4 text-primary shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                {app.interviewDetails.modality === "virtual" ? "Enlace de Reunión" : "Ubicación / Sede"}
                              </span>
                              {app.interviewDetails.modality === "virtual" && app.interviewDetails.locationOrLink.startsWith("http") ? (
                                <a
                                  href={app.interviewDetails.locationOrLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-primary hover:underline truncate block"
                                >
                                  {app.interviewDetails.locationOrLink}
                                </a>
                              ) : (
                                <span className="font-semibold text-foreground truncate block">
                                  {app.interviewDetails.locationOrLink}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            {app.interviewDetails.modality === "virtual" && app.interviewDetails.locationOrLink.startsWith("http") && (
                              <a
                                href={app.interviewDetails.locationOrLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-colors shadow-2xs"
                              >
                                <span>Unirse</span>
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyLink(app.interviewDetails!.locationOrLink, app.id);
                              }}
                              className="h-7 text-xs rounded-lg px-2.5"
                            >
                              {copiedAppId === app.id ? (
                                <>
                                  <Check className="size-3 text-emerald-600" />
                                  <span className="text-emerald-700 dark:text-emerald-300">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Recruiter Notes */}
                      {app.interviewDetails.notes && (
                        <div className="text-xs bg-muted/60 p-2.5 rounded-xl border border-border/60 text-muted-foreground">
                          <span className="font-bold text-foreground mr-1">Indicaciones:</span>
                          <span className="italic">&ldquo;{app.interviewDetails.notes}&rdquo;</span>
                        </div>
                      )}

                      {/* Reschedule banner */}
                      {app.interviewDetails.status === "reschedule_requested" && (
                        <div className="text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-900 dark:text-amber-200 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                            <CalendarClock className="size-3.5" />
                            <span>Solicitud de reagendamiento enviada</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                            Propuesta: <span className="font-semibold">{app.interviewDetails.proposedDate || "Fecha a coordinar"} {app.interviewDetails.proposedTime ? `a las ${app.interviewDetails.proposedTime} hrs` : ""}</span>.
                            {app.interviewDetails.candidateResponseNotes && ` Motivo: "${app.interviewDetails.candidateResponseNotes}".`}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-primary/20">
                        {app.interviewDetails.status !== "confirmed" && app.interviewDetails.status !== "cancelled" && app.interviewDetails.status !== "completed" && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmInterview(app.id);
                            }}
                            disabled={confirmingAppId === app.id}
                            className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-2xs cursor-pointer"
                          >
                            {confirmingAppId === app.id ? (
                              <>
                                <Loader2 className="size-3 animate-spin" />
                                <span>Confirmando...</span>
                              </>
                            ) : (
                              <>
                                <CalendarCheck className="size-3.5" />
                                <span>Confirmar Asistencia</span>
                              </>
                            )}
                          </Button>
                        )}

                        {app.interviewDetails.status !== "cancelled" && app.interviewDetails.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReschedule(app);
                            }}
                            className="h-8 rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 font-bold text-xs gap-1.5 cursor-pointer"
                          >
                            <CalendarClock className="size-3.5 text-amber-600 dark:text-amber-400" />
                            <span>{app.interviewDetails.status === "reschedule_requested" ? "Cambiar Propuesta" : "Solicitar Reagendar"}</span>
                          </Button>
                        )}

                        {(() => {
                          const gcalUrl = buildGoogleCalendarUrl(app);
                          if (!gcalUrl) return null;
                          return (
                            <a
                              href={gcalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-bold text-xs transition-colors shadow-2xs ml-auto"
                            >
                              <CalendarPlus className="size-3.5 text-primary" />
                              <span>Google Calendar</span>
                            </a>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Contract Hired Banner */}
                  {(app.status === "Contratado" || app.contract) && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                          <FileCheck2 className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-xs text-emerald-950 dark:text-emerald-100">
                              ¡Contratación Exitosa!
                            </p>
                            {app.contract && (
                              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                                {app.contract.folio}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                            {app.contract
                              ? app.contract.employeeSigned
                                ? "Contrato laboral formalizado y vigente conforme a la LFT."
                                : "Contrato formal generado. Requiere tu firma digital para entrar en vigor."
                              : "Tu proceso concluyó positivamente. Contrato formal en emisión."}
                          </p>
                        </div>
                      </div>

                      {app.contract && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenContract(app.contract!);
                          }}
                          className={cn(
                            "w-full sm:w-auto h-8 rounded-xl text-xs font-bold gap-1.5 shrink-0 cursor-pointer shadow-xs",
                            !app.contract.employeeSigned
                              ? "bg-amber-600 hover:bg-amber-700 text-white"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          )}
                        >
                          {!app.contract.employeeSigned ? (
                            <>
                              <PenTool className="size-3" />
                              <span>Firmar Contrato</span>
                            </>
                          ) : (
                            <>
                              <FileText className="size-3" />
                              <span>Ver Contrato</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Footer Row: Salary & CTA (Matching Dashboard) */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                        Sueldo especificado
                      </span>
                      <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatSalary(app.salary_min, app.salary_max)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(app);
                        }}
                        className="h-8 px-3 rounded-xl text-xs font-semibold border-border/70 gap-1 cursor-pointer shadow-2xs hover:bg-muted"
                      >
                        Ver detalles
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 3. APPLICATION DETAILS MODAL (Coherent with Discovery Detail Sheet) ── */}
      <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        {selectedApp && (
          <DialogContent className="sm:max-w-lg rounded-3xl bg-card border-border/70 p-6 sm:p-7 shadow-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/70">
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Detalles de la Postulación
              </DialogTitle>
              <ApplicationStatusBadge 
                status={selectedApp.status} 
                statusLabel={selectedApp.statusLabel} 
              />
            </DialogHeader>

            <div className="py-4 space-y-5">
              {/* Header inside modal */}
              <div className="flex items-start gap-3.5">
                <Avatar className="size-12 rounded-2xl ring-1 ring-border/60 shrink-0 shadow-2xs">
                  {selectedApp.logoUrl ? (
                    <AvatarImage src={selectedApp.logoUrl} alt={selectedApp.company} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="rounded-2xl font-bold text-xs bg-muted text-foreground">
                    {selectedApp.company ? selectedApp.company.substring(0, 2).toUpperCase() : "EM"}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-lg font-bold text-foreground tracking-tight leading-snug">
                    {selectedApp.position}
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    {selectedApp.company} • {selectedApp.location}
                  </p>
                  <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 pt-0.5">
                    {formatSalary(selectedApp.salary_min, selectedApp.salary_max)}
                  </p>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="pt-2 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Línea de Tiempo del Proceso
                </h4>

                <div className="space-y-4 pl-1">
                  <TimelineStep
                    title="Postulación enviada"
                    subtitle="Tu información fue registrada en la plataforma."
                    dateString={selectedApp.appliedDate}
                    isCompleted={true}
                    isCurrent={selectedApp.status === "Pendiente"}
                  />
                  <TimelineStep
                    title="Revisión por el Reclutador"
                    subtitle="El equipo de selección analiza tu CV y aptitudes."
                    dateString={selectedApp.progress >= 50 ? "Completado" : "Pendiente"}
                    isCompleted={selectedApp.progress >= 50}
                    isCurrent={selectedApp.status === "En revisión"}
                  />
                  <TimelineStep
                    title="Entrevista o Evaluación"
                    subtitle={
                      selectedApp.interviewDetails
                        ? selectedApp.interviewDetails.status === "confirmed"
                          ? `Asistencia confirmada para el ${selectedApp.interviewDetails.date}`
                          : selectedApp.interviewDetails.status === "reschedule_requested"
                          ? `Reagendamiento solicitado (${selectedApp.interviewDetails.proposedDate || "nueva fecha"})`
                          : `Cita programada para el ${selectedApp.interviewDetails.date}`
                        : "Coordinación de cita presencial o virtual."
                    }
                    dateString={
                      selectedApp.interviewDetails
                        ? selectedApp.interviewDetails.date
                        : selectedApp.progress >= 75
                        ? "Completado"
                        : "Pendiente"
                    }
                    isCompleted={selectedApp.progress >= 75 || Boolean(selectedApp.interviewDetails)}
                    isCurrent={selectedApp.status === "Preseleccionado" || selectedApp.status === "Entrevista"}
                  />
                  <TimelineStep
                    title="Decisión Final y Selección"
                    subtitle="Confirmación de contratación para la vacante."
                    dateString={selectedApp.status === "Contratado" ? "Completado" : "Pendiente"}
                    isCompleted={selectedApp.status === "Contratado"}
                    isCurrent={selectedApp.status === "Contratado"}
                    isLast={true}
                  />
                </div>
              </div>

              {/* Scheduled Interview Details Card in Modal */}
              {selectedApp.interviewDetails && (
                <div className="p-4 sm:p-5 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      {selectedApp.interviewDetails.modality === "virtual" ? (
                        <Video className="size-4" />
                      ) : (
                        <MapPin className="size-4" />
                      )}
                      <span>Cita de Entrevista</span>
                    </div>

                    <div>
                      {selectedApp.interviewDetails.status === "confirmed" ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-[11px] gap-1 px-2 py-0.5">
                          <CalendarCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Asistencia Confirmada</span>
                        </Badge>
                      ) : selectedApp.interviewDetails.status === "reschedule_requested" ? (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold text-[11px] gap-1 px-2 py-0.5">
                          <CalendarClock className="size-3 text-amber-600 dark:text-amber-400" />
                          <span>Reagendamiento Solicitado</span>
                        </Badge>
                      ) : selectedApp.interviewDetails.status === "cancelled" ? (
                        <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-bold text-[11px] px-2 py-0.5">
                          <span>Cancelada</span>
                        </Badge>
                      ) : selectedApp.interviewDetails.status === "completed" ? (
                        <Badge className="bg-muted text-muted-foreground border-border font-bold text-[11px] px-2 py-0.5">
                          <span>Concluida</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-bold text-[11px] gap-1 px-2 py-0.5">
                          <Clock className="size-3 text-blue-600 dark:text-blue-400" />
                          <span>Confirmación Pendiente</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Fecha y hora:</span>
                      <span className="font-bold text-foreground">
                        {selectedApp.interviewDetails.date} {selectedApp.interviewDetails.time ? `a las ${selectedApp.interviewDetails.time} hrs` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Modalidad:</span>
                      <span className="font-bold text-foreground capitalize">
                        {selectedApp.interviewDetails.modality === "virtual" ? "Videollamada / Virtual" : "Presencial"}
                      </span>
                    </div>

                    {selectedApp.interviewDetails.locationOrLink && (
                      <div className="pt-2 border-t border-primary/20 space-y-1.5">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          {selectedApp.interviewDetails.modality === "virtual" ? "Enlace de Videollamada:" : "Ubicación / Sede:"}
                        </span>
                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-background/90 dark:bg-card/90 border border-border/80">
                          {selectedApp.interviewDetails.modality === "virtual" && selectedApp.interviewDetails.locationOrLink.startsWith("http") ? (
                            <a
                              href={selectedApp.interviewDetails.locationOrLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-primary hover:underline truncate text-xs flex-1"
                            >
                              {selectedApp.interviewDetails.locationOrLink}
                            </a>
                          ) : (
                            <span className="font-semibold text-foreground truncate text-xs flex-1">
                              {selectedApp.interviewDetails.locationOrLink}
                            </span>
                          )}

                          <div className="flex items-center gap-1 shrink-0">
                            {selectedApp.interviewDetails.modality === "virtual" && selectedApp.interviewDetails.locationOrLink.startsWith("http") && (
                              <a
                                href={selectedApp.interviewDetails.locationOrLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                              >
                                <span>Unirse</span>
                                <ExternalLink className="size-2.5" />
                              </a>
                            )}
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleCopyLink(selectedApp.interviewDetails!.locationOrLink, selectedApp.id)}
                              className="h-6 px-2 text-[11px]"
                            >
                              {copiedAppId === selectedApp.id ? (
                                <>
                                  <Check className="size-2.5 text-emerald-600" />
                                  <span className="text-emerald-700 dark:text-emerald-300">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-2.5" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-primary/20 flex flex-wrap items-center gap-2">
                      {selectedApp.interviewDetails.status !== "confirmed" && selectedApp.interviewDetails.status !== "cancelled" && selectedApp.interviewDetails.status !== "completed" && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmInterview(selectedApp.id)}
                          disabled={confirmingAppId === selectedApp.id}
                          className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-2xs cursor-pointer flex-1"
                        >
                          {confirmingAppId === selectedApp.id ? (
                            <>
                              <Loader2 className="size-3 animate-spin" />
                              <span>Confirmando...</span>
                            </>
                          ) : (
                            <>
                              <CalendarCheck className="size-3.5" />
                              <span>Confirmar Asistencia</span>
                            </>
                          )}
                        </Button>
                      )}

                      {selectedApp.interviewDetails.status !== "cancelled" && selectedApp.interviewDetails.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsSheetOpen(false);
                            handleOpenReschedule(selectedApp);
                          }}
                          className="h-8 rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 font-bold text-xs gap-1.5 cursor-pointer flex-1"
                        >
                          <CalendarClock className="size-3.5 text-amber-600 dark:text-amber-400" />
                          <span>{selectedApp.interviewDetails.status === "reschedule_requested" ? "Cambiar Propuesta" : "Solicitar Reagendar"}</span>
                        </Button>
                      )}

                      {(() => {
                        const gcalUrl = buildGoogleCalendarUrl(selectedApp);
                        if (!gcalUrl) return null;
                        return (
                          <a
                            href={gcalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-bold text-xs transition-colors shadow-2xs w-full"
                          >
                            <CalendarPlus className="size-3.5 text-primary" />
                            <span>Añadir a Google Calendar</span>
                          </a>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Formal Employment Contract Section in Modal */}
              {(selectedApp.status === "Contratado" || selectedApp.contract) && (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                      <FileCheck2 className="size-4.5" />
                      <span>Contrato Laboral y Formalización</span>
                    </div>
                    {selectedApp.contract && (
                      <Badge variant="outline" className="font-mono text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                        {selectedApp.contract.folio}
                      </Badge>
                    )}
                  </div>

                  {selectedApp.contract ? (
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Puesto oficial:</span>
                        <span className="font-bold text-foreground">{selectedApp.contract.jobTitle}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tipo de contrato:</span>
                        <span className="font-bold text-foreground">{selectedApp.contract.contractType}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Sueldo pactado:</span>
                        <span className="font-extrabold text-foreground">
                          ${Number(selectedApp.contract.salary).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN ({selectedApp.contract.paymentFrequency})
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Firma del trabajador:</span>
                        <span className={cn("font-extrabold", selectedApp.contract.employeeSigned ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                          {selectedApp.contract.employeeSigned ? "✓ Firmado digitalmente" : "⚠️ Pendiente de tu firma"}
                        </span>
                      </div>

                      <Button
                        onClick={() => {
                          setIsSheetOpen(false);
                          handleOpenContract(selectedApp.contract!);
                        }}
                        className={cn(
                          "w-full mt-1.5 h-10 rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-xs",
                          !selectedApp.contract.employeeSigned
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                      >
                        {!selectedApp.contract.employeeSigned ? (
                          <>
                            <PenTool className="size-3.5" />
                            <span>Revisar y Estampar Firma Digital</span>
                          </>
                        ) : (
                          <>
                            <FileText className="size-3.5" />
                            <span>Ver Contrato Digital Completo</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      El proceso de selección fue exitoso. El contrato formal de trabajo se encuentra en generación en el sistema.
                    </p>
                  )}
                </div>
              )}

              {/* Direct WhatsApp Call to Action */}
              {selectedApp.companyPhone && (selectedApp.status === "Preseleccionado" || selectedApp.status === "En revisión") && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                    <MessageCircle className="size-4.5" />
                    <span>Contacto directo por WhatsApp</span>
                  </div>
                  <a
                    href={`https://wa.me/${selectedApp.companyPhone.replace(/[^0-9]/g, "")}?text=Hola!%20Soy%20${encodeURIComponent(profile?.full_name || "Candidato")},%20me%20postule%20a%20la%20vacante%20de%20${encodeURIComponent(selectedApp.position)}%20en%20K'anPro.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-2 border-none cursor-pointer">
                      <span>Escribir a la empresa</span>
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSheetOpen(false);
                  if (selectedApp.vacancy_id) {
                    router.push(`/dashboard/candidate/vacancies/${selectedApp.vacancy_id}`);
                  } else {
                    router.push("/dashboard/candidate/discovery");
                  }
                }}
                aria-label="Ver ficha de la vacante"
                className="w-full h-11 rounded-xl border-border/70 text-foreground font-semibold text-xs cursor-pointer hover:bg-muted"
              >
                Ver Ficha de la Vacante
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Candidate Contract Modal */}
      <CandidateContractModal
        isOpen={isContractModalOpen}
        onOpenChange={setIsContractModalOpen}
        contract={selectedContract}
        candidateName={profile?.full_name || "Candidato"}
        candidateRfc={profile?.rfc || null}
        candidateCurp={profile?.curp || null}
        onSigned={() => {
          router.refresh();
        }}
      />

      {/* Candidate Reschedule Interview Modal */}
      {rescheduleTarget && rescheduleTarget.interviewDetails && (
        <RescheduleInterviewModal
          isOpen={isRescheduleModalOpen}
          onOpenChange={setIsRescheduleModalOpen}
          applicationId={rescheduleTarget.id}
          companyName={rescheduleTarget.company}
          vacancyTitle={rescheduleTarget.position}
          currentDate={rescheduleTarget.interviewDetails.date}
          currentTime={rescheduleTarget.interviewDetails.time}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

    </div>
  );
}

/** TanStack Table for Candidate Applications Tabular View (matching Dashboard aesthetics) */
function CandidateApplicationsTable({
  data,
  onOpenDetail,
  onOpenContract,
}: {
  data: CandidateApplication[];
  onOpenDetail: (app: CandidateApplication) => void;
  onOpenContract?: (contract: CandidateContractSummary) => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const columns = React.useMemo<ColumnDef<CandidateApplication>[]>(
    () => [
      {
        accessorKey: "position",
        header: "Vacante / Empresa",
        cell: ({ row }) => {
          const app = row.original;
          const companyInitials = app.company ? app.company.substring(0, 2).toUpperCase() : "EM";

          return (
            <div className="flex items-center gap-3 py-1">
              <Avatar className="size-10 rounded-xl ring-1 ring-border/60 shrink-0 shadow-2xs">
                {app.logoUrl ? (
                  <AvatarImage src={app.logoUrl} alt={app.company} className="object-cover" />
                ) : null}
                <AvatarFallback className="rounded-xl font-bold text-xs bg-muted text-foreground">
                  {companyInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-foreground truncate">
                  {app.position}
                </span>
                <span className="text-xs text-muted-foreground font-medium truncate flex items-center gap-1">
                  {app.company}
                  <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>• {app.location}</span>
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Fecha</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-foreground" />
            ) : (
              <ArrowUpDown className="size-3.5 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-medium text-muted-foreground">
            {row.original.appliedDate}
          </span>
        ),
      },
      {
        accessorKey: "salary_min",
        accessorFn: (row) => row.salary_min || 0,
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Sueldo Mensual</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-foreground" />
            ) : (
              <ArrowUpDown className="size-3.5 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {formatSalary(row.original.salary_min, row.original.salary_max)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Estado</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-foreground" />
            ) : (
              <ArrowUpDown className="size-3.5 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex flex-col gap-1 items-start">
              <ApplicationStatusBadge status={app.status} statusLabel={app.statusLabel} />

              {app.interviewDetails && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border",
                    app.interviewDetails.status === "confirmed"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                      : app.interviewDetails.status === "reschedule_requested"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  <Calendar className="size-2.5" />
                  <span>
                    {app.interviewDetails.status === "confirmed"
                      ? "Cita confirmada: "
                      : app.interviewDetails.status === "reschedule_requested"
                      ? "Reagendar pedido: "
                      : "Cita: "}
                    {app.interviewDetails.date}
                    {app.interviewDetails.time ? ` (${app.interviewDetails.time})` : ""}
                  </span>
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5 py-1">
              {app.contract && (
                <Button
                  size="sm"
                  onClick={() => onOpenContract ? onOpenContract(app.contract!) : onOpenDetail(app)}
                  className={cn(
                    "h-8 px-2.5 text-xs font-bold rounded-xl cursor-pointer shadow-2xs gap-1",
                    !app.contract.employeeSigned
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                >
                  {!app.contract.employeeSigned ? (
                    <>
                      <PenTool className="size-3 mr-0.5" />
                      <span>Firmar</span>
                    </>
                  ) : (
                    <>
                      <FileText className="size-3 mr-0.5" />
                      <span>Contrato</span>
                    </>
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpenDetail(app)}
                className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
              >
                <span>Detalles</span>
                <ArrowUpRight className="size-3.5 ml-1" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onOpenDetail, onOpenContract]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="border border-border/70 rounded-3xl bg-card overflow-hidden shadow-2xs">
      <Table className="w-full">
        <TableHeader className="bg-muted/40 border-b border-border/70">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="py-3 px-4 text-xs font-bold text-foreground">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-28 text-center text-xs font-medium text-muted-foreground">
                No hay postulaciones registradas con estos criterios.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/** 4-Step Stepper Component matching Shadcn tokens */
function ApplicationStepper({ status, progress }: { status: string; progress: number }) {
  const isRejected = status === "Descartado";
  let stepIndex = 0;
  if (progress >= 100) stepIndex = 3;
  else if (progress >= 75) stepIndex = 2;
  else if (progress >= 50) stepIndex = 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((idx) => {
          const isCompleted = idx <= stepIndex;
          let bgColor = "bg-muted";

          if (isRejected) {
            bgColor = idx === 0 ? "bg-primary" : "bg-destructive";
          } else if (isCompleted) {
            bgColor = "bg-primary";
          }

          return (
            <div
              key={idx}
              className={cn("h-1.5 flex-1 rounded-full transition-colors", bgColor)}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span>Postulado</span>
        <span>En Revisión</span>
        <span>Entrevista</span>
        <span>Selección</span>
      </div>
    </div>
  );
}

/** Timeline Step Component */
function TimelineStep({
  title,
  subtitle,
  dateString,
  isCompleted,
  isCurrent,
  isLast = false,
}: {
  title: string;
  subtitle: string;
  dateString: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "size-7 rounded-full flex items-center justify-center border-2 transition-all",
            isCompleted
              ? "bg-primary border-primary text-primary-foreground"
              : isCurrent
              ? "bg-card border-primary text-primary"
              : "bg-muted border-border text-muted-foreground"
          )}
        >
          {isCompleted ? (
            <Check className="size-3.5 stroke-[3]" />
          ) : (
            <Circle className="size-2 fill-current" />
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              "w-0.5 h-10 transition-colors",
              isCompleted ? "bg-primary" : "bg-muted"
            )}
          />
        )}
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center justify-between gap-2">
          <h5
            className={cn(
              "text-sm font-bold leading-tight",
              isCompleted ? "text-foreground" : isCurrent ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {title}
          </h5>
          <span className="text-xs font-medium text-muted-foreground">
            {dateString}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
