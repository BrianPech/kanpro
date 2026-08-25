"use client";

import * as React from "react";
import {
  Building2,
  Globe,
  MapPin,
  Loader2,
  Camera,
  Edit3,
  Sparkles,
  RefreshCw,
  Save,
  Phone,
  Image as ImageIcon,
  Bus,
  ShieldCheck,
  CheckSquare,
  Clock,
  Navigation,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2050/svg"
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
    xmlns="http://www.w3.org/2050/svg"
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
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanyProfileForm } from "../hooks/use-company-profile-form";
import { FormPhoneField, FormRfcField } from "@/components/form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GEO_CONFIG, findNearestCityAndZone, cleanCityName } from "@/config/geo";


export interface InitialProfile {
  company_name?: string | null;
  industry?: string | null;
  website_or_linkedin?: string | null;
  website?: string | null;
  location?: string | null;
  logo_url?: string | null;
  description?: string | null;
  phone?: string | null;
  company_size?: string | null;
  is_validated?: boolean | null;
  // New fields
  banner_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  address_details?: string | null;
  has_transport?: boolean | null;
  benefit_canteen?: boolean | null;
  benefit_tips?: boolean | null;
  benefit_imss?: boolean | null;
  benefit_uniforms?: boolean | null;
  benefit_growth?: boolean | null;
  operation_hours?: string | null;
}

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

  const [isLocating, setIsLocating] = React.useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = React.useState(false);
  const [gpsDetectedInfo, setGpsDetectedInfo] = React.useState<{
    city: string;
    address?: string;
  } | null>(null);

  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("Geolocalización no soportada", { description: "Tu navegador no soporta GPS." });
      return;
    }

    setIsLocating(true);
    const processPosition = async (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      const { city: nearestCity, zone: nearestZone } = findNearestCityAndZone(latitude, longitude);

      let detectedStreet = "";
      let detectedCity = nearestCity;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const geoData = await res.json();
        if (geoData && geoData.address) {
          const addr = geoData.address;
          const road = addr.road || addr.pedestrian || addr.street || "";
          const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || "";
          const cityName = addr.city || addr.town || addr.county || nearestCity;

          if (road || suburb) {
            detectedStreet = [road, suburb].filter(Boolean).join(", ");
          }
          if (cityName) {
            const matchedKey = Object.keys(GEO_CONFIG).find((k) =>
              cityName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cityName.toLowerCase())
            );
            detectedCity = matchedKey || cityName;
          }
        }
      } catch (e) {
        console.warn("Reverse geocoding fetch fallback:", e);
      }

      const cleanedCity = cleanCityName(detectedCity);
      setValue("location", cleanedCity, { shouldValidate: true, shouldDirty: true });
      if (detectedStreet) {
        setValue("address_details", detectedStreet, { shouldValidate: true, shouldDirty: true });
      }

      setGpsDetectedInfo({
        city: cleanedCity,
        address: detectedStreet || nearestZone,
      });

      setIsLocating(false);
      toast.success("Ubicación GPS confirmada", {
        description: `Ciudad: ${detectedCity}${detectedStreet ? ` • ${detectedStreet}` : ""}`,
      });
    };

    const handleGpsError = (err: GeolocationPositionError) => {
      if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
        navigator.geolocation.getCurrentPosition(
          processPosition,
          (fallbackErr) => {
            setIsLocating(false);
            if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
              toast.error("Permiso de ubicación denegado", {
                description: "Por favor otorga acceso a la ubicación en las preferencias de tu navegador.",
              });
            } else {
              toast.error("No se pudo obtener señal GPS", {
                description: "Ingresa la ubicación de la empresa manualmente.",
              });
            }
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
        return;
      }

      setIsLocating(false);
      if (err.code === err.PERMISSION_DENIED) {
        toast.error("Permiso de ubicación denegado", {
          description: "Por favor otorga acceso a la ubicación en el icono de candado de tu navegador.",
        });
      } else {
        toast.error("Error de geolocalización", {
          description: "No se pudo obtener la ubicación. Ingrésala manualmente.",
        });
      }
    };

    navigator.geolocation.getCurrentPosition(
      processPosition,
      handleGpsError,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  };
  const charCount = description.length;

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
      // 1. Client-side downscaling & WebP compression (max 512x512)
      const { file: optimizedFile, previewUrl } = await compressImageForUpload(rawFile, 512, 512, 0.88);
      setValue("logo_url", previewUrl);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || userId;
      const fileExt = optimizedFile.name.split(".").pop() || "webp";
      const filePath = `${currentUserId}/logo_${Date.now()}.${fileExt}`;

      // 2. Upload with 1-year immutable CDN Cache-Control
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, optimizedFile, {
          upsert: true,
          contentType: optimizedFile.type,
          cacheControl: "31536000",
        });

      if (uploadErr) {
        throw uploadErr;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setValue("logo_url", urlData.publicUrl, { shouldValidate: true, shouldDirty: true });
        toast.success("Logotipo guardado", {
          description: "La imagen comercial está optimizada y lista.",
        });
      }
    } catch (err: any) {
      console.error("Error uploading logo to storage:", err);
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
      // 1. Client-side downscaling & WebP compression (max 1600x600)
      const { file: optimizedFile, previewUrl } = await compressImageForUpload(rawFile, 1600, 600, 0.85);
      setValue("banner_url", previewUrl);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || userId;
      const fileExt = optimizedFile.name.split(".").pop() || "webp";
      const filePath = `${currentUserId}/banner_${Date.now()}.${fileExt}`;

      // 2. Upload with 1-year immutable CDN Cache-Control
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, optimizedFile, {
          upsert: true,
          contentType: optimizedFile.type,
          cacheControl: "31536000",
        });

      if (uploadErr) {
        throw uploadErr;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setValue("banner_url", urlData.publicUrl, { shouldValidate: true, shouldDirty: true });
        toast.success("Portada guardada", {
          description: "La portada comercial está optimizada y lista.",
        });
      }
    } catch (err: any) {
      console.error("Error uploading banner to storage:", err);
      toast.error("Error al subir portada", {
        description: err.message || "No se pudo subir la imagen a la nube.",
      });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const isWarningCount = charCount >= 280;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-4xl mx-auto w-full"
    >
      <form onSubmit={onSubmit} method="POST" className="space-y-8">
        
        {/* ========================================== */}
        {/* TRUST / VALIDATION BADGE BANNER            */}
        {/* ========================================== */}
        {initialProfile?.is_validated ? (
          <div className="flex items-center gap-3.5 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-2xs">
            <ShieldCheck className="size-6 shrink-0" />
            <div className="text-xs sm:text-sm font-semibold leading-relaxed">
              <span className="font-extrabold">Empresa Verificada</span>. Tu negocio ha sido validado por el equipo de K&apos;anPro. Tienes insignia de confianza activa en tu perfil público y tus ofertas tendrán prioridad en el feed de candidatos.
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-muted/40 border border-border text-muted-foreground shadow-2xs">
            <div className="flex items-center gap-3.5">
              <ShieldCheck className="size-6 shrink-0 text-muted-foreground" />
              <div className="text-xs sm:text-sm font-semibold leading-relaxed">
                <span className="font-extrabold text-foreground">Verificación de Cuenta (Persona Moral)</span>. Completa la información legal y sube los 13 documentos obligatorios para obtener la insignia de confianza corporativa.
              </div>
            </div>
            <Button
              render={<Link href="/dashboard/company/verification" />}
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shrink-0 cursor-pointer shadow-sm"
            >
              Ir a Verificación
            </Button>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 1: MARCA E IDENTIDAD VISUAL        */}
        {/* ========================================== */}
        <Card className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          {/* Header Banner Uploader */}
          <div className="relative h-48 sm:h-56 bg-muted/50 border-b border-border overflow-hidden group">
            {bannerUrl ? (
              <img src={bannerUrl} alt="Portada" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4">
                <ImageIcon className="size-10 stroke-[1.2]" />
                <span className="text-xs font-extrabold uppercase tracking-wider mt-2 text-foreground">Imagen de Portada / Banner Comercial</span>
                <p className="text-xs text-muted-foreground font-semibold mt-1">Recomendado: 1200x400px (Restaurante, Hotel, Local)</p>
              </div>
            )}
            
            <div className="absolute top-4 right-4">
              <Button
                type="button"
                disabled={isSaving || isUploadingBanner}
                className="h-10 rounded-xl text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 shadow-md relative cursor-pointer"
              >
                {isUploadingBanner ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Subiendo Portada...</span>
                  </>
                ) : (
                  <>
                    <Camera className="size-4" />
                    <span>{bannerUrl ? "Cambiar Portada" : "Subir Portada"}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={isSaving || isUploadingBanner}
                  onChange={handleBannerChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>
          </div>

          <div className="p-6 md:p-8 pt-0 -mt-16 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left relative z-10">
            {/* Logo uploader circular box */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-card border-4 border-card shadow-md flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
                {isUploadingLogo ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-foreground" />
                    <span className="text-[9px] font-bold mt-1 text-muted-foreground">Subiendo...</span>
                  </div>
                ) : logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="size-7" />
                    <span className="text-[10px] font-extrabold uppercase mt-1">Logo</span>
                  </div>
                )}
                
                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  disabled={isSaving || isUploadingLogo}
                  onChange={handleLogoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Float edit button */}
              <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground p-2 rounded-full shadow-md cursor-pointer active:scale-95 transition-transform">
                {isUploadingLogo ? <Loader2 className="size-4 animate-spin" /> : <Edit3 className="size-4" />}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  disabled={isSaving || isUploadingLogo}
                  onChange={handleLogoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Title / Info */}
            <div className="flex-grow pt-16 md:pt-20 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                <h3 className="text-[18px] sm:text-[20px] font-[800] text-foreground tracking-tight flex items-center gap-2">
                  <Sparkles className="size-5 text-primary shrink-0" />
                  Identidad de Marca
                </h3>
                <Badge variant="outline" className="bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20 font-bold px-3 py-0.5 rounded-full text-[11px]">
                  🌐 Pública (Visible para candidatos)
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold leading-relaxed max-w-lg">
                Sube tu logotipo comercial e imagen de portada para destacar en el feed de candidatos.
              </p>
            </div>
          </div>
        </Card>

        {/* ========================================== */}
        {/* SECTION 2: DATOS GENERALES Y REDES         */}
        {/* ========================================== */}
        <Card className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Commercial Name Input */}
            <div className="space-y-2.5">
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-foreground">
                Nombre Comercial *
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Ej. Restaurante La Costa"
                  {...register("company_name")}
                  className="w-full h-12 bg-background border border-border rounded-xl pl-11 pr-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring transition-all outline-none"
                />
              </div>
              {errors.company_name && (
                <p className="text-xs sm:text-sm font-semibold text-rose-500">
                  {errors.company_name.message}
                </p>
              )}
            </div>

            {/* Industry Sector Dropdown Select */}
            <div className="space-y-2.5">
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-foreground">
                Sector Industrial *
              </label>
              <Select
                value={watch("industry") || ""}
                onValueChange={(value) =>
                  setValue("industry", value || "", { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full h-12 bg-background border border-border rounded-xl px-4 text-sm font-semibold text-foreground focus:ring-2 focus:ring-ring transition-all outline-none shadow-none cursor-pointer">
                  <SelectValue placeholder="Selecciona un sector" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border bg-popover text-sm font-semibold">
                  <SelectItem value="Tecnología">Tecnología & Software</SelectItem>
                  <SelectItem value="Finanzas">Finanzas & Banca</SelectItem>
                  <SelectItem value="Salud">Salud & Bienestar</SelectItem>
                  <SelectItem value="Educación">Educación</SelectItem>
                  <SelectItem value="Diseño">Diseño & Creatividad</SelectItem>
                  <SelectItem value="Marketing">Marketing & Ventas</SelectItem>
                  <SelectItem value="Comercial">Comercial & Ventas</SelectItem>
                  <SelectItem value="Restaurantes / Hotelería">Restaurantes / Hotelería / Turismo</SelectItem>
                  <SelectItem value="Administración">Administración & Operaciones</SelectItem>
                  <SelectItem value="Otro">Otro Sector</SelectItem>
                </SelectContent>
              </Select>
              {errors.industry && (
                <p className="text-xs sm:text-sm font-semibold text-rose-500">
                  {errors.industry.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone Input */}
            <FormPhoneField
              id="company_phone"
              label="WhatsApp de Contacto"
              value={watch("phone")}
              onChange={(val) => setValue("phone", val, { shouldValidate: true })}
              error={errors.phone?.message}
              helperText="Número para recepción de candidatos y notificaciones de contratación."
            />

            {/* Company Size Input */}
            <div className="space-y-2.5">
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-foreground">
                Tamaño de la Empresa
              </label>
              <Select
                value={watch("company_size") || ""}
                onValueChange={(value) => setValue("company_size", value || undefined)}
              >
                <SelectTrigger className="w-full h-12 bg-background border border-border rounded-xl px-4 text-sm font-semibold text-foreground focus:ring-2 focus:ring-ring transition-all outline-none shadow-none cursor-pointer">
                  <SelectValue placeholder="Selecciona el tamaño" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border bg-popover text-sm font-semibold">
                  <SelectItem value="1-10">1 - 10 empleados</SelectItem>
                  <SelectItem value="11-50">11 - 50 empleados</SelectItem>
                  <SelectItem value="51-200">51 - 200 empleados</SelectItem>
                  <SelectItem value="201-500">201 - 500 empleados</SelectItem>
                  <SelectItem value="500+">Más de 500 empleados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fiscal Regime and RFC Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fiscal Regime Select */}
            <div className="space-y-2.5">
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-foreground">
                Régimen Fiscal / Tipo de Persona *
              </label>
              <Select
                value={watch("fiscal_regime") || "persona_moral"}
                onValueChange={(val) => {
                  setValue("fiscal_regime", val as any, { shouldValidate: true });
                  const currentRfc = watch("rfc") || "";
                  if (val === "persona_moral" && currentRfc.length > 12) {
                    setValue("rfc", currentRfc.substring(0, 12), { shouldValidate: true });
                  }
                }}
              >
                <SelectTrigger className="w-full h-12 bg-background border border-border rounded-xl px-4 text-sm font-semibold text-foreground focus:ring-2 focus:ring-ring transition-all outline-none shadow-none cursor-pointer">
                  <SelectValue placeholder="Selecciona Régimen Fiscal" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border bg-popover text-sm font-semibold">
                  <SelectItem value="persona_moral">Persona Moral (12 Caracteres)</SelectItem>
                  <SelectItem value="persona_fisica">Persona Física (13 Caracteres)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* RFC Input with Dynamic Rules */}
            <FormRfcField
              id="company_rfc"
              label="RFC Fiscal"
              value={watch("rfc")}
              onChange={(val) => setValue("rfc", val, { shouldValidate: true })}
              error={errors.rfc?.message}
              placeholder={watch("fiscal_regime") === "persona_fisica" ? "ABCD120315XXX" : "ABC120315XXX"}
              helperText={watch("fiscal_regime") === "persona_fisica" ? "RFC de 13 caracteres para personas físicas" : "RFC de 12 caracteres para personas morales"}
            />
          </div>

          <div className="h-px bg-border w-full" />

          {/* Social Media & Web Channels */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Canales Digitales</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Website Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Sitio Web</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="https://miempresa.com"
                    {...register("website")}
                    className="w-full h-11 bg-background border border-border rounded-xl pl-10 pr-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring transition-all outline-none"
                  />
                </div>
              </div>

              {/* Instagram Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Instagram</label>
                <div className="relative">
                  <InstagramIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="https://instagram.com/perfil"
                    {...register("instagram_url")}
                    className="w-full h-11 bg-background border border-border rounded-xl pl-10 pr-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring transition-all outline-none"
                  />
                </div>
              </div>

              {/* Facebook Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Facebook</label>
                <div className="relative">
                  <FacebookIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="https://facebook.com/pagina"
                    {...register("facebook_url")}
                    className="w-full h-11 bg-background border border-border rounded-xl pl-10 pr-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring transition-all outline-none"
                  />
                </div>
              </div>

            </div>
          </div>
        </Card>

        {/* ========================================== */}
        {/* SECTION 3: LOGÍSTICA Y MOVILIDAD          */}
        {/* ========================================== */}
        <Card className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MapPin className="size-5" />
            </div>
            <div>
              <h4 className="text-[16px] sm:text-[18px] font-[800] text-foreground tracking-tight">
                Logística y Ubicación de la Empresa
              </h4>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                Ubicación de la sede principal o sucursal operada en la región.
              </p>
            </div>
          </div>

          {/* Dynamic Active Location Status Banner */}
          {(watch("location") || watch("address_details")) ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="font-extrabold">
                    {gpsDetectedInfo && gpsDetectedInfo.city === watch("location")
                      ? "Ubicación Confirmada:"
                      : "Ubicación Actual:"}
                  </span>{" "}
                  <span className="font-bold">{watch("location") || "Ciudad no especificada"}</span>
                  {watch("address_details") ? ` • ${watch("address_details")}` : ""}
                </div>
              </div>
              <Badge className={cn(
                "text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 shadow-none",
                gpsDetectedInfo && gpsDetectedInfo.city === watch("location")
                  ? "bg-emerald-600 text-white"
                  : "bg-primary text-primary-foreground"
              )}>
                {gpsDetectedInfo && gpsDetectedInfo.city === watch("location") ? "Ubicación Activa" : "Registrada"}
              </Badge>
            </div>
          ) : null}

          {/* Location Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Flexible City & State Input */}
            <div className="space-y-2.5">
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-foreground">
                Ciudad Principal / Sede *
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Ej. Mérida, Yucatán o escribe tu ciudad..."
                  {...register("location")}
                  className="w-full h-12 bg-background border border-border rounded-xl pl-11 pr-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring transition-all outline-none"
                />
              </div>

              {/* Quick Select City Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-muted-foreground mr-1">Rápidos:</span>
                {[
                  "Felipe Carrillo Puerto, Q. Roo",
                  "Playa del Carmen, Q. Roo",
                  "Cancún, Q. Roo",
                  "Tulum, Q. Roo",
                  "Chetumal, Q. Roo",
                  "Bacalar, Q. Roo",
                  "Cozumel, Q. Roo",
                  "Puerto Morelos, Q. Roo",
                  "Mérida, Yucatán",
                  "Valladolid, Yucatán",
                  "Progreso, Yucatán",
                ].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setValue("location", city, { shouldValidate: true, shouldDirty: true })}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border cursor-pointer",
                      watch("location") === city
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/40 hover:border-border"
                    )}
                  >
                    {city}
                  </button>
                ))}
              </div>

              {errors.location && (
                <p className="text-xs sm:text-sm font-semibold text-rose-500">
                  {errors.location.message}
                </p>
              )}
            </div>

            {/* Detailed Street Address / Crossings */}
            <div className="space-y-2.5">
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-foreground">
                Dirección Detallada / Referencias *
              </label>
              <Input
                type="text"
                placeholder="Ej. Calle 10 Norte entre Av. 15 y 20, Col. Centro"
                {...register("address_details")}
                className="w-full h-12 bg-background border border-border rounded-xl px-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring transition-all outline-none"
              />
              {errors.address_details && (
                <p className="text-xs sm:text-sm font-semibold text-rose-500">
                  {errors.address_details.message}
                </p>
              )}
            </div>
          </div>

          {/* GPS Detection Button placed at the END */}
          <div className="pt-3 border-t border-border flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="w-full sm:w-auto h-11 px-5 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-none"
            >
              {isLocating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Navigation className="size-4 text-primary" />
              )}
              <span>{isLocating ? "Detectando ubicación actual..." : "Detectar mi ubicación actual"}</span>
            </Button>
          </div>
        </Card>

        {/* ========================================== */}
        {/* SECTION 5: BIO COMERCIAL                   */}
        {/* ========================================== */}
        <Card className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h4 className="text-[16px] sm:text-[18px] font-[800] text-foreground tracking-tight">
                Bio Comercial
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold leading-relaxed">
                Describe la misión, ambiente de trabajo y cultura de tu empresa.
              </p>
            </div>
            <span
              id="char-count"
              className={cn(
                "text-xs font-bold transition-colors",
                isWarningCount
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-muted-foreground"
              )}
            >
              {charCount} / 300
            </span>
          </div>

          <Textarea
            id="bio-textarea"
            maxLength={300}
            placeholder="Describe brevemente tu organización, cultura de trabajo y lo que ofreces..."
            {...register("description")}
            className="w-full min-h-[140px] bg-background border border-border rounded-xl p-4 text-sm font-medium leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none shadow-none"
          />
          {errors.description && (
            <p className="text-xs sm:text-sm font-semibold text-rose-500">
              {errors.description.message}
            </p>
          )}
        </Card>

        {/* FOOTER ACTIONS BAR */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleReset();
              toast.info("Cambios descartados", {
                description: "Se han restaurado los valores anteriores de tu perfil.",
              });
            }}
            className="h-11 rounded-xl font-bold bg-background hover:bg-muted text-foreground border border-border text-xs sm:text-sm px-5 transition-all shadow-none cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="size-4" />
            Descartar
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="h-11 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm px-6 transition-all border-none cursor-pointer shadow-md active:scale-95 flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isSaving ? "Guardando..." : "Guardar Perfil"}
          </Button>
        </div>

      </form>
    </motion.div>
  );
}
