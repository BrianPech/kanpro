"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  ShieldCheck,
  User,
  Mail,
  Camera,
  FileText,
  UploadCloud,
  CheckCircle2,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  X,
  Globe,
  Award,
  Briefcase,
  Sparkles,
  Lock,
  Loader2,
  Download,
  Check,
  Info,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { candidateProfileService } from "../services/candidate-profile";
import { candidateDocumentsService, type CandidateDocumentType, type CandidateDocument } from "../services/candidate-documents";
import { FormTextField, FormDateField, FormCurpField, FormPhoneField } from "@/components/form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";

interface CourseItem {
  id: string;
  title: string;
  institution: string;
}

interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
}

interface LanguageItem {
  id: string;
  language: string;
  level: string;
}

export function CandidateDocumentsView() {
  const supabase = createClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [targetDocType, setTargetDocType] = useState<CandidateDocumentType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("identity");

  // Profile text & status fields state
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [curp, setCurp] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  // Optional lists state
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const queryClient = useQueryClient();

  // Fetch candidate documents with TanStack useQuery
  const { data: documents = [] } = useQuery({
    queryKey: ['candidate-documents', userId],
    queryFn: async () => {
      if (!userId) return [];
      return await candidateDocumentsService.list(userId);
    },
    enabled: !!userId,
  });

  // Fetch profile details on mount
  React.useEffect(() => {
    async function loadCandidateProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        const profile = await candidateProfileService.getProfile(user.id);
        if (profile) {
          setFullName(profile.full_name || "");
          setEmail(profile.email || user.email || "");
          setPhone(profile.whatsapp_number || "");
          setProfilePhotoUrl(profile.avatar_url || null);
          setCurp(profile.curp || "");
          setBirthDate(profile.birth_date || "");

          if (Array.isArray(profile.education)) {
            setCourses(
              (profile.education as Array<Record<string, unknown>>).map((ed, idx) => ({
                id: (ed.id as string) || `edu-${idx}`,
                title: (ed.degree as string) || (ed.title as string) || "Formación",
                institution: (ed.school as string) || (ed.institution as string) || "Institución",
              }))
            );
          }

          if (Array.isArray(profile.certifications)) {
            setCertifications(
              (profile.certifications as Array<Record<string, unknown>>).map((cert, idx) => ({
                id: (cert.id as string) || `cert-${idx}`,
                name: (cert.name as string) || (cert.title as string) || "Certificación",
                issuer: (cert.issuer as string) || (cert.institution as string) || "Organismo",
              }))
            );
          }

          if (Array.isArray(profile.languages)) {
            setLanguages(
              (profile.languages as Array<Record<string, unknown> | string>).map((lang, idx) => ({
                id: (typeof lang === "object" && lang && (lang.id as string)) || `lang-${idx}`,
                language: typeof lang === "string" ? lang : (lang.language as string) || (lang.name as string) || "Idioma",
                level: (typeof lang === "object" && lang && (lang.level as string)) || "Intermedio (B1-B2)",
              }))
            );
          }

          if (Array.isArray(profile.portfolio_links) && profile.portfolio_links.length > 0) {
            const firstLink = profile.portfolio_links[0];
            if (typeof firstLink === "string") {
              setPortfolioUrl(firstLink);
            } else if (firstLink && typeof firstLink === "object" && "url" in firstLink) {
              setPortfolioUrl(String((firstLink as Record<string, unknown>).url || ""));
            }
          }
        }
      } catch (err: unknown) {
        console.error("Error loading candidate profile in documents view:", err);
      }
    }
    loadCandidateProfile();
  }, [supabase]);

  // Derived Documents
  const officialIdDoc = useMemo(
    () => documents.find((doc) => doc.doc_type === "ine_passport") || null,
    [documents]
  );
  const proofAddressDoc = useMemo(
    () => documents.find((doc) => doc.doc_type === "proof_of_address") || null,
    [documents]
  );
  const cvDoc = useMemo(
    () => documents.find((doc) => doc.doc_type === "cv") || null,
    [documents]
  );
  const workCertificates = useMemo(
    () => documents.filter((doc) => doc.doc_type === "work_certificate"),
    [documents]
  );
  const recommendationLetters = useMemo(
    () => documents.filter((doc) => doc.doc_type === "recommendation_letter"),
    [documents]
  );

  // UI Modals
  const [previewData, setPreviewData] = useState<{ name: string; type: string; url?: string | null; isPdf?: boolean } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isAddCertModalOpen, setIsAddCertModalOpen] = useState(false);
  const [isAddLangModalOpen, setIsAddLangModalOpen] = useState(false);

  // New item inputs
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseInst, setNewCourseInst] = useState("");
  const [newCertName, setNewCertName] = useState("");
  const [newCertIssuer, setNewCertIssuer] = useState("");
  const [newLangName, setNewLangName] = useState("Inglés");
  const [newLangLevel, setNewLangLevel] = useState("Intermedio (B2)");

  // Progress Calculations (4 Key Pillars)
  const identityScore = [
    Boolean(fullName.trim()),
    Boolean(birthDate),
    Boolean(curp.trim().length === 18),
    Boolean(officialIdDoc),
    Boolean(email.trim()),
    Boolean(phone.trim()),
    Boolean(profilePhotoUrl),
  ].filter(Boolean).length; // Max 7

  const workDocsScore = [
    Boolean(cvDoc),
    Boolean(proofAddressDoc),
    workCertificates.length > 0,
    recommendationLetters.length > 0,
  ].filter(Boolean).length; // Max 4

  const meritsScore = [
    courses.length > 0,
    certifications.length > 0,
    languages.length > 0,
    Boolean(portfolioUrl.trim()),
  ].filter(Boolean).length; // Max 4

  // Weighted score to 100%
  const totalScore = Math.min(
    100,
    Math.round((identityScore / 7) * 50 + (workDocsScore / 4) * 35 + (meritsScore / 4) * 15)
  );

  // Trigger file selection for a specific document category
  const requestFileUpload = (docType: CandidateDocumentType) => {
    setTargetDocType(docType);
    fileInputRef.current?.click();
  };

  // Upload handler for document categories
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const docType = targetDocType;
    event.target.value = "";
    if (!file || !docType || !userId) return;

    const isMultiple = ["work_certificate", "recommendation_letter", "course_certificate"].includes(docType);

    setIsUploading(true);
    try {
      await candidateDocumentsService.upload(userId, docType, file, isMultiple);
      await queryClient.invalidateQueries({ queryKey: ['candidate-documents', userId] });
      toast.success("Documento cargado con éxito.", {
        description: `Se guardó "${file.name}" en tu expediente digital.`
      });
    } catch (error: unknown) {
      toast.error((error as Error).message || "No se pudo cargar el documento.");
    } finally {
      setIsUploading(false);
      setTargetDocType(null);
    }
  };

  // Upload handler for Profile Avatar
  const handleAvatarSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !userId) return;

    setIsUploadingAvatar(true);
    try {
      const publicUrl = await candidateDocumentsService.uploadAvatar(userId, file);
      setProfilePhotoUrl(publicUrl);
      toast.success("Foto de perfil actualizada correctamente.");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Error al subir la fotografía.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Delete document handler
  const handleDeleteDocument = async (doc: CandidateDocument) => {
    try {
      await candidateDocumentsService.delete(doc.id, doc.file_url);
      await queryClient.invalidateQueries({ queryKey: ['candidate-documents', userId] });
      toast.success("Documento eliminado del expediente.");
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Error al eliminar el documento.");
    }
  };

  // Document preview handler
  const handleOpenPreview = async (doc: CandidateDocument, label: string) => {
    setIsLoadingPreview(true);
    setPreviewData({ name: doc.file_name, type: label });
    try {
      const signedUrl = await candidateDocumentsService.getSignedUrl(doc.file_url);
      const isPdf = doc.file_name.toLowerCase().endsWith(".pdf");
      setPreviewData({
        name: doc.file_name,
        type: label,
        url: signedUrl,
        isPdf,
      });
    } catch {
      toast.error("No se pudo cargar la vista previa.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleAddCourse = () => {
    if (!newCourseTitle.trim()) return;
    setCourses((prev) => [
      ...prev,
      { id: Date.now().toString(), title: newCourseTitle.trim(), institution: newCourseInst.trim() || "Institución" }
    ]);
    setNewCourseTitle("");
    setNewCourseInst("");
    setIsAddCourseModalOpen(false);
    toast.success("Curso agregado al expediente.");
  };

  const handleAddCertification = () => {
    if (!newCertName.trim()) return;
    setCertifications((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newCertName.trim(), issuer: newCertIssuer.trim() || "Organismo Emisor" }
    ]);
    setNewCertName("");
    setNewCertIssuer("");
    setIsAddCertModalOpen(false);
    toast.success("Certificación agregada al expediente.");
  };

  const handleAddLanguage = () => {
    if (!newLangName.trim()) return;
    setLanguages((prev) => [
      ...prev,
      { id: Date.now().toString(), language: newLangName.trim(), level: newLangLevel }
    ]);
    setIsAddLangModalOpen(false);
    toast.success("Idioma agregado al expediente.");
  };

  const handleSaveProgress = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await candidateProfileService.updateProfile(user.id, {
          full_name: fullName.trim(),
          whatsapp_number: phone.trim(),
          avatar_url: profilePhotoUrl,
          curp: curp.trim(),
          birth_date: birthDate,
          education: courses.map((c) => ({
            degree: c.title,
            institution: c.institution,
            period: "Completado",
            description: `Curso/Certificado emitido por ${c.institution}`,
          })),
          certifications: certifications.map((cert) => ({
            name: cert.name,
            issuer: cert.issuer,
          })),
          languages: languages.map((l) => ({
            language: l.language,
            level: l.level,
          })),
          portfolio_links: portfolioUrl ? [portfolioUrl] : [],
        });
      }
      toast.success("Expediente digital guardado", {
        description: "Toda tu información personal, documentos y méritos están sincronizados."
      });
    } catch (err) {
      console.error("Error saving candidate documents progress:", err);
      toast.error("Error al guardar los cambios en el expediente");
    } finally {
      setIsSaving(false);
    }
  };

  const getDossierLevel = (score: number) => {
    if (score >= 85) return { label: "Expediente Certificado", color: "emerald", badge: "Prioridad Máxima" };
    if (score >= 50) return { label: "Expediente en Progreso", color: "amber", badge: "Verificación Parcial" };
    return { label: "Expediente Básico", color: "zinc", badge: "Requisitos Pendientes" };
  };

  const levelInfo = getDossierLevel(totalScore);

  return (
    <div className="min-h-full max-w-6xl mx-auto space-y-6 pb-24 md:pb-12 animate-in fade-in duration-300">
      
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleAvatarSelected}
      />

      {/* 1. Header Hero Banner */}
      <div className="bg-card text-card-foreground rounded-3xl p-6 sm:p-8 border border-border shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
              <ShieldCheck className="size-4" />
              <span>Expediente Digital Laboral</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Documentación y Certificación
            </h1>
            
            <p className="text-muted-foreground text-sm font-medium max-w-2xl leading-relaxed">
              Centraliza tus documentos oficiales, CV y méritos profesionales. Las empresas del Sureste otorgan prioridad a candidatos con expediente verificado.
            </p>
          </div>

          {/* Dossier Health Card */}
          <div className="bg-muted/50 dark:bg-zinc-800/40 p-5 rounded-2xl border border-border/80 min-w-[280px] sm:min-w-[320px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nivel de Expediente
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tabular-nums text-foreground">
                  {totalScore}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  totalScore >= 85
                    ? "bg-emerald-500"
                    : totalScore >= 50
                    ? "bg-amber-500"
                    : "bg-primary"
                }`}
                style={{ width: `${totalScore}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold pt-1 text-muted-foreground border-t border-border/60">
              <span className="flex items-center gap-1 text-foreground font-bold">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                {levelInfo.label}
              </span>
              <span className="text-primary font-bold">
                {levelInfo.badge}
              </span>
            </div>
          </div>
        </div>

        {/* Global Save Trigger Toolbar */}
        <div className="mt-6 pt-5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="size-4 text-primary shrink-0" />
            <span>Tus documentos se transmiten con cifrado de extremo a extremo en Supabase Storage.</span>
          </div>

          <Button
            onClick={handleSaveProgress}
            disabled={isSaving}
            className="w-full sm:w-auto h-11 px-6 rounded-xl font-bold text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs gap-2 cursor-pointer transition-all"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar Expediente
          </Button>
        </div>
      </div>

      {/* 2. Main Tabbed Organization */}
      <Tabs defaultValue="identity" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto p-1.5 bg-muted/60 rounded-2xl border border-border/60 gap-1">
          <TabsTrigger
            value="identity"
            className="rounded-xl py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            <User className="size-4 text-primary shrink-0" />
            <span>Identidad & INE</span>
            {identityScore === 7 && <CheckCircle2 className="size-3.5 text-emerald-500" />}
          </TabsTrigger>

          <TabsTrigger
            value="work_docs"
            className="rounded-xl py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            <FileText className="size-4 text-blue-500 shrink-0" />
            <span>CV & Constancias</span>
            {cvDoc && <CheckCircle2 className="size-3.5 text-emerald-500" />}
          </TabsTrigger>

          <TabsTrigger
            value="merits"
            className="rounded-xl py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            <Award className="size-4 text-amber-500 shrink-0" />
            <span>Cursos & Méritos</span>
            {meritsScore > 0 && <span className="text-[11px] font-bold text-muted-foreground">({courses.length + certifications.length})</span>}
          </TabsTrigger>

          <TabsTrigger
            value="security"
            className="rounded-xl py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            <Lock className="size-4 text-emerald-500 shrink-0" />
            <span>Permisos & Empresas</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================================================= */}
        {/* TAB 1: IDENTIDAD & CONTACTO */}
        {/* ========================================================================================================= */}
        <TabsContent value="identity" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Col: Photo & INE Dropzone (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Profile Avatar Card */}
              <div className="bg-card p-6 rounded-3xl border border-border shadow-xs flex flex-col items-center text-center space-y-4">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="size-28 sm:size-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-card shadow-md transition-all group-hover:opacity-90">
                    {profilePhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profilePhotoUrl} alt={fullName} className="size-full object-cover" />
                    ) : (
                      <span className="text-3xl font-extrabold text-foreground">
                        {fullName ? fullName.trim()[0].toUpperCase() : "C"}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-1 right-1 p-2 bg-primary text-primary-foreground rounded-full shadow-md hover:scale-105 transition-transform">
                    {isUploadingAvatar ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-foreground">{fullName || "Tu Nombre"}</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Fotografía Oficial para Reclutadores</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <Camera className="size-3.5" />
                  {profilePhotoUrl ? "Cambiar Fotografía" : "Subir Fotografía"}
                </Button>
              </div>

              {/* Official ID (INE / Pasaporte) Card */}
              <DocumentUploadCard
                title="Identificación Oficial (INE / Pasaporte)"
                description="Requerido para cotejo de identidad y contratación formal."
                document={officialIdDoc}
                docType="ine_passport"
                isUploading={isUploading && targetDocType === "ine_passport"}
                onRequestUpload={requestFileUpload}
                onOpenPreview={(doc) => handleOpenPreview(doc, "Identificación Oficial (INE)")}
                onDeleteDocument={handleDeleteDocument}
                required
              />
            </div>

            {/* Right Col: Personal Verification Fields (7 cols) */}
            <div className="lg:col-span-7 bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <User className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Datos Personales Oficiales</h3>
                    <p className="text-xs text-muted-foreground">Utilizados para emitir contratos y trámites de RRHH.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <FormTextField
                  id="docFullName"
                  label="Nombre Completo Oficial"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  hintText="Nombre(s) y Apellidos como en tu INE"
                  prefixIcon={<User className="size-4 text-muted-foreground" />}
                  helperText="Nombre oficial registrado para postulaciones formales."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormCurpField
                    id="docCurp"
                    label="CURP Oficial (18 caracteres)"
                    required
                    value={curp}
                    onChange={(val) => setCurp(val)}
                    helperText="Clave Única de Registro de Población."
                  />

                  <FormDateField
                    id="docBirthDate"
                    label="Fecha de Nacimiento"
                    required
                    value={birthDate}
                    onChange={(val) => setBirthDate(val)}
                    helperText="Cargado directamente de tu cuenta."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormTextField
                    id="docEmail"
                    label="Correo Electrónico"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    hintText="candidato@correo.com"
                    prefixIcon={<Mail className="size-4 text-muted-foreground" />}
                    helperText="Vinculado a notificaciones y ofertas."
                  />

                  <FormPhoneField
                    id="docPhone"
                    label="WhatsApp / Celular"
                    required
                    value={phone}
                    onChange={(val) => setPhone(val)}
                    helperText="Contacto directo para entrevistas."
                  />
                </div>
              </div>
            </div>

          </div>
        </TabsContent>

        {/* ========================================================================================================= */}
        {/* TAB 2: CV Y CONSTANCIAS LABORALES */}
        {/* ========================================================================================================= */}
        <TabsContent value="work_docs" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. CV Digital */}
            <DocumentUploadCard
              title="Currículum Vitae (CV)"
              description="Formato PDF preferentemente. Las empresas revisan este documento para conocer tu trayectoria."
              document={cvDoc}
              docType="cv"
              isUploading={isUploading && targetDocType === "cv"}
              onRequestUpload={requestFileUpload}
              onOpenPreview={(doc) => handleOpenPreview(doc, "Currículum Vitae")}
              onDeleteDocument={handleDeleteDocument}
              required
            />

            {/* 2. Comprobante de Domicilio */}
            <DocumentUploadCard
              title="Comprobante de Domicilio"
              description="CFE, Agua o Telefonía no mayor a 3 meses. Acredita tu residencia en la zona de trabajo."
              document={proofAddressDoc}
              docType="proof_of_address"
              isUploading={isUploading && targetDocType === "proof_of_address"}
              onRequestUpload={requestFileUpload}
              onOpenPreview={(doc) => handleOpenPreview(doc, "Comprobante de Domicilio")}
              onDeleteDocument={handleDeleteDocument}
            />

            {/* 3. Constancias Laborales */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Briefcase className="size-4.5" />
                    </div>
                    <h4 className="text-base font-bold text-foreground">Constancias Laborales</h4>
                  </div>
                  <Badge variant="secondary" className="text-xs font-bold rounded-lg">
                    {workCertificates.length} adjuntas
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cartas de finiquito, constancias de empleo o cartas de recomendación laboral de empresas previas.
                </p>
              </div>

              {workCertificates.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {workCertificates.map((doc) => (
                    <div key={doc.id} className="p-3 rounded-xl bg-muted/50 border border-border/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="size-4 text-primary shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">{doc.file_name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenPreview(doc, "Constancia Laboral")}
                          className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc)}
                          className="size-7 rounded-lg text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => requestFileUpload("work_certificate")}
                disabled={isUploading}
                className="w-full rounded-xl text-xs font-bold gap-1.5 h-10 border-dashed hover:border-solid cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Agregar Constancia Laboral</span>
              </Button>
            </div>

            {/* 4. Cartas de Recomendación */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Award className="size-4.5" />
                    </div>
                    <h4 className="text-base font-bold text-foreground">Cartas de Recomendación</h4>
                  </div>
                  <Badge variant="secondary" className="text-xs font-bold rounded-lg">
                    {recommendationLetters.length} adjuntas
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cartas personales o de antiguos jefes directos que respalden tu ética de trabajo y confiabilidad.
                </p>
              </div>

              {recommendationLetters.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {recommendationLetters.map((doc) => (
                    <div key={doc.id} className="p-3 rounded-xl bg-muted/50 border border-border/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="size-4 text-primary shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">{doc.file_name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenPreview(doc, "Carta de Recomendación")}
                          className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc)}
                          className="size-7 rounded-lg text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => requestFileUpload("recommendation_letter")}
                disabled={isUploading}
                className="w-full rounded-xl text-xs font-bold gap-1.5 h-10 border-dashed hover:border-solid cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Agregar Carta de Recomendación</span>
              </Button>
            </div>

          </div>
        </TabsContent>

        {/* ========================================================================================================= */}
        {/* TAB 3: MÉRITOS, CURSOS E IDIOMAS */}
        {/* ========================================================================================================= */}
        <TabsContent value="merits" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Cursos y Talleres */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Award className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground">Cursos y Talleres</h4>
                    <p className="text-xs text-muted-foreground">Diplomados o capacitaciones realizadas.</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddCourseModalOpen(true)}
                  className="rounded-xl text-xs font-bold gap-1 h-8 px-3 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  Agregar
                </Button>
              </div>

              {courses.length === 0 ? (
                <div className="p-6 rounded-2xl bg-muted/40 border border-dashed border-border text-center text-xs text-muted-foreground">
                  Aún no has registrado cursos. Agrega diplomados o talleres para sumar méritos.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {courses.map((course) => (
                    <div key={course.id} className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-foreground">{course.title}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{course.institution}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCourses((prev) => prev.filter((c) => c.id !== course.id))}
                        className="size-7 rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certificaciones y Licencias */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground">Certificaciones Oficiales</h4>
                    <p className="text-xs text-muted-foreground">Distintivo H, Primeros Auxilios, etc.</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddCertModalOpen(true)}
                  className="rounded-xl text-xs font-bold gap-1 h-8 px-3 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  Agregar
                </Button>
              </div>

              {certifications.length === 0 ? (
                <div className="p-6 rounded-2xl bg-muted/40 border border-dashed border-border text-center text-xs text-muted-foreground">
                  No hay certificaciones registradas.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-foreground">{cert.name}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{cert.issuer}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCertifications((prev) => prev.filter((c) => c.id !== cert.id))}
                        className="size-7 rounded-lg text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Idiomas */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Globe className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground">Idiomas</h4>
                    <p className="text-xs text-muted-foreground">Nivel conversacional y dominio.</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddLangModalOpen(true)}
                  className="rounded-xl text-xs font-bold gap-1 h-8 px-3 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  Agregar
                </Button>
              </div>

              {languages.length === 0 ? (
                <div className="p-6 rounded-2xl bg-muted/40 border border-dashed border-border text-center text-xs text-muted-foreground">
                  Registra los idiomas que dominas (Ej. Inglés B2, Maya, etc.).
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <div key={lang.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs font-bold text-foreground">
                      <span>{lang.language}</span>
                      <span className="text-[11px] text-muted-foreground font-semibold">({lang.level})</span>
                      <button
                        type="button"
                        onClick={() => setLanguages((prev) => prev.filter((l) => l.id !== lang.id))}
                        className="text-muted-foreground hover:text-destructive ml-1"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Portafolio Digital */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Sparkles className="size-4.5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">Portafolio Digital o Web</h4>
                  <p className="text-xs text-muted-foreground">Muestra tus proyectos anteriores, fotos o enlace a LinkedIn.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://behance.net/mi-perfil o LinkedIn"
                  className="rounded-xl text-xs h-10 bg-background"
                />
                {portfolioUrl && (
                  <a
                    href={portfolioUrl.startsWith("http") ? portfolioUrl : `https://${portfolioUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="outline" size="icon" className="size-10 rounded-xl">
                      <ExternalLink className="size-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

          </div>
        </TabsContent>

        {/* ========================================================================================================= */}
        {/* TAB 4: PERMISOS Y PRIVACIDAD */}
        {/* ========================================================================================================= */}
        <TabsContent value="security" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Information Card */}
            <div className="md:col-span-6 bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Protocolo de Privacidad K&apos;anPro</h3>
                  <p className="text-xs text-muted-foreground">Seguridad según la Ley Federal de Protección de Datos Personales.</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Tus documentos privados (CURP, Identificación y Comprobantes) están protegidos mediante políticas RLS y únicamente se comparten con empresas verificadas a las que decidas postularte formalmente.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-foreground font-medium">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Acceso revocado automáticamente al finalizar el proceso de selección.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-foreground font-medium">
                  <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>URLs temporales protegidas con token de vencimiento a los 60 minutos.</span>
                </div>
              </div>
            </div>

            {/* Terms and Authorization Acceptance Card */}
            <div className="md:col-span-6 bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Lock className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Consentimiento de Verificación</h3>
                    <p className="text-xs text-muted-foreground">Autorización para validación documental.</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Al mantener activo este interruptor, autorizas a K&apos;anPro a cotejar la validez de tu expediente con los departamentos de Recursos Humanos de las empresas contratantes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Estado de Autorización</span>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-xs">
                  Vigente y Activo
                </Badge>
              </div>
            </div>

          </div>
        </TabsContent>
      </Tabs>

      {/* ========================================================================================================= */}
      {/* MODALS */}
      {/* ========================================================================================================= */}

      {/* 1. Document Preview Modal */}
      <Dialog open={!!previewData} onOpenChange={(open) => !open && setPreviewData(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">
          <DialogHeader className="p-5 border-b border-border flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {previewData?.type || "Vista Previa de Documento"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate max-w-sm mt-0.5">
                {previewData?.name}
              </DialogDescription>
            </div>
            {previewData?.url && (
              <a
                href={previewData.url}
                target="_blank"
                rel="noopener noreferrer"
                download={previewData.name}
              >
                <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5">
                  <Download className="size-3.5" />
                  Descargar
                </Button>
              </a>
            )}
          </DialogHeader>

          <div className="p-6 flex-1 min-h-[400px] flex items-center justify-center bg-muted/20 overflow-auto">
            {isLoadingPreview ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span>Cargando documento cifrado...</span>
              </div>
            ) : previewData?.url ? (
              previewData.isPdf ? (
                <iframe
                  src={`${previewData.url}#toolbar=0`}
                  className="w-full h-[500px] rounded-xl border border-border"
                  title="PDF Preview"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewData.url}
                  alt={previewData.name}
                  className="max-h-[500px] w-auto object-contain rounded-xl shadow-xs"
                />
              )
            ) : (
              <div className="text-center text-xs text-muted-foreground">
                No se pudo generar la vista previa del documento.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Add Course Modal */}
      <Dialog open={isAddCourseModalOpen} onOpenChange={setIsAddCourseModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl bg-card border border-border p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Agregar Curso o Diplomado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Nombre del Curso / Formación *</label>
              <Input
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                placeholder="Ej. Diplomado en Manejo Higiénico de Alimentos"
                className="mt-1 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Institución Educativa / Empresa</label>
              <Input
                value={newCourseInst}
                onChange={(e) => setNewCourseInst(e.target.value)}
                placeholder="Ej. Instituto Gastronómico de Mérida"
                className="mt-1 text-xs rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddCourseModalOpen(false)} className="rounded-xl text-xs">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddCourse} className="rounded-xl text-xs font-bold">
              Guardar Curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Add Certification Modal */}
      <Dialog open={isAddCertModalOpen} onOpenChange={setIsAddCertModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl bg-card border border-border p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Agregar Certificación Oficial</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Nombre de la Certificación *</label>
              <Input
                value={newCertName}
                onChange={(e) => setNewCertName(e.target.value)}
                placeholder="Ej. Distintivo H, Certificación CONOCER"
                className="mt-1 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Organismo Emisor / Autoridad</label>
              <Input
                value={newCertIssuer}
                onChange={(e) => setNewCertIssuer(e.target.value)}
                placeholder="Ej. Secretaría de Turismo (SECTUR)"
                className="mt-1 text-xs rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddCertModalOpen(false)} className="rounded-xl text-xs">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddCertification} className="rounded-xl text-xs font-bold">
              Guardar Certificación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Add Language Modal */}
      <Dialog open={isAddLangModalOpen} onOpenChange={setIsAddLangModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl bg-card border border-border p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Agregar Idioma</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Idioma *</label>
              <Input
                value={newLangName}
                onChange={(e) => setNewLangName(e.target.value)}
                placeholder="Ej. Inglés, Francés, Maya"
                className="mt-1 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Nivel de Dominio</label>
              <select
                value={newLangLevel}
                onChange={(e) => setNewLangLevel(e.target.value)}
                className="w-full h-10 px-3 mt-1 bg-background border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Básico (A1-A2)">Básico (A1-A2)</option>
                <option value="Intermedio (B1-B2)">Intermedio (B1-B2)</option>
                <option value="Avanzado / Profesional (C1-C2)">Avanzado / Profesional (C1-C2)</option>
                <option value="Nativo / Bilingüe">Nativo / Bilingüe</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddLangModalOpen(false)} className="rounded-xl text-xs">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddLanguage} className="rounded-xl text-xs font-bold">
              Guardar Idioma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

/**
 * Reusable Modern Document Card Component
 */
function DocumentUploadCard({
  title,
  description,
  document,
  docType,
  isUploading,
  onRequestUpload,
  onOpenPreview,
  onDeleteDocument,
  required = false,
}: {
  title: string;
  description: string;
  document: CandidateDocument | null;
  docType: CandidateDocumentType;
  isUploading: boolean;
  onRequestUpload: (type: CandidateDocumentType) => void;
  onOpenPreview: (doc: CandidateDocument) => void;
  onDeleteDocument: (doc: CandidateDocument) => void;
  required?: boolean;
}) {
  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-4 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-base font-bold text-foreground">{title}</h4>
          {required && (
            <Badge variant="outline" className="text-[10px] font-extrabold text-primary border-primary/30 bg-primary/5 rounded-md">
              Requerido
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {document ? (
        <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="size-5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-foreground truncate">{document.file_name}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="size-3" /> Documento Verificado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenPreview(document)}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              title="Vista previa"
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteDocument(document)}
              className="size-8 rounded-lg text-destructive hover:text-destructive/80 cursor-pointer"
              title="Eliminar documento"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onRequestUpload(docType)}
          disabled={isUploading}
          className="w-full p-6 border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group"
        >
          {isUploading ? (
            <Loader2 className="size-7 text-primary animate-spin" />
          ) : (
            <UploadCloud className="size-7 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
          <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
            {isUploading ? "Cargando archivo..." : "Haz clic para subir documento (PDF o Imagen)"}
          </span>
          <span className="text-[11px] text-muted-foreground">Máximo 10 MB</span>
        </button>
      )}
    </div>
  );
}

