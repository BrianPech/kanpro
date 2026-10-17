"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  ShieldCheck,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
  Loader2,
  Save,
  Send,
  FileCheck,
  Lock,
  ExternalLink,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from "@/components/ui/alert";
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
} from "@/components/ui/dialog";
import {
  CompanyDocType,
  CompanyVerificationData,
  CompanyVerificationDoc,
  companyVerificationService,
} from "../services/company-verification";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CompanyVerificationViewProps {
  userId: string;
  initialData: CompanyVerificationData;
}

const FISCAL_REGIME_LABELS: Record<string, string> = {
  persona_moral: "Persona Moral (Sociedades / Empresas - RFC de 12 dígitos)",
  persona_fisica: "Persona Física con Actividad Empresarial (RFC de 13 dígitos)",
};

const INDUSTRY_OPTIONS = [
  "Hotelería, Turismo y Gastronomía",
  "Comercio y Retail",
  "Construcción e Inmobiliaria",
  "Servicios de Seguridad y Limpieza",
  "Tecnología & Software",
  "Salud & Bienestar",
  "Finanzas & Banca",
  "Educación & Capacitación",
  "Transporte & Logística",
  "Otro Sector Económico",
];

export function CompanyVerificationView({
  userId,
  initialData,
}: CompanyVerificationViewProps) {
  const [fiscalRegime, setFiscalRegime] = React.useState<"persona_moral" | "persona_fisica">(
    initialData.fiscal_regime || initialData.entity_type || "persona_moral"
  );
  const [legalName, setLegalName] = React.useState(initialData.legal_name || "");
  const [companyName, setCompanyName] = React.useState(initialData.company_name || "");
  const [rfc, setRfc] = React.useState(initialData.rfc || "");
  const [fiscalAddress, setFiscalAddress] = React.useState(initialData.fiscal_address || "");
  const [industry, setIndustry] = React.useState(initialData.industry || "");
  const [legalRepName, setLegalRepName] = React.useState(initialData.legal_rep_name || "");
  const [corporateEmail, setCorporateEmail] = React.useState(initialData.corporate_email || "");
  const [contactPhone, setContactPhone] = React.useState(initialData.contact_phone || "");
  const [termsAccepted, setTermsAccepted] = React.useState(initialData.terms_accepted || false);

  // Status & Documents State
  const [verificationStatus, setVerificationStatus] = React.useState<
    "pending" | "approved" | "rejected" | "unsubmitted"
  >(initialData.verification_status || "unsubmitted");

  const [documents, setDocuments] = React.useState<
    Record<CompanyDocType, CompanyVerificationDoc | null>
  >(initialData.documents);

  // Loading States
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadingDocType, setUploadingDocType] = React.useState<CompanyDocType | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);

  // Modal State
  const [previewDoc, setPreviewDoc] = React.useState<{
    title: string;
    url: string;
    fileName: string;
  } | null>(null);

  const isPendingReview = verificationStatus === "pending";
  const isApproved = verificationStatus === "approved";
  const isLocked = isPendingReview || isApproved;
  const isReadOnly = isLocked;

  const isRfcValid = React.useMemo(() => {
    const cleaned = rfc.trim().toUpperCase();
    if (fiscalRegime === "persona_moral") {
      return cleaned.length === 12 && /^[A-Z&Ñ]{3}\d{6}[A-Z0-9]{3}$/.test(cleaned);
    } else {
      return cleaned.length === 13 && /^[A-Z&Ñ]{4}\d{6}[A-Z0-9]{3}$/.test(cleaned);
    }
  }, [rfc, fiscalRegime]);

  // Calculate Progress (13 mandatory items)
  const itemsChecklist = [
    { label: "1. Denominación / Razón social", isComplete: !!legalName.trim() },
    { label: "2. Acta constitutiva", isComplete: !!documents.acta_constitutiva },
    { label: `3. RFC (${fiscalRegime === "persona_moral" ? "12" : "13"} caract.)`, isComplete: isRfcValid },
    { label: "4. Constancia Situación Fiscal", isComplete: !!documents.constancia_situacion_fiscal },
    { label: "5. Domicilio fiscal completo", isComplete: !!fiscalAddress.trim() },
    { label: "6. Nombre comercial", isComplete: !!companyName.trim() },
    { label: "7. Giro económico", isComplete: !!industry.trim() },
    { label: "8. Nombre del rep. legal", isComplete: !!legalRepName.trim() },
    { label: "9. Identificación rep. legal", isComplete: !!documents.legal_rep_id },
    { label: "10. Poder Notarial", isComplete: !!documents.legal_power },
    { label: "11. Correo corporativo", isComplete: !!corporateEmail.trim() },
    { label: "12. Teléfono de contacto", isComplete: !!contactPhone.trim() },
    { label: "13. Términos y Privacidad", isComplete: termsAccepted },
  ];

  const completedCount = itemsChecklist.filter((item) => item.isComplete).length;
  const totalCount = itemsChecklist.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // File Upload Handler
  const handleFileUpload = async (docType: CompanyDocType, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Archivo demasiado grande", {
        description: "El tamaño máximo permitido es de 10 MB.",
      });
      return;
    }

    setUploadingDocType(docType);
    try {
      const uploadedDoc = await companyVerificationService.uploadDocument(
        userId,
        docType,
        file
      );

      setDocuments((prev) => ({
        ...prev,
        [docType]: uploadedDoc,
      }));

      toast.success("Documento cargado correctamente", {
        description: `Se registró ${uploadedDoc.file_name} en tu expediente digital.`,
      });
    } catch (err: unknown) {
      console.error("Error uploading doc:", err);
      const msg = err instanceof Error ? err.message : "Inténtalo de nuevo o verifica tu archivo.";
      toast.error("Error al subir el documento", {
        description: msg,
      });
    } finally {
      setUploadingDocType(null);
    }
  };

  // File Delete Handler
  const handleDeleteDoc = async (docType: CompanyDocType) => {
    if (isReadOnly) {
      toast.warning("Expediente bloqueado", {
        description: "No puedes eliminar documentos mientras el expediente está en revisión o validado.",
      });
      return;
    }

    const targetDoc = documents[docType];
    try {
      await companyVerificationService.deleteDocument(
        userId,
        docType,
        targetDoc?.id
      );

      setDocuments((prev) => ({
        ...prev,
        [docType]: null,
      }));

      toast.info("Documento eliminado", {
        description: "El archivo se ha removido de tu expediente digital.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo remover el archivo.";
      toast.error("Error al eliminar documento", {
        description: msg,
      });
    }
  };

  // Preview Handler with Signed URL
  const handlePreviewDoc = async (title: string, doc: CompanyVerificationDoc) => {
    setIsLoadingPreview(true);
    try {
      const signedUrl = await companyVerificationService.getSignedDocumentUrl(doc.file_url);
      if (!signedUrl) {
        toast.error("Error al generar vista previa", {
          description: "No se pudo obtener el enlace seguro de acceso al documento.",
        });
        return;
      }
      setPreviewDoc({
        title,
        url: signedUrl,
        fileName: doc.file_name,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Inténtalo de nuevo más tarde.";
      toast.error("Error al cargar vista previa", {
        description: msg,
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Unlock dossier for editing if user wishes to update before audit completes
  const handleUnlockForEdit = async () => {
    setIsSaving(true);
    try {
      await companyVerificationService.unlockForEditing(userId);
      setVerificationStatus("unsubmitted");
      toast.info("Expediente habilitado para edición", {
        description: "Ahora puedes actualizar o corregir tus datos fiscales y documentos antes de volver a enviarlo a revisión.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo cambiar el estado del expediente.";
      toast.error("Error al desbloquear expediente", {
        description: msg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save Draft Handler
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await companyVerificationService.saveVerificationData(
        userId,
        {
          legal_name: legalName,
          company_name: companyName,
          rfc: rfc.toUpperCase().trim(),
          fiscal_address: fiscalAddress,
          industry,
          legal_rep_name: legalRepName,
          corporate_email: corporateEmail,
          contact_phone: contactPhone,
          fiscal_regime: fiscalRegime,
          entity_type: fiscalRegime,
          terms_accepted: termsAccepted,
        },
        false
      );

      toast.success("Avance guardado en borrador", {
        description: "Puedes continuar completando tu expediente en cualquier momento.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocurrió un error al actualizar los datos.";
      toast.error("Error al guardar borrador", {
        description: msg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Submit for Verification Handler
  const handleSubmitVerification = async () => {
    if (completedCount < totalCount) {
      const missingItems = itemsChecklist
        .filter((item) => !item.isComplete)
        .map((item) => item.label);

      toast.error("Requisitos incompletos", {
        description: `Debes completar los 13 puntos obligatorios. Pendientes: ${missingItems.slice(0, 3).join(", ")}${missingItems.length > 3 ? "..." : ""}`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await companyVerificationService.saveVerificationData(
        userId,
        {
          legal_name: legalName,
          company_name: companyName,
          rfc: rfc.toUpperCase().trim(),
          fiscal_address: fiscalAddress,
          industry,
          legal_rep_name: legalRepName,
          corporate_email: corporateEmail,
          contact_phone: contactPhone,
          fiscal_regime: fiscalRegime,
          entity_type: fiscalRegime,
          terms_accepted: termsAccepted,
        },
        true
      );

      setVerificationStatus("pending");
      toast.success("¡Expediente enviado a revisión!", {
        description:
          "El equipo legal de K'anPro revisará tus documentos corporativos. Te notificaremos una vez validados.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo procesar la verificación.";
      toast.error("Error al enviar solicitud", {
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 w-full font-sans"
    >
      {/* ========================================================================= */}
      {/* 1. SHADCN ALERT: ESTADO GLOBAL DEL EXPEDIENTE                             */}
      {/* ========================================================================= */}
      {verificationStatus === "approved" && (
        <Alert className="rounded-2xl border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 p-4 sm:p-5 shadow-2xs">
          <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-0.5">
            <AlertTitle className="text-sm font-extrabold">
              ¡Empresa Verificada Oficialmente!
            </AlertTitle>
            <AlertDescription className="text-xs text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
              Tu expediente legal ha sido auditado y aprobado. Tus vacantes cuentan con la insignia de confianza corporativa activa en K&apos;anPro.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {verificationStatus === "pending" && (
        <Alert className="rounded-2xl border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 p-4 sm:p-5 shadow-2xs">
          <Clock className="size-5 text-amber-600 dark:text-amber-400 animate-pulse" />
          <div className="space-y-0.5">
            <AlertTitle className="text-sm font-extrabold">
              Expediente Digital en Auditoría
            </AlertTitle>
            <AlertDescription className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
              El equipo legal está revisando tus documentos corporativos. Si necesitas realizar ajustes o correcciones, puedes habilitar la edición de tu expediente.
            </AlertDescription>
          </div>
          <AlertAction className="static sm:absolute sm:top-4 sm:right-4 mt-3 sm:mt-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleUnlockForEdit}
              disabled={isSaving || isSubmitting}
              className="h-9 px-3.5 rounded-xl text-xs font-bold border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="size-3.5" />
              <span>Editar Expediente</span>
            </Button>
          </AlertAction>
        </Alert>
      )}

      {verificationStatus === "rejected" && (
        <Alert variant="destructive" className="rounded-2xl p-4 sm:p-5 shadow-2xs">
          <AlertCircle className="size-5" />
          <div className="space-y-0.5">
            <AlertTitle className="text-sm font-extrabold">
              Acción Requerida en tu Expediente
            </AlertTitle>
            <AlertDescription className="text-xs leading-relaxed">
              Algunos documentos o datos requieren corrección. Por favor revisa los campos señalados y vuelve a enviar tu expediente.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {verificationStatus === "unsubmitted" && (
        <Alert className="rounded-2xl border border-border/80 bg-muted/40 p-4 sm:p-5 shadow-2xs">
          <Building2 className="size-5 text-primary" />
          <div className="space-y-0.5">
            <AlertTitle className="text-sm font-bold text-foreground">
              Verificación Legal de Cuenta (Persona Moral / Física)
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
              Completa los 13 requisitos legales obligatorios y adjunta los documentos oficiales en PDF para obtener la insignia de confianza.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* ========================================================================= */}
      {/* 2. CARD PRINCIPAL UNIFICADA (HEADER + CONTENT + FOOTER)                   */}
      {/* ========================================================================= */}
      <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        
        {/* ---------------- CARD HEADER: TÍTULO, BADGE Y BARRA DE PROGRESO -------- */}
        <CardHeader className="p-5 sm:p-6 md:p-8 border-b border-border/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                  <FileCheck className="size-5 text-primary" />
                  Expediente de Validación Corporativa
                </h2>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 font-bold px-2.5 py-0.5 rounded-full text-[10px]"
                >
                  🔒 Confidencial SAT / K&apos;anPro
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Información legal requerida por la normativa laboral para otorgar el distintivo de empresa verificada.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border/60">
                {completedCount} de {totalCount} ({progressPercent}%)
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 pt-1">
            <Progress value={progressPercent} className="h-2 bg-muted/60 rounded-full" />
            
            {/* Dynamic 13-item Mini Checklist Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 pt-2">
              {itemsChecklist.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-semibold truncate transition-colors",
                    item.isComplete
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted/30 border-border/40 text-muted-foreground"
                  )}
                  title={item.label}
                >
                  {item.isComplete ? (
                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <span className="size-3.5 rounded-full border border-border/60 flex items-center justify-center text-[8px] text-muted-foreground shrink-0 font-bold">
                      {index + 1}
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>

        {/* ---------------- CARD CONTENT: ORGANIZED SECTIONS ---------------- */}
        <CardContent className="p-5 sm:p-6 md:p-8 space-y-8 divide-y divide-border/60">
          
          {/* SECCIÓN 1: DATOS FISCALES Y DE IDENTIDAD */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  Sección 1: Datos Fiscales y de Identidad Corporativa
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Información oficial registrada ante el Servicio de Administración Tributaria (SAT).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* Régimen Fiscal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>Régimen Fiscal</span>
                  <span className="text-destructive">*</span>
                </label>
                <Select
                  value={fiscalRegime}
                  onValueChange={(val) => {
                    if (val === "persona_moral" || val === "persona_fisica") {
                      setFiscalRegime(val);
                      if (val === "persona_moral" && rfc.length > 12) {
                        setRfc(rfc.substring(0, 12));
                      }
                    }
                  }}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl bg-input/40 border border-border/80 px-3.5 text-xs sm:text-sm font-semibold focus-visible:bg-background cursor-pointer">
                    <SelectValue placeholder="Selecciona el régimen">
                      {(val: string | null) => (val && FISCAL_REGIME_LABELS[val]) || val || "Selecciona el régimen"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/80 bg-popover text-xs font-semibold">
                    <SelectItem value="persona_moral">
                      Persona Moral (Empresa / Sociedad - RFC 12 dígitos)
                    </SelectItem>
                    <SelectItem value="persona_fisica">
                      Persona Física con Actividad Empresarial (RFC 13 dígitos)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 1. Denominación o Razón Social */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>1. Denominación / Razón Social</span>
                  <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Ej. Operadora Turística Maya S.A. de C.V."
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    disabled={isReadOnly}
                    className="h-11 rounded-xl bg-input/40 border border-border/80 pl-10 text-xs sm:text-sm font-semibold focus-visible:bg-background"
                  />
                </div>
              </div>

              {/* 6. Nombre Comercial */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>6. Nombre Comercial de la Marca</span>
                  <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Ej. Hotel Riviera Maya"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isReadOnly}
                    className="h-11 rounded-xl bg-input/40 border border-border/80 pl-10 text-xs sm:text-sm font-semibold focus-visible:bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* 3. RFC */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>3. RFC Fiscal</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-bold">
                    {fiscalRegime === "persona_moral" ? "12 Caracteres" : "13 Caracteres"}
                  </span>
                </div>
                <div className="relative">
                  <FileCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder={fiscalRegime === "persona_moral" ? "OHR120315ABC" : "GARM850612ABC"}
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase().replace(/[^A-Z0-9&Ñ]/g, ""))}
                    maxLength={fiscalRegime === "persona_moral" ? 12 : 13}
                    disabled={isReadOnly}
                    className={cn(
                      "h-11 rounded-xl bg-input/40 border border-border/80 pl-10 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider focus-visible:bg-background",
                      rfc.trim().length > 0 && !isRfcValid && "border-destructive text-destructive"
                    )}
                  />
                </div>
                {rfc.trim().length > 0 && !isRfcValid && (
                  <p className="text-[11px] text-destructive font-semibold">
                    RFC inválido ({fiscalRegime === "persona_moral" ? "12 caracteres para Persona Moral" : "13 caracteres para Persona Física"}).
                  </p>
                )}
              </div>

              {/* 7. Giro o Actividad Económica */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>7. Giro / Actividad Económica</span>
                  <span className="text-destructive">*</span>
                </label>
                <Select
                  value={industry}
                  onValueChange={(val) => setIndustry(val || "")}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl bg-input/40 border border-border/80 px-3.5 text-xs sm:text-sm font-semibold focus-visible:bg-background cursor-pointer">
                    <SelectValue placeholder="Selecciona el sector" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/80 bg-popover text-xs font-semibold">
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 8. Representante Legal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>8. Representante Legal</span>
                  <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Nombre y Apellidos completos"
                    value={legalRepName}
                    onChange={(e) => setLegalRepName(e.target.value)}
                    disabled={isReadOnly}
                    className="h-11 rounded-xl bg-input/40 border border-border/80 pl-10 text-xs sm:text-sm font-semibold focus-visible:bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* 5. Domicilio Fiscal */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>5. Domicilio Fiscal Completo</span>
                  <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Calle, Número, Colonia, C.P., Ciudad y Estado"
                    value={fiscalAddress}
                    onChange={(e) => setFiscalAddress(e.target.value)}
                    disabled={isReadOnly}
                    className="h-11 rounded-xl bg-input/40 border border-border/80 pl-10 text-xs sm:text-sm font-semibold focus-visible:bg-background"
                  />
                </div>
              </div>

              {/* 11. Correo Electrónico Corporativo */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>11. Correo Corporativo</span>
                  <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-blue-600 dark:text-blue-400 pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={corporateEmail}
                    onChange={(e) => setCorporateEmail(e.target.value)}
                    disabled={isReadOnly}
                    className="h-11 rounded-xl bg-input/40 border border-border/80 pl-10 text-xs sm:text-sm font-semibold focus-visible:bg-background"
                  />
                </div>
              </div>

              {/* 12. Teléfono de Contacto */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>12. Teléfono de Contacto</span>
                  <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
                  <Input
                    type="tel"
                    placeholder="+52 999 123 4567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    disabled={isReadOnly}
                    className="h-11 rounded-xl bg-input/40 border border-border/80 pl-10 text-xs sm:text-sm font-semibold focus-visible:bg-background"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DOCUMENTOS OFICIALES */}
          <div className="space-y-5 pt-6">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  Sección 2: Documentación Legal Oficial (Carga de Archivos)
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Adjunta copias escaneadas legibles en formato PDF o imagen (Máx. 10 MB por archivo).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Document 2: Acta Constitutiva */}
              <DocumentUploadCard
                title="2. Acta Constitutiva *"
                description="Copia escaneada completa y legible en PDF."
                docType="acta_constitutiva"
                doc={documents.acta_constitutiva}
                isUploading={uploadingDocType === "acta_constitutiva"}
                disabled={isLocked || isSubmitting || isSaving}
                onUpload={(file) => handleFileUpload("acta_constitutiva", file)}
                onDelete={() => handleDeleteDoc("acta_constitutiva")}
                onPreview={(doc) => handlePreviewDoc("Acta Constitutiva", doc)}
              />

              {/* Document 4: Constancia de Situación Fiscal */}
              <DocumentUploadCard
                title="4. Constancia de Situación Fiscal *"
                description="Emitida por el SAT no mayor a 3 meses de antigüedad."
                docType="constancia_situacion_fiscal"
                doc={documents.constancia_situacion_fiscal}
                isUploading={uploadingDocType === "constancia_situacion_fiscal"}
                disabled={isLocked || isSubmitting || isSaving}
                onUpload={(file) => handleFileUpload("constancia_situacion_fiscal", file)}
                onDelete={() => handleDeleteDoc("constancia_situacion_fiscal")}
                onPreview={(doc) => handlePreviewDoc("Constancia de Situación Fiscal", doc)}
              />

              {/* Document 9: Identificación del Rep. Legal */}
              <DocumentUploadCard
                title="9. Identificación Oficial del Rep. Legal *"
                description="INE (frente y vuelta) o Pasaporte vigente."
                docType="legal_rep_id"
                doc={documents.legal_rep_id}
                isUploading={uploadingDocType === "legal_rep_id"}
                disabled={isLocked || isSubmitting || isSaving}
                onUpload={(file) => handleFileUpload("legal_rep_id", file)}
                onDelete={() => handleDeleteDoc("legal_rep_id")}
                onPreview={(doc) => handlePreviewDoc("Identificación Oficial del Representante Legal", doc)}
              />

              {/* Document 10: Poder Notarial / Rep. Legal */}
              <DocumentUploadCard
                title="10. Acreditación de Representación Legal *"
                description="Poder notarial con facultades de representación."
                docType="legal_power"
                doc={documents.legal_power}
                isUploading={uploadingDocType === "legal_power"}
                disabled={isLocked || isSubmitting || isSaving}
                onUpload={(file) => handleFileUpload("legal_power", file)}
                onDelete={() => handleDeleteDoc("legal_power")}
                onPreview={(doc) => handlePreviewDoc("Documento de Representación Legal / Poder Notarial", doc)}
              />
            </div>
          </div>

          {/* SECCIÓN 3: TÉRMINOS Y PRIVACIDAD */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  Sección 3: Consentimiento Legal & Privacidad
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Requisito 13: Aceptación de términos y custodia de datos corporativos.
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted/40 rounded-xl border border-border/80 flex items-start gap-3.5">
              <Checkbox
                id="terms-check"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                disabled={isLocked || isSubmitting || isSaving}
                className="mt-0.5 size-4.5 rounded-md"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="terms-check"
                  className="text-xs sm:text-sm font-bold text-foreground cursor-pointer leading-relaxed block"
                >
                  13. Manifiesto bajo protesta de decir verdad que los datos y documentos proporcionados son legítimos y acepto los Términos y Condiciones y Aviso de Privacidad de K&apos;anPro.
                </Label>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  K&apos;anPro resguarda la información fiscal y legal de manera estrictamente confidencial para fines exclusivos de validación de identidad corporativa.
                </p>
              </div>
            </div>
          </div>

        </CardContent>

        {/* ---------------- CARD FOOTER: ACTIONS ---------------- */}
        <CardFooter className="p-4 sm:p-6 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-semibold text-muted-foreground text-center sm:text-left">
            {isApproved ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="size-4 shrink-0" />
                Expediente verificado y aprobado.
              </span>
            ) : isPendingReview ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                <Clock className="size-4 shrink-0 animate-pulse" />
                Expediente enviado a revisión. Auditoría en curso.
              </span>
            ) : completedCount === totalCount ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0" />
                Expediente completo (13/13). Listo para enviar.
              </span>
            ) : (
              <span>Faltan {totalCount - completedCount} requisitos para poder enviar a revisión oficial.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving || isSubmitting || isLocked}
              className="h-10 px-4 rounded-xl text-xs font-bold border-border/80 hover:bg-muted cursor-pointer gap-1.5 shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>Guardar Borrador</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleSubmitVerification}
              disabled={isSubmitting || isSaving || completedCount < totalCount || isLocked}
              className={cn(
                "h-10 px-6 rounded-xl text-xs font-bold gap-2 shadow-sm transition-all",
                isApproved
                  ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 opacity-80 cursor-not-allowed"
                  : isPendingReview
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 opacity-80 cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Enviando Expediente...</span>
                </>
              ) : isApproved ? (
                <>
                  <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Empresa Verificada</span>
                </>
              ) : isPendingReview ? (
                <>
                  <Clock className="size-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                  <span>Expediente en Revisión</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Enviar a Revisión</span>
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* PDF PREVIEW MODAL WITH SECURE SIGNED URL */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl bg-background border border-border/80 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              {previewDoc?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              {previewDoc?.fileName}
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-muted/30 border border-border/60 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
            {previewDoc?.url && (
              <div className="w-full space-y-3">
                {previewDoc.fileName.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={previewDoc.url}
                    className="w-full h-96 rounded-xl border border-border/60 bg-white"
                    title={previewDoc.title}
                  />
                ) : (
                  <div className="flex justify-center p-2">
                    <img
                      src={previewDoc.url}
                      alt={previewDoc.title}
                      className="max-h-96 rounded-xl object-contain border border-border/60"
                    />
                  </div>
                )}

                <div className="flex justify-center gap-3 pt-2">
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-xs hover:bg-primary/90"
                  >
                    <span>Abrir en Pestaña Completa</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

interface DocumentUploadCardProps {
  title: string;
  description: string;
  docType: CompanyDocType;
  doc: CompanyVerificationDoc | null;
  isUploading: boolean;
  disabled?: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
  onPreview: (doc: CompanyVerificationDoc) => void;
}

function DocumentUploadCard({
  title,
  description,
  docType,
  doc,
  isUploading,
  disabled,
  onUpload,
  onDelete,
  onPreview,
}: DocumentUploadCardProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="p-4 bg-muted/20 border border-border/80 rounded-xl space-y-3 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-foreground">
              {title}
            </h4>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              {description}
            </p>
          </div>

          {doc ? (
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2 py-0.5 shrink-0 shadow-none">
              Cargado
            </Badge>
          ) : (
            <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-extrabold px-2 py-0.5 shrink-0 shadow-none">
              Pendiente
            </Badge>
          )}
        </div>

        {/* Existing Doc Item */}
        {doc ? (
          <div className="mt-3 p-3 bg-card border border-border/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="size-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {doc.file_name}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {doc.file_size_bytes
                    ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
                    : "Documento Adjunto"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onPreview(doc)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-muted"
                title="Ver Documento"
              >
                <Eye className="size-4" />
              </button>
              {!disabled && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="p-1.5 text-destructive hover:text-destructive/80 transition-colors cursor-pointer rounded-lg hover:bg-destructive/10"
                  title="Eliminar Documento"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Dropzone Click Box */
          <div
            onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
            className={cn(
              "mt-3 p-4 bg-background rounded-xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center space-y-1.5",
              disabled
                ? "border-border/40 bg-muted/10 opacity-60 cursor-not-allowed"
                : isUploading
                ? "border-primary bg-muted/20 cursor-wait"
                : "border-border/80 hover:border-primary cursor-pointer"
            )}
          >
            {isUploading ? (
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Subiendo documento...</span>
              </div>
            ) : (
              <>
                <UploadCloud className="size-5 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">
                  {disabled ? "Carga bloqueada en revisión" : "Seleccionar archivo PDF o imagen"}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  Formatos: .pdf, .jpg, .png (Máx. 10 MB)
                </span>
              </>
            )}

            {!disabled && (
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                }}
                className="hidden"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
