"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  UserCheck,
  UserX,
  FileText,
  Search,
  Check,
  X,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { PendingIncidentItem, TodayAttendanceItem } from "../../types/dashboard";

interface IncidentsAttendanceCardProps {
  initialIncidents: PendingIncidentItem[];
  attendanceList: TodayAttendanceItem[];
}

export function IncidentsAttendanceCard({
  initialIncidents,
  attendanceList,
}: IncidentsAttendanceCardProps) {
  const [incidents, setIncidents] = useState<PendingIncidentItem[]>(initialIncidents);
  const [selectedIncident, setSelectedIncident] = useState<PendingIncidentItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);

  // New Incident Form state
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newType, setNewType] = useState<PendingIncidentItem["type"]>("permiso");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSeverity, setNewSeverity] = useState<PendingIncidentItem["severity"]>("media");

  const handleResolveIncident = (id: string, newStatus: "aprobado" | "rechazado") => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc))
    );
    toast.success(
      newStatus === "aprobado"
        ? "Incidencia autorizada con éxito"
        : "Incidencia rechazada",
      {
        description: "El estatus ha sido actualizado para el cierre de nómina.",
      }
    );
    setIsDetailModalOpen(false);
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName.trim() || !newTitle.trim()) {
      toast.error("Por favor completa los campos requeridos.");
      return;
    }

    const createdItem: PendingIncidentItem = {
      id: `inc-manual-${Date.now()}`,
      employeeId: "emp-manual",
      employeeName: newEmployeeName.trim(),
      avatarUrl: null,
      department: "Operaciones",
      type: newType,
      typeLabel:
        newType === "permiso"
          ? "Permiso Personal"
          : newType === "incapacidad"
          ? "Incapacidad IMSS"
          : newType === "horas_extra"
          ? "Horas Extra"
          : "Incidencia Operativa",
      title: newTitle.trim(),
      description: newDescription.trim() || "Registrada manualmente desde el panel.",
      date: new Date().toISOString().split("T")[0],
      severity: newSeverity,
      status: "pendiente",
    };

    setIncidents((prev) => [createdItem, ...prev]);
    toast.success("Incidencia registrada con éxito", {
      description: "Aparecerá en la lista para su revisión y cómputo.",
    });

    setNewEmployeeName("");
    setNewTitle("");
    setNewDescription("");
    setIsNewIncidentOpen(false);
  };

  const pendingCount = incidents.filter((i) => i.status === "pendiente").length;

  const getSeverityBadge = (severity: PendingIncidentItem["severity"]) => {
    switch (severity) {
      case "critica":
      case "alta":
        return (
          <Badge className="bg-destructive/15 text-destructive border-none text-[10px] font-bold px-2 py-0.5 rounded-full">
            Alta Prioridad
          </Badge>
        );
      case "media":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none text-[10px] font-bold px-2 py-0.5 rounded-full">
            Revisión Normal
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border-none text-[10px] font-bold px-2 py-0.5 rounded-full">
            Baja
          </Badge>
        );
    }
  };

  return (
    <Card id="incidents-section" className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-foreground">
                Asistencia & Gestión de Incidencias
              </h3>
              {pendingCount > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pendingCount} por autorizar
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Control de asistencias del turno, retardos y autorizaciones de personal.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setIsNewIncidentOpen(true)}
          className="rounded-xl text-xs font-bold h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 self-start sm:self-center shadow-xs"
        >
          <Plus className="size-3.5" />
          <span>Registrar Incidencia</span>
        </Button>
      </div>

      <Tabs defaultValue="incidents" className="w-full">
        <TabsList className="grid grid-cols-2 w-full sm:w-72 h-10 bg-muted/60 p-1 rounded-xl mb-4">
          <TabsTrigger value="incidents" className="text-xs font-bold rounded-lg flex items-center gap-1.5">
            <FileText className="size-3.5" />
            <span>Incidencias ({pendingCount})</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs font-bold rounded-lg flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>Checador de Hoy</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Incidencias Pendientes */}
        <TabsContent value="incidents" className="space-y-3 focus:outline-none">
          {incidents.length === 0 ? (
            <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/60 space-y-2">
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
                    "p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5",
                    isPending
                      ? "bg-background border-border/60 hover:border-border shadow-xs"
                      : "bg-muted/25 border-border/30 opacity-75"
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar className="size-9 rounded-lg shrink-0 border border-border/40">
                      <AvatarImage src={incident.avatarUrl || ""} />
                      <AvatarFallback className="rounded-lg text-xs font-bold bg-muted text-muted-foreground">
                        {incident.employeeName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-foreground">
                          {incident.employeeName}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          • {incident.department}
                        </span>
                        {getSeverityBadge(incident.severity)}
                      </div>
                      <h4 className="text-xs font-extrabold text-foreground truncate">
                        {incident.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">
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
                          className="h-8 px-2.5 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                        >
                          <X className="size-3.5 mr-1" />
                          Rechazar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleResolveIncident(incident.id, "aprobado")}
                          className="h-8 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          <Check className="size-3.5 mr-1" />
                          Autorizar
                        </Button>
                      </>
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-bold px-2.5 py-1 rounded-lg border-none",
                          incident.status === "aprobado"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-destructive/15 text-destructive"
                        )}
                      >
                        {incident.status === "aprobado" ? "Autorizado" : "Rechazado"}
                      </Badge>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedIncident(incident);
                        setIsDetailModalOpen(true);
                      }}
                      className="h-8 px-2 text-xs font-bold text-muted-foreground hover:text-foreground rounded-lg"
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
        <TabsContent value="attendance" className="space-y-2.5 focus:outline-none">
          {attendanceList.length === 0 ? (
            <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/60">
              <p className="text-xs text-muted-foreground">
                No hay registros de checador para el turno de hoy.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30 rounded-xl border border-border/40 overflow-hidden bg-background">
              {attendanceList.map((item) => {
                const isAbsent = item.status === "ausente";
                const isLate = item.status === "retardo";

                return (
                  <div
                    key={item.id}
                    className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-8 rounded-lg shrink-0 border border-border/40">
                        <AvatarImage src={item.avatarUrl || ""} />
                        <AvatarFallback className="rounded-lg text-[10px] font-bold bg-muted text-muted-foreground">
                          {item.employeeName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="truncate">
                        <span className="font-extrabold text-foreground block truncate">
                          {item.employeeName}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium truncate block">
                          {item.jobTitle} • {item.department}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-extrabold text-foreground block">
                          {item.checkInTime || "--:--"}
                        </span>
                        {item.delayMinutes && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                            +{item.delayMinutes} min
                          </span>
                        )}
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border-none",
                          isAbsent
                            ? "bg-destructive/15 text-destructive"
                            : isLate
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {isAbsent ? "Ausente" : isLate ? "Retardo" : "Puntual"}
                      </Badge>
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
          <DialogContent className="sm:max-w-[480px] rounded-2xl p-6 bg-card border-border/80">
            <DialogHeader className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-none text-xs font-bold rounded-full">
                  {selectedIncident.typeLabel}
                </Badge>
                {getSeverityBadge(selectedIncident.severity)}
              </div>
              <DialogTitle className="text-lg font-extrabold text-foreground">
                {selectedIncident.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Solicitud registrada el {selectedIncident.date} para {selectedIncident.employeeName} ({selectedIncident.department}).
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 bg-muted/30 rounded-xl border border-border/40 text-xs leading-relaxed space-y-2 text-foreground font-medium">
              <span className="font-bold block text-muted-foreground">Descripción detallada:</span>
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
                className="rounded-xl text-xs font-bold h-10 px-4"
              >
                Cerrar
              </Button>
              {selectedIncident.status === "pendiente" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleResolveIncident(selectedIncident.id, "rechazado")}
                    className="rounded-xl text-xs font-bold h-10 px-4 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                  >
                    Rechazar Solicitud
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleResolveIncident(selectedIncident.id, "aprobado")}
                    className="rounded-xl text-xs font-bold h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Autorizar e Integrar
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Registrar Nueva Incidencia */}
      <Dialog open={isNewIncidentOpen} onOpenChange={setIsNewIncidentOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl p-6 bg-card border-border/80">
          <form onSubmit={handleCreateIncident} className="space-y-4">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg font-extrabold text-foreground">
                Registrar Incidencia de Personal
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Agrega un permiso, incapacidad o ajuste laboral para la plantilla.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="inc-emp-name" className="text-xs font-bold text-foreground">
                  Colaborador involucrado *
                </Label>
                <Input
                  id="inc-emp-name"
                  placeholder="Ej. Carlos Mendoza"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Tipo de Incidencia
                  </Label>
                  <Select
                    value={newType}
                    onValueChange={(val) => setNewType(val as PendingIncidentItem["type"])}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
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
                  <Label className="text-xs font-bold text-foreground">
                    Prioridad
                  </Label>
                  <Select
                    value={newSeverity}
                    onValueChange={(val) => setNewSeverity(val as PendingIncidentItem["severity"])}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inc-title" className="text-xs font-bold text-foreground">
                  Título del Motivo *
                </Label>
                <Input
                  id="inc-title"
                  placeholder="Ej. Permiso por trámite bancario / cita"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inc-desc" className="text-xs font-bold text-foreground">
                  Detalles u observaciones
                </Label>
                <Textarea
                  id="inc-desc"
                  placeholder="Describe la justificación, comprobantes o notas..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="min-h-[70px] rounded-xl bg-background border-border/80 text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewIncidentOpen(false)}
                className="rounded-xl text-xs font-bold h-10 px-4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
              >
                Guardar Incidencia
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
