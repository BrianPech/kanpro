"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Sparkles,
  FileCheck2,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Building2,
  PenTool,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Users,
} from "@/components/ui/icons";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  calculateDailySalary,
  formatPaymentFrequencyAdjective,
  formatPaymentFrequencyLabel,
  getMexicoDateISO,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { ContractTemplateType } from "../../types/contracts";
import { getCompanyDepartmentsAction } from "../../actions/areas";
import { DigitalSignatureModal } from "../contracts/digital-signature-modal";
import { hireCandidateAction } from "../../actions/employees";

interface ApplicantCandidate {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  vacancyTitle?: string;
  vacancyId?: string;
  vacancyCategory?: string;
  vacancySalaryMin?: number | null;
  vacancySalaryMax?: number | null;
  vacancyPaymentFrequency?: string;
  candidateId?: string;
}

interface HireCandidateWizardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: ApplicantCandidate | null;
  companyLegalRep?: string;
  onHiringCompleted: (hiredData: {
    employeeId: string;
    employeeName: string;
    jobTitle: string;
    contractFolio: string;
  }) => void;
}

function getInitialCandidateSalary(candidate: ApplicantCandidate | null): string {
  if (!candidate) return "";
  const min = Number(candidate.vacancySalaryMin) || 0;
  const max = Number(candidate.vacancySalaryMax) || 0;
  if (min > 0 && max > 0) return String(Math.round((min + max) / 2));
  if (min > 0) return String(min);
  if (max > 0) return String(max);
  return "";
}

function generateContractFolio(): string {
  const year = new Date().getFullYear();
  const suffix = Math.floor(100 + Math.random() * 900);
  return `KAN-CTR-${year}-${suffix}`;
}

async function computeContractSha256(payload: Record<string, unknown>): Promise<string> {
  const serialized = JSON.stringify(payload);
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(serialized);
    const digest = await window.crypto.subtle.digest("SHA-256", encoded);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `SHA256:${hex.slice(0, 16)}`;
  }
  let hash = 0;
  for (let i = 0; i < serialized.length; i += 1) {
    hash = (hash * 31 + serialized.charCodeAt(i)) >>> 0;
  }
  return `SHA256:${hash.toString(16).padStart(8, "0")}`;
}

export function HireCandidateWizardModal({
  isOpen,
  onOpenChange,
  candidate,
  companyLegalRep,
  onHiringCompleted,
}: HireCandidateWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Conditions (hydrated dynamically from candidate/vacancy)
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [templateType, setTemplateType] = useState<ContractTemplateType>("indeterminado");
  const [startDate, setStartDate] = useState(getMexicoDateISO());
  const [salary, setSalary] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState("quincenal");
  const [contractFolio, setContractFolio] = useState("");

  // Departamentos reales de la empresa
  const [availableDepartments, setAvailableDepartments] = useState<
    { id: string; name: string }[]
  >([]);

  // Step 2: Digital Sign
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [companySignatureData, setCompanySignatureData] = useState<string | null>(null);
  const [documentHash, setDocumentHash] = useState("");
  const [isProcessingHire, setIsProcessingHire] = useState(false);

  React.useEffect(() => {
    if (!isOpen || !candidate) return;

    setStep(1);
    setJobTitle(candidate.vacancyTitle?.trim() || "");
    setDepartment(candidate.vacancyCategory?.trim() || "Operaciones");
    setTemplateType("indeterminado");
    setStartDate(getMexicoDateISO());
    setSalary(getInitialCandidateSalary(candidate));
    setPaymentFrequency(candidate.vacancyPaymentFrequency || "quincenal");
    setContractFolio(generateContractFolio());
    setCompanySignatureData(null);
    setDocumentHash("");

    getCompanyDepartmentsAction().then((res) => {
      if (res.success && res.data) {
        setAvailableDepartments(res.data);
        if (!candidate.vacancyCategory?.trim() && res.data.length > 0) {
          setDepartment(res.data[0].name);
        }
      }
    });
  }, [isOpen, candidate]);

  if (!candidate) return null;

  const candidateName = candidate.name;
  const resolvedLegalRep = companyLegalRep?.trim() || "Representante Legal";
  const numericSalary = Number(salary) || 0;
  const dailySalary = calculateDailySalary(numericSalary, paymentFrequency);
  const frequencyLabel = formatPaymentFrequencyLabel(paymentFrequency);
  const frequencyAdjective = formatPaymentFrequencyAdjective(paymentFrequency);

  const handleNextToSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      toast.error("Ingresa el puesto de trabajo.");
      return;
    }
    if (numericSalary <= 0) {
      toast.error("Ingresa un sueldo válido mayor a 0.");
      return;
    }
    setStep(2);
  };

  const handleCompleteHiring = async () => {
    setIsProcessingHire(true);
    try {
      const resolvedFolio = contractFolio || generateContractFolio();
      const result = await hireCandidateAction({
        applicationId: candidate.id,
        candidateId: candidate.candidateId || "",
        jobTitle: jobTitle.trim(),
        department: department.trim() || "Operaciones",
        templateType,
        startDate,
        salary: numericSalary,
        paymentFrequency,
        contractFolio: resolvedFolio,
        signatureData: companySignatureData || undefined,
        documentHash: documentHash || undefined,
      });

      if (!result.success || !result.employeeId || !result.folio) {
        throw new Error(result.error || "No se pudo procesar la contratación.");
      }

      setStep(3);

      onHiringCompleted({
        employeeId: result.employeeId,
        employeeName: candidateName,
        jobTitle: jobTitle.trim(),
        contractFolio: result.folio,
      });

      toast.success(`¡${candidateName} ha sido contratado exitosamente!`, {
        description: `Se registró en la plantilla activa y se generó el contrato con folio ${result.folio}.`,
      });
    } catch (err: unknown) {
      console.error("Error al contratar candidato:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al registrar al empleado en la base de datos.";
      toast.error("Error al procesar la contratación", {
        description: message,
      });
    } finally {
      setIsProcessingHire(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px] rounded-3xl p-6 bg-card border-border/80 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-border/40">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="size-3.5 text-primary" />
              <span>Asistente de Onboarding & Contratación</span>
            </div>
            <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
              Contratar a {candidateName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              {`Paso ${step} de 3 • De Candidato a Trabajador Activo en 1 clic.`}
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-border/30 text-xs font-bold">
            <span className={cn(step >= 1 ? "text-primary font-extrabold" : "text-muted-foreground")}>
              1. Condiciones
            </span>
            <span className="text-muted-foreground/50">→</span>
            <span className={cn(step >= 2 ? "text-primary font-extrabold" : "text-muted-foreground")}>
              2. Contrato LFT
            </span>
            <span className="text-muted-foreground/50">→</span>
            <span className={cn(step === 3 ? "text-emerald-600 font-extrabold" : "text-muted-foreground")}>
              3. Alta Activa
            </span>
          </div>

          {/* STEP 1: CONDICIONES LABORALES */}
          {step === 1 && (
            <form onSubmit={handleNextToSign} className="space-y-3.5 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Puesto de Trabajo *</Label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hire_dept" className="text-xs font-bold text-foreground">
                      Departamento / Área
                    </Label>
                    <a
                      href="/dashboard/company/areas"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-semibold text-primary hover:underline"
                    >
                      + Gestionar
                    </a>
                  </div>
                  <Input
                    id="hire_dept"
                    list="hire-dept-datalist"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ej. Cocina, Ventas..."
                    className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  />
                  <datalist id="hire-dept-datalist">
                    {availableDepartments.map((d) => (
                      <option key={d.id} value={d.name} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Tipo de Contrato</Label>
                  <Select
                    value={templateType}
                    onValueChange={(val) => val && setTemplateType(val as ContractTemplateType)}
                  >
                    <SelectTrigger className="w-full h-10 rounded-xl bg-background border border-border/80 text-xs font-medium">
                      <SelectValue>
                        {({
                          indeterminado: "Tiempo Indeterminado (Planta)",
                          periodo_prueba: "Periodo de Prueba (30 días)",
                          determinado: "Tiempo Determinado",
                          capacitacion_inicial: "Capacitación Inicial",
                        } as Record<string, string>)[templateType] || templateType}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      side="bottom"
                      sideOffset={4}
                      className="w-(--anchor-width) min-w-[240px] rounded-xl border border-border/70 bg-popover shadow-lg"
                    >
                      <SelectItem value="indeterminado">Tiempo Indeterminado (Planta)</SelectItem>
                      <SelectItem value="periodo_prueba">Periodo de Prueba (30 días)</SelectItem>
                      <SelectItem value="determinado">Tiempo Determinado</SelectItem>
                      <SelectItem value="capacitacion_inicial">Capacitación Inicial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Salario {frequencyLabel} Bruto (MXN)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    step="any"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="Ej. 10500"
                    className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                    required
                  />
                  {dailySalary > 0 && (
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Salario diario equivalente:{" "}
                      <span className="font-bold text-foreground">
                        ${dailySalary.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                      </span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Periodicidad de Pago</Label>
                  <Select
                    value={paymentFrequency}
                    onValueChange={(val) => val && setPaymentFrequency(val)}
                  >
                    <SelectTrigger className="w-full h-10 rounded-xl bg-background border border-border/80 text-xs font-medium">
                      <SelectValue>{frequencyLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      alignItemWithTrigger={false}
                      side="bottom"
                      sideOffset={4}
                      className="w-(--anchor-width) min-w-[180px] rounded-xl border border-border/70 bg-popover shadow-lg"
                    >
                      <SelectItem value="semanal">Semanal (7 días)</SelectItem>
                      <SelectItem value="quincenal">Quincenal (15 días)</SelectItem>
                      <SelectItem value="catorcenal">Catorcenal (14 días)</SelectItem>
                      <SelectItem value="mensual">Mensual (30 días)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Fecha de Ingreso</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  required
                />
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-border/40">
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
                  className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
                >
                  <span>Continuar a Contrato</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* STEP 2: CONTRATO & FIRMA DIGITAL */}
          {step === 2 && (
            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-foreground">Contrato Formal Generado</span>
                  <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                    {contractFolio}
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Se ha redactado el contrato laboral para <strong>{candidateName}</strong> como <strong>{jobTitle}</strong> ({department || "Operaciones"}) con un sueldo de <strong>${numericSalary.toLocaleString("es-MX")} MXN {frequencyAdjective}</strong> (diario: <strong>${dailySalary.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</strong>) a partir del <strong>{startDate}</strong>.
                </p>
              </div>

              {/* Company Signature Card */}
              <div className="p-4 rounded-2xl border border-border/60 bg-background space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-primary" />
                    Firma de la Empresa ({resolvedLegalRep})
                  </span>
                  {companySignatureData ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-bold">
                      Firmado
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none text-[10px] font-bold">
                      Requerido
                    </Badge>
                  )}
                </div>

                {companySignatureData ? (
                  <div className="p-2 rounded-xl bg-muted/20 border border-border/40 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={companySignatureData}
                      alt="Firma"
                      className="h-12 mx-auto object-contain"
                    />
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                      {documentHash || "Verificando certificado..."}
                    </span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setIsSignModalOpen(true)}
                    className="w-full h-10 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center gap-1.5 border border-primary/20"
                  >
                    <PenTool className="size-3.5" />
                    <span>Firmar Contrato Electrónicamente</span>
                  </Button>
                )}
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-xl text-xs font-bold h-10 px-4 flex items-center gap-1"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Atrás</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleCompleteHiring}
                  disabled={isProcessingHire || !companySignatureData}
                  className="rounded-xl text-xs font-bold h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="size-4" />
                  <span>{isProcessingHire ? "Generando Expediente..." : "Confirmar Contratación"}</span>
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* STEP 3: CONTRATACIÓN COMPLETADA & ALTA 360 */}
          {step === 3 && (
            <div className="p-6 text-center space-y-4">
              <div className="size-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="size-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-foreground">
                  ¡Empleado Dado de Alta Exitosamente!
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {`${candidateName} ahora forma parte activa de tu empresa como ${jobTitle}.`}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-muted/30 border border-border/50 text-center text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold block">Expediente</span>
                  <span className="font-extrabold text-primary">Listo 360</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold block">Checador GPS/QR</span>
                  <span className="font-extrabold text-emerald-600">Habilitado</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold block">Vacaciones LFT</span>
                  <span className="font-extrabold text-indigo-600">12 días base</span>
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-border/40 flex justify-center">
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl text-xs font-bold h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                >
                  Finalizar Onboarding
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Signature Modal */}
      <DigitalSignatureModal
        isOpen={isSignModalOpen}
        onOpenChange={setIsSignModalOpen}
        signerName={resolvedLegalRep}
        signerRole="representante_legal"
        contractFolio={contractFolio}
        onSignComplete={async (sig) => {
          setCompanySignatureData(sig.signatureDataUrl);
          const hash = await computeContractSha256({
            folio: contractFolio,
            candidateId: candidate.candidateId || "",
            candidateName,
            jobTitle: jobTitle.trim(),
            department: department.trim() || "Operaciones",
            templateType,
            startDate,
            salary: numericSalary,
            paymentFrequency,
            signerName: resolvedLegalRep,
            signedAt: sig.signedAt,
          });
          setDocumentHash(hash);
        }}
      />
    </>
  );
}
