"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  Clock,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Sparkles,
  Download,
  Users,
  Plus,
  PenTool,
  Eye,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ContractExpirationItem, WorkforceKPIs } from "../types/dashboard";
import { EmploymentContract } from "../types/contracts";
import { ContractBuilderModal } from "./contracts/contract-builder-modal";
import { ContractPreviewModal } from "./contracts/contract-preview-modal";

interface ContractsViewProps {
  initialContracts: ContractExpirationItem[];
  kpis: WorkforceKPIs;
}

export function ContractsView({ initialContracts, kpis }: ContractsViewProps) {
  const [contracts, setContracts] = useState<ContractExpirationItem[]>(initialContracts);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContractForRenew, setSelectedContractForRenew] = useState<ContractExpirationItem | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [extensionPeriod, setExtensionPeriod] = useState("indeterminado");

  // Modals state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [previewContract, setPreviewContract] = useState<EmploymentContract | null>(null);

  const filteredContracts = contracts.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      c.employeeName.toLowerCase().includes(query) ||
      c.jobTitle.toLowerCase().includes(query) ||
      c.department.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" ? true : c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleContractCreated = (newContract: EmploymentContract) => {
    const newExpirationItem: ContractExpirationItem = {
      id: newContract.id,
      employeeId: newContract.employeeId,
      employeeName: newContract.employeeName,
      avatarUrl: null,
      jobTitle: newContract.jobTitle,
      department: newContract.department,
      contractType: newContract.templateName,
      startDate: newContract.startDate,
      endDate: newContract.endDate || "Indeterminado",
      daysRemaining: newContract.endDate ? 90 : 999,
      status: "normal",
    };

    setContracts((prev) => [newExpirationItem, ...prev]);
    setPreviewContract(newContract);
  };

  const handleOpenPreview = (item: ContractExpirationItem) => {
    const fullContract: EmploymentContract = {
      id: item.id,
      folio: `KAN-CTR-2026-${item.id.replace(/\D/g, "").slice(0, 3) || "104"}`,
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      employeeRfc: "MEMC920415HQ8",
      employeeCurp: "MEMC920415HQRNNR02",
      employeeAddress: "Playa del Carmen, Quintana Roo",
      avatarUrl: item.avatarUrl,
      jobTitle: item.jobTitle,
      department: item.department,
      companyName: "K'anPro Solutions S.A. de C.V.",
      companyRfc: "KPS220419RT5",
      companyAddress: "Av. Constituyentes #120, Gonzalo Guerrero, Playa del Carmen, Q.R.",
      legalRepName: "Lic. Andrea Garza Ramos",
      templateType: item.contractType.toLowerCase().includes("prueba")
        ? "periodo_prueba"
        : item.contractType.toLowerCase().includes("determinado")
        ? "determinado"
        : "indeterminado",
      templateName: item.contractType,
      startDate: item.startDate || "2024-03-15",
      endDate: item.endDate === "Indeterminado" ? null : item.endDate,
      baseSalaryMonthly: 18500,
      dailyIntegratedSalary: 678.5,
      paymentFrequency: "quincenal",
      workSchedule: "Lunes a Viernes 08:00 - 17:00 (Sábados 09:00 - 13:00)",
      status: "vigente",
      companySignature: {
        signerName: "Lic. Andrea Garza Ramos",
        signerRole: "representante_legal",
        signatureDataUrl:
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='40'><path d='M10 20 Q 30 5, 50 20 T 90 20' fill='none' stroke='%231e293b' stroke-width='2'/></svg>",
        signedAt: item.startDate || "2024-03-15",
        certificateHash: "SHA256:0x7a8b9c1d2e3f4a5b",
      },
      addendums: [],
      createdAt: item.startDate || "2024-03-15",
    };

    setPreviewContract(fullContract);
  };

  const handleRenew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractForRenew) return;

    const monthsToAdd = extensionPeriod === "3_meses" ? 3 : extensionPeriod === "6_meses" ? 6 : 12;
    const newEnd = new Date();
    newEnd.setMonth(newEnd.getMonth() + monthsToAdd);

    setContracts((prev) =>
      prev.map((c) =>
        c.id === selectedContractForRenew.id
          ? {
              ...c,
              endDate: extensionPeriod === "indeterminado" ? "Indeterminado" : newEnd.toISOString().split("T")[0],
              daysRemaining: extensionPeriod === "indeterminado" ? 999 : monthsToAdd * 30,
              status: "normal",
              contractType:
                extensionPeriod === "indeterminado"
                  ? "Contrato por Tiempo Indeterminado (Planta)"
                  : `Contrato Determinado (${monthsToAdd} meses)`,
            }
          : c
      )
    );

    toast.success("Contrato renovado y actualizado", {
      description: `Se actualizó la vigencia laboral de ${selectedContractForRenew.employeeName}.`,
    });

    setIsRenewModalOpen(false);
    setSelectedContractForRenew(null);
  };

  const imminentCount = contracts.filter((c) => c.status === "imminent").length;
  const upcomingCount = contracts.filter((c) => c.status === "upcoming").length;
  const activeCount = contracts.length;

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
            <FileCheck2 className="size-7 text-indigo-600 dark:text-indigo-400" />
            <span>Contratos & Vencimientos Laborales</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
            Plantillas oficiales LFT, firma electrónica digital, alertas de vencimiento y renovación.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            onClick={() => setIsBuilderOpen(true)}
            className="rounded-xl text-xs font-bold h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            <span>Nuevo Contrato con Plantilla</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Vencen en &lt; 7 días</span>
            <Badge className="bg-destructive text-destructive-foreground border-none text-[10px]">
              Alerta Roja
            </Badge>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {imminentCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Requieren renovación o pase a planta urgente
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Próximos a Vencer (15–30 días)</span>
            <Badge className="bg-amber-500 text-white border-none text-[10px]">
              Seguimiento
            </Badge>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {upcomingCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Fin de periodo de prueba o contrato temporal
          </p>
        </Card>

        <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>Total Contratos Activos</span>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {activeCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Colaboradores con expediente contractual activo
          </p>
        </Card>
      </div>

      {/* Main List */}
      <Card className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador, puesto o tipo de contrato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => val && setStatusFilter(val)}
          >
            <SelectTrigger className="h-10 w-44 rounded-xl bg-background border-border/80 text-xs font-medium">
              <SelectValue placeholder="Filtrar por estatus" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todos los estatus</SelectItem>
              <SelectItem value="imminent">🔴 Críticos (&lt;7 días)</SelectItem>
              <SelectItem value="upcoming">🟡 Próximos (15–30 días)</SelectItem>
              <SelectItem value="normal">🟢 Vigentes / Indeterminados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/60 space-y-2">
            <p className="text-xs text-muted-foreground">
              No se encontraron contratos que coincidan con la búsqueda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContracts.map((c) => {
              const isImminent = c.status === "imminent";
              const isUpcoming = c.status === "upcoming";

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-border/50 bg-background hover:border-border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <Avatar className="size-11 rounded-xl shrink-0 border border-border/40">
                      <AvatarImage src={c.avatarUrl || ""} />
                      <AvatarFallback className="rounded-xl text-xs font-bold bg-muted text-muted-foreground">
                        {c.employeeName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-foreground truncate">
                          {c.employeeName}
                        </h4>
                        <span className="text-xs text-muted-foreground font-medium">
                          • {c.jobTitle} ({c.department})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold flex-wrap">
                        <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full border-border/60">
                          {c.contractType}
                        </Badge>
                        <span>•</span>
                        <span>Inicio: {c.startDate || "2024-03-15"}</span>
                        <span>•</span>
                        <span>
                          Vence: <strong className="text-foreground">{c.endDate}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 flex-wrap">
                    {isImminent ? (
                      <Badge className="bg-destructive/15 text-destructive border-none text-xs font-extrabold px-2.5 py-0.5 rounded-lg">
                        {`¡Vence en ${c.daysRemaining} días!`}
                      </Badge>
                    ) : isUpcoming ? (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none text-xs font-extrabold px-2.5 py-0.5 rounded-lg">
                        {`Vence en ${c.daysRemaining} días`}
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-xs font-extrabold px-2.5 py-0.5 rounded-lg">
                        Vigente
                      </Badge>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenPreview(c)}
                      className="h-8 px-2.5 rounded-lg text-xs font-bold border-border/70 flex items-center gap-1"
                    >
                      <Eye className="size-3" />
                      <span>Ver Contrato</span>
                    </Button>

                    {(isImminent || isUpcoming) && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedContractForRenew(c);
                          setIsRenewModalOpen(true);
                        }}
                        className="h-8 px-3 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1"
                      >
                        <RotateCcw className="size-3" />
                        <span>Renovar / Planta</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal: Renovar Contrato */}
      <Dialog open={isRenewModalOpen} onOpenChange={setIsRenewModalOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-3xl p-6 bg-card border-border/80">
          <form onSubmit={handleRenew} className="space-y-4">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg font-extrabold text-foreground">
                Renovar o Pasar a Planta
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium">
                Actualiza las condiciones contractuales de {selectedContractForRenew?.employeeName}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Tipo de Extensión / Renovación *
                </Label>
                <Select
                  value={extensionPeriod}
                  onValueChange={(val) => val && setExtensionPeriod(val)}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="indeterminado">✨ Pasar a Contrato Indeterminado (Planta)</SelectItem>
                    <SelectItem value="6_meses">Extender por 6 meses determinados</SelectItem>
                    <SelectItem value="12_meses">Extender por 12 meses determinados</SelectItem>
                    <SelectItem value="3_meses">Extender periodo de prueba (3 meses)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRenewModalOpen(false)}
                className="rounded-xl text-xs font-bold h-10 px-4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
              >
                Confirmar Renovación
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 1: Contract Builder */}
      <ContractBuilderModal
        isOpen={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
        onContractCreated={handleContractCreated}
      />

      {/* Modal 2: Contract Document Preview & Signatures */}
      <ContractPreviewModal
        isOpen={!!previewContract}
        onOpenChange={(open) => !open && setPreviewContract(null)}
        contract={previewContract}
        onContractUpdated={(updated) => setPreviewContract(updated)}
      />
    </div>
  );
}
