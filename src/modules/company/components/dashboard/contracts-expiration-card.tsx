"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileCheck2,
  ChevronRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanyStatusBadge } from "../shared/company-status-badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ContractItem {
  id: string;
  employeeName: string;
  avatarUrl?: string | null;
  jobTitle: string;
  department: string;
  endDate: string;
  daysRemaining: number;
  contractType: string;
  status: "imminent" | "upcoming" | "normal" | "active";
}

interface ContractsExpirationCardProps {
  contracts?: ContractItem[];
}

export function ContractsExpirationCard({
  contracts: incomingContracts = [],
}: ContractsExpirationCardProps) {
  const [contracts, setContracts] = useState<ContractItem[]>(incomingContracts);
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);

  React.useEffect(() => {
    setContracts(incomingContracts);
  }, [incomingContracts]);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [extensionPeriod, setExtensionPeriod] = useState<string>("indeterminado");
  const [newSalary, setNewSalary] = useState<string>("");

  const handleRenewContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    setContracts((prev) => prev.filter((c) => c.id !== selectedContract.id));

    toast.success("Contrato renovado con éxito", {
      description: `Se ha extendido el contrato de ${selectedContract.employeeName}.`,
    });

    setIsRenewModalOpen(false);
    setSelectedContract(null);
  };

  const urgentCount = contracts.filter((c) => c.status === "imminent" || c.status === "upcoming").length;

  return (
    <Card id="contracts-section" className="p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <FileCheck2 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Contratos Próximos a Vencer
              </h3>
              {urgentCount > 0 && (
                <CompanyStatusBadge
                  status="warning"
                  label={`${urgentCount} por atender`}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Control de vencimientos a 15 y 30 días para renovación o término legal.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/company/employees" />}
          className="hidden sm:inline-flex"
        >
          <span>Plantilla Completa</span>
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>

      {contracts.length === 0 ? (
        <div className="p-8 text-center bg-muted/20 rounded-3xl border border-dashed border-border space-y-2">
          <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-foreground">
            Todos los contratos al día
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No tienes empleados con contratos próximos a vencer en los siguientes 30 días.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((item) => {
            const isImminent = item.status === "imminent";
            const isUpcoming = item.status === "upcoming";

            return (
              <div
                key={item.id}
                className={cn(
                  "p-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5",
                  isImminent
                    ? "bg-destructive/5 border-destructive/30 hover:border-destructive/50"
                    : isUpcoming
                    ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50"
                    : "bg-card border-border hover:border-border/80"
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar className="size-10 rounded-2xl shrink-0 border border-border">
                    <AvatarImage src={item.avatarUrl || ""} />
                    <AvatarFallback className="rounded-2xl text-xs font-bold bg-muted text-muted-foreground">
                      {item.employeeName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {item.employeeName}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium truncate">
                        • {item.jobTitle} ({item.department})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium flex-wrap">
                      <span>Vence: {item.endDate}</span>
                      <span>•</span>
                      <span className="text-foreground">{item.contractType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-semibold px-2.5 py-0.5 rounded-3xl",
                      isImminent
                        ? "bg-destructive text-destructive-foreground animate-pulse border-transparent"
                        : isUpcoming
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {item.daysRemaining === 0
                      ? "Vence Hoy"
                      : `${item.daysRemaining} días restantes`}
                  </Badge>

                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedContract(item);
                      setIsRenewModalOpen(true);
                    }}
                  >
                    <RotateCcw data-icon="inline-start" />
                    <span>Renovar</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Renovar Contrato */}
      {selectedContract && (
        <Dialog open={isRenewModalOpen} onOpenChange={setIsRenewModalOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleRenewContract} className="space-y-4">
              <DialogHeader className="space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Renovación Contractual</span>
                </div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Renovar Contrato de {selectedContract.employeeName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Puesto: {selectedContract.jobTitle} • Vencimiento actual: {selectedContract.endDate}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">
                    Nuevo Plazo de Contratación
                  </Label>
                  <Select
                    value={extensionPeriod}
                    onValueChange={(val) => val && setExtensionPeriod(val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar plazo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3_meses">Determinado (3 Meses)</SelectItem>
                      <SelectItem value="6_meses">Determinado (6 Meses)</SelectItem>
                      <SelectItem value="12_meses">Determinado (1 Año)</SelectItem>
                      <SelectItem value="indeterminado">Contrato por Tiempo Indeterminado (Planta)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="renew-salary" className="text-xs font-semibold text-foreground">
                    Ajuste Salarial (Opcional)
                  </Label>
                  <Input
                    id="renew-salary"
                    placeholder="Ej. $12,500 MXN mensuales"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deja vacío si mantiene el mismo sueldo convenido.
                  </p>
                </div>
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRenewModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Confirmar y Extender Contrato
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
