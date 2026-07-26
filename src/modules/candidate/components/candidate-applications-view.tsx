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
  Check,
  Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CandidateDashboardData, CandidateApplication } from "../services/candidate-dashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CandidateApplicationsViewProps {
  initialData: CandidateDashboardData;
}

export function CandidateApplicationsView({ initialData }: CandidateApplicationsViewProps) {
  const router = useRouter();
  const { profile, applications } = initialData;

  // Selected filter tab index: 0: Todas, 1: En revisión, 2: Entrevistas / Selección, 3: Finalizadas
  const [selectedFilterIndex, setSelectedFilterIndex] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [hasError, setHasError] = React.useState<boolean>(false);

  // Selected application for detail modal
  const [selectedApp, setSelectedApp] = React.useState<CandidateApplication | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState<boolean>(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
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
      // Entrevistas / Selección (Preseleccionado or Contratado)
      return applications.filter(
        (a) => a.status === "Preseleccionado" || a.status === "Contratado"
      );
    } else if (selectedFilterIndex === 3) {
      // Finalizadas (Descartado)
      return applications.filter((a) => a.status === "Descartado");
    }
    return applications;
  }, [applications, selectedFilterIndex]);

  return (
    <div className="flex-grow min-h-screen bg-white dark:bg-zinc-950 px-5 sm:px-8 lg:px-12 pt-4 pb-24 md:pb-10 space-y-5 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
      
      {/* 1. Header (Mis Postulaciones & Refresh Action) */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] sm:text-[28px] font-[800] text-[#1f2732] dark:text-fiord-50 tracking-[-0.6px]">
          Mis Postulaciones
        </h1>
        <button
          onClick={handleRefresh}
          aria-label="Actualizar postulaciones"
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 flex items-center justify-center text-[#344558] dark:text-zinc-200 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
        >
          <RotateCw className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* 2. Filter Chips Bar */}
      <div className="py-1 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
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
                className={`px-3.5 py-2 rounded-[20px] text-[13px] tracking-[-0.2px] transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold border border-transparent shadow-xs"
                    : "bg-[#f5f7fa] dark:bg-zinc-900 text-[#344558] dark:text-zinc-300 font-semibold border border-[#ebeef3] dark:border-zinc-800 hover:bg-[#ebeef3] dark:hover:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main List View / States */}
      <div className="pt-2 space-y-4">
        {isLoading ? (
          /* Skeleton Loader */
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[20px] space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-[14px] bg-[#ebeef3] dark:bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#ebeef3] dark:bg-zinc-800 rounded w-1/2" />
                    <div className="h-3 bg-[#ebeef3] dark:bg-zinc-800 rounded w-1/3" />
                  </div>
                </div>
                <div className="w-full h-2 bg-[#ebeef3] dark:bg-zinc-800 rounded-full" />
              </div>
            ))}
          </div>
        ) : hasError ? (
          /* Error State */
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <WifiOff className="w-10 h-10 text-rose-500" />
            <h3 className="text-[16px] font-bold text-[#1f2732] dark:text-zinc-100">
              Error al consultar postulaciones
            </h3>
            <p className="text-[13px] text-[#5c7c9b] dark:text-zinc-400 max-w-xs leading-relaxed">
              No pudimos conectar con Supabase para sincronizar tus postulaciones.
            </p>
            <Button
              onClick={handleRefresh}
              className="mt-2 bg-[#1f2732] hover:bg-[#2f3c4b] text-white rounded-[12px] text-xs font-bold px-5 py-2.5 flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Reintentar
            </Button>
          </div>
        ) : filteredApplications.length === 0 ? (
          /* Empty State (_EmptyApplicationsView) matching Flutter Spec */
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#f5f7fa] dark:bg-zinc-900 flex items-center justify-center text-[#7d99b3] shrink-0">
              <History className="w-9 h-9 stroke-[1.75]" />
            </div>

            <h3 className="text-[18px] font-bold text-[#1f2732] dark:text-zinc-100 max-w-xs leading-snug">
              {selectedFilterIndex === 0
                ? "Aún no te has postulado"
                : "Sin postulaciones en esta categoría"}
            </h3>
            <p className="text-[13px] text-[#5c7c9b] dark:text-zinc-400 max-w-xs leading-[1.45] text-center">
              Encuentra ofertas laborales de tu interés en la sección principal o buscador y postúlate con un solo tap.
            </p>

            <Button
              onClick={() => router.push("/dashboard/candidate/discovery")}
              className="mt-3 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#2f3c4b] dark:hover:bg-zinc-200 rounded-[14px] text-xs font-bold px-6 py-3 transition-all cursor-pointer active:scale-95"
            >
              Explorar vacantes
            </Button>
          </div>
        ) : (
          /* Populated List of _ApplicationCard items */
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                onClick={() => handleOpenDetail(app)}
                className="p-5 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[20px] space-y-5 shadow-[0_4px_16px_rgba(31,39,50,0.05)] hover:border-[#d2dbe5] dark:hover:border-zinc-700 transition-all cursor-pointer"
              >
                {/* Top Row: Company Icon, Title & Status Chip */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-[14px] bg-[#f5f7fa] dark:bg-zinc-800 text-[#344558] dark:text-zinc-300 flex items-center justify-center shrink-0 font-bold text-xs border border-[#ebeef3] dark:border-zinc-800">
                      {app.logoUrl ? (
                        <img src={app.logoUrl} alt={app.company} className="w-full h-full object-cover rounded-[14px]" />
                      ) : (
                        <Briefcase className="w-6 h-6 text-[#344558] dark:text-zinc-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[16px] font-bold text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px] truncate">
                        {app.position}
                      </h3>
                      <p className="text-[13px] text-[#5c7c9b] font-medium truncate mt-0.5">
                        {app.company} • {app.location}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge Pill */}
                  <div className={`px-2.5 py-1 rounded-[12px] flex items-center gap-1.5 shrink-0 ${
                    app.status === "Contratado"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : app.status === "Preseleccionado" || app.status === "En revisión"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : app.status === "Descartado"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "bg-[#f5f7fa] text-[#5c7c9b] dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    {app.status === "Contratado" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : app.status === "Descartado" ? (
                      <X className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[11px] font-bold">
                      {app.statusLabel}
                    </span>
                  </div>
                </div>

                {/* Stepper Visualizer (_ApplicationStepper) */}
                <ApplicationStepper status={app.status} progress={app.progress} />

                {/* Footer Row: Date & Chevron */}
                <div className="flex items-center justify-between pt-1 border-t border-[#ebeef3]/60 dark:border-zinc-800/80">
                  <span className="text-[12px] font-medium text-[#7d99b3] dark:text-zinc-400">
                    Postulado {app.appliedDate}
                  </span>
                  <div className="flex items-center gap-1 text-[12px] font-bold text-[#344558] dark:text-zinc-200">
                    <span>Ver detalles</span>
                    <ChevronRight className="w-4 h-4 text-[#344558] dark:text-zinc-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Application Details Sheet Modal (_ApplicationDetailSheet) */}
      <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        {selectedApp && (
          <DialogContent className="sm:max-w-[460px] rounded-t-[28px] sm:rounded-3xl bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-[#ebeef3] dark:border-zinc-800">
              <div className={`px-3 py-1 rounded-[14px] flex items-center gap-1.5 text-xs font-bold ${
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

            <div className="py-3 space-y-4">
              <div>
                <h3 className="text-[20px] font-[800] text-[#1f2732] dark:text-zinc-50 leading-tight">
                  {selectedApp.position}
                </h3>
                <p className="text-[14px] font-medium text-[#5c7c9b] dark:text-zinc-400 mt-1">
                  {selectedApp.company} • {selectedApp.location}
                </p>
                <p className="text-[15px] font-[800] text-[#344558] dark:text-zinc-200 mt-2">
                  Sueldo competitivo
                </p>
              </div>

              {/* Timeline Section */}
              <div className="pt-3 space-y-4">
                <h4 className="text-[15px] font-bold text-[#1f2732] dark:text-zinc-100">
                  Línea de Tiempo del Proceso
                </h4>

                <div className="space-y-4 pl-1">
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
                    subtitle="Coordinación de cita presencial o virtual."
                    dateString={selectedApp.progress >= 75 ? "Completado" : "Pendiente"}
                    isCompleted={selectedApp.progress >= 75}
                    isCurrent={selectedApp.status === "Preseleccionado"}
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

              {/* Direct WhatsApp Call to Action */}
              {selectedApp.companyPhone && (selectedApp.status === "Preseleccionado" || selectedApp.status === "En revisión") && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[16px] space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                    <MessageCircle className="w-4 h-4" />
                    <span>Contacto directo por WhatsApp</span>
                  </div>
                  <a
                    href={`https://wa.me/${selectedApp.companyPhone.replace(/[^0-9]/g, "")}?text=Hola!%20Soy%20${encodeURIComponent(profile?.full_name || "Candidato")},%20me%20postule%20a%20la%20vacante%20de%20${encodeURIComponent(selectedApp.position)}%20en%20K'anPro.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-[12px] flex items-center justify-center gap-1.5 border-none">
                      Escribir a la empresa
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => setIsSheetOpen(false)}
                aria-label="Cerrar modal de detalles"
                className="w-full h-11 rounded-[14px] border-[#ebeef3] dark:border-zinc-700 text-[#1f2732] dark:text-zinc-200 font-bold text-xs"
              >
                Ver Ficha de la Vacante
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

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
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
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
              className={`h-[6px] flex-1 rounded-[3px] transition-colors ${bgColor}`}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] font-bold text-[#5c7c9b] dark:text-zinc-400">
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
    <div className="flex items-start gap-3.5">
      <div className="flex flex-col items-center">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
            isCompleted
              ? "bg-[#1f2732] dark:bg-zinc-100 border-[#1f2732] dark:border-zinc-100 text-white dark:text-zinc-900"
              : isCurrent
              ? "bg-[#f5f7fa] dark:bg-zinc-800 border-[#1f2732] dark:border-zinc-300 text-[#7d99b3]"
              : "bg-[#f5f7fa] dark:bg-zinc-900 border-[#d2dbe5] dark:border-zinc-800 text-[#7d99b3]"
          }`}
        >
          {isCompleted ? (
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          ) : (
            <Circle className="w-2 h-2 fill-current" />
          )}
        </div>
        {!isLast && (
          <div
            className={`w-[2px] h-[36px] ${
              isCompleted ? "bg-[#1f2732] dark:bg-zinc-700" : "bg-[#ebeef3] dark:bg-zinc-800"
            }`}
          />
        )}
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center justify-between gap-2">
          <h5
            className={`text-[14px] font-bold leading-tight ${
              isCompleted ? "text-[#1f2732] dark:text-zinc-100" : "text-[#7d99b3]"
            }`}
          >
            {title}
          </h5>
          <span className="text-[11px] font-semibold text-[#7d99b3]">
            {dateString}
          </span>
        </div>
        <p className="text-[12px] text-[#5c7c9b] dark:text-zinc-400 mt-0.5">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
