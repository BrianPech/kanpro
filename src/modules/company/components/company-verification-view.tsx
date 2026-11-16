"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Building2,
  ExternalLink,
  FileText,
  Trash2,
  Users,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CompanyDocType,
  CompanyVerificationData,
  CompanyVerificationDoc,
  companyVerificationService,
} from "../services/company-verification";
import { saveCompanyVerificationAction } from "../actions/verification";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CompanyVerificationViewProps {
  userId: string;
  initialData: CompanyVerificationData;
}

const INDUSTRY_OPTIONS = [
  "Hotelería y turismo",
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

const DOC_ITEMS: Array<{
  docType: CompanyDocType;
  title: string;
  shortLabel: string;
}> = [
  {
    docType: "acta_constitutiva",
    title: "Acta constitutiva",
    shortLabel: "Acta constitutiva",
  },
  {
    docType: "constancia_situacion_fiscal",
    title: "Constancia de situación fiscal",
    shortLabel: "Constancia fiscal",
  },
  {
    docType: "legal_rep_id",
    title: "Identificación oficial del representante",
    shortLabel: "Identificación oficial",
  },
  {
    docType: "legal_power",
    title: "Poder notarial",
    shortLabel: "Poder notarial",
  },
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

  const [verificationStatus, setVerificationStatus] = React.useState<
    "pending" | "approved" | "rejected" | "unsubmitted"
  >(initialData.verification_status || "unsubmitted");

  const [documents, setDocuments] = React.useState<
    Record<CompanyDocType, CompanyVerificationDoc | null>
  >(initialData.documents);

  const [isSaving, setIsSaving] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadingDocType, setUploadingDocType] = React.useState<CompanyDocType | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);
  const [editModal, setEditModal] = React.useState<"company" | "contact" | null>(null);
  const [uploadModalDoc, setUploadModalDoc] = React.useState<{
    docType: CompanyDocType;
    title: string;
  } | null>(null);
  const [pendingUploadFile, setPendingUploadFile] = React.useState<File | null>(null);
  const uploadModalInputRef = React.useRef<HTMLInputElement | null>(null);

  const [draftCompany, setDraftCompany] = React.useState({
    fiscalRegime: fiscalRegime,
    legalName: legalName,
    companyName: companyName,
    rfc: rfc,
    industry: industry,
    fiscalAddress: fiscalAddress,
  });

  const [draftContact, setDraftContact] = React.useState({
    legalRepName: legalRepName,
    contactPhone: contactPhone,
    corporateEmail: corporateEmail,
  });

  const openCompanyEditModal = () => {
    setDraftCompany({
      fiscalRegime,
      legalName,
      companyName,
      rfc,
      industry,
      fiscalAddress,
    });
    setEditModal("company");
  };

  const openContactEditModal = () => {
    setDraftContact({
      legalRepName,
      contactPhone,
      corporateEmail,
    });
    setEditModal("contact");
  };

  const openUploadModal = (docType: CompanyDocType, title: string) => {
    setPendingUploadFile(null);
    setUploadModalDoc({ docType, title });
  };

  const [previewDoc, setPreviewDoc] = React.useState<{
    docType: CompanyDocType;
    title: string;
    url: string;
    fileName: string;
  } | null>(null);

  const fileInputRefs = React.useRef<Record<CompanyDocType, HTMLInputElement | null>>({
    acta_constitutiva: null,
    constancia_situacion_fiscal: null,
    legal_rep_id: null,
    legal_power: null,
  });

  const consentRef = React.useRef<HTMLDivElement | null>(null);

  const isPendingReview = verificationStatus === "pending";
  const isApproved = verificationStatus === "approved";
  const isLocked = isPendingReview || isApproved;
  const isReadOnly = isLocked;

  const isRfcValid = React.useMemo(() => {
    const cleaned = rfc.trim().toUpperCase();
    if (fiscalRegime === "persona_moral") {
      return cleaned.length === 12 && /^[A-Z&Ñ]{3}\d{6}[A-Z0-9]{3}$/.test(cleaned);
    }
    return cleaned.length === 13 && /^[A-Z&Ñ]{4}\d{6}[A-Z0-9]{3}$/.test(cleaned);
  }, [rfc, fiscalRegime]);

  const itemsChecklist = [
    { label: "Razón social", isComplete: !!legalName.trim() },
    { label: "Acta constitutiva", isComplete: !!documents.acta_constitutiva },
    { label: "RFC", isComplete: isRfcValid },
    { label: "Constancia fiscal", isComplete: !!documents.constancia_situacion_fiscal },
    { label: "Domicilio fiscal", isComplete: !!fiscalAddress.trim() },
    { label: "Nombre comercial", isComplete: !!companyName.trim() },
    { label: "Actividad económica", isComplete: !!industry.trim() },
    { label: "Representante legal", isComplete: !!legalRepName.trim() },
    { label: "Identificación oficial", isComplete: !!documents.legal_rep_id },
    { label: "Poder notarial", isComplete: !!documents.legal_power },
    { label: "Correo corporativo", isComplete: !!corporateEmail.trim() },
    { label: "Teléfono", isComplete: !!contactPhone.trim() },
    { label: "Consentimiento", isComplete: termsAccepted },
  ];

  const completedCount = itemsChecklist.filter((item) => item.isComplete).length;
  const totalCount = itemsChecklist.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const missingCount = totalCount - completedCount;

  const companyDataComplete =
    !!legalName.trim() &&
    isRfcValid &&
    !!fiscalAddress.trim() &&
    !!companyName.trim() &&
    !!industry.trim();

  const contactDataComplete =
    !!legalRepName.trim() && !!corporateEmail.trim() && !!contactPhone.trim();

  const pendingChips = React.useMemo(() => {
    const chips: Array<{ key: "company" | "contact" | "terms" | CompanyDocType; label: string }> = [];
    if (!companyDataComplete) {
      chips.push({ key: "company", label: "Datos de la empresa" });
    }
    if (!contactDataComplete) {
      chips.push({ key: "contact", label: "Representante y contacto" });
    }
    for (const docItem of DOC_ITEMS) {
      if (!documents[docItem.docType]) {
        chips.push({ key: docItem.docType, label: docItem.shortLabel });
      }
    }
    if (!termsAccepted) {
      chips.push({ key: "terms", label: "Consentimiento" });
    }
    return chips;
  }, [companyDataComplete, contactDataComplete, documents, termsAccepted]);

  const handlePendingChipClick = (
    key: "company" | "contact" | "terms" | CompanyDocType
  ) => {
    if (key === "company") {
      openCompanyEditModal();
      return;
    }
    if (key === "contact") {
      openContactEditModal();
      return;
    }
    if (key === "terms") {
      consentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const found = DOC_ITEMS.find((d) => d.docType === key);
    if (found) {
      openUploadModal(found.docType, found.title);
    }
  };

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
      setPreviewDoc(null);

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

  const handlePreviewDoc = async (
    docType: CompanyDocType,
    title: string,
    doc: CompanyVerificationDoc
  ) => {
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
        docType,
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

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await saveCompanyVerificationAction({
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
        submitForReview: false,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

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

  const handleSubmitVerification = async () => {
    if (completedCount < totalCount) {
      const missingItems = itemsChecklist
        .filter((item) => !item.isComplete)
        .map((item) => item.label);

      toast.error("Requisitos incompletos", {
        description: `Debes completar los ${totalCount} requisitos. Pendientes: ${missingItems.slice(0, 3).join(", ")}${missingItems.length > 3 ? "..." : ""}`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveCompanyVerificationAction({
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
        submitForReview: true,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

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

  const statusPill = isApproved
    ? { label: "Verificada", className: "bg-success text-success-foreground" }
    : isPendingReview
    ? {
        label: "En revisión",
        className:
          "bg-[#e8f2fb] text-[#184c78] dark:bg-[#213748] dark:text-[#abd6f5]",
      }
    : verificationStatus === "rejected"
    ? { label: "Rechazada", className: "bg-destructive/15 text-destructive" }
    : { label: "Borrador", className: "bg-muted text-muted-foreground" };

  const progressHeading = isApproved
    ? "Expediente aprobado"
    : isPendingReview
    ? "Expediente enviado"
    : completedCount === totalCount
    ? "Expediente listo"
    : "Completa los requisitos pendientes";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-[24px] w-full pb-12 font-sans"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-[16px]">
        <div>
          <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.02em] text-foreground">
            Verificación de empresa
          </h1>
          <p className="text-[14px] font-normal leading-[20px] text-muted-foreground mt-[4px]">
            {companyName?.trim() || "Tu empresa"} · Expediente de verificación
          </p>
        </div>

        <span
          className={cn(
            "inline-flex items-center rounded-[8px] px-[12px] py-[6px] text-[12px] font-medium leading-[16px] shrink-0 self-start",
            statusPill.className
          )}
        >
          {statusPill.label}
        </span>
      </div>

      {/* Progress Card */}
      <div className="bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[12px]">
        <div className="flex flex-wrap items-center justify-between gap-[12px]">
          <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-foreground">
            {progressHeading}
          </h2>
          <span className="text-[14px] font-medium leading-[20px] text-link tabular-nums">
            {completedCount} de {totalCount} requisitos completos
          </span>
        </div>

        <div className="h-[6px] w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {isApproved ? (
          <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
            Tu empresa cuenta con el sello oficial de verificación.
          </p>
        ) : isPendingReview ? (
          <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
            Te avisaremos cuando haya una actualización de la revisión.
          </p>
        ) : completedCount === totalCount ? (
          <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
            Revisa el resumen antes de enviar el expediente.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-[8px] pt-[4px]">
            {pendingChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => handlePendingChipClick(chip.key)}
                className="h-[32px] px-[12px] rounded-[8px] border border-control-border bg-card hover:bg-muted/50 text-[13px] font-medium text-link inline-flex items-center gap-[6px] transition-colors cursor-pointer"
              >
                <span>{chip.label}</span>
                <ArrowRight className="size-[14px]" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[20px] items-start">
        {/* Left: Documentos */}
        <div className="lg:col-span-7 bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[16px]">
          <div>
            <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-foreground">
              Documentos
            </h2>
            <p className="text-[13px] font-normal leading-[18px] text-muted-foreground mt-[2px]">
              Adjunta archivos legibles en PDF, JPG o PNG. Máximo 10 MB por archivo.
            </p>
          </div>

          <div className="divide-y divide-border">
            {DOC_ITEMS.map(({ docType, title }) => {
              const doc = documents[docType];
              const isUploading = uploadingDocType === docType;

              return (
                <div
                  key={docType}
                  className="py-[14px] first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-[12px]"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold leading-[20px] text-foreground">
                      {title}
                    </p>
                    <p className="text-[13px] font-normal leading-[18px] text-muted-foreground truncate">
                      {doc ? doc.file_name : "Archivo pendiente"}
                    </p>
                  </div>

                  <div className="flex items-center gap-[10px] shrink-0">
                    {doc ? (
                      <span className="inline-flex items-center rounded-full bg-success text-success-foreground px-[10px] py-[4px] text-[12px] font-medium leading-[16px]">
                        Adjunto
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-warning text-warning-foreground px-[10px] py-[4px] text-[12px] font-medium leading-[16px]">
                        Pendiente
                      </span>
                    )}

                    {doc ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isLoadingPreview}
                        onClick={() => handlePreviewDoc(docType, title, doc)}
                        className="h-[36px] px-[14px] rounded-[8px] border-control-border bg-card text-[14px] font-medium text-foreground hover:bg-muted/50 cursor-pointer"
                      >
                        Ver archivo
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isReadOnly || isUploading}
                        onClick={() => openUploadModal(docType, title)}
                        className="h-[36px] px-[14px] rounded-[8px] border-control-border bg-card text-[14px] font-medium text-foreground hover:bg-muted/50 cursor-pointer"
                      >
                        {isUploading ? "Subiendo..." : "Adjuntar"}
                      </Button>
                    )}

                    {!isReadOnly && (
                      <input
                        ref={(el) => {
                          fileInputRefs.current[docType] = el;
                        }}
                        type="file"
                        aria-label={`Archivo para ${title}`}
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleFileUpload(docType, file);
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Datos de la empresa & Representante y contacto */}
        <div className="lg:col-span-5 flex flex-col gap-[20px]">
          {/* Card: Datos de la empresa */}
          <div className="bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[16px]">
            <div className="flex items-center justify-between gap-[12px]">
              <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-foreground">
                Datos de la empresa
              </h2>

              {isLocked ? (
                <span className="inline-flex items-center rounded-full bg-success text-success-foreground px-[10px] py-[2px] text-[12px] font-medium leading-[16px]">
                  Completo
                </span>
              ) : (
                <button
                  type="button"
                  onClick={openCompanyEditModal}
                  className="text-[14px] font-medium text-link hover:underline cursor-pointer"
                >
                  Editar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[16px] gap-y-[14px]">
              <div>
                <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                  Tipo de persona
                </p>
                <p className="text-[14px] font-medium leading-[20px] text-foreground mt-[2px]">
                  {fiscalRegime === "persona_moral" ? "Persona moral" : "Persona física"}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                  Razón social
                </p>
                <p className="text-[14px] font-medium leading-[20px] text-foreground mt-[2px]">
                  {legalName || "Por definir"}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                  Nombre comercial
                </p>
                <p className="text-[14px] font-medium leading-[20px] text-foreground mt-[2px]">
                  {companyName || "Por definir"}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                  RFC
                </p>
                <p className="text-[14px] font-medium leading-[20px] text-foreground mt-[2px]">
                  {rfc || "Por definir"}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                  Actividad económica
                </p>
                <p className="text-[14px] font-medium leading-[20px] text-foreground mt-[2px]">
                  {industry || "Por definir"}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                  Domicilio fiscal
                </p>
                <p className="text-[14px] font-medium leading-[20px] text-foreground mt-[2px]">
                  {fiscalAddress || "Por definir"}
                </p>
              </div>
            </div>
          </div>

          {/* Card: Representante y contacto */}
          <div className="bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[16px]">
            <div className="flex items-center justify-between gap-[12px]">
              <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-foreground">
                Representante y contacto
              </h2>

              {isLocked ? (
                <span className="inline-flex items-center rounded-full bg-success text-success-foreground px-[10px] py-[2px] text-[12px] font-medium leading-[16px]">
                  Completo
                </span>
              ) : (
                <button
                  type="button"
                  onClick={openContactEditModal}
                  className="text-[14px] font-medium text-link hover:underline cursor-pointer"
                >
                  Editar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[16px] gap-y-[14px]">
              <div>
                <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                  Representante legal
                </p>
                <p className="text-[14px] font-medium leading-[20px] text-foreground mt-[2px]">
                  {legalRepName || "Por definir"}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                  Teléfono
                </p>
                <p className="text-[14px] font-medium leading-[20px] text-foreground mt-[2px]">
                  {contactPhone || "Por definir"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                  Correo corporativo
                </p>
                <p className="text-[14px] font-medium leading-[20px] text-foreground mt-[2px] break-all">
                  {corporateEmail || "Por definir"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consent Card */}
      <div
        ref={consentRef}
        className="bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[12px]"
      >
        <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-foreground">
          Revisión y consentimiento
        </h2>

        <div className="flex items-start sm:items-center gap-[10px]">
          <Checkbox
            id="verification-terms"
            checked={termsAccepted}
            disabled={isReadOnly}
            onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))}
            className="mt-0.5 sm:mt-0"
          />
          <label
            htmlFor="verification-terms"
            className="text-[14px] font-normal leading-[20px] text-foreground cursor-pointer select-none"
          >
            Confirmo que los datos y documentos son auténticos y acepto los{" "}
            <Link href="/terms" className="text-link font-medium hover:underline">
              Términos
            </Link>{" "}
            y el{" "}
            <Link href="/privacy" className="text-link font-medium hover:underline">
              Aviso de privacidad
            </Link>
          </label>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px]">
        <p className="text-[14px] font-normal leading-[20px] text-muted-foreground">
          {isPendingReview
            ? "Puedes consultar el expediente enviado."
            : isApproved
            ? "Tu expediente fue aprobado y verificado."
            : missingCount === 0
            ? `Los ${totalCount} requisitos están completos.`
            : `Faltan ${missingCount} requisitos para enviar el expediente.`}
        </p>

        {!isLocked && (
          <div className="flex items-center gap-[12px]">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving || isSubmitting}
              onClick={handleSaveDraft}
              className="h-[44px] px-[16px] rounded-[8px] border-control-border bg-card text-[14px] font-medium text-foreground hover:bg-muted/50 cursor-pointer"
            >
              {isSaving ? "Guardando..." : "Guardar borrador"}
            </Button>

            <Button
              type="button"
              disabled={isSubmitting || isSaving || completedCount < totalCount}
              onClick={handleSubmitVerification}
              className={cn(
                "h-[44px] px-[16px] rounded-[8px] text-[14px] font-medium cursor-pointer",
                completedCount === totalCount
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isSubmitting ? "Enviando..." : "Enviar a revisión"}
            </Button>
          </div>
        )}
      </div>

      {/* Modal: Adjuntar documento */}
      <Dialog
        open={!!uploadModalDoc}
        onOpenChange={(open) => {
          if (!open) {
            setUploadModalDoc(null);
            setPendingUploadFile(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[460px] rounded-[16px] p-[24px] gap-[16px]"
        >
          <DialogHeader className="gap-[4px] text-left">
            <DialogTitle className="text-[20px] font-semibold leading-[28px] text-foreground">
              Adjuntar documento
            </DialogTitle>
            <DialogDescription className="text-[14px] font-semibold leading-[20px] text-foreground">
              {uploadModalDoc?.title}
            </DialogDescription>
            <p className="text-[12px] font-normal leading-[16px] text-muted-foreground">
              PDF, JPG o PNG · máximo 10 MB
            </p>
          </DialogHeader>

          <button
            type="button"
            onClick={() => uploadModalInputRef.current?.click()}
            className="w-full rounded-[12px] bg-muted/60 hover:bg-muted/80 border border-border p-[16px] text-left transition-colors cursor-pointer"
          >
            <p className="text-[14px] font-semibold leading-[20px] text-foreground truncate">
              {pendingUploadFile
                ? pendingUploadFile.name
                : "Seleccionar archivo..."}
            </p>
            <p className="text-[12px] font-normal leading-[16px] text-muted-foreground mt-[2px]">
              {pendingUploadFile
                ? `${(pendingUploadFile.size / (1024 * 1024)).toFixed(2)} MB listo para adjuntar`
                : "Haz clic para elegir un archivo desde tu dispositivo"}
            </p>
          </button>

          <input
            ref={uploadModalInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            aria-label={`Seleccionar archivo para ${uploadModalDoc?.title || "documento"}`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setPendingUploadFile(file);
              }
              e.target.value = "";
            }}
            className="hidden"
          />

          <div className="flex items-center justify-end gap-[10px]">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUploadModalDoc(null);
                setPendingUploadFile(null);
              }}
              className="h-[40px] px-[16px] rounded-[8px] border-control-border bg-card text-[14px] font-medium text-foreground cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!pendingUploadFile || !uploadModalDoc || uploadingDocType !== null}
              onClick={async () => {
                if (!uploadModalDoc || !pendingUploadFile) return;
                await handleFileUpload(uploadModalDoc.docType, pendingUploadFile);
                setUploadModalDoc(null);
                setPendingUploadFile(null);
              }}
              className="h-[40px] px-[16px] rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 text-[14px] font-medium cursor-pointer"
            >
              {uploadingDocType ? "Subiendo..." : "Adjuntar archivo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar datos de la empresa */}
      <Dialog
        open={editModal === "company"}
        onOpenChange={(open) => !open && setEditModal(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[540px] rounded-[16px] p-[24px] gap-[16px]"
        >
          <DialogHeader className="text-left">
            <div className="flex items-center gap-[10px]">
              <div className="size-[32px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
                <Building2 className="size-[16px]" />
              </div>
              <DialogTitle className="text-[18px] font-semibold leading-[24px] text-foreground">
                Editar datos de la empresa
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
            <div className="flex flex-col gap-[6px]">
              <Label className="text-[14px] font-medium">Tipo de persona</Label>
              <Select
                value={draftCompany.fiscalRegime}
                onValueChange={(val) =>
                  setDraftCompany((prev) => ({
                    ...prev,
                    fiscalRegime: val as "persona_moral" | "persona_fisica",
                  }))
                }
              >
                <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-background px-[12px] text-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="persona_moral">Persona moral</SelectItem>
                  <SelectItem value="persona_fisica">Persona física</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-[6px]">
              <Label htmlFor="verif_rfc" className="text-[14px] font-medium">
                RFC
              </Label>
              <Input
                id="verif_rfc"
                value={draftCompany.rfc}
                onChange={(e) =>
                  setDraftCompany((prev) => ({
                    ...prev,
                    rfc: e.target.value.toUpperCase(),
                  }))
                }
                maxLength={draftCompany.fiscalRegime === "persona_moral" ? 12 : 13}
                className="h-[44px] rounded-[8px] uppercase"
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <Label htmlFor="verif_legal_name" className="text-[14px] font-medium">
                Razón social
              </Label>
              <Input
                id="verif_legal_name"
                value={draftCompany.legalName}
                onChange={(e) =>
                  setDraftCompany((prev) => ({ ...prev, legalName: e.target.value }))
                }
                className="h-[44px] rounded-[8px]"
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <Label htmlFor="verif_company_name" className="text-[14px] font-medium">
                Nombre comercial
              </Label>
              <Input
                id="verif_company_name"
                value={draftCompany.companyName}
                onChange={(e) =>
                  setDraftCompany((prev) => ({
                    ...prev,
                    companyName: e.target.value,
                  }))
                }
                className="h-[44px] rounded-[8px]"
              />
            </div>

            <div className="flex flex-col gap-[6px] sm:col-span-2">
              <Label className="text-[14px] font-medium">Actividad económica</Label>
              <Select
                value={draftCompany.industry}
                onValueChange={(val) =>
                  setDraftCompany((prev) => ({ ...prev, industry: val || "" }))
                }
              >
                <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-background px-[12px] text-[14px]">
                  <SelectValue placeholder="Selecciona un giro" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-[6px] sm:col-span-2">
              <Label htmlFor="verif_fiscal_address" className="text-[14px] font-medium">
                Domicilio fiscal
              </Label>
              <Input
                id="verif_fiscal_address"
                value={draftCompany.fiscalAddress}
                onChange={(e) =>
                  setDraftCompany((prev) => ({
                    ...prev,
                    fiscalAddress: e.target.value,
                  }))
                }
                className="h-[44px] rounded-[8px]"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-[10px]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditModal(null)}
              className="h-[40px] px-[16px] rounded-[8px] border-control-border bg-card text-[14px] font-medium text-foreground cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                setFiscalRegime(draftCompany.fiscalRegime);
                setRfc(draftCompany.rfc);
                setLegalName(draftCompany.legalName);
                setCompanyName(draftCompany.companyName);
                setIndustry(draftCompany.industry);
                setFiscalAddress(draftCompany.fiscalAddress);
                setEditModal(null);
              }}
              className="h-[40px] px-[16px] rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 text-[14px] font-medium cursor-pointer"
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar representante y contacto */}
      <Dialog
        open={editModal === "contact"}
        onOpenChange={(open) => !open && setEditModal(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[520px] rounded-[16px] p-[24px] gap-[16px]"
        >
          <DialogHeader className="text-left">
            <div className="flex items-center gap-[10px]">
              <div className="size-[32px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
                <Users className="size-[16px]" />
              </div>
              <DialogTitle className="text-[18px] font-semibold leading-[24px] text-foreground">
                Editar representante y contacto
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
            <div className="flex flex-col gap-[6px] sm:col-span-2">
              <Label htmlFor="verif_rep_name" className="text-[14px] font-medium">
                Nombre completo del representante legal
              </Label>
              <Input
                id="verif_rep_name"
                value={draftContact.legalRepName}
                onChange={(e) =>
                  setDraftContact((prev) => ({
                    ...prev,
                    legalRepName: e.target.value,
                  }))
                }
                className="h-[44px] rounded-[8px]"
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <Label htmlFor="verif_email" className="text-[14px] font-medium">
                Correo corporativo
              </Label>
              <Input
                id="verif_email"
                type="email"
                value={draftContact.corporateEmail}
                onChange={(e) =>
                  setDraftContact((prev) => ({
                    ...prev,
                    corporateEmail: e.target.value,
                  }))
                }
                className="h-[44px] rounded-[8px]"
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <Label htmlFor="verif_phone" className="text-[14px] font-medium">
                Teléfono de contacto
              </Label>
              <Input
                id="verif_phone"
                value={draftContact.contactPhone}
                onChange={(e) =>
                  setDraftContact((prev) => ({
                    ...prev,
                    contactPhone: e.target.value,
                  }))
                }
                className="h-[44px] rounded-[8px]"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-[10px]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditModal(null)}
              className="h-[40px] px-[16px] rounded-[8px] border-control-border bg-card text-[14px] font-medium text-foreground cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                setLegalRepName(draftContact.legalRepName);
                setCorporateEmail(draftContact.corporateEmail);
                setContactPhone(draftContact.contactPhone);
                setEditModal(null);
              }}
              className="h-[40px] px-[16px] rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 text-[14px] font-medium cursor-pointer"
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF / Image Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              {previewDoc?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {previewDoc?.fileName}
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-muted/30 border border-border rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
            {previewDoc?.url && (
              <div className="w-full space-y-3">
                {previewDoc.fileName.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={previewDoc.url}
                    className="w-full h-96 rounded-xl border border-border bg-white"
                    title={previewDoc.title}
                  />
                ) : (
                  <div className="flex justify-center p-2">
                    <img
                      src={previewDoc.url}
                      alt={previewDoc.title}
                      className="max-h-96 rounded-xl object-contain border border-border"
                    />
                  </div>
                )}

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-[8px] text-xs font-medium hover:bg-primary/90"
                  >
                    <span>Abrir en pestaña completa</span>
                    <ExternalLink className="size-3.5" />
                  </a>

                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDeleteDoc(previewDoc.docType)}
                      className="h-[34px] px-4 rounded-[8px] text-xs font-medium text-destructive hover:text-destructive gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Eliminar archivo</span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
