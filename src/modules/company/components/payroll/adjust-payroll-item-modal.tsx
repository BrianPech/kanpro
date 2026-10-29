"use client";

import React, { useState } from "react";
import {
  DollarSign,
  Sparkles,
  CheckCircle2,
  Receipt,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PayrollEmployeeItem } from "../../types/payroll";

interface AdjustPayrollItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employee: PayrollEmployeeItem | null;
  onAdjust: (
    employeeId: string,
    bonusPunctuality: number,
    bonusAttendance: number,
    bonusPerformance: number
  ) => void;
}

export function AdjustPayrollItemModal({
  isOpen,
  onOpenChange,
  employee,
  onAdjust,
}: AdjustPayrollItemModalProps) {
  const [punctuality, setPunctuality] = useState(employee?.punctualityBonus || 0);
  const [attendance, setAttendance] = useState(employee?.attendanceBonus || 0);
  const [performance, setPerformance] = useState(employee?.performanceBonus || 0);

  if (!employee) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onAdjust(employee.employeeId, punctuality, attendance, performance);
    toast.success("Percepciones actualizadas", {
      description: `Se ajustaron las bonificaciones para ${employee.employeeName}.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 bg-card border-border/80">
        <form onSubmit={handleSave} className="space-y-4">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <DollarSign className="size-3.5 text-primary" />
              <span>Ajuste de Pre-Nómina</span>
            </div>
            <DialogTitle className="text-lg font-extrabold text-foreground">
              Bonos & Incentivos • {employee.employeeName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Añade compensaciones extraordinarias para esta quincena.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Bono de Puntualidad (MXN)
              </Label>
              <Input
                type="number"
                min="0"
                step="50"
                value={punctuality}
                onChange={(e) => setPunctuality(parseFloat(e.target.value) || 0)}
                className="text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Bono de Asistencia (MXN)
              </Label>
              <Input
                type="number"
                min="0"
                step="50"
                value={attendance}
                onChange={(e) => setAttendance(parseFloat(e.target.value) || 0)}
                className="text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Comisiones / Bono de Desempeño (MXN)
              </Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={performance}
                onChange={(e) => setPerformance(parseFloat(e.target.value) || 0)}
                className="text-xs font-medium"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
            >
              Aplicar a Pre-Nómina
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
