"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type PendingCompanyItem,
  type PendingCandidateItem,
  reviewCompanyVerification,
  reviewCandidateVerification,
  reviewProfileDocument,
} from "./actions";
import {
  BadgeCheckIcon,
  Building2Icon,
  UserIcon,
  SearchIcon,
  ExternalLinkIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  Loader2Icon,
  EyeIcon,
  FileCheckIcon,
  FileTextIcon,
  DownloadIcon,
  PhoneIcon,
  ShieldCheckIcon,
  DatabaseIcon,
} from "lucide-react";

interface VerificationWorkbenchProps {
  initialCompanies: PendingCompanyItem[];
  initialCandidates: PendingCandidateItem[];
}

export function VerificationWorkbenchClient({
  initialCompanies,
  initialCandidates,
}: VerificationWorkbenchProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"companies" | "candidates">("companies");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Inspection Modal States
  const [inspectCompany, setInspectCompany] = React.useState<PendingCompanyItem | null>(null);
  const [inspectCandidate, setInspectCandidate] = React.useState<PendingCandidateItem | null>(null);
  const [auditNotes, setAuditNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Document Viewer Modal State
  const [activeDocPreview, setActiveDocPreview] = React.useState<{ title: string; url: string } | null>(null);

  // Checklist Validation States
  const [checkRfcValid, setCheckRfcValid] = React.useState(false);
  const [checkAddressValid, setCheckAddressValid] = React.useState(false);
  const [checkIdValid, setCheckIdValid] = React.useState(false);

  const handleOpenCompanyInspect = (item: PendingCompanyItem) => {
    setInspectCompany(item);
    setAuditNotes("");
    setCheckRfcValid(item.isVerified);
    setCheckAddressValid(item.isVerified);
    setCheckIdValid(item.isVerified);
  };

  const handleOpenCandidateInspect = (item: PendingCandidateItem) => {
    setInspectCandidate(item);
    setAuditNotes("");
  };

  const formatDocTypeLabel = (docType: string) => {
    switch (docType) {
      case "constancia_situacion_fiscal":
        return "Constancia RFC (SAT)";
      case "legal_rep_id":
        return "Identificación INE Rep. Legal";
      case "acta_constitutiva":
        return "Acta Constitutiva";
      case "legal_power":
        return "Poder Notarial / Registro Patronal";
      case "cedula_profesional":
        return "Cédula SEP";
      case "cv":
        return "Curriculum Vitae";
      case "ine":
        return "INE / Identificación";
      case "curp":
        return "Documento CURP";
      default:
        return docType.replace(/_/g, " ").toUpperCase();
    }
  };

  // Helper to check if file is an image
  const isImageFile = React.useMemo(() => {
    if (!activeDocPreview?.url) return false;
    const cleanUrl = activeDocPreview.url.toLowerCase();
    return (
      cleanUrl.endsWith(".jpg") ||
      cleanUrl.endsWith(".jpeg") ||
      cleanUrl.endsWith(".png") ||
      cleanUrl.endsWith(".webp") ||
      cleanUrl.endsWith(".gif") ||
      cleanUrl.startsWith("data:image/")
    );
  }, [activeDocPreview]);

  // Filtered lists
  const filteredCompanies = React.useMemo(() => {
    if (!searchQuery.trim()) return initialCompanies;
    const q = searchQuery.toLowerCase();
    return initialCompanies.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.rfc.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q) ||
        (c.legalName && c.legalName.toLowerCase().includes(q))
    );
  }, [initialCompanies, searchQuery]);

  const filteredCandidates = React.useMemo(() => {
    if (!searchQuery.trim()) return initialCandidates;
    const q = searchQuery.toLowerCase();
    return initialCandidates.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.cedulaProfesional && c.cedulaProfesional.toLowerCase().includes(q))
    );
  }, [initialCandidates, searchQuery]);

  // Company Dictamen Handler
  const handleCompanyDictamen = async (status: "approved" | "rejected" | "requires_revision") => {
    if (!inspectCompany) return;
    setSubmitting(true);

    try {
      await reviewCompanyVerification(inspectCompany.id, status, auditNotes);
      toast.success(
        status === "approved"
          ? `Empresa ${inspectCompany.companyName} verificada exitosamente con insignia otorgada.`
          : status === "requires_revision"
          ? `Notificación de subsanación enviada a ${inspectCompany.companyName}.`
          : `Dictamen de verificación rechazado para ${inspectCompany.companyName}.`
      );
      setInspectCompany(null);
      setAuditNotes("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al aplicar dictamen.");
    } finally {
      setSubmitting(false);
    }
  };

  // Candidate Dictamen Handler
  const handleCandidateDictamen = async (isVerified: boolean) => {
    if (!inspectCandidate) return;
    setSubmitting(true);

    try {
      await reviewCandidateVerification(inspectCandidate.id, isVerified, auditNotes);
      toast.success(
        isVerified
          ? `Expediente de ${inspectCandidate.fullName} verificado con éxito.`
          : `Estado de verificación actualizado para ${inspectCandidate.fullName}.`
      );
      setInspectCandidate(null);
      setAuditNotes("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al aplicar dictamen.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentDictamen = async (documentId: string, status: "approved" | "rejected") => {
    setSubmitting(true);
    try {
      await reviewProfileDocument(documentId, status, auditNotes);
      toast.success(status === "approved" ? "Documento aprobado." : "Documento rechazado y devuelto al titular.");
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "No se pudo dictaminar el documento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/20 shadow-xs">
        
        {/* Custom Tab Switcher */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "companies" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("companies")}
            className="h-9 px-4 text-xs font-semibold gap-2 rounded-lg"
          >
            <Building2Icon className="size-4" />
            <span>Empresas ({initialCompanies.length})</span>
          </Button>

          <Button
            variant={activeTab === "candidates" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("candidates")}
            className="h-9 px-4 text-xs font-semibold gap-2 rounded-lg"
          >
            <UserIcon className="size-4" />
            <span>Candidatos ({initialCandidates.length})</span>
          </Button>
        </div>

        {/* Search Input Filter */}
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === "companies"
                ? "Buscar por empresa, RFC o correo..."
                : "Buscar por candidato, cédula o correo..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-lg"
          />
        </div>
      </div>

      {/* TAB 1: EMPRESAS TABLE */}
      {activeTab === "companies" && (
        <Card className="border border-border/20 bg-card p-6 shadow-xs rounded-xl">
          <CardHeader className="p-0 pb-4 border-b border-border/15">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2Icon className="size-4 text-muted-foreground" />
              <span>Auditoría de Expedientes Fiscales de Empresas</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Revise los documentos adjuntados por las empresas en la tabla profile_documents de Supabase.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 pt-4">
            <div className="overflow-hidden rounded-lg border border-border/20">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Empresa / RFC</TableHead>
                    <TableHead className="text-xs font-semibold">Giro / Industria</TableHead>
                    <TableHead className="text-xs font-semibold">Archivos en BD</TableHead>
                    <TableHead className="text-xs font-semibold">Estado Dictamen</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Acción de Auditoría</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                        No se encontraron expedientes empresariales para revisar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                              {item.companyName}
                              {item.isVerified && (
                                <BadgeCheckIcon className="size-3.5 text-blue-500 fill-blue-500/10" />
                              )}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              RFC: {item.rfc}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-foreground font-medium">
                          {item.industry}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[10px] gap-1 font-mono bg-purple-500/5 text-purple-600 border-purple-500/20">
                            <DatabaseIcon className="size-3 text-purple-600" />
                            <span>{item.dbUploadedDocuments.length} Archivo(s) en BD</span>
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {item.isVerified ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                              ✓ Empresa Verificada
                            </Badge>
                          ) : item.verificationStatus === "requires_revision" ? (
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">
                              ⚠️ Subsanación Requerida
                            </Badge>
                          ) : item.verificationStatus === "rejected" ? (
                            <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[10px]">
                              ✕ Rechazada
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]">
                              ⏳ Pendiente de Auditoría
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCompanyInspect(item)}
                            className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-purple-500/30 text-purple-600 hover:bg-purple-500/10 cursor-pointer"
                          >
                            <EyeIcon className="size-3.5" />
                            <span>Inspeccionar Expediente</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: CANDIDATOS TABLE */}
      {activeTab === "candidates" && (
        <Card className="border border-border/20 bg-card p-6 shadow-xs rounded-xl">
          <CardHeader className="p-0 pb-4 border-b border-border/15">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UserIcon className="size-4 text-muted-foreground" />
              <span>Auditoría de Expedientes Digitales de Candidatos</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Verifique Cédulas Profesionales, CURP, INE y CVs cargados directamente en la base de datos.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 pt-4">
            <div className="overflow-hidden rounded-lg border border-border/20">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Candidato / Especialidad</TableHead>
                    <TableHead className="text-xs font-semibold">Tipo de Perfil</TableHead>
                    <TableHead className="text-xs font-semibold">Documentos BD</TableHead>
                    <TableHead className="text-xs font-semibold">Estado Expediente</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Acción de Auditoría</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                        No se encontraron expedientes de candidatos para revisar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCandidates.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                              {item.fullName}
                              {item.isVerified && (
                                <BadgeCheckIcon className="size-3.5 text-blue-500 fill-blue-500/10" />
                              )}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {item.email}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-foreground font-medium capitalize">
                          {item.candidateType}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[10px] gap-1 font-mono bg-purple-500/5 text-purple-600 border-purple-500/20">
                            <DatabaseIcon className="size-3 text-purple-600" />
                            <span>{item.dbUploadedDocuments.length} Archivo(s) en BD</span>
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {item.isVerified ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                              ✓ Expediente Verificado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">
                              ⏳ Por Validar
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCandidateInspect(item)}
                            className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-purple-500/30 text-purple-600 hover:bg-purple-500/10 cursor-pointer"
                          >
                            <FileCheckIcon className="size-3.5" />
                            <span>Inspeccionar Expediente</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ULTRA-SPACIOUS ERGONOMIC INSPECTION WORKBENCH: COMPANY */}
      {inspectCompany && (
        <Dialog open={!!inspectCompany} onOpenChange={(open) => !open && setInspectCompany(null)}>
          <DialogContent className="sm:max-w-[800px] md:max-w-[950px] lg:max-w-[1120px] w-[95vw] h-[88vh] max-h-[900px] flex flex-col p-0 rounded-2xl overflow-hidden shadow-2xl border border-border/20">
            
            {/* Header */}
            <DialogHeader className="p-5 px-6 border-b border-border/15 bg-card flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Building2Icon className="size-6 text-purple-600" />
                </div>
                <div className="flex flex-col">
                  <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span>{inspectCompany.companyName}</span>
                    {inspectCompany.isVerified ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] px-2 py-0.5">
                        ✓ Empresa Verificada
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[11px] px-2 py-0.5">
                        ⏳ En Proceso de Auditoría
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>RFC: <strong className="font-mono text-foreground">{inspectCompany.rfc}</strong></span>
                    <span>•</span>
                    <span>Documentos en BD: <strong className="font-mono text-purple-600">{inspectCompany.dbUploadedDocuments.length} cargados</strong></span>
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 pr-6">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                >
                  <a
                    href={`https://wa.me/${inspectCompany.contactPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PhoneIcon className="size-3.5" />
                    <span>WhatsApp Directo</span>
                  </a>
                </Button>
              </div>
            </DialogHeader>

            {/* Main Workbench 2-Column Container */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-muted/10">
              
              {/* Left Column (8 Cols): Spacious Tabbed Inspection (Documentos vs Ficha) */}
              <div className="lg:col-span-7 xl:col-span-8 p-6 overflow-y-auto flex flex-col gap-5 border-r border-border/15 bg-card">
                
                <Tabs defaultValue="documents" className="w-full flex flex-col gap-4">
                  <TabsList className="w-fit bg-muted/50 p-1 h-9 rounded-lg border border-border/20">
                    <TabsTrigger value="documents" className="text-xs font-semibold px-4 gap-2 rounded-md">
                      <DatabaseIcon className="size-3.5 text-purple-600" />
                      <span>Documentos Oficiales en BD ({inspectCompany.dbUploadedDocuments.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="text-xs font-semibold px-4 gap-2 rounded-md">
                      <Building2Icon className="size-3.5 text-blue-600" />
                      <span>Ficha Completa de Información</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB CONTENT A: 4 OFFICIAL VERIFICATION DOCUMENTS FROM SUPABASE */}
                  <TabsContent value="documents" className="flex flex-col gap-4 mt-0">
                    
                    {/* Render Real DB Documents if uploaded via profile_documents */}
                    {inspectCompany.dbUploadedDocuments.length > 0 && (
                      <div className="flex flex-col gap-3 pb-2 border-b border-border/15">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <DatabaseIcon className="size-3.5 text-purple-600" />
                          <span>Archivos Registrados en la Base de Datos (`profile_documents`):</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {inspectCompany.dbUploadedDocuments.map((doc) => (
                            <div key={doc.id} className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 flex flex-col justify-between gap-3 shadow-xs">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-bold text-foreground truncate max-w-[200px]">{doc.fileName}</span>
                                  <span className="text-[11px] font-semibold text-purple-600 capitalize">
                                    {formatDocTypeLabel(doc.docType)}
                                  </span>
                                </div>
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                  ✓ BD Supabase
                                </Badge>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setActiveDocPreview({
                                    title: `${formatDocTypeLabel(doc.docType)} - ${doc.fileName}`,
                                    url: doc.fileUrl,
                                  })
                                }
                                className="h-8 text-xs font-semibold gap-1.5 w-full border-purple-500/30 text-purple-600 hover:bg-purple-500/10 cursor-pointer"
                              >
                                <EyeIcon className="size-3.5" />
                                <span>Abrir en Visor Integrado</span>
                              </Button>
                              <div className="grid grid-cols-2 gap-2">
                                <Button disabled={submitting || doc.status === "approved"} size="sm" onClick={() => handleDocumentDictamen(doc.id, "approved")} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
                                  Aprobar
                                </Button>
                                <Button disabled={submitting || doc.status === "rejected"} variant="outline" size="sm" onClick={() => handleDocumentDictamen(doc.id, "rejected")} className="h-8 text-xs text-rose-600">
                                  Rechazar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Standard Verification Slots */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* 1. RFC Constancia */}
                      <div className="p-4 rounded-xl border border-border/30 bg-muted/20 flex flex-col justify-between gap-3 shadow-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-foreground">Constancia de Situación Fiscal (RFC)</span>
                            <span className="text-[11px] font-mono text-muted-foreground">RFC: {inspectCompany.rfc}</span>
                          </div>
                          {inspectCompany.documents.rfcConstanciaUrl ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                              ✓ Cargado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                              ⚠️ Pendiente
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!inspectCompany.documents.rfcConstanciaUrl}
                          onClick={() =>
                            inspectCompany.documents.rfcConstanciaUrl &&
                            setActiveDocPreview({
                              title: `Constancia RFC - ${inspectCompany.companyName}`,
                              url: inspectCompany.documents.rfcConstanciaUrl,
                            })
                          }
                          className="h-8 text-xs font-semibold gap-1.5 w-full border-purple-500/30 text-purple-600 hover:bg-purple-500/10 cursor-pointer disabled:opacity-50"
                        >
                          <EyeIcon className="size-3.5" />
                          <span>{inspectCompany.documents.rfcConstanciaUrl ? "Abrir en Visor Integrado" : "No Subido por Empresa"}</span>
                        </Button>
                      </div>

                      {/* 2. INE Rep Legal */}
                      <div className="p-4 rounded-xl border border-border/30 bg-muted/20 flex flex-col justify-between gap-3 shadow-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-foreground">Identificación Representante Legal</span>
                            <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                              {inspectCompany.legalRepName || "Representante Legal"}
                            </span>
                          </div>
                          {inspectCompany.documents.legalRepIdUrl ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                              ✓ Cargado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                              ⚠️ Pendiente
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!inspectCompany.documents.legalRepIdUrl}
                          onClick={() =>
                            inspectCompany.documents.legalRepIdUrl &&
                            setActiveDocPreview({
                              title: `INE Representante Legal - ${inspectCompany.companyName}`,
                              url: inspectCompany.documents.legalRepIdUrl,
                            })
                          }
                          className="h-8 text-xs font-semibold gap-1.5 w-full cursor-pointer disabled:opacity-50"
                        >
                          <EyeIcon className="size-3.5 text-blue-600" />
                          <span>{inspectCompany.documents.legalRepIdUrl ? "Abrir Identificación" : "No Subido por Empresa"}</span>
                        </Button>
                      </div>

                      {/* 3. Acta Constitutiva */}
                      <div className="p-4 rounded-xl border border-border/30 bg-muted/20 flex flex-col justify-between gap-3 shadow-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-foreground">Acta Constitutiva de la Empresa</span>
                            <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                              {inspectCompany.legalName || inspectCompany.companyName}
                            </span>
                          </div>
                          {inspectCompany.documents.actaConstitutivaUrl ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                              ✓ Cargado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                              ⚠️ Pendiente
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!inspectCompany.documents.actaConstitutivaUrl}
                          onClick={() =>
                            inspectCompany.documents.actaConstitutivaUrl &&
                            setActiveDocPreview({
                              title: `Acta Constitutiva - ${inspectCompany.companyName}`,
                              url: inspectCompany.documents.actaConstitutivaUrl,
                            })
                          }
                          className="h-8 text-xs font-semibold gap-1.5 w-full cursor-pointer disabled:opacity-50"
                        >
                          <EyeIcon className="size-3.5 text-emerald-600" />
                          <span>{inspectCompany.documents.actaConstitutivaUrl ? "Abrir Acta Constitutiva" : "No Subido por Empresa"}</span>
                        </Button>
                      </div>

                      {/* 4. Poder Notarial / IMSS */}
                      <div className="p-4 rounded-xl border border-border/30 bg-muted/20 flex flex-col justify-between gap-3 shadow-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-foreground">Poder Notarial / Registro Patronal</span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {inspectCompany.imssPatronalRegistry || "Reg. Patronal"}
                            </span>
                          </div>
                          {inspectCompany.documents.imssRegistryUrl ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                              ✓ Cargado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                              ⚠️ Pendiente
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!inspectCompany.documents.imssRegistryUrl}
                          onClick={() =>
                            inspectCompany.documents.imssRegistryUrl &&
                            setActiveDocPreview({
                              title: `Poder Notarial / Registro IMSS - ${inspectCompany.companyName}`,
                              url: inspectCompany.documents.imssRegistryUrl,
                            })
                          }
                          className="h-8 text-xs font-semibold gap-1.5 w-full cursor-pointer disabled:opacity-50"
                        >
                          <EyeIcon className="size-3.5 text-amber-600" />
                          <span>{inspectCompany.documents.imssRegistryUrl ? "Abrir Registro / Poder" : "No Subido por Empresa"}</span>
                        </Button>
                      </div>

                    </div>

                  </TabsContent>

                  {/* TAB CONTENT B: FULL PROFILE DATA */}
                  <TabsContent value="profile" className="flex flex-col gap-4 mt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      
                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/20 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Razón Social Registrada</span>
                        <span className="font-semibold text-foreground text-sm">{inspectCompany.legalName || inspectCompany.companyName}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/20 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">RFC Oficial SAT</span>
                        <span className="font-mono font-bold text-foreground text-sm">{inspectCompany.rfc}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/20 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Giro / Industria</span>
                        <span className="font-medium text-foreground text-xs">{inspectCompany.industry}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/20 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Tamaño de Empresa</span>
                        <span className="font-medium text-foreground text-xs">{inspectCompany.companySize || "1-10 Empleados"}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/20 flex flex-col gap-1 sm:col-span-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Domicilio Fiscal Completo</span>
                        <span className="font-medium text-foreground text-xs">{inspectCompany.fiscalAddress || inspectCompany.addressDetails || "Mérida, Yucatán"}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/20 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Correo Corporativo</span>
                        <span className="font-semibold text-foreground text-xs">{inspectCompany.contactEmail}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/20 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Teléfono de Contacto</span>
                        <span className="font-mono font-semibold text-foreground text-xs">{inspectCompany.contactPhone}</span>
                      </div>

                    </div>
                  </TabsContent>
                </Tabs>

              </div>

              {/* Right Column (4 Cols): Fixed Dictamen Audit Panel */}
              <div className="lg:col-span-5 xl:col-span-4 p-6 flex flex-col justify-between gap-5 bg-card">
                
                <div className="flex flex-col gap-4">
                  
                  {/* Checklist Section */}
                  <div className="flex flex-col gap-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheckIcon className="size-4 text-purple-600" />
                      <span>Checklist de Validación Manual</span>
                    </h4>

                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/25 bg-muted/20 cursor-pointer text-xs font-semibold hover:bg-muted/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={checkRfcValid}
                          onChange={(e) => setCheckRfcValid(e.target.checked)}
                          className="size-4 rounded accent-purple-600"
                        />
                        <span>Constancia RFC y Razón Social Válidos</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/25 bg-muted/20 cursor-pointer text-xs font-semibold hover:bg-muted/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={checkAddressValid}
                          onChange={(e) => setCheckAddressValid(e.target.checked)}
                          className="size-4 rounded accent-purple-600"
                        />
                        <span>Domicilio Fiscal Verificado en Yucatán</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/25 bg-muted/20 cursor-pointer text-xs font-semibold hover:bg-muted/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={checkIdValid}
                          onChange={(e) => setCheckIdValid(e.target.checked)}
                          className="size-4 rounded accent-purple-600"
                        />
                        <span>Identificación de Rep. Legal Vigente</span>
                      </label>
                    </div>
                  </div>

                  {/* Dictamen Observaciones */}
                  <div className="flex flex-col gap-2 pt-1">
                    <label className="text-xs font-bold text-foreground">
                      Observaciones del Dictamen:
                    </label>
                    <Textarea
                      placeholder="Escriba aquí los comentarios de aprobación o las observaciones que el usuario recibirá si requiere subsanar..."
                      value={auditNotes}
                      onChange={(e) => setAuditNotes(e.target.value)}
                      className="text-xs min-h-[120px] rounded-xl"
                    />
                  </div>

                </div>

                {/* Dictamen Footer Action Buttons */}
                <div className="flex flex-col gap-2.5 border-t border-border/15 pt-4">
                  <Button
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleCompanyDictamen("approved")}
                    className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs gap-2 cursor-pointer"
                  >
                    {submitting ? <Loader2Icon className="size-4 animate-spin" /> : <CheckCircle2Icon className="size-4" />}
                    <span>Aprobar y Otorgar Badge Verificado</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleCompanyDictamen("requires_revision")}
                    className="h-9 text-xs font-semibold text-amber-600 border-amber-500/30 hover:bg-amber-500/10 rounded-xl gap-2 cursor-pointer"
                  >
                    <AlertTriangleIcon className="size-4" />
                    <span>Notificar Subsanación Requerida</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleCompanyDictamen("rejected")}
                    className="h-9 text-xs font-semibold text-red-600 hover:bg-red-500/10 rounded-xl gap-2 cursor-pointer"
                  >
                    <XCircleIcon className="size-4" />
                    <span>Rechazar Documentación</span>
                  </Button>
                </div>

              </div>

            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ULTRA-SPACIOUS ERGONOMIC INSPECTION WORKBENCH: CANDIDATE */}
      {inspectCandidate && (
        <Dialog open={!!inspectCandidate} onOpenChange={(open) => !open && setInspectCandidate(null)}>
          <DialogContent className="sm:max-w-[800px] md:max-w-[950px] lg:max-w-[1120px] w-[95vw] h-[88vh] max-h-[900px] flex flex-col p-0 rounded-2xl overflow-hidden shadow-2xl border border-border/20">
            
            {/* Header */}
            <DialogHeader className="p-5 px-6 border-b border-border/15 bg-card flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <UserIcon className="size-6 text-purple-600" />
                </div>
                <div className="flex flex-col">
                  <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span>{inspectCandidate.fullName}</span>
                    {inspectCandidate.isVerified ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] px-2 py-0.5">
                        ✓ Expediente Verificado
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[11px] px-2 py-0.5">
                        ⏳ Por Validar
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>Perfil: <strong className="capitalize text-foreground">{inspectCandidate.candidateType}</strong></span>
                    <span>•</span>
                    <span>Documentos en BD: <strong className="font-mono text-purple-600">{inspectCandidate.dbUploadedDocuments.length} cargados</strong></span>
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 pr-6">
                {inspectCandidate.cedulaProfesional && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-purple-500/30 text-purple-600"
                  >
                    <a
                      href="https://cedulaprofesional.sep.gob.mx/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLinkIcon className="size-3.5" />
                      <span>Validar Cédula SEP</span>
                    </a>
                  </Button>
                )}
              </div>
            </DialogHeader>

            {/* Main Workbench 2-Column Container */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-muted/10">
              
              {/* Left Column (8 Cols): Uploaded Files & Professional File */}
              <div className="lg:col-span-7 xl:col-span-8 p-6 overflow-y-auto flex flex-col gap-5 border-r border-border/15 bg-card">
                
                <Tabs defaultValue="documents" className="w-full flex flex-col gap-4">
                  <TabsList className="w-fit bg-muted/50 p-1 h-9 rounded-lg border border-border/20">
                    <TabsTrigger value="documents" className="text-xs font-semibold px-4 gap-2 rounded-md">
                      <DatabaseIcon className="size-3.5 text-purple-600" />
                      <span>Archivos en BD ({inspectCandidate.dbUploadedDocuments.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="text-xs font-semibold px-4 gap-2 rounded-md">
                      <UserIcon className="size-3.5 text-blue-600" />
                      <span>Ficha de Perfil del Candidato</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB CONTENT A: CANDIDATE FILES FROM PROFILE_DOCUMENTS */}
                  <TabsContent value="documents" className="flex flex-col gap-4 mt-0">
                    {inspectCandidate.dbUploadedDocuments.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {inspectCandidate.dbUploadedDocuments.map((doc) => (
                          <div key={doc.id} className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 flex flex-col justify-between gap-3 shadow-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-foreground">{doc.fileName}</span>
                                <span className="text-[11px] font-medium text-purple-600 capitalize">
                                  {formatDocTypeLabel(doc.docType)}
                                </span>
                              </div>
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] capitalize">
                                {doc.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setActiveDocPreview({
                                    title: `${formatDocTypeLabel(doc.docType)} - ${doc.fileName}`,
                                    url: doc.fileUrl,
                                  })
                                }
                                className="h-8 text-xs font-semibold gap-1.5 w-full border-purple-500/30 text-purple-600 hover:bg-purple-500/10 cursor-pointer"
                              >
                                <EyeIcon className="size-3.5" />
                                <span>Abrir en Visor Integrado</span>
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button disabled={submitting || doc.status === "approved"} size="sm" onClick={() => handleDocumentDictamen(doc.id, "approved")} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
                                Aprobar
                              </Button>
                              <Button disabled={submitting || doc.status === "rejected"} variant="outline" size="sm" onClick={() => handleDocumentDictamen(doc.id, "rejected")} className="h-8 text-xs text-rose-600">
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Standard Slots Fallback */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* CV PDF */}
                        <div className="p-4 rounded-xl border border-border/30 bg-muted/20 flex flex-col justify-between gap-3 shadow-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-foreground">Curriculum Vitae (CV)</span>
                              <span className="text-[11px] text-muted-foreground">Documento PDF Oficial</span>
                            </div>
                            <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px]">
                              CV PDF
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setActiveDocPreview({
                                title: `CV - ${inspectCandidate.fullName}`,
                                url: inspectCandidate.documents.cvUrl || "/sample-cv.pdf",
                              })
                            }
                            className="h-8 text-xs font-semibold gap-1.5 w-full border-purple-500/30 text-purple-600 hover:bg-purple-500/10 cursor-pointer"
                          >
                            <EyeIcon className="size-3.5" />
                            <span>Abrir CV PDF</span>
                          </Button>
                        </div>

                        {/* Cédula Profesional */}
                        <div className="p-4 rounded-xl border border-border/30 bg-muted/20 flex flex-col justify-between gap-3 shadow-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-foreground">Cédula Profesional</span>
                              <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                                {inspectCandidate.cedulaProfesional || "Sin cédula registrada"}
                              </span>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                              SEP
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setActiveDocPreview({
                                title: `Cédula Profesional - ${inspectCandidate.fullName}`,
                                url: inspectCandidate.documents.cedulaUrl || "/sample-cedula.pdf",
                              })
                            }
                            className="h-8 text-xs font-semibold gap-1.5 w-full cursor-pointer"
                          >
                            <EyeIcon className="size-3.5 text-emerald-600" />
                            <span>Abrir Cédula</span>
                          </Button>
                        </div>

                        {/* INE / CURP */}
                        <div className="p-4 rounded-xl border border-border/30 bg-muted/20 flex flex-col justify-between gap-3 shadow-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-foreground">Identificación INE / CURP</span>
                              <span className="text-[11px] font-mono text-muted-foreground">
                                CURP: {inspectCandidate.curp || "No registrada"}
                              </span>
                            </div>
                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                              Identidad
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setActiveDocPreview({
                                title: `INE/CURP - ${inspectCandidate.fullName}`,
                                url: inspectCandidate.documents.ineUrl || "/sample-ine.pdf",
                              })
                            }
                            className="h-8 text-xs font-semibold gap-1.5 w-full cursor-pointer"
                          >
                            <EyeIcon className="size-3.5 text-blue-600" />
                            <span>Abrir Identificación</span>
                          </Button>
                        </div>

                      </div>
                    )}
                  </TabsContent>

                  {/* TAB CONTENT B: CANDIDATE PROFILE */}
                  <TabsContent value="profile" className="flex flex-col gap-4 mt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      
                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/20 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Tipo de Candidato</span>
                        <span className="font-semibold text-foreground text-sm capitalize">{inspectCandidate.candidateType}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/20 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Área / Especialidad</span>
                        <span className="font-medium text-foreground text-xs">{inspectCandidate.specializationArea || "General"}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/20 flex flex-col gap-1 sm:col-span-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Resumen / Biografía Profesional</span>
                        <span className="font-medium text-foreground text-xs leading-relaxed">
                          {inspectCandidate.bio || inspectCandidate.headline || "Candidato registrado en la plataforma K’anPro para vacantes laborales en Yucatán."}
                        </span>
                      </div>

                    </div>
                  </TabsContent>
                </Tabs>

              </div>

              {/* Right Column (4 Cols): Fixed Dictamen Audit Panel */}
              <div className="lg:col-span-5 xl:col-span-4 p-6 flex flex-col justify-between gap-5 bg-card">
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-foreground">
                      Observaciones del Auditor:
                    </label>
                    <Textarea
                      placeholder="Escriba las observaciones del dictamen para el candidato..."
                      value={auditNotes}
                      onChange={(e) => setAuditNotes(e.target.value)}
                      className="text-xs min-h-[140px] rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 border-t border-border/15 pt-4">
                  <Button
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleCandidateDictamen(true)}
                    className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs gap-2 cursor-pointer"
                  >
                    {submitting ? <Loader2Icon className="size-4 animate-spin" /> : <CheckCircle2Icon className="size-4" />}
                    <span>Aprobar Expediente Verificado</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleCandidateDictamen(false)}
                    className="h-9 text-xs font-semibold text-red-600 border-red-500/30 hover:bg-red-500/10 rounded-xl gap-2 cursor-pointer"
                  >
                    <XCircleIcon className="size-4" />
                    <span>Marcar Incompleto / Reportar</span>
                  </Button>
                </div>

              </div>

            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* EMBEDDED DOCUMENT PREVIEWER MODAL (PDF & IMAGES) */}
      {activeDocPreview && (
        <Dialog open={!!activeDocPreview} onOpenChange={(open) => !open && setActiveDocPreview(null)}>
          <DialogContent className="sm:max-w-[800px] md:max-w-[950px] lg:max-w-[1100px] w-[95vw] h-[88vh] flex flex-col p-0 rounded-2xl overflow-hidden shadow-2xl border border-border/20">
            <DialogHeader className="p-4 px-6 border-b border-border/15 bg-muted/20 flex flex-row items-center justify-between shrink-0">
              <div>
                <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileTextIcon className="size-4 text-purple-600" />
                  <span>{activeDocPreview.title}</span>
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground">
                  Visor Integrado de Archivos Digitales K’anPro
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2 pr-6">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold gap-1.5 rounded-lg"
                >
                  <a href={activeDocPreview.url} target="_blank" rel="noopener noreferrer" download>
                    <DownloadIcon className="size-3.5 text-purple-600" />
                    <span>Descargar Archivo</span>
                  </a>
                </Button>
              </div>
            </DialogHeader>

            {/* Embedded Iframe / Image Viewer */}
            <div className="flex-1 bg-muted/40 p-2 flex items-center justify-center overflow-hidden">
              {isImageFile ? (
                <div className="w-full h-full p-4 flex items-center justify-center bg-zinc-950/90 rounded-xl overflow-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeDocPreview.url}
                    alt={activeDocPreview.title}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <iframe
                  src={activeDocPreview.url}
                  className="w-full h-full rounded-xl border border-border/20 bg-white shadow-xs"
                  title={activeDocPreview.title}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
