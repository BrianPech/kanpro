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
} from "lucide-react";
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
import { VacationRequest, VacationRequestType } from "../../types/employee-dossier";
import { calculateWorkingDays } from "../../utils/vacation-calculator";

interface VacationRequestModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestCreated: (req: VacationRequest) => void;
}

export function VacationRequestModal({
  isOpen,
  onOpenChange,
  onRequestCreated,
}: VacationRequestModalProps) {
  const [employeeName, setEmployeeName] = useState("Carlos Mendoza");
  const [department, setDepartment] = useState("Operaciones");
  const [requestType, setRequestType] = useState<VacationRequestType>("vacaciones");
  const [startDate, setStartDate] = useState("2026-09-10");
  const [endDate, setEndDate] = useState("2026-09-15");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDaysBalance = 8; // Available balance for demo employee
  const workingDays = calculateWorkingDays(startDate, endDate);
  const exceedsBalance = requestType === "vacaciones" && workingDays > availableDaysBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || workingDays <= 0) {
      toast.error("Selecciona un rango de fechas válido.");
      return;
    }

    if (exceedsBalance) {
      toast.error("Saldo insuficiente de vacaciones", {
        description: `Estás solicitando ${workingDays} días pero el colaborador solo cuenta con ${availableDaysBalance} días disponibles.`,
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);

      const typeLabels: Record<VacationRequestType, string> = {
        vacaciones: "Vacaciones LFT",
        permiso_con_goce: "Permiso con Goce de Sueldo",
        permiso_sin_goce: "Permiso sin Goce de Sueldo",
        paternidad: "Permiso por Paternidad",
        maternidad: "Incapacidad por Maternidad",
        luto: "Permiso por Luto",
      };

      const newReq: VacationRequest = {
        id: `vreq-${Date.now()}`,
        employeeId: `emp-${Date.now()}`,
        employeeName: employeeName.trim(),
        department,
        requestType,
        typeLabel: typeLabels[requestType] || "Vacaciones",
        startDate,
        endDate,
        totalWorkingDays: workingDays,
        reason: reason.trim() || "Solicitud registrada desde el portal.",
        status: "pendiente",
        requestedAt: "Hoy",
      };

      onRequestCreated(newReq);
      toast.success("Solicitud de vacaciones enviada", {
        description: `Se enviaron ${workingDays} días hábiles para revisión de Recursos Humanos.`,
      });

      onOpenChange(false);
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 bg-card border-border/80">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Plane className="size-3.5 text-primary" />
              <span>Solicitud de Ausencia Laboral</span>
            </div>
            <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
              Solicitar Vacaciones o Permiso
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Calcula automáticamente días hábiles y descuenta de tu saldo LFT.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Colaborador</Label>
              <Input
                placeholder="Nombre del colaborador"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Tipo de Solicitud</Label>
              <Select
                value={requestType}
                onValueChange={(val) => val && setRequestType(val as VacationRequestType)}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="vacaciones">Vacaciones Ordinarias (LFT)</SelectItem>
                  <SelectItem value="permiso_con_goce">Permiso con Goce de Sueldo</SelectItem>
                  <SelectItem value="permiso_sin_goce">Permiso sin Goce de Sueldo</SelectItem>
                  <SelectItem value="paternidad">Permiso de Paternidad</SelectItem>
                  <SelectItem value="luto">Permiso por Duelo / Luto</SelectItem>
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
                  onChange={(e) => setStartDate(e.target.value)}
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
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>
            </div>

            {/* Live Calculation Feedback Card */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-muted-foreground">Días hábiles solicitados:</span>
                <span className="text-foreground text-sm font-extrabold">
                  {workingDays} días
                </span>
              </div>

              {requestType === "vacaciones" && (
                <div className="flex items-center justify-between font-semibold pt-1 border-t border-border/40 text-[11px]">
                  <span className="text-muted-foreground">Saldo disponible del colaborador:</span>
                  <span className={exceedsBalance ? "text-destructive font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                    {availableDaysBalance} días disponibles
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
                placeholder="Ej. Viaje familiar programado..."
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
              className="rounded-xl text-xs font-bold h-10 px-4"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || exceedsBalance || workingDays <= 0}
              className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
