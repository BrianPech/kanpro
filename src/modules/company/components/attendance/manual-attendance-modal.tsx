"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "@/components/ui/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createManualAttendanceAction } from "../../actions/attendance";
import {
  AttendanceRecord,
  AttendanceStatus,
  EmployeeSelectOption,
} from "../../types/attendance";

type ModalStep = "form" | "duplicate" | "review" | "success";

export interface ManualAttendanceInitialSelection {
  employeeId: string;
  name: string;
  checkInTime?: string;
  status?: AttendanceStatus;
}

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EmployeeSelectOption[];
  existingRecords: AttendanceRecord[];
  workDate: string;
  initialSelection?: ManualAttendanceInitialSelection | null;
  onRecordCreated: (record: AttendanceRecord) => void;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "presente", label: "Presente" },
  { value: "retardo", label: "Retardo" },
  { value: "falta_justificada", label: "Justificada" },
  { value: "falta_injustificada", label: "Ausencia" },
];

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  presente: "Presente",
  retardo: "Retardo",
  falta_justificada: "Justificada",
  falta_injustificada: "Ausencia",
  vacaciones: "Vacaciones",
  incapacidad: "Incapacidad",
  descanso: "Descanso",
};

const METHOD_LABELS: Record<string, string> = {
  qr: "QR",
  gps: "GPS",
  manual: "Manual",
};

function formatShortDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatLongDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  const formatted = parsed.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function ManualAttendanceModal({
  isOpen,
  onOpenChange,
  employees,
  existingRecords,
  workDate,
  initialSelection = null,
  onRecordCreated,
}: ManualAttendanceModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<ModalStep>("form");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [manualName, setManualName] = useState<string>("");
  const [checkInTime, setCheckInTime] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | "">(
    ""
  );
  const [isCollaboratorMenuOpen, setIsCollaboratorMenuOpen] = useState(false);
  const [collaboratorSearch, setCollaboratorSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastAppliedSelectionKey, setLastAppliedSelectionKey] = useState<
    string | null
  >(null);

  const selectionKey =
    isOpen && initialSelection
      ? `${initialSelection.employeeId}-${initialSelection.name}-${initialSelection.checkInTime ?? ""}`
      : null;

  if (selectionKey && selectionKey !== lastAppliedSelectionKey && initialSelection) {
    setLastAppliedSelectionKey(selectionKey);
    setStep("form");
    setSelectedEmployeeId(initialSelection.employeeId);
    setManualName(initialSelection.name);
    setCheckInTime(initialSelection.checkInTime || "");
    setSelectedStatus(initialSelection.status || "");
    setSubmitError(null);
  }

  const recordsByEmployeeId = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    existingRecords.forEach((rec) => {
      map.set(rec.employeeId, rec);
    });
    return map;
  }, [existingRecords]);

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  );

  const existingRecordForSelected = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return recordsByEmployeeId.get(selectedEmployeeId) || null;
  }, [recordsByEmployeeId, selectedEmployeeId]);

  const filteredEmployees = useMemo(() => {
    const q = collaboratorSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.jobTitle.toLowerCase().includes(q)
    );
  }, [employees, collaboratorSearch]);

  const isAbsenceStatus =
    selectedStatus === "falta_injustificada" ||
    selectedStatus === "falta_justificada";

  const canContinue =
    (Boolean(selectedEmployeeId) || manualName.trim().length > 0) &&
    Boolean(selectedStatus) &&
    (isAbsenceStatus || checkInTime.trim().length > 0);

  const resetForm = () => {
    setStep("form");
    setSelectedEmployeeId("");
    setManualName("");
    setCheckInTime("");
    setSelectedStatus("");
    setIsCollaboratorMenuOpen(false);
    setCollaboratorSearch("");
    setIsSubmitting(false);
    setSubmitError(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      setLastAppliedSelectionKey(null);
    }
    onOpenChange(open);
  };

  const handleGoToReview = () => {
    if (!canContinue) return;
    setSubmitError(null);
    if (existingRecordForSelected?.checkInTime) {
      setStep("duplicate");
      return;
    }
    setStep("review");
  };

  const handleSubmit = async () => {
    if (!selectedStatus) return;
    if (!selectedEmployeeId && !manualName.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await createManualAttendanceAction({
        employeeId: selectedEmployeeId,
        workDate,
        checkInTime: isAbsenceStatus ? null : checkInTime,
        status: selectedStatus,
        delayMinutes: selectedStatus === "retardo" ? 20 : 0,
      });

      if (res.success && res.record) {
        const raw = res.record;
        const empName =
          selectedEmployee?.name || manualName.trim() || "Colaborador";
        const newRecord: AttendanceRecord = {
          id: raw.id,
          employeeId: raw.employee_id,
          employeeName: empName,
          avatarUrl: selectedEmployee?.avatarUrl || null,
          jobTitle: selectedEmployee?.jobTitle || "Empleado",
          department: selectedEmployee?.department || "Operaciones",
          workDate,
          scheduledCheckIn: raw.scheduled_check_in,
          scheduledCheckOut: raw.scheduled_check_out,
          checkInTime: raw.check_in_time,
          checkOutTime: raw.check_out_time,
          breakStartTime: raw.break_start_time,
          breakEndTime: raw.break_end_time,
          checkInMethod: "manual",
          delayMinutes: raw.delay_minutes || 0,
          status: raw.status as AttendanceStatus,
          overtimeHours: Number(raw.overtime_hours) || 0,
        };

        onRecordCreated(newRecord);
        setStep("success");
        router.refresh();
      } else {
        setSubmitError(
          res.error ||
            "Los datos siguen en el formulario. Reintenta cuando se restablezca la conexión."
        );
      }
    } catch {
      setSubmitError(
        "Los datos siguen en el formulario. Reintenta cuando se restablezca la conexión."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName =
    selectedEmployee?.name || manualName.trim() || "Colaborador";
  const displayDepartment = selectedEmployee?.department || "Operaciones";
  const displayStatusLabel = selectedStatus
    ? STATUS_LABELS[selectedStatus]
    : "—";
  const previousStatusLabel = existingRecordForSelected
    ? STATUS_LABELS[existingRecordForSelected.status]
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[520px] p-[24px] rounded-[16px] bg-card border border-border shadow-[0px_12px_40px_0px_rgba(0,0,0,0.28)] gap-[16px] max-h-[92vh] overflow-y-auto"
      >
        {step === "form" && (
          <>
            <DialogHeader className="gap-[4px] text-left">
              <span className="text-[12px] font-semibold leading-[16px] text-link">
                Paso 1 de 2
              </span>
              <DialogTitle className="text-[24px] font-semibold leading-[32px] tracking-[-0.015em] text-foreground">
                Registrar entrada manual
              </DialogTitle>
              <DialogDescription className="text-[14px] font-normal leading-[20px] text-muted-foreground">
                Selecciona al colaborador y confirma la hora de entrada.
              </DialogDescription>
            </DialogHeader>

            {/* Stepper Pills */}
            <div className="flex items-center gap-[8px]">
              <span className="h-[32px] px-[12px] rounded-[8px] bg-sidebar-accent text-link text-[13px] font-medium inline-flex items-center">
                1 · Datos de entrada
              </span>
              <span className="h-[32px] px-[12px] rounded-[8px] bg-muted text-muted-foreground text-[13px] font-medium inline-flex items-center">
                2 · Revisión
              </span>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-[16px]">
              {/* Colaborador */}
              <div className="flex flex-col gap-[6px] relative">
                <label className="text-[14px] font-medium leading-[20px] text-foreground">
                  Colaborador
                </label>
                {employees.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setIsCollaboratorMenuOpen((prev) => !prev)
                      }
                      className={cn(
                        "h-[44px] w-full px-[12px] rounded-[8px] bg-card border text-left flex items-center justify-between gap-2 text-[14px] transition-colors cursor-pointer",
                        isCollaboratorMenuOpen
                          ? "border-link ring-1 ring-link/30"
                          : "border-input hover:border-control-border"
                      )}
                    >
                      <span
                        className={cn(
                          "truncate",
                          selectedEmployee
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {selectedEmployee
                          ? `${selectedEmployee.name} · ${selectedEmployee.department}`
                          : "Busca o selecciona un colaborador"}
                      </span>
                      <ChevronDown className="size-[16px] text-muted-foreground shrink-0" />
                    </button>

                    {isCollaboratorMenuOpen && (
                      <div className="rounded-[12px] border border-border bg-popover shadow-[0px_8px_24px_0px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col">
                        <div className="p-[8px] border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-[10px] top-1/2 -translate-y-1/2 size-[14px] text-muted-foreground pointer-events-none" />
                            <Input
                              value={collaboratorSearch}
                              onChange={(e) =>
                                setCollaboratorSearch(e.target.value)
                              }
                              placeholder="Filtrar por nombre o área..."
                              className="h-[36px] pl-[30px] text-[13px] rounded-[8px] border-input bg-card"
                            />
                          </div>
                        </div>

                        <div className="max-h-[196px] overflow-y-auto divide-y divide-border">
                          {filteredEmployees.length === 0 ? (
                            <div className="py-[16px] px-[12px] text-center text-[13px] text-muted-foreground">
                              Sin resultados para &ldquo;{collaboratorSearch}&rdquo;
                            </div>
                          ) : (
                            filteredEmployees.map((emp) => {
                              const rec = recordsByEmployeeId.get(emp.id);
                              const schedule =
                                rec?.scheduledCheckIn && rec?.scheduledCheckOut
                                  ? `${rec.scheduledCheckIn}–${rec.scheduledCheckOut}`
                                  : emp.jobTitle;
                              const entryStatus = rec?.checkInTime
                                ? `Entrada: ${rec.checkInTime}`
                                : "Sin entrada";

                              return (
                                <button
                                  key={emp.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedEmployeeId(emp.id);
                                    setManualName(emp.name);
                                    setIsCollaboratorMenuOpen(false);
                                    setCollaboratorSearch("");
                                  }}
                                  className={cn(
                                    "w-full px-[14px] py-[10px] text-left flex items-center justify-between gap-3 hover:bg-muted/60 transition-colors cursor-pointer",
                                    selectedEmployeeId === emp.id &&
                                      "bg-sidebar-accent/60"
                                  )}
                                >
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[14px] font-medium leading-[20px] text-foreground truncate">
                                      {emp.name}
                                    </span>
                                    <span className="text-[12px] leading-[16px] text-muted-foreground truncate">
                                      {emp.department} · {schedule}
                                    </span>
                                  </div>
                                  <span className="text-[12px] font-normal leading-[16px] text-muted-foreground shrink-0">
                                    {entryStatus}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Input
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Nombre completo del colaborador"
                    className="h-[44px] rounded-[8px] border-input bg-card text-[14px]"
                  />
                )}
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                <div className="flex flex-col gap-[6px]">
                  <span className="text-[14px] font-medium leading-[20px] text-foreground">
                    Fecha del registro
                  </span>
                  <div className="h-[44px] px-[12px] rounded-[8px] border border-input bg-card flex items-center text-[14px] text-foreground">
                    {formatShortDate(workDate)}
                  </div>
                </div>

                <div className="flex flex-col gap-[6px]">
                  <label
                    htmlFor="manual-checkin-time"
                    className="text-[14px] font-medium leading-[20px] text-foreground"
                  >
                    Hora de entrada
                  </label>
                  <Input
                    id="manual-checkin-time"
                    type="time"
                    value={isAbsenceStatus ? "" : checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    disabled={isAbsenceStatus}
                    placeholder="HH:MM"
                    className="h-[44px] rounded-[8px] border-input bg-card text-[14px]"
                  />
                </div>
              </div>

              {/* Estado */}
              <div className="flex flex-col gap-[6px]">
                <span className="text-[14px] font-medium leading-[20px] text-foreground">
                  Estado
                </span>
                <Select
                  value={selectedStatus}
                  onValueChange={(val) =>
                    setSelectedStatus(val as AttendanceStatus)
                  }
                >
                  <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal">
                    <SelectValue placeholder="Selecciona un estado">
                      {selectedStatus
                        ? STATUS_LABELS[selectedStatus]
                        : "Selecciona un estado"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-[12px] leading-[16px] text-muted-foreground">
                La fecha corresponde al día seleccionado en Asistencia.
              </p>
            </div>

            <div className="flex items-center justify-between gap-[12px] pt-[8px]">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="h-[44px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-semibold hover:bg-muted/60 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!canContinue}
                onClick={handleGoToReview}
                className="h-[44px] px-[16px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 cursor-pointer"
              >
                Revisar entrada
              </Button>
            </div>
          </>
        )}

        {step === "duplicate" && existingRecordForSelected && (
          <>
            <DialogHeader className="gap-[4px] text-left">
              <DialogTitle className="text-[24px] font-semibold leading-[32px] tracking-[-0.015em] text-foreground">
                Ya hay una entrada registrada
              </DialogTitle>
              <DialogDescription className="text-[14px] font-normal leading-[20px] text-muted-foreground">
                Comprueba el registro de {displayName} antes de hacer un cambio.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted rounded-[12px] p-[16px] flex flex-col gap-[10px]">
              <div className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-semibold text-foreground text-right">
                  {formatLongDate(workDate)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-muted-foreground">
                  Entrada registrada
                </span>
                <span className="font-semibold text-foreground text-right">
                  {existingRecordForSelected.checkInTime} ·{" "}
                  {METHOD_LABELS[
                    existingRecordForSelected.checkInMethod || "manual"
                  ] || "Manual"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-muted-foreground">Salida registrada</span>
                <span className="font-semibold text-foreground text-right">
                  {existingRecordForSelected.checkOutTime || "—"}
                </span>
              </div>
            </div>

            <div className="bg-warning rounded-[12px] p-[14px] flex flex-col gap-[4px]">
              <span className="text-[14px] font-semibold leading-[20px] text-warning-foreground">
                {existingRecordForSelected.checkOutTime
                  ? "Este registro ya tiene una salida"
                  : "Este colaborador ya registró entrada hoy"}
              </span>
              <span className="text-[13px] leading-[18px] text-warning-foreground/90">
                Vuelve al listado para consultar el registro antes de
                corregirlo.
              </span>
            </div>

            <div className="flex items-center justify-end gap-[8px] pt-[8px]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("form")}
                className="h-[44px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-semibold hover:bg-muted/60 cursor-pointer"
              >
                Elegir otra persona
              </Button>
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="h-[44px] px-[16px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-semibold hover:bg-primary/90 cursor-pointer"
              >
                Volver a Asistencia
              </Button>
            </div>
          </>
        )}

        {step === "review" && (
          <>
            <DialogHeader className="gap-[4px] text-left">
              <span className="text-[12px] font-semibold leading-[16px] text-link">
                Paso 2 de 2
              </span>
              <DialogTitle className="text-[24px] font-semibold leading-[32px] tracking-[-0.015em] text-foreground">
                Revisar entrada manual
              </DialogTitle>
              <DialogDescription className="text-[14px] font-normal leading-[20px] text-muted-foreground">
                Comprueba los datos antes de actualizar la asistencia del día.
              </DialogDescription>
            </DialogHeader>

            {/* Stepper Pills */}
            <div className="flex items-center gap-[8px]">
              <button
                type="button"
                onClick={() => {
                  setSubmitError(null);
                  setStep("form");
                }}
                className="h-[32px] px-[12px] rounded-[8px] bg-muted text-muted-foreground hover:text-foreground text-[13px] font-medium inline-flex items-center cursor-pointer transition-colors"
              >
                1 · Datos de entrada
              </button>
              <span className="h-[32px] px-[12px] rounded-[8px] bg-sidebar-accent text-link text-[13px] font-medium inline-flex items-center">
                2 · Revisión
              </span>
            </div>

            {/* Summary Card */}
            <div className="bg-muted rounded-[12px] p-[16px] flex flex-col gap-[10px]">
              <div className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-muted-foreground">Colaborador</span>
                <span className="font-semibold text-foreground text-right">
                  {displayName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-muted-foreground">Área</span>
                <span className="font-semibold text-foreground text-right">
                  {displayDepartment}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-semibold text-foreground text-right">
                  {formatLongDate(workDate)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-muted-foreground">Hora de entrada</span>
                <span className="font-semibold text-foreground text-right">
                  {isAbsenceStatus ? "—" : checkInTime}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-muted-foreground">Estado</span>
                <span className="font-semibold text-foreground text-right">
                  {displayStatusLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-muted-foreground">Método</span>
                <span className="font-semibold text-foreground text-right">
                  Manual
                </span>
              </div>
            </div>

            {submitError ? (
              <div className="bg-[#fcebe9] text-[#a6302a] dark:bg-[#3e2220] dark:text-[#f29b94] rounded-[12px] p-[14px] flex flex-col gap-[4px]">
                <span className="text-[14px] font-semibold leading-[20px]">
                  No pudimos guardar la entrada
                </span>
                <span className="text-[13px] leading-[18px] opacity-90">
                  {submitError}
                </span>
              </div>
            ) : (
              <div className="bg-[#e8f2fb] text-[#184c78] dark:bg-[#193044] dark:text-[#abd6f5] rounded-[12px] p-[14px] flex flex-col gap-[4px]">
                <span className="text-[14px] font-semibold leading-[20px]">
                  Actualiza el estado del día
                </span>
                <span className="text-[13px] leading-[18px] opacity-90">
                  {previousStatusLabel
                    ? `El registro pasará de ${previousStatusLabel} a ${displayStatusLabel}.`
                    : `Se registrará el estado del día como ${displayStatusLabel}.`}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-[12px] pt-[8px]">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  setSubmitError(null);
                  setStep("form");
                }}
                className="h-[44px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-semibold hover:bg-muted/60 cursor-pointer"
              >
                Anterior
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="h-[44px] min-w-[146px] px-[16px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-semibold hover:bg-primary/90 cursor-pointer"
              >
                {isSubmitting
                  ? "Guardando..."
                  : submitError
                  ? "Reintentar"
                  : "Registrar entrada"}
              </Button>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader className="gap-[4px] text-left">
              <DialogTitle className="text-[24px] font-semibold leading-[32px] tracking-[-0.015em] text-foreground">
                Entrada registrada
              </DialogTitle>
              <DialogDescription className="text-[14px] font-normal leading-[20px] text-muted-foreground">
                La entrada de {displayName} quedó guardada en Asistencia.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted rounded-[12px] p-[16px] flex flex-col gap-[10px]">
              <div className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-semibold text-foreground text-right">
                  {formatShortDate(workDate)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-muted-foreground">Hora de entrada</span>
                <span className="font-semibold text-foreground text-right">
                  {isAbsenceStatus ? "—" : checkInTime}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-muted-foreground">Estado</span>
                <span className="font-semibold text-foreground text-right">
                  {displayStatusLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-[14px]">
                <span className="text-muted-foreground">Método</span>
                <span className="font-semibold text-foreground text-right">
                  Manual
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-[8px]">
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="h-[44px] px-[16px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-semibold hover:bg-primary/90 cursor-pointer"
              >
                Volver a Asistencia
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
