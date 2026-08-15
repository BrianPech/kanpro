"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  FileCheck,
  ShieldCheck,
  User,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  Camera,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
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
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { candidateProfileService } from "../services/candidate-profile";
import { candidateDocumentsService, type CandidateDocumentType, type CandidateDocument } from "../services/candidate-documents";
import { respondDocumentAccessRequest } from "@/modules/company/actions/document-access";
import { FormTextField, FormDateField, FormCurpField, FormPhoneField } from "@/components/form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

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
  const [activeTab, setActiveTab] = useState<"mandatory" | "optional">("mandatory");

  // Profile text & status fields state
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [curp, setCurp] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

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

  // Access requests mutation
  const accessRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: "approved" | "rejected" }) => {
      return await respondDocumentAccessRequest(requestId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-documents'] });
      toast.success("Solicitud de acceso a documentos actualizada");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al actualizar la solicitud");
    },
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
              (profile.education as any[]).map((ed: any, idx: number) => ({
                id: ed.id || `edu-${idx}`,
                title: ed.degree || ed.title || "Formación",
                institution: ed.school || ed.institution || "Institución",
              }))
            );
          }

          if (Array.isArray(profile.certifications)) {
            setCertifications(
              (profile.certifications as any[]).map((cert: any, idx: number) => ({
                id: cert.id || `cert-${idx}`,
                name: cert.name || cert.title || "Certificación",
                issuer: cert.issuer || cert.institution || "Organismo",
              }))
            );
          }

          if (Array.isArray(profile.languages)) {
            setLanguages(
              (profile.languages as any[]).map((lang: any, idx: number) => ({
                id: lang.id || `lang-${idx}`,
                language: typeof lang === "string" ? lang : lang.language || lang.name || "Idioma",
                level: lang.level || "Intermedio (B1-B2)",
              }))
            );
          }

          if (Array.isArray(profile.portfolio_links) && profile.portfolio_links.length > 0) {
            const firstLink = profile.portfolio_links[0];
            if (typeof firstLink === "string") {
              setPortfolioUrl(firstLink);
            } else if (firstLink && typeof firstLink === "object" && "url" in firstLink) {
              setPortfolioUrl(String((firstLink as Record<string, any>).url || ""));
            }
          }
        }
      } catch (err) {
        console.error("Error loading candidate profile in documents view:", err);
      }
    }
    loadCandidateProfile();
  }, []);

  // Directly derive documents from query data (Zero useEffect / Zero setState loops)
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
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isSuccessAlert, setIsSuccessAlert] = useState(false);

  // New course / certification / language draft inputs
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseInst, setNewCourseInst] = useState("");
  const [newCertName, setNewCertName] = useState("");
  const [newCertIssuer, setNewCertIssuer] = useState("");
  const [newLangName, setNewLangName] = useState("Inglés");
  const [newLangLevel, setNewLangLevel] = useState("Intermedio (B2)");

  // Progress Calculations
  const mandatoryCompleted = [
    Boolean(fullName.trim()),
    Boolean(birthDate),
    Boolean(curp.trim().length === 18),
    Boolean(officialIdDoc),
    Boolean(email.trim()),
    Boolean(phone.trim()),
    Boolean(profilePhotoUrl),
    Boolean(acceptedTerms),
  ].filter(Boolean).length;

  const optionalCompleted = [
    Boolean(proofAddressDoc),
    Boolean(cvDoc),
    workCertificates.length > 0,
    recommendationLetters.length > 0,
    courses.length > 0,
    certifications.length > 0,
    languages.length > 0,
    Boolean(portfolioUrl),
  ].filter(Boolean).length;

  const totalProgressPercent = Math.round(((mandatoryCompleted * 2) + optionalCompleted) / 24 * 100);

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
      toast.success("Documento cargado con éxito.");
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
      toast.success("Documento eliminado.");
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar el documento.");
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
    } catch (err) {
      toast.error("No se pudo cargar la vista previa.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleAddCourse = () => {
    if (!newCourseTitle.trim()) return;
    setCourses((prev) => [
      ...prev,
      { id: Date.now().toString(), title: newCourseTitle, institution: newCourseInst || "Institución" }
    ]);
    setNewCourseTitle("");
    setNewCourseInst("");
    toast.success("Curso agregado.");
  };

  const handleAddCertification = () => {
    if (!newCertName.trim()) return;
    setCertifications((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newCertName, issuer: newCertIssuer || "Organismo Emisor" }
    ]);
    setNewCertName("");
    setNewCertIssuer("");
    toast.success("Certificación agregada.");
  };

  const handleAddLanguage = () => {
    if (!newLangName.trim()) return;
    setLanguages((prev) => [
      ...prev,
      { id: Date.now().toString(), language: newLangName, level: newLangLevel }
    ]);
    toast.success("Idioma agregado.");
  };

  const handleSaveProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await candidateProfileService.updateProfile(user.id, {
          full_name: fullName,
          whatsapp_number: phone,
          avatar_url: profilePhotoUrl,
          curp: curp,
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
      toast.success("Expediente guardado", {
        description: "Tus documentos, certificaciones e información personal han sido actualizados con éxito."
      });
      setIsSuccessAlert(true);
      setTimeout(() => setIsSuccessAlert(false), 4000);
    } catch (err) {
      console.error("Error saving candidate documents progress:", err);
      toast.error("Error al guardar los cambios en el expediente");
    }
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Hidden File Inputs for real document & avatar uploads */}
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

      {/* 1. Header & Progress Banner */}
      <div className="bg-white dark:bg-zinc-900 rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 border border-[#ebeef3] dark:border-zinc-800 shadow-xs relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1f2732]/5 dark:bg-zinc-800 text-[#1f2732] dark:text-zinc-200 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Verificación de Candidato K&apos;anPro</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-[800] text-[#1f2732] dark:text-zinc-50 tracking-tight">
              Expediente Digital y Documentación
            </h1>
            <p className="text-[#5c7c9b] dark:text-zinc-400 text-sm sm:text-[15px] font-medium max-w-2xl">
              Sube tus documentos requeridos para certificar tu perfil. Las empresas otorgan prioridad de contratación a candidatos con expediente verificado.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="bg-[#f8fafc] dark:bg-zinc-800/60 p-5 rounded-[24px] border border-[#ebeef3] dark:border-zinc-700/60 min-w-[280px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5c7c9b] dark:text-zinc-400">
                Nivel de Expediente
              </span>
              <span className="text-lg font-[900] text-[#1f2732] dark:text-zinc-100">
                {totalProgressPercent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-[#ebeef3] dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 rounded-full"
                style={{ width: `${totalProgressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-[#ebeef3] dark:border-zinc-700/60">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {mandatoryCompleted}/8 Obligatorios
              </span>
              <span className="text-[#5c7c9b] dark:text-zinc-400">
                {optionalCompleted}/8 Opcionales
              </span>
            </div>
          </div>
        </div>

        {/* Success Alert Toast */}
        {isSuccessAlert && (
          <div className="mt-5 p-4 rounded-[18px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>¡Expediente actualizado exitosamente! Los cambios han sido guardados en la base de datos.</span>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#ebeef3] dark:border-zinc-800 pb-1">
        <button
          onClick={() => setActiveTab("mandatory")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-[18px] text-sm sm:text-base font-bold transition-all cursor-pointer border-b-2 ${
            activeTab === "mandatory"
              ? "border-[#1f2732] dark:border-zinc-100 text-[#1f2732] dark:text-zinc-50 bg-white dark:bg-zinc-900 shadow-2xs"
              : "border-transparent text-[#5c7c9b] dark:text-zinc-400 hover:text-[#1f2732] dark:hover:text-zinc-200"
          }`}
        >
          <Lock className="w-4 h-4 text-rose-500" />
          <span>Requisitos Obligatorios</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-rose-500/10 text-rose-600 font-extrabold ml-1">
            {mandatoryCompleted}/8
          </span>
        </button>

        <button
          onClick={() => setActiveTab("optional")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-[18px] text-sm sm:text-base font-bold transition-all cursor-pointer border-b-2 ${
            activeTab === "optional"
              ? "border-[#1f2732] dark:border-zinc-100 text-[#1f2732] dark:text-zinc-50 bg-white dark:bg-zinc-900 shadow-2xs"
              : "border-transparent text-[#5c7c9b] dark:text-zinc-400 hover:text-[#1f2732] dark:hover:text-zinc-200"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Documentos Opcionales y Méritos</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-600 font-extrabold ml-1">
            {optionalCompleted}/8
          </span>
        </button>
      </div>

      {/* 3. TAB CONTENT: MANDATORY REQUIREMENTS */}
      {activeTab === "mandatory" && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-[22px] p-4 text-xs sm:text-sm text-amber-800 dark:text-amber-300 font-medium flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Todos estos elementos son requeridos por norma oficial para postulaciones formales en K&apos;anPro.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Obligatorio 1: Nombre Completo */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <FormTextField
                id="docFullName"
                label="1. Nombre Completo"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                hintText="Nombre(s) y Apellidos como en identificación"
                prefixIcon={<User className="w-4 h-4 text-[#5c7c9b]" />}
                helperText="Nombre oficial registrado para postulaciones formales."
              />
            </div>

            {/* Obligatorio 2: Fecha de Nacimiento */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <FormDateField
                id="docBirthDate"
                label="2. Fecha de Nacimiento"
                required
                value={birthDate}
                onChange={(val) => setBirthDate(val)}
                helperText="Cargado directamente de tu cuenta o modifícalo si es necesario."
              />
            </div>

            {/* Obligatorio 3: CURP */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <FormCurpField
                id="docCurp"
                label="3. CURP Oficial"
                required
                value={curp}
                onChange={(val) => setCurp(val)}
                helperText="Clave Única de Registro de Población (18 caracteres en mayúsculas)."
              />
            </div>

            {/* Obligatorio 4: Identificación Oficial Vigente */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#5c7c9b]" />
                  <span>4. Identificación Oficial Vigente</span>
                </label>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600">
                  Obligatorio
                </span>
              </div>

              {officialIdDoc ? (
                <div className="p-4 rounded-[16px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 truncate">
                        {officialIdDoc.file_name}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> INE / Pasaporte Adjunto
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPreview(officialIdDoc, "Identificación Oficial")}
                      className="h-8 w-8 p-0 rounded-lg text-[#5c7c9b] hover:text-[#1f2732] cursor-pointer"
                      title="Ver documento"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(officialIdDoc)}
                      className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:text-rose-600 cursor-pointer"
                      title="Eliminar documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => requestFileUpload("ine_passport")}
                  disabled={isUploading}
                  className="w-full p-5 border-2 border-dashed border-[#ebeef3] dark:border-zinc-700 rounded-[18px] flex flex-col items-center justify-center text-center gap-2 hover:bg-[#f8fafc] dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                >
                  {isUploading && targetDocType === "ine_passport" ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-[#5c7c9b]" />
                  )}
                  <span className="text-xs font-bold text-[#1f2732] dark:text-zinc-200">
                    {isUploading && targetDocType === "ine_passport"
                      ? "Subiendo documento..."
                      : "Subir INE, Pasaporte o Cédula Profesional (PDF o Imagen)"}
                  </span>
                </button>
              )}
            </div>

            {/* Obligatorio 5: Correo Electrónico */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <FormTextField
                id="docEmail"
                label="5. Correo Electrónico"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                hintText="candidato@correo.com"
                prefixIcon={<Mail className="w-4 h-4 text-[#5c7c9b]" />}
                helperText="Correo vinculado para notificaciones y accesos autorizados."
              />
            </div>

            {/* Obligatorio 6: Teléfono Celular */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <FormPhoneField
                id="docPhone"
                label="6. Teléfono Celular de Contacto"
                required
                value={phone}
                onChange={(val) => setPhone(val)}
                helperText="Número directo para coordinación de entrevistas."
              />
            </div>

            {/* Obligatorio 7: Fotografía de Perfil */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#5c7c9b]" />
                  <span>7. Fotografía de Perfil</span>
                </label>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600">
                  Obligatorio
                </span>
              </div>

              <div className="flex items-center gap-4">
                {profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profilePhotoUrl}
                    alt="Foto de Perfil"
                    className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#f8fafc] dark:bg-zinc-800 border-2 border-dashed border-[#ebeef3] flex items-center justify-center text-[#5c7c9b] shrink-0">
                    <User className="w-7 h-7" />
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#5c7c9b] dark:text-zinc-400">
                    Foto formal de rostro despejado y fondo claro.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="h-8 rounded-lg text-xs font-bold border-[#ebeef3] dark:border-zinc-700 cursor-pointer"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        <span>Subiendo...</span>
                      </>
                    ) : (
                      <span>{profilePhotoUrl ? "Cambiar Fotografía" : "Subir Fotografía"}</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Obligatorio 8: Términos y Condiciones */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#5c7c9b]" />
                  <span>8. Legales y Privacidad</span>
                </label>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600">
                  Obligatorio
                </span>
              </div>

              <div className="p-4 rounded-[16px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="acceptTermsCheck"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="acceptTermsCheck" className="text-xs text-[#5c7c9b] leading-relaxed cursor-pointer select-none">
                  Acepto el resguardo y verificación de mis documentos según el{" "}
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(true)}
                    className="text-[#1f2732] dark:text-zinc-200 font-bold underline"
                  >
                    Aviso de Privacidad y Términos de K&apos;anPro
                  </button>
                  .
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: OPTIONAL REQUIREMENTS & MERITS */}
      {activeTab === "optional" && (
        <div className="space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[22px] p-4 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-3">
            <Sparkles className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              La documentación opcional destaca tu expediente ante reclutadores y acelera los procesos de contratación.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opcional 1: Comprobante de Domicilio */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200">
                  1. Comprobante de Domicilio
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f5f7fa] dark:bg-zinc-800 text-[#5c7c9b]">
                  Opcional
                </span>
              </div>
              {proofAddressDoc ? (
                <div className="p-4 rounded-[16px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 truncate">
                      {proofAddressDoc.file_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPreview(proofAddressDoc, "Comprobante de Domicilio")}
                      className="h-8 w-8 p-0 text-[#5c7c9b] hover:text-[#1f2732] cursor-pointer"
                      title="Ver archivo"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(proofAddressDoc)}
                      className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 cursor-pointer"
                      title="Eliminar archivo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => requestFileUpload("proof_of_address")}
                  disabled={isUploading}
                  className="w-full h-12 rounded-[14px] border-dashed border-[#ebeef3] dark:border-zinc-700 text-xs font-bold text-[#5c7c9b] cursor-pointer"
                >
                  {isUploading && targetDocType === "proof_of_address" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  <span>Adjuntar CFE, Agua o Predial (PDF o Imagen)</span>
                </Button>
              )}
            </div>

            {/* Opcional 2: Currículum Vitae */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200">
                  2. Currículum Vitae (CV)
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f5f7fa] dark:bg-zinc-800 text-[#5c7c9b]">
                  Opcional
                </span>
              </div>
              {cvDoc ? (
                <div className="p-4 rounded-[16px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 truncate">
                      {cvDoc.file_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPreview(cvDoc, "Currículum Vitae")}
                      className="h-8 w-8 p-0 text-[#5c7c9b] hover:text-[#1f2732] cursor-pointer"
                      title="Ver CV"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(cvDoc)}
                      className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 cursor-pointer"
                      title="Eliminar CV"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => requestFileUpload("cv")}
                  disabled={isUploading}
                  className="w-full h-12 rounded-[14px] border-dashed border-[#ebeef3] dark:border-zinc-700 text-xs font-bold text-[#5c7c9b] cursor-pointer"
                >
                  {isUploading && targetDocType === "cv" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  <span>Subir CV en formato PDF</span>
                </Button>
              )}
            </div>

            {/* Opcional 3: Constancias Laborales */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#5c7c9b]" />
                  <span>3. Constancias Laborales</span>
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f5f7fa] dark:bg-zinc-800 text-[#5c7c9b]">
                  {workCertificates.length} adjuntas
                </span>
              </div>
              <div className="space-y-2">
                {workCertificates.map((doc) => (
                  <div key={doc.id} className="p-3.5 rounded-[14px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between text-xs font-bold text-[#1f2732] dark:text-zinc-200">
                    <span className="truncate">{doc.file_name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenPreview(doc, "Constancia Laboral")}
                        className="h-7 w-7 p-0 text-[#5c7c9b] hover:text-[#1f2732] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <button
                        onClick={() => handleDeleteDocument(doc)}
                        className="text-rose-500 hover:text-rose-600 cursor-pointer p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => requestFileUpload("work_certificate")}
                  disabled={isUploading}
                  className="w-full h-10 rounded-[12px] text-xs font-bold border-dashed border-[#ebeef3] dark:border-zinc-700 text-[#5c7c9b] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar Constancia Laboral (PDF o Imagen)
                </Button>
              </div>
            </div>

            {/* Opcional 4: Cartas de Recomendación */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#5c7c9b]" />
                  <span>4. Cartas de Recomendación</span>
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f5f7fa] dark:bg-zinc-800 text-[#5c7c9b]">
                  {recommendationLetters.length} adjuntas
                </span>
              </div>
              <div className="space-y-2">
                {recommendationLetters.map((doc) => (
                  <div key={doc.id} className="p-3.5 rounded-[14px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between text-xs font-bold text-[#1f2732] dark:text-zinc-200">
                    <span className="truncate">{doc.file_name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenPreview(doc, "Carta de Recomendación")}
                        className="h-7 w-7 p-0 text-[#5c7c9b] hover:text-[#1f2732] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <button
                        onClick={() => handleDeleteDocument(doc)}
                        className="text-rose-500 hover:text-rose-600 cursor-pointer p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => requestFileUpload("recommendation_letter")}
                  disabled={isUploading}
                  className="w-full h-10 rounded-[12px] text-xs font-bold border-dashed border-[#ebeef3] dark:border-zinc-700 text-[#5c7c9b] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar Carta de Recomendación (PDF o Imagen)
                </Button>
              </div>
            </div>

            {/* Opcional 5: Certificados o Cursos */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#5c7c9b]" />
                  <span>5. Certificados o Cursos</span>
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f5f7fa] dark:bg-zinc-800 text-[#5c7c9b]">
                  {courses.length} registrados
                </span>
              </div>

              <div className="space-y-2">
                {courses.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-[14px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1f2732] dark:text-zinc-200">{item.title}</p>
                      <p className="text-[11px] text-[#5c7c9b] font-medium">{item.institution}</p>
                    </div>
                    <button
                      onClick={() => setCourses((prev) => prev.filter((c) => c.id !== item.id))}
                      className="text-rose-500 hover:text-rose-600 cursor-pointer p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#ebeef3] dark:border-zinc-800 space-y-2">
                <Input
                  type="text"
                  placeholder="Nombre del curso o taller"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="h-10 bg-[#f8fafc] dark:bg-zinc-800/60 text-xs rounded-xl"
                />
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Institución o Escuela"
                    value={newCourseInst}
                    onChange={(e) => setNewCourseInst(e.target.value)}
                    className="h-10 bg-[#f8fafc] dark:bg-zinc-800/60 text-xs rounded-xl flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCourse}
                    className="h-10 px-4 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {/* Opcional 6: Certificaciones Técnicas */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#5c7c9b]" />
                  <span>6. Certificaciones Técnicas</span>
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f5f7fa] dark:bg-zinc-800 text-[#5c7c9b]">
                  {certifications.length} registradas
                </span>
              </div>

              <div className="space-y-2">
                {certifications.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-[14px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1f2732] dark:text-zinc-200">{item.name}</p>
                      <p className="text-[11px] text-[#5c7c9b] font-medium">{item.issuer}</p>
                    </div>
                    <button
                      onClick={() => setCertifications((prev) => prev.filter((c) => c.id !== item.id))}
                      className="text-rose-500 hover:text-rose-600 cursor-pointer p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#ebeef3] dark:border-zinc-800 space-y-2">
                <Input
                  type="text"
                  placeholder="Nombre de la Certificación (ej. CONOCER, AWS, Cisco)"
                  value={newCertName}
                  onChange={(e) => setNewCertName(e.target.value)}
                  className="h-10 bg-[#f8fafc] dark:bg-zinc-800/60 text-xs rounded-xl"
                />
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Organismo Emisor"
                    value={newCertIssuer}
                    onChange={(e) => setNewCertIssuer(e.target.value)}
                    className="h-10 bg-[#f8fafc] dark:bg-zinc-800/60 text-xs rounded-xl flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCertification}
                    className="h-10 px-4 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {/* Opcional 7: Idiomas Dominados */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#5c7c9b]" />
                  <span>7. Idiomas</span>
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f5f7fa] dark:bg-zinc-800 text-[#5c7c9b]">
                  {languages.length} registrados
                </span>
              </div>

              <div className="space-y-2">
                {languages.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-[14px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1f2732] dark:text-zinc-200">{item.language}</p>
                      <p className="text-[11px] text-[#5c7c9b] font-medium">{item.level}</p>
                    </div>
                    <button
                      onClick={() => setLanguages((prev) => prev.filter((l) => l.id !== item.id))}
                      className="text-rose-500 hover:text-rose-600 cursor-pointer p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#ebeef3] dark:border-zinc-800 flex gap-2">
                <Input
                  type="text"
                  placeholder="Idioma (ej. Inglés, Francés, Maya)"
                  value={newLangName}
                  onChange={(e) => setNewLangName(e.target.value)}
                  className="h-10 bg-[#f8fafc] dark:bg-zinc-800/60 text-xs rounded-xl flex-1"
                />
                <select
                  value={newLangLevel}
                  onChange={(e) => setNewLangLevel(e.target.value)}
                  className="h-10 px-3 bg-[#f8fafc] dark:bg-zinc-800 border border-[#ebeef3] dark:border-zinc-700 text-xs font-semibold rounded-xl text-[#1f2732] dark:text-zinc-100"
                >
                  <option value="Básico (A1-A2)">Básico (A1-A2)</option>
                  <option value="Intermedio (B1-B2)">Intermedio (B1-B2)</option>
                  <option value="Avanzado (C1)">Avanzado (C1)</option>
                  <option value="Nativo">Nativo</option>
                </select>
                <Button
                  type="button"
                  onClick={handleAddLanguage}
                  className="h-10 px-3 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Opcional 8: Portafolio de Trabajos */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-[#5c7c9b]" />
                  <span>8. Portafolio de Trabajos</span>
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f5f7fa] dark:bg-zinc-800 text-[#5c7c9b]">
                  Opcional
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#5c7c9b]">Enlace Web / Sitio Portafolio / GitHub</label>
                  <Input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://miportafolio.com"
                    className="h-11 bg-[#f8fafc] dark:bg-zinc-800/60 border-[#ebeef3] dark:border-zinc-700 rounded-[14px] text-xs font-semibold mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Sticky Bottom Actions Bar */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 shadow-lg flex items-center justify-between gap-4 sticky bottom-4 z-20">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1f2732] dark:text-zinc-200">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">Requisitos Obligatorios:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
            {mandatoryCompleted} de 8 completos
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleSaveProgress}
            className="h-12 px-6 bg-[#1f2732] dark:bg-zinc-100 hover:bg-[#2c3847] dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-extrabold text-sm rounded-[16px] shadow-xs cursor-pointer active:scale-98 transition-all"
          >
            Guardar Expediente
          </Button>
        </div>
      </div>

      {/* MODAL 1: Real Document Preview Modal */}
      <Dialog open={!!previewData} onOpenChange={(open) => !open && setPreviewData(null)}>
        <DialogContent className="sm:max-w-[540px] rounded-[28px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1f2732] dark:text-zinc-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>{previewData?.type}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5c7c9b] truncate">
              {previewData?.name}
            </DialogDescription>
          </DialogHeader>

          {isLoadingPreview ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-semibold text-[#5c7c9b]">Cargando vista previa segura...</p>
            </div>
          ) : previewData?.url ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#f8fafc] dark:bg-zinc-800/50 border border-[#ebeef3] dark:border-zinc-700 rounded-[20px] text-center space-y-3">
                {previewData.isPdf ? (
                  <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
                    <FileText className="w-7 h-7" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewData.url}
                    alt={previewData.name}
                    className="max-h-64 mx-auto rounded-xl object-contain shadow-xs"
                  />
                )}
                <div>
                  <p className="text-sm font-bold text-[#1f2732] dark:text-zinc-100">
                    Documento listo para consulta
                  </p>
                  <p className="text-xs text-[#5c7c9b]">
                    Almacenado de forma segura en el repositorio de K&apos;anPro.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => window.open(previewData.url!, "_blank")}
                  className="flex-1 h-11 bg-[#1f2732] hover:bg-[#2c3847] text-white text-xs font-bold rounded-[14px] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Abrir / Descargar</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewData(null)}
                  className="h-11 px-5 rounded-[14px] text-xs font-bold cursor-pointer"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-[#f8fafc] dark:bg-zinc-800/50 border border-[#ebeef3] dark:border-zinc-700 rounded-[20px] text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-[#1f2732] dark:text-zinc-100">
                Documento registrado en expediente
              </p>
              <Button
                variant="outline"
                onClick={() => setPreviewData(null)}
                className="w-full h-11 rounded-[14px] text-xs font-bold cursor-pointer mt-2"
              >
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Terms & Privacy Modal */}
      <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
        <DialogContent className="sm:max-w-[540px] rounded-[28px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1f2732] dark:text-zinc-50">
              Términos, Condiciones y Aviso de Privacidad
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5c7c9b]">
              K&apos;anPro Plataforma de Reclutamiento y Empleo
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs text-[#3e546d] dark:text-zinc-300 space-y-3 leading-relaxed border-t border-b border-[#ebeef3] dark:border-zinc-800 py-4">
            <p className="font-bold text-[#1f2732] dark:text-zinc-100">1. Protección de Datos Personales</p>
            <p>
              Tus documentos e información sensible (CURP, Identificación Oficial y comprobantes) son resguardados bajo estándares estrictos de cifrado de extremo a extremo. Únicamente serán compartidos con empresas registradas ante las cuales postules explícitamente tu vacante.
            </p>
            <p className="font-bold text-[#1f2732] dark:text-zinc-100">2. Veracidad de la Información</p>
            <p>
              El candidato garantiza que los datos proporcionados son veraces y corresponden a su titularidad legal. La alteración o falsificación de documentos cancelará la cuenta de usuario de inmediato.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsTermsModalOpen(false)}
              className="w-full h-11 bg-[#1f2732] text-white font-bold text-xs rounded-[14px] cursor-pointer"
            >
              Entendido y Aceptado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
