"use client";

import React, { useState } from "react";
import {
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  Search,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  ChevronRight,
  Plus,
  ArrowLeft,
  Building2,
  TrendingUp,
  Smartphone,
  QrCode,
  MapPin,
  FileSpreadsheet,
  FileText,
  Sparkles,
  ShieldCheck,
  Eye,
  ShieldAlert,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  AttendanceRecord,
  AttendanceOverviewStats,
  GeofenceConfig,
  AttendanceStatus,
} from "../types/attendance";
import { MobileCheckInSheet } from "./attendance/mobile-checkin-sheet";
import { BranchQrKioskModal } from "./attendance/branch-qr-kiosk-modal";
import { EmployeeAttendanceDossierModal } from "./attendance/employee-attendance-dossier-modal";
import { JustificationReviewModal } from "./attendance/justification-review-modal";
import { OvertimeApprovalModal } from "./attendance/overtime-approval-modal";

interface AttendanceViewProps {
  initialRecords: AttendanceRecord[];
  initialStats: AttendanceOverviewStats;
  branchConfig: GeofenceConfig;
  companyName: string;
  workDate: string;
}

export function AttendanceView({
  initialRecords,
  initialStats,
  branchConfig,
  companyName,
  workDate,
}: AttendanceViewProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [stats, setStats] = useState<AttendanceOverviewStats>(initialStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  // Modals state
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isQrKioskOpen, setIsQrKioskOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedEmployeeForDossier, setSelectedEmployeeForDossier] = useState<AttendanceRecord | null>(null);
  const [selectedRecordForJustification, setSelectedRecordForJustification] = useState<AttendanceRecord | null>(null);
  const [selectedRecordForOvertime, setSelectedRecordForOvertime] = useState<AttendanceRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Manual Check-in Form
  const [manualName, setManualName] = useState("");
  const [manualTime, setManualTime] = useState("08:00");
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>("presente");

  const filteredRecords = records.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.employeeName.toLowerCase().includes(query) ||
      item.jobTitle.toLowerCase().includes(query) ||
      item.department.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" ? true : item.status === statusFilter;

    const matchesMethod =
      methodFilter === "all" ? true : item.checkInMethod === methodFilter;

    const matchesDept =
      deptFilter === "all" ? true : item.department === deptFilter;

    return matchesSearch && matchesStatus && matchesMethod && matchesDept;
  });

  const departments = Array.from(new Set(records.map((a) => a.department)));

  const handleRecordCreated = (newRecord: AttendanceRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    // Recalculate stats
    setStats((prev) => {
      const isPresent = newRecord.status === "presente";
      const isLate = newRecord.status === "retardo";
      return {
        ...prev,
        totalScheduled: prev.totalScheduled + 1,
        presentCount: isPresent ? prev.presentCount + 1 : prev.presentCount,
        lateCount: isLate ? prev.lateCount + 1 : prev.lateCount,
      };
    });
  };

  const handleJustificationDecision = (
    recordId: string,
    decision: "aprobada" | "rechazada"
  ) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            status: decision === "aprobada" ? "falta_justificada" : "falta_injustificada",
            justification: r.justification
              ? {
                  ...r.justification,
                  status: decision,
                  reviewedAt: "Hoy",
                  reviewedBy: "RH",
                }
              : undefined,
          };
        }
        return r;
      })
    );
  };

  const handleAuthorizeOvertime = (
    recordId: string,
    hours: number,
    rateType: "doble" | "triple"
  ) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              overtimeHours: hours,
              overtimeStatus: "autorizado",
            }
          : r
      )
    );
  };

  const handleAddManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const newRecord: AttendanceRecord = {
      id: `manual-att-${Date.now()}`,
      employeeId: `emp-${Date.now()}`,
      employeeName: manualName.trim(),
      avatarUrl: null,
      jobTitle: "Colaborador K'anPro",
      department: "Operaciones",
      workDate,
      scheduledCheckIn: "08:00",
      scheduledCheckOut: "17:00",
      checkInTime: manualStatus === "falta_injustificada" || manualStatus === "falta_justificada" ? null : manualTime,
      checkOutTime: null,
      breakStartTime: null,
      breakEndTime: null,
      checkInMethod: "manual",
      delayMinutes: manualStatus === "retardo" ? 20 : 0,
      status: manualStatus,
      overtimeHours: 0,
    };

    handleRecordCreated(newRecord);
    toast.success("Registro de checador manual añadido", {
      description: `Se registró la marca para ${manualName}.`,
    });

    setManualName("");
    setIsManualModalOpen(false);
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success("Reporte General de Asistencia descargado", {
        description: `Archivo de asistencia del día (${workDate}) generado con éxito.`,
      });
    }, 1000);
  };

  const getStatusBadge = (status: AttendanceStatus, delayMinutes?: number) => {
    switch (status) {
      case "presente":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-xs font-extrabold px-2.5 py-0.5 rounded-lg">
            Puntual
          </Badge>
        );
      case "retardo":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none text-xs font-extrabold px-2.5 py-0.5 rounded-lg">
            {`Retardo (+${delayMinutes || 15} min)`}
          </Badge>
        );
      case "falta_justificada":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-none text-xs font-extrabold px-2.5 py-0.5 rounded-lg">
            Falta Justificada
          </Badge>
        );
      case "falta_injustificada":
        return (
          <Badge className="bg-destructive/15 text-destructive border-none text-xs font-extrabold px-2.5 py-0.5 rounded-lg">
            Falta Injustificada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5 rounded-lg">
            Descanso
          </Badge>
        );
    }
  };

  const getMethodBadge = (method: AttendanceRecord["checkInMethod"]) => {
    switch (method) {
      case "gps":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <MapPin className="size-3" />
            <span>GPS Geocerca</span>
          </span>
        );
      case "qr":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            <QrCode className="size-3" />
            <span>QR Kiosco</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
            <span>Manual RH</span>
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Ejecutivo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
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
            <Clock className="size-7 text-indigo-600 dark:text-indigo-400" />
            {`Control de Asistencia • ${companyName}`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
            {`Monitoreo de entradas por GPS, QR del establecimiento, retardos automáticos y justificaciones.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsQrKioskOpen(true)}
            className="rounded-xl text-xs font-bold h-10 px-3.5 border-border/70 shadow-xs flex items-center gap-1.5"
          >
            <QrCode className="size-4 text-indigo-600 dark:text-indigo-400" />
            <span>Kiosco QR Establecimiento</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-xl text-xs font-bold h-10 px-3.5 border-border/70 shadow-xs flex items-center gap-1.5"
          >
            <Download className="size-3.5" />
            <span>{isExporting ? "Generando..." : "Exportar Reporte"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsMobileSheetOpen(true)}
            className="rounded-xl text-xs font-bold h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
          >
            <Smartphone className="size-4" />
            <span>Checador Móvil</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Puntualidad del Turno</span>
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[10px]">
              Tolerancia 15m
            </Badge>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.punctualityRate}%
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Índice de puntualidad global
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Presentes Hoy</span>
            <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.presentCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Entradas puntuales registradas
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Llegadas Tarde</span>
            <Clock className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.lateCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Registros fuera de tolerancia
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Ausencias</span>
            <UserX className="size-4 text-destructive" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.unjustifiedAbsences + stats.justifiedAbsences}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            {`${stats.justifiedAbsences} justificadas • ${stats.unjustifiedAbsences} injustificadas`}
          </p>
        </Card>
      </div>

      {/* Main Attendance Table */}
      <Card className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador, puesto o departamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={statusFilter}
              onValueChange={(val) => val && setStatusFilter(val)}
            >
              <SelectTrigger className="h-10 w-36 rounded-xl bg-background border-border/80 text-xs font-medium">
                <SelectValue placeholder="Estatus" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todos los estatus</SelectItem>
                <SelectItem value="presente">Puntuales</SelectItem>
                <SelectItem value="retardo">Retardos</SelectItem>
                <SelectItem value="falta_injustificada">Faltas Injustificadas</SelectItem>
                <SelectItem value="falta_justificada">Faltas Justificadas</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={methodFilter}
              onValueChange={(val) => val && setMethodFilter(val)}
            >
              <SelectTrigger className="h-10 w-36 rounded-xl bg-background border-border/80 text-xs font-medium">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="gps">GPS Geocerca</SelectItem>
                <SelectItem value="qr">QR Kiosco</SelectItem>
                <SelectItem value="manual">Manual RH</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsManualModalOpen(true)}
              className="rounded-xl text-xs font-bold h-10 px-3 border-border/70 flex items-center gap-1"
            >
              <Plus className="size-3.5" />
              <span>Entrada Manual</span>
            </Button>
          </div>
        </div>

        {/* Table Records */}
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/60 space-y-2">
            <p className="text-xs text-muted-foreground">
              No se encontraron registros de asistencia que coincidan con los filtros.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((item) => {
              const isAbsent = item.status === "falta_injustificada" || item.status === "falta_justificada";
              const hasOvertime = item.overtimeHours > 0;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-border/50 bg-background hover:border-border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <Avatar className="size-11 rounded-xl shrink-0 border border-border/40">
                      <AvatarImage src={item.avatarUrl || ""} />
                      <AvatarFallback className="rounded-xl text-xs font-bold bg-muted text-muted-foreground">
                        {item.employeeName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-foreground truncate">
                          {item.employeeName}
                        </h4>
                        <span className="text-xs text-muted-foreground font-medium truncate">
                          • {item.jobTitle} ({item.department})
                        </span>
                        {getMethodBadge(item.checkInMethod)}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold flex-wrap">
                        <span>Turno: {item.scheduledCheckIn} - {item.scheduledCheckOut}</span>
                        <span>•</span>
                        <span>Entrada: <strong className="text-foreground">{item.checkInTime || "--:--"}</strong></span>
                        {item.checkOutTime && (
                          <>
                            <span>•</span>
                            <span>Salida: <strong className="text-foreground">{item.checkOutTime}</strong></span>
                          </>
                        )}
                        {item.checkInLocation && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              GPS: {item.checkInLocation.distanceToBranchMeters}m de sucursal
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 flex-wrap">
                    {getStatusBadge(item.status, item.delayMinutes)}

                    {/* Overtime tag or button */}
                    {hasOvertime && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRecordForOvertime(item)}
                        className={cn(
                          "h-8 px-2.5 rounded-lg text-xs font-bold border-indigo-500/30 flex items-center gap-1",
                          item.overtimeStatus === "autorizado"
                            ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-none"
                            : "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20"
                        )}
                      >
                        <Sparkles className="size-3" />
                        <span>{`+${item.overtimeHours}h Extra (${item.overtimeStatus === "autorizado" ? "Autorizado" : "Revisar"})`}</span>
                      </Button>
                    )}

                    {/* Justification button if absent */}
                    {isAbsent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRecordForJustification(item)}
                        className={cn(
                          "h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1",
                          item.status === "falta_justificada"
                            ? "border-blue-500/30 text-blue-600 bg-blue-500/10"
                            : "border-destructive/30 text-destructive hover:bg-destructive/10"
                        )}
                      >
                        <ShieldAlert className="size-3" />
                        <span>{item.status === "falta_justificada" ? "Ver Justificación" : "Justificar Falta"}</span>
                      </Button>
                    )}

                    {/* Dossier button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedEmployeeForDossier(item)}
                      className="h-8 px-2.5 text-xs font-bold text-muted-foreground hover:text-foreground rounded-lg flex items-center gap-1"
                    >
                      <Eye className="size-3.5" />
                      <span>Expediente</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal 1: Mobile Check-in Sheet */}
      <MobileCheckInSheet
        isOpen={isMobileSheetOpen}
        onOpenChange={setIsMobileSheetOpen}
        branchConfig={branchConfig}
        onRecordCreated={handleRecordCreated}
      />

      {/* Modal 2: QR Kiosk Poster */}
      <BranchQrKioskModal
        isOpen={isQrKioskOpen}
        onOpenChange={setIsQrKioskOpen}
        branchConfig={branchConfig}
        companyName={companyName}
      />

      {/* Modal 3: Employee Attendance Dossier (Monthly Calendar) */}
      <EmployeeAttendanceDossierModal
        isOpen={!!selectedEmployeeForDossier}
        onOpenChange={(open) => !open && setSelectedEmployeeForDossier(null)}
        employee={selectedEmployeeForDossier}
      />

      {/* Modal 4: Justification Review */}
      <JustificationReviewModal
        isOpen={!!selectedRecordForJustification}
        onOpenChange={(open) => !open && setSelectedRecordForJustification(null)}
        record={selectedRecordForJustification}
        onDecision={handleJustificationDecision}
      />

      {/* Modal 5: Overtime Approval */}
      <OvertimeApprovalModal
        isOpen={!!selectedRecordForOvertime}
        onOpenChange={(open) => !open && setSelectedRecordForOvertime(null)}
        record={selectedRecordForOvertime}
        onAuthorize={handleAuthorizeOvertime}
      />

      {/* Modal: Entrada Manual */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl p-6 bg-card border-border/80">
          <form onSubmit={handleAddManualCheckIn} className="space-y-4">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg font-extrabold text-foreground">
                Registrar Entrada Manual RH
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Añade o ajusta el registro de checador para un colaborador.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="att-manual-name" className="text-xs font-bold text-foreground">
                  Nombre del Colaborador *
                </Label>
                <Input
                  id="att-manual-name"
                  placeholder="Ej. Roberto Sánchez"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="att-manual-time" className="text-xs font-bold text-foreground">
                    Hora de Entrada
                  </Label>
                  <Input
                    id="att-manual-time"
                    type="time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    disabled={manualStatus === "falta_injustificada" || manualStatus === "falta_justificada"}
                    className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Estatus
                  </Label>
                  <Select
                    value={manualStatus}
                    onValueChange={(val) => val && setManualStatus(val as AttendanceStatus)}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="presente">Puntual</SelectItem>
                      <SelectItem value="retardo">Retardo</SelectItem>
                      <SelectItem value="falta_injustificada">Falta Injustificada</SelectItem>
                      <SelectItem value="falta_justificada">Falta Justificada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsManualModalOpen(false)}
                className="rounded-xl text-xs font-bold h-10 px-4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
              >
                Guardar Registro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
