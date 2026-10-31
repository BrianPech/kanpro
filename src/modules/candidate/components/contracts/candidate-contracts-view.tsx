"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileCheck2,
  FileText,
  Briefcase,
  Calendar,
  DollarSign,
  PenTool,
  CheckCircle2,
  Clock,
  RotateCw,
  Building2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CandidateContractItem } from "@/modules/candidate/services/candidate-contracts";
import { CandidateContractModal } from "./candidate-contract-modal";

interface CandidateContractsViewProps {
  initialContracts: CandidateContractItem[];
  candidateName: string;
  candidateRfc?: string | null;
  candidateCurp?: string | null;
}

export function CandidateContractsView({
  initialContracts,
  candidateName,
  candidateRfc,
  candidateCurp,
}: CandidateContractsViewProps) {
  const router = useRouter();
  const [contracts, setContracts] = useState<CandidateContractItem[]>(initialContracts);
  const [selectedFilter, setSelectedFilter] = useState<"todos" | "pendientes" | "vigentes">("todos");
  const [selectedContract, setSelectedContract] = useState<CandidateContractItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    setContracts(initialContracts);
  }, [initialContracts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const pendingCount = useMemo(
    () => contracts.filter((c) => !c.employeeSigned && c.status !== "cancelado").length,
    [contracts]
  );
  const activeCount = useMemo(
    () => contracts.filter((c) => c.employeeSigned && c.status === "vigente").length,
    [contracts]
  );

  const filteredContracts = useMemo(() => {
    if (selectedFilter === "pendientes") {
      return contracts.filter((c) => !c.employeeSigned && c.status !== "cancelado");
    }
    if (selectedFilter === "vigentes") {
      return contracts.filter((c) => c.employeeSigned && c.status === "vigente");
    }
    return contracts;
  }, [contracts, selectedFilter]);

  const handleOpenContract = (contract: CandidateContractItem) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-grow min-h-full bg-transparent px-6 sm:px-10 lg:px-14 pt-5 pb-28 md:pb-8 space-y-6 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Mis Contratos Laborales
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
            Consulta tus contratos formalizados con validez de la Ley Federal del Trabajo y estampa tu firma electrónica.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 rounded-4xl border-border/70 text-xs font-semibold gap-2 cursor-pointer shadow-2xs"
          >
            <RotateCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* 2. Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-3xl bg-card border border-border/70 shadow-xs space-y-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Total Contratos
          </span>
          <div className="text-2xl font-black text-foreground">
            {contracts.length}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-muted/40 border border-border/70 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Pendientes de Firma
            </span>
            <Clock className="size-4 text-foreground" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {pendingCount}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-primary/10 border border-primary/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Formalizados y Vigentes
            </span>
            <CheckCircle2 className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-primary">
            {activeCount}
          </div>
        </div>
      </div>

      {/* 3. Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedFilter("todos")}
          className={cn(
            "px-3.5 py-1.5 rounded-3xl text-xs font-medium transition-all cursor-pointer",
            selectedFilter === "todos"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-border/70"
          )}
        >
          Todos ({contracts.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter("pendientes")}
          className={cn(
            "px-3.5 py-1.5 rounded-3xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
            selectedFilter === "pendientes"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-border/70"
          )}
        >
          <span>Pendientes de Firma</span>
          {pendingCount > 0 && (
            <span className="size-2 rounded-full bg-primary animate-pulse" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setSelectedFilter("vigentes")}
          className={cn(
            "px-3.5 py-1.5 rounded-3xl text-xs font-medium transition-all cursor-pointer",
            selectedFilter === "vigentes"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-border/70"
          )}
        >
          Vigentes ({activeCount})
        </button>
      </div>

      {/* 4. Contracts List or Empty State */}
      {filteredContracts.length === 0 ? (
        <div className="py-16 px-6 rounded-4xl border border-dashed border-border/80 flex flex-col items-center justify-center text-center space-y-4 bg-card/40">
          <div className="size-16 rounded-3xl bg-muted/60 flex items-center justify-center text-muted-foreground">
            <FileCheck2 className="size-8 stroke-[1.5]" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base font-bold text-foreground">
              {selectedFilter === "pendientes"
                ? "No tienes contratos pendientes de firma"
                : "No se encontraron contratos registrados"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cuando una empresa concluya favorablemente tu proceso de selección y emita tu contrato legal, podrás revisarlo y firmarlo digitalmente aquí.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/candidate/discovery")}
            className="h-9 px-4 rounded-4xl text-xs font-semibold gap-2 cursor-pointer shadow-xs"
          >
            <Sparkles className="size-3.5" />
            <span>Explorar Oportunidades Laborales</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => {
            const isSigned = contract.employeeSigned;
            const salaryFmt = Number(contract.salary || 0).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

            return (
              <div
                key={contract.id}
                className="p-5 sm:p-6 rounded-4xl border border-border/70 hover:border-border transition-all bg-card shadow-xs space-y-4"
              >
                {/* Header Row: Company, Folio, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-3xl bg-muted/60 border border-border/60 flex items-center justify-center shrink-0 font-bold text-sm text-foreground overflow-hidden">
                      {contract.companyLogo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={contract.companyLogo}
                          alt={contract.companyName}
                          className="size-full object-cover rounded-3xl"
                        />
                      ) : (
                        <Building2 className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-foreground">
                          {contract.companyName}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-border/80 rounded-3xl">
                          {contract.folio}
                        </Badge>
                      </div>
                      <h3 className="text-base font-extrabold text-foreground tracking-tight mt-0.5">
                        {contract.jobTitle}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-3xl",
                        isSigned
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted text-foreground border-border/80"
                      )}
                    >
                      {isSigned ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" />
                          Vigente y Firmado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          Pendiente de tu firma
                        </span>
                      )}
                    </Badge>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Departamento
                    </span>
                    <span className="font-bold text-foreground">
                      {contract.department || "Operaciones"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Tipo de Contrato
                    </span>
                    <span className="font-bold text-foreground">
                      {contract.contractType}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Fecha de Inicio
                    </span>
                    <span className="font-bold text-foreground">
                      {contract.startDate}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Sueldo Pactado ({contract.paymentFrequency})
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      ${salaryFmt} MXN
                    </span>
                  </div>
                </div>

                {/* Footer Action Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">
                      Patrón: {contract.companySigned ? "✓ Firmado" : "Pendiente"}
                    </span>
                    <span>•</span>
                    <span className="font-medium">
                      Trabajador: {isSigned ? "✓ Firmado" : "⚠️ Pendiente de firma"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={!isSigned ? "default" : "secondary"}
                      onClick={() => handleOpenContract(contract)}
                      className="h-9 px-4 rounded-4xl text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                    >
                      {!isSigned ? (
                        <>
                          <PenTool className="size-3.5" />
                          <span>Revisar y Firmar Contrato</span>
                        </>
                      ) : (
                        <>
                          <FileText className="size-3.5" />
                          <span>Ver Contrato Digital</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contract Detail & Signature Modal */}
      <CandidateContractModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        contract={selectedContract}
        candidateName={candidateName}
        candidateRfc={candidateRfc}
        candidateCurp={candidateCurp}
        onSigned={() => {
          if (selectedContract) {
            setContracts((prev) =>
              prev.map((c) =>
                c.id === selectedContract.id
                  ? { ...c, employeeSigned: true, status: "vigente" }
                  : c
              )
            );
          }
        }}
      />
    </div>
  );
}
