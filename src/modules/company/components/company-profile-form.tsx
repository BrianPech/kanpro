"use client";

import * as React from "react";
import Link from "next/link";
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
  Navigation,
  FileText,
  CreditCard,
} from "lucide-react";
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
import { findNearestCityAndZone, cleanCityName, resolveLocationFromCoords } from "@/config/geo";

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
  banner_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  address_details?: string | null;
  operation_hours?: string | null;
}

// Client-side image compressor for high-performance uploads
async function compressImageForUpload(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85
): Promise<{ file: File; previewUrl: string }> {
  if (file.type === "image/svg+xml") {
    return { file, previewUrl: URL.createObjectURL(file) };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ file, previewUrl: URL.createObjectURL(file) });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const outputType = file.type === "image/png" ? "image/png" : "image/webp";
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, previewUrl: URL.createObjectURL(file) });
              return;
            }
            const ext = outputType === "image/webp" ? "webp" : "png";
            const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
            const optimizedFile = new File([blob], `${baseName}.${ext}`, {
              type: outputType,
            });
            const previewUrl = URL.createObjectURL(blob);
            resolve({ file: optimizedFile, previewUrl });
          },
          outputType,
          quality
        );
      };
      img.onerror = () => resolve({ file, previewUrl: URL.createObjectURL(file) });
    };
    reader.onerror = () => resolve({ file, previewUrl: URL.createObjectURL(file) });
  });
}

const QUICK_CITIES = [
  "Felipe Carrillo Puerto, Q. Roo",
  "Playa del Carmen, Q. Roo",
  "Tulum, Q. Roo",
  "Cancún, Q. Roo",
  "Chetumal, Q. Roo",
  "Bacalar, Q. Roo",
  "Cozumel, Q. Roo",
  "Puerto Morelos, Q. Roo",
  "Mérida, Yucatán",
  "Valladolid, Yucatán",
  "Progreso, Yucatán",
];

const FISCAL_REGIME_LABELS: Record<string, string> = {
  persona_moral: "Persona Moral (Sociedades / Empresas - RFC de 12 dígitos)",
  persona_fisica: "Persona Física con Actividad Empresarial (RFC de 13 dígitos)",
};

const COMPANY_SIZE_LABELS: Record<string, string> = {
  "1-10": "1 - 10 colaboradores",
  "11-50": "11 - 50 colaboradores",
  "51-200": "51 - 200 colaboradores",
  "201-500": "201 - 500 colaboradores",
  "500+": "Más de 500 colaboradores",
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
  const fiscalRegime = watch("fiscal_regime") || "persona_moral";

  const [isLocating, setIsLocating] = React.useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = React.useState(false);

  // GPS location detection matching Wizard implementation
  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("Geolocalización no disponible", {
        description: "Tu navegador o dispositivo no tiene GPS activo.",
      });
      return;
    }

    setIsLocating(true);

    const onLocationSuccess = async (pos: GeolocationPosition) => {
      try {
        const { latitude, longitude } = pos.coords;
        const resolved = await resolveLocationFromCoords(latitude, longitude);
        const finalCity = cleanCityName(resolved.city);
        const finalZone = resolved.zone || "";

        setValue("location", finalCity, { shouldValidate: true, shouldDirty: true });
        if (finalZone) {
          setValue("address_details", finalZone, { shouldValidate: true, shouldDirty: true });
        }

        setIsLocating(false);
        toast.success("Ubicación GPS detectada", {
          description: `Se configuró: ${resolved.displayLocation}`,
        });
      } catch {
        setIsLocating(false);
        toast.error("No se pudo resolver la ubicación exacta", {
          description: "Selecciona la ciudad de la lista o ingrésala manualmente.",
        });
      }
    };

    const onLocationFailure = (err: GeolocationPositionError) => {
      setIsLocating(false);
      if (err.code === err.PERMISSION_DENIED) {
        toast.error("Permiso de ubicación denegado", {
          description: "Otorga permiso de ubicación o selecciona la zona manualmente.",
        });
      } else {
        toast.error("No se pudo detectar tu ubicación", {
          description: "Selecciona tu ciudad y zona en las opciones de abajo.",
        });
      }
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationFailure,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

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
      const { file: optimizedFile, previewUrl } = await compressImageForUpload(rawFile, 512, 512, 0.88);
      setValue("logo_url", previewUrl);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserId = user?.id || userId;
      const fileExt = optimizedFile.name.split(".").pop() || "webp";
      const filePath = `${currentUserId}/logo_${Date.now()}.${fileExt}`;

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
        setValue("logo_url", urlData.publicUrl, { shouldValidate: true, shouldDirty: true });
        toast.success("Logotipo actualizado", {
          description: "La imagen comercial de tu empresa ha sido guardada.",
        });
      }
    } catch (err: any) {
      console.error("Error uploading logo:", err);
      toast.error("Error al subir logotipo", {
        description: err.message || "No se pudo subir la imagen a la nube.",
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
      const { file: optimizedFile, previewUrl } = await compressImageForUpload(rawFile, 1600, 600, 0.85);
      setValue("banner_url", previewUrl);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserId = user?.id || userId;
      const fileExt = optimizedFile.name.split(".").pop() || "webp";
      const filePath = `${currentUserId}/banner_${Date.now()}.${fileExt}`;

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
        setValue("banner_url", urlData.publicUrl, { shouldValidate: true, shouldDirty: true });
        toast.success("Portada actualizada", {
          description: "La imagen de portada ha sido guardada.",
        });
      }
    } catch (err: any) {
      console.error("Error uploading banner:", err);
      toast.error("Error al subir portada", {
        description: err.message || "No se pudo subir la imagen a la nube.",
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
      <form onSubmit={onSubmit} method="POST" className="space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. SHADCN ALERT: VALIDACIÓN Y ESTADO DE CUENTA                            */}
        {/* ========================================================================= */}
        {initialProfile?.is_validated ? (
          <Alert className="rounded-2xl border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 p-4 sm:p-5 shadow-2xs">
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
          <Alert className="rounded-2xl border border-border/80 bg-muted/40 p-4 sm:p-5 shadow-2xs">
            <ShieldCheck className="size-5 text-primary" />
            <div className="space-y-1">
              <AlertTitle className="text-sm font-bold text-foreground">
                Verificación de Cuenta (Persona Moral)
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
                Completa la información legal y sube los documentos requeridos para obtener la insignia de confianza corporativa.
              </AlertDescription>
            </div>
            <AlertAction className="static sm:absolute sm:top-4 sm:right-4 mt-3 sm:mt-0">
              <Button
                size="sm"
                render={<Link href="/dashboard/company/verification" />}
                className="h-9 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
              >
                Ir a Verificación
              </Button>
            </AlertAction>
          </Alert>
        )}

        {/* ========================================================================= */}
        {/* 2. CARD PRINCIPAL UNIFICADA (HEADER + CONTENT + FOOTER)                   */}
        {/* ========================================================================= */}
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          
          {/* ---------------- CARD HEADER: PORTADA, LOGO Y NOMBRE DE EMPRESA -------- */}
          <CardHeader className="p-0 border-b border-border/60">
            {/* Banner Cover Image */}
            <div className="relative h-44 sm:h-56 bg-muted/40 overflow-hidden group">
              {bannerUrl ? (
                <img
                  src={bannerUrl}
                  alt="Portada de la empresa"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                  <ImageIcon className="size-9 stroke-[1.2]" />
                  <span className="text-xs font-bold uppercase tracking-wider mt-2 text-foreground">
                    Imagen de Portada Comercial
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    Recomendado: 1200 x 400 px (Restaurante, Hotel, Oficina o Sucursal)
                  </p>
                </div>
              )}

              {/* Botón Cambiar Portada */}
              <div className="absolute top-4 right-4">
                <Button
                  type="button"
                  size="sm"
                  disabled={isSaving || isUploadingBanner}
                  className="h-9 px-3.5 rounded-xl text-xs font-bold bg-background/90 text-foreground hover:bg-background border border-border/60 backdrop-blur-xs flex items-center gap-1.5 shadow-sm relative cursor-pointer"
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
                  Gestiona la información corporativa, ubicación, datos fiscales y canales de contacto de tu empresa.
                </p>
              </div>
            </div>
          </CardHeader>

          {/* ---------------- CARD CONTENT: ORGANIZED EDITABLE FIELDS ---------------- */}
          <CardContent className="p-5 sm:p-6 md:p-8 space-y-8 divide-y divide-border/60">
            
            {/* SECCIÓN 1: INFORMACIÓN GENERAL Y MARCA */}
            <div className="space-y-5">
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
                      className="h-11 rounded-xl bg-input/40 border border-border/80 pl-10 text-xs sm:text-sm font-semibold focus-visible:bg-background"
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
                    <SelectTrigger className="h-11 w-full rounded-xl bg-input/40 border border-border/80 px-3.5 text-xs sm:text-sm font-semibold focus-visible:bg-background cursor-pointer">
                      <SelectValue placeholder="Selecciona un sector">
                        {(val: string | null) => (val && INDUSTRY_LABELS[val]) || val || "Selecciona un sector"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border/80 bg-popover text-xs font-semibold">
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
                    <SelectTrigger className="h-11 w-full rounded-xl bg-input/40 border border-border/80 px-3.5 text-xs sm:text-sm font-semibold focus-visible:bg-background cursor-pointer">
                      <SelectValue placeholder="Selecciona el tamaño">
                        {(val: string | null) => (val && COMPANY_SIZE_LABELS[val]) || val || "Selecciona el tamaño"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border/80 bg-popover text-xs font-semibold">
                      <SelectItem value="1-10">1 - 10 colaboradores</SelectItem>
                      <SelectItem value="11-50">11 - 50 colaboradores</SelectItem>
                      <SelectItem value="51-200">51 - 200 colaboradores</SelectItem>
                      <SelectItem value="201-500">201 - 500 colaboradores</SelectItem>
                      <SelectItem value="500+">Más de 500 colaboradores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bio Comercial / Descripción (Moved UP next to general info) */}
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
                  className="w-full min-h-[90px] rounded-xl bg-input/40 border border-border/80 p-3 text-xs sm:text-sm font-medium leading-relaxed focus-visible:bg-background resize-none"
                />
                {errors.description && (
                  <p className="text-xs font-semibold text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: CONTACTO Y CANALES DIGITALES */}
            <div className="space-y-5 pt-6">
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
                      className="h-11 rounded-xl bg-input/40 border border-border/80 pl-10 text-xs sm:text-sm font-semibold focus-visible:bg-background"
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
                      className="h-11 rounded-xl bg-input/40 border border-border/80 pl-10 text-xs sm:text-sm font-semibold focus-visible:bg-background"
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
                      className="h-11 rounded-xl bg-input/40 border border-border/80 pl-10 text-xs sm:text-sm font-semibold focus-visible:bg-background"
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
                      className="h-11 rounded-xl bg-input/40 border border-border/80 pl-10 text-xs sm:text-sm font-semibold focus-visible:bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: UBICACIÓN Y SEDE OPERATIVA */}
            <div className="space-y-5 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">
                      Ubicación & Sede Operativa
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      Dirección física donde opera la sucursal o centro de trabajo.
                    </p>
                  </div>
                </div>

                {/* Botón de Detección GPS Automática */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="h-9 px-3.5 rounded-xl border-border/80 text-xs font-bold text-primary hover:bg-primary/10 gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  {isLocating ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Navigation className="size-3.5" />
                  )}
                  <span>{isLocating ? "Detectando por GPS..." : "Autodetectar por GPS"}</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Ciudad Principal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>Ciudad Principal / Sede</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Ej. Mérida, Yucatán"
                      {...register("location")}
                      className="h-11 rounded-xl bg-input/40 border border-border/80 pl-10 text-xs sm:text-sm font-semibold focus-visible:bg-background"
                    />
                  </div>

                  {/* Pills de Ciudades Rápidas */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {QUICK_CITIES.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setValue("location", city, { shouldValidate: true, shouldDirty: true })}
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer",
                          location === city
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60"
                        )}
                      >
                        {city}
                      </button>
                    ))}
                  </div>

                  {errors.location && (
                    <p className="text-xs font-semibold text-destructive">
                      {errors.location.message}
                    </p>
                  )}
                </div>

                {/* Dirección Detallada / Referencias */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Dirección Detallada / Referencias
                  </label>
                  <Input
                    type="text"
                    placeholder="Ej. Calle 60 #345 x 43 y 45, Col. Centro"
                    {...register("address_details")}
                    className="h-11 rounded-xl bg-input/40 border border-border/80 px-3.5 text-xs sm:text-sm font-semibold focus-visible:bg-background"
                  />
                  {errors.address_details && (
                    <p className="text-xs font-semibold text-destructive">
                      {errors.address_details.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: DATOS FISCALES Y FACTURACIÓN */}
            <div className="space-y-5 pt-6">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <CreditCard className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">
                    Datos Fiscales & Régimen
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Información legal y fiscal requerida por el SAT y facturación.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Régimen Fiscal Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>Régimen Fiscal / Tipo de Persona</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={fiscalRegime}
                    onValueChange={(val) => {
                      setValue("fiscal_regime", val as "persona_moral" | "persona_fisica", {
                        shouldValidate: true,
                      });
                      const currentRfc = watch("rfc") || "";
                      if (val === "persona_moral" && currentRfc.length > 12) {
                        setValue("rfc", currentRfc.substring(0, 12), { shouldValidate: true });
                      }
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl bg-input/40 border border-border/80 px-3.5 text-xs sm:text-sm font-semibold focus-visible:bg-background cursor-pointer">
                      <SelectValue placeholder="Selecciona Régimen Fiscal">
                        {(val: string | null) => (val && FISCAL_REGIME_LABELS[val]) || val || "Selecciona Régimen Fiscal"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border/80 bg-popover text-xs font-semibold">
                      <SelectItem value="persona_moral">
                        Persona Moral (Sociedades / Empresas - RFC de 12 dígitos)
                      </SelectItem>
                      <SelectItem value="persona_fisica">
                        Persona Física con Actividad Empresarial (RFC de 13 dígitos)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* RFC Fiscal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    RFC Fiscal ({fiscalRegime === "persona_fisica" ? "13 Caracteres" : "12 Caracteres"})
                  </label>
                  <Input
                    type="text"
                    maxLength={fiscalRegime === "persona_fisica" ? 13 : 12}
                    placeholder={fiscalRegime === "persona_fisica" ? "ABCD120315XXX" : "ABC120315XXX"}
                    value={watch("rfc") || ""}
                    onChange={(e) => {
                      const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9&Ñ]/g, "");
                      setValue("rfc", upper, { shouldValidate: true });
                    }}
                    className="h-11 rounded-xl bg-input/40 border border-border/80 px-3.5 text-xs sm:text-sm font-mono font-bold focus-visible:bg-background tracking-wider uppercase"
                  />
                  {errors.rfc ? (
                    <p className="text-xs font-semibold text-destructive">
                      {errors.rfc.message}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {fiscalRegime === "persona_fisica"
                        ? "RFC de 13 posiciones para persona física (4 letras + 6 números + 3 homoclave)."
                        : "RFC de 12 posiciones para persona moral (3 letras + 6 números + 3 homoclave)."}
                    </p>
                  )}
                </div>
              </div>
            </div>

          </CardContent>

          {/* ---------------- CARD FOOTER: ACTION BUTTONS ---------------- */}
          <CardFooter className="p-4 sm:p-6 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleReset();
                toast.info("Cambios descartados", {
                  description: "Se han restaurado los valores anteriores de tu perfil corporativo.",
                });
              }}
              className="h-10 px-4 rounded-xl text-xs font-bold border-border/80 hover:bg-muted cursor-pointer gap-1.5 shadow-none"
            >
              <RefreshCw className="size-3.5" />
              <span>Descartar</span>
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="h-10 px-6 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer gap-2 shadow-sm active:scale-95 transition-all"
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
