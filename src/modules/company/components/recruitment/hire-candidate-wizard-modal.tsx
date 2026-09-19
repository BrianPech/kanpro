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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ContractTemplateType, EmploymentContract } from "../../types/contracts";
import { DigitalSignatureModal } from "../contracts/digital-signature-modal";
import { hireCandidateAction } from "../../actions/employees";

interface ApplicantCandidate {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  vacancyTitle?: string;
  vacancyId?: string;
  candidateId?: string;
}

interface HireCandidateWizardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: ApplicantCandidate | null;
  onHiringCompleted: (hiredData: {
    employeeId: string;
    employeeName: string;
    jobTitle: string;
    contractFolio: string;
  }) => void;
}

export function HireCandidateWizardModal({
  isOpen,
  onOpenChange,
  candidate,
  onHiringCompleted,
}: HireCandidateWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Conditions
  const [jobTitle, setJobTitle] = useState(candidate?.vacancyTitle || "Colaborador K'anPro");
  const [department, setDepartment] = useState("Operaciones");
  const [templateType, setTemplateType] = useState<ContractTemplateType>("indeterminado");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [salary, setSalary] = useState("16500");
  const [paymentFrequency, setPaymentFrequency] = useState("quincenal");

  // Step 2: Digital Sign
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [companySignatureData, setCompanySignatureData] = useState<string | null>(null);
  const [isProcessingHire, setIsProcessingHire] = useState(false);

  if (!candidate) return null;

  const candidateName = candidate.name;
  const contractFolio = `KAN-CTR-2026-${Math.floor(100 + Math.random() * 900)}`;

  const handleNextToSign = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleCompleteHiring = async () => {
    setIsProcessingHire(true);
    try {
      const result = await hireCandidateAction({
        applicationId: candidate.id,
        candidateId: candidate.candidateId || "",
        jobTitle,
        department,
        templateType,
        startDate,
        salary: Number(salary) || 16500,
        paymentFrequency,
        contractFolio,
        signatureData: companySignatureData || undefined,
      });

      setStep(3);

      onHiringCompleted({
        employeeId: result.employeeId,
        employeeName: candidateName,
        jobTitle,
        contractFolio: result.folio,
      });

      toast.success(`¡${candidateName} ha sido contratado exitosamente!`, {
        description: `Se registró en la plantilla activa y se generó el contrato con folio ${result.folio}.`,
      });
    } catch (err: any) {
      console.error("Error al contratar candidato:", err);
      toast.error("Error al procesar la contratación", {
        description: err?.message || "Ocurrió un error al registrar al colaborador en la base de datos.",
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
                  <Label className="text-xs font-bold text-foreground">Departamento</Label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Tipo de Contrato</Label>
                  <Select
                    value={templateType}
                    onValueChange={(val) => val && setTemplateType(val as ContractTemplateType)}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
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
                  <Label className="text-xs font-bold text-foreground">Salario Mensual Bruto (MXN)</Label>
                  <Input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                    required
                  />
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
                  Se ha redactado el contrato laboral para <strong>{candidateName}</strong> como <strong>{jobTitle}</strong> con un sueldo de <strong>${parseFloat(salary || "0").toLocaleString()} MXN</strong> mensuales a partir del <strong>{startDate}</strong>.
                </p>
              </div>

              {/* Company Signature Card */}
              <div className="p-4 rounded-2xl border border-border/60 bg-background space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-primary" />
                    Firma de la Empresa (Representante Legal)
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
                      SHA256:0x4f8b91a2e37c
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
                  ¡Colaborador Dado de Alta Exitosamente!
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
        signerName="Lic. Andrea Garza Ramos"
        signerRole="representante_legal"
        contractFolio={contractFolio}
        onSignComplete={(sig) => {
          setCompanySignatureData(sig.signatureDataUrl);
        }}
      />
    </>
  );
}
