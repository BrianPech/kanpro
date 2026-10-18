"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  PenTool,
  Building2,
  User,
  Calendar,
  Lock,
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
import { EmploymentContract, DigitalSignature } from "../../types/contracts";
import { DigitalSignatureModal } from "./digital-signature-modal";

interface ContractPreviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contract: EmploymentContract | null;
  onContractUpdated?: (contract: EmploymentContract) => void;
}

export function ContractPreviewModal({
  isOpen,
  onOpenChange,
  contract,
  onContractUpdated,
}: ContractPreviewModalProps) {
  const [activeSigner, setActiveSigner] = useState<{
    name: string;
    role: "representante_legal" | "trabajador";
  } | null>(null);

  if (!contract) return null;

  const handleSignatureCompleted = (sig: DigitalSignature) => {
    const updated: EmploymentContract = {
      ...contract,
      companySignature: sig.signerRole === "representante_legal" ? sig : contract.companySignature,
      employeeSignature: sig.signerRole === "trabajador" ? sig : contract.employeeSignature,
      status:
        (sig.signerRole === "representante_legal" && contract.employeeSignature) ||
        (sig.signerRole === "trabajador" && contract.companySignature)
          ? "vigente"
          : "en_firma",
    };

    if (onContractUpdated) {
      onContractUpdated(updated);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success("Descargando Contrato Digital en PDF...", {
      description: `Folio: ${contract.folio} (${contract.employeeName}).`,
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[760px] rounded-3xl p-6 bg-card border-border/80 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2 text-left pb-3 border-b border-border/40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-none text-xs font-extrabold px-2.5 py-0.5 rounded-lg">
                  {contract.folio}
                </Badge>
                <Badge
                  className={cn(
                    "text-xs font-bold px-2.5 py-0.5 rounded-lg border-none",
                    contract.status === "vigente"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  )}
                >
                  {contract.status === "vigente" ? "🟢 Contrato Vigente" : "🟡 Pendiente de Firma"}
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

            <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
              {contract.templateName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Celebrado entre <strong>{contract.companyName}</strong> y <strong>{contract.employeeName}</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Formal Contract Document Body */}
          <div className="p-6 sm:p-8 rounded-2xl bg-muted/20 border border-border/50 space-y-6 text-xs text-foreground font-normal leading-relaxed">
            <div className="text-center space-y-1 pb-4 border-b border-border/40">
              <h3 className="text-sm font-extrabold uppercase tracking-wide">
                CONTRATO INDIVIDUAL DE TRABAJO ({contract.templateName.toUpperCase()})
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Sujeto a las disposiciones de la Ley Federal del Trabajo de los Estados Unidos Mexicanos.
              </p>
            </div>

            {/* Declaraciones */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-primary">
                DECLARACIONES
              </h4>
              <p>
                <strong>I. DECLARA EL PATRÓN:</strong> Ser una empresa legalmente constituida denominada <u>{contract.companyName}</u>, con RFC <u>{contract.companyRfc}</u>, con domicilio en <u>{contract.companyAddress}</u>, representada por <u>{contract.legalRepName}</u>.
              </p>
              <p>
                <strong>II. DECLARA EL TRABAJADOR:</strong> Llamarse <u>{contract.employeeName}</u>, con RFC <u>{contract.employeeRfc}</u>, CURP <u>{contract.employeeCurp}</u>, manifestando contar con la capacidad y aptitudes para desempeñar las funciones encomendadas.
              </p>
            </div>

            {/* Cláusulas */}
            <div className="space-y-3 pt-2">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-primary">
                CLÁUSULAS
              </h4>

              <div className="space-y-1.5">
                <p>
                  <strong>PRIMERA (PUESTO Y FUNCIONES):</strong> EL TRABAJADOR se obliga a prestar sus servicios personales y subordinados para el puesto de <strong>{contract.jobTitle}</strong> en el departamento de <strong>{contract.department}</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <p>
                  <strong>SEGUNDA (VIGENCIA):</strong> El presente contrato surte efectos a partir del <strong>{contract.startDate}</strong> {contract.endDate ? `y tendrá vigencia determinada hasta el ${contract.endDate}` : "por tiempo indeterminado"}.
                  {contract.probationDays ? ` Sujeto a un periodo de prueba de ${contract.probationDays} días.` : ""}
                </p>
              </div>

              <div className="space-y-1.5">
                <p>
                  <strong>TERCERA (JORNADA LABORAL):</strong> La jornada de trabajo será de <strong>{contract.workSchedule}</strong>, con un día de descanso semanal preferentemente en domingo.
                </p>
              </div>

              <div className="space-y-1.5">
                <p>
                  <strong>CUARTA (SALARIO Y PAGO):</strong> EL PATRÓN pagará a EL TRABAJADOR un salario bruto de <strong>${contract.baseSalaryMonthly.toLocaleString()} MXN</strong> mensuales (Salario Diario Integrado de ${contract.dailyIntegratedSalary.toFixed(2)} MXN), pagaderos de forma <strong>{contract.paymentFrequency}</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <p>
                  <strong>QUINTA (VACACIONES Y PRESTACIONES):</strong> EL TRABAJADOR disfrutará de las vacaciones dignas conforme a la reforma del Art. 76 de la LFT, prima vacacional del 25%, aguinaldo de ley de 15 días y afiliación formal ante el Instituto Mexicano del Seguro Social (IMSS).
                </p>
              </div>
            </div>

            {/* Bloque de Firmas Electrónicas */}
            <div className="pt-6 border-t border-border/40">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-primary text-center mb-4">
                FIRMAS ELECTRÓNICAS Y SELLOS DIGITALES
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patrón */}
                <div className="p-4 rounded-xl border border-border/60 bg-background text-center space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Por El Patrón / Representante Legal
                  </span>

                  {contract.companySignature ? (
                    <div className="space-y-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={contract.companySignature.signatureDataUrl}
                        alt="Firma Patrón"
                        className="h-14 mx-auto object-contain"
                      />
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {contract.companySignature.certificateHash}
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Firmado el {contract.companySignature.signedAt}
                      </span>
                    </div>
                  ) : (
                    <div className="py-3 space-y-2">
                      <p className="text-[11px] text-muted-foreground">Firma pendiente de la empresa</p>
                      <Button
                        size="sm"
                        onClick={() =>
                          setActiveSigner({
                            name: contract.legalRepName,
                            role: "representante_legal",
                          })
                        }
                        className="h-8 rounded-lg text-xs font-bold bg-primary text-primary-foreground"
                      >
                        <PenTool className="size-3 mr-1" />
                        Firmar Representante
                      </Button>
                    </div>
                  )}
                  <p className="text-xs font-bold text-foreground">{contract.legalRepName}</p>
                </div>

                {/* Trabajador */}
                <div className="p-4 rounded-xl border border-border/60 bg-background text-center space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Por El Trabajador
                  </span>

                  {contract.employeeSignature ? (
                    <div className="space-y-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={contract.employeeSignature.signatureDataUrl}
                        alt="Firma Trabajador"
                        className="h-14 mx-auto object-contain"
                      />
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {contract.employeeSignature.certificateHash}
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Firmado el {contract.employeeSignature.signedAt}
                      </span>
                    </div>
                  ) : (
                    <div className="py-3 space-y-2">
                      <p className="text-[11px] text-muted-foreground">Firma pendiente del empleado</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setActiveSigner({
                            name: contract.employeeName,
                            role: "trabajador",
                          })
                        }
                        className="h-8 rounded-lg text-xs font-bold"
                      >
                        <PenTool className="size-3 mr-1" />
                        Firmar Trabajador
                      </Button>
                    </div>
                  )}
                  <p className="text-xs font-bold text-foreground">{contract.employeeName}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-border/40 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold h-10 px-5"
            >
              Cerrar Visor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Pad Dialog */}
      {activeSigner && (
        <DigitalSignatureModal
          isOpen={!!activeSigner}
          onOpenChange={(open) => !open && setActiveSigner(null)}
          signerName={activeSigner.name}
          signerRole={activeSigner.role}
          contractFolio={contract.folio}
          onSignComplete={handleSignatureCompleted}
        />
      )}
    </>
  );
}
