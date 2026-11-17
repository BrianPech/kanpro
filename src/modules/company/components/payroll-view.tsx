"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
  Layers,
  ShieldCheck,
} from "@/components/ui/icons";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PayrollSummaryData, WorkforceKPIs } from "../types/dashboard";
import { PayrollEmployeeItem, PayrollPeriodSummary } from "../types/payroll";
import { PayrollSlipModal } from "./payroll/payroll-slip-modal";
import { AdjustPayrollItemModal } from "./payroll/adjust-payroll-item-modal";
import {
  adjustEmployeeBonusesAction,
  disperseCompanyPayrollAction,
  stampPayrollPeriodAction,
} from "../actions/payroll";
import {
  generateBankDispersalLayout,
  BankLayoutType,
} from "../utils/bank-layout-generator";
import { CompanyPageHeader } from "./shared/company-page-header";
import { CompanyStatusBadge } from "./shared/company-status-badge";

interface PayrollViewProps {
  payrollSummary?: PayrollPeriodSummary;
  companyName?: string;
  kpis?: WorkforceKPIs;
  payroll?: PayrollSummaryData;
}

export function PayrollView({
  payrollSummary,
  companyName = "Mi Empresa",
  kpis,
  payroll: fallbackPayroll,
}: PayrollViewProps) {
  const router = useRouter();
  const periodName =
    payrollSummary?.periodName ||
    fallbackPayroll?.periodName ||
    "Quincena Actual";
  const startDate = payrollSummary?.startDate || "2026-09-01";
  const endDate = payrollSummary?.endDate || "2026-09-15";
  const payoutDate = payrollSummary?.payoutDate || endDate;

  const resolveViewStatus = (
    status?: PayrollPeriodSummary["status"],
    fallback?: PayrollSummaryData["status"]
  ): "borrador" | "calculada" | "pagada" | "timbrada" => {
    if (status === "timbrada") return "timbrada";
    if (status === "dispersada" || status === "pagada") return "pagada";
    if (status === "borrador" || status === "calculada") return status;
    return fallback === "pagada" || fallback === "dispersada" ? "pagada" : "calculada";
  };

  const [periodId, setPeriodId] = useState(payrollSummary?.periodId || "");
  const [employees, setEmployees] = useState<PayrollEmployeeItem[]>(
    payrollSummary?.employees || []
  );
  const [currentStatus, setCurrentStatus] = useState<"borrador" | "calculada" | "pagada" | "timbrada">(
    resolveViewStatus(payrollSummary?.status, fallbackPayroll?.status)
  );

  useEffect(() => {
    setPeriodId(payrollSummary?.periodId || "");
    setEmployees(payrollSummary?.employees || []);
    setCurrentStatus(resolveViewStatus(payrollSummary?.status, fallbackPayroll?.status));
  }, [payrollSummary, fallbackPayroll?.status]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDispersing, setIsDispersing] = useState(false);
  const [isStamping, setIsStamping] = useState(false);

  // Modals state
  const [selectedSlipEmployee, setSelectedSlipEmployee] = useState<PayrollEmployeeItem | null>(null);
  const [selectedAdjustEmployee, setSelectedAdjustEmployee] = useState<PayrollEmployeeItem | null>(null);

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
  const employeesWithoutBank = employees.filter(
    (e) => !e.bankAccount?.clabe || !/^\d{18}$/.test(e.bankAccount.clabe.trim())
  );

  const handleAdjustBonus = async (
    employeeId: string,
    punctuality: number,
    attendance: number,
    performance: number
  ) => {
    const prevEmployees = [...employees];

    // Actualización optimista
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.employeeId === employeeId) {
          const totalPerceptions =
            emp.baseSalaryPeriod +
            emp.overtimePay +
            punctuality +
            attendance +
            performance;
          const netPayEstimated = Math.max(0, totalPerceptions - emp.totalDeductions);
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

    try {
      const res = await adjustEmployeeBonusesAction({
        employeeId,
        punctualityBonus: punctuality,
        attendanceBonus: attendance,
        performanceBonus: performance,
        startDate,
        endDate,
      });

      if (!res.success) {
        setEmployees(prevEmployees);
        toast.error("No se pudo guardar el ajuste de bonos", { description: res.error });
        return;
      }

      toast.success("Bonos guardados en base de datos", {
        description: "El cálculo de la pre-nómina ha sido actualizado permanentemente.",
      });
    } catch (err: unknown) {
      setEmployees(prevEmployees);
      const message = err instanceof Error ? err.message : "Error al actualizar bonos.";
      toast.error("Error al guardar bonos", { description: message });
    }
  };

  const handleDownloadLayout = (layoutType: BankLayoutType) => {
    if (employees.length === 0) {
      toast.error("No hay empleados para generar el layout bancario.");
      return;
    }

    try {
      const result = generateBankDispersalLayout(employees, periodName, layoutType);

      const blob = new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const skippedMsg = result.skippedCount && result.skippedCount > 0
        ? ` (${result.skippedCount} excluido(s) por falta de CLABE válida)`
        : "";

      toast.success("Layout de Dispersión Bancaria Generado", {
        description: `Se descargó exitosamente: ${result.fileName} con ${result.includedCount ?? employees.length} registros${skippedMsg}.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al generar layout bancario.";
      toast.error("Imposible generar layout bancario", {
        description: message,
      });
    }
  };

  const handleDispersePayout = async () => {
    if (employees.length === 0) {
      toast.error("No hay empleados para dispersar la nómina.");
      return;
    }

    if (
      !confirm(
        `¿Deseas confirmar la dispersión de la ${periodName} por un monto total neto de $${totalNetCalculated.toLocaleString()} MXN para ${employees.length} empleados?`
      )
    ) {
      return;
    }

    setIsDispersing(true);
    try {
      const res = await disperseCompanyPayrollAction({
        periodName,
        startDate,
        endDate,
        payoutDate,
        totalGross: totalGrossCalculated,
        totalOvertime: totalOvertimeCalculated,
        totalBonuses: employees.reduce(
          (acc, e) => acc + e.punctualityBonus + e.attendanceBonus + e.performanceBonus,
          0
        ),
        totalDeductions: totalDeductionsCalculated,
        totalNet: totalNetCalculated,
        employees,
      });

      if (!res.success) {
        toast.error("Error al procesar dispersión", { description: res.error });
        return;
      }

      const newPayrollId = res.payrollId || res.data?.payrollId;
      if (newPayrollId) {
        setPeriodId(newPayrollId);
      }
      setCurrentStatus("pagada");
      toast.success("Nómina dispersada y registrada con éxito", {
        description: `Se procesó la orden por $${totalNetCalculated.toLocaleString()} MXN respaldada en Supabase.`,
      });
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al procesar la dispersión.";
      toast.error("Error al comunicar con el servidor", { description: message });
    } finally {
      setIsDispersing(false);
    }
  };

  const handleStampPayroll = async () => {
    if (employees.length === 0) {
      toast.error("No hay empleados en este periodo para timbrar.");
      return;
    }

    if (!periodId || periodId.startsWith("payroll-")) {
      toast.error("Dispersión requerida", {
        description: "Primero debes procesar y dispersar la nómina antes de emitir los CFDI fiscales ante el SAT.",
      });
      return;
    }

    setIsStamping(true);
    try {
      const res = await stampPayrollPeriodAction({ payrollId: periodId });
      if (!res.success || !res.data) {
        toast.error("Error al timbrar nómina con PAC", { description: res.error });
        return;
      }

      setCurrentStatus("timbrada");
      setEmployees((prev) =>
        prev.map((emp) => ({
          ...emp,
          cfdi: emp.cfdi
            ? { ...emp.cfdi, status: "timbrado" }
            : { uuid: `CFDI-${emp.employeeId.slice(0, 8).toUpperCase()}`, status: "timbrado" },
        }))
      );
      toast.success("Nómina timbrada exitosamente ante el SAT (CFDI 4.0)", {
        description: `Se certificaron ${res.data.stampedCount} recibos de nómina con Timbre Fiscal Digital oficial.`,
      });
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado al conectar con el PAC.";
      toast.error("Error de timbrado fiscal", { description: message });
    } finally {
      setIsStamping(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 font-sans">
      {/* Header Unificado */}
      <CompanyPageHeader
        title="Nómina, Percepciones & Dispersión"
        description={`Pre-nómina para la ${periodName} (${startDate} al ${endDate}). Cálculo automático de LFT, IMSS, ISR y asistencias.`}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Dropdown de layouts bancarios */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold text-xs flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="size-3.5" />
                  <span>Descargar Layout Bancario</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="text-xs font-bold">
                Formatos de Banca Empresarial
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDownloadLayout("csv_universal")}
                className="text-xs font-medium cursor-pointer"
              >
                <FileSpreadsheet className="size-3.5 mr-2 text-emerald-600" />
                <span>CSV Universal (Banca / Excel)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDownloadLayout("bbva")}
                className="text-xs font-medium cursor-pointer"
              >
                <Building2 className="size-3.5 mr-2 text-blue-600" />
                <span>Layout BBVA (.TXT)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDownloadLayout("banorte")}
                className="text-xs font-medium cursor-pointer"
              >
                <Building2 className="size-3.5 mr-2 text-red-600" />
                <span>Layout Banorte B-Net (.TXT)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDownloadLayout("stp")}
                className="text-xs font-medium cursor-pointer"
              >
                <Layers className="size-3.5 mr-2 text-indigo-600" />
                <span>Layout STP SPEI Masivo (.CSV)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            onClick={handleDispersePayout}
            disabled={isDispersing || currentStatus === "pagada" || currentStatus === "timbrada" || employees.length === 0}
            className="font-bold text-xs flex items-center gap-1.5"
          >
            {isDispersing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Dispersando...</span>
              </>
            ) : (
              <>
                <Receipt className="size-4" />
                <span>
                  {currentStatus === "pagada" || currentStatus === "timbrada"
                    ? "Nómina Dispersada"
                    : "Aprobar & Dispersar Nómina"}
                </span>
              </>
            )}
          </Button>

          {/* Botón de Timbrado SAT 4.0 */}
          <Button
            size="sm"
            variant={currentStatus === "timbrada" ? "secondary" : "default"}
            onClick={handleStampPayroll}
            disabled={isStamping || currentStatus === "timbrada" || employees.length === 0}
            className="font-bold text-xs flex items-center gap-1.5"
          >
            {isStamping ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Timbrando con PAC...</span>
              </>
            ) : currentStatus === "timbrada" ? (
              <>
                <ShieldCheck className="size-4" />
                <span>Timbrada SAT (4.0)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                <span>Timbrar SAT 4.0</span>
              </>
            )}
          </Button>
        </div>
      </CompanyPageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Total Percepciones Brutas</span>
            <DollarSign className="size-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            ${totalGrossCalculated.toLocaleString()} MXN
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Sueldos base + bonos de quincena
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Horas Extras Autorizadas</span>
            <Clock className="size-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
            +${totalOvertimeCalculated.toLocaleString()} MXN
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Integradas con tarifa 200%/300% LFT
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Deducciones Totales</span>
            <AlertTriangle className="size-4 text-destructive" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-destructive font-mono">
            -${totalDeductionsCalculated.toLocaleString()} MXN
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Faltas, retardos, IMSS e ISR Art. 96
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Dispersión Neta Total</span>
            <Badge
              className={cn(
                "border-none text-[10px]",
                currentStatus === "pagada"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold"
              )}
            >
              {currentStatus === "pagada" ? "Dispersada" : "Por Dispersar"}
            </Badge>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            ${totalNetCalculated.toLocaleString()} MXN
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Monto transferido a {employees.length} empleados
          </p>
        </Card>
      </div>

      {/* Missing Bank Account Warning Banner */}
      {employeesWithoutBank.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start sm:items-center gap-3 text-amber-900 dark:text-amber-200 text-xs">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 leading-relaxed">
            <span className="font-bold">Alerta para Dispersión Bancaria: </span>
            {employeesWithoutBank.length} colaborador(es) no cuentan con una cuenta CLABE de 18 dígitos registrada. Quedarán excluidos automáticamente de los archivos de dispersión hasta registrar sus datos bancarios.
          </div>
        </div>
      )}

      {/* Main Breakdown Table */}
      <Card className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar empleado, puesto o departamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

          <Badge
            variant="outline"
            className="text-xs font-bold font-mono self-start sm:self-center"
          >
            {`${filteredEmployees.length} empleados en pre-nómina`}
          </Badge>
        </div>

        {employees.length === 0 ? (
          <div className="p-12 text-center bg-muted/20 rounded-xl border border-dashed border-border/60 space-y-3">
            <Users className="size-8 text-muted-foreground mx-auto stroke-1" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">
                No hay empleados activos en la plantilla
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Para calcular la nómina y dispersión bancaria, agrega empleados en el módulo de Plantilla o contrata candidatos desde reclutamiento.
              </p>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/dashboard/company/employees" />}
              variant="outline"
              size="sm"
              className="mt-2 font-bold text-xs"
            >
              <Plus className="size-3.5 mr-1" />
              Ir a Plantilla de Empleados
            </Button>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/60">
            <p className="text-xs text-muted-foreground">
              No se encontraron empleados que coincidan con la búsqueda.
            </p>
          </div>
        ) : (
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
                      {emp.cfdi?.status === "timbrado" ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-bold py-0 h-4">
                          SAT CFDI
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/60 py-0 h-4">
                          Sin Timbre
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold flex-wrap">
                      <span>
                        Sueldo Base:{" "}
                        <strong className={emp.baseSalaryPeriod <= 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}>
                          ${emp.baseSalaryPeriod.toLocaleString()}
                        </strong>
                      </span>
                      {emp.baseSalaryPeriod <= 0 && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            <AlertTriangle className="size-3 shrink-0" />
                            <span>Sueldo base $0 —</span>
                            <Link href="/dashboard/company/employees" className="underline hover:opacity-80">
                              Configurar en Plantilla
                            </Link>
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        Días:{" "}
                        <strong className="text-foreground">{emp.daysWorked}</strong>
                      </span>
                      {emp.overtimeHours > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                            +{emp.overtimeHours}h Extra (+${emp.overtimePay.toLocaleString()})
                          </span>
                        </>
                      )}
                      {(emp.punctualityBonus > 0 ||
                        emp.attendanceBonus > 0 ||
                        emp.performanceBonus > 0) && (
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
                      {emp.bankAccount?.clabe && /^\d{18}$/.test(emp.bankAccount.clabe.trim()) ? (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {emp.bankAccount.bankName} ••••{emp.bankAccount.clabe.slice(-4)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            <AlertTriangle className="size-3 shrink-0" />
                            Sin cuenta CLABE (No dispersable)
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
        )}
      </Card>

      {/* Modal 1: Individual Pay Slip */}
      <PayrollSlipModal
        isOpen={!!selectedSlipEmployee}
        onOpenChange={(open) => !open && setSelectedSlipEmployee(null)}
        employee={selectedSlipEmployee}
        periodName={periodName}
        companyName={companyName}
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
