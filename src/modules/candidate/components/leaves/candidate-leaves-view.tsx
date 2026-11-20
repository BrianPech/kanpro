"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plane,
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  RotateCw,
  Building2,
  Briefcase,
  AlertCircle,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  Palmtree,
  Filter,
  Download,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatMexicoDateShort, formatSalaryDisplay } from "@/lib/formatters";
import { CandidateLeavesData } from "../../services/candidate-leaves";
import { CandidateLeaveRequestModal } from "./candidate-leave-request-modal";
import { generateCandidateLeaveCertificateAction } from "../../actions/leaves";

interface CandidateLeavesViewProps {
  initialData: CandidateLeavesData;
}

export function CandidateLeavesView({ initialData }: CandidateLeavesViewProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadCertificate = async (requestId: string) => {
    try {
      setDownloadingId(requestId);
      const res = await generateCandidateLeaveCertificateAction(requestId);
      if (!res.success || !res.data) {
        toast.error("No se pudo descargar la constancia", {
          description: res.error,
        });
        return;
      }
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${res.data.base64}`;
      link.download = res.data.fileName;
      link.click();
      toast.success("Constancia oficial de disfrute descargada");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // If no active employment
  if (!initialData.hasActiveEmployment) {
    return (
      <div className="flex-grow min-h-full px-6 sm:px-10 lg:px-14 pt-6 pb-28 md:pb-8 max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <Plane className="size-7 text-primary" />
            <span>Mis Vacaciones & Permisos</span>
          </h1>
        </div>

        <div className="py-20 px-6 flex flex-col items-center justify-center text-center space-y-4 bg-card border border-border/80 rounded-4xl p-8">
          <div className="size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Palmtree className="size-10 stroke-[1.75]" />
          </div>

          <h3 className="text-xl font-extrabold text-foreground max-w-md">
            Sin relación laboral activa registrada
          </h3>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Para consultar tu saldo legal de vacaciones (Art. 76 LFT) y enviar solicitudes de descanso o permisos a Recursos Humanos, es necesario contar con un contrato vigente formalizado en la plataforma.
          </p>

          <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
            <Button
              onClick={() => router.push("/dashboard/candidate/applications")}
              variant="outline"
              className="rounded-4xl text-xs font-semibold h-9 px-4 cursor-pointer"
            >
              Ver Mis Postulaciones
            </Button>
            <Button
              onClick={() => router.push("/dashboard/candidate/discovery")}
              className="rounded-4xl text-xs font-semibold h-9 px-4 bg-primary text-primary-foreground shadow-2xs cursor-pointer"
            >
              Explorar Vacantes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { balance, companyName, companyLogoUrl, jobTitle, department, requests } = initialData;

  const filteredRequests = requests.filter((req) => {
    if (statusFilter === "all") return true;
    return req.status === statusFilter;
  });

  return (
    <div className="flex-grow min-h-full px-6 sm:px-10 lg:px-14 pt-6 pb-28 md:pb-8 max-w-5xl mx-auto w-full space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Header with Company Badge & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Autoservicio del Colaborador
            </span>
            <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary bg-primary/10 rounded-3xl">
              Art. 76 LFT
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <Plane className="size-7 text-primary" />
            <span>Mis Vacaciones & Permisos</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold flex items-center gap-1.5">
            <span>{jobTitle}</span>
            <span>•</span>
            <span>{companyName}</span>
            <span>•</span>
            <span>Antigüedad: {balance?.formattedSeniority || "1er Año"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-4xl size-9 p-0 flex items-center justify-center border-border/70 cursor-pointer"
            aria-label="Actualizar solicitudes"
          >
            <RotateCw className={cn("size-4", isRefreshing && "animate-spin")} />
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-4xl text-xs font-semibold h-9 px-4 gap-1.5 bg-primary text-primary-foreground shadow-2xs cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="size-4" />
            <span>Solicitar Vacaciones o Permiso</span>
          </Button>
        </div>
      </div>

      {/* 2. 4 Metrics Cards (LFT Dignas Balance) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Saldo Disponible (Hero) */}
        <Card className="p-4 sm:p-5 rounded-4xl bg-primary/5 dark:bg-primary/10 border border-primary/20 space-y-2 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Saldo Disponible</span>
            <div className="size-7 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Plane className="size-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {balance?.daysAvailable ?? 0}
              <span className="text-xs font-semibold text-muted-foreground ml-1">días hábiles</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Listos para solicitar</p>
          </div>
        </Card>

        {/* Card 2: Días por Antigüedad LFT */}
        <Card className="p-4 sm:p-5 rounded-4xl bg-card border-border/70 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Derecho LFT</span>
            <div className="size-7 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="size-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {balance?.totalDaysAccruedLFT ?? 12}
              <span className="text-xs font-semibold text-muted-foreground ml-1">días/año</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Vacaciones Dignas Art. 76</p>
          </div>
        </Card>

        {/* Card 3: Días en Revisión */}
        <Card className="p-4 sm:p-5 rounded-4xl bg-card border-border/70 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">En Revisión</span>
            <div className="size-7 rounded-2xl bg-muted text-foreground flex items-center justify-center">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {balance?.daysPendingApproval ?? 0}
              <span className="text-xs font-semibold text-muted-foreground ml-1">días</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Pendientes de RH</p>
          </div>
        </Card>

        {/* Card 4: Días Gozados / Aprobados */}
        <Card className="p-4 sm:p-5 rounded-4xl bg-card border-border/70 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Días Gozados</span>
            <div className="size-7 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {balance?.daysTaken ?? 0}
              <span className="text-xs font-semibold text-muted-foreground ml-1">días</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">Aprobados este periodo</p>
          </div>
        </Card>
      </div>

      {/* 3. Prima Vacacional & Vencimiento Art. 80 / Art. 81 LFT */}
      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5 rounded-4xl bg-card border-border/70 space-y-1.5 shadow-xs">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Prima Vacacional (Art. 80 LFT)
            </span>
            <p className="text-base sm:text-lg font-extrabold text-foreground">
              {Math.round((balance.vacationPremiumRate ?? 0.25) * 100)}% mínimo legal
              {balance.vacationPremiumEstimatedAmount > 0 && (
                <span className="text-primary ml-2">
                  • Est. {formatSalaryDisplay(balance.vacationPremiumEstimatedAmount)} MXN
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Derecho aplicable sobre los días de vacaciones disfrutados en el ciclo vigente.
            </p>
          </Card>

          <Card className="p-4 sm:p-5 rounded-4xl bg-card border-border/70 space-y-1.5 shadow-xs">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Vigencia y Vencimiento (Art. 81 y 516 LFT)
            </span>
            <p className="text-sm font-extrabold text-foreground">
              Ventana de concesión (6 meses):{" "}
              <span className="text-primary">
                {formatMexicoDateShort(balance.enjoymentWindowEndDate)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Fecha límite antes de prescripción:{" "}
              <strong className="text-foreground">
                {formatMexicoDateShort(balance.prescriptionEndDate)}
              </strong>{" "}
              • Próximo aniversario: {formatMexicoDateShort(balance.nextAnniversaryDate)}
            </p>
          </Card>
        </div>
      )}

      {/* 3b. LFT Legal Information Banner */}
      <div className="p-4 rounded-3xl bg-primary/5 border border-primary/20 flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
        <Info className="size-4.5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold text-foreground mr-1">
            Conforme a la Ley Federal del Trabajo (Reforma de Vacaciones Dignas):
          </span>
          Los colaboradores disfrutan de un mínimo de 12 días laborables pagados al cumplir el primer año de servicios, aumentando en dos días laborables por cada año subsecuente hasta llegar a veinte, y dos días por cada cinco años a partir del sexto año. Los domingos y días de descanso reglamentarios no se computan como días de vacaciones.
        </div>
      </div>

      {/* 4. Filter Chips & History Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            <span>Historial de Solicitudes ({requests.length})</span>
          </h2>

          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {[
              { id: "all", label: "Todas" },
              { id: "pendiente", label: "En Revisión" },
              { id: "visto_bueno", label: "Con Vo.Bo. Líder" },
              { id: "aprobada", label: "Aprobadas" },
              { id: "rechazada", label: "Rechazadas" },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setStatusFilter(chip.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-3xl text-xs font-medium transition-all cursor-pointer",
                  statusFilter === chip.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-border/70"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-14 px-6 flex flex-col items-center justify-center text-center space-y-3 bg-card border border-border/80 rounded-4xl p-8">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Calendar className="size-7 stroke-[1.5]" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              {statusFilter === "all" ? "Aún no tienes solicitudes registradas" : "Sin solicitudes en esta categoría"}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              Programa tus periodos de descanso con anticipación para facilitar la coordinación con tu equipo de trabajo.
            </p>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 rounded-4xl text-xs font-semibold h-9 px-4 bg-primary text-primary-foreground shadow-2xs cursor-pointer"
            >
              Crear Solicitud
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 sm:p-5 rounded-4xl bg-card border border-border/70 shadow-xs hover:border-border transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "size-10 rounded-3xl flex items-center justify-center shrink-0",
                      req.status === "aprobada"
                        ? "bg-primary/10 text-primary"
                        : req.status === "rechazada"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-foreground"
                    )}>
                      {req.status === "aprobada" ? (
                        <CheckCircle2 className="size-5" />
                      ) : req.status === "rechazada" ? (
                        <XCircle className="size-5" />
                      ) : (
                        <Clock className="size-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-foreground">
                          {req.typeLabel}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 border-border/80 rounded-3xl">
                          {req.totalWorkingDays} día{req.totalWorkingDays !== 1 ? "s" : ""} hábiles
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar className="size-3.5" />
                        <span>
                          {req.startDate} al {req.endDate}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {req.status === "aprobada" ? (
                      <>
                        <Badge variant="outline" className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold gap-1 px-2.5 py-1 rounded-3xl">
                          <CheckCircle2 className="size-3.5" />
                          <span>Aprobada por RH</span>
                        </Badge>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={downloadingId === req.id}
                          onClick={() => handleDownloadCertificate(req.id)}
                          className="rounded-3xl min-h-12 px-3.5 text-xs font-bold gap-1.5 cursor-pointer"
                        >
                          <Download className="size-3.5" />
                          <span>
                            {downloadingId === req.id
                              ? "Generando..."
                              : "Constancia Oficial PDF"}
                          </span>
                        </Button>
                      </>
                    ) : req.status === "visto_bueno" ? (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-xs font-semibold gap-1 px-2.5 py-1 rounded-3xl">
                        <CheckCircle2 className="size-3.5" />
                        <span>Vo.Bo. Líder • Por aprobar RH</span>
                      </Badge>
                    ) : req.status === "rechazada" ? (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold gap-1 px-2.5 py-1 rounded-3xl">
                        <XCircle className="size-3.5" />
                        <span>Rechazada</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-foreground border border-border/80 text-xs font-semibold gap-1 px-2.5 py-1 rounded-3xl">
                        <Clock className="size-3.5" />
                        <span>En Revisión</span>
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Reason / Notes */}
                {req.reason && (
                  <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-2xl border border-border/40">
                    <span className="font-bold text-foreground mr-1">Observaciones:</span>
                    {req.reason}
                  </p>
                )}

                {/* Rejection Feedback Note */}
                {req.status === "rechazada" && req.rejectionReason && (
                  <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-1">
                    <span className="font-bold block">Motivo de resolución de RH:</span>
                    <p className="text-[11px] leading-relaxed">
                      &ldquo;{req.rejectionReason}&rdquo;
                    </p>
                  </div>
                )}

                {/* Footer details */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 pt-1 border-t border-border/30">
                  <span>Solicitada el {req.requestedAt}</span>
                  {req.reviewedAt && (
                    <span>Revisada el {req.reviewedAt} {req.reviewedBy ? `por ${req.reviewedBy}` : ""}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Request Modal */}
      {balance && (
        <CandidateLeaveRequestModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          companyId={initialData.companyId || ""}
          companyName={companyName || "Empresa"}
          employeeId={initialData.employeeId}
          daysAvailable={balance.daysAvailable}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
