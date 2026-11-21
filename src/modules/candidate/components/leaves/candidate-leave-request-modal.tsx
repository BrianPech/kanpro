"use client";

import React, { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CalendarDays,
  Plane,
  HeartHandshake,
  Baby,
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Send,
} from "@/components/ui/icons";
import { getMexicoDateISO } from "@/lib/formatters";
import {
  calculateWorkingDays,
  SPECIAL_LEAVE_POLICIES,
} from "@/modules/company/utils/vacation-calculator";
import { submitCandidateLeaveRequestAction } from "../../actions/leaves";
import type { LeaveRequestType } from "../../schemas/leaves.schema";

interface CandidateLeaveRequestModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  employeeId?: string;
  daysAvailable: number;
  onSuccess?: () => void;
}

export function CandidateLeaveRequestModal({
  isOpen,
  onOpenChange,
  companyId,
  companyName,
  employeeId,
  daysAvailable,
  onSuccess,
}: CandidateLeaveRequestModalProps) {
  const todayStr = getMexicoDateISO();

  const [requestType, setRequestType] = useState<LeaveRequestType>("vacaciones");
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Real-time calculation of working days (excluding Sundays as statutory LFT rest)
  const workingDays = calculateWorkingDays(startDate, endDate);
  const selectedPolicy = SPECIAL_LEAVE_POLICIES[requestType];
  const exceedsPolicyMax =
    selectedPolicy?.maxDaysPerRequest !== null &&
    workingDays > (selectedPolicy?.maxDaysPerRequest ?? Infinity);
  const exceedsBalance =
    requestType === "vacaciones" && workingDays > daysAvailable;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Por favor selecciona las fechas de inicio y fin.");
      return;
    }

    if (workingDays <= 0) {
      toast.error("El rango de fechas no contiene días laborales hábiles.");
      return;
    }

    if (exceedsBalance) {
      toast.error("Saldo de vacaciones insuficiente", {
        description: `Dispones de ${daysAvailable} días hábiles y estás solicitando ${workingDays} días.`,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await submitCandidateLeaveRequestAction({
        companyId,
        employeeId,
        requestType,
        startDate,
        endDate,
        reason,
      });

      if (!res.success) {
        throw new Error(res.error || "Error al enviar la solicitud.");
      }

      toast.success("¡Solicitud enviada con éxito!", {
        description: `Se notificó a Recursos Humanos de ${companyName}.`,
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar la solicitud.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-4xl p-6 bg-card border-border/80 max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                <Plane className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-foreground">
                  Solicitar Vacaciones o Permiso
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {companyName} • Gestión conforme a la Ley Federal del Trabajo
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Type of Leave Select */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Tipo de Solicitud
              </Label>
              {requestType === "vacaciones" && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-primary/30 text-primary bg-primary/10 rounded-3xl"
                >
                  Saldo disponible: {daysAvailable} días
                </Badge>
              )}
            </div>

            <Select
              value={requestType}
              onValueChange={(val) => setRequestType(val as LeaveRequestType)}
            >
              <SelectTrigger className="rounded-3xl h-9 text-xs sm:text-sm bg-input/50 border-input font-medium">
                <SelectValue placeholder="Selecciona tipo de permiso">
                  {(val: string | null) =>
                    ({
                      vacaciones: "Vacaciones Anuales LFT (Art. 76)",
                      dias_economicos: "Días Económicos (máx. 3 días hábiles)",
                      matrimonio: "Permiso por Matrimonio (máx. 5 días hábiles)",
                      paternidad: "Permiso por Paternidad (5 días LFT)",
                      maternidad: "Incapacidad por Maternidad (84 días IMSS)",
                      luto: "Permiso por Luto (máx. 5 días hábiles)",
                      permiso_con_goce: "Permiso con Goce de Sueldo",
                      permiso_sin_goce: "Permiso sin Goce de Sueldo",
                    } as Record<string, string>)[val || requestType] || "Selecciona tipo de permiso"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-3xl">
                <SelectItem value="vacaciones" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <Plane className="size-3.5 text-primary" />
                    <span>Vacaciones Anuales LFT (Art. 76)</span>
                  </div>
                </SelectItem>
                <SelectItem value="dias_economicos" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-foreground" />
                    <span>Días Económicos (máx. 3 días hábiles)</span>
                  </div>
                </SelectItem>
                <SelectItem value="matrimonio" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="size-3.5 text-foreground" />
                    <span>Permiso por Matrimonio (máx. 5 días hábiles)</span>
                  </div>
                </SelectItem>
                <SelectItem value="paternidad" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <Baby className="size-3.5 text-foreground" />
                    <span>Permiso por Paternidad (5 días LFT)</span>
                  </div>
                </SelectItem>
                <SelectItem value="maternidad" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <Baby className="size-3.5 text-foreground" />
                    <span>Incapacidad por Maternidad (84 días IMSS)</span>
                  </div>
                </SelectItem>
                <SelectItem value="luto" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="size-3.5 text-foreground" />
                    <span>Permiso por Luto (máx. 5 días hábiles)</span>
                  </div>
                </SelectItem>
                <SelectItem value="permiso_con_goce" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-foreground" />
                    <span>Permiso con Goce de Sueldo</span>
                  </div>
                </SelectItem>
                <SelectItem value="permiso_sin_goce" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-foreground" />
                    <span>Permiso sin Goce de Sueldo</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Fecha de Inicio
              </Label>
              <Input
                type="date"
                value={startDate}
                min={todayStr}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className="rounded-3xl h-9 text-xs sm:text-sm bg-input/50 border-input font-medium"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Fecha de Fin
              </Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-3xl h-9 text-xs sm:text-sm bg-input/50 border-input font-medium"
                required
              />
            </div>
          </div>

          {/* Working Days Counter Banner */}
          <div className="p-3 rounded-3xl bg-muted/60 border border-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              <span className="font-semibold text-muted-foreground">
                Días laborales hábiles:
              </span>
            </div>
            <span className="font-extrabold text-foreground text-sm font-mono">
              {workingDays} día{workingDays !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Insufficient balance or policy limit warning */}
          {(exceedsBalance || exceedsPolicyMax) && (
            <div className="p-3 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  {exceedsBalance ? "Saldo de vacaciones insuficiente" : "Límite de política excedido"}
                </p>
                <p className="text-[11px] leading-relaxed text-destructive/90">
                  {exceedsBalance
                    ? `Estás solicitando ${workingDays} días pero solo dispones de ${daysAvailable} días hábiles. Por favor ajusta tu periodo.`
                    : `La política de ${selectedPolicy?.label} permite hasta ${selectedPolicy?.maxDaysPerRequest} día(s) hábiles por solicitud.`}
                </p>
              </div>
            </div>
          )}

          {/* Reason / Comments */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Observaciones o Motivo (Opcional)
            </Label>
            <Textarea
              placeholder="Ej. Viaje familiar programado, trámites personales..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-3xl text-xs sm:text-sm resize-none bg-input/50 border-input p-3 min-h-[70px]"
              maxLength={250}
            />
          </div>

          <DialogFooter className="pt-2 border-t border-border/40 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-4xl h-9 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || workingDays <= 0 || exceedsBalance || exceedsPolicyMax}
              className="rounded-4xl h-9 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-2xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Enviar Solicitud a RH</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
