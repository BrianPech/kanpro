"use client";

import React, { useState } from "react";
import {
  Plane,
  Calendar,
  CheckCircle2,
  Plus,
  Search,
  Sparkles,
  Download,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
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
import { getMexicoDateISO } from "@/lib/formatters";
import { VacationRequest } from "../../types/employee-dossier";
import { VacationRequestModal } from "./vacation-request-modal";
import {
  respondToCompanyLeaveAction,
  updateCompanyLeaveApprovalModeAction,
  generateCompanyLeaveCertificateAction,
} from "../../actions/leaves";
import { CompanyEmployeeRosterItem } from "../../services/company-dossier";
import { CompanyPageHeader } from "../shared/company-page-header";
import { CompanyStatusBadge } from "../shared/company-status-badge";
import type { LeaveApprovalMode, LeaveApprovalActor } from "../../strategies/leave-approval.strategy";

interface CompanyLeavesViewProps {
  initialRequests: VacationRequest[];
  companyName: string;
  initialApprovalMode?: LeaveApprovalMode;
  employees?: CompanyEmployeeRosterItem[];
  stats: {
    pendingCount: number;
    approvedThisMonth: number;
    employeesOnLeaveToday: number;
    averageVacationBalance: number;
  };
}

export interface DepartmentOverlapGroup {
  department: string;
  requests: VacationRequest[];
  hasConflict: boolean;
}

export function computeDepartmentOverlaps(
  requests: VacationRequest[]
): DepartmentOverlapGroup[] {
  const active = requests.filter(
    (r) =>
      r.status === "pendiente" ||
      r.status === "visto_bueno" ||
      r.status === "aprobada"
  );
  const byDept = new Map<string, VacationRequest[]>();
  for (const req of active) {
    const dept = req.department || "Operaciones";
    const list = byDept.get(dept) || [];
    list.push(req);
    byDept.set(dept, list);
  }

  return Array.from(byDept.entries()).map(([department, deptReqs]) => {
    let hasConflict = false;
    for (let i = 0; i < deptReqs.length; i++) {
      for (let j = i + 1; j < deptReqs.length; j++) {
        const a = deptReqs[i];
        const b = deptReqs[j];
        if (a.startDate <= b.endDate && a.endDate >= b.startDate) {
          hasConflict = true;
          break;
        }
      }
      if (hasConflict) break;
    }
    return { department, requests: deptReqs, hasConflict };
  });
}

export function CompanyLeavesView({
  initialRequests,
  companyName,
  initialApprovalMode = "single_step",
  employees = [],
  stats: initialStats,
}: CompanyLeavesViewProps) {
  const [requests, setRequests] = useState<VacationRequest[]>(initialRequests);
  const [approvalMode, setApprovalMode] = useState<LeaveApprovalMode>(initialApprovalMode);
  const [viewTab, setViewTab] = useState<"inbox" | "calendar">("inbox");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const departments = Array.from(
    new Set(requests.map((r) => r.department || "Operaciones"))
  );

  const filteredRequests = requests.filter((req) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      req.employeeName.toLowerCase().includes(query) ||
      req.department.toLowerCase().includes(query) ||
      req.typeLabel.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" ? true : req.status === statusFilter;

    const matchesDept =
      departmentFilter === "all" ? true : req.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const overlapGroups = computeDepartmentOverlaps(
    departmentFilter === "all"
      ? requests
      : requests.filter((r) => r.department === departmentFilter)
  );
  const conflictDeptsCount = overlapGroups.filter((g) => g.hasConflict).length;

  const handleModeChange = async (nextMode: LeaveApprovalMode) => {
    const prev = approvalMode;
    setApprovalMode(nextMode);
    const res = await updateCompanyLeaveApprovalModeAction(nextMode);
    if (!res.success) {
      setApprovalMode(prev);
      toast.error("No se pudo cambiar el flujo de aprobación", {
        description: res.error,
      });
      return;
    }
    toast.success(
      nextMode === "two_step"
        ? "Aprobación en 2 pasos activada (Vo.Bo. Líder → RH)"
        : "Aprobación directa de RH activada (1 paso)"
    );
  };

  const handleDecision = async (
    id: string,
    decision: "aprobada" | "rechazada",
    actor: LeaveApprovalActor = "hr"
  ) => {
    try {
      setProcessingId(id);
      const res = await respondToCompanyLeaveAction({
        requestId: id,
        decision,
        actor,
      });

      if (!res.success || !res.data) {
        toast.error("No se pudo procesar la solicitud", {
          description: res.error,
        });
        return;
      }

      const nextStatus = res.data.status as VacationRequest["status"];
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: nextStatus,
                reviewedAt: "Hoy",
                reviewedBy:
                  actor === "area_leader"
                    ? "Líder de Área (Vo.Bo.)"
                    : "Recursos Humanos",
              }
            : r
        )
      );

      if (nextStatus === "visto_bueno") {
        toast.success("Vo.Bo. de Líder de Área registrado", {
          description: res.message,
        });
      } else if (nextStatus === "aprobada") {
        toast.success("Solicitud aprobada con éxito", {
          description:
            res.message ||
            "Los días han sido descontados del saldo de vacaciones del empleado.",
        });
      } else {
        toast.error("Solicitud rechazada", {
          description:
            res.message || "Se ha notificado al empleado sobre la resolución.",
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error al procesar la resolución de la solicitud.";
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadCertificate = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      const res = await generateCompanyLeaveCertificateAction(requestId);
      if (!res.success || !res.data) {
        toast.error("No se pudo generar la constancia", {
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
      setProcessingId(null);
    }
  };

  const handleRequestCreated = (newReq: VacationRequest) => {
    setRequests((prev) => [newReq, ...prev]);
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const headers = [
        "Empleado",
        "Departamento",
        "Tipo",
        "Inicio",
        "Fin",
        "Dias Habiles",
        "Estatus",
      ];
      const rows = requests.map((r) => [
        `"${r.employeeName.replace(/"/g, '""')}"`,
        `"${r.department.replace(/"/g, '""')}"`,
        `"${r.typeLabel.replace(/"/g, '""')}"`,
        r.startDate,
        r.endDate,
        String(r.totalWorkingDays),
        r.status,
      ]);
      const csv =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csv);
      link.download = `vacaciones_permisos_${getMexicoDateISO()}.csv`;
      link.click();
      toast.success("Reporte de Vacaciones & Permisos descargado");
    } finally {
      setIsExporting(false);
    }
  };

  const pendingCount = requests.filter(
    (r) => r.status === "pendiente" || r.status === "visto_bueno"
  ).length;
  const approvedCount = requests.filter((r) => r.status === "aprobada").length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 font-sans">
      {/* Header Unificado */}
      <CompanyPageHeader
        title={`Vacaciones & Permisos • ${companyName}`}
        description="Gestión automatizada de vacaciones según LFT (Vacaciones Dignas), calendario corporativo de ausencias y permisos especiales."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={approvalMode}
            onValueChange={(val) =>
              val && handleModeChange(val as LeaveApprovalMode)
            }
          >
            <SelectTrigger className="w-56 text-xs font-semibold h-9">
              <SelectValue placeholder="Flujo de aprobación">
                {approvalMode === "two_step"
                  ? "Flujo 2 pasos (Líder → RH)"
                  : "Flujo 1 paso (RH directo)"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="single_step">
                Flujo 1 paso (RH aprueba directo)
              </SelectItem>
              <SelectItem value="two_step">
                Flujo 2 pasos (Vo.Bo. Líder → RH)
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="cursor-pointer font-semibold text-xs"
          >
            <FileSpreadsheet data-icon="inline-start" />
            <span>{isExporting ? "Descargando..." : "Descargar Reporte"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer font-medium"
          >
            <Plus data-icon="inline-start" />
            <span>Nueva Solicitud</span>
          </Button>
        </div>
      </CompanyPageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Solicitudes por Resolver</span>
            <Badge className="bg-amber-500 text-white border-none text-[10px]">
              Por Autorizar
            </Badge>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {pendingCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            {approvalMode === "two_step"
              ? "Pendientes de Vo.Bo. o aprobación RH"
              : "En espera de aprobación de RH"}
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Aprobadas</span>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {approvedCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Con constancia oficial LFT disponible
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>En Vacaciones / Permiso Hoy</span>
            <Plane className="size-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {initialStats.employeesOnLeaveToday}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Empleados con ausencia justificada
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Saldo LFT Promedio</span>
            <Sparkles className="size-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {initialStats.averageVacationBalance} días
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Prima vacacional 25% Art. 80 LFT
          </p>
        </Card>
      </div>

      {/* Selector de vista: Bandeja vs Calendario Corporativo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border/70 bg-card p-1 gap-1">
          <Button
            type="button"
            size="sm"
            variant={viewTab === "inbox" ? "default" : "ghost"}
            onClick={() => setViewTab("inbox")}
            className="text-xs font-bold cursor-pointer"
          >
            Bandeja de Solicitudes ({requests.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewTab === "calendar" ? "default" : "ghost"}
            onClick={() => setViewTab("calendar")}
            className="text-xs font-bold cursor-pointer gap-1.5"
          >
            <Calendar className="size-3.5" />
            <span>Calendario Corporativo & Solapamientos</span>
            {conflictDeptsCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {conflictDeptsCount}
              </Badge>
            )}
          </Button>
        </div>

        <Select
          value={departmentFilter}
          onValueChange={(val) => val && setDepartmentFilter(val)}
        >
          <SelectTrigger className="w-52 text-xs font-medium">
            <SelectValue placeholder="Filtrar por área">
              {departmentFilter === "all"
                ? "Todas las áreas"
                : departmentFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Todas las áreas</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {viewTab === "calendar" ? (
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                Calendario Corporativo de Ausencias por Área
              </h3>
              <p className="text-xs text-muted-foreground">
                Detecta traslapes de vacaciones y permisos activos entre colaboradores del mismo departamento.
              </p>
            </div>
            {conflictDeptsCount > 0 ? (
              <Badge variant="destructive" className="text-xs font-bold gap-1">
                <AlertTriangle className="size-3.5" />
                <span>{conflictDeptsCount} área(s) con solapamiento de fechas</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-bold">
                Sin traslapes entre áreas
              </Badge>
            )}
          </div>

          {overlapGroups.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
              No hay ausencias activas registradas para mostrar en el calendario.
            </div>
          ) : (
            <div className="space-y-4">
              {overlapGroups.map((group) => (
                <div
                  key={group.department}
                  className={cn(
                    "p-4 rounded-2xl border space-y-3",
                    group.hasConflict
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-border/60 bg-card"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-foreground">
                      Área: {group.department}
                    </span>
                    {group.hasConflict ? (
                      <Badge className="bg-amber-500 text-white border-none text-[10px] font-bold gap-1">
                        <AlertTriangle className="size-3" />
                        <span>Solapamiento detectado en el área</span>
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        Cobertura sin traslapes
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {group.requests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl bg-background border border-border/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">
                            {req.employeeName}
                          </p>
                          <p className="text-muted-foreground font-medium">
                            {req.typeLabel} • {req.startDate} al {req.endDate} ({req.totalWorkingDays}d)
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold shrink-0">
                          {req.status === "visto_bueno"
                            ? "Vo.Bo. Líder"
                            : req.status === "aprobada"
                            ? "Aprobada"
                            : "Pendiente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        /* Main Inbox Card */
        <Card className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por empleado, departamento o tipo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs font-medium"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val) => val && setStatusFilter(val)}
            >
              <SelectTrigger className="w-48 text-xs font-medium">
                <SelectValue placeholder="Filtrar por estatus">
                  {statusFilter === "all"
                    ? "Todas las solicitudes"
                    : statusFilter === "pendiente"
                    ? "🟡 Pendientes"
                    : statusFilter === "visto_bueno"
                    ? "🔵 Con Vo.Bo. Líder"
                    : statusFilter === "aprobada"
                    ? "🟢 Aprobadas"
                    : statusFilter === "rechazada"
                    ? "🔴 Rechazadas"
                    : statusFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todas las solicitudes</SelectItem>
                <SelectItem value="pendiente">🟡 Pendientes</SelectItem>
                <SelectItem value="visto_bueno">🔵 Con Vo.Bo. Líder</SelectItem>
                <SelectItem value="aprobada">🟢 Aprobadas</SelectItem>
                <SelectItem value="rechazada">🔴 Rechazadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/60 space-y-2">
              <p className="text-xs text-muted-foreground">
                No se encontraron solicitudes que coincidan con la búsqueda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const isPending = req.status === "pendiente";
                const isVistoBueno = req.status === "visto_bueno";
                const isOpen = isPending || isVistoBueno;

                return (
                  <div
                    key={req.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                      isOpen
                        ? "bg-background border-border/60 hover:border-border shadow-xs"
                        : "bg-muted/20 border-border/30 opacity-90"
                    )}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <Avatar className="size-11 rounded-xl shrink-0 border border-border/40">
                        <AvatarImage src={req.avatarUrl || ""} />
                        <AvatarFallback className="rounded-xl text-xs font-bold bg-muted text-muted-foreground">
                          {req.employeeName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-extrabold text-foreground truncate">
                            {req.employeeName}
                          </h4>
                          <span className="text-xs text-muted-foreground font-medium">
                            • {req.department}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border-border/60"
                          >
                            {req.typeLabel}
                          </Badge>
                          {isVistoBueno && (
                            <Badge className="bg-blue-600 text-white border-none text-[10px] font-bold">
                              Vo.Bo. Líder otorgado
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold flex-wrap">
                          <span>
                            Periodo:{" "}
                            <strong className="text-foreground">
                              {req.startDate} al {req.endDate}
                            </strong>
                          </span>
                          <span>•</span>
                          <span className="text-primary font-bold">
                            {req.totalWorkingDays} días hábiles
                          </span>
                        </div>

                        {req.reason && (
                          <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">
                            Motivo: &quot;{req.reason}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                      {isOpen ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDecision(
                                req.id,
                                "rechazada",
                                approvalMode === "two_step" && isPending
                                  ? "area_leader"
                                  : "hr"
                              )
                            }
                            disabled={processingId === req.id}
                            className="h-9 px-3 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 hover:border-destructive/30 cursor-pointer"
                          >
                            {processingId === req.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              "Rechazar"
                            )}
                          </Button>

                          {approvalMode === "two_step" && isPending ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleDecision(req.id, "aprobada", "area_leader")
                              }
                              disabled={processingId === req.id}
                              className="h-9 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer gap-1.5"
                            >
                              {processingId === req.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                "Dar Vo.Bo. (Líder)"
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleDecision(req.id, "aprobada", "hr")
                              }
                              disabled={processingId === req.id}
                              className="h-9 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer gap-1.5"
                            >
                              {processingId === req.id ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin" />
                                  <span>Aprobando...</span>
                                </>
                              ) : approvalMode === "two_step" ? (
                                "Aprobación Final RH"
                              ) : (
                                "Aprobar Solicitud"
                              )}
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <CompanyStatusBadge
                            status={
                              req.status === "aprobada" ? "activo" : "inactivo"
                            }
                            label={
                              req.status === "aprobada"
                                ? "Aprobada"
                                : "Rechazada"
                            }
                          />
                          {req.status === "aprobada" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadCertificate(req.id)}
                              disabled={processingId === req.id}
                              className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
                            >
                              <Download className="size-3.5" />
                              <span>Constancia PDF</span>
                            </Button>
                          )}
                        </>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        nativeButton={false}
                        render={
                          <Link
                            href={`/dashboard/company/employees/${req.employeeId}`}
                          />
                        }
                        className="h-9 px-3 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
                      >
                        <span>Ver Expediente</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Modal: Nueva Solicitud */}
      <VacationRequestModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onRequestCreated={handleRequestCreated}
        employees={employees}
      />
    </div>
  );
}
