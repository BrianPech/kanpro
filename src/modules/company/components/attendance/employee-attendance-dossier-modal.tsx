"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  Download,
  CheckCircle2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Sparkles,
  Printer,
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AttendanceRecord,
  AttendanceStatus,
  EmployeeAttendanceHistory,
} from "../../types/attendance";
import { getIndividualAttendanceHistory } from "../../utils/attendance-utils";

interface EmployeeAttendanceDossierModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employee: AttendanceRecord | null;
}

export function EmployeeAttendanceDossierModal({
  isOpen,
  onOpenChange,
  employee,
}: EmployeeAttendanceDossierModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);

  const [dbHistory, setDbHistory] = useState<EmployeeAttendanceHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (!employee || !isOpen) return;
    let isMounted = true;
    setIsLoadingHistory(true);
    import("../../actions/attendance")
      .then(({ getEmployeeAttendanceHistoryAction }) =>
        getEmployeeAttendanceHistoryAction(employee.employeeId, selectedMonth, selectedYear)
      )
      .then((res) => {
        if (isMounted && res.success && res.history) {
          setDbHistory(res.history);
        }
      })
      .catch((err) => console.error("Error fetching attendance history:", err))
      .finally(() => {
        if (isMounted) setIsLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [employee, selectedMonth, selectedYear, isOpen]);

  const fallbackHistory: EmployeeAttendanceHistory = useMemo(() => {
    if (!employee) {
      return getIndividualAttendanceHistory("emp-default", "Empleado", selectedMonth, selectedYear);
    }
    return getIndividualAttendanceHistory(
      employee.employeeId,
      employee.employeeName,
      selectedMonth,
      selectedYear
    );
  }, [employee, selectedMonth, selectedYear]);

  const history = dbHistory || fallbackHistory;

  if (!employee) return null;

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleExportTimesheet = () => {
    setIsExporting(true);
    try {
      const rows = [
        ["Reporte Oficial de Asistencia - K'anPro"],
        ["Colaborador", `"${employee.employeeName}"`],
        ["ID", `"${employee.employeeId}"`],
        ["Periodo", `"${history.monthName} ${selectedYear}"`],
        ["Puntualidad", `"${history.individualPunctualityRate}%"`],
        ["Días Asistidos", String(history.daysPresent)],
        ["Retardos", String(history.daysLate)],
        ["Faltas Injustificadas", String(history.daysAbsent)],
        ["Horas Efectivas", String(history.totalEffectiveHours)],
        ["Horas Extras", String(history.totalOvertimeHours)],
        [],
        ["Fecha", "Día", "Estatus", "Entrada", "Salida", "Horas", "Retardo (min)", "Horas Extra"],
        ...history.days.map((d) => [
          d.date,
          `"${d.dayOfWeek}"`,
          `"${d.status}"`,
          `"${d.checkInTime || "--:--"}"`,
          `"${d.checkOutTime || "--:--"}"`,
          String(d.effectiveHours || 0),
          String(d.delayMinutes || 0),
          String(d.overtimeHours || 0),
        ]),
      ];
      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        rows.map((e) => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `Asistencia_${employee.employeeName.replace(/[^a-zA-Z0-9]/g, "_")}_${history.monthName}_${selectedYear}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Tarjeta de Asistencia descargada", {
        description: `Se generó el reporte oficial para ${employee.employeeName} (${history.monthName} ${selectedYear}).`,
      });
    } catch {
      toast.error("Error al exportar reporte de asistencia");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "presente":
        return "bg-emerald-500 text-white hover:bg-emerald-600";
      case "retardo":
        return "bg-amber-500 text-white hover:bg-amber-600";
      case "falta_injustificada":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "falta_justificada":
        return "bg-blue-500 text-white hover:bg-blue-600";
      case "vacaciones":
        return "bg-purple-500 text-white hover:bg-purple-600";
      default:
        return "bg-muted/40 text-muted-foreground";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] rounded-3xl p-6 bg-card border-border/80 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 text-left pb-3 border-b border-border/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-12 rounded-2xl shrink-0 border border-border/60">
                <AvatarImage src={employee.avatarUrl || ""} />
                <AvatarFallback className="rounded-2xl text-sm font-bold bg-primary/10 text-primary">
                  {employee.employeeName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
                    {employee.employeeName}
                  </DialogTitle>
                  <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold rounded-full">
                    Expediente
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground font-medium">
                  {employee.jobTitle} • {employee.department}
                </DialogDescription>
              </div>
            </div>

            {/* Month selector */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="size-7 rounded-lg"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-xs font-bold px-2 text-foreground min-w-28 text-center">
                {history.monthName} {selectedYear}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="size-7 rounded-lg"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Cumulative Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-background border border-border/50 space-y-1">
            <span className="text-[11px] text-muted-foreground font-bold block">
              Puntualidad
            </span>
            <span className="text-xl font-extrabold text-foreground block">
              {history.individualPunctualityRate}%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/50 space-y-1">
            <span className="text-[11px] text-muted-foreground font-bold block">
              Días Presente
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block">
              {history.daysPresent} días
            </span>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/50 space-y-1">
            <span className="text-[11px] text-muted-foreground font-bold block">
              Retardos / Faltas
            </span>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 block">
              {history.daysLate} / {history.daysAbsent}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-background border border-border/50 space-y-1">
            <span className="text-[11px] text-muted-foreground font-bold block">
              Horas Extra
            </span>
            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 block">
              +{history.totalOvertimeHours} hrs
            </span>
          </div>
        </div>

        {/* Monthly Calendar View */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
              Calendario de Asistencia Mensual
            </h4>
            <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                Puntual
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-amber-500 inline-block" />
                Retardo
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-destructive inline-block" />
                Falta
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-blue-500 inline-block" />
                Justificada
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 p-3 rounded-2xl bg-muted/20 border border-border/50 text-center">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
              <div key={d} className="text-[10px] font-extrabold text-muted-foreground py-1">
                {d}
              </div>
            ))}

            {/* Empty offset padding for 1st day of month */}
            {Array.from({
              length: new Date(selectedYear, selectedMonth - 1, 1).getDay(),
            }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 rounded-xl" />
            ))}

            {/* Actual Days */}
            {history.days.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.status} (Entrada: ${day.checkInTime || "--"})`}
                className={cn(
                  "h-11 rounded-xl p-1 flex flex-col items-center justify-between text-xs transition-all",
                  getStatusColor(day.status)
                )}
              >
                <span className="font-extrabold text-[11px]">{day.dayNumber}</span>
                <span className="text-[9px] font-bold opacity-90 truncate max-w-full">
                  {day.checkInTime || (day.status === "descanso" ? "Off" : "--")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Timesheet Summary */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
            Resumen de Horas Efectivas
          </h4>
          <div className="p-3.5 rounded-xl bg-background border border-border/50 flex items-center justify-between text-xs font-medium">
            <span className="text-muted-foreground">Total Horas Laboradas en el Mes:</span>
            <span className="font-extrabold text-foreground text-sm">
              {history.totalEffectiveHours.toFixed(1)} horas
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
            Cerrar
          </Button>

          <Button
            type="button"
            onClick={handleExportTimesheet}
            disabled={isExporting}
            className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="size-4" />
            <span>{isExporting ? "Generando..." : "Exportar Tarjeta de Asistencia"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
