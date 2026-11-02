"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Building2,
  Globe,
  MapPin,
  Loader2,
  Camera,
  Edit3,
  RefreshCw,
  Save,
  Phone,
  Image as ImageIcon,
  ShieldCheck,
  FileText,
} from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
import { useCompanyProfileForm } from "../hooks/use-company-profile-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CompanyPageHeader } from "./shared/company-page-header";
import { optimizeImageForStorage } from "@/lib/storage/optimize-upload";

const CompanyLocationMap = dynamic(
  () =>
    import("@/modules/auth/components/company-location-map").then(
      (mod) => mod.CompanyLocationMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-56 sm:h-64 rounded-2xl border border-border/70 bg-muted/20 flex flex-col items-center justify-center gap-2 text-muted-foreground animate-pulse">
        <MapPin className="size-5 text-primary/60 animate-bounce" />
        <span className="text-xs font-semibold">Cargando mapa interactivo...</span>
      </div>
    ),
  }
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export interface InitialProfile {
  company_name?: string | null;
  legal_name?: string | null;
  industry?: string | null;
  website_or_linkedin?: string | null;
  website?: string | null;
  location?: string | null;
  logo_url?: string | null;
  avatar_url?: string | null;
  description?: string | null;
  phone?: string | null;
  contact_phone?: string | null;
  whatsapp_number?: string | null;
  company_size?: string | null;
  fiscal_regime?: "persona_moral" | "persona_fisica" | string | null;
  entity_type?: string | null;
  rfc?: string | null;
  is_validated?: boolean | null;
  is_verified?: boolean | null;
  verification_status?: "pending" | "approved" | "rejected" | "unsubmitted" | string | null;
  banner_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  address_details?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  operation_hours?: string | null;
}

const CITIES_LIST = [
  "Mérida, Yucatán",
  "Cancún, Quintana Roo",
  "Playa del Carmen, Quintana Roo",
  "Tulum, Quintana Roo",
  "Chetumal, Quintana Roo",
  "Valladolid, Yucatán",
  "Cozumel, Quintana Roo",
  "Bacalar, Quintana Roo",
  "Puerto Morelos, Quintana Roo",
  "Felipe Carrillo Puerto, Quintana Roo",
  "Campeche, Campeche",
  "Ciudad del Carmen, Campeche",
  "Progreso, Yucatán",
  "Otra ciudad del Sureste",
];



const COMPANY_SIZE_LABELS: Record<string, string> = {
  "1-10": "1 - 10 empleados",
  "11-50": "11 - 50 empleados",
  "51-200": "51 - 200 empleados",
  "201-500": "201 - 500 empleados",
  "500+": "Más de 500 empleados",
};

const INDUSTRY_LABELS: Record<string, string> = {
  "Restaurantes / Hotelería": "Restaurantes / Hotelería / Turismo",
  "Comercial": "Comercio & Ventas al por Menor",
  "Tecnología": "Tecnología & Software",
  "Salud": "Salud & Bienestar",
  "Finanzas": "Finanzas & Contabilidad",
  "Educación": "Educación & Capacitación",
  "Administración": "Administración & Operaciones",
  "Diseño": "Diseño & Medios",
  "Marketing": "Marketing & Publicidad",
  "Otro": "Otro Sector",
};

export function CompanyProfileForm({
  initialProfile,
  userId,
}: {
  initialProfile: InitialProfile;
  userId: string;
}) {
  const { form, isSaving, onSubmit, handleReset } = useCompanyProfileForm(
    initialProfile,
    userId
  );

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const logoUrl = watch("logo_url");
  const bannerUrl = watch("banner_url");
  const description = watch("description") || "";
  const companyName = watch("company_name");
  const location = watch("location");

  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = React.useState(false);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    if (rawFile.size > 5 * 1024 * 1024) {
      toast.error("Archivo demasiado grande", {
        description: "El logotipo no debe superar los 5 MB.",
      });
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(rawFile.type)) {
      toast.error("Formato no compatible", {
        description: "Usa un archivo JPG, PNG, WEBP o SVG.",
      });
      return;
    }

    setIsUploadingLogo(true);

    try {
      const { file: optimizedFile, previewUrl } = await optimizeImageForStorage(rawFile, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.82,
      });
      setValue("logo_url", previewUrl);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserId = user?.id || userId;
      const fileExt = optimizedFile.name.split(".").pop()?.toLowerCase() || "webp";
      const filePath = `${currentUserId}/logo.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, optimizedFile, {
          upsert: true,
          contentType: optimizedFile.type,
          cacheControl: "31536000",
        });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setValue("logo_url", `${urlData.publicUrl}?v=${Date.now()}`, {
          shouldValidate: true,
          shouldDirty: true,
        });
        toast.success("Logotipo actualizado", {
          description: "La imagen comercial de tu empresa ha sido guardada.",
        });
      }
    } catch (err: unknown) {
      console.error("Error uploading logo:", err);
      const msg = err instanceof Error ? err.message : "No se pudo subir la imagen a la nube.";
      toast.error("Error al subir logotipo", {
        description: msg,
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    if (rawFile.size > 8 * 1024 * 1024) {
      toast.error("Archivo demasiado grande", {
        description: "La portada no debe superar los 8 MB.",
      });
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(rawFile.type)) {
      toast.error("Formato no compatible", {
        description: "Usa un archivo JPG, PNG o WEBP.",
      });
      return;
    }

    setIsUploadingBanner(true);

    try {
      const { file: optimizedFile, previewUrl } = await optimizeImageForStorage(rawFile, {
        maxWidth: 1280,
        maxHeight: 480,
        quality: 0.82,
      });
      setValue("banner_url", previewUrl);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserId = user?.id || userId;
      const fileExt = optimizedFile.name.split(".").pop()?.toLowerCase() || "webp";
      const filePath = `${currentUserId}/banner.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, optimizedFile, {
          upsert: true,
          contentType: optimizedFile.type,
          cacheControl: "31536000",
        });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setValue("banner_url", `${urlData.publicUrl}?v=${Date.now()}`, {
          shouldValidate: true,
          shouldDirty: true,
        });
        toast.success("Portada actualizada", {
          description: "La imagen de portada ha sido guardada.",
        });
      }
    } catch (err: unknown) {
      console.error("Error uploading banner:", err);
      const msg = err instanceof Error ? err.message : "No se pudo subir la imagen a la nube.";
      toast.error("Error al subir portada", {
        description: msg,
      });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const charCount = description.length;
  const isWarningCount = charCount >= 280;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 w-full"
    >
      <CompanyPageHeader
        title="Perfil de Empresa"
        description="Administra la identidad corporativa, redes sociales y contacto para tus vacantes públicas."
        badge={
          initialProfile?.is_validated || initialProfile?.is_verified || initialProfile?.verification_status === "approved" ? (
            <Badge variant="outline" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
              Verificada
            </Badge>
          ) : undefined
        }
      />

      <form onSubmit={onSubmit} method="POST" className="space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. SHADCN ALERT: VALIDACIÓN Y ESTADO DE CUENTA                            */}
        {/* ========================================================================= */}
        {initialProfile?.is_validated || initialProfile?.is_verified || initialProfile?.verification_status === "approved" ? (
          <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 p-4 sm:p-5">
            <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
            <div className="space-y-0.5">
              <AlertTitle className="text-sm font-extrabold">
                Empresa Verificada (Insignia de Confianza Activa)
              </AlertTitle>
              <AlertDescription className="text-xs text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                Tu perfil corporativo cuenta con validación oficial. Tus vacantes tienen prioridad en el feed de postulantes.
              </AlertDescription>
            </div>
          </Alert>
        ) : (
          <Alert className="border border-border/80 bg-muted/40 p-4 sm:p-5">
            <ShieldCheck className="size-5 text-primary" />
            <div className="space-y-1">
              <AlertTitle className="text-sm font-bold text-foreground">
                Sello de Verificación Corporativa
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
                Valida tus datos fiscales oficiales (RFC, razón social y régimen) y expediente legal para obtener la insignia de confianza corporativa.
              </AlertDescription>
            </div>
            <AlertAction className="static sm:absolute sm:top-4 sm:right-4 mt-3 sm:mt-0">
              <Button
                size="sm"
                render={<Link href="/dashboard/company/verification" />}
                className="font-bold cursor-pointer"
              >
                Ir a Verificación Legal
              </Button>
            </AlertAction>
          </Alert>
        )}

        {/* ========================================================================= */}
        {/* 2. CARD PRINCIPAL UNIFICADA (HEADER + CONTENT + FOOTER)                   */}
        {/* ========================================================================= */}
        <Card className="overflow-hidden p-0 py-0 gap-0 border border-border/60 rounded-3xl shadow-sm bg-card">
          
          {/* ---------------- CARD HEADER: PORTADA, LOGO Y NOMBRE DE EMPRESA -------- */}
          <CardHeader className="p-0 border-b border-border/60 gap-0 rounded-t-3xl">
            {/* Banner Cover Image */}
            <div className="relative w-full h-48 sm:h-64 bg-muted/30 overflow-hidden group">
              {bannerUrl ? (
                <img
                  src={bannerUrl}
                  alt="Portada de la empresa"
                  className="w-full h-full object-cover object-center block"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center bg-muted/40">
                  <ImageIcon className="size-10 stroke-[1.2]" />
                  <span className="text-xs font-bold uppercase tracking-wider mt-2 text-foreground">
                    Imagen de Portada Comercial
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    Recomendado: 1200 x 400 px (Restaurante, Hotel, Oficina o Sucursal)
                  </p>
                </div>
              )}

              {/* Botón Cambiar Portada */}
              <div className="absolute top-4 right-4 z-20">
                <Button
                  type="button"
                  size="sm"
                  disabled={isSaving || isUploadingBanner}
                  className="bg-background/90 text-foreground hover:bg-background border border-border/60 backdrop-blur-xs flex items-center gap-1.5 shadow-sm relative cursor-pointer font-bold"
                >
                  {isUploadingBanner ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-primary" />
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="size-3.5 text-primary" />
                      <span>{bannerUrl ? "Cambiar Portada" : "Subir Portada"}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={isSaving || isUploadingBanner}
                    onChange={handleBannerChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Subir portada"
                  />
                </Button>
              </div>
            </div>

            {/* Circular Logo and Company Name identity box */}
            <div className="p-5 sm:p-6 md:p-8 pt-0 -mt-12 sm:-mt-14 flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-start text-center sm:text-left relative z-10">
              {/* Logo circular uploader */}
              <div className="relative shrink-0 group">
                <div className="size-24 sm:size-28 rounded-full bg-card border-4 border-card shadow-md flex items-center justify-center overflow-hidden relative">
                  {isUploadingLogo ? (
                    <div className="flex flex-col items-center justify-center p-2">
                      <Loader2 className="size-6 animate-spin text-primary" />
                      <span className="text-[8px] font-bold mt-1 text-muted-foreground">Subiendo...</span>
                    </div>
                  ) : logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={companyName || "Logo"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground p-2">
                      <Building2 className="size-7 text-muted-foreground/60" />
                      <span className="text-[9px] font-bold uppercase mt-1">Logo</span>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    disabled={isSaving || isUploadingLogo}
                    onChange={handleLogoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Subir logo"
                  />
                </div>

                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-transform">
                  {isUploadingLogo ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Edit3 className="size-3.5" />
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    disabled={isSaving || isUploadingLogo}
                    onChange={handleLogoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Cambiar logo"
                  />
                </div>
              </div>

              {/* Company Name Header Details */}
              <div className="flex-1 pt-1 sm:pt-14 space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight truncate max-w-md">
                    {companyName && companyName.trim() !== "" ? companyName : "Nombre de tu Empresa"}
                  </h2>
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20 font-bold px-2.5 py-0.5 rounded-full text-[10px]"
                  >
                    🌐 Perfil Público
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-xl">
                  {location ? `${location} • ` : ""}
                  Gestiona la información comercial, presencia digital, canales de contacto y sede de tu empresa.
                </p>
              </div>
            </div>
          </CardHeader>

          {/* ---------------- CARD CONTENT: ORGANIZED EDITABLE FIELDS ---------------- */}
          <CardContent className="p-5 sm:p-6 md:p-8 space-y-8 divide-y divide-border/60">
            
            {/* SECCIÓN 1: INFORMACIÓN GENERAL Y MARCA */}
            <div className="space-y-5 pb-6 sm:pb-8">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">
                    Información General & Marca
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Datos principales de tu organización visibles para los candidatos.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {/* Nombre Comercial */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>Nombre Comercial</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Ej. Grupo Hotelero Maya"
                      {...register("company_name")}
                      className="pl-10 w-full"
                    />
                  </div>
                  {errors.company_name && (
                    <p className="text-xs font-semibold text-destructive">
                      {errors.company_name.message}
                    </p>
                  )}
                </div>

                {/* Sector Industrial */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>Sector Industrial</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={watch("industry") || ""}
                    onValueChange={(val) => setValue("industry", val || "", { shouldValidate: true })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un sector">
                        {(val: string | null) => (val && INDUSTRY_LABELS[val]) || val || "Selecciona un sector"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Restaurantes / Hotelería">Restaurantes / Hotelería / Turismo</SelectItem>
                      <SelectItem value="Comercial">Comercio & Ventas al por Menor</SelectItem>
                      <SelectItem value="Tecnología">Tecnología & Software</SelectItem>
                      <SelectItem value="Salud">Salud & Bienestar</SelectItem>
                      <SelectItem value="Finanzas">Finanzas & Contabilidad</SelectItem>
                      <SelectItem value="Educación">Educación & Capacitación</SelectItem>
                      <SelectItem value="Administración">Administración & Operaciones</SelectItem>
                      <SelectItem value="Diseño">Diseño & Medios</SelectItem>
                      <SelectItem value="Marketing">Marketing & Publicidad</SelectItem>
                      <SelectItem value="Otro">Otro Sector</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-xs font-semibold text-destructive">
                      {errors.industry.message}
                    </p>
                  )}
                </div>

                {/* Tamaño de la Empresa */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-bold text-foreground">
                    Tamaño de la Empresa
                  </label>
                  <Select
                    value={watch("company_size") || ""}
                    onValueChange={(val) => setValue("company_size", val || undefined)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona el tamaño">
                        {(val: string | null) => (val && COMPANY_SIZE_LABELS[val]) || val || "Selecciona el tamaño"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1 - 10 empleados</SelectItem>
                      <SelectItem value="11-50">11 - 50 empleados</SelectItem>
                      <SelectItem value="51-200">51 - 200 empleados</SelectItem>
                      <SelectItem value="201-500">201 - 500 empleados</SelectItem>
                      <SelectItem value="500+">Más de 500 empleados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bio Comercial / Descripción */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span>Bio Comercial / Acerca de la Empresa</span>
                  </label>
                  <span
                    className={cn(
                      "text-[11px] font-bold",
                      isWarningCount ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {charCount} / 300
                  </span>
                </div>
                <Textarea
                  maxLength={300}
                  placeholder="Describe brevemente la cultura laboral, historia y valores de tu empresa para atraer al mejor talento..."
                  {...register("description")}
                  className="w-full min-h-[90px] resize-none"
                />
                {errors.description && (
                  <p className="text-xs font-semibold text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: CONTACTO Y CANALES DIGITALES */}
            <div className="space-y-5 py-6 sm:py-8">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Phone className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">
                    Contacto & Presencia Digital
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Canales de comunicación directa para postulantes y coordinación.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                {/* Teléfono / WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    WhatsApp de Contacto
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
                    <Input
                      type="tel"
                      placeholder="999 123 4567"
                      {...register("phone")}
                      className="pl-10 w-full"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs font-semibold text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Sitio Web */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Sitio Web Oficial
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-blue-600 dark:text-blue-400 pointer-events-none" />
                    <Input
                      type="url"
                      placeholder="https://empresa.com"
                      {...register("website")}
                      className="pl-10 w-full"
                    />
                  </div>
                  {errors.website && (
                    <p className="text-xs font-semibold text-destructive">
                      {errors.website.message}
                    </p>
                  )}
                </div>

                {/* Instagram */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Instagram
                  </label>
                  <div className="relative">
                    <InstagramIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-rose-500 pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="https://instagram.com/empresa"
                      {...register("instagram_url")}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>

                {/* Facebook */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Facebook
                  </label>
                  <div className="relative">
                    <FacebookIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-blue-600 pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="https://facebook.com/empresa"
                      {...register("facebook_url")}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: UBICACIÓN Y SEDE OPERATIVA */}
            <div className="space-y-5 pt-6 sm:pt-8">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">
                    Ubicación & Sede Operativa
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Selecciona tu ciudad sede y marca en el mapa interactivo la ubicación física exacta de tu empresa o sucursal.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Selector de Ciudad Sede */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>Ciudad Sede en el Sureste</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={watch("location") || "Mérida, Yucatán"}
                    onValueChange={(val) => {
                      if (val) {
                        setValue("location", val, { shouldValidate: true, shouldDirty: true });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-10 px-3.5 rounded-xl bg-card border border-input text-foreground text-xs sm:text-sm shadow-2xs cursor-pointer">
                      <SelectValue placeholder="Selecciona la ciudad sede" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border/80 bg-popover text-popover-foreground max-h-64">
                      {CITIES_LIST.map((city) => (
                        <SelectItem
                          key={city}
                          value={city}
                          className="text-xs sm:text-sm font-medium cursor-pointer rounded-lg py-2"
                        >
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && (
                    <p className="text-xs font-semibold text-destructive">
                      {errors.location.message}
                    </p>
                  )}
                </div>

                {/* Mapa Interactivo con Leaflet + OpenStreetMap + Pin y Geocodificación */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5 text-primary" />
                      <span>Mapa con Pin Interactivo & Geocodificación</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      OpenStreetMap
                    </span>
                  </label>
                  <CompanyLocationMap
                    selectedCity={watch("location") || "Mérida, Yucatán"}
                    initialAddress={watch("address_details") || ""}
                    initialCoordinates={
                      typeof watch("latitude") === "number" && typeof watch("longitude") === "number"
                        ? [watch("latitude")!, watch("longitude")!]
                        : typeof initialProfile?.latitude === "number" && typeof initialProfile?.longitude === "number"
                        ? [initialProfile.latitude, initialProfile.longitude]
                        : undefined
                    }
                    onLocationChange={(res) => {
                      if (res.address) {
                        setValue("address_details", res.address, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                      if (res.city) {
                        setValue("location", res.city, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                      if (typeof res.latitude === "number" && typeof res.longitude === "number") {
                        setValue("latitude", res.latitude, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setValue("longitude", res.longitude, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

          </CardContent>

          {/* ---------------- CARD FOOTER: ACTION BUTTONS ---------------- */}
          <CardFooter className="p-4 sm:p-6 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                handleReset();
                toast.info("Cambios descartados", {
                  description: "Se han restaurado los valores anteriores de tu perfil corporativo.",
                });
              }}
              className="font-bold cursor-pointer gap-1.5 shadow-none"
            >
              <RefreshCw className="size-3.5" />
              <span>Descartar</span>
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="font-bold cursor-pointer gap-2 shadow-sm transition-all"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              <span>{isSaving ? "Guardando Perfil..." : "Guardar Perfil"}</span>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </motion.div>
  );
}
