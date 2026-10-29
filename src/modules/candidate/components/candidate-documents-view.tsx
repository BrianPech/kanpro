"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  User,
  Mail,
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
  Save,
  Phone,
  Calendar,
  AlertCircle,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { DatePicker } from "@/components/ui/date-picker";
import { createClient } from "@/lib/supabase/client";
import { candidateProfileService } from "../services/candidate-profile";
import { candidateDocumentsService, type CandidateDocumentType, type CandidateDocument } from "../services/candidate-documents";
import { FormLocationSelector } from "@/components/form";
import { GEO_CONFIG } from "@/config/geo";
import { formatPhoneDisplay, normalizePhone, normalizeCurp, normalizeDateToISO } from "@/lib/formatters";
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
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [targetDocType, setTargetDocType] = useState<CandidateDocumentType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile text & status fields state
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [curp, setCurp] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  // Location & Radar States
  const [city, setCity] = useState<string>("Mérida");
  const [zone, setZone] = useState<string>("Centro Mérida");
  const [locationStatus, setLocationStatus] = useState<string>("");

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

          if (profile.location && profile.location.includes(" - ")) {
            setLocationStatus(profile.location);
            const [locCity, locZone] = profile.location.split(" - ");
            if (GEO_CONFIG[locCity]) {
              setCity(locCity);
              setZone(locZone);
            }
          } else if (profile.location) {
            setLocationStatus(profile.location);
          }

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

  // Progress Calculations (Key Pillars)
  const identityScore = [
    Boolean(fullName.trim()),
    Boolean(birthDate),
    Boolean(curp.trim().length === 18),
    Boolean(officialIdDoc),
    Boolean(email.trim()),
    Boolean(phone.trim()),
  ].filter(Boolean).length; // Max 6

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
    Math.round((identityScore / 6) * 50 + (workDocsScore / 4) * 35 + (meritsScore / 4) * 15)
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
        if (city && zone) {
          try {
            await candidateProfileService.updateLocation(user.id, city, zone);
          } catch (locErr) {
            console.warn("Non-fatal location update error:", locErr);
          }
        }
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
      toast.success("Documentos guardados", {
        description: "Toda tu información personal, documentos, ubicación y méritos están sincronizados."
      });
    } catch (err) {
      console.error("Error saving candidate documents progress:", err);
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const getDossierLevel = (score: number) => {
    if (score >= 85) return { label: "Documentación Completa", color: "emerald", badge: "Prioridad Máxima" };
    if (score >= 50) return { label: "Documentación en Progreso", color: "amber", badge: "Verificación Parcial" };
    return { label: "Documentación Básica", color: "zinc", badge: "Requisitos Pendientes" };
  };

  const levelInfo = getDossierLevel(totalScore);

  return (
    <div className="min-h-full max-w-5xl mx-auto space-y-8 pb-24 px-3 sm:px-6 lg:px-8 animate-in fade-in duration-200">
      
      {/* Hidden File Input for Documents */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* ========================================================================================================= */}
      {/* SECCIÓN 1: DATOS OFICIALES Y UBICACIÓN */}
      {/* ========================================================================================================= */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase px-1">
          Datos Oficiales y Ubicación
        </span>
        
        <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <User className="size-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">Datos Personales Oficiales</h3>
              <p className="text-xs text-muted-foreground truncate">Utilizados para emitir contratos y trámites de RRHH.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Nombre Completo Oficial (Disabled) */}
            <div className="space-y-1.5">
              <Label htmlFor="docFullName" className="text-xs font-semibold text-foreground">
                Nombre Completo Oficial
              </Label>
              <Input
                id="docFullName"
                value={fullName}
                disabled
                className="h-9.5 rounded-xl bg-muted/50 border-border/70 text-xs sm:text-sm text-muted-foreground cursor-not-allowed select-none"
              />
              <p className="text-[11px] text-muted-foreground font-medium">
                Para modificar tu nombre oficial, edítalo desde tu perfil público.
              </p>
            </div>

            {/* CURP & Fecha de Nacimiento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="docCurp" className="text-xs font-semibold text-foreground">
                    CURP Oficial (18 caracteres) <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {curp.length}/18
                  </span>
                </div>
                <Input
                  id="docCurp"
                  maxLength={18}
                  value={curp}
                  onChange={(e) => setCurp(normalizeCurp(e.target.value))}
                  placeholder="EJ. HESA950412HDFRR09"
                  className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm uppercase font-mono tracking-wider"
                />
                <p className="text-[11px] text-muted-foreground font-medium">
                  Clave Única de Registro de Población.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="docBirthDate" className="text-xs font-semibold text-foreground">
                  Fecha de Nacimiento <span className="text-destructive">*</span>
                </Label>
                <DatePicker
                  id="docBirthDate"
                  value={birthDate}
                  onChange={(newDate) => setBirthDate(newDate)}
                  placeholder="Selecciona tu fecha de nacimiento"
                  captionLayout="dropdown"
                  startYear={1940}
                  endYear={new Date().getFullYear() - 15}
                  maxDate={new Date()}
                />
                <p className="text-[11px] text-muted-foreground font-medium">
                  Fecha oficial para cotejo de mayoría de edad.
                </p>
              </div>
            </div>

            {/* Correo Electrónico & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="docEmail" className="text-xs font-semibold text-foreground">
                  Correo Electrónico <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="docEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="candidato@correo.com"
                    className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm pr-9"
                  />
                  <Mail className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Vinculado a notificaciones y ofertas.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="docPhone" className="text-xs font-semibold text-foreground">
                  WhatsApp / Celular <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center h-9.5 px-3 rounded-xl bg-muted/50 border border-border/70 text-xs font-semibold text-muted-foreground shrink-0 select-none">
                    <span className="mr-1.5">🇲🇽</span> +52
                  </div>
                  <div className="relative flex-1">
                    <Input
                      id="docPhone"
                      type="tel"
                      value={formatPhoneDisplay(phone)}
                      onChange={(e) => setPhone(normalizePhone(e.target.value))}
                      placeholder="10 dígitos (ej. 999 123 4567)"
                      className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm pr-9"
                    />
                    <Phone className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Contacto directo para entrevistas.
                </p>
              </div>
            </div>

            {/* Zona de Residencia y Cobertura Laboral (Radar) */}
            <div className="pt-2">
              <FormLocationSelector
                value={locationStatus}
                cityValue={city}
                zoneValue={zone}
                onChange={({ city: newCity, zone: newZone, locationStr }) => {
                  setCity(newCity);
                  setZone(newZone);
                  setLocationStatus(locationStr);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================================================= */}
      {/* SECCIÓN 2: DOCUMENTOS DE IDENTIDAD Y RESIDENCIA */}
      {/* ========================================================================================================= */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase px-1">
          Documentos de Identidad y Residencia
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Comprobante de Domicilio */}
          <DocumentUploadCard
            title="Comprobante de Domicilio"
            description="CFE, Agua o Telefonía no mayor a 3 meses. Acredita tu residencia en la zona."
            document={proofAddressDoc}
            docType="proof_of_address"
            isUploading={isUploading && targetDocType === "proof_of_address"}
            onRequestUpload={requestFileUpload}
            onOpenPreview={(doc) => handleOpenPreview(doc, "Comprobante de Domicilio")}
            onDeleteDocument={handleDeleteDocument}
          />
        </div>
      </div>

      {/* ========================================================================================================= */}
      {/* SECCIÓN 3: CURRÍCULUM Y CONSTANCIAS LABORALES */}
      {/* ========================================================================================================= */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase px-1">
          Currículum y Constancias Laborales
        </span>

        <div className="space-y-4">
          {/* CV Digital */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Constancias Laborales */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Briefcase className="size-4" />
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">Constancias Laborales</h4>
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold rounded-lg">
                    {workCertificates.length} adjuntas
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cartas de finiquito, constancias de empleo o cartas laborales previas.
                </p>
              </div>

              {workCertificates.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {workCertificates.map((doc) => (
                    <div key={doc.id} className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="size-4 text-primary shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">{doc.file_name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenPreview(doc, "Constancia Laboral")}
                          className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc)}
                          className="size-7 rounded-lg text-destructive hover:text-destructive/80 cursor-pointer"
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
                className="w-full rounded-xl text-xs font-medium gap-1.5 h-9.5 border-dashed hover:border-solid cursor-pointer shadow-2xs"
              >
                <Plus className="size-3.5" />
                <span>Agregar Constancia Laboral</span>
              </Button>
            </div>

            {/* Cartas de Recomendación */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Award className="size-4" />
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">Cartas de Recomendación</h4>
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold rounded-lg">
                    {recommendationLetters.length} adjuntas
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cartas personales o de antiguos empleadores que respalden tu ética.
                </p>
              </div>

              {recommendationLetters.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {recommendationLetters.map((doc) => (
                    <div key={doc.id} className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="size-4 text-primary shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">{doc.file_name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenPreview(doc, "Carta de Recomendación")}
                          className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc)}
                          className="size-7 rounded-lg text-destructive hover:text-destructive/80 cursor-pointer"
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
                className="w-full rounded-xl text-xs font-medium gap-1.5 h-9.5 border-dashed hover:border-solid cursor-pointer shadow-2xs"
              >
                <Plus className="size-3.5" />
                <span>Agregar Carta de Recomendación</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================================================= */}
      {/* SECCIÓN 4: MÉRITOS Y FORMACIÓN COMPLEMENTARIA */}
      {/* ========================================================================================================= */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase px-1">
          Méritos y Formación Complementaria
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cursos y Talleres */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Award className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-foreground">Cursos y Talleres</h4>
                  <p className="text-xs text-muted-foreground">Diplomados o capacitaciones realizadas.</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddCourseModalOpen(true)}
                className="rounded-xl text-xs font-medium gap-1 h-8 px-3 cursor-pointer shadow-2xs"
              >
                <Plus className="size-3.5" />
                <span>Agregar</span>
              </Button>
            </div>

            {courses.length === 0 ? (
              <div className="p-5 rounded-xl bg-muted/30 border border-dashed border-border/70 text-center text-xs text-muted-foreground">
                Aún no has registrado cursos. Agrega diplomados o talleres para sumar méritos.
              </div>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => (
                  <div key={course.id} className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{course.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{course.institution}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCourses((prev) => prev.filter((c) => c.id !== course.id))}
                      className="size-7 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certificaciones y Licencias */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-foreground">Certificaciones Oficiales</h4>
                  <p className="text-xs text-muted-foreground">Distintivo H, Primeros Auxilios, etc.</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddCertModalOpen(true)}
                className="rounded-xl text-xs font-medium gap-1 h-8 px-3 cursor-pointer shadow-2xs"
              >
                <Plus className="size-3.5" />
                <span>Agregar</span>
              </Button>
            </div>

            {certifications.length === 0 ? (
              <div className="p-5 rounded-xl bg-muted/30 border border-dashed border-border/70 text-center text-xs text-muted-foreground">
                No hay certificaciones registradas.
              </div>
            ) : (
              <div className="space-y-2">
                {certifications.map((cert) => (
                  <div key={cert.id} className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{cert.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{cert.issuer}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCertifications((prev) => prev.filter((c) => c.id !== cert.id))}
                      className="size-7 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Idiomas */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Globe className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-foreground">Idiomas</h4>
                  <p className="text-xs text-muted-foreground">Nivel conversacional y dominio.</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddLangModalOpen(true)}
                className="rounded-xl text-xs font-medium gap-1 h-8 px-3 cursor-pointer shadow-2xs"
              >
                <Plus className="size-3.5" />
                <span>Agregar</span>
              </Button>
            </div>

            {languages.length === 0 ? (
              <div className="p-5 rounded-xl bg-muted/30 border border-dashed border-border/70 text-center text-xs text-muted-foreground">
                Registra los idiomas que dominas (Ej. Inglés B2, Maya, etc.).
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <Badge
                    key={lang.id}
                    variant="secondary"
                    className="px-2.5 py-1 rounded-lg text-xs font-medium gap-1.5 bg-secondary text-secondary-foreground"
                  >
                    <span>{lang.language}</span>
                    <span className="text-[10px] text-muted-foreground">({lang.level})</span>
                    <button
                      type="button"
                      onClick={() => setLanguages((prev) => prev.filter((l) => l.id !== lang.id))}
                      className="text-muted-foreground hover:text-foreground cursor-pointer ml-0.5"
                      aria-label={`Eliminar ${lang.language}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Portafolio Digital */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-foreground">Portafolio Digital o Web</h4>
                <p className="text-xs text-muted-foreground">Muestra tus proyectos anteriores o enlace profesional.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://behance.net/mi-perfil o LinkedIn"
                className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
              />
              {portfolioUrl && (
                <a
                  href={portfolioUrl.startsWith("http") ? portfolioUrl : `https://${portfolioUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button variant="outline" size="icon" className="size-9.5 rounded-xl cursor-pointer">
                    <ExternalLink className="size-4 text-muted-foreground" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================================================= */}
      {/* SECCIÓN 5: PRIVACIDAD Y SEGURIDAD */}
      {/* ========================================================================================================= */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase px-1">
          Seguridad y Privacidad
        </span>

        <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground">Protocolo de Privacidad K&apos;anPro</h3>
              <p className="text-xs text-muted-foreground">
                Tus documentos oficiales y privados están protegidos con RLS y cifrado de extremo a extremo en Supabase Storage.
              </p>
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/60">
            <span className="text-xs text-muted-foreground">
              Únicamente se comparten con empresas verificadas a las que decidas postularte formalmente.
            </span>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 font-semibold text-xs rounded-lg self-start sm:self-auto shrink-0">
              Vigente y Protegido
            </Badge>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-4 text-primary shrink-0" />
          <span>Recuerda guardar los cambios para sincronizar tus documentos oficiales.</span>
        </div>

        <Button
          onClick={handleSaveProgress}
          disabled={isSaving}
          className="w-full sm:w-auto h-10 px-6 rounded-xl font-semibold text-xs sm:text-sm gap-2 cursor-pointer shadow-xs"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Guardar Documentos
        </Button>
      </div>

      {/* ========================================================================================================= */}
      {/* MODALS */}
      {/* ========================================================================================================= */}

      {/* 1. Document Preview Modal */}
      <Dialog open={!!previewData} onOpenChange={(open) => !open && setPreviewData(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
          <DialogHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
            <div className="min-w-0 pr-4">
              <DialogTitle className="text-sm sm:text-base font-semibold text-foreground truncate">
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
                <Button size="sm" variant="outline" className="rounded-xl text-xs font-medium gap-1.5 h-8 px-3">
                  <Download className="size-3.5" />
                  <span>Descargar</span>
                </Button>
              </a>
            )}
          </DialogHeader>

          <div className="p-4 sm:p-6 flex-1 min-h-[360px] flex items-center justify-center bg-muted/20 overflow-auto">
            {isLoadingPreview ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span>Cargando documento cifrado...</span>
              </div>
            ) : previewData?.url ? (
              previewData.isPdf ? (
                <iframe
                  src={`${previewData.url}#toolbar=0`}
                  className="w-full h-[480px] rounded-xl border border-border"
                  title="PDF Preview"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewData.url}
                  alt={previewData.name}
                  className="max-h-[480px] w-auto object-contain rounded-xl shadow-xs"
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
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-5 sm:p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">Agregar Curso o Diplomado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Nombre del Curso / Formación *</Label>
              <Input
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                placeholder="Ej. Diplomado en Manejo Higiénico de Alimentos"
                className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Institución Educativa / Empresa</Label>
              <Input
                value={newCourseInst}
                onChange={(e) => setNewCourseInst(e.target.value)}
                placeholder="Ej. Instituto Gastronómico de Mérida"
                className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddCourseModalOpen(false)} className="rounded-xl text-xs h-8.5">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddCourse} className="rounded-xl text-xs font-medium h-8.5 px-4">
              Guardar Curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Add Certification Modal */}
      <Dialog open={isAddCertModalOpen} onOpenChange={setIsAddCertModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-5 sm:p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">Agregar Certificación Oficial</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Nombre de la Certificación *</Label>
              <Input
                value={newCertName}
                onChange={(e) => setNewCertName(e.target.value)}
                placeholder="Ej. Distintivo H, Certificación CONOCER"
                className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Organismo Emisor / Autoridad</Label>
              <Input
                value={newCertIssuer}
                onChange={(e) => setNewCertIssuer(e.target.value)}
                placeholder="Ej. Secretaría de Turismo (SECTUR)"
                className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddCertModalOpen(false)} className="rounded-xl text-xs h-8.5">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddCertification} className="rounded-xl text-xs font-medium h-8.5 px-4">
              Guardar Certificación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Add Language Modal */}
      <Dialog open={isAddLangModalOpen} onOpenChange={setIsAddLangModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-5 sm:p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">Agregar Idioma</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Idioma *</Label>
              <Input
                value={newLangName}
                onChange={(e) => setNewLangName(e.target.value)}
                placeholder="Ej. Inglés, Francés, Maya"
                className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Nivel de Dominio</Label>
              <select
                value={newLangLevel}
                onChange={(e) => setNewLangLevel(e.target.value)}
                className="w-full h-9.5 px-3 bg-background border border-border/70 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Básico (A1-A2)">Básico (A1-A2)</option>
                <option value="Intermedio (B1-B2)">Intermedio (B1-B2)</option>
                <option value="Avanzado / Profesional (C1-C2)">Avanzado / Profesional (C1-C2)</option>
                <option value="Nativo / Bilingüe">Nativo / Bilingüe</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddLangModalOpen(false)} className="rounded-xl text-xs h-8.5">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddLanguage} className="rounded-xl text-xs font-medium h-8.5 px-4">
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
    <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm sm:text-base font-semibold text-foreground">{title}</h4>
          {required && (
            <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30 bg-primary/5 rounded-md">
              Requerido
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {document ? (
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="size-4.5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-foreground truncate">{document.file_name}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="size-3" /> Documento Verificado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenPreview(document)}
              className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              title="Vista previa"
            >
              <Eye className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteDocument(document)}
              className="size-7 rounded-lg text-destructive hover:text-destructive/80 cursor-pointer"
              title="Eliminar documento"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onRequestUpload(docType)}
          disabled={isUploading}
          className="w-full p-5 border-2 border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/5 rounded-xl flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group"
        >
          {isUploading ? (
            <Loader2 className="size-6 text-primary animate-spin" />
          ) : (
            <UploadCloud className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
            {isUploading ? "Cargando archivo..." : "Haz clic para subir documento (PDF o Imagen)"}
          </span>
          <span className="text-[10px] text-muted-foreground">Máximo 10 MB</span>
        </button>
      )}
    </div>
  );
}

