"use client";

import React from "react";
import {
  Receipt,
  Download,
  Printer,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  Sparkles,
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PayrollEmployeeItem } from "../../types/payroll";

interface PayrollSlipModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employee: PayrollEmployeeItem | null;
  periodName: string;
  companyName?: string;
}

export function PayrollSlipModal({
  isOpen,
  onOpenChange,
  employee,
  periodName,
  companyName = "K'anPro Solutions S.A. de C.V.",
}: PayrollSlipModalProps) {
  if (!employee) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success("Descargando Recibo de Nómina...", {
      description: `Recibo para ${employee.employeeName} (${periodName}).`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] rounded-3xl p-6 bg-card border-border/80 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 text-left pb-3 border-b border-border/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-none text-xs font-bold px-2.5 py-0.5 rounded-lg">
                Recibo de Pre-Nómina
              </Badge>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-xs font-bold px-2.5 py-0.5 rounded-lg">
                Calculado
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="rounded-xl text-xs font-bold h-8 px-2.5 border-border/70 flex items-center gap-1"
              >
                <Printer className="size-3.5" />
                <span>Imprimir</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="rounded-xl text-xs font-bold h-8 px-2.5 border-border/70 flex items-center gap-1"
              >
                <Download className="size-3.5" />
                <span>PDF</span>
              </Button>
            </div>
          </div>

          <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
            {employee.employeeName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            {employee.jobTitle} • {employee.department} • Periodo: {periodName}
          </DialogDescription>
        </DialogHeader>

        {/* Digital Slip Body */}
        <div className="space-y-4 pt-1 text-xs">
          {/* Company & Bank Header */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                Empresa Pagadora
              </span>
              <span className="font-bold text-foreground">{companyName}</span>
            </div>
            {employee.bankAccount && (
              <div className="sm:text-right">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">
                  Cuenta de Dispersión
                </span>
                <span className="font-mono text-muted-foreground">
                  {employee.bankAccount.bankName} ••••{employee.bankAccount.clabe.slice(-4)}
                </span>
              </div>
            )}
          </div>

          {/* Breakdown Grid: Percepciones vs Deducciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Percepciones */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
              <h4 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Percepciones (+ Ingresos)
              </h4>

              <div className="space-y-1.5 text-xs font-medium">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sueldo Base Periodo:</span>
                  <span className="font-bold text-foreground">
                    ${employee.baseSalaryPeriod.toLocaleString()} MXN
                  </span>
                </div>

                {employee.overtimeHours > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{`Horas Extra (+${employee.overtimeHours}h):`}</span>
                    <span className="font-bold text-foreground">
                      +${employee.overtimePay.toLocaleString()} MXN
                    </span>
                  </div>
                )}

                {employee.punctualityBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Premio de Puntualidad:</span>
                    <span className="font-bold text-foreground">
                      +${employee.punctualityBonus.toLocaleString()} MXN
                    </span>
                  </div>
                )}

                {employee.attendanceBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Premio de Asistencia:</span>
                    <span className="font-bold text-foreground">
                      +${employee.attendanceBonus.toLocaleString()} MXN
                    </span>
                  </div>
                )}

                {employee.performanceBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bono de Desempeño:</span>
                    <span className="font-bold text-foreground">
                      +${employee.performanceBonus.toLocaleString()} MXN
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-emerald-500/20 flex justify-between font-extrabold text-emerald-700 dark:text-emerald-400">
                <span>Total Percepciones:</span>
                <span>${employee.totalPerceptions.toLocaleString()} MXN</span>
              </div>
            </div>

            {/* Deducciones */}
            <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-2.5">
              <h4 className="text-xs font-extrabold text-destructive uppercase tracking-wider">
                Deducciones (- Descuentos)
              </h4>

              <div className="space-y-1.5 text-xs font-medium">
                {employee.unjustifiedAbsences > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{`Faltas Injustificadas (${employee.unjustifiedAbsences} días):`}</span>
                    <span className="font-bold text-destructive">
                      -${employee.absenceDeductions.toLocaleString()} MXN
                    </span>
                  </div>
                )}

                {employee.delayDeductions > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descuento por Retardos:</span>
                    <span className="font-bold text-destructive">
                      -${employee.delayDeductions.toLocaleString()} MXN
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota IMSS Obrero:</span>
                  <span className="font-bold text-destructive">
                    -${employee.imssDeduction.toLocaleString()} MXN
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retención ISR Estimada:</span>
                  <span className="font-bold text-destructive">
                    -${employee.isrEstimated.toLocaleString()} MXN
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-destructive/20 flex justify-between font-extrabold text-destructive">
                <span>Total Deducciones:</span>
                <span>-${employee.totalDeductions.toLocaleString()} MXN</span>
              </div>
            </div>
          </div>

          {/* Big Net Amount Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-background to-primary/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                Neto a Dispersar al Colaborador
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                ${employee.netPayEstimated.toLocaleString()} MXN
              </div>
            </div>

            <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400 opacity-80" />
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border/40 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold h-10 px-5"
          >
            Cerrar Recibo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
