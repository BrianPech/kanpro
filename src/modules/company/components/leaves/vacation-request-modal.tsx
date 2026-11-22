"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Sparkles,
  Plane,
  HeartHandshake,
  Baby,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
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
import { VacationRequest, VacationRequestType } from "../../types/employee-dossier";
import { calculateWorkingDays, calculateLFTVacationDays } from "../../utils/vacation-calculator";
import { createCompanyLeaveAction } from "../../actions/leaves";
import { CompanyEmployeeRosterItem } from "../../services/company-dossier";

interface VacationRequestModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestCreated?: (req: VacationRequest) => void;
  employees?: CompanyEmployeeRosterItem[];
}

export function VacationRequestModal({
  isOpen,
  onOpenChange,
  onRequestCreated,
  employees = [],
}: VacationRequestModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    employees.length > 0 ? employees[0].id : ""
  );
  const [requestType, setRequestType] = useState<VacationRequestType>("vacaciones");
  const [startDate, setStartDate] = useState(getMexicoDateISO());
  const [endDate, setEndDate] = useState(getMexicoDateISO());
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected employee data
  const selectedEmp = employees.find((e) => e.id === selectedEmployeeId) || employees[0];
  const lftDays = selectedEmp?.hireDate
    ? calculateLFTVacationDays(selectedEmp.hireDate).totalDaysAccrued
    : 0;

  const availableDaysBalance = lftDays;
  const workingDays = calculateWorkingDays(startDate, endDate);
  const exceedsBalance = requestType === "vacaciones" && workingDays > availableDaysBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const empId = selectedEmployeeId || selectedEmp?.id;
    if (!empId) {
      toast.error("Selecciona un empleado de la plantilla.");
      return;
    }

    if (workingDays <= 0) {
      toast.error("Selecciona un rango de fechas válido.");
      return;
    }

    if (exceedsBalance) {
      toast.error("Saldo insuficiente de vacaciones", {
        description: `Estás solicitando ${workingDays} días pero el empleado cuenta con ${availableDaysBalance} días disponibles.`,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createCompanyLeaveAction({
        employeeId: empId,
        requestType,
        startDate,
        endDate,
        reason,
      });

      if (!res.success) {
        toast.error("No se pudo registrar el permiso", {
          description: res.error,
        });
        return;
      }

      toast.success("Permiso registrado con éxito", {
        description: res.message,
      });

      if (onRequestCreated) {
        const typeLabels: Record<VacationRequestType, string> = {
          vacaciones: "Vacaciones LFT",
          permiso_con_goce: "Permiso con Goce de Sueldo",
          permiso_sin_goce: "Permiso sin Goce de Sueldo",
          dias_economicos: "Días Económicos",
          matrimonio: "Permiso por Matrimonio",
          paternidad: "Permiso por Paternidad",
          maternidad: "Incapacidad por Maternidad",
          luto: "Permiso por Luto",
        };

        const newReq: VacationRequest = {
          id: res.leaveId || `vreq-${getMexicoDateISO()}`,
          employeeId: empId,
          employeeName: selectedEmp?.fullName || "Empleado",
          department: selectedEmp?.department || "Operaciones",
          requestType,
          typeLabel: typeLabels[requestType] || "Vacaciones",
          startDate,
          endDate,
          totalWorkingDays: workingDays,
          reason: reason.trim() || "Registrado directamente por Recursos Humanos.",
          status: "aprobada",
          requestedAt: "Hoy",
          reviewedAt: "Hoy",
          reviewedBy: "Recursos Humanos",
        };
        onRequestCreated(newReq);
      }

      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar la solicitud.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 bg-card border-border/80 max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Plane className="size-3.5 text-primary" />
              <span>Gestión de Ausencias • Recursos Humanos</span>
            </div>
            <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
              Registrar Vacaciones o Permiso
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Calcula automáticamente días hábiles conforme a la LFT y descuenta de su saldo legal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Employee Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Empleado de la Plantilla</Label>
              {employees.length > 0 ? (
                <Select
                  value={selectedEmployeeId || employees[0]?.id}
                  onValueChange={(val) => val && setSelectedEmployeeId(val)}
                >
                  <SelectTrigger className="w-full h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                    <SelectValue placeholder="Seleccionar empleado">
                      {(val: string | null) => {
                        const activeId = val || employees[0]?.id;
                        const emp = employees.find((e) => e.id === activeId);
                        return emp
                          ? `${emp.fullName}${emp.department ? ` (${emp.department})` : ""}`
                          : "Seleccionar empleado";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} side="bottom" sideOffset={4} className="w-(--anchor-width) min-w-[280px] rounded-xl max-h-56">
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="text-xs font-medium py-1.5">
                        {emp.fullName} {emp.department ? `(${emp.department})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value="No hay empleados registrados en la plantilla"
                  disabled
                  className="h-10 rounded-xl bg-muted text-xs font-medium"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Tipo de Solicitud</Label>
              <Select
                value={requestType}
                onValueChange={(val) => val && setRequestType(val as VacationRequestType)}
              >
                <SelectTrigger className="w-full h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                  <SelectValue>
                    {({
                      vacaciones: "Vacaciones Ordinarias (LFT Art. 76)",
                      dias_economicos: "Días Económicos (máx. 3 días)",
                      matrimonio: "Permiso por Matrimonio (máx. 5 días)",
                      paternidad: "Permiso de Paternidad (5 días LFT)",
                      maternidad: "Incapacidad por Maternidad (84 días LFT/IMSS)",
                      luto: "Permiso por Duelo / Luto (mín. 3 días LFT)",
                      permiso_con_goce: "Permiso con Goce de Sueldo",
                      permiso_sin_goce: "Permiso sin Goce de Sueldo",
                    } as Record<string, string>)[requestType] || requestType}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} side="bottom" sideOffset={4} className="w-(--anchor-width) min-w-[260px] rounded-xl">
                  <SelectItem value="vacaciones">Vacaciones Ordinarias (LFT Art. 76)</SelectItem>
                  <SelectItem value="dias_economicos">Días Económicos (máx. 3 días)</SelectItem>
                  <SelectItem value="matrimonio">Permiso por Matrimonio (máx. 5 días)</SelectItem>
                  <SelectItem value="paternidad">Permiso de Paternidad (5 días LFT)</SelectItem>
                  <SelectItem value="maternidad">Incapacidad por Maternidad (84 días LFT/IMSS)</SelectItem>
                  <SelectItem value="luto">Permiso por Duelo / Luto (mín. 3 días LFT)</SelectItem>
                  <SelectItem value="permiso_con_goce">Permiso con Goce de Sueldo</SelectItem>
                  <SelectItem value="permiso_sin_goce">Permiso sin Goce de Sueldo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="req-start" className="text-xs font-bold text-foreground">
                  Fecha de Inicio
                </Label>
                <Input
                  id="req-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) {
                      setEndDate(e.target.value);
                    }
                  }}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="req-end" className="text-xs font-bold text-foreground">
                  Fecha de Fin
                </Label>
                <Input
                  id="req-end"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>
            </div>

            {/* Live Calculation Feedback Card */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-muted-foreground">Días hábiles calculados:</span>
                <span className="text-foreground text-sm font-extrabold">
                  {workingDays} día{workingDays !== 1 ? "s" : ""}
                </span>
              </div>

              {requestType === "vacaciones" && (
                <div className="flex items-center justify-between font-semibold pt-1 border-t border-border/40 text-[11px]">
                  <span className="text-muted-foreground">Derecho LFT del empleado:</span>
                  <span className={exceedsBalance ? "text-destructive font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                    {availableDaysBalance} días LFT
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="req-reason" className="text-xs font-bold text-foreground">
                Motivo u Observaciones
              </Label>
              <Textarea
                id="req-reason"
                placeholder="Ej. Registro de vacaciones pactadas..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[70px] rounded-xl bg-background border-border/80 text-xs resize-none font-medium"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold h-10 px-4"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || exceedsBalance || workingDays <= 0 || employees.length === 0}
              className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Registrar y Aprobar Permiso</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
