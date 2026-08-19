"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
  FileText,
  FileCheck,
  Eye,
  Download,
  Phone,
  Mail,
  ExternalLink,
  Loader2,
  Globe,
  MapPin,
  Briefcase,
  Users,
  CheckSquare,
  MessageSquare,
  Maximize2,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  type PendingCompanyItem,
  type ProfileDocumentItem,
  reviewCompanyVerification,
  reviewProfileDocument,
} from "@/app/(dashboard)/dashboard/admin/verifications/actions";

interface CompanyAuditClientProps {
  company: PendingCompanyItem;
}

export function CompanyAuditClient({ company: initialCompany }: CompanyAuditClientProps) {
  const router = useRouter();
  const [company, setCompany] = React.useState<PendingCompanyItem>(initialCompany);
  const [auditNotes, setAuditNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [updatingDocId, setUpdatingDocId] = React.useState<string | null>(null);

  // Active document preview inside the Modal Lightbox
  const [modalDoc, setModalDoc] = React.useState<ProfileDocumentItem | null>(null);

  // Checklist state
  const [checkRfcValid, setCheckRfcValid] = React.useState(company.isVerified);
  const [checkAddressValid, setCheckAddressValid] = React.useState(company.isVerified);
  const [checkIdValid, setCheckIdValid] = React.useState(company.isVerified);

  const formatDocTypeLabel = (docType: string) => {
    switch (docType) {
      case "constancia_situacion_fiscal":
        return "Constancia de Situación Fiscal (SAT)";
      case "legal_rep_id":
        return "INE / Identificación Rep. Legal";
      case "acta_constitutiva":
        return "Acta Constitutiva";
      case "legal_power":
        return "Poder Notarial / IMSS";
      case "proof_of_address":
        return "Comprobante de Domicilio Fiscal";
      case "repse":
        return "Registro REPSE";
      default:
        return docType.replace(/_/g, " ").toUpperCase();
    }
  };

  // Review single document
  const handleReviewDoc = async (docId: string, status: "approved" | "rejected") => {
    setUpdatingDocId(docId);
    try {
      await reviewProfileDocument(docId, status);
      toast.success(status === "approved" ? "Documento aprobado con éxito" : "Documento marcado como rechazado");
      
      setCompany((prev) => ({
        ...prev,
        dbUploadedDocuments: prev.dbUploadedDocuments.map((d) =>
          d.id === docId ? { ...d, status } : d
        ),
      }));

      if (modalDoc && modalDoc.id === docId) {
        setModalDoc((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar documento");
    } finally {
      setUpdatingDocId(null);
    }
  };

  // Submit Company Resolution
  const handleResolution = async (newStatus: "approved" | "rejected" | "requires_revision") => {
    setSubmitting(true);
    try {
      await reviewCompanyVerification(company.id, newStatus, auditNotes);
      const isVerified = newStatus === "approved";
      setCompany((prev) => ({
        ...prev,
        verificationStatus: newStatus,
        isVerified,
      }));
      toast.success(
        newStatus === "approved"
          ? "¡Empresa verificada y Sello K'anPro otorgado!"
          : newStatus === "requires_revision"
          ? "Notificación enviada a la empresa solicitando subsanación"
          : "Expediente de empresa denegado"
      );
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al emitir dictamen");
    } finally {
      setSubmitting(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!company.contactPhone) return "";
    const clean = company.contactPhone.replace(/\D/g, "");
    const msg = `Hola equipo de ${company.companyName}, nos comunicamos del área de Auditoría de K'anPro respecto a su expediente corporativo.`;
    return `https://wa.me/52${clean}?text=${encodeURIComponent(msg)}`;
  };

  const approvedDocsCount = company.dbUploadedDocuments.filter((d) => d.status === "approved").length;

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-3xl border border-border/60 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <Button
            variant="outline"
            size="icon"
            render={<Link href="/dashboard/admin/verifications" />}
            className="size-10 rounded-2xl border-border/60 shrink-0 cursor-pointer shadow-none hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Auditoría Corporativa
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-xs font-semibold text-primary font-mono">{company.rfc}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-foreground truncate flex items-center gap-2">
              <span>{company.companyName}</span>
              {company.isVerified ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-bold gap-1">
                  <ShieldCheck className="size-3.5" />
                  <span>Verificada</span>
                </Badge>
              ) : company.verificationStatus === "requires_revision" ? (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-bold gap-1">
                  <AlertTriangle className="size-3.5" />
                  <span>Requiere Corrección</span>
                </Badge>
              ) : company.verificationStatus === "rejected" ? (
                <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs font-bold gap-1">
                  <XCircle className="size-3.5" />
                  <span>Rechazada</span>
                </Badge>
              ) : (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-bold gap-1">
                  <Clock className="size-3.5" />
                  <span>Pendiente por Dictaminar</span>
                </Badge>
              )}
            </h1>
          </div>
        </div>

        {/* Global Resolution CTA Buttons */}
        <div className="flex flex-wrap items-center gap-2 justify-end shrink-0">
          <Button
            onClick={() => handleResolution("rejected")}
            disabled={submitting}
            variant="destructive"
            size="sm"
            className="h-10 px-4 rounded-xl text-xs font-bold cursor-pointer"
          >
            Rechazar
          </Button>

          <Button
            onClick={() => handleResolution("requires_revision")}
            disabled={submitting}
            size="sm"
            className="h-10 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs"
          >
            Solicitar Corrección
          </Button>

          <Button
            onClick={() => handleResolution("approved")}
            disabled={submitting}
            size="sm"
            className="h-10 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer shadow-xs"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            <span>Aprobar y Otorgar Sello</span>
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Fiscal Data, Legal Rep & Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Identity & Legal Information Card */}
          <Card className="bg-card border border-border/60 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3.5 pb-4 border-b border-border/50">
              <div className="size-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-extrabold border border-purple-500/20 shrink-0">
                <Building2 className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-extrabold text-foreground truncate">
                  {company.companyName}
                </h3>
                <p className="text-xs text-muted-foreground font-medium truncate">
                  {company.legalName || "Persona Moral / Razón Social"}
                </p>
              </div>
            </div>

            {/* Fiscal Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  RFC Registrado
                </span>
                <p className="font-mono font-extrabold text-foreground text-sm truncate">
                  {company.rfc}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Giro / Industria
                </span>
                <p className="font-bold text-foreground truncate">
                  {company.industry}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Representante Legal
                </span>
                <p className="font-bold text-foreground truncate">
                  {company.legalRepName || "No especificado"}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Tamaño de Empresa
                </span>
                <p className="font-bold text-foreground truncate">
                  {company.companySize || "Pyme"}
                </p>
              </div>
            </div>

            {/* Address & Hours */}
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/40 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Domicilio Fiscal</span>
                  <p className="font-medium text-foreground leading-relaxed">
                    {company.fiscalAddress || company.addressDetails || "Sureste de México"}
                  </p>
                </div>
              </div>

              {company.websiteUrl && (
                <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                  <Globe className="size-3.5 text-muted-foreground shrink-0" />
                  <a
                    href={company.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:underline truncate inline-flex items-center gap-1"
                  >
                    <span>{company.websiteUrl}</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Direct Contact Options */}
            <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Contacto</span>
                <p className="font-semibold text-foreground truncate">{company.contactEmail}</p>
                <p className="font-mono text-muted-foreground text-[11px]">{company.contactPhone}</p>
              </div>

              <div className="flex items-center gap-1.5">
                {company.contactPhone && (
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366]/10 text-[#062c1e] dark:text-[#25D366] font-bold text-xs hover:bg-[#25D366]/20 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="size-3.5 stroke-[2.5]" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {company.contactPhone && (
                  <a
                    href={`tel:${company.contactPhone}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground transition-colors"
                  >
                    <Phone className="size-3 text-muted-foreground" />
                    <span>Llamar</span>
                  </a>
                )}
              </div>
            </div>
          </Card>

          {/* Checklist del Auditor */}
          <Card className="bg-card border border-border/60 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CheckSquare className="size-4 text-primary" />
              <span>Lista de Cotejo del Auditor</span>
            </h4>

            <div className="space-y-2.5 text-xs font-medium">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer">
                <Checkbox
                  checked={checkRfcValid}
                  onCheckedChange={(checked) => setCheckRfcValid(!!checked)}
                  className="mt-0.5"
                />
                <span className="leading-snug">
                  RFC coincide plenamente con la Constancia de Situación Fiscal y Razón Social SAT.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer">
                <Checkbox
                  checked={checkAddressValid}
                  onCheckedChange={(checked) => setCheckAddressValid(!!checked)}
                  className="mt-0.5"
                />
                <span className="leading-snug">
                  Domicilio fiscal comprobable en el sureste de México con vigencia menor a 3 meses.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer">
                <Checkbox
                  checked={checkIdValid}
                  onCheckedChange={(checked) => setCheckIdValid(!!checked)}
                  className="mt-0.5"
                />
                <span className="leading-snug">
                  Identificación oficial INE/Pasaporte del Representante Legal validada y vigente.
                </span>
              </label>
            </div>
          </Card>

          {/* Observaciones del Dictamen */}
          <Card className="bg-card border border-border/60 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="audit_notes" className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Observaciones del Dictamen
              </Label>
              <span className="text-[11px] text-muted-foreground font-semibold">
                Se adjunta en la notificación
              </span>
            </div>

            <Textarea
              id="audit_notes"
              value={auditNotes}
              onChange={(e) => setAuditNotes(e.target.value)}
              placeholder="Escribe notas sobre documentos validados, observaciones de corrección o inconsistencias..."
              className="min-h-[100px] rounded-2xl bg-muted/30 border-border/60 text-xs sm:text-sm font-medium"
            />
          </Card>
        </div>

        {/* Right Column: Digital Dossier & Clean Document Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          <Card className="bg-card border border-border/60 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/50">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  <span>Expediente Documental ({company.dbUploadedDocuments.length} archivos)</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {approvedDocsCount} de {company.dbUploadedDocuments.length} documentos validados por staff
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-muted/40 text-xs font-bold px-2.5 py-1 rounded-xl">
                  {company.dbUploadedDocuments.length} cargados
                </Badge>
              </div>
            </div>

            {/* Documents List */}
            {company.dbUploadedDocuments.length === 0 ? (
              <div className="p-12 text-center bg-muted/20 rounded-3xl border border-dashed border-border/60 space-y-2">
                <FileText className="size-10 mx-auto text-muted-foreground/30" />
                <p className="text-sm font-bold text-foreground">
                  Sin documentos adjuntos
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  La empresa aún no ha subido los archivos requeridos para la verificación fiscal y legal.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {company.dbUploadedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 sm:p-5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <FileCheck className="size-5" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-extrabold text-foreground truncate">
                            {formatDocTypeLabel(doc.docType)}
                          </h4>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0.5 font-bold rounded-lg shrink-0 border",
                              doc.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : doc.status === "rejected"
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            )}
                          >
                            {doc.status === "approved"
                              ? "Aprobado"
                              : doc.status === "rejected"
                              ? "Rechazado"
                              : "Por Revisar"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {doc.fileName} • {doc.createdAt}
                        </p>
                      </div>
                    </div>

                    {/* Actions Group */}
                    <div className="flex items-center gap-2 justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
                      {doc.fileUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModalDoc(doc)}
                          className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 cursor-pointer bg-card hover:bg-muted shadow-none border-border/60"
                        >
                          <Eye className="size-3.5 text-primary" />
                          <span>Ver en Modal</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant={doc.status === "approved" ? "default" : "outline"}
                        disabled={updatingDocId === doc.id}
                        onClick={() => handleReviewDoc(doc.id, "approved")}
                        className={cn(
                          "h-9 px-3 rounded-xl text-xs font-bold gap-1 cursor-pointer",
                          doc.status === "approved" && "bg-emerald-600 text-white hover:bg-emerald-700"
                        )}
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Aprobar</span>
                      </Button>

                      <Button
                        size="sm"
                        variant={doc.status === "rejected" ? "destructive" : "outline"}
                        disabled={updatingDocId === doc.id}
                        onClick={() => handleReviewDoc(doc.id, "rejected")}
                        className="h-9 px-3 rounded-xl text-xs font-bold gap-1 cursor-pointer"
                      >
                        <XCircle className="size-3.5" />
                        <span>Rechazar</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal Lightbox: Full PDF & Image Document Viewer */}
      {modalDoc && (
        <Dialog open={!!modalDoc} onOpenChange={() => setModalDoc(null)}>
          <DialogContent
            showCloseButton={false}
            className="w-[96vw] max-w-[96vw] sm:max-w-[94vw] md:max-w-[92vw] lg:max-w-[90vw] xl:max-w-[1350px] h-[92vh] max-h-[95vh] rounded-3xl border-border/60 bg-card p-4 sm:p-6 flex flex-col gap-3.5 overflow-hidden shadow-2xl"
          >
            {/* Modal Header Bar */}
            <div className="border-b border-border/50 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-2 py-0.5 font-bold rounded-lg shrink-0 border",
                      modalDoc.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : modalDoc.status === "rejected"
                        ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}
                  >
                    {modalDoc.status === "approved"
                      ? "Aprobado"
                      : modalDoc.status === "rejected"
                      ? "Rechazado"
                      : "Por Revisar"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono truncate">{modalDoc.fileName}</span>
                </div>
                <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground truncate mt-0.5">
                  {formatDocTypeLabel(modalDoc.docType)}
                </DialogTitle>
              </div>

              {/* Action buttons inside the modal header */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {modalDoc.fileUrl && (
                  <a
                    href={modalDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground transition-colors cursor-pointer shadow-2xs"
                  >
                    <ExternalLink className="size-3.5 text-primary" />
                    <span>Abrir en Pestaña</span>
                  </a>
                )}

                {modalDoc.fileUrl && (
                  <a
                    href={modalDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={modalDoc.fileName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download className="size-3.5 text-primary" />
                    <span className="hidden sm:inline">Descargar</span>
                  </a>
                )}

                <Button
                  size="sm"
                  variant={modalDoc.status === "approved" ? "default" : "outline"}
                  disabled={updatingDocId === modalDoc.id}
                  onClick={() => handleReviewDoc(modalDoc.id, "approved")}
                  className={cn(
                    "h-8 px-3 rounded-xl text-xs font-bold gap-1 cursor-pointer",
                    modalDoc.status === "approved" && "bg-emerald-600 text-white hover:bg-emerald-700"
                  )}
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Aprobar</span>
                </Button>

                <Button
                  size="sm"
                  variant={modalDoc.status === "rejected" ? "destructive" : "outline"}
                  disabled={updatingDocId === modalDoc.id}
                  onClick={() => handleReviewDoc(modalDoc.id, "rejected")}
                  className="h-8 px-3 rounded-xl text-xs font-bold gap-1 cursor-pointer"
                >
                  <XCircle className="size-3.5" />
                  <span>Rechazar</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalDoc(null)}
                  className="size-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Modal Body: High Resolution Iframe / Object / Image */}
            <div className="flex-1 w-full h-full min-h-0 bg-muted/15 rounded-2xl border border-border/40 overflow-hidden flex flex-col items-center justify-center p-1 relative">
              {modalDoc.fileName.toLowerCase().endsWith(".pdf") ||
              modalDoc.fileUrl.toLowerCase().includes(".pdf") ||
              modalDoc.fileName.toLowerCase().includes("pdf") ? (
                <object
                  data={modalDoc.fileUrl}
                  type="application/pdf"
                  className="w-full h-full min-h-0 rounded-xl"
                >
                  <iframe
                    src={modalDoc.fileUrl}
                    className="w-full h-full min-h-0 rounded-xl border-none bg-white"
                    title={modalDoc.fileName}
                  />
                </object>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                  <img
                    src={modalDoc.fileUrl}
                    alt={modalDoc.fileName}
                    className="max-h-full max-w-full rounded-xl object-contain shadow-xs"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
