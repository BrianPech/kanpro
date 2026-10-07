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
} from "lucide-react";
import { calculateWorkingDays } from "@/modules/company/utils/vacation-calculator";
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
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [requestType, setRequestType] = useState<LeaveRequestType>("vacaciones");
  const [startDate, setStartDate] = useState<string>(tomorrowStr);
  const [endDate, setEndDate] = useState<string>(tomorrowStr);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Real-time calculation of working days (excluding Sundays as statutory LFT rest)
  const workingDays = calculateWorkingDays(startDate, endDate);
  const exceedsBalance = requestType === "vacaciones" && workingDays > daysAvailable;

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
    } catch (err: any) {
      toast.error(err?.message || "Error al enviar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 bg-card border-border/80 max-h-[92vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
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
                  className="text-[10px] font-extrabold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                >
                  Saldo disponible: {daysAvailable} días
                </Badge>
              )}
            </div>

            <Select
              value={requestType}
              onValueChange={(val) => setRequestType(val as LeaveRequestType)}
            >
              <SelectTrigger className="rounded-xl h-11 text-xs font-semibold">
                <SelectValue placeholder="Selecciona tipo de permiso" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="vacaciones" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <Plane className="size-3.5 text-emerald-600" />
                    <span>Vacaciones Anuales LFT (Art. 76)</span>
                  </div>
                </SelectItem>
                <SelectItem value="permiso_con_goce" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-blue-600" />
                    <span>Permiso con Goce de Sueldo</span>
                  </div>
                </SelectItem>
                <SelectItem value="permiso_sin_goce" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-amber-600" />
                    <span>Permiso sin Goce de Sueldo</span>
                  </div>
                </SelectItem>
                <SelectItem value="paternidad" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <Baby className="size-3.5 text-indigo-600" />
                    <span>Permiso por Paternidad (5 días LFT)</span>
                  </div>
                </SelectItem>
                <SelectItem value="maternidad" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <Baby className="size-3.5 text-rose-600" />
                    <span>Incapacidad por Maternidad (84 días IMSS)</span>
                  </div>
                </SelectItem>
                <SelectItem value="luto" className="text-xs font-semibold py-2">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="size-3.5 text-purple-600" />
                    <span>Permiso por Luto</span>
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
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (new Date(e.target.value) > new Date(endDate)) {
                    setEndDate(e.target.value);
                  }
                }}
                className="rounded-xl h-10 text-xs font-semibold"
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
                className="rounded-xl h-10 text-xs font-semibold"
                required
              />
            </div>
          </div>

          {/* Working Days Counter Banner */}
          <div className="p-3 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              <span className="font-semibold text-muted-foreground">
                Días laborales hábiles:
              </span>
            </div>
            <span className="font-extrabold text-foreground text-sm">
              {workingDays} día{workingDays !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Insufficient balance warning */}
          {exceedsBalance && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Saldo de vacaciones insuficiente</p>
                <p className="text-[11px] leading-relaxed text-rose-600/90 dark:text-rose-400/90">
                  Estás solicitando {workingDays} días pero solo dispones de {daysAvailable} días hábiles. Por favor ajusta tu periodo.
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
              className="rounded-xl text-xs resize-none min-h-[70px]"
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
              className="rounded-xl h-9 text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || workingDays <= 0 || exceedsBalance}
              className="rounded-xl h-9 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-2xs"
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
