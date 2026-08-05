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
  // Form State for Non-Document Fields
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

  // Modal State
  const [previewDoc, setPreviewDoc] = React.useState<{
    title: string;
    url: string;
    fileName: string;
  } | null>(null);

  // Calculate Progress (13 mandatory items)
  const itemsChecklist = [
    { label: "1. Denominación o razón social", isComplete: !!legalName.trim() },
    { label: "2. Acta constitutiva", isComplete: !!documents.acta_constitutiva },
    { label: "3. RFC registrado", isComplete: !!rfc.trim() && rfc.trim().length >= 12 },
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
        description: `Se registró ${uploadedDoc.file_name} en tu expediente.`,
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
          terms_accepted: termsAccepted,
        },
        true
      );

      setVerificationStatus("pending");
      toast.success("¡Expediente enviado a revisión!", {
        description:
          "El equipo de K'anPro revisará tus documentos corporativos. Te notificaremos una vez validados.",
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
      className="space-y-8 max-w-4xl mx-auto w-full"
    >
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-[800] tracking-tight text-[#1f2732] dark:text-zinc-100 flex items-center gap-3">
              <Building2 className="size-7 text-[#5c7c9b]" />
              Verificación de Empresa (Persona Moral)
            </h1>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 font-bold px-3 py-1 rounded-full text-xs">
              🔒 Expediente Privado & Confidencial (No visible para candidatos)
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#5c7c9b] dark:text-zinc-400 font-semibold">
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
            <Badge className="bg-[#f5f7fa] dark:bg-zinc-800 border border-[#ebeef3] dark:border-zinc-700 text-[#5c7c9b] dark:text-zinc-300 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
              <FileText className="size-4.5 text-[#5c7c9b]" />
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
            <span className="font-extrabold">¡Tu perfil de Persona Moral está 100% verificado!</span> Tus ofertas laborales cuentan con la insignia de confianza corporativa activa en Yucatán y Quintana Roo.
          </div>
        </div>
      )}

      {verificationStatus === "pending" && (
        <div className="flex items-start gap-4 p-5 rounded-[22px] bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
          <Clock className="size-6 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400 animate-pulse" />
          <div className="text-xs sm:text-sm font-semibold leading-relaxed">
            <span className="font-extrabold">Tu expediente digital está siendo validado.</span> Nuestro equipo legal está revisando los 13 requisitos corporativos. Recibirás una notificación una vez aprobado.
          </div>
        </div>
      )}

      {/* PROGRESS TRACKER CARD */}
      <Card className="bg-white dark:bg-[#18181b] border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] p-6 sm:p-7 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#1f2732] dark:text-zinc-100 flex items-center gap-2">
              <FileCheck className="size-5 text-[#5c7c9b]" />
              Progreso del Expediente de Persona Moral
            </h3>
            <p className="text-xs text-[#5c7c9b] dark:text-zinc-400 font-semibold mt-0.5">
              Completa los 13 requisitos obligatorios para habilitar el envío.
            </p>
          </div>
          <span className="text-sm font-extrabold text-[#1f2732] dark:text-zinc-100">
            {completedCount} de {totalCount} Requisitos ({progressPercent}%)
          </span>
        </div>

        <Progress value={progressPercent} className="h-3.5 rounded-full bg-[#f5f7fa] dark:bg-zinc-800" />

        {/* Quick Checklist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
          {itemsChecklist.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                item.isComplete
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-[#f5f7fa] dark:bg-zinc-900 text-[#5c7c9b] dark:text-zinc-400 border border-[#ebeef3] dark:border-zinc-800"
              )}
            >
              <CheckCircle2
                className={cn(
                  "size-4 shrink-0",
                  item.isComplete
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-[#94a3b8] dark:text-zinc-600"
                )}
              />
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* SECTION 1: DATOS CORPORATIVOS Y LEGALES */}
      <Card className="bg-white dark:bg-[#18181b] border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-[#ebeef3] dark:border-zinc-800">
          <div className="size-10 rounded-2xl bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shrink-0">
            1
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1f2732] dark:text-zinc-100">
              Datos Corporativos y Fiscales de la Persona Moral
            </h2>
            <p className="text-xs text-[#5c7c9b] dark:text-zinc-400 font-semibold">
              Información oficial según la Constancia de Situación Fiscal y Acta Constitutiva.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Denominación o Razón Social */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-[#3e546d] dark:text-zinc-200">
              1. Denominación o Razón Social *
            </Label>
            <Input
              type="text"
              placeholder="Ej. Comercializadora del Caribe S.A. de C.V."
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="h-12 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[14px] px-4 text-sm font-semibold text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8]"
            />
          </div>

          {/* 6. Nombre Comercial */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-[#3e546d] dark:text-zinc-200">
              6. Nombre Comercial (si aplica) *
            </Label>
            <Input
              type="text"
              placeholder="Ej. Hotel Cancún Sun & Spa"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-12 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[14px] px-4 text-sm font-semibold text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8]"
            />
          </div>

          {/* 3. RFC */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-[#3e546d] dark:text-zinc-200">
              3. RFC de la Persona Moral *
            </Label>
            <Input
              type="text"
              maxLength={13}
              placeholder="Ej. ABC120315XXX"
              value={rfc}
              onChange={(e) => setRfc(e.target.value.toUpperCase())}
              className="h-12 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[14px] px-4 text-sm font-bold tracking-wider text-[#1f2732] dark:text-zinc-100 uppercase placeholder-[#94a3b8]"
            />
          </div>

          {/* 7. Giro o Actividad Económica */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-[#3e546d] dark:text-zinc-200">
              7. Giro o Actividad Económica *
            </Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="h-12 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[14px] px-4 text-sm font-semibold text-[#1f2732] dark:text-zinc-100">
                <SelectValue placeholder="Selecciona la actividad económica" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-[#ebeef3] dark:border-zinc-800">
                <SelectItem value="Restaurantes / Hotelería / Turismo">Restaurantes / Hotelería / Turismo</SelectItem>
                <SelectItem value="Comercio y Retail">Comercio & Retail</SelectItem>
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
            <Label className="text-xs sm:text-sm font-extrabold text-[#3e546d] dark:text-zinc-200">
              5. Domicilio Fiscal Completo *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] pointer-events-none" />
              <Input
                type="text"
                placeholder="Calle, Número exterior/interior, Colonia, C.P., Ciudad y Estado"
                value={fiscalAddress}
                onChange={(e) => setFiscalAddress(e.target.value)}
                className="h-12 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[14px] pl-11 pr-4 text-sm font-semibold text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8]"
              />
            </div>
          </div>

          {/* 8. Nombre del Representante Legal */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-[#3e546d] dark:text-zinc-200">
              8. Nombre del Representante Legal *
            </Label>
            <div className="relative">
              <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] pointer-events-none" />
              <Input
                type="text"
                placeholder="Nombre(s) y Apellidos completos"
                value={legalRepName}
                onChange={(e) => setLegalRepName(e.target.value)}
                className="h-12 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[14px] pl-11 pr-4 text-sm font-semibold text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8]"
              />
            </div>
          </div>

          {/* 11. Correo Electrónico Corporativo */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-[#3e546d] dark:text-zinc-200">
              11. Correo Electrónico Corporativo *
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] pointer-events-none" />
              <Input
                type="email"
                placeholder="ejemplo@empresa.com"
                value={corporateEmail}
                onChange={(e) => setCorporateEmail(e.target.value)}
                className="h-12 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[14px] pl-11 pr-4 text-sm font-semibold text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8]"
              />
            </div>
          </div>

          {/* 12. Número Telefónico de Contacto */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-extrabold text-[#3e546d] dark:text-zinc-200">
              12. Número Telefónico de Contacto *
            </Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] pointer-events-none" />
              <Input
                type="tel"
                placeholder="+52 999 123 4567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="h-12 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[14px] pl-11 pr-4 text-sm font-semibold text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8]"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 2: EXPEDIENTE DIGITAL Y DOCUMENTOS */}
      <Card className="bg-white dark:bg-[#18181b] border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-[#ebeef3] dark:border-zinc-800">
          <div className="size-10 rounded-2xl bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shrink-0">
            2
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1f2732] dark:text-zinc-100">
              Expediente Digital de Documentos Obligatorios
            </h2>
            <p className="text-xs text-[#5c7c9b] dark:text-zinc-400 font-semibold">
              Archivos PDF o imágenes nítidas de la documentación legal de la empresa (Máx. 10 MB cada uno).
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
            onPreview={(doc) =>
              setPreviewDoc({
                title: "Acta Constitutiva",
                url: doc.file_url,
                fileName: doc.file_name,
              })
            }
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
            onPreview={(doc) =>
              setPreviewDoc({
                title: "Constancia de Situación Fiscal",
                url: doc.file_url,
                fileName: doc.file_name,
              })
            }
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
            onPreview={(doc) =>
              setPreviewDoc({
                title: "Identificación Oficial del Representante Legal",
                url: doc.file_url,
                fileName: doc.file_name,
              })
            }
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
            onPreview={(doc) =>
              setPreviewDoc({
                title: "Documento de Representación Legal / Poder Notarial",
                url: doc.file_url,
                fileName: doc.file_name,
              })
            }
          />
        </div>
      </Card>

      {/* SECTION 3: TÉRMINOS Y CONDICIONES Y AVISO DE PRIVACIDAD */}
      <Card className="bg-white dark:bg-[#18181b] border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3 pb-3 border-b border-[#ebeef3] dark:border-zinc-800">
          <div className="size-10 rounded-2xl bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shrink-0">
            3
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1f2732] dark:text-zinc-100">
              13. Aceptación Legal y Políticas K&apos;anPro *
            </h2>
            <p className="text-xs text-[#5c7c9b] dark:text-zinc-400 font-semibold">
              Requisito legal para habilitar la publicación corporativa.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800">
          <Checkbox
            id="terms-checkbox"
            checked={termsAccepted}
            onCheckedChange={(val) => setTermsAccepted(!!val)}
            className="mt-0.5 size-5 rounded-md border-fiord-300 dark:border-fiord-700 data-[state=checked]:bg-[#1f2732] dark:data-[state=checked]:bg-zinc-100 data-[state=checked]:text-white dark:data-[state=checked]:text-zinc-900"
          />
          <label
            htmlFor="terms-checkbox"
            className="text-xs sm:text-sm font-semibold text-[#1f2732] dark:text-zinc-200 leading-relaxed cursor-pointer select-none"
          >
            Manifiesto bajo protesta de decir verdad que represento legalmente a la Persona Moral y que los documentos ingresados son verídicos. Acepto íntegramente los{" "}
            <a
              href="/account/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5c7c9b] dark:text-zinc-300 font-extrabold hover:underline inline-flex items-center gap-0.5"
            >
              Términos y Condiciones <ExternalLink className="size-3" />
            </a>{" "}
            y el{" "}
            <a
              href="/account/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5c7c9b] dark:text-zinc-300 font-extrabold hover:underline inline-flex items-center gap-0.5"
            >
              Aviso de Privacidad de K'anPro <ExternalLink className="size-3" />
            </a>.
          </label>
        </div>
      </Card>

      {/* FOOTER ACTIONS BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isSaving || isSubmitting}
          className="w-full sm:w-auto h-13 rounded-[16px] font-bold bg-white dark:bg-zinc-900 text-[#1f2732] dark:text-zinc-200 border border-[#d2dbe5] dark:border-zinc-800 text-sm px-6 flex items-center justify-center gap-2 cursor-pointer shadow-none"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          <span>Guardar Borrador</span>
        </Button>

        <Button
          type="button"
          onClick={handleSubmitVerification}
          disabled={isSubmitting || completedCount < totalCount}
          className="w-full sm:w-auto h-13 rounded-[16px] font-bold bg-[#1f2732] dark:bg-zinc-100 hover:bg-[#253240] dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm px-8 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          <span>Enviar Expediente a Revisión</span>
        </Button>
      </div>

      {/* PDF PREVIEW MODAL */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1f2732] dark:text-zinc-50 flex items-center gap-2">
              <FileText className="size-5 text-[#5c7c9b]" />
              {previewDoc?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5c7c9b] font-medium">
              {previewDoc?.fileName}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 bg-[#f5f7fa] dark:bg-zinc-800/50 border border-[#ebeef3] dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 py-10">
            <div className="size-16 rounded-full bg-fiord-100 dark:bg-fiord-900 text-[#1f2732] dark:text-zinc-100 flex items-center justify-center">
              <FileText className="size-8 text-[#5c7c9b]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1f2732] dark:text-zinc-100">
                Documento registrado en Supabase Storage
              </p>
              <p className="text-xs text-[#5c7c9b] font-medium mt-1">
                Haz clic abajo para abrir o descargar la copia original.
              </p>
            </div>

            {previewDoc?.url && (
              <a
                href={previewDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold shadow-xs hover:bg-[#253240]"
              >
                <span>Abrir Archivo Original</span>
                <ExternalLink className="size-3.5" />
              </a>
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
    <div className="p-5 bg-[#f5f7fa] dark:bg-zinc-900/70 border border-[#ebeef3] dark:border-zinc-800 rounded-[20px] space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-[#1f2732] dark:text-zinc-100">
              {title}
            </h4>
            <p className="text-[11px] text-[#5c7c9b] dark:text-zinc-400 font-semibold mt-0.5">
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
          <div className="mt-4 p-3 bg-white dark:bg-zinc-800 border border-[#ebeef3] dark:border-zinc-700 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="size-6 text-[#5c7c9b] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1f2732] dark:text-zinc-100 truncate">
                  {doc.file_name}
                </p>
                <p className="text-[10px] text-[#5c7c9b] dark:text-zinc-400 font-medium">
                  {doc.file_size_bytes
                    ? `${(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
                    : "Documento PDF"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onPreview(doc)}
                className="p-1.5 text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-100 transition-colors"
                title="Ver Documento"
              >
                <Eye className="size-4" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="p-1.5 text-rose-500 hover:text-rose-600 transition-colors"
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
              "mt-4 p-5 bg-white dark:bg-zinc-950 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-2",
              isUploading
                ? "border-[#1f2732] dark:border-zinc-100 bg-[#f5f7fa]"
                : "border-[#d2dbe5] dark:border-zinc-800 hover:border-[#1f2732] dark:hover:border-zinc-600"
            )}
          >
            {isUploading ? (
              <div className="flex items-center gap-2 text-xs font-bold text-[#1f2732] dark:text-zinc-100">
                <Loader2 className="size-4 animate-spin text-[#5c7c9b]" />
                <span>Subiendo documento...</span>
              </div>
            ) : (
              <>
                <UploadCloud className="size-6 text-[#5c7c9b]" />
                <span className="text-xs font-bold text-[#1f2732] dark:text-zinc-100">
                  Seleccionar archivo PDF o imagen
                </span>
                <span className="text-[10px] font-semibold text-[#94a3b8]">
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
