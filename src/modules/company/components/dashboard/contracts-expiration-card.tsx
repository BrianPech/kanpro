"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  Clock,
  AlertTriangle,
  Calendar,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  User,
  Sparkles,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ContractExpirationItem } from "../../types/dashboard";

interface ContractsExpirationCardProps {
  initialContracts: ContractExpirationItem[];
}

export function ContractsExpirationCard({
  initialContracts,
}: ContractsExpirationCardProps) {
  const [contracts, setContracts] = useState<ContractExpirationItem[]>(initialContracts);
  const [selectedContract, setSelectedContract] = useState<ContractExpirationItem | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [extensionPeriod, setExtensionPeriod] = useState("6_meses");
  const [newSalary, setNewSalary] = useState("");

  const handleRenewContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    // Extend contract by selected period
    const monthsToAdd = extensionPeriod === "3_meses" ? 3 : extensionPeriod === "6_meses" ? 6 : 12;
    const newEnd = new Date();
    newEnd.setMonth(newEnd.getMonth() + monthsToAdd);

    setContracts((prev) =>
      prev.map((c) =>
        c.id === selectedContract.id
          ? {
              ...c,
              endDate: newEnd.toISOString().split("T")[0],
              daysRemaining: monthsToAdd * 30,
              status: "normal",
              contractType:
                extensionPeriod === "indeterminado"
                  ? "Contrato Indeterminado"
                  : `Determinado (${monthsToAdd} meses)`,
            }
          : c
      )
    );

    toast.success("Contrato renovado con éxito", {
      description: `Se ha extendido el contrato de ${selectedContract.employeeName}.`,
    });

    setIsRenewModalOpen(false);
    setSelectedContract(null);
  };

  const urgentCount = contracts.filter((c) => c.status === "imminent" || c.status === "upcoming").length;

  return (
    <Card id="contracts-section" className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <FileCheck2 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-foreground">
                Contratos Próximos a Vencer
              </h3>
              {urgentCount > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {urgentCount} por atender
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Control de vencimientos a 15 y 30 días para renovación o término legal.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/company/employees" />}
          className="rounded-xl text-xs font-bold h-9 px-3.5 border-border/60 hidden sm:flex items-center gap-1.5"
        >
          <span>Plantilla Completa</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>

      {contracts.length === 0 ? (
        <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed border-border/60 space-y-2">
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
                  "p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5",
                  isImminent
                    ? "bg-destructive/5 border-destructive/30 hover:border-destructive/50"
                    : isUpcoming
                    ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50"
                    : "bg-background border-border/60 hover:border-border"
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar className="size-10 rounded-xl shrink-0 border border-border/40">
                    <AvatarImage src={item.avatarUrl || ""} />
                    <AvatarFallback className="rounded-xl text-xs font-bold bg-muted text-muted-foreground">
                      {item.employeeName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-foreground truncate">
                        {item.employeeName}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium truncate">
                        • {item.jobTitle} ({item.department})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-semibold flex-wrap">
                      <span>Vence: {item.endDate}</span>
                      <span>•</span>
                      <span className="text-foreground">{item.contractType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <Badge
                    className={cn(
                      "text-xs font-extrabold px-2.5 py-1 rounded-lg border-none",
                      isImminent
                        ? "bg-destructive text-destructive-foreground animate-pulse"
                        : isUpcoming
                        ? "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground"
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
                    className="h-8 px-3 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1"
                  >
                    <RotateCcw className="size-3" />
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
          <DialogContent className="sm:max-w-[480px] rounded-2xl p-6 bg-card border-border/80">
            <form onSubmit={handleRenewContract} className="space-y-4">
              <DialogHeader className="space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Renovación Contractual</span>
                </div>
                <DialogTitle className="text-lg font-extrabold text-foreground">
                  Renovar Contrato de {selectedContract.employeeName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Puesto: {selectedContract.jobTitle} • Vencimiento actual: {selectedContract.endDate}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Nuevo Plazo de Contratación
                  </Label>
                  <Select
                    value={extensionPeriod}
                    onValueChange={(val) => val && setExtensionPeriod(val)}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                      <SelectValue placeholder="Seleccionar plazo" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="3_meses">Determinado (3 Meses)</SelectItem>
                      <SelectItem value="6_meses">Determinado (6 Meses)</SelectItem>
                      <SelectItem value="12_meses">Determinado (1 Año)</SelectItem>
                      <SelectItem value="indeterminado">Contrato por Tiempo Indeterminado (Planta)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="renew-salary" className="text-xs font-bold text-foreground">
                    Ajuste Salarial (Opcional)
                  </Label>
                  <Input
                    id="renew-salary"
                    placeholder="Ej. $12,500 MXN mensuales"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Deja vacío si mantiene el mismo sueldo convenido.
                  </p>
                </div>
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
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
