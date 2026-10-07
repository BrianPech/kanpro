"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  RotateCw, 
  ChevronRight, 
  X, 
  WifiOff, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  ExternalLink, 
  History,
  FileText,
  FileCheck2,
  PenTool,
  Video,
  MapPin,
  Calendar,
  AlertCircle,
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
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CandidateDashboardData, CandidateApplication, CandidateContractSummary } from "../services/candidate-dashboard";
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

export function CandidateApplicationsView({ initialData }: CandidateApplicationsViewProps) {
  const router = useRouter();
  const { profile, applications } = initialData;

  // View mode switcher: "cards" | "table"
  const [viewMode, setViewMode] = React.useState<"cards" | "table">("cards");

  // Selected filter tab index: 0: Todas, 1: En revisión, 2: Entrevistas / Selección, 3: Finalizadas
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
        description: res?.message || "La empresa ha sido notificada de tu confirmación.",
      });
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Error al confirmar la entrevista");
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

  // Filter applications logic based on Flutter enum statuses
  const filteredApplications = React.useMemo(() => {
    if (selectedFilterIndex === 1) {
      // En revisión (Pendiente or En revisión)
      return applications.filter(
        (a) => a.status === "Pendiente" || a.status === "En revisión"
      );
    } else if (selectedFilterIndex === 2) {
      // Entrevistas / Selección (Preseleccionado, Entrevista, or Contratado)
      return applications.filter(
        (a) => a.status === "Preseleccionado" || a.status === "Entrevista" || a.status === "Contratado"
      );
    } else if (selectedFilterIndex === 3) {
      // Finalizadas (Descartado)
      return applications.filter((a) => a.status === "Descartado");
    }
    return applications;
  }, [applications, selectedFilterIndex]);

  return (
    <div className="flex-grow min-h-full bg-transparent dark:bg-zinc-950 px-6 sm:px-10 lg:px-14 pt-5 pb-28 md:pb-8 space-y-6 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      
      {/* 1. Header (Mis Postulaciones & Actions) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-[26px] sm:text-[32px] font-[800] text-[#1f2732] dark:text-fiord-50 tracking-[-0.6px]">
          Mis Postulaciones
        </h1>
        
        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="inline-flex p-1 rounded-[16px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 shadow-2xs">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded-[12px] text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                  : "text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-200"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-[12px] text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                  : "text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-200"
              }`}
            >
              <List className="size-3.5" />
              <span>Tabla</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            aria-label="Actualizar postulaciones"
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 flex items-center justify-center text-[#344558] dark:text-zinc-200 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <RotateCw className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* 2. Filter Chips Bar */}
      <div className="py-1 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2.5 min-w-max">
          {[
            `Todas (${applications.length})`,
            "En revisión",
            "Entrevistas / Selección",
            "Finalizadas",
          ].map((label, idx) => {
            const isSelected = selectedFilterIndex === idx;
            return (
              <button
                key={label}
                onClick={() => setSelectedFilterIndex(idx)}
                className={`px-4 py-2.5 rounded-[22px] text-[14px] tracking-[-0.2px] transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 font-extrabold border border-transparent shadow-xs"
                    : "bg-[#f5f7fa] dark:bg-zinc-900 text-[#344558] dark:text-zinc-300 font-bold border border-[#ebeef3] dark:border-zinc-800 hover:bg-[#ebeef3] dark:hover:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main View Area (Cards or Tabular Table View) */}
      <div className="pt-2 space-y-5">
        {isLoading ? (
          /* Skeleton Loader */
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[22px] space-y-5 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[14px] bg-[#ebeef3] dark:bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-[#ebeef3] dark:bg-zinc-800 rounded w-1/2" />
                    <div className="h-4 bg-[#ebeef3] dark:bg-zinc-800 rounded w-1/3" />
                  </div>
                </div>
                <div className="w-full h-3 bg-[#ebeef3] dark:bg-zinc-800 rounded-full" />
              </div>
            ))}
          </div>
        ) : hasError ? (
          /* Error State */
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <WifiOff className="w-12 h-12 text-rose-500" />
            <h3 className="text-[18px] font-bold text-[#1f2732] dark:text-zinc-100">
              Error al consultar postulaciones
            </h3>
            <p className="text-[15px] text-[#5c7c9b] dark:text-zinc-400 max-w-xs leading-relaxed">
              No pudimos conectar con Supabase para sincronizar tus postulaciones.
            </p>
            <Button
              onClick={handleRefresh}
              className="mt-2 bg-[#1f2732] hover:bg-[#2f3c4b] text-white rounded-[14px] text-sm font-bold px-6 py-3 flex items-center gap-2"
            >
              <RotateCw className="w-5 h-5" />
              Reintentar
            </Button>
          </div>
        ) : filteredApplications.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-22 h-22 rounded-full bg-[#f5f7fa] dark:bg-zinc-900 flex items-center justify-center text-[#7d99b3] shrink-0">
              <History className="w-10 h-10 stroke-[1.75]" />
            </div>

            <h3 className="text-[20px] font-bold text-[#1f2732] dark:text-zinc-100 max-w-xs leading-snug">
              {selectedFilterIndex === 0
                ? "Aún no te has postulado"
                : "Sin postulaciones en esta categoría"}
            </h3>
            <p className="text-[15px] text-[#5c7c9b] dark:text-zinc-400 max-w-sm leading-[1.5] text-center">
              Encuentra ofertas laborales de tu interés en la sección principal o buscador y postúlate con un solo tap.
            </p>

            <Button
              onClick={() => router.push("/dashboard/candidate/discovery")}
              className="mt-3 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#2f3c4b] dark:hover:bg-zinc-200 rounded-[16px] text-sm font-bold px-7 py-3.5 transition-all cursor-pointer active:scale-95"
            >
              Explorar vacantes
            </Button>
          </div>
        ) : viewMode === "table" ? (
          /* TABULAR VIEW POWERED BY TANSTACK TABLE */
          <CandidateApplicationsTable
            data={filteredApplications}
            onOpenDetail={handleOpenDetail}
            onOpenContract={handleOpenContract}
          />
        ) : (
          /* CARDS VIEW */
          <div className="space-y-5">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                onClick={() => handleOpenDetail(app)}
                className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[22px] space-y-5 shadow-[0_4px_16px_rgba(31,39,50,0.05)] hover:border-[#d2dbe5] dark:hover:border-zinc-700 transition-all cursor-pointer"
              >
                {/* Top Row: Company Icon, Title & Status Chip */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-[16px] bg-[#f5f7fa] dark:bg-zinc-800 text-[#344558] dark:text-zinc-300 flex items-center justify-center shrink-0 font-bold text-sm border border-[#ebeef3] dark:border-zinc-800">
                      {app.logoUrl ? (
                        <img src={app.logoUrl} alt={app.company} className="w-full h-full object-cover rounded-[16px]" />
                      ) : (
                        <Briefcase className="w-7 h-7 text-[#344558] dark:text-zinc-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[17px] sm:text-[19px] font-bold text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px] truncate">
                        {app.position}
                      </h3>
                      <p className="text-[14px] text-[#5c7c9b] dark:text-zinc-400 font-semibold truncate mt-1">
                        {app.company} • {app.location}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge Pill */}
                  <div className={`px-3 py-1.5 rounded-[14px] flex items-center gap-1.5 shrink-0 ${
                    app.status === "Contratado"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : app.status === "Preseleccionado" || app.status === "En revisión" || app.status === "Entrevista"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : app.status === "Descartado"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "bg-[#f5f7fa] text-[#5c7c9b] dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    {app.status === "Contratado" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : app.status === "Descartado" ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span className="text-[12px] sm:text-[13px] font-extrabold">
                      {app.statusLabel}
                    </span>
                  </div>
                </div>

                {/* Stepper Visualizer */}
                <ApplicationStepper status={app.status} progress={app.progress} />

                {/* Scheduled Interview Interactive Section */}
                {app.interviewDetails && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 space-y-3.5"
                  >
                    {/* Interview Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-indigo-500/15 dark:bg-indigo-400/15 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                          {app.interviewDetails.modality === "virtual" ? (
                            <Video className="size-4.5" />
                          ) : (
                            <MapPin className="size-4.5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-indigo-950 dark:text-indigo-100">
                              Entrevista {app.interviewDetails.modality === "virtual" ? "Virtual" : "Presencial"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-indigo-700/90 dark:text-indigo-300/90 font-medium">
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
                          <Badge className="bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30 font-bold text-xs gap-1 px-2.5 py-1">
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

                    {/* Modality Details & Link / Address */}
                    {app.interviewDetails.locationOrLink && (
                      <div className="bg-white/80 dark:bg-zinc-900/80 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {app.interviewDetails.modality === "virtual" ? (
                            <Video className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          ) : (
                            <MapPin className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
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
                                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
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

                        {/* Copy button or Open link */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          {app.interviewDetails.modality === "virtual" && app.interviewDetails.locationOrLink.startsWith("http") && (
                            <a
                              href={app.interviewDetails.locationOrLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-2xs"
                            >
                              <span>Unirse</span>
                              <ExternalLink className="size-3" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyLink(app.interviewDetails!.locationOrLink, app.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-semibold text-xs transition-colors cursor-pointer"
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
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Recruiter Notes */}
                    {app.interviewDetails.notes && (
                      <div className="text-xs bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/40 text-indigo-900/80 dark:text-indigo-200/80">
                        <span className="font-bold text-indigo-950 dark:text-indigo-100 mr-1">Indicaciones del reclutador:</span>
                        <span className="italic">&ldquo;{app.interviewDetails.notes}&rdquo;</span>
                      </div>
                    )}

                    {/* If reschedule requested, show status summary */}
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
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 italic">
                          El reclutador evaluará tu solicitud y actualizará la cita.
                        </p>
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-200/60 dark:border-indigo-800/40">
                      {/* Confirm Button */}
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

                      {/* Reschedule Request Button */}
                      {app.interviewDetails.status !== "cancelled" && app.interviewDetails.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReschedule(app);
                          }}
                          className="h-8 rounded-xl border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-bold text-xs gap-1.5 cursor-pointer"
                        >
                          <CalendarClock className="size-3.5 text-amber-600 dark:text-amber-400" />
                          <span>{app.interviewDetails.status === "reschedule_requested" ? "Cambiar Propuesta" : "Solicitar Reagendar"}</span>
                        </Button>
                      )}

                      {/* Google Calendar Link */}
                      {(() => {
                        const gcalUrl = buildGoogleCalendarUrl(app);
                        if (!gcalUrl) return null;
                        return (
                          <a
                            href={gcalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-zinc-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-colors shadow-2xs ml-auto"
                          >
                            <CalendarPlus className="size-3.5" />
                            <span>Google Calendar</span>
                          </a>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Hired & Contract Formalization Card */}
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
                            : "Tu proceso de selección concluyó positivamente. Contrato formal en emisión."}
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

                {/* Footer Row: Date & Chevron */}
                <div className="flex items-center justify-between pt-2 border-t border-[#ebeef3]/60 dark:border-zinc-800/80">
                  <span className="text-[13px] font-semibold text-[#7d99b3] dark:text-zinc-400">
                    Postulado {app.appliedDate}
                  </span>
                  <div className="flex items-center gap-1 text-[13px] sm:text-[14px] font-bold text-[#344558] dark:text-zinc-200">
                    <span>Ver detalles</span>
                    <ChevronRight className="w-4.5 h-4.5 text-[#344558] dark:text-zinc-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Application Details Sheet Modal */}
      <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        {selectedApp && (
          <DialogContent className="sm:max-w-[480px] rounded-t-[32px] sm:rounded-3xl bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#ebeef3] dark:border-zinc-800">
              <DialogTitle className="text-base sm:text-lg font-bold text-[#1f2732] dark:text-zinc-50">
                Detalles de la Postulación
              </DialogTitle>
              <div className={`px-3.5 py-1.5 rounded-[16px] flex items-center gap-1.5 text-xs sm:text-sm font-bold ${
                selectedApp.status === "Contratado"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : selectedApp.status === "Preseleccionado" || selectedApp.status === "En revisión"
                  ? "bg-amber-500/10 text-amber-600"
                  : selectedApp.status === "Descartado"
                  ? "bg-rose-500/10 text-rose-600"
                  : "bg-[#f5f7fa] text-[#5c7c9b]"
              }`}>
                {selectedApp.status === "Contratado" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : selectedApp.status === "Descartado" ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                <span>{selectedApp.statusLabel}</span>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-5">
              <div>
                <h3 className="text-[22px] font-[800] text-[#1f2732] dark:text-zinc-50 leading-tight">
                  {selectedApp.position}
                </h3>
                <p className="text-[15px] font-semibold text-[#5c7c9b] dark:text-zinc-400 mt-1">
                  {selectedApp.company} • {selectedApp.location}
                </p>
                <p className="text-[16px] font-[800] text-[#344558] dark:text-zinc-200 mt-2">
                  {formatSalary(selectedApp.salary_min, selectedApp.salary_max)}
                </p>
              </div>

              {/* Timeline Section */}
              <div className="pt-3 space-y-4">
                <h4 className="text-[16px] sm:text-[17px] font-bold text-[#1f2732] dark:text-zinc-100">
                  Línea de Tiempo del Proceso
                </h4>

                <div className="space-y-5 pl-1">
                  <TimelineStep
                    title="Postulación enviada"
                    subtitle="Tu información fue registrada en el sistema."
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
                <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                      {selectedApp.interviewDetails.modality === "virtual" ? (
                        <Video className="size-4" />
                      ) : (
                        <MapPin className="size-4" />
                      )}
                      <span>Cita de Entrevista</span>
                    </div>

                    {/* Status Badge in Modal */}
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
                        <Badge className="bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30 font-bold text-[11px] px-2 py-0.5">
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
                      <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/40 space-y-1.5">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                          {selectedApp.interviewDetails.modality === "virtual" ? "Enlace de Videollamada:" : "Ubicación / Sede:"}
                        </span>
                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-indigo-100 dark:border-indigo-900/40">
                          {selectedApp.interviewDetails.modality === "virtual" && selectedApp.interviewDetails.locationOrLink.startsWith("http") ? (
                            <a
                              href={selectedApp.interviewDetails.locationOrLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline truncate text-xs flex-1"
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
                                className="px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                              >
                                <span>Unirse</span>
                                <ExternalLink className="size-2.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopyLink(selectedApp.interviewDetails!.locationOrLink, selectedApp.id)}
                              className="px-2 py-1 rounded-md bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
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
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedApp.interviewDetails.notes && (
                      <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/40 text-[11px] text-indigo-900/80 dark:text-indigo-200/80 bg-indigo-50/50 dark:bg-indigo-950/20 p-2 rounded-lg">
                        <span className="font-bold text-indigo-950 dark:text-indigo-100 mr-1">Indicaciones:</span>
                        <span className="italic">&ldquo;{selectedApp.interviewDetails.notes}&rdquo;</span>
                      </div>
                    )}

                    {/* Reschedule request note if active */}
                    {selectedApp.interviewDetails.status === "reschedule_requested" && (
                      <div className="text-[11px] bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-amber-900 dark:text-amber-200 space-y-0.5">
                        <div className="flex items-center gap-1 font-bold text-amber-800 dark:text-amber-300">
                          <CalendarClock className="size-3" />
                          <span>Solicitud de reagendamiento en revisión</span>
                        </div>
                        <p>
                          Propuesta: <span className="font-semibold">{selectedApp.interviewDetails.proposedDate || "Fecha a coordinar"} {selectedApp.interviewDetails.proposedTime ? `a las ${selectedApp.interviewDetails.proposedTime} hrs` : ""}</span>.
                          {selectedApp.interviewDetails.candidateResponseNotes && ` Motivo: "${selectedApp.interviewDetails.candidateResponseNotes}".`}
                        </p>
                      </div>
                    )}

                    {/* Action buttons in Modal */}
                    <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-800/40 flex flex-wrap items-center gap-2">
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
                          className="h-8 rounded-xl border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-bold text-xs gap-1.5 cursor-pointer flex-1"
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
                            className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-zinc-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-colors shadow-2xs w-full"
                          >
                            <CalendarPlus className="size-3.5" />
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
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3.5">
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
                          "w-full mt-1.5 h-11 rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-xs",
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
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[18px] space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <MessageCircle className="w-5 h-5" />
                    <span>Contacto directo por WhatsApp</span>
                  </div>
                  <a
                    href={`https://wa.me/${selectedApp.companyPhone.replace(/[^0-9]/g, "")}?text=Hola!%20Soy%20${encodeURIComponent(profile?.full_name || "Candidato")},%20me%20postule%20a%20la%20vacante%20de%20${encodeURIComponent(selectedApp.position)}%20en%20K'anPro.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm h-12 rounded-[14px] flex items-center justify-center gap-2 border-none cursor-pointer">
                      Escribir a la empresa
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              )}
            </div>

            <div className="pt-3">
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
                className="w-full h-12 rounded-[16px] border-[#ebeef3] dark:border-zinc-700 text-[#1f2732] dark:text-zinc-200 font-bold text-sm cursor-pointer hover:bg-[#f5f7fa] dark:hover:bg-zinc-800"
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

/** TanStack Table for Candidate Applications Tabular View */
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
          return (
            <div className="flex items-center gap-3 py-1">
              <div className="size-9 rounded-xl bg-[#f5f7fa] dark:bg-zinc-800 flex items-center justify-center shrink-0 font-bold text-xs border border-[#ebeef3] dark:border-zinc-800">
                {app.logoUrl ? (
                  <img src={app.logoUrl} alt={app.company} className="size-full object-cover rounded-xl" />
                ) : (
                  <Briefcase className="size-4 text-[#344558] dark:text-zinc-300" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm text-[#1f2732] dark:text-zinc-100 truncate">
                  {app.position}
                </span>
                <span className="text-xs text-[#5c7c9b] dark:text-zinc-400 font-semibold truncate">
                  {app.company} • {app.location}
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
            className="flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Fecha</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-[#1f2732] dark:text-zinc-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-[#1f2732] dark:text-zinc-100" />
            ) : (
              <ArrowUpDown className="size-3.5 text-[#5c7c9b]/60" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-[#5c7c9b] dark:text-zinc-300">
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
            className="flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Rango Salarial</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-[#1f2732] dark:text-zinc-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-[#1f2732] dark:text-zinc-100" />
            ) : (
              <ArrowUpDown className="size-3.5 text-[#5c7c9b]/60" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs font-bold text-[#1f2732] dark:text-zinc-100">
            {formatSalary(row.original.salary_min, row.original.salary_max)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Estado</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-[#1f2732] dark:text-zinc-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-[#1f2732] dark:text-zinc-100" />
            ) : (
              <ArrowUpDown className="size-3.5 text-[#5c7c9b]/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex flex-col gap-1 items-start">
              <Badge
                variant="outline"
                className={`text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit border ${
                  app.status === "Contratado"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : app.status === "Preseleccionado" || app.status === "En revisión" || app.status === "Entrevista"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : app.status === "Descartado"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    : "bg-[#f5f7fa] text-[#5c7c9b] dark:bg-zinc-800 dark:text-zinc-400 border-[#ebeef3] dark:border-zinc-800"
                }`}
              >
                {app.status === "Contratado" ? (
                  <CheckCircle2 className="size-3.5" />
                ) : app.status === "Descartado" ? (
                  <X className="size-3.5" />
                ) : (
                  <Clock className="size-3.5" />
                )}
                <span>{app.statusLabel}</span>
              </Badge>

              {app.interviewDetails && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border",
                    app.interviewDetails.status === "confirmed"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                      : app.interviewDetails.status === "reschedule_requested"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                      : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20"
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
                className="h-8 px-2.5 text-xs font-extrabold text-[#344558] dark:text-zinc-200 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
              >
                <span>Detalles</span>
                <ChevronRight className="size-3.5 ml-1" />
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
    <div className="border border-[#ebeef3] dark:border-zinc-800 rounded-[22px] bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
      <Table className="w-full">
        <TableHeader className="bg-[#f5f7fa]/80 dark:bg-zinc-900/60 border-b border-[#ebeef3] dark:border-zinc-800">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="py-4 px-4 text-xs font-extrabold text-[#1f2732] dark:text-zinc-200">
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
                className="border-b border-[#ebeef3]/60 dark:border-zinc-800/50 hover:bg-[#f5f7fa]/60 dark:hover:bg-zinc-800/40 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-28 text-center text-xs font-semibold text-[#5c7c9b]">
                No hay postulaciones registradas en esta vista.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/** 4-Step Stepper Component matching Flutter _ApplicationStepper */
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
          let bgColor = "bg-[#ebeef3] dark:bg-zinc-800";

          if (isRejected) {
            bgColor = idx === 0 ? "bg-blue-600" : "bg-rose-500";
          } else if (isCompleted) {
            bgColor = "bg-[#1f2732] dark:bg-zinc-100";
          }

          return (
            <div
              key={idx}
              className={`h-[8px] flex-1 rounded-[4px] transition-colors ${bgColor}`}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[11px] sm:text-[12px] font-extrabold text-[#5c7c9b] dark:text-zinc-400">
        <span>Postulado</span>
        <span>En Revisión</span>
        <span>Entrevista</span>
        <span>Selección</span>
      </div>
    </div>
  );
}

/** Timeline Step Component matching Flutter _buildTimelineStep */
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
          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
            isCompleted
              ? "bg-[#1f2732] dark:bg-zinc-100 border-[#1f2732] dark:border-zinc-100 text-white dark:text-zinc-900"
              : isCurrent
              ? "bg-[#f5f7fa] dark:bg-zinc-800 border-[#1f2732] dark:border-zinc-300 text-[#7d99b3]"
              : "bg-[#f5f7fa] dark:bg-zinc-900 border-[#d2dbe5] dark:border-zinc-800 text-[#7d99b3]"
          }`}
        >
          {isCompleted ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : (
            <Circle className="w-2.5 h-2.5 fill-current" />
          )}
        </div>
        {!isLast && (
          <div
            className={`w-[2.5px] h-[40px] ${
              isCompleted ? "bg-[#1f2732] dark:bg-zinc-700" : "bg-[#ebeef3] dark:bg-zinc-800"
            }`}
          />
        )}
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center justify-between gap-2">
          <h5
            className={`text-[15px] sm:text-[16px] font-bold leading-tight ${
              isCompleted ? "text-[#1f2732] dark:text-zinc-100" : "text-[#7d99b3]"
            }`}
          >
            {title}
          </h5>
          <span className="text-[12px] font-semibold text-[#7d99b3]">
            {dateString}
          </span>
        </div>
        <p className="text-[13px] sm:text-[14px] text-[#5c7c9b] dark:text-zinc-400 mt-1 leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
