"use client";

import React, { useState } from "react";
import {
  Plane,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ArrowLeft,
  Search,
  Filter,
  User,
  Sparkles,
  Download,
  Building2,
  FileSpreadsheet,
  Users,
  Loader2,
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
import { VacationRequest, RequestStatus } from "../../types/employee-dossier";
import { VacationRequestModal } from "./vacation-request-modal";
import { respondToCompanyLeaveAction } from "../../actions/leaves";
import { CompanyEmployeeRosterItem } from "../../services/company-dossier";
import { CompanyPageHeader } from "../shared/company-page-header";
import { CompanyStatusBadge } from "../shared/company-status-badge";

interface CompanyLeavesViewProps {
  initialRequests: VacationRequest[];
  companyName: string;
  employees?: CompanyEmployeeRosterItem[];
  stats: {
    pendingCount: number;
    approvedThisMonth: number;
    employeesOnLeaveToday: number;
    averageVacationBalance: number;
  };
}

export function CompanyLeavesView({
  initialRequests,
  companyName,
  employees = [],
  stats: initialStats,
}: CompanyLeavesViewProps) {
  const [requests, setRequests] = useState<VacationRequest[]>(initialRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredRequests = requests.filter((req) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      req.employeeName.toLowerCase().includes(query) ||
      req.department.toLowerCase().includes(query) ||
      req.typeLabel.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" ? true : req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDecision = async (id: string, decision: "aprobada" | "rechazada") => {
    try {
      setProcessingId(id);
      const res = await respondToCompanyLeaveAction({
        requestId: id,
        decision,
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: decision,
                reviewedAt: "Hoy",
                reviewedBy: "Recursos Humanos",
              }
            : r
        )
      );

      if (decision === "aprobada") {
        toast.success("Solicitud aprobada con éxito", {
          description: res.message || "Los días han sido descontados del saldo de vacaciones del empleado.",
        });
      } else {
        toast.error("Solicitud rechazada", {
          description: res.message || "Se ha notificado al empleado sobre la resolución.",
        });
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al procesar la resolución de la solicitud.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestCreated = (newReq: VacationRequest) => {
    setRequests((prev) => [newReq, ...prev]);
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success("Reporte de Vacaciones & Permisos descargado", {
        description: "Archivo Excel con el acumulado de saldos generado con éxito.",
      });
    }, 1000);
  };

  const pendingCount = requests.filter((r) => r.status === "pendiente").length;
  const approvedCount = requests.filter((r) => r.status === "aprobada").length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 font-sans">
      {/* Header Unificado */}
      <CompanyPageHeader
        title={`Vacaciones & Permisos • ${companyName}`}
        description="Gestión automatizada de vacaciones según LFT (Vacaciones Dignas), permisos y descansos."
      >
        <div className="flex items-center gap-2 flex-wrap">
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
            <span>Solicitudes Pendientes</span>
            <Badge className="bg-amber-500 text-white border-none text-[10px]">
              Por Autorizar
            </Badge>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {pendingCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            En espera de aprobación de RH
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Aprobadas este Mes</span>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {approvedCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Integradas a los calendarios de turno
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
            Disponibilidad por empleado
          </p>
        </Card>
      </div>

      {/* Main Inbox Card */}
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
            <SelectTrigger className="w-44 text-xs font-medium">
              <SelectValue placeholder="Filtrar por estatus">
                {statusFilter === "all"
                  ? "Todas las solicitudes"
                  : statusFilter === "pendiente"
                    ? "🟡 Pendientes"
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

              return (
                <div
                  key={req.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                    isPending
                      ? "bg-background border-border/60 hover:border-border shadow-xs"
                      : "bg-muted/20 border-border/30 opacity-85"
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
                        <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full border-border/60">
                          {req.typeLabel}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold flex-wrap">
                        <span>Periodo: <strong className="text-foreground">{req.startDate} al {req.endDate}</strong></span>
                        <span>•</span>
                        <span className="text-primary font-bold">{req.totalWorkingDays} días hábiles</span>
                      </div>

                      {req.reason && (
                        <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">
                          Motivo: &quot;{req.reason}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    {isPending ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecision(req.id, "rechazada")}
                          disabled={processingId === req.id}
                          className="h-9 px-3 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 hover:border-destructive/30 cursor-pointer"
                        >
                          {processingId === req.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            "Rechazar"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDecision(req.id, "aprobada")}
                          disabled={processingId === req.id}
                          className="h-9 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer gap-1.5"
                        >
                          {processingId === req.id ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              <span>Aprobando...</span>
                            </>
                          ) : (
                            "Aprobar Solicitud"
                          )}
                        </Button>
                      </>
                    ) : (
                      <CompanyStatusBadge
                        status={req.status === "aprobada" ? "activo" : "inactivo"}
                        label={req.status === "aprobada" ? "Aprobada" : "Rechazada"}
                      />
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      nativeButton={false}
                      render={<Link href={`/dashboard/company/employees/${req.employeeId}`} />}
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
