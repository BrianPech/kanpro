"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Calendar,
  DollarSign,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PayrollSummaryData } from "../../types/dashboard";

interface PayrollSummaryCardProps {
  payroll: PayrollSummaryData;
}

export function PayrollSummaryCard({ payroll }: PayrollSummaryCardProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPayroll = () => {
    setIsExporting(true);
    try {
      const headers = ["Departamento", "Presupuesto_MXN", "Headcount", "Porcentaje"];
      const rows = payroll.departmentBreakdown.map((d) => [
        `"${d.department.replace(/"/g, '""')}"`,
        `${d.amount.toFixed(2)}`,
        `${d.headcount}`,
        `"${d.percentage}%"`,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `resumen_nomina_${payroll.periodName.replace(/\s+/g, "_").toLowerCase()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Resumen de Nómina descargado", {
        description: `Se ha generado el preliminar para la ${payroll.periodName}.`,
      });
    } catch {
      toast.error("Error al exportar el resumen.");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: PayrollSummaryData["status"]) => {
    switch (status) {
      case "pagada":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-bold px-2 py-0.5 rounded-full">
            Dispersada
          </Badge>
        );
      case "calculada":
        return (
          <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-none text-[10px] font-bold px-2 py-0.5 rounded-full">
            Lista para Dispersión
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none text-[10px] font-bold px-2 py-0.5 rounded-full">
            En Preparación
          </Badge>
        );
    }
  };

  return (
    <Card id="payroll-section" className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CreditCard className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-foreground">
                Resumen de Nómina & Dispersión
              </h3>
              {getStatusBadge(payroll.status)}
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
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
            className="rounded-xl text-xs font-bold h-9 px-3 border-border/60 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="size-3.5" />
            <span>{isExporting ? "Exportando..." : "Descargar"}</span>
          </Button>

          <Button
            size="sm"
            render={<Link href="/dashboard/company/payroll" />}
            className="rounded-xl text-xs font-bold h-9 px-3 bg-primary text-primary-foreground flex items-center gap-1"
          >
            <span>Ver Pre-Nómina</span>
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Budget Card */}
      <div className="p-4.5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-background to-primary/10 border border-emerald-500/20 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
          <span>Presupuesto Estimado a Pagar</span>
          <span className="text-foreground font-extrabold flex items-center gap-1">
            <Calendar className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Pago: {payroll.paymentDate}
          </span>
        </div>

        <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          ${payroll.estimatedTotal.toLocaleString()} MXN
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-muted-foreground">
              {payroll.employeesCount} Empleados en nómina
            </span>
            <span className={payroll.daysToPay <= 3 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
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

      {/* Department Breakdown */}
      {payroll.departmentBreakdown.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs font-extrabold text-foreground">
            <span>Distribución por Departamento</span>
            <span className="text-muted-foreground font-medium">Headcount / %</span>
          </div>

          <div className="space-y-2.5">
            {payroll.departmentBreakdown.map((dept) => (
              <div key={dept.department} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">{dept.department}</span>
                  <span className="text-muted-foreground font-bold">
                    ${dept.amount.toLocaleString()} ({dept.headcount} pers.)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${dept.percentage || 20}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
