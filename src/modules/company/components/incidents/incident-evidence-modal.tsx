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
} from "lucide-react";
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
  if (!incident) return null;

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
      <DialogContent className="sm:max-w-[560px] rounded-3xl p-6 bg-card border-border/80 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 text-left pb-3 border-b border-border/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-none text-xs font-bold px-2.5 py-0.5 rounded-lg">
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
            Colaborador: <strong>{incident.employeeName}</strong> • {incident.department}
          </DialogDescription>
        </DialogHeader>

        {/* Content Body */}
        <div className="space-y-4 pt-1 text-xs">
          {/* Description Box */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-1.5 leading-relaxed">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">
              Hechos Documentados
            </span>
            <p className="text-foreground font-medium">{incident.description}</p>
          </div>

          {/* Supervisor in charge */}
          <div className="p-3 rounded-xl bg-background border border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Supervisor Responsable:</span>
            <span className="font-bold text-foreground">{incident.responsibleSupervisor}</span>
          </div>

          {/* Attached Evidence */}
          {incident.evidenceFileName ? (
            <div className="p-3.5 rounded-xl border border-border/60 bg-background flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
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
                onClick={() => toast.info("Abriendo visor de evidencia...")}
                className="rounded-lg text-xs font-bold h-8 px-3 border-border/70 flex items-center gap-1 shrink-0"
              >
                <ExternalLink className="size-3" />
                <span>Ver</span>
              </Button>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-dashed border-border/60 text-center text-muted-foreground font-medium">
              Sin documento adjunto adicional
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold h-10 px-4"
          >
            Cerrar
          </Button>

          {incident.status === "pendiente" && !isRecognition && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onResolve(incident.id, "rechazado");
                  onOpenChange(false);
                }}
                className="rounded-xl text-xs font-bold h-10 px-4 text-destructive hover:bg-destructive/10"
              >
                Descartar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onResolve(incident.id, "aprobado");
                  onOpenChange(false);
                }}
                className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
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
              className="rounded-xl text-xs font-bold h-10 px-5 bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center gap-1.5"
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
