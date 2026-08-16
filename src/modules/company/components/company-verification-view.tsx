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
  Info,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  HelpCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

export function CompanyVerificationView({
  userId,
  initialData,
}: CompanyVerificationViewProps) {
  const [fiscalRegime, setFiscalRegime] = React.useState<"persona_moral" | "persona_fisica">(
    (initialData as any).fiscal_regime || (initialData as any).entity_type || "persona_moral"
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

  const isReadOnly = verificationStatus === "pending" || verificationStatus === "approved";

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
    { label: "1. Denominación o razón social", isComplete: !!legalName.trim() },
    { label: "2. Acta constitutiva", isComplete: !!documents.acta_constitutiva },
    { label: `3. RFC (${fiscalRegime === "persona_moral" ? "12" : "13"} caract.)`, isComplete: isRfcValid },
    { label: "4. Constancia de Situación Fiscal", isComplete: !!documents.constancia_situacion_fiscal },
    { label: "5. Domicilio fiscal", isComplete: !!fiscalAddress.trim() },
    { label: "6. Nombre comercial", isComplete: !!companyName.trim() },
    { label: "7. Giro o actividad económica", isComplete: !!industry.trim() },
    { label: "8. Nombre del representante legal", isComplete: !!legalRepName.trim() },
    { label: "9. Identificación oficial del representante legal", isComplete: !!documents.legal_rep_id },
    { label: "10. Documento de representación legal / Poder Notarial", isComplete: !!documents.legal_power },
    { label: "11. Correo electrónico corporativo", isComplete: !!corporateEmail.trim() },
    { label: "12. Número telefónico de contacto", isComplete: !!contactPhone.trim() },
    { label: "13. Aceptación de Términos & Aviso de Privacidad", isComplete: termsAccepted },
  ];

  const completedCount = itemsChecklist.filter((item) => item.isComplete).length;
  const totalCount = itemsChecklist.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // File Upload Handler
  const handleFileUpload = async (
    docType: CompanyDocType,
    file: File
  ) => {
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
    } catch (err: any) {
      console.error("Error uploading doc:", err);
      toast.error("Error al subir el documento", {
        description: err.message || "Inténtalo de nuevo o verifica tu archivo.",
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
    } catch (err: any) {
      toast.error("Error al eliminar documento", {
        description: err.message || "No se pudo remover el archivo.",
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
    } catch (err: any) {
      toast.error("Error al cargar vista previa", {
        description: err.message || "Inténtalo de nuevo más tarde.",
      });
    } finally {
      setIsLoadingPreview(false);
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
    } catch (err: any) {
      toast.error("Error al guardar borrador", {
        description: err.message || "Ocurrió un error al actualizar los datos.",
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
    } catch (err: any) {
      toast.error("Error al enviar solicitud", {
        description: err.message || "No se pudo procesar la verificación.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-4xl mx-auto w-full font-sans"
    >
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-[800] tracking-tight text-foreground flex items-center gap-3">
              <Building2 className="size-7 text-[#5c7c9b]" />
              Verificación Legal de Empresa
            </h1>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 font-bold px-3 py-1 rounded-full text-xs">
              🔒 Expediente Privado & Confidencial
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
            Expediente digital confidencial para validación de cuenta corporativa e insignia de confianza en K&apos;anPro.
          </p>
        </div>

        {/* Global Status Pill */}
        <div>
          {verificationStatus === "approved" && (
            <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="size-4.5 text-emerald-600 dark:text-emerald-400" />
              Empresa Verificada
            </Badge>
          )}

          {verificationStatus === "pending" && (
            <Badge className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
              <Clock className="size-4.5 text-amber-600 dark:text-amber-400" />
              Expediente en Revisión
            </Badge>
          )}

          {verificationStatus === "rejected" && (
            <Badge className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
              <AlertCircle className="size-4.5 text-rose-600 dark:text-rose-400" />
              Acción Requerida
            </Badge>
          )}

          {verificationStatus === "unsubmitted" && (
            <Badge className="bg-muted border border-border text-muted-foreground px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
              <FileText className="size-4.5 text-muted-foreground" />
              Pendiente de Envío
            </Badge>
          )}
        </div>
      </div>

      {/* STATUS BANNER CALLOUT */}
      {verificationStatus === "approved" && (
        <div className="flex items-center gap-4 p-5 rounded-[22px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="size-7 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-xs sm:text-sm font-semibold leading-relaxed">
            <span className="font-extrabold">¡Tu perfil empresarial está 100% verificado!</span> Tus ofertas laborales cuentan con la insignia de confianza corporativa activa en el Sureste.
          </div>
        </div>
      )}

      {verificationStatus === "pending" && (
        <div className="flex items-start gap-4 p-5 rounded-[22px] bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
          <Clock className="size-6 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400 animate-pulse" />
          <div className="text-xs sm:text-sm font-semibold leading-relaxed">
            <span className="font-extrabold">Tu expediente digital está siendo auditado.</span> Nuestro equipo legal está revisando los 13 requisitos corporativos. Recibirás una notificación una vez validado.
          </div>
        </div>
      )}

      {/* PROGRESS TRACKER CARD */}
      <Card className="bg-card border border-border/40 rounded-[28px] p-6 sm:p-7 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
              <FileCheck className="size-5 text-[#5c7c9b]" />
              Progreso del Expediente Legal
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Completa los 13 requisitos obligatorios para habilitar el envío oficial.
            </p>
          </div>
          <span className="text-sm font-extrabold text-foreground">
            {completedCount} de {totalCount} Requisitos ({progressPercent}%)
          </span>
        </div>

        <Progress value={progressPercent} className="h-2.5 bg-muted rounded-full" />

        {/* 13 Items Dynamic Grid Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
          {itemsChecklist.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all",
                item.isComplete
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                  : "bg-muted/30 border-border/40 text-muted-foreground"
              )}
            >
              {item.isComplete ? (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <div className="size-4 rounded-full border border-border flex items-center justify-center text-[9px] text-muted-foreground shrink-0">
                  {index + 1}
                </div>
              )}
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* SECTION 1: DATOS FISCALES Y CORPORATIVOS */}
      <Card className="bg-card border border-border/40 rounded-[28px] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-border/40">
          <div className="size-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Building2 className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              Sección 1: Datos Fiscales y de Identidad Corporativa
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Información oficial registrada ante la Secretaría de Hacienda (SAT).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Régimen Fiscal */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-foreground">
              Régimen Fiscal de la Empresa *
            </Label>
            <Select
              value={fiscalRegime}
              onValueChange={(val: "persona_moral" | "persona_fisica") => setFiscalRegime(val)}
              disabled={isReadOnly}
            >
              <SelectTrigger className="h-12 bg-background border-border/40 rounded-[14px] px-4 text-sm font-semibold">
                <SelectValue placeholder="Selecciona el régimen" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="persona_moral">Persona Moral (Empresa / Sociedad)</SelectItem>
                <SelectItem value="persona_fisica">Persona Física con Actividad Empresarial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 1. Denominación o Razón Social */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-foreground">
              1. Denominación o Razón Social *
            </Label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] pointer-events-none" />
              <Input
                type="text"
                placeholder="Ej. Operadora de Hoteles de la Riviera S.A. de C.V."
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                disabled={isReadOnly}
                className="h-12 bg-background border-border/40 rounded-[14px] pl-11 pr-4 text-sm font-semibold"
              />
            </div>
          </div>

          {/* 6. Nombre Comercial */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-foreground">
              6. Nombre Comercial de la Marca *
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] pointer-events-none" />
              <Input
                type="text"
                placeholder="Ej. Hotel Riviera Maya Resort"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isReadOnly}
                className="h-12 bg-background border-border/40 rounded-[14px] pl-11 pr-4 text-sm font-semibold"
              />
            </div>
          </div>

          {/* 3. RFC */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs sm:text-sm font-extrabold text-foreground">
                3. RFC de la Empresa *
              </Label>
              <span className="text-[11px] text-muted-foreground font-bold">
                {fiscalRegime === "persona_moral" ? "12 Caracteres" : "13 Caracteres"}
              </span>
            </div>
            <div className="relative">
              <FileCheck className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] pointer-events-none" />
              <Input
                type="text"
                placeholder={fiscalRegime === "persona_moral" ? "OHR120315ABC" : "GARM850612ABC"}
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                maxLength={fiscalRegime === "persona_moral" ? 12 : 13}
                disabled={isReadOnly}
                className={cn(
                  "h-12 bg-background border-border/40 rounded-[14px] pl-11 pr-4 text-sm font-semibold uppercase tracking-wider",
                  rfc.trim().length > 0 && !isRfcValid && "border-destructive/60"
                )}
              />
            </div>
            {rfc.trim().length > 0 && !isRfcValid && (
              <p className="text-[11px] text-destructive font-semibold">
                Formato de RFC inválido para {fiscalRegime === "persona_moral" ? "Persona Moral (12 caracteres)" : "Persona Física (13 caracteres)"}.
              </p>
            )}
          </div>

          {/* 7. Giro o Actividad Económica */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-foreground">
              7. Giro o Actividad Económica *
            </Label>
            <Select value={industry} onValueChange={setIndustry} disabled={isReadOnly}>
              <SelectTrigger className="h-12 bg-background border-border/40 rounded-[14px] px-4 text-sm font-semibold">
                <SelectValue placeholder="Selecciona el sector" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="Hotelería, Turismo y Gastronomía">Hotelería, Turismo y Gastronomía</SelectItem>
                <SelectItem value="Comercio y Retail">Comercio y Retail</SelectItem>
                <SelectItem value="Construcción e Inmobiliaria">Construcción e Inmobiliaria</SelectItem>
                <SelectItem value="Servicios de Seguridad y Limpieza">Servicios de Seguridad y Limpieza</SelectItem>
                <SelectItem value="Tecnología & Software">Tecnología & Software</SelectItem>
                <SelectItem value="Salud & Bienestar">Salud & Bienestar</SelectItem>
                <SelectItem value="Finanzas & Banca">Finanzas & Banca</SelectItem>
                <SelectItem value="Educación & Capacitación">Educación & Capacitación</SelectItem>
                <SelectItem value="Transporte & Logística">Transporte & Logística</SelectItem>
                <SelectItem value="Otro Sector">Otro Sector Económico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 5. Domicilio Fiscal */}
          <div className="md:col-span-2 space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-foreground">
              5. Domicilio Fiscal Completo *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] pointer-events-none" />
              <Input
                type="text"
                placeholder="Calle, Número exterior/interior, Colonia, C.P., Ciudad y Estado"
                value={fiscalAddress}
                onChange={(e) => setFiscalAddress(e.target.value)}
                disabled={isReadOnly}
                className="h-12 bg-background border-border/40 rounded-[14px] pl-11 pr-4 text-sm font-semibold"
              />
            </div>
          </div>

          {/* 8. Nombre del Representante Legal */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-foreground">
              8. Nombre del Representante Legal *
            </Label>
            <div className="relative">
              <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] pointer-events-none" />
              <Input
                type="text"
                placeholder="Nombre(s) y Apellidos completos"
                value={legalRepName}
                onChange={(e) => setLegalRepName(e.target.value)}
                disabled={isReadOnly}
                className="h-12 bg-background border-border/40 rounded-[14px] pl-11 pr-4 text-sm font-semibold"
              />
            </div>
          </div>

          {/* 11. Correo Electrónico Corporativo */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-foreground">
              11. Correo Electrónico Corporativo *
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] pointer-events-none" />
              <Input
                type="email"
                placeholder="ejemplo@empresa.com"
                value={corporateEmail}
                onChange={(e) => setCorporateEmail(e.target.value)}
                disabled={isReadOnly}
                className="h-12 bg-background border-border/40 rounded-[14px] pl-11 pr-4 text-sm font-semibold"
              />
            </div>
          </div>

          {/* 12. Número Telefónico de Contacto */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-foreground">
              12. Número Telefónico de Contacto *
            </Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] pointer-events-none" />
              <Input
                type="tel"
                placeholder="+52 999 123 4567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={isReadOnly}
                className="h-12 bg-background border-border/40 rounded-[14px] pl-11 pr-4 text-sm font-semibold"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 2: DOCUMENTOS OFICIALES */}
      <Card className="bg-card border border-border/40 rounded-[28px] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-border/40">
          <div className="size-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <FileText className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              Sección 2: Documentación Legal Oficial (Carga de Archivos)
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Adjunta copias escaneadas legibles en formato PDF o imagen (Máx. 10 MB por archivo).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document 2: Acta Constitutiva */}
          <DocumentUploadCard
            title="2. Acta Constitutiva *"
            description="Copia escaneada completa y legible en PDF."
            docType="acta_constitutiva"
            doc={documents.acta_constitutiva}
            isUploading={uploadingDocType === "acta_constitutiva"}
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
            onUpload={(file) => handleFileUpload("legal_power", file)}
            onDelete={() => handleDeleteDoc("legal_power")}
            onPreview={(doc) => handlePreviewDoc("Documento de Representación Legal / Poder Notarial", doc)}
          />
        </div>
      </Card>

      {/* SECTION 3: TÉRMINOS Y CONDICIONES Y AVISO DE PRIVACIDAD */}
      <Card className="bg-card border border-border/40 rounded-[28px] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-border/40">
          <div className="size-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Lock className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              Sección 3: Consentimiento Legal & Privacidad
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Requisito 13: Aceptación de términos y custodia de datos corporativos.
            </p>
          </div>
        </div>

        <div className="p-4.5 bg-muted/40 rounded-2xl border border-border/40 flex items-start gap-3.5">
          <Checkbox
            id="terms-check"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(!!checked)}
            disabled={isReadOnly}
            className="mt-0.5 size-5 rounded-md"
          />
          <div className="space-y-1">
            <Label
              htmlFor="terms-check"
              className="text-xs sm:text-sm font-bold text-foreground cursor-pointer leading-relaxed"
            >
              13. Manifiesto bajo protesta de decir verdad que los datos y documentos proporcionados son legítimos y acepto los Términos y Condiciones y Aviso de Privacidad de K&apos;anPro.
            </Label>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              K&apos;anPro resguarda la información fiscal y legal de manera estrictamente confidencial para fines exclusivos de validación de identidad corporativa.
            </p>
          </div>
        </div>
      </Card>

      {/* BOTTOM ACTION BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-card border border-border/40 rounded-[28px] shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving || isSubmitting || isReadOnly}
            className="w-full sm:w-auto rounded-2xl px-6 h-12 text-xs font-bold gap-2"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span>Guardar Borrador</span>
          </Button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            onClick={handleSubmitVerification}
            disabled={isSubmitting || isSaving || completedCount < totalCount || isReadOnly}
            className="w-full sm:w-auto rounded-2xl px-8 h-12 text-xs font-bold bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#253240] dark:hover:bg-zinc-200 gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Enviando Expediente...</span>
              </>
            ) : (
              <>
                <Send className="size-4" />
                <span>Enviar Expediente a Revisión</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* PDF PREVIEW MODAL WITH SECURE SIGNED URL */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-3xl bg-background border border-border/40 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="size-5 text-[#5c7c9b]" />
              {previewDoc?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              {previewDoc?.fileName}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-muted/30 border border-border/40 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
            {previewDoc?.url && (
              <div className="w-full space-y-4">
                {previewDoc.fileName.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={previewDoc.url}
                    className="w-full h-96 rounded-xl border border-border/40 bg-white"
                    title={previewDoc.title}
                  />
                ) : (
                  <div className="flex justify-center p-2">
                    <img
                      src={previewDoc.url}
                      alt={previewDoc.title}
                      className="max-h-96 rounded-xl object-contain border border-border/40"
                    />
                  </div>
                )}

                <div className="flex justify-center gap-3 pt-2">
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold shadow-xs hover:bg-[#253240]"
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
  onUpload,
  onDelete,
  onPreview,
}: DocumentUploadCardProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="p-5 bg-card border border-border/40 rounded-[20px] space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-foreground">
              {title}
            </h4>
            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              {description}
            </p>
          </div>

          {doc ? (
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2 py-0.5 shrink-0">
              Cargado
            </Badge>
          ) : (
            <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-extrabold px-2 py-0.5 shrink-0">
              Pendiente
            </Badge>
          )}
        </div>

        {/* Existing Doc Item */}
        {doc ? (
          <div className="mt-4 p-3 bg-muted/40 border border-border/40 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="size-6 text-[#5c7c9b] shrink-0" />
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
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Ver Documento"
              >
                <Eye className="size-4" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="p-1.5 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                title="Eliminar Documento"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Dropzone Click Box */
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={cn(
              "mt-4 p-5 bg-background rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-2",
              isUploading
                ? "border-primary bg-muted/20"
                : "border-border/60 hover:border-primary"
            )}
          >
            {isUploading ? (
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Subiendo documento...</span>
              </div>
            ) : (
              <>
                <UploadCloud className="size-6 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">
                  Seleccionar archivo PDF o imagen
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  Formatos: .pdf, .jpg, .png (Máx. 10 MB)
                </span>
              </>
            )}

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
          </div>
        )}
      </div>
    </div>
  );
}
