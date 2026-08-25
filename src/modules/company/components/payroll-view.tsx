"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Calendar,
  DollarSign,
  Download,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileSpreadsheet,
  Building2,
  Receipt,
  Users,
  Sparkles,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PayrollSummaryData, WorkforceKPIs } from "../types/dashboard";
import { PayrollEmployeeItem } from "../types/payroll";
import { PayrollSlipModal } from "./payroll/payroll-slip-modal";
import { AdjustPayrollItemModal } from "./payroll/adjust-payroll-item-modal";

interface PayrollViewProps {
  payroll: PayrollSummaryData;
  kpis: WorkforceKPIs;
}

export function PayrollView({ payroll: initialPayroll, kpis }: PayrollViewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSimulatingPayout, setIsSimulatingPayout] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(initialPayroll.status);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [selectedSlipEmployee, setSelectedSlipEmployee] = useState<PayrollEmployeeItem | null>(null);
  const [selectedAdjustEmployee, setSelectedAdjustEmployee] = useState<PayrollEmployeeItem | null>(null);

  // Realistic employee breakdown for pre-payroll
  const [employees, setEmployees] = useState<PayrollEmployeeItem[]>([
    {
      id: "pay-001",
      employeeId: "emp-001",
      employeeName: "Carlos Mendoza",
      jobTitle: "Supervisor de Mantenimiento",
      department: "Operaciones",
      baseSalaryPeriod: 9250, // quincena
      daysWorked: 15,
      overtimeHours: 6.5,
      overtimePay: 1235,
      punctualityBonus: 500,
      attendanceBonus: 500,
      performanceBonus: 800,
      unjustifiedAbsences: 0,
      absenceDeductions: 0,
      lateArrivals: 0,
      delayDeductions: 0,
      imssDeduction: 285,
      isrEstimated: 840,
      totalPerceptions: 12285,
      totalDeductions: 1125,
      netPayEstimated: 11160,
      bankAccount: {
        bankName: "BBVA México",
        clabe: "012691001234567890",
      },
    },
    {
      id: "pay-002",
      employeeId: "emp-002",
      employeeName: "Mariana Silva",
      jobTitle: "Capitán de Meseros",
      department: "Alimentos y Bebidas",
      baseSalaryPeriod: 8000,
      daysWorked: 15,
      overtimeHours: 0,
      overtimePay: 0,
      punctualityBonus: 0, // perdió por retardo
      attendanceBonus: 400,
      performanceBonus: 600,
      unjustifiedAbsences: 0,
      absenceDeductions: 0,
      lateArrivals: 1,
      delayDeductions: 150,
      imssDeduction: 245,
      isrEstimated: 680,
      totalPerceptions: 9000,
      totalDeductions: 1075,
      netPayEstimated: 7925,
      bankAccount: {
        bankName: "Santander México",
        clabe: "014691009876543210",
      },
    },
    {
      id: "pay-003",
      employeeId: "emp-003",
      employeeName: "Alejandro Ruiz",
      jobTitle: "Cocinero A",
      department: "Cocina & Producción",
      baseSalaryPeriod: 7500,
      daysWorked: 15,
      overtimeHours: 4.0,
      overtimePay: 700,
      punctualityBonus: 400,
      attendanceBonus: 400,
      performanceBonus: 0,
      unjustifiedAbsences: 0,
      absenceDeductions: 0,
      lateArrivals: 0,
      delayDeductions: 0,
      imssDeduction: 220,
      isrEstimated: 590,
      totalPerceptions: 9000,
      totalDeductions: 810,
      netPayEstimated: 8190,
      bankAccount: {
        bankName: "Banorte",
        clabe: "072691004561237890",
      },
    },
    {
      id: "pay-004",
      employeeId: "emp-004",
      employeeName: "Sofía Morales",
      jobTitle: "Recepcionista Bilingüe",
      department: "Front Desk",
      baseSalaryPeriod: 8500,
      daysWorked: 14,
      overtimeHours: 0,
      overtimePay: 0,
      punctualityBonus: 0,
      attendanceBonus: 0,
      performanceBonus: 300,
      unjustifiedAbsences: 1,
      absenceDeductions: 566,
      lateArrivals: 0,
      delayDeductions: 0,
      imssDeduction: 255,
      isrEstimated: 620,
      totalPerceptions: 8800,
      totalDeductions: 1441,
      netPayEstimated: 7359,
      bankAccount: {
        bankName: "BBVA México",
        clabe: "012691005544332211",
      },
    },
  ]);

  const filteredEmployees = employees.filter(
    (e) =>
      e.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalGrossCalculated = employees.reduce((acc, curr) => acc + curr.totalPerceptions, 0);
  const totalDeductionsCalculated = employees.reduce((acc, curr) => acc + curr.totalDeductions, 0);
  const totalNetCalculated = employees.reduce((acc, curr) => acc + curr.netPayEstimated, 0);
  const totalOvertimeCalculated = employees.reduce((acc, curr) => acc + curr.overtimePay, 0);

  const handleAdjustBonus = (
    employeeId: string,
    punctuality: number,
    attendance: number,
    performance: number
  ) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.employeeId === employeeId) {
          const totalPerceptions =
            emp.baseSalaryPeriod +
            emp.overtimePay +
            punctuality +
            attendance +
            performance;
          const netPayEstimated = totalPerceptions - emp.totalDeductions;
          return {
            ...emp,
            punctualityBonus: punctuality,
            attendanceBonus: attendance,
            performanceBonus: performance,
            totalPerceptions,
            netPayEstimated,
          };
        }
        return emp;
      })
    );
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success("Layout de Dispersión Bancaria Generado", {
        description: `Se descargó el archivo TXT/CSV para transferencia masiva (BBVA, Banorte, Santander, STP).`,
      });
    }, 1000);
  };

  const handleSimulatePayout = () => {
    setIsSimulatingPayout(true);
    setTimeout(() => {
      setIsSimulatingPayout(false);
      setCurrentStatus("pagada");
      toast.success("Nómina dispersada con éxito", {
        description: `Se procesó la orden de transferencia por $${totalNetCalculated.toLocaleString()} MXN para ${employees.length} colaboradores.`,
      });
    }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/company"
              className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Volver al Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <CreditCard className="size-7 text-emerald-600 dark:text-emerald-400" />
            <span>Nómina, Percepciones & Dispersión</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
            {`Pre-nómina para la ${initialPayroll.periodName} (${initialPayroll.periodDates || "Periodo en curso"}). Cálculo automático de incidencias y asistencias.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-xl text-xs font-bold h-10 px-4 border-border/70 shadow-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="size-3.5" />
            <span>{isExporting ? "Generando..." : "Descargar Layout Bancario"}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSimulatePayout}
            disabled={isSimulatingPayout || currentStatus === "pagada"}
            className="rounded-xl text-xs font-bold h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
          >
            <Receipt className="size-4" />
            <span>
              {isSimulatingPayout
                ? "Dispersando..."
                : currentStatus === "pagada"
                ? "Nómina Dispersada"
                : "Aprobar & Dispersar Nómina"}
            </span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Total Percepciones Brutas</span>
            <DollarSign className="size-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            ${totalGrossCalculated.toLocaleString()} MXN
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Sueldos base + bonos de quincena
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Horas Extras Autorizadas</span>
            <Clock className="size-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            +${totalOvertimeCalculated.toLocaleString()} MXN
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Integradas con tarifa 200%/300% LFT
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Deducciones Totales</span>
            <AlertTriangle className="size-4 text-destructive" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-destructive">
            -${totalDeductionsCalculated.toLocaleString()} MXN
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Faltas, retardos, IMSS e ISR estimado
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Dispersión Neta Total</span>
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[10px]">
              {currentStatus === "pagada" ? "Dispersada" : "Por Pagar"}
            </Badge>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ${totalNetCalculated.toLocaleString()} MXN
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Monto total a transferir a colaboradores
          </p>
        </Card>
      </div>

      {/* Main Breakdown Table */}
      <Card className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador, puesto o departamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
            />
          </div>

          <Badge variant="outline" className="text-xs font-bold py-1.5 px-3 rounded-xl border-border/70 self-start sm:self-center">
            {`${filteredEmployees.length} colaboradores en pre-nómina`}
          </Badge>
        </div>

        <div className="space-y-3">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="p-4 rounded-xl border border-border/50 bg-background hover:border-border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <Avatar className="size-11 rounded-xl shrink-0 border border-border/40">
                  <AvatarImage src={emp.avatarUrl || ""} />
                  <AvatarFallback className="rounded-xl text-xs font-bold bg-muted text-muted-foreground">
                    {emp.employeeName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-extrabold text-foreground truncate">
                      {emp.employeeName}
                    </h4>
                    <span className="text-xs text-muted-foreground font-medium">
                      • {emp.jobTitle} ({emp.department})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold flex-wrap">
                    <span>Sueldo Base: <strong className="text-foreground">${emp.baseSalaryPeriod.toLocaleString()}</strong></span>
                    <span>•</span>
                    <span>Días: <strong className="text-foreground">{emp.daysWorked}</strong></span>
                    {emp.overtimeHours > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          +{emp.overtimeHours}h Extra (+${emp.overtimePay.toLocaleString()})
                        </span>
                      </>
                    )}
                    {(emp.punctualityBonus > 0 || emp.attendanceBonus > 0 || emp.performanceBonus > 0) && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          +${emp.punctualityBonus + emp.attendanceBonus + emp.performanceBonus} Bonos
                        </span>
                      </>
                    )}
                    {emp.unjustifiedAbsences > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-destructive font-bold">
                          -{emp.unjustifiedAbsences} Falta (-${emp.absenceDeductions})
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Net Pay and Actions */}
              <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Pago Neto Estimado
                  </span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    ${emp.netPayEstimated.toLocaleString()} MXN
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedAdjustEmployee(emp)}
                  className="h-8 px-2.5 rounded-lg text-xs font-bold border-border/70 flex items-center gap-1"
                >
                  <Edit2 className="size-3" />
                  <span>Ajustar Bonos</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedSlipEmployee(emp)}
                  className="h-8 px-2.5 rounded-lg text-xs font-bold border-border/70 flex items-center gap-1"
                >
                  <Eye className="size-3" />
                  <span>Ver Recibo</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal 1: Individual Pay Slip */}
      <PayrollSlipModal
        isOpen={!!selectedSlipEmployee}
        onOpenChange={(open) => !open && setSelectedSlipEmployee(null)}
        employee={selectedSlipEmployee}
        periodName={initialPayroll.periodName}
      />

      {/* Modal 2: Adjust Bonuses */}
      <AdjustPayrollItemModal
        isOpen={!!selectedAdjustEmployee}
        onOpenChange={(open) => !open && setSelectedAdjustEmployee(null)}
        employee={selectedAdjustEmployee}
        onAdjust={handleAdjustBonus}
      />
    </div>
  );
}
