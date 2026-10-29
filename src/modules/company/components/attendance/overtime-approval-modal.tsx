"use client";

import React, { useState } from "react";
import {
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  Sparkles,
  Receipt,
  Calendar,
  User,
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AttendanceRecord } from "../../types/attendance";

interface OvertimeApprovalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  record: AttendanceRecord | null;
  onAuthorize: (recordId: string, hours: number, rateType: "doble" | "triple") => void;
}

export function OvertimeApprovalModal({
  isOpen,
  onOpenChange,
  record,
  onAuthorize,
}: OvertimeApprovalModalProps) {
  const [hours, setHours] = useState<number>(record?.overtimeHours || 2.0);
  const [rateType, setRateType] = useState<"doble" | "triple">("doble");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!record) return null;

  const estimatedRatePerHour = 95; // Base MXN per hour
  const multiplier = rateType === "doble" ? 2 : 3;
  const calculatedPay = Math.round(hours * estimatedRatePerHour * multiplier);

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onAuthorize(record.id, hours, rateType);
      toast.success("Horas Extra autorizadas", {
        description: `Se han aprobado ${hours} hrs (${rateType.toUpperCase()}) por un estimado de $${calculatedPay.toLocaleString()} MXN para ${record.employeeName}.`,
      });
      onOpenChange(false);
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 bg-card border-border/80">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Sparkles className="size-3.5 text-primary" />
            <span>Autorización de Jornada Extraordinaria</span>
          </div>
          <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
            Horas Extras • {record.employeeName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Turno: {record.scheduledCheckIn} - {record.scheduledCheckOut} • Salida registrada: {record.checkOutTime || "17:30"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Overtime Detected Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-background to-emerald-500/10 border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-muted-foreground">Excedente de Jornada Detectado:</span>
              <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-none text-xs font-extrabold px-2.5 py-0.5">
                +{record.overtimeHours || 2.0} Horas
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-border/40">
              <span className="text-muted-foreground">Pago Estimado Adicional:</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                +${calculatedPay.toLocaleString()} MXN
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Horas a Autorizar
              </Label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="8"
                value={hours}
                onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Tipo de Tarifa (LFT)
              </Label>
              <Select
                value={rateType}
                onValueChange={(val) => val && setRateType(val as "doble" | "triple")}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="doble">Horas Dobles (200%)</SelectItem>
                  <SelectItem value="triple">Horas Triples (300%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold h-10 px-4"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || hours <= 0}
            className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="size-4" />
            <span>Autorizar para Nómina</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
