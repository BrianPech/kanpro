"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  Sparkles,
  Building2,
  User,
  Calendar,
  DollarSign,
  Clock,
  ShieldCheck,
  CheckCircle2,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { EmploymentContract, ContractTemplateType } from "../../types/contracts";

interface ContractBuilderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onContractCreated: (contract: EmploymentContract) => void;
  initialEmployeeData?: {
    employeeName?: string;
    employeeRfc?: string;
    employeeCurp?: string;
    jobTitle?: string;
    department?: string;
    baseSalary?: number;
  };
}

export function ContractBuilderModal({
  isOpen,
  onOpenChange,
  onContractCreated,
  initialEmployeeData,
}: ContractBuilderModalProps) {
  const [templateType, setTemplateType] = useState<ContractTemplateType>("indeterminado");
  const [employeeName, setEmployeeName] = useState(initialEmployeeData?.employeeName || "");
  const [employeeRfc, setEmployeeRfc] = useState(initialEmployeeData?.employeeRfc || "MEMC920415HQ8");
  const [employeeCurp, setEmployeeCurp] = useState(initialEmployeeData?.employeeCurp || "MEMC920415HQRNNR02");
  const [jobTitle, setJobTitle] = useState(initialEmployeeData?.jobTitle || "Ejecutivo de Ventas");
  const [department, setDepartment] = useState(initialEmployeeData?.department || "Comercial");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("2026-12-31");
  const [salary, setSalary] = useState(initialEmployeeData?.baseSalary ? String(initialEmployeeData.baseSalary) : "16500");
  const [paymentFrequency, setPaymentFrequency] = useState<"quincenal" | "semanal" | "mensual">("quincenal");
  const [workSchedule, setWorkSchedule] = useState("Lunes a Viernes 09:00 - 18:00 (Sábados 09:00 - 14:00)");
  const [probationDays, setProbationDays] = useState("30");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templateNames: Record<ContractTemplateType, string> = {
    indeterminado: "Contrato por Tiempo Indeterminado (Planta LFT)",
    determinado: "Contrato por Tiempo Determinado (Obra / Temporada)",
    periodo_prueba: "Contrato con Periodo de Prueba (30 - 90 Días)",
    capacitacion_inicial: "Contrato de Capacitación Inicial (3 Meses)",
    honorarios: "Contrato de Prestación de Servicios Profesionales",
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !jobTitle.trim()) {
      toast.error("Por favor completa los campos requeridos.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);

      const parsedSalary = parseFloat(salary) || 15000;
      const parsedSDI = Math.round((parsedSalary / 30) * 1.0493 * 100) / 100; // Factor de integración base 1er año
      const randomFolioNum = Math.floor(100 + Math.random() * 900);

      const newContract: EmploymentContract = {
        id: `ctr-${Date.now()}`,
        folio: `KAN-CTR-2026-${randomFolioNum}`,
        employeeId: `emp-${Date.now()}`,
        employeeName: employeeName.trim(),
        employeeRfc: employeeRfc.trim(),
        employeeCurp: employeeCurp.trim(),
        employeeAddress: "Playa del Carmen, Quintana Roo",
        jobTitle: jobTitle.trim(),
        department: department.trim(),
        companyName: "K'anPro Solutions S.A. de C.V.",
        companyRfc: "KPS220419RT5",
        companyAddress: "Av. Constituyentes #120, Gonzalo Guerrero, Playa del Carmen, Q.R.",
        legalRepName: "Lic. Andrea Garza Ramos",
        templateType,
        templateName: templateNames[templateType],
        startDate,
        endDate: templateType === "indeterminado" ? null : endDate,
        baseSalaryMonthly: parsedSalary,
        dailyIntegratedSalary: parsedSDI,
        paymentFrequency,
        workSchedule,
        probationDays: templateType === "periodo_prueba" ? parseInt(probationDays, 10) : undefined,
        status: "en_firma",
        addendums: [],
        createdAt: "Hoy",
      };

      onContractCreated(newContract);
      toast.success("Contrato generado con éxito", {
        description: `Se preparó el ${templateNames[templateType]} para ${employeeName}.`,
      });

      onOpenChange(false);
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-3xl p-6 bg-card border-border/80 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleCreate} className="space-y-4">
          <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-border/40">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <FileCheck2 className="size-3.5 text-primary" />
              <span>Plantillas Oficiales LFT</span>
            </div>
            <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
              Crear Nuevo Contrato Laboral
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Genera contratos con cláusulas adaptadas a la legislación mexicana sin necesidad de abogado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {/* Template Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Tipo de Plantilla de Contrato *
              </Label>
              <Select
                value={templateType}
                onValueChange={(val) => val && setTemplateType(val as ContractTemplateType)}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="indeterminado">Contrato por Tiempo Indeterminado (Planta)</SelectItem>
                  <SelectItem value="determinado">Contrato por Tiempo Determinado (Obra / Temporada)</SelectItem>
                  <SelectItem value="periodo_prueba">Contrato en Periodo de Prueba (30 - 90 días)</SelectItem>
                  <SelectItem value="capacitacion_inicial">Contrato de Capacitación Inicial (3 meses)</SelectItem>
                  <SelectItem value="honorarios">Contrato de Prestación de Servicios (Honorarios)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employee Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Nombre del Trabajador *
                </Label>
                <Input
                  placeholder="Ej. Juan Carlos Pérez"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Puesto o Función *
                </Label>
                <Input
                  placeholder="Ej. Desarrollador Frontend"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">RFC</Label>
                <Input
                  value={employeeRfc}
                  onChange={(e) => setEmployeeRfc(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">CURP</Label>
                <Input
                  value={employeeCurp}
                  onChange={(e) => setEmployeeCurp(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-mono"
                />
              </div>
            </div>

            {/* Salary & Frequency */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Salario Bruto Mensual (MXN) *
                </Label>
                <Input
                  type="number"
                  placeholder="15000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Periodicidad de Pago
                </Label>
                <Select
                  value={paymentFrequency}
                  onValueChange={(val) => val && setPaymentFrequency(val as any)}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="quincenal">Quincenal</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Fecha de Inicio</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>

              {templateType !== "indeterminado" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Fecha de Término</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground">Vigencia</Label>
                  <div className="h-10 px-3 rounded-xl bg-muted/40 border border-border/50 text-xs font-bold text-foreground flex items-center">
                    Por Tiempo Indeterminado (Planta)
                  </div>
                </div>
              )}
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
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              Generar Contrato Digital
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
