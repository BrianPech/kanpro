"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Search,
  Plus,
  ArrowLeft,
  FileSpreadsheet,
  AlertTriangle,
  Award,
  Eye,
  Paperclip,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LaborIncident } from "../types/incidents";
import { NewIncidentModal, EmployeeRosterOption } from "./incidents/new-incident-modal";
import { IncidentEvidenceModal } from "./incidents/incident-evidence-modal";
import { updateIncidentStatusAction, deleteIncidentAction } from "../actions/incidents";

interface IncidentsViewProps {
  initialIncidents?: LaborIncident[];
  employees?: EmployeeRosterOption[];
  kpis?: {
    pendingIncidentsCount?: number;
    criticalIncidentsCount?: number;
  };
}

export function IncidentsView({
  initialIncidents = [],
  employees = [],
  kpis,
}: IncidentsViewProps) {
  const [incidents, setIncidents] = useState<LaborIncident[]>(initialIncidents);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [selectedIncident, setSelectedIncident] = useState<LaborIncident | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const filteredIncidents = incidents.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.employeeName.toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.department.toLowerCase().includes(query) ||
      item.categoryLabel.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
    const matchesCategory = categoryFilter === "all" ? true : item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleResolve = async (id: string, newStatus: "aprobado" | "rechazado" | "resuelto") => {
    const prevIncidents = [...incidents];
    // Optimistic update
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    );

    try {
      const res = await updateIncidentStatusAction({
        incidentId: id,
        status: newStatus,
      });

      if (!res.success) {
        setIncidents(prevIncidents);
        toast.error("Error al actualizar la incidencia", {
          description: res.error || "No se pudo guardar la resolución.",
        });
        return;
      }

      toast.success("Estatus de la incidencia actualizado", {
        description: `La resolución ha sido guardada en la base de datos.`,
      });
    } catch (err: any) {
      setIncidents(prevIncidents);
      toast.error("Error de conexión", {
        description: err.message || "No se pudo comunicar con el servidor.",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Deseas eliminar este registro de incidencia permanentemente?")) return;

    const prevIncidents = [...incidents];
    setIncidents((prev) => prev.filter((i) => i.id !== id));

    try {
      const res = await deleteIncidentAction(id);
      if (!res.success) {
        setIncidents(prevIncidents);
        toast.error("No se pudo eliminar la incidencia", {
          description: res.error,
        });
        return;
      }
      toast.success("Incidencia eliminada del expediente");
    } catch (err: any) {
      setIncidents(prevIncidents);
      toast.error("Error al eliminar", { description: err.message });
    }
  };

  const handleIncidentCreated = (newInc: LaborIncident) => {
    setIncidents((prev) => [newInc, ...prev]);
  };

  const handleExport = () => {
    if (incidents.length === 0) {
      toast.error("No hay incidencias registradas para exportar.");
      return;
    }

    setIsExporting(true);
    try {
      const headers = [
        "Colaborador",
        "Puesto",
        "Departamento",
        "Categoría",
        "Título",
        "Descripción",
        "Fecha",
        "Severidad",
        "Supervisor",
        "Estatus",
      ];

      const rows = incidents.map((i) => [
        `"${(i.employeeName || "").replace(/"/g, '""')}"`,
        `"${(i.jobTitle || "").replace(/"/g, '""')}"`,
        `"${(i.department || "").replace(/"/g, '""')}"`,
        `"${(i.categoryLabel || "").replace(/"/g, '""')}"`,
        `"${(i.title || "").replace(/"/g, '""')}"`,
        `"${(i.description || "").replace(/"/g, '""')}"`,
        `"${i.incidentDate || ""}"`,
        `"${i.severity || ""}"`,
        `"${(i.responsibleSupervisor || "").replace(/"/g, '""')}"`,
        `"${i.status || ""}"`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `bitacora_incidencias_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Bitácora de Incidencias descargada", {
        description: `Exportados ${incidents.length} registros en formato CSV.`,
      });
    } catch {
      toast.error("Error al exportar los datos.");
    } finally {
      setIsExporting(false);
    }
  };

  const pendingCount = incidents.filter((i) => i.status === "pendiente").length;
  const recognitionCount = incidents.filter((i) => i.category === "reconocimiento").length;
  const criticalCount = incidents.filter((i) => i.severity === "alta" || i.severity === "critica").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/company"
              className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Volver al Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="size-7 text-primary" />
            <span>Incidencias Laborales & Reconocimientos</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
            Registro formal de faltas, retardos, accidentes ST-7, incapacidades IMSS, quejas, permisos y méritos destacados.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-xl text-xs font-bold h-10 px-4 border-border/70 shadow-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="size-3.5" />
            <span>{isExporting ? "Generando..." : "Descargar Bitácora"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="rounded-xl text-xs font-bold h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            <span>Registrar Incidencia</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Incidencias por Resolver</span>
            <Badge className="bg-amber-500 text-white border-none text-[10px]">
              Pendientes
            </Badge>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {pendingCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Requieren dictamen o justificación de RH
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Actas & Severidad Alta</span>
            <AlertTriangle className="size-4 text-destructive" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-destructive">
            {criticalCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Faltas injustificadas o actas administrativas
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Reconocimientos Otorgados</span>
            <Award className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {recognitionCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Méritos y felicitaciones al colaborador
          </p>
        </Card>
      </div>

      {/* Main List */}
      <Card className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por colaborador, título o tipo de incidencia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={categoryFilter}
              onValueChange={(val) => val && setCategoryFilter(val)}
            >
              <SelectTrigger className="h-10 w-44 rounded-xl bg-background border-border/80 text-xs font-medium">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="falta_injustificada">Falta Injustificada</SelectItem>
                <SelectItem value="retardo">Retardo</SelectItem>
                <SelectItem value="accidente">Accidente de Trabajo</SelectItem>
                <SelectItem value="incapacidad">Incapacidad Médica</SelectItem>
                <SelectItem value="queja">Queja / Conducta</SelectItem>
                <SelectItem value="permiso">Permiso Especial</SelectItem>
                <SelectItem value="suspension">Suspensión</SelectItem>
                <SelectItem value="incumplimiento">Acta Administrativa</SelectItem>
                <SelectItem value="reconocimiento">⭐ Reconocimiento</SelectItem>
                <SelectItem value="otro">Otra Incidencia</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(val) => val && setStatusFilter(val)}
            >
              <SelectTrigger className="h-10 w-36 rounded-xl bg-background border-border/80 text-xs font-medium">
                <SelectValue placeholder="Estatus" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todos los estatus</SelectItem>
                <SelectItem value="pendiente">🟡 Pendientes</SelectItem>
                <SelectItem value="aprobado">🟢 Aprobados</SelectItem>
                <SelectItem value="resuelto">⭐ Resueltos</SelectItem>
                <SelectItem value="rechazado">🔴 Rechazados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center bg-muted/20 rounded-xl border border-dashed border-border/60 space-y-2">
            <CheckCircle2 className="size-8 text-muted-foreground mx-auto stroke-1" />
            <p className="text-sm font-bold text-foreground">
              Sin incidencias registradas
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No hay incidencias que coincidan con los filtros seleccionados o aún no se han registrado eventos para la empresa.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewModalOpen(true)}
              className="mt-2 rounded-xl text-xs font-bold"
            >
              <Plus className="size-3.5 mr-1" />
              Registrar Primera Incidencia
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIncidents.map((inc) => {
              const isRecognition = inc.category === "reconocimiento";

              return (
                <div
                  key={inc.id}
                  className="p-4 rounded-xl border border-border/50 bg-background hover:border-border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <Avatar className="size-11 rounded-xl shrink-0 border border-border/40">
                      <AvatarImage src={inc.avatarUrl || ""} />
                      <AvatarFallback className="rounded-xl text-xs font-bold bg-muted text-muted-foreground">
                        {inc.employeeName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-foreground truncate">
                          {inc.employeeName}
                        </h4>
                        <span className="text-xs text-muted-foreground font-medium">
                          • {inc.jobTitle} ({inc.department})
                        </span>
                        <Badge
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border-none",
                            isRecognition
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          {inc.categoryLabel}
                        </Badge>
                      </div>

                      <p className="text-xs font-bold text-foreground truncate">
                        {inc.title}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold flex-wrap">
                        <span>Fecha: {inc.incidentDate}</span>
                        <span>•</span>
                        <span>Resp: {inc.responsibleSupervisor}</span>
                        {inc.evidenceFileName && (
                          <>
                            <span>•</span>
                            <span className="text-primary font-bold flex items-center gap-1">
                              <Paperclip className="size-3" />
                              Con evidencia
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 flex-wrap">
                    <Badge
                      className={cn(
                        "text-xs font-bold px-2.5 py-0.5 rounded-lg border-none",
                        inc.status === "aprobado" || inc.status === "resuelto"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : inc.status === "pendiente"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-destructive/15 text-destructive"
                      )}
                    >
                      {inc.status === "aprobado"
                        ? "Aprobado / Aplicado"
                        : inc.status === "resuelto"
                        ? "⭐ Resuelto"
                        : inc.status === "pendiente"
                        ? "🟡 Por Resolver"
                        : "Rechazado"}
                    </Badge>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedIncident(inc)}
                      className="h-8 px-2.5 rounded-lg text-xs font-bold border-border/70 flex items-center gap-1"
                    >
                      <Eye className="size-3" />
                      <span>Ver Ficha / Evidencia</span>
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(inc.id)}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Eliminar incidencia"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal 1: New Incident */}
      <NewIncidentModal
        isOpen={isNewModalOpen}
        onOpenChange={setIsNewModalOpen}
        onIncidentCreated={handleIncidentCreated}
        employees={employees}
      />

      {/* Modal 2: Evidence & Details */}
      <IncidentEvidenceModal
        isOpen={!!selectedIncident}
        onOpenChange={(open) => !open && setSelectedIncident(null)}
        incident={selectedIncident}
        onResolve={handleResolve}
      />
    </div>
  );
}
