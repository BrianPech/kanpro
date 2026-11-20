"use client";

import React from "react";
import {
  ShieldAlert,
  FileText,
  Paperclip,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  User,
  ExternalLink,
  Award,
  AlertTriangle,
} from "@/components/ui/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LaborIncident } from "../../types/incidents";
import {
  getIncidentEvidenceUrlAction,
  generateActaAdministrativaAction,
} from "../../actions/incidents";

interface IncidentEvidenceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  incident: LaborIncident | null;
  onResolve: (id: string, newStatus: "aprobado" | "rechazado" | "resuelto") => void;
}

export function IncidentEvidenceModal({
  isOpen,
  onOpenChange,
  incident,
  onResolve,
}: IncidentEvidenceModalProps) {
  const [isBusy, setIsBusy] = React.useState(false);

  if (!incident) return null;

  const handleOpenEvidence = async () => {
    setIsBusy(true);
    const res = await getIncidentEvidenceUrlAction(incident.id);
    setIsBusy(false);
    if (!res.success || !res.data) {
      toast.error("No se pudo abrir la evidencia", { description: res.error });
      return;
    }
    window.open(res.data.url, "_blank", "noopener,noreferrer");
  };

  const handleDownloadActa = async () => {
    setIsBusy(true);
    const res = await generateActaAdministrativaAction(incident.id);
    setIsBusy(false);
    if (!res.success || !res.data) {
      toast.error("No se pudo generar el acta", { description: res.error });
      return;
    }
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${res.data.base64}`;
    link.download = res.data.fileName;
    link.click();
    toast.success("Acta Administrativa generada");
  };

  const isRecognition = incident.category === "reconocimiento";

  const getSeverityBadge = (sev: LaborIncident["severity"]) => {
    switch (sev) {
      case "critica":
        return <Badge className="bg-destructive text-destructive-foreground border-none text-[10px] font-bold">Severidad Crítica</Badge>;
      case "alta":
        return <Badge className="bg-destructive/15 text-destructive border-none text-[10px] font-bold">Severidad Alta</Badge>;
      case "media":
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none text-[10px] font-bold">Severidad Media</Badge>;
      default:
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-bold">Leve / Informativa</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 text-left pb-3 border-b border-border/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-bold px-2.5 py-0.5">
                {incident.categoryLabel}
              </Badge>
              {getSeverityBadge(incident.severity)}
            </div>

            <span className="text-xs font-semibold text-muted-foreground">
              {incident.incidentDate}
            </span>
          </div>

          <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
            {incident.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Empleado: <strong>{incident.employeeName}</strong> • {incident.department}
          </DialogDescription>
        </DialogHeader>

        {/* Content Body */}
        <div className="space-y-4 pt-1 text-xs">
          {/* Description Box */}
          <div className="p-4 rounded-3xl bg-muted/30 border border-border/50 space-y-1.5 leading-relaxed">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">
              Hechos Documentados
            </span>
            <p className="text-foreground font-medium">{incident.description}</p>
          </div>

          {/* Supervisor in charge */}
          <div className="p-3 rounded-2xl bg-card border border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Supervisor Responsable:</span>
            <span className="font-bold text-foreground">{incident.responsibleSupervisor}</span>
          </div>

          {/* Attached Evidence */}
          {incident.evidenceFileName ? (
            <div className="p-3.5 rounded-2xl border border-border/60 bg-card flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Paperclip className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-foreground block truncate">
                    {incident.evidenceFileName}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Evidencia digital autenticada
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenEvidence}
                disabled={isBusy}
                className="font-bold gap-1 shrink-0 cursor-pointer"
              >
                <ExternalLink className="size-3" />
                <span>Ver</span>
              </Button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl border border-dashed border-border/60 text-center text-muted-foreground font-medium">
              Sin documento adjunto adicional
            </div>
          )}

          {/* Respuesta del trabajador */}
          <div className="p-3.5 rounded-2xl border border-border/60 bg-card space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">
              Respuesta del trabajador
            </span>
            <p className="font-medium text-foreground">
              {incident.notifiedAt ? `Notificado el ${incident.notifiedAt}.` : "Aún sin notificar en su portal."}{" "}
              {incident.acknowledgedAt ? `Enterado el ${incident.acknowledgedAt}.` : "Sin acuse de enterado."}
            </p>
            {incident.employeeStatement && (
              <p className="text-foreground">
                <strong>Descargo{incident.employeeStatementAt ? ` (${incident.employeeStatementAt})` : ""}:</strong>{" "}
                {incident.employeeStatement}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            size="sm"
            className="font-bold cursor-pointer"
          >
            Cerrar
          </Button>

          {!isRecognition && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadActa}
              disabled={isBusy}
              size="sm"
              className="font-bold gap-1 cursor-pointer"
            >
              <Download className="size-3.5" />
              <span>Acta Administrativa (PDF)</span>
            </Button>
          )}

          {incident.status === "pendiente" && !isRecognition && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onResolve(incident.id, "rechazado");
                  onOpenChange(false);
                }}
                size="sm"
                className="font-bold text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                Descartar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onResolve(incident.id, "aprobado");
                  onOpenChange(false);
                }}
                size="sm"
                className="font-bold cursor-pointer"
              >
                Aplicar Incidencia a Pre-nómina
              </Button>
            </>
          )}

          {isRecognition && (
            <Button
              type="button"
              onClick={() => {
                onResolve(incident.id, "resuelto");
                toast.success("Reconocimiento publicado en el muro de honor");
                onOpenChange(false);
              }}
              size="sm"
              className="font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="size-4" />
              <span>Publicar Reconocimiento</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
