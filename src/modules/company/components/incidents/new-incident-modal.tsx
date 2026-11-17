"use client";

import React, { useState, useRef } from "react";
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
  Loader2,
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
import { getMexicoDateISO } from "@/lib/formatters";
import { LaborIncident, IncidentCategory, IncidentSeverity } from "../../types/incidents";
import { createIncidentAction } from "../../actions/incidents";

export interface EmployeeRosterOption {
  id: string;
  fullName: string;
  jobTitle?: string | null;
  department?: string | null;
}

interface NewIncidentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onIncidentCreated: (incident: LaborIncident) => void;
  employees?: EmployeeRosterOption[];
}

export function NewIncidentModal({
  isOpen,
  onOpenChange,
  onIncidentCreated,
  employees = [],
}: NewIncidentModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [employeeName, setEmployeeName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState<IncidentCategory>("falta_injustificada");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("media");
  const [incidentDate, setIncidentDate] = useState(getMexicoDateISO());
  const [supervisor, setSupervisor] = useState("");
  const [hasEvidence, setHasEvidence] = useState(false);
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryLabels: Record<IncidentCategory, string> = {
    falta_injustificada: "Falta Injustificada",
    retardo: "Retardo de Turno",
    accidente: "Accidente de Trabajo (ST-7)",
    queja: "Queja / Reporte de Conducta",
    permiso: "Permiso Especial",
    suspension: "Suspensión Administrativa",
    incumplimiento: "Acta Administrativa / Incumplimiento",
    reconocimiento: "⭐ Reconocimiento / Desempeño Destacado",
    incapacidad: "Incapacidad Médica (IMSS)",
    otro: "Otra Incidencia",
  };

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setEmployeeName(emp.fullName);
      setJobTitle(emp.jobTitle || "Empleado");
      setDepartment(emp.department || "Operaciones");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !title.trim() || !description.trim()) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }

    setIsSubmitting(true);
    try {
      let evidenceUrl: string | undefined = undefined;
      if (evidenceFile) {
        evidenceUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(evidenceFile);
        });
      }

      const res = await createIncidentAction({
        employeeId: selectedEmployeeId || undefined,
        employeeName: employeeName.trim(),
        jobTitle: jobTitle.trim() || undefined,
        department: department.trim() || undefined,
        category,
        categoryLabel: categoryLabels[category],
        title: title.trim(),
        description: description.trim(),
        incidentDate,
        severity,
        responsibleSupervisor: supervisor.trim() || undefined,
        evidenceUrl,
        evidenceFileName: hasEvidence ? evidenceFileName || evidenceFile?.name || "Evidencia.pdf" : undefined,
        evidenceType:
          category === "accidente" || category === "incapacidad"
            ? "receta_medica"
            : category === "incumplimiento" || category === "falta_injustificada"
            ? "acta_administrativa"
            : "documento",
      });

      if (!res.success || !res.incident) {
        toast.error("Error al registrar incidencia", {
          description: res.error || "Ocurrió un problema con el servidor.",
        });
        return;
      }

      onIncidentCreated(res.incident);
      toast.success("Incidencia registrada en el expediente laboral", {
        description: `${categoryLabels[category]} registrada para ${employeeName}.`,
      });

      // Reset
      setTitle("");
      setDescription("");
      setHasEvidence(false);
      setEvidenceFileName("");
      setSelectedEmployeeId("");
      setEmployeeName("");
      setJobTitle("");
      setDepartment("");
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo conectar con la base de datos.";
      toast.error("Error inesperado", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] p-6 max-h-[90vh] overflow-y-auto">
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
              Documenta eventos operativos, actas administrativas o reconocimientos destacados respaldados en la nube.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-1">
            {/* Selector de Empleado */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Empleado de la Plantilla *
              </Label>
              {employees.length > 0 ? (
                <Select
                  value={selectedEmployeeId}
                  onValueChange={(val) => {
                    if (val) handleSelectEmployee(val);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un empleado..." />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} side="bottom" sideOffset={4} className="w-(--anchor-width) min-w-[280px] max-h-60">
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="text-xs">
                        {emp.fullName} {emp.jobTitle ? `— ${emp.jobTitle}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {/* Si no hay empleados en lista o se desea capturar manualmente */}
              <Input
                value={employeeName}
                onChange={(e) => {
                  setEmployeeName(e.target.value);
                  setSelectedEmployeeId("");
                }}
                placeholder="O escribe el nombre completo del empleado..."
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Puesto / Cargo</Label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ej. Cocinero A, Auxiliar..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Departamento / Área</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ej. Operaciones, Ventas..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Fecha del Suceso *</Label>
                <Input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Nivel de Severidad</Label>
                <Select
                  value={severity}
                  onValueChange={(val) => val && setSeverity(val as IncidentSeverity)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {({
                        baja: "Baja (Informativo / Leve)",
                        media: "Media (Aviso / Descuento)",
                        alta: "Alta (Acta / Sanción)",
                        critica: "Crítica (Riesgo / Rescisión)",
                      } as Record<string, string>)[severity] || severity}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} side="bottom" sideOffset={4} className="w-(--anchor-width) min-w-[240px]">
                    <SelectItem value="baja">Baja (Informativo / Leve)</SelectItem>
                    <SelectItem value="media">Media (Aviso / Descuento)</SelectItem>
                    <SelectItem value="alta">Alta (Acta / Sanción)</SelectItem>
                    <SelectItem value="critica">Crítica (Riesgo / Rescisión)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Categoría */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Tipo de Incidencia / Trámite *</Label>
              <Select
                value={category}
                onValueChange={(val) => val && setCategory(val as IncidentCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{categoryLabels[category] || category}</SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} side="bottom" sideOffset={4} className="w-(--anchor-width) min-w-[260px] max-h-60">
                  <SelectItem value="falta_injustificada">Falta Injustificada</SelectItem>
                  <SelectItem value="retardo">Retardo de Turno</SelectItem>
                  <SelectItem value="accidente">Accidente de Trabajo (ST-7)</SelectItem>
                  <SelectItem value="incapacidad">Incapacidad Médica (IMSS)</SelectItem>
                  <SelectItem value="queja">Queja / Reporte de Conducta</SelectItem>
                  <SelectItem value="permiso">Permiso Especial</SelectItem>
                  <SelectItem value="suspension">Suspensión Administrativa</SelectItem>
                  <SelectItem value="incumplimiento">Acta Administrativa / Incumplimiento</SelectItem>
                  <SelectItem value="reconocimiento">⭐ Reconocimiento / Desempeño Destacado</SelectItem>
                  <SelectItem value="otro">Otra Incidencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Título Resumido *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Falta injustificada sin aviso en fin de semana"
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
                className="min-h-[80px] resize-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Supervisor Responsable</Label>
              <Input
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                placeholder="Ej. Ing. Carlos Salinas / Recursos Humanos"
              />
            </div>

            {/* Evidence Attachment */}
            <input
              ref={evidenceInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setEvidenceFile(file);
                  setEvidenceFileName(file.name);
                  setHasEvidence(true);
                  toast.success("Documento de evidencia seleccionado", {
                    description: file.name,
                  });
                }
              }}
            />
            <div
              onClick={() => evidenceInputRef.current?.click()}
              className="p-3.5 rounded-2xl border border-dashed border-border/70 bg-muted/20 text-center cursor-pointer hover:bg-muted/40 transition-colors flex items-center justify-center gap-2"
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
              disabled={isSubmitting}
              size="sm"
              className="font-bold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="font-bold flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Registrar Incidencia</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
