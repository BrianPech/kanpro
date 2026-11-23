"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Building2,
  MapPin,
  Loader2,
  Image as ImageIcon,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
} from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanyProfileForm } from "../hooks/use-company-profile-form";
import { toast } from "sonner";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { optimizeImageForStorage } from "@/lib/storage/optimize-upload";
import { GEO_CONFIG, cleanCityName, findNearestCityAndZone } from "@/config/geo";

const OnboardingLeafletMap = dynamic(
  () =>
    import("@/modules/auth/components/onboarding-leaflet-map").then(
      (mod) => mod.OnboardingLeafletMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[218px] w-full rounded-[12px] border border-border bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground animate-pulse">
        <MapPin className="size-5 text-primary/60 animate-bounce" />
        <span className="text-xs font-medium">Cargando mapa interactivo...</span>
      </div>
    ),
  }
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
  companyId,
}: {
  initialProfile: InitialProfile;
  userId: string;
  companyId?: string;
}) {
  const activeCompanyId = companyId || userId;
  const { form, isSaving, onSubmit, handleReset } = useCompanyProfileForm(
    initialProfile,
    activeCompanyId
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
      const fileExt = optimizedFile.name.split(".").pop()?.toLowerCase() || "webp";
      const filePath = `${activeCompanyId}/logo.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from("company_assets")
        .upload(filePath, optimizedFile, {
          upsert: true,
          contentType: optimizedFile.type,
          cacheControl: "31536000",
        });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("company_assets")
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
      const fileExt = optimizedFile.name.split(".").pop()?.toLowerCase() || "webp";
      const filePath = `${activeCompanyId}/banner.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from("company_assets")
        .upload(filePath, optimizedFile, {
          upsert: true,
          contentType: optimizedFile.type,
          cacheControl: "31536000",
        });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("company_assets")
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
  const industry = watch("industry");
  const watchedLat = watch("latitude");
  const watchedLng = watch("longitude");
  const isVerified = Boolean(
    initialProfile?.is_validated ||
      initialProfile?.is_verified ||
      initialProfile?.verification_status === "approved"
  );

  const resolvedCity = React.useMemo(() => {
    const raw = (location || "").trim();
    if (!raw) return "Mérida, Yucatán";
    const exact = CITIES_LIST.find((c) => c.toLowerCase() === raw.toLowerCase());
    if (exact) return exact;
    const cleaned = cleanCityName(raw).toLowerCase();
    const partial = CITIES_LIST.find((c) => c.toLowerCase().startsWith(cleaned));
    return partial || raw;
  }, [location]);

  const initialLat = initialProfile?.latitude;
  const initialLng = initialProfile?.longitude;

  const mapCoordinates = React.useMemo<[number, number] | null>(() => {
    if (typeof watchedLat === "number" && typeof watchedLng === "number") {
      return [watchedLat, watchedLng];
    }
    if (typeof initialLat === "number" && typeof initialLng === "number") {
      return [initialLat, initialLng];
    }
    const cleaned = cleanCityName(resolvedCity);
    const cityCfg = GEO_CONFIG[cleaned];
    if (cityCfg) {
      return [cityCfg.coords.lat, cityCfg.coords.lng];
    }
    return [20.9676, -89.6241];
  }, [watchedLat, watchedLng, initialLat, initialLng, resolvedCity]);

  const reverseGeocodeCoordinates = React.useCallback(
    async (lat: number, lng: number) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            signal: controller.signal,
            headers: { "Accept-Language": "es" },
          }
        );
        clearTimeout(timeout);
        if (!res.ok) return;

        const data = await res.json();
        const addr = data.address || {};
        const rawCity =
          addr.city ||
          addr.town ||
          addr.municipality ||
          addr.county ||
          addr.village ||
          addr.state_district ||
          "";

        let cityName = cleanCityName(rawCity);
        if (!GEO_CONFIG[cityName]) {
          cityName = findNearestCityAndZone(lat, lng).city;
        }
        const cityCfg = GEO_CONFIG[cityName];
        const fullCity = cityCfg ? `${cityName}, ${cityCfg.state}` : cityName;
        const matchedCity =
          CITIES_LIST.find((c) => c.toLowerCase() === fullCity.toLowerCase()) ||
          CITIES_LIST.find((c) => c.toLowerCase().startsWith(cityName.toLowerCase())) ||
          fullCity;

        if (matchedCity) {
          setValue("location", matchedCity, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }

        const road = addr.road || "";
        const houseNumber = addr.house_number ? `#${addr.house_number}` : "";
        const suburb = addr.suburb || addr.neighbourhood || addr.quarter || "";
        const postcode = addr.postcode || "";
        const formatted = [
          [road, houseNumber].filter(Boolean).join(" "),
          suburb,
          cityName,
          postcode ? `C.P. ${postcode}` : "",
        ]
          .filter(Boolean)
          .join(", ");

        if (formatted || data.display_name) {
          setValue("address_details", formatted || data.display_name, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      } catch {
        // Ignore geocoding network failures; coordinates are already saved
      }
    },
    [setValue]
  );

  const handleMapSelectCoordinates = React.useCallback(
    (lat: number, lng: number) => {
      setValue("latitude", lat, { shouldValidate: true, shouldDirty: true });
      setValue("longitude", lng, { shouldValidate: true, shouldDirty: true });
      void reverseGeocodeCoordinates(lat, lng);
    },
    [setValue, reverseGeocodeCoordinates]
  );

  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocalización no disponible", {
        description: "Tu navegador no soporta obtener la ubicación actual.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setValue("latitude", lat, { shouldValidate: true, shouldDirty: true });
        setValue("longitude", lng, { shouldValidate: true, shouldDirty: true });
        void reverseGeocodeCoordinates(lat, lng);
        toast.success("Ubicación actualizada", {
          description: "Se capturó tu ubicación actual en el mapa.",
        });
      },
      () => {
        toast.error("No se pudo obtener tu ubicación", {
          description: "Verifica los permisos de ubicación en tu navegador.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-[24px] w-full pb-12 font-sans"
    >
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.02em] text-foreground">
          Perfil de empresa
        </h1>
        <p className="text-[14px] font-normal leading-[20px] text-muted-foreground mt-[4px]">
          Administra la información que ven las personas al consultar tus vacantes.
        </p>
      </div>

      <form onSubmit={onSubmit} method="POST" className="flex flex-col gap-[20px]">
        {/* Top Identity Card */}
        <div className="bg-card border border-border rounded-[16px] overflow-hidden">
          {/* Banner */}
          <div className="relative w-full h-[180px] sm:h-[220px] bg-muted/40 overflow-hidden">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="Portada de la empresa"
                className="w-full h-full object-cover object-center block"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center bg-muted/40">
                <ImageIcon className="size-10 stroke-[1.2]" />
                <span className="text-xs font-semibold uppercase tracking-wider mt-2 text-foreground">
                  Imagen de portada comercial
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recomendado: 1200 x 400 px
                </p>
              </div>
            )}

            <div className="absolute top-[16px] right-[16px] z-20">
              <label
                className={cn(
                  "relative inline-flex items-center justify-center h-[40px] px-[14px] rounded-[8px] border border-control-border bg-card/95 backdrop-blur-xs text-[14px] font-medium text-foreground hover:bg-card gap-[8px] cursor-pointer shadow-xs",
                  (isSaving || isUploadingBanner) && "opacity-50 pointer-events-none"
                )}
              >
                {isUploadingBanner ? (
                  <>
                    <Loader2 className="size-[16px] animate-spin" />
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Plus className="size-[16px]" />
                    <span>{bannerUrl ? "Cambiar portada" : "Subir portada"}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={isSaving || isUploadingBanner}
                  onChange={handleBannerChange}
                  className="sr-only"
                  aria-label="Subir portada"
                />
              </label>
            </div>
          </div>

          {/* Logo + Company Name Row */}
          <div className="px-[20px] sm:px-[24px] pb-[20px] pt-0 -mt-[40px] flex flex-col lg:flex-row lg:items-end justify-between gap-[16px] relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-[16px] min-w-0 flex-1">
              {/* Rounded Square Logo */}
              <div className="relative size-[96px] rounded-[16px] bg-card border-4 border-card shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                {isUploadingLogo ? (
                  <Loader2 className="size-6 animate-spin text-primary" />
                ) : logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={companyName || "Logo"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="size-8 text-muted-foreground/60" />
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

              <div className="pb-[4px] min-w-0 flex-1">
                <div className="flex items-center gap-[10px] flex-wrap">
                  <h2 className="text-[24px] font-semibold leading-[32px] tracking-[-0.01em] text-foreground break-words">
                    {companyName && companyName.trim() !== ""
                      ? companyName
                      : "Nombre de tu empresa"}
                  </h2>
                  {isVerified ? (
                    <span className="inline-flex items-center rounded-full bg-success text-success-foreground px-[10px] py-[2px] text-[12px] font-medium leading-[16px] shrink-0">
                      Verificada
                    </span>
                  ) : (
                    <Link
                      href="/dashboard/company/verification"
                      className="inline-flex items-center rounded-full bg-warning text-warning-foreground px-[10px] py-[2px] text-[12px] font-medium leading-[16px] shrink-0 hover:opacity-90"
                    >
                      Sin verificar
                    </Link>
                  )}
                </div>
                <p className="text-[14px] font-normal leading-[20px] text-muted-foreground mt-[2px] break-words">
                  {[
                    industry ? INDUSTRY_LABELS[industry] || industry : null,
                    location || null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Completa los datos de tu empresa"}
                </p>
              </div>
            </div>

            <label
              className={cn(
                "relative inline-flex items-center justify-center h-[40px] px-[14px] rounded-[8px] border border-control-border bg-card text-[14px] font-medium text-foreground hover:bg-muted/50 gap-[8px] cursor-pointer shrink-0 self-start lg:self-auto",
                (isSaving || isUploadingLogo) && "opacity-50 pointer-events-none"
              )}
            >
              {isUploadingLogo ? (
                <>
                  <Loader2 className="size-[16px] animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Plus className="size-[16px]" />
                  <span>Cambiar foto de perfil</span>
                </>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={isSaving || isUploadingLogo}
                onChange={handleLogoChange}
                className="sr-only"
                aria-label="Cambiar foto de perfil"
              />
            </label>
          </div>
        </div>

        {/* Middle 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[20px]">
          {/* Left Card: Información de la empresa */}
          <div className="lg:col-span-7 bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[16px]">
            <div className="flex items-center gap-[10px]">
              <div className="size-[32px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
                <Building2 className="size-[16px]" />
              </div>
              <h3 className="text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-foreground">
                Información de la empresa
              </h3>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label
                htmlFor="company_name"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Nombre comercial
              </label>
              <Input
                id="company_name"
                type="text"
                placeholder="Ej. Hotel Tierra Maya"
                {...register("company_name")}
                className="h-[44px] rounded-[8px] border-input bg-background px-[12px] text-[14px] font-normal"
              />
              {errors.company_name && (
                <p className="text-xs font-medium text-destructive">
                  {errors.company_name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
              <div className="flex flex-col gap-[6px]">
                <span className="text-[14px] font-medium leading-[20px] text-foreground">
                  Sector
                </span>
                <Select
                  value={watch("industry") || ""}
                  onValueChange={(val) =>
                    setValue("industry", val || "", { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-background px-[12px] text-[14px] font-normal">
                    <SelectValue placeholder="Selecciona un sector">
                      {(val: string | null) =>
                        (val && INDUSTRY_LABELS[val]) ||
                        val ||
                        "Selecciona un sector"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                    <SelectItem value="Restaurantes / Hotelería">
                      Restaurantes / Hotelería / Turismo
                    </SelectItem>
                    <SelectItem value="Comercial">
                      Comercio & Ventas al por Menor
                    </SelectItem>
                    <SelectItem value="Tecnología">
                      Tecnología & Software
                    </SelectItem>
                    <SelectItem value="Salud">Salud & Bienestar</SelectItem>
                    <SelectItem value="Finanzas">
                      Finanzas & Contabilidad
                    </SelectItem>
                    <SelectItem value="Educación">
                      Educación & Capacitación
                    </SelectItem>
                    <SelectItem value="Administración">
                      Administración & Operaciones
                    </SelectItem>
                    <SelectItem value="Diseño">Diseño & Medios</SelectItem>
                    <SelectItem value="Marketing">
                      Marketing & Publicidad
                    </SelectItem>
                    <SelectItem value="Otro">Otro Sector</SelectItem>
                  </SelectContent>
                </Select>
                {errors.industry && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.industry.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-[6px]">
                <span className="text-[14px] font-medium leading-[20px] text-foreground">
                  Tamaño de la empresa
                </span>
                <Select
                  value={watch("company_size") || ""}
                  onValueChange={(val) =>
                    setValue("company_size", val || undefined)
                  }
                >
                  <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-background px-[12px] text-[14px] font-normal">
                    <SelectValue placeholder="Selecciona el tamaño">
                      {(val: string | null) =>
                        (val && COMPANY_SIZE_LABELS[val]) ||
                        val ||
                        "Selecciona el tamaño"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                    <SelectItem value="1-10">1 - 10 empleados</SelectItem>
                    <SelectItem value="11-50">11 - 50 empleados</SelectItem>
                    <SelectItem value="51-200">51 - 200 empleados</SelectItem>
                    <SelectItem value="201-500">201 - 500 empleados</SelectItem>
                    <SelectItem value="500+">Más de 500 empleados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-[6px] flex-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="company_description"
                  className="text-[14px] font-medium leading-[20px] text-foreground"
                >
                  Acerca de la empresa
                </label>
                <span
                  className={cn(
                    "text-[12px] font-normal tabular-nums",
                    isWarningCount ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {charCount} / 300
                </span>
              </div>
              <Textarea
                id="company_description"
                maxLength={300}
                placeholder="Describe brevemente tu empresa, cultura laboral y enfoque..."
                {...register("description")}
                className="min-h-[108px] flex-1 rounded-[8px] border-input bg-background p-[12px] text-[14px] font-normal resize-none"
              />
              {errors.description && (
                <p className="text-xs font-medium text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Right Card: Contacto y redes */}
          <div className="lg:col-span-5 bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[16px]">
            <div className="flex items-center gap-[10px]">
              <div className="size-[32px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
                <Users className="size-[16px]" />
              </div>
              <h3 className="text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-foreground">
                Contacto y redes
              </h3>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label
                htmlFor="company_phone"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                WhatsApp
              </label>
              <Input
                id="company_phone"
                type="tel"
                placeholder="+52 999 000 0123"
                {...register("phone")}
                className="h-[44px] rounded-[8px] border-input bg-background px-[12px] text-[14px] font-normal"
              />
              {errors.phone && (
                <p className="text-xs font-medium text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-[6px]">
              <label
                htmlFor="company_website"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Sitio web
              </label>
              <Input
                id="company_website"
                type="url"
                placeholder="https://empresa.com"
                {...register("website")}
                className="h-[44px] rounded-[8px] border-input bg-background px-[12px] text-[14px] font-normal"
              />
              {errors.website && (
                <p className="text-xs font-medium text-destructive">
                  {errors.website.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-[6px]">
              <label
                htmlFor="company_instagram"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Instagram
              </label>
              <Input
                id="company_instagram"
                type="text"
                placeholder="instagram.com/empresa"
                {...register("instagram_url")}
                className="h-[44px] rounded-[8px] border-input bg-background px-[12px] text-[14px] font-normal"
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label
                htmlFor="company_facebook"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Facebook
              </label>
              <Input
                id="company_facebook"
                type="text"
                placeholder="facebook.com/empresa"
                {...register("facebook_url")}
                className="h-[44px] rounded-[8px] border-input bg-background px-[12px] text-[14px] font-normal"
              />
            </div>
          </div>
        </div>

        {/* Bottom Card: Ubicación de la empresa */}
        <div className="bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[16px]">
          <div className="flex items-center gap-[10px]">
            <div className="size-[32px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
              <MapPin className="size-[16px]" />
            </div>
            <h3 className="text-[18px] font-semibold leading-[24px] tracking-[-0.01em] text-foreground">
              Ubicación de la empresa
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-[20px] items-start">
            <div className="lg:col-span-6 flex flex-col gap-[16px]">
              <div className="flex flex-col gap-[6px]">
                <span className="text-[14px] font-medium leading-[20px] text-foreground">
                  Ciudad sede
                </span>
                <Select
                  value={resolvedCity}
                  onValueChange={(val) => {
                    if (val) {
                      setValue("location", val, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      const cleaned = cleanCityName(val);
                      const cityCfg = GEO_CONFIG[cleaned];
                      if (cityCfg) {
                        setValue("latitude", cityCfg.coords.lat, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setValue("longitude", cityCfg.coords.lng, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-background px-[12px] text-[14px] font-normal">
                    <SelectValue placeholder="Selecciona la ciudad sede" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg max-h-64">
                    {CITIES_LIST.map((city) => (
                      <SelectItem
                        key={city}
                        value={city}
                        className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                      >
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.location && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.location.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="company_address"
                  className="text-[14px] font-medium leading-[20px] text-foreground"
                >
                  Dirección
                </label>
                <Input
                  id="company_address"
                  type="text"
                  placeholder="Centro, Mérida, Yucatán, México"
                  {...register("address_details")}
                  className="h-[44px] rounded-[8px] border-input bg-background px-[12px] text-[14px] font-normal"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleUseCurrentLocation}
                className="h-[40px] px-[14px] rounded-[8px] border-control-border bg-card text-[14px] font-medium text-foreground hover:bg-muted/50 gap-[8px] cursor-pointer w-fit"
              >
                <MapPin className="size-[16px] text-muted-foreground" />
                <span>Usar mi ubicación actual</span>
              </Button>
            </div>

            <div className="lg:col-span-6">
              <OnboardingLeafletMap
                coordinates={mapCoordinates}
                onSelectCoordinates={handleMapSelectCoordinates}
              />
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-end gap-[12px]">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleReset();
              toast.info("Cambios descartados", {
                description:
                  "Se han restaurado los valores anteriores de tu perfil corporativo.",
              });
            }}
            className="h-[44px] px-[16px] rounded-[8px] border-control-border bg-card text-[14px] font-medium text-foreground hover:bg-muted/50 gap-[8px] cursor-pointer"
          >
            <XCircle className="size-[16px] text-muted-foreground" />
            <span>Descartar</span>
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className="h-[44px] px-[16px] rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 text-[14px] font-medium gap-[8px] cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="size-[16px] animate-spin" />
            ) : (
              <CheckCircle2 className="size-[16px]" />
            )}
            <span>{isSaving ? "Guardando perfil..." : "Guardar perfil"}</span>
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
