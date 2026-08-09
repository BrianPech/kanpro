"use client";

import * as React from "react";
import { useState } from "react";
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
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { candidateProfileService } from "../services/candidate-profile";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface MandatoryState {
  fullName: string;
  birthDate: string;
  curp: string;
  officialIdFile: string | null;
  email: string;
  phone: string;
  isPhoneVerified: boolean;
  profilePhotoUrl: string | null;
  acceptedTerms: boolean;
}

interface CourseItem {
  id: string;
  title: string;
  institution: string;
  file: string | null;
}

interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  file: string | null;
}

interface LanguageItem {
  id: string;
  language: string;
  level: string;
}

interface OptionalState {
  proofAddressFile: string | null;
  cvFile: string | null;
  workCertificates: string[];
  recommendationLetters: string[];
  courses: CourseItem[];
  certifications: CertificationItem[];
  languages: LanguageItem[];
  portfolioUrl: string;
  portfolioFile: string | null;
}

export function CandidateDocumentsView() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"mandatory" | "optional">("mandatory");

  // Mandatory fields state
  const [mandatory, setMandatory] = useState<MandatoryState>({
    fullName: "",
    birthDate: "1995-04-12",
    curp: "HESA950412HDFRR09",
    officialIdFile: "INE_Frontal_y_Reverso_2026.pdf",
    email: "",
    phone: "",
    isPhoneVerified: true,
    profilePhotoUrl: null,
    acceptedTerms: true,
  });

  // Fetch candidate profile on mount
  React.useEffect(() => {
    async function loadCandidateProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profile = await candidateProfileService.getProfile(user.id);
          if (profile) {
            setMandatory((prev) => ({
              ...prev,
              fullName: profile.full_name || prev.fullName,
              email: profile.email || user.email || prev.email,
              phone: profile.whatsapp_number || prev.phone,
              profilePhotoUrl: profile.avatar_url || prev.profilePhotoUrl,
            }));
          }
        }
      } catch (err) {
        console.error("Error loading candidate profile in documents view:", err);
      }
    }
    loadCandidateProfile();
  }, [supabase]);

  // Optional fields state
  const [optional, setOptional] = useState<OptionalState>({
    proofAddressFile: "Comprobante_CFE_Julio.pdf",
    cvFile: "CV_Ana_Hernandez_2026.pdf",
    workCertificates: ["Constancia_Hotel_Xcaret_2024.pdf"],
    recommendationLetters: ["Carta_Recomendacion_Gerencia.pdf"],
    courses: [
      { id: "1", title: "Atención al Cliente Excepcional", institution: "Instituto de Gastronomía y Turismo", file: "Diploma_Turismo.pdf" }
    ],
    certifications: [
      { id: "1", name: "Servicio de Bebidas y Alimentos Nivel 2", issuer: "CONOCER México", file: "Certificado_CONOCER.pdf" }
    ],
    languages: [
      { id: "1", language: "Español", level: "Nativo" },
      { id: "2", language: "Inglés", level: "Avanzado (C1)" }
    ],
    portfolioUrl: "https://dribbble.com/analucia_h",
    portfolioFile: null
  });

  // UI Modals
  const [previewFile, setPreviewFile] = useState<{ name: string; type: string } | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
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
    Boolean(mandatory.fullName.trim()),
    Boolean(mandatory.birthDate),
    Boolean(mandatory.curp.trim().length === 18),
    Boolean(mandatory.officialIdFile),
    Boolean(mandatory.email.trim()),
    Boolean(mandatory.phone.trim() && mandatory.isPhoneVerified),
    Boolean(mandatory.profilePhotoUrl),
    Boolean(mandatory.acceptedTerms),
  ].filter(Boolean).length;

  const optionalCompleted = [
    Boolean(optional.proofAddressFile),
    Boolean(optional.cvFile),
    optional.workCertificates.length > 0,
    optional.recommendationLetters.length > 0,
    optional.courses.length > 0,
    optional.certifications.length > 0,
    optional.languages.length > 0,
    Boolean(optional.portfolioUrl || optional.portfolioFile),
  ].filter(Boolean).length;

  const totalProgressPercent = Math.round(((mandatoryCompleted * 2) + optionalCompleted) / 24 * 100);

  const handleSimulateFileUpload = (field: keyof MandatoryState | keyof OptionalState, defaultFileName: string) => {
    if (field in mandatory) {
      setMandatory((prev) => ({ ...prev, [field]: defaultFileName }));
    } else {
      setOptional((prev) => ({ ...prev, [field]: defaultFileName }));
    }
  };

  const handleAddCourse = () => {
    if (!newCourseTitle.trim()) return;
    setOptional((prev) => ({
      ...prev,
      courses: [
        ...prev.courses,
        { id: Date.now().toString(), title: newCourseTitle, institution: newCourseInst || "Institución", file: "Certificado_Adjunto.pdf" }
      ]
    }));
    setNewCourseTitle("");
    setNewCourseInst("");
  };

  const handleAddCertification = () => {
    if (!newCertName.trim()) return;
    setOptional((prev) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        { id: Date.now().toString(), name: newCertName, issuer: newCertIssuer || "Organismo Emisor", file: "Certificacion_Adjunta.pdf" }
      ]
    }));
    setNewCertName("");
    setNewCertIssuer("");
  };

  const handleAddLanguage = () => {
    if (!newLangName.trim()) return;
    setOptional((prev) => ({
      ...prev,
      languages: [
        ...prev.languages,
        { id: Date.now().toString(), language: newLangName, level: newLangLevel }
      ]
    }));
  };

  const handleSaveProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await candidateProfileService.updateProfile(user.id, {
          full_name: mandatory.fullName,
          whatsapp_number: mandatory.phone,
        });
      }
      toast.success("Expediente guardado", {
        description: "Tus documentos e información personal han sido actualizados con éxito."
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
              Sube tus documentos requeridos para verificar tu perfil. Las empresas otorgan prioridad a candidatos con expediente verificado.
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
            <span>¡Expediente actualizado exitosamente! Los cambios han sido guardados.</span>
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#5c7c9b]" />
                  <span>1. Nombre Completo</span>
                </label>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600">
                  Obligatorio
                </span>
              </div>
              <Input
                type="text"
                value={mandatory.fullName}
                onChange={(e) => setMandatory({ ...mandatory, fullName: e.target.value })}
                placeholder="Nombre(s) y Apellidos como en identificación"
                className="h-12 bg-[#f8fafc] dark:bg-zinc-800/60 border-[#ebeef3] dark:border-zinc-700 rounded-[14px] px-4 font-semibold text-sm"
              />
            </div>

            {/* Obligatorio 2: Fecha de Nacimiento */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#5c7c9b]" />
                  <span>2. Fecha de Nacimiento</span>
                </label>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600">
                  Obligatorio
                </span>
              </div>
              <Input
                type="date"
                value={mandatory.birthDate}
                onChange={(e) => setMandatory({ ...mandatory, birthDate: e.target.value })}
                className="h-12 bg-[#f8fafc] dark:bg-zinc-800/60 border-[#ebeef3] dark:border-zinc-700 rounded-[14px] px-4 font-semibold text-sm"
              />
            </div>

            {/* Obligatorio 3: CURP */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#5c7c9b]" />
                  <span>3. CURP (18 caracteres)</span>
                </label>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600">
                  Obligatorio
                </span>
              </div>
              <Input
                type="text"
                maxLength={18}
                value={mandatory.curp}
                onChange={(e) => setMandatory({ ...mandatory, curp: e.target.value.toUpperCase() })}
                placeholder="EJ. HESA950412HDFRR09"
                className="h-12 bg-[#f8fafc] dark:bg-zinc-800/60 border-[#ebeef3] dark:border-zinc-700 rounded-[14px] px-4 font-bold tracking-wider text-sm uppercase"
              />
              <p className="text-xs text-[#5c7c9b] font-medium">Clave Única de Registro de Población</p>
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

              {mandatory.officialIdFile ? (
                <div className="p-4 rounded-[16px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 truncate">
                        {mandatory.officialIdFile}
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
                      onClick={() => setPreviewFile({ name: mandatory.officialIdFile!, type: "Identificación Oficial" })}
                      className="h-8 w-8 p-0 rounded-lg text-[#5c7c9b] hover:text-[#1f2732]"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMandatory({ ...mandatory, officialIdFile: null })}
                      className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleSimulateFileUpload("officialIdFile", "INE_Vigente_2026.pdf")}
                  className="w-full p-5 border-2 border-dashed border-[#ebeef3] dark:border-zinc-700 rounded-[18px] flex flex-col items-center justify-center text-center gap-2 hover:bg-[#f8fafc] dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-8 h-8 text-[#5c7c9b]" />
                  <span className="text-xs font-bold text-[#1f2732] dark:text-zinc-200">
                    Subir INE, Pasaporte o Cédula Profesional (PDF o Imagen)
                  </span>
                </button>
              )}
            </div>

            {/* Obligatorio 5: Correo Electrónico */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#5c7c9b]" />
                  <span>5. Correo Electrónico</span>
                </label>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verificado
                </span>
              </div>
              <Input
                type="email"
                value={mandatory.email}
                onChange={(e) => setMandatory({ ...mandatory, email: e.target.value })}
                className="h-12 bg-[#f8fafc] dark:bg-zinc-800/60 border-[#ebeef3] dark:border-zinc-700 rounded-[14px] px-4 font-semibold text-sm"
              />
            </div>

            {/* Obligatorio 6: Teléfono Celular Verificado */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#5c7c9b]" />
                  <span>6. Teléfono Celular Verificado</span>
                </label>
                {mandatory.isPhoneVerified ? (
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verificado por SMS
                  </span>
                ) : (
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600">
                    Pendiente SMS
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="tel"
                  value={mandatory.phone}
                  onChange={(e) => setMandatory({ ...mandatory, phone: e.target.value, isPhoneVerified: false })}
                  className="h-12 bg-[#f8fafc] dark:bg-zinc-800/60 border-[#ebeef3] dark:border-zinc-700 rounded-[14px] px-4 font-semibold text-sm flex-1"
                />
                {!mandatory.isPhoneVerified && (
                  <Button
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="h-12 px-4 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs rounded-[14px] cursor-pointer"
                  >
                    Verificar
                  </Button>
                )}
              </div>
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
                {mandatory.profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mandatory.profilePhotoUrl}
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
                    variant="outline"
                    size="sm"
                    onClick={() => handleSimulateFileUpload("profilePhotoUrl", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80")}
                    className="h-8 rounded-lg text-xs font-bold border-[#ebeef3] dark:border-zinc-700"
                  >
                    Cambiar Fotografía
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
                  id="terms-check"
                  checked={mandatory.acceptedTerms}
                  onChange={(e) => setMandatory({ ...mandatory, acceptedTerms: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="terms-check" className="text-xs font-medium text-[#3e546d] dark:text-zinc-300 leading-relaxed cursor-pointer">
                  Acepto los{" "}
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(true)}
                    className="text-emerald-600 dark:text-emerald-400 font-bold underline underline-offset-2"
                  >
                    Términos y Condiciones
                  </button>{" "}
                  y el{" "}
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(true)}
                    className="text-emerald-600 dark:text-emerald-400 font-bold underline underline-offset-2"
                  >
                    Aviso de Privacidad
                  </button>{" "}
                  para el tratamiento de mi expediente laboral en K&apos;anPro.
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
              {optional.proofAddressFile ? (
                <div className="p-4 rounded-[16px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 truncate">
                      {optional.proofAddressFile}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOptional({ ...optional, proofAddressFile: null })}
                    className="h-8 w-8 p-0 text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleSimulateFileUpload("proofAddressFile", "Comprobante_Domicilio_Reciente.pdf")}
                  className="w-full h-12 rounded-[14px] border-dashed border-[#ebeef3] dark:border-zinc-700 text-xs font-bold text-[#5c7c9b]"
                >
                  <Plus className="w-4 h-4 mr-2" /> Adjuntar CFE, Agua o Predial (máx 3 meses)
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
              {optional.cvFile ? (
                <div className="p-4 rounded-[16px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 truncate">
                      {optional.cvFile}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewFile({ name: optional.cvFile!, type: "Curriculum Vitae" })}
                      className="h-8 w-8 p-0 text-[#5c7c9b]"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOptional({ ...optional, cvFile: null })}
                      className="h-8 w-8 p-0 text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleSimulateFileUpload("cvFile", "CV_Actualizado_2026.pdf")}
                  className="w-full h-12 rounded-[14px] border-dashed border-[#ebeef3] dark:border-zinc-700 text-xs font-bold text-[#5c7c9b]"
                >
                  <Plus className="w-4 h-4 mr-2" /> Subir CV en formato PDF
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
                  {optional.workCertificates.length} adjuntas
                </span>
              </div>
              <div className="space-y-2">
                {optional.workCertificates.map((doc, idx) => (
                  <div key={idx} className="p-3.5 rounded-[14px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between text-xs font-bold text-[#1f2732] dark:text-zinc-200">
                    <span className="truncate">{doc}</span>
                    <button
                      onClick={() => setOptional({ ...optional, workCertificates: optional.workCertificates.filter((_, i) => i !== idx) })}
                      className="text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOptional({ ...optional, workCertificates: [...optional.workCertificates, `Constancia_Laboral_${optional.workCertificates.length + 1}.pdf`] })}
                  className="w-full h-10 rounded-[12px] text-xs font-bold border-dashed border-[#ebeef3] dark:border-zinc-700 text-[#5c7c9b]"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar Constancia Laboral
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
                  {optional.recommendationLetters.length} adjuntas
                </span>
              </div>
              <div className="space-y-2">
                {optional.recommendationLetters.map((doc, idx) => (
                  <div key={idx} className="p-3.5 rounded-[14px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between text-xs font-bold text-[#1f2732] dark:text-zinc-200">
                    <span className="truncate">{doc}</span>
                    <button
                      onClick={() => setOptional({ ...optional, recommendationLetters: optional.recommendationLetters.filter((_, i) => i !== idx) })}
                      className="text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOptional({ ...optional, recommendationLetters: [...optional.recommendationLetters, `Carta_Recomendacion_${optional.recommendationLetters.length + 1}.pdf`] })}
                  className="w-full h-10 rounded-[12px] text-xs font-bold border-dashed border-[#ebeef3] dark:border-zinc-700 text-[#5c7c9b]"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Agregar Carta de Recomendación
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
                  {optional.courses.length} registrados
                </span>
              </div>

              <div className="space-y-2">
                {optional.courses.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-[14px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1f2732] dark:text-zinc-200">{item.title}</p>
                      <p className="text-[11px] text-[#5c7c9b] font-medium">{item.institution}</p>
                    </div>
                    <button
                      onClick={() => setOptional({ ...optional, courses: optional.courses.filter((c) => c.id !== item.id) })}
                      className="text-rose-500 hover:text-rose-600 cursor-pointer"
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
                  {optional.certifications.length} registradas
                </span>
              </div>

              <div className="space-y-2">
                {optional.certifications.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-[14px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1f2732] dark:text-zinc-200">{item.name}</p>
                      <p className="text-[11px] text-[#5c7c9b] font-medium">{item.issuer}</p>
                    </div>
                    <button
                      onClick={() => setOptional({ ...optional, certifications: optional.certifications.filter((c) => c.id !== item.id) })}
                      className="text-rose-500 hover:text-rose-600 cursor-pointer"
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
                    onClick={handleAddCertification}
                    className="h-10 px-4 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            {/* Opcional 7: Idiomas */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#1f2732] dark:text-zinc-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#5c7c9b]" />
                  <span>7. Idiomas</span>
                </label>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f5f7fa] dark:bg-zinc-800 text-[#5c7c9b]">
                  {optional.languages.length} agregados
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {optional.languages.map((item) => (
                  <div key={item.id} className="px-3.5 py-2 rounded-[14px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center gap-2 text-xs font-bold text-[#1f2732] dark:text-zinc-200">
                    <span>{item.language}: <span className="text-emerald-600 dark:text-emerald-400">{item.level}</span></span>
                    <button
                      onClick={() => setOptional({ ...optional, languages: optional.languages.filter((l) => l.id !== item.id) })}
                      className="text-[#5c7c9b] hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#ebeef3] dark:border-zinc-800 flex gap-2">
                <Input
                  type="text"
                  placeholder="Idioma (ej. Francés, Alemán)"
                  value={newLangName}
                  onChange={(e) => setNewLangName(e.target.value)}
                  className="h-10 bg-[#f8fafc] dark:bg-zinc-800/60 text-xs rounded-xl flex-1"
                />
                <select
                  value={newLangLevel}
                  onChange={(e) => setNewLangLevel(e.target.value)}
                  className="h-10 bg-[#f8fafc] dark:bg-zinc-800/60 text-xs font-semibold rounded-xl px-2 border border-[#ebeef3] dark:border-zinc-700 text-[#1f2732] dark:text-zinc-200"
                >
                  <option value="Básico (A2)">Básico (A2)</option>
                  <option value="Intermedio (B2)">Intermedio (B2)</option>
                  <option value="Avanzado (C1)">Avanzado (C1)</option>
                  <option value="Nativo">Nativo</option>
                </select>
                <Button
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
                  <label className="text-xs font-semibold text-[#5c7c9b]">Enlace Web / Sitio Portafolio</label>
                  <Input
                    type="url"
                    value={optional.portfolioUrl}
                    onChange={(e) => setOptional({ ...optional, portfolioUrl: e.target.value })}
                    placeholder="https://miportafolio.com"
                    className="h-11 bg-[#f8fafc] dark:bg-zinc-800/60 border-[#ebeef3] dark:border-zinc-700 rounded-[14px] text-xs font-semibold mt-1"
                  />
                </div>

                {optional.portfolioFile ? (
                  <div className="p-3.5 rounded-[14px] bg-[#f8fafc] dark:bg-zinc-800/60 border border-[#ebeef3] dark:border-zinc-700 flex items-center justify-between text-xs font-bold text-[#1f2732] dark:text-zinc-200">
                    <span>{optional.portfolioFile}</span>
                    <button
                      onClick={() => setOptional({ ...optional, portfolioFile: null })}
                      className="text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSimulateFileUpload("portfolioFile", "Portafolio_Proyectos_2026.pdf")}
                    className="w-full h-10 rounded-[12px] text-xs font-bold border-dashed border-[#ebeef3] dark:border-zinc-700 text-[#5c7c9b]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Adjuntar Portafolio en PDF
                  </Button>
                )}
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
            onClick={handleSaveProgress}
            className="h-12 px-6 bg-[#1f2732] dark:bg-zinc-100 hover:bg-[#2c3847] dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-extrabold text-sm rounded-[16px] shadow-xs cursor-pointer"
          >
            Guardar Expediente
          </Button>
        </div>
      </div>

      {/* MODAL 1: Document Preview Modal */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="sm:max-w-[480px] rounded-[28px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1f2732] dark:text-zinc-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>{previewFile?.type}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5c7c9b]">
              {previewFile?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 bg-[#f8fafc] dark:bg-zinc-800/50 border border-[#ebeef3] dark:border-zinc-700 rounded-[20px] text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-[#1f2732] dark:text-zinc-100">
              Documento guardado y listo para revisión
            </p>
            <p className="text-xs text-[#5c7c9b]">
              Formato verificado y encriptado en el almacenamiento seguro de K&apos;anPro.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewFile(null)}
              className="w-full h-11 rounded-[14px] text-xs font-bold"
            >
              Cerrar Vista Previa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: SMS Phone Verification Modal */}
      <Dialog open={isVerificationModalOpen} onOpenChange={setIsVerificationModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-[28px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#1f2732] dark:text-zinc-50 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              <span>Verificar Teléfono Celular</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5c7c9b]">
              Hemos enviado un código SMS de 6 dígitos al número {mandatory.phone}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Ej. 583920"
              className="h-12 text-center text-lg font-extrabold tracking-widest bg-[#f8fafc] dark:bg-zinc-800 rounded-[14px]"
            />
            <p className="text-[11px] text-center text-[#5c7c9b]">
              ¿No recibiste el código? <button type="button" className="text-emerald-600 font-bold">Reenviar SMS</button>
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsVerificationModalOpen(false)}
              className="flex-1 h-11 rounded-[14px] text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setMandatory({ ...mandatory, isPhoneVerified: true });
                setIsVerificationModalOpen(false);
              }}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-[14px] cursor-pointer"
            >
              Confirmar Código
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Terms & Privacy Modal */}
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
              Tus documentos e información sensible (CURP, Identificación Oficial y comprobantes) son resguardados bajo estándares estricto de cifrado de extremo a extremo. Únicamente serán compartidos con empresas registradas ante las cuales postules explícitamente tu vacante.
            </p>
            <p className="font-bold text-[#1f2732] dark:text-zinc-100">2. Veracidad de la Información</p>
            <p>
              El candidato garantiza que los datos proporcionados son veraces y corresponden a su titularidad legal. La alteración o falsificación de documentos cancelará la cuenta de usuario de inmediato.
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsTermsModalOpen(false)}
              className="w-full h-11 bg-[#1f2732] text-white font-bold text-xs rounded-[14px]"
            >
              Entendido y Aceptado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
