"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  FileText,
  Paperclip,
  CheckCircle2,
  User,
  Calendar,
  Award,
  HeartPulse,
  MessageSquareWarning,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { LaborIncident, IncidentCategory, IncidentSeverity } from "../../types/incidents";

interface NewIncidentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onIncidentCreated: (incident: LaborIncident) => void;
}

export function NewIncidentModal({
  isOpen,
  onOpenChange,
  onIncidentCreated,
}: NewIncidentModalProps) {
  const [employeeName, setEmployeeName] = useState("Carlos Mendoza");
  const [category, setCategory] = useState<IncidentCategory>("falta_injustificada");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("media");
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split("T")[0]);
  const [supervisor, setSupervisor] = useState("Ing. Fernando Morales (Supervisor Operativo)");
  const [hasEvidence, setHasEvidence] = useState(false);
  const [evidenceFileName, setEvidenceFileName] = useState("");

  const categoryLabels: Record<IncidentCategory, string> = {
    falta_injustificada: "Falta Injustificada",
    retardo: "Retardo de Turno",
    accidente: "Accidente de Trabajo (ST-7)",
    queja: "Queja / Reporte de Conducta",
    permiso: "Permiso Especial",
    suspension: "Suspensión Administrativa",
    incumplimiento: "Incumplimiento / Acta Administrativa",
    reconocimiento: "⭐ Reconocimiento / Desempeño Destacado",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !title.trim() || !description.trim()) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }

    const newInc: LaborIncident = {
      id: `inc-${Date.now()}`,
      employeeId: `emp-${Date.now()}`,
      employeeName: employeeName.trim(),
      jobTitle: "Colaborador K'anPro",
      department: "Operaciones",
      category,
      categoryLabel: categoryLabels[category],
      title: title.trim(),
      description: description.trim(),
      incidentDate,
      severity,
      evidenceUrl: hasEvidence ? "/assets/docs/evidencia_sample.pdf" : undefined,
      evidenceFileName: hasEvidence ? evidenceFileName || "Evidencia_Incidencia.pdf" : undefined,
      evidenceType: category === "accidente" ? "receta_medica" : category === "incumplimiento" ? "acta_administrativa" : "documento",
      responsibleSupervisor: supervisor.trim(),
      status: category === "reconocimiento" ? "resuelto" : "pendiente",
      createdAt: "Hoy",
    };

    onIncidentCreated(newInc);
    toast.success("Incidencia registrada en el expediente laboral", {
      description: `${categoryLabels[category]} registrada para ${employeeName}.`,
    });

    // Reset
    setTitle("");
    setDescription("");
    setHasEvidence(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-3xl p-6 bg-card border-border/80 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-border/40">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="size-3.5 text-primary" />
              <span>Registro de Incidencias & Reconocimientos</span>
            </div>
            <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
              Registrar Nueva Incidencia Laboral
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Documenta eventos operativos, actas administrativas o reconocimientos destacados con evidencia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Colaborador Involucrado *</Label>
                <Input
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Fecha del Suceso</Label>
                <Input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>
            </div>

            {/* Categoría (8 tipos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Tipo de Incidencia (8 Tipos) *</Label>
                <Select
                  value={category}
                  onValueChange={(val) => val && setCategory(val as IncidentCategory)}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="falta_injustificada">Falta Injustificada</SelectItem>
                    <SelectItem value="retardo">Retardo de Turno</SelectItem>
                    <SelectItem value="accidente">Accidente de Trabajo</SelectItem>
                    <SelectItem value="queja">Queja / Conducta</SelectItem>
                    <SelectItem value="permiso">Permiso Especial</SelectItem>
                    <SelectItem value="suspension">Suspensión Administrativa</SelectItem>
                    <SelectItem value="incumplimiento">Acta Administrativa / Incumplimiento</SelectItem>
                    <SelectItem value="reconocimiento">⭐ Reconocimiento / Desempeño Destacado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Nivel de Severidad</Label>
                <Select
                  value={severity}
                  onValueChange={(val) => val && setSeverity(val as IncidentSeverity)}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="baja">Baja (Informativo / Leve)</SelectItem>
                    <SelectItem value="media">Media (Aviso / Descuento)</SelectItem>
                    <SelectItem value="alta">Alta (Acta / Sanción)</SelectItem>
                    <SelectItem value="critica">Crítica (Riesgo / Rescisión)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Título Resumido *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Acta administrativa por inasistencia no justificada en fin de semana"
                className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Descripción Detallada de los Hechos *
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe cronológicamente lo sucedido, testimonios y observaciones..."
                className="min-h-[80px] rounded-xl bg-background border-border/80 text-xs resize-none font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Supervisor Responsable</Label>
              <Input
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                required
              />
            </div>

            {/* Evidence Attachment Simulation */}
            <div
              onClick={() => {
                setHasEvidence(true);
                setEvidenceFileName("Evidencia_Comprobante_Firmado.pdf");
                toast.success("Documento de evidencia adjuntado");
              }}
              className="p-3.5 rounded-xl border border-dashed border-border/70 bg-muted/20 text-center cursor-pointer hover:bg-muted/40 transition-colors flex items-center justify-center gap-2"
            >
              <Paperclip className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground">
                {hasEvidence ? `Evidencia adjunta: ${evidenceFileName}` : "Adjuntar evidencia digital (Acta firmada, receta médica o fotos)"}
              </span>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold h-10 px-4"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              Registrar Incidencia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
