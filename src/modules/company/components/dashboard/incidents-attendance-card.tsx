"use client";

import React, { useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Check,
  Plus,
  ShieldAlert,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanyStatusBadge } from "../shared/company-status-badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PendingIncidentItem {
  id: string;
  employeeName: string;
  avatarUrl?: string;
  department: string;
  type: "falta_injustificada" | "retardo" | "incapacidad" | "permiso" | "horas_extra" | "vacaciones";
  typeLabel: string;
  title: string;
  description: string;
  date: string;
  severity: "baja" | "media" | "alta" | "critica";
  status: "pendiente" | "aprobado" | "rechazado";
  hoursRequested?: number;
}

interface AttendanceTodayItem {
  id: string;
  employeeName: string;
  avatarUrl?: string;
  jobTitle: string;
  department: string;
  checkInTime?: string;
  status: "puntual" | "retardo" | "ausente";
  delayMinutes?: number;
}

const INITIAL_INCIDENTS: PendingIncidentItem[] = [
  {
    id: "inc-1",
    employeeName: "Mateo Canto Solís",
    department: "Cocina Caliente",
    type: "permiso",
    typeLabel: "Permiso con Goce",
    title: "Permiso por cita médica familiar",
    description: "Solicita salir 2 horas antes para acompañar a su hijo a consulta clínica del IMSS.",
    date: "Hoy, 29 Oct",
    severity: "media",
    status: "pendiente",
    hoursRequested: 2,
  },
  {
    id: "inc-2",
    employeeName: "Ana Laura Poot",
    department: "Housekeeping",
    type: "incapacidad",
    typeLabel: "Incapacidad IMSS",
    title: "Presentación de certificado de incapacidad",
    description: "Incapacidad por enfermedad general expedida por el IMSS por 3 días hábiles.",
    date: "Ayer, 28 Oct",
    severity: "alta",
    status: "pendiente",
  },
  {
    id: "inc-3",
    employeeName: "Carlos Pool Chi",
    department: "Mantenimiento",
    type: "horas_extra",
    typeLabel: "Horas Extra",
    title: "Autorización de tiempo extraordinario",
    description: "Reparación de fuga en cisterna principal fuera de turno regular (3 horas).",
    date: "27 Oct, 2026",
    severity: "media",
    status: "pendiente",
    hoursRequested: 3,
  },
];

const INITIAL_ATTENDANCE: AttendanceTodayItem[] = [
  {
    id: "att-1",
    employeeName: "Karla Romero Méndez",
    jobTitle: "Supervisora de Pisos",
    department: "Housekeeping",
    checkInTime: "07:54 AM",
    status: "puntual",
  },
  {
    id: "att-2",
    employeeName: "Javier Briceño Canul",
    jobTitle: "Bartender Principal",
    department: "Alimentos y Bebidas",
    checkInTime: "08:18 AM",
    status: "retardo",
    delayMinutes: 18,
  },
  {
    id: "att-3",
    employeeName: "Fernanda Ucán May",
    jobTitle: "Hostess",
    department: "Restaurante",
    checkInTime: "07:58 AM",
    status: "puntual",
  },
  {
    id: "att-4",
    employeeName: "Emilio Escalante V.",
    jobTitle: "Stewart",
    department: "Steward",
    status: "ausente",
  },
];

export function IncidentsAttendanceCard() {
  const [incidents, setIncidents] = useState<PendingIncidentItem[]>(INITIAL_INCIDENTS);
  const [attendanceList] = useState<AttendanceTodayItem[]>(INITIAL_ATTENDANCE);
  const [selectedIncident, setSelectedIncident] = useState<PendingIncidentItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);

  // Form states for new incident
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newType, setNewType] = useState<PendingIncidentItem["type"]>("permiso");
  const [newSeverity, setNewSeverity] = useState<PendingIncidentItem["severity"]>("media");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const handleResolveIncident = (id: string, newStatus: "aprobado" | "rechazado") => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc))
    );

    const actionText = newStatus === "aprobado" ? "autorizada" : "rechazada";
    toast.success(`Incidencia ${actionText}`, {
      description: "El estado se reflejará en la pre-nómina de la quincena en curso.",
    });

    setIsDetailModalOpen(false);
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName || !newTitle) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    const newInc: PendingIncidentItem = {
      id: `inc-${Date.now()}`,
      employeeName: newEmployeeName,
      department: "Operaciones Generales",
      type: newType,
      typeLabel:
        newType === "permiso"
          ? "Permiso Personal"
          : newType === "incapacidad"
          ? "Incapacidad"
          : newType === "horas_extra"
          ? "Horas Extra"
          : "Incidencia",
      title: newTitle,
      description: newDescription || "Incidencia registrada manualmente por supervisor.",
      date: "Hoy",
      severity: newSeverity,
      status: "pendiente",
    };

    setIncidents((prev) => [newInc, ...prev]);
    toast.success("Incidencia registrada con éxito");
    setIsNewIncidentOpen(false);

    // Reset
    setNewEmployeeName("");
    setNewTitle("");
    setNewDescription("");
  };

  const pendingCount = incidents.filter((i) => i.status === "pendiente").length;

  const getSeverityBadge = (sev: PendingIncidentItem["severity"]) => {
    switch (sev) {
      case "critica":
        return <CompanyStatusBadge status="destructive" label="Crítica" />;
      case "alta":
        return <CompanyStatusBadge status="warning" label="Alta" />;
      case "media":
        return <CompanyStatusBadge status="info" label="Media" />;
      default:
        return <CompanyStatusBadge status="neutral" label="Baja" />;
    }
  };

  return (
    <Card id="incidents-section" className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Asistencia & Gestión de Incidencias
              </h3>
              {pendingCount > 0 && (
                <CompanyStatusBadge
                  status="warning"
                  label={`${pendingCount} por autorizar`}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Control de asistencias del turno, retardos y autorizaciones de personal.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsNewIncidentOpen(true)}
          className="self-start sm:self-center"
        >
          <Plus data-icon="inline-start" />
          <span>Registrar Incidencia</span>
        </Button>
      </div>

      <Tabs defaultValue="incidents" className="w-full">
        <TabsList className="grid grid-cols-2 w-full sm:w-80">
          <TabsTrigger value="incidents" className="flex items-center gap-1.5">
            <FileText className="size-3.5" />
            <span>Incidencias ({pendingCount})</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>Checador de Hoy</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Incidencias Pendientes */}
        <TabsContent value="incidents" className="space-y-3 pt-3 focus:outline-none">
          {incidents.length === 0 ? (
            <div className="p-8 text-center bg-muted/20 rounded-3xl border border-dashed border-border space-y-2">
              <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-foreground">
                Al día con las incidencias
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No hay permisos, incapacidades o solicitudes pendientes de autorizar.
              </p>
            </div>
          ) : (
            incidents.map((incident) => {
              const isPending = incident.status === "pendiente";

              return (
                <div
                  key={incident.id}
                  className={cn(
                    "p-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5",
                    isPending
                      ? "bg-card border-border hover:border-primary/40"
                      : "bg-muted/20 border-border/40 opacity-75"
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar className="size-10 rounded-2xl shrink-0 border border-border">
                      <AvatarImage src={incident.avatarUrl || ""} />
                      <AvatarFallback className="rounded-2xl text-xs font-bold bg-muted text-muted-foreground">
                        {incident.employeeName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {incident.employeeName}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          • {incident.department}
                        </span>
                        {getSeverityBadge(incident.severity)}
                      </div>
                      <h4 className="text-xs font-bold text-foreground truncate">
                        {incident.title}
                      </h4>
                      <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                        {incident.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isPending ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveIncident(incident.id, "rechazado")}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <X data-icon="inline-start" />
                          <span>Rechazar</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleResolveIncident(incident.id, "aprobado")}
                        >
                          <Check data-icon="inline-start" />
                          <span>Autorizar</span>
                        </Button>
                      </>
                    ) : (
                      <CompanyStatusBadge
                        status={incident.status === "aprobado" ? "success" : "destructive"}
                        label={incident.status === "aprobado" ? "Autorizado" : "Rechazado"}
                      />
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedIncident(incident);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* TAB 2: Checador de Hoy */}
        <TabsContent value="attendance" className="space-y-3 pt-3 focus:outline-none">
          {attendanceList.length === 0 ? (
            <div className="p-8 text-center bg-muted/20 rounded-3xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">
                No hay registros de checador para el turno de hoy.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-3xl border border-border overflow-hidden bg-card">
              {attendanceList.map((item) => {
                const isAbsent = item.status === "ausente";
                const isLate = item.status === "retardo";

                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:px-4 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-8 rounded-xl shrink-0 border border-border">
                        <AvatarImage src={item.avatarUrl || ""} />
                        <AvatarFallback className="rounded-xl text-[10px] font-bold bg-muted text-muted-foreground">
                          {item.employeeName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="truncate">
                        <span className="font-semibold text-foreground block truncate">
                          {item.employeeName}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium truncate block">
                          {item.jobTitle} • {item.department}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-bold text-foreground block">
                          {item.checkInTime || "--:--"}
                        </span>
                        {item.delayMinutes && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                            +{item.delayMinutes} min
                          </span>
                        )}
                      </div>

                      <CompanyStatusBadge
                        status={isAbsent ? "destructive" : isLate ? "warning" : "success"}
                        label={isAbsent ? "Ausente" : isLate ? "Retardo" : "Puntual"}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal: Detalle de Incidencia */}
      {selectedIncident && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-0.5 rounded-3xl"
                >
                  {selectedIncident.typeLabel}
                </Badge>
                {getSeverityBadge(selectedIncident.severity)}
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {selectedIncident.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Solicitud registrada el {selectedIncident.date} para {selectedIncident.employeeName} ({selectedIncident.department}).
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 bg-muted/30 rounded-3xl border border-border text-xs leading-relaxed space-y-2 text-foreground font-medium">
              <span className="font-bold text-muted-foreground block">Descripción detallada:</span>
              <p>{selectedIncident.description}</p>
              {selectedIncident.hoursRequested && (
                <div className="pt-2 text-xs font-bold text-primary">
                  Tiempo involucrado: {selectedIncident.hoursRequested} horas
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Cerrar
              </Button>
              {selectedIncident.status === "pendiente" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleResolveIncident(selectedIncident.id, "rechazado")}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    Rechazar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleResolveIncident(selectedIncident.id, "aprobado")}
                  >
                    Autorizar
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Registrar Nueva Incidencia */}
      <Dialog open={isNewIncidentOpen} onOpenChange={setIsNewIncidentOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateIncident} className="space-y-4">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg font-bold text-foreground">
                Registrar Incidencia de Personal
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Agrega un permiso, incapacidad o ajuste laboral para la plantilla.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="inc-emp-name" className="text-xs font-semibold text-foreground">
                  Empleado involucrado *
                </Label>
                <Input
                  id="inc-emp-name"
                  placeholder="Ej. Carlos Mendoza"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Tipo de Incidencia
                  </Label>
                  <Select
                    value={newType}
                    onValueChange={(val) => setNewType(val as PendingIncidentItem["type"])}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permiso">Permiso Personal</SelectItem>
                      <SelectItem value="incapacidad">Incapacidad Médica</SelectItem>
                      <SelectItem value="horas_extra">Horas Extra</SelectItem>
                      <SelectItem value="falta_injustificada">Falta Injustificada</SelectItem>
                      <SelectItem value="retardo">Retardo Mayor</SelectItem>
                      <SelectItem value="vacaciones">Vacaciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Prioridad
                  </Label>
                  <Select
                    value={newSeverity}
                    onValueChange={(val) => setNewSeverity(val as PendingIncidentItem["severity"])}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inc-title" className="text-xs font-semibold text-foreground">
                  Título del Motivo *
                </Label>
                <Input
                  id="inc-title"
                  placeholder="Ej. Permiso por trámite bancario / cita"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inc-desc" className="text-xs font-semibold text-foreground">
                  Detalles u observaciones
                </Label>
                <Textarea
                  id="inc-desc"
                  placeholder="Describe la justificación, comprobantes o notas..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="min-h-[70px] resize-none"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewIncidentOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Guardar Incidencia
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
