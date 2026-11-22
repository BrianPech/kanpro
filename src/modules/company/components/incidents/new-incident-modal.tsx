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
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  LaborIncident,
  IncidentCategory,
  IncidentSeverity,
  INCIDENT_EVIDENCE_BUCKET,
} from "../../types/incidents";
import {
  createIncidentAction,
  prepareIncidentEvidenceUploadAction,
} from "../../actions/incidents";

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
  const [folioImss, setFolioImss] = useState("");
  const [diasAmparados, setDiasAmparados] = useState<number>(1);
  const [ramoImss, setRamoImss] = useState<"enfermedad_general" | "riesgo_trabajo" | "maternidad">(
    "enfermedad_general"
  );
  const [complementoEmpresa, setComplementoEmpresa] = useState<number>(0);
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
    if (category === "incapacidad") {
      if (folioImss.trim().length < 3) {
        toast.error("Ingresa el folio de incapacidad IMSS (mínimo 3 caracteres).");
        return;
      }
      if (!Number.isInteger(diasAmparados) || diasAmparados < 1) {
        toast.error("Los días amparados IMSS deben ser un entero mayor o igual a 1.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let evidenceUrl: string | undefined = undefined;
      if (evidenceFile) {
        const target = await prepareIncidentEvidenceUploadAction({
          fileName: evidenceFile.name,
          mimeType: evidenceFile.type,
          size: evidenceFile.size,
        });
        if (!target.success || !target.data) {
          toast.error("No se pudo adjuntar la evidencia", { description: target.error });
          return;
        }

        const { error: uploadError } = await createBrowserSupabaseClient()
          .storage.from(INCIDENT_EVIDENCE_BUCKET)
          .uploadToSignedUrl(target.data.path, target.data.token, evidenceFile);
        if (uploadError) {
          toast.error("No se pudo subir la evidencia", { description: uploadError.message });
          return;
        }
        evidenceUrl = target.data.path;
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
        ...(category === "incapacidad"
          ? {
              folioImss: folioImss.trim(),
              diasAmparados,
              ramoImss,
              complementoEmpresa: Math.max(0, Number(complementoEmpresa) || 0),
            }
          : {}),
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
      setFolioImss("");
      setDiasAmparados(1);
      setRamoImss("enfermedad_general");
      setComplementoEmpresa(0);
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
                    <SelectValue placeholder="Selecciona un empleado...">
                      {(val: string | null) => {
                        const emp = employees.find((e) => e.id === val);
                        return emp
                          ? `${emp.fullName}${emp.jobTitle ? ` — ${emp.jobTitle}` : ""}`
                          : "Selecciona un empleado...";
                      }}
                    </SelectValue>
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

            {category === "incapacidad" && (
              <div className="p-3.5 rounded-2xl border border-sky-500/30 bg-sky-500/5 space-y-3">
                <div className="text-xs font-extrabold text-sky-700 dark:text-sky-300">
                  Datos de Incapacidad IMSS (no cuenta como falta ni salario ordinario)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="folio-imss" className="text-xs font-bold text-foreground">
                      Folio IMSS *
                    </Label>
                    <Input
                      id="folio-imss"
                      value={folioImss}
                      onChange={(e) => setFolioImss(e.target.value)}
                      placeholder="Ej. IMSS-482910"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dias-amparados" className="text-xs font-bold text-foreground">
                      Días amparados *
                    </Label>
                    <Input
                      id="dias-amparados"
                      type="number"
                      min={1}
                      max={365}
                      value={diasAmparados}
                      onChange={(e) =>
                        setDiasAmparados(Math.max(1, Math.min(365, Math.floor(Number(e.target.value) || 1))))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Ramo IMSS *</Label>
                    <Select
                      value={ramoImss}
                      onValueChange={(val) =>
                        val &&
                        setRamoImss(
                          val as "enfermedad_general" | "riesgo_trabajo" | "maternidad"
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enfermedad_general">Enfermedad General</SelectItem>
                        <SelectItem value="riesgo_trabajo">Riesgo de Trabajo</SelectItem>
                        <SelectItem value="maternidad">Maternidad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="complemento-imss" className="text-xs font-bold text-foreground">
                      Complemento empresa (MXN)
                    </Label>
                    <Input
                      id="complemento-imss"
                      type="number"
                      min={0}
                      step="0.01"
                      value={complementoEmpresa}
                      onChange={(e) =>
                        setComplementoEmpresa(Math.max(0, Number(e.target.value) || 0))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

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
