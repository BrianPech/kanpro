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
} from "@/components/ui/icons";
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
import { CompanyPageHeader } from "./shared/company-page-header";
import { CompanyStatusBadge } from "./shared/company-status-badge";
import { parseCompanyWorkRulesConfig } from "../strategies/company-policies.parser";
import { getResetPeriodKey } from "../strategies/punctuality-policy.engine";
import { calculateAbsenceDeduction } from "../utils/payroll-calculator";
import {
  evaluatePeriodBonuses,
  type SingleBonusEvaluation,
} from "../strategies/payroll-period-bonuses.engine";
import { getMexicoDateISO } from "@/lib/formatters";

interface IncidentsViewProps {
  initialIncidents?: LaborIncident[];
  employees?: EmployeeRosterOption[];
  kpis?: {
    pendingIncidentsCount?: number;
    criticalIncidentsCount?: number;
  };
  payrollImpactConfig?: unknown;
}

export function IncidentsView({
  initialIncidents = [],
  employees = [],
  kpis,
  payrollImpactConfig,
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
        "Empleado",
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
  const criticalCount = incidents.filter(
    (i) =>
      i.severity === "alta" ||
      i.severity === "critica" ||
      i.category === "falta_injustificada" ||
      i.category === "incumplimiento"
  ).length;

  const workRules = React.useMemo(
    () => parseCompanyWorkRulesConfig(payrollImpactConfig),
    [payrollImpactConfig]
  );
  const currentPeriodKey = React.useMemo(
    () => getResetPeriodKey(getMexicoDateISO(), workRules.resetPeriod),
    [workRules.resetPeriod]
  );

  const salaryByEmployeeId = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const emp of employees) {
      const salary = emp.baseSalaryMonthly !== null && emp.baseSalaryMonthly !== undefined
        ? Number(emp.baseSalaryMonthly)
        : 0;
      if (salary > 0) {
        map.set(emp.id, salary);
      }
    }
    return map;
  }, [employees]);

  const payrollImpactRows = React.useMemo(() => {
    const byEmp = new Map<
      string,
      {
        employeeName: string;
        delaysCount: number;
        absencesCount: number;
        pendingClarifications: number;
        imssCount: number;
        eligibleForBonuses: Array<{
          category: LaborIncident["category"];
          status: string;
          incident_date: string;
        }>;
      }
    >();

    for (const inc of incidents) {
      if (inc.status === "rechazado") continue;
      const inResetPeriod =
        getResetPeriodKey(inc.incidentDate, workRules.resetPeriod) === currentPeriodKey;
      const entry = byEmp.get(inc.employeeId) ?? {
        employeeName: inc.employeeName,
        delaysCount: 0,
        absencesCount: 0,
        pendingClarifications: 0,
        imssCount: 0,
        eligibleForBonuses: [],
      };
      entry.eligibleForBonuses.push({
        category: inc.category,
        status: inc.status,
        incident_date: inc.incidentDate,
      });
      if (inResetPeriod) {
        if (inc.status === "por_aclarar") {
          entry.pendingClarifications += 1;
        } else if (inc.category === "retardo" && inc.status === "aprobado") {
          entry.delaysCount += 1;
        } else if (inc.category === "falta_injustificada" && inc.status === "aprobado") {
          entry.absencesCount += 1;
        } else if (inc.category === "incapacidad") {
          entry.imssCount += 1;
        }
      }
      byEmp.set(inc.employeeId, entry);
    }

    const formatBonusEffect = (label: string, bonus: SingleBonusEvaluation): string | null => {
      if (!bonus.enabled || bonus.status === "disabled" || bonus.baseAmount <= 0) {
        return null;
      }
      if (bonus.status === "cancelled_full") {
        return `${label}: cancelado (-$${bonus.baseAmount.toLocaleString("es-MX")} MXN)`;
      }
      if (bonus.status === "cancelled_partial") {
        const lostAmount = Math.max(0, bonus.baseAmount - bonus.finalAmount);
        return `${label}: parcial -${bonus.reductionPercentage}% (-$${lostAmount.toLocaleString("es-MX")} MXN)`;
      }
      return `${label}: íntegro ($${bonus.finalAmount.toLocaleString("es-MX")} MXN)`;
    };

    const todayISO = getMexicoDateISO();

    return Array.from(byEmp.entries()).map(([employeeId, row]) => {
      const delayAbsenceEquivalents =
        Math.floor(row.delaysCount / workRules.delaysPerAbsence) * workRules.delayDeductionDays;
      const totalAbsenceEquivalents = row.absencesCount + delayAbsenceEquivalents;
      const knownSalary = salaryByEmployeeId.get(employeeId);
      const usesSalaryEstimateFallback = knownSalary === undefined;
      const monthlySalaryForCalc = knownSalary ?? 15000;
      const estimatedDeductionMxn = calculateAbsenceDeduction(
        monthlySalaryForCalc,
        totalAbsenceEquivalents,
        workRules.seventhDayMode
      );
      const bonusEval = evaluatePeriodBonuses({
        incidents: row.eligibleForBonuses,
        attendance: [],
        monthlySalary: monthlySalaryForCalc,
        config: payrollImpactConfig ?? workRules,
        refDateISO: todayISO,
      });
      const bonusImpactNotes = [
        formatBonusEffect("Bono puntualidad", bonusEval.punctualityBonus),
        formatBonusEffect("Bono asistencia", bonusEval.attendanceBonus),
      ].filter((note): note is string => note !== null);

      const hasBonusImpact =
        bonusEval.punctualityBonus.status === "cancelled_full" ||
        bonusEval.punctualityBonus.status === "cancelled_partial" ||
        bonusEval.attendanceBonus.status === "cancelled_full" ||
        bonusEval.attendanceBonus.status === "cancelled_partial";

      const statusLabel =
        row.pendingClarifications > 0
          ? "Por aclarar"
          : totalAbsenceEquivalents > 0 || hasBonusImpact
            ? "Impacta nómina"
            : row.imssCount > 0
              ? "IMSS (sin falta)"
              : "En rango";
      return {
        employeeId,
        ...row,
        delayAbsenceEquivalents,
        totalAbsenceEquivalents,
        estimatedDeductionMxn,
        usesSalaryEstimateFallback,
        bonusImpactNotes,
        deferredToNextPeriodCount: bonusEval.deferredToNextPeriodCount,
        hasBonusImpact,
        statusLabel,
      };
    });
  }, [incidents, salaryByEmployeeId, workRules, payrollImpactConfig, currentPeriodKey]);

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      <CompanyPageHeader
        title="Incidencias & Reconocimientos"
        description="Registro formal de faltas, retardos, accidentes ST-7, incapacidades IMSS y méritos destacados."
        badge={
          <Badge variant="outline" className="text-xs">
            {incidents.length} Eventos
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="gap-1.5 font-bold cursor-pointer"
            >
              <FileSpreadsheet className="size-3.5" />
              <span>{isExporting ? "Generando..." : "Descargar Bitácora"}</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsNewModalOpen(true)}
              className="gap-1.5 font-bold cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Registrar Incidencia</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Incidencias por Resolver</span>
            <CompanyStatusBadge status="pending" label="Pendientes" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {pendingCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Requieren dictamen o justificación de RH
          </p>
        </Card>

        <Card className="p-5 space-y-2">
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

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Reconocimientos Otorgados</span>
            <Award className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {recognitionCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Méritos y felicitaciones al empleado
          </p>
        </Card>
      </div>

      {/* Panel Impacto en Nómina */}
      <Card className="p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-foreground">
              Impacto en Nómina
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium">
              Regla activa: {workRules.delaysPerAbsence} retardos = {workRules.delayDeductionDays} día(s) · reinicio {workRules.resetPeriod} · 7° día {workRules.seventhDayMode}
            </p>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono self-start sm:self-center">
            {payrollImpactRows.length} colaboradores con eventos en periodo
          </Badge>
        </div>

        {payrollImpactRows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sin retardos acumulados ni faltas equivalentes en el periodo vigente.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {payrollImpactRows.map((row) => (
              <div
                key={row.employeeId}
                className="p-3 rounded-xl border border-border/50 bg-muted/20 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-bold text-foreground truncate">
                    {row.employeeName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {row.delaysCount} retardo(s) → {row.totalAbsenceEquivalents} falta(s) equiv.
                  </p>
                  <p className="text-[11px] font-medium text-foreground/90">
                    {row.totalAbsenceEquivalents > 0
                      ? `Descuento est.: -$${row.estimatedDeductionMxn.toLocaleString("es-MX")} MXN${row.usesSalaryEstimateFallback ? " (base est.)" : ""}`
                      : "Descuento est.: $0 MXN"}
                  </p>
                  {row.bonusImpactNotes.length > 0 && (
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      {row.bonusImpactNotes.join(" · ")}
                    </p>
                  )}
                  {row.deferredToNextPeriodCount > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      {row.deferredToNextPeriodCount} incidencia(s) pasan al siguiente periodo por corte
                    </p>
                  )}
                </div>
                <Badge
                  variant={row.totalAbsenceEquivalents > 0 || row.hasBonusImpact ? "destructive" : "outline"}
                  className="text-[10px] shrink-0"
                >
                  {row.statusLabel}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Main List */}
      <Card className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por empleado, título o tipo de incidencia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={categoryFilter}
              onValueChange={(val) => val && setCategoryFilter(val)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoría">
                  {({
                    all: "Todas las categorías",
                    falta_injustificada: "Falta Injustificada",
                    retardo: "Retardo",
                    accidente: "Accidente de Trabajo",
                    incapacidad: "Incapacidad Médica",
                    queja: "Queja / Conducta",
                    permiso: "Permiso Especial",
                    suspension: "Suspensión",
                    incumplimiento: "Acta Administrativa",
                    reconocimiento: "⭐ Reconocimiento",
                    otro: "Otra Incidencia",
                  } as Record<string, string>)[categoryFilter] || categoryFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estatus">
                  {({
                    all: "Todos los estatus",
                    pendiente: "🟡 Pendientes",
                    aprobado: "🟢 Aprobados",
                    resuelto: "⭐ Resueltos",
                    rechazado: "🔴 Rechazados",
                  } as Record<string, string>)[statusFilter] || statusFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
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
          <div className="p-12 text-center bg-muted/20 rounded-3xl border border-dashed border-border/60 space-y-2">
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
              className="mt-2 font-bold cursor-pointer"
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
                  className="p-4 rounded-3xl border border-border/60 bg-card hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <Avatar className="size-11 rounded-2xl shrink-0 border border-border/40">
                      <AvatarImage src={inc.avatarUrl || ""} />
                      <AvatarFallback className="rounded-2xl text-xs font-bold bg-muted text-muted-foreground">
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
                          variant="secondary"
                          className="text-[10px] font-bold"
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
                    <CompanyStatusBadge
                      status={
                        inc.status === "aprobado" || inc.status === "resuelto"
                          ? "completed"
                          : inc.status === "pendiente"
                          ? "pending"
                          : "inactive"
                      }
                      label={
                        inc.status === "aprobado"
                          ? "Aprobado"
                          : inc.status === "resuelto"
                          ? "Resuelto"
                          : inc.status === "pendiente"
                          ? "Por Resolver"
                          : "Rechazado"
                      }
                    />

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedIncident(inc)}
                      className="gap-1 cursor-pointer"
                    >
                      <Eye className="size-3" />
                      <span>Ver Ficha / Evidencia</span>
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(inc.id)}
                      className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
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
