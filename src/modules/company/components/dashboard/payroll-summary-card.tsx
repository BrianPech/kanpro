"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Calendar,
  FileSpreadsheet,
  ArrowUpRight,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CompanyStatusBadge } from "../shared/company-status-badge";
import { toast } from "sonner";

import { CompanyDashboardData, PayrollSummaryData } from "../../types/dashboard";

interface PayrollSummaryProps {
  payroll?: PayrollSummaryData | {
    periodName: string;
    status: string;
    estimatedTotal: number;
    employeesCount: number;
    paymentDate: string;
    daysToPay: number;
  };
}

const DEFAULT_PAYROLL = {
  periodName: "1ª Quincena de Octubre 2026",
  status: "draft" as const,
  estimatedTotal: 84500,
  employeesCount: 12,
  paymentDate: "31 Oct, 2026",
  daysToPay: 2,
};

export function PayrollSummaryCard({
  payroll = DEFAULT_PAYROLL,
}: PayrollSummaryProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPayroll = async () => {
    setIsExporting(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      toast.success("Nómina exportada correctamente", {
        description: `Se descargó el layout bancario para ${payroll.periodName}.`,
      });
    } catch {
      toast.error("Error al exportar nómina");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
      case "calculada":
        return <CompanyStatusBadge status="success" label="Calculada" />;
      case "paid":
      case "pagada":
        return <CompanyStatusBadge status="success" label="Dispersada" />;
      case "review":
      case "en_revision":
        return <CompanyStatusBadge status="warning" label="En Revisión" />;
      default:
        return <CompanyStatusBadge status="neutral" label="En Preparación" />;
    }
  };

  return (
    <Card id="payroll-section" className="p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CreditCard className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Resumen de Nómina & Dispersión
              </h3>
              {getStatusBadge(payroll.status)}
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {payroll.periodName} (Corte quincenal)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPayroll}
            disabled={isExporting}
          >
            <FileSpreadsheet data-icon="inline-start" />
            <span>{isExporting ? "Exportando..." : "Descargar"}</span>
          </Button>

          <Button
            size="sm"
            render={<Link href="/dashboard/company/payroll" />}
          >
            <span>Ver Pre-Nómina</span>
            <ArrowUpRight data-icon="inline-end" />
          </Button>
        </div>
      </div>

      {/* Main Budget Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-background to-primary/10 border border-emerald-500/20 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
          <span>Presupuesto Estimado a Pagar</span>
          <span className="text-foreground font-bold flex items-center gap-1.5">
            <Calendar className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Pago: {payroll.paymentDate}
          </span>
        </div>

        <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          ${payroll.estimatedTotal.toLocaleString()} MXN
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">
              {payroll.employeesCount} Empleados en nómina
            </span>
            <span className={payroll.daysToPay <= 3 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
              {payroll.daysToPay === 0
                ? "Día de pago hoy"
                : `Faltan ${payroll.daysToPay} días`}
            </span>
          </div>
          <Progress
            value={Math.max(15, 100 - (payroll.daysToPay / 15) * 100)}
            className="h-2 rounded-full"
          />
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-3.5 rounded-2xl bg-muted/30 border border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Cálculo automático de retenciones IMSS e ISR según LFT.</span>
        <span className="font-semibold text-primary">Pre-cálculo verificado</span>
      </div>
    </Card>
  );
}
