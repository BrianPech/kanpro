"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DigitalSignatureModal } from "@/modules/company/components/contracts/digital-signature-modal";
import { signCandidateContractAction } from "@/modules/candidate/actions/contracts";
import type { DigitalSignature } from "@/modules/company/types/contracts";

export interface CandidateContractData {
  id: string;
  folio: string;
  companyId?: string;
  companyName?: string;
  companyLegalName?: string | null;
  companyRfc?: string | null;
  companyAddress?: string | null;
  companyLegalRep?: string | null;
  companyLogo?: string | null;
  jobTitle: string;
  department: string;
  contractType: string;
  templateType: string;
  startDate: string;
  endDate?: string | null;
  salary: number;
  paymentFrequency: string;
  companySigned: boolean;
  companySignatureUrl?: string | null;
  employeeSigned: boolean;
  employeeSignatureUrl?: string | null;
  status: string;
  createdAt?: string;
}

export interface CandidateContractModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contract: CandidateContractData | null;
  candidateName: string;
  candidateRfc?: string | null;
  candidateCurp?: string | null;
  onSigned?: () => void;
}

export function CandidateContractModal({
  isOpen,
  onOpenChange,
  contract,
  candidateName,
  candidateRfc,
  candidateCurp,
  onSigned,
}: CandidateContractModalProps) {
  const router = useRouter();
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localEmployeeSigned, setLocalEmployeeSigned] = useState<boolean>(false);
  const [localSignatureUrl, setLocalSignatureUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (contract) {
      setLocalEmployeeSigned(Boolean(contract.employeeSigned));
      setLocalSignatureUrl(contract.employeeSignatureUrl || null);
    }
  }, [contract]);

  if (!contract) return null;

  const isSigned = localEmployeeSigned || Boolean(contract.employeeSigned);
  const effectiveEmployeeSig = localSignatureUrl || contract.employeeSignatureUrl;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success("Descargando Contrato Laboral Digital...", {
      description: `Folio: ${contract.folio} • Certificado de firma digital con validez LFT.`,
    });
  };

  const handleSignCompleted = async (signature: DigitalSignature) => {
    setIsSubmitting(true);
    try {
      const result = await signCandidateContractAction({
        contractId: contract.id,
        signatureData: signature.signatureDataUrl,
      });

      setLocalEmployeeSigned(true);
      setLocalSignatureUrl(signature.signatureDataUrl);

      toast.success("¡Contrato firmado exitosamente!", {
        description: `Tu contrato ${result.folio} ahora está formalizado y vigente conforme a la LFT.`,
      });

      if (onSigned) {
        onSigned();
      }
      router.refresh();
    } catch (err: any) {
      console.error("Error al firmar contrato:", err);
      toast.error("Error al registrar la firma digital", {
        description: err.message || "Por favor intenta de nuevo en unos momentos.",
      });
    } finally {
      setIsSubmitting(false);
      setIsSigningOpen(false);
    }
  };

  const formattedSalary = Number(contract.salary || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const dailySalary = (Number(contract.salary || 0) / 30).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
                    isSigned
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  )}
                >
                  {isSigned ? "🟢 Contrato Formalizado y Vigente" : "🟡 Requiere tu Firma Digital"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="rounded-xl text-xs font-bold h-8 px-2.5 border-border/70 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="size-3.5" />
                  <span>Imprimir</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="rounded-xl text-xs font-bold h-8 px-2.5 border-border/70 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>PDF</span>
                </Button>
              </div>
            </div>

            <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
              {contract.contractType || "Contrato Individual de Trabajo"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Celebrado entre <strong>{contract.companyName || "La Empresa Contratante"}</strong> y <strong>{candidateName}</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Prompt banner if signing is required */}
          {!isSigned && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-200">
                <AlertCircle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-xs leading-snug">
                  <p className="font-extrabold">Firma del trabajador requerida</p>
                  <p className="text-muted-foreground">
                    Lee las cláusulas legales y pulsa el botón para estampar tu firma electrónica.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsSigningOpen(true)}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-9 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Guardando firma...</span>
                  </>
                ) : (
                  <>
                    <PenTool className="size-3.5" />
                    <span>Firmar Contrato Ahora</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Formal Contract Document Body */}
          <div className="p-6 sm:p-8 rounded-2xl bg-muted/20 border border-border/50 space-y-6 text-xs text-foreground font-normal leading-relaxed">
            <div className="text-center space-y-1 pb-4 border-b border-border/40">
              <h3 className="text-sm font-extrabold uppercase tracking-wide">
                CONTRATO INDIVIDUAL DE TRABAJO ({contract.contractType.toUpperCase()})
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Sujeto a las disposiciones y garantías de la Ley Federal del Trabajo de los Estados Unidos Mexicanos.
              </p>
            </div>

            {/* Declaraciones */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-primary">
                DECLARACIONES
              </h4>
              <p>
                <strong>I. DECLARA EL PATRÓN:</strong> Ser una empresa legalmente constituida denominada <u>{contract.companyName || contract.companyLegalName || "La Empresa Contratante"}</u>, con RFC <u>{contract.companyRfc || "XAXX010101000"}</u>, con domicilio fiscal en <u>{contract.companyAddress || "Domicilio fiscal de la empresa contratante"}</u>, legalmente representada por <u>{contract.companyLegalRep || "Representante Legal Autorizado"}</u>.
              </p>
              <p>
                <strong>II. DECLARA EL TRABAJADOR:</strong> Llamarse <u>{candidateName}</u>, con RFC <u>{candidateRfc || "Pendiente de cotejo"}</u> y CURP <u>{candidateCurp || "Pendiente de cotejo"}</u>, manifestando contar con la plena capacidad, experiencia y aptitudes técnicas para desempeñar las funciones encomendadas bajo subordinación y apego a la ley.
              </p>
            </div>

            {/* Cláusulas LFT */}
            <div className="space-y-3 pt-2">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-primary">
                CLÁUSULAS
              </h4>

              <div className="space-y-1.5">
                <p>
                  <strong>PRIMERA (PUESTO Y FUNCIONES):</strong> EL TRABAJADOR se obliga a prestar sus servicios personales y subordinados para el puesto de <strong>{contract.jobTitle}</strong> en el departamento o área de <strong>{contract.department}</strong>, realizando las funciones inherentes al cargo con la debida diligencia.
                </p>
              </div>

              <div className="space-y-1.5">
                <p>
                  <strong>SEGUNDA (VIGENCIA Y TEMPORALIDAD):</strong> El presente contrato surte efectos legales a partir del <strong>{contract.startDate}</strong> {contract.endDate ? `y tendrá vigencia determinada hasta el ${contract.endDate}` : "por tiempo indeterminado"}. Las partes convienen que no podrá ser modificado ni revocado salvo por acuerdo unánime o causales de rescisión contempladas en la LFT.
                </p>
              </div>

              <div className="space-y-1.5">
                <p>
                  <strong>TERCERA (JORNADA LABORAL Y DESCANSOS):</strong> La jornada de trabajo se ajustará a los máximos legales permitidos por la Ley Federal del Trabajo, disfrutando EL TRABAJADOR de por lo menos un día de descanso remunerado a la semana, preferentemente en domingo.
                </p>
              </div>

              <div className="space-y-1.5">
                <p>
                  <strong>CUARTA (SALARIO Y PERIODICIDAD DE PAGO):</strong> EL PATRÓN pagará a EL TRABAJADOR un salario bruto de <strong>${formattedSalary} MXN</strong> periódicos (equivalente a un Salario Diario estimado de ${dailySalary} MXN), pagaderos de forma <strong>{contract.paymentFrequency}</strong> mediante transferencia bancaria o el medio electrónico acordado.
                </p>
              </div>

              <div className="space-y-1.5">
                <p>
                  <strong>QUINTA (VACACIONES DIGNAS Y PRESTACIONES DE LEY):</strong> EL TRABAJADOR gozará de los derechos estipulados en la LFT, incluyendo:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Vacaciones anuales pagadas conforme a la reforma del <strong>Artículo 76 de la Ley Federal del Trabajo (Vacaciones Dignas)</strong>.</li>
                  <li>Prima vacacional legal de al menos el <strong>25%</strong> sobre los salarios devengados durante el periodo vacacional.</li>
                  <li>Aguinaldo anual equivalente a un mínimo de <strong>15 días de salario</strong>, cubierto antes del 20 de diciembre.</li>
                  <li>Inscripción obligatoria y aportaciones de ley ante el <strong>Instituto Mexicano del Seguro Social (IMSS)</strong> y el <strong>INFONAVIT</strong>.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <p>
                  <strong>SEXTA (CONFIDENCIALIDAD Y LEALTAD):</strong> EL TRABAJADOR se compromete a guardar estricta reserva y secreto profesional respecto a información confidencial, clientes, procesos y secretos industriales a los que tenga acceso durante y con motivo de la prestación de sus servicios.
                </p>
              </div>
            </div>

            {/* Firmas Electrónicas */}
            <div className="pt-6 border-t border-border/40">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-primary text-center mb-4">
                FIRMAS ELECTRÓNICAS Y VALIDEZ DIGITAL (NOM-151 / LFT)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patrón */}
                <div className="p-4 rounded-xl border border-border/60 bg-background text-center space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Por El Patrón / Empresa
                  </span>

                  {contract.companySigned ? (
                    <div className="space-y-1.5">
                      {contract.companySignatureUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={contract.companySignatureUrl}
                          alt="Firma Patrón"
                          className="h-12 mx-auto object-contain"
                        />
                      ) : (
                        <div className="h-12 flex items-center justify-center font-serif text-sm italic text-foreground">
                          {contract.companyLegalRep || contract.companyName || "Firma Electrónica Autorizada"}
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="size-3" />
                        <span>Sello Patronal Verificado</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Certificado emitido vía plataforma K&apos;anPro
                      </span>
                    </div>
                  ) : (
                    <div className="py-3 space-y-1">
                      <p className="text-[11px] text-muted-foreground">Firma de empresa pendiente</p>
                    </div>
                  )}
                  <p className="text-xs font-bold text-foreground pt-1 border-t border-border/30">
                    {contract.companyLegalRep || contract.companyName || "Representante Patronal"}
                  </p>
                </div>

                {/* Trabajador */}
                <div className="p-4 rounded-xl border border-border/60 bg-background text-center space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Por El Trabajador
                  </span>

                  {isSigned ? (
                    <div className="space-y-1.5">
                      {effectiveEmployeeSig ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={effectiveEmployeeSig}
                          alt="Firma Trabajador"
                          className="h-12 mx-auto object-contain"
                        />
                      ) : (
                        <div className="h-12 flex items-center justify-center font-serif text-sm italic text-foreground">
                          {candidateName}
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="size-3" />
                        <span>Firma del Trabajador Verificada</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Estampada electrónicamente con validez legal LFT
                      </span>
                    </div>
                  ) : (
                    <div className="py-2 space-y-2">
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                        Pendiente de tu firma
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setIsSigningOpen(true)}
                        disabled={isSubmitting}
                        className="h-8 rounded-lg text-xs font-bold bg-primary text-primary-foreground cursor-pointer shadow-xs"
                      >
                        <PenTool className="size-3 mr-1" />
                        Estampar mi Firma
                      </Button>
                    </div>
                  )}
                  <p className="text-xs font-bold text-foreground pt-1 border-t border-border/30">
                    {candidateName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Interactive Signature Canvas Modal */}
      <DigitalSignatureModal
        isOpen={isSigningOpen}
        onOpenChange={setIsSigningOpen}
        signerName={candidateName}
        signerRole="trabajador"
        contractFolio={contract.folio}
        onSignComplete={handleSignCompleted}
      />
    </>
  );
}
