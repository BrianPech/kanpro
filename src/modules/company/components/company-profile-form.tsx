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
} from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  const charCount = description.length;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setValue("logo_url", localUrl);
      toast.success("Logotipo cargado", {
        description: "Se ha generado una vista previa del logo comercial localmente.",
      });
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setValue("banner_url", localUrl);
      toast.success("Banner cargado", {
        description: "Se ha generado una vista previa de la portada comercial localmente.",
      });
    }
  };

  const isWarningCount = charCount >= 280;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      <form onSubmit={onSubmit} method="POST" className="space-y-8">
        
        {/* ========================================== */}
        {/* TRUST / VALIDATION BADGE BANNER            */}
        {/* ========================================== */}
        {initialProfile?.is_validated ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="size-5 shrink-0" />
            <div className="text-xs font-semibold">
              <span className="font-bold">Empresa Verificada</span>. Tu negocio ha sido validado por el equipo de K&apos;anPro. Tienes insignia de confianza activa en tu perfil público y tus ofertas tendrán prioridad en el feed de candidatos.
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-fiord-50 dark:bg-fiord-900/20 border border-fiord-100 dark:border-fiord-800/40 text-fiord-700 dark:text-fiord-400">
            <ShieldCheck className="size-5 shrink-0 text-fiord-400" />
            <div className="text-xs font-semibold">
              <span className="font-bold">Verificación de Cuenta</span>. Completa la información comercial esencial (incluyendo logotipo y dirección física exacta). Una vez guardada, validaremos tu negocio para activar tu insignia de confianza de forma gratuita.
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 1: MARCA E IDENTIDAD VISUAL        */}
        {/* ========================================== */}
        <Card className="bg-white dark:bg-[#202023] border-fiord-100/60 dark:border-fiord-800/40 rounded-[24px] overflow-hidden shadow-xs">
          {/* Header Banner Uploader */}
          <div className="relative h-48 bg-fiord-50/50 dark:bg-fiord-900/10 border-b border-fiord-100 dark:border-fiord-800/40 overflow-hidden group">
            {bannerUrl ? (
              <img src={bannerUrl} alt="Portada" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-fiord-400 dark:text-fiord-500 p-4">
                <ImageIcon className="size-8 stroke-[1.2]" />
                <span className="text-[10px] font-bold uppercase tracking-wider mt-2">Imagen de Portada / Banner Comercial</span>
                <p className="text-[9px] text-fiord-450 dark:text-fiord-500 font-semibold mt-1">Recomendado: 1200x400px (Restaurante, Hotel, Local)</p>
              </div>
            )}
            
            <div className="absolute top-4 right-4">
              <Button
                type="button"
                className="h-8 rounded-xl text-[11px] font-bold bg-fiord-950 dark:bg-fiord-50 text-white dark:text-fiord-950 hover:bg-fiord-900 dark:hover:bg-fiord-100 flex items-center gap-1.5 shadow-md relative"
              >
                <Camera className="size-3.5" />
                <span>{bannerUrl ? "Cambiar Portada" : "Subir Portada"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>
          </div>

          <div className="p-6 md:p-8 pt-0 -mt-16 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left relative z-10">
            {/* Logo uploader circular box */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-full bg-white dark:bg-[#18181B] border-4 border-white dark:border-[#202023] shadow-md flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-fiord-400 dark:text-fiord-500">
                    <Camera className="size-6" />
                    <span className="text-[9px] font-bold uppercase mt-1">Logo</span>
                  </div>
                )}
                
                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Float edit button */}
              <div className="absolute bottom-0 right-0 bg-fiord-950 dark:bg-fiord-50 text-white dark:text-fiord-950 p-1.5 rounded-full shadow-md cursor-pointer active:scale-95 transition-transform">
                <Edit3 className="size-3" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Title / Info */}
            <div className="flex-grow pt-16 md:pt-20 space-y-1">
              <h3 className="text-base font-bold text-fiord-900 dark:text-fiord-50 tracking-tight flex items-center gap-1.5 justify-center md:justify-start">
                <Sparkles className="size-4 text-fiord-550 shrink-0" />
                Identidad de Marca
              </h3>
              <p className="text-xs text-fiord-450 dark:text-fiord-400 font-semibold leading-relaxed max-w-lg">
                Sube tu logotipo comercial (isotipo) y una foto de portada de tu establecimiento. Esto aumenta en un 80% las visualizaciones e interés en el feed móvil de candidatos.
              </p>
            </div>
          </div>
        </Card>

        {/* ========================================== */}
        {/* SECTION 2: DATOS GENERALES Y REDES         */}
        {/* ========================================== */}
        <Card className="bg-white dark:bg-[#202023] border-fiord-100/60 dark:border-fiord-800/40 rounded-[24px] p-6 md:p-8 space-y-6 shadow-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Commercial Name Input */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                Nombre Comercial *
              </Label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-fiord-400 dark:text-fiord-500" />
                <Input
                  type="text"
                  placeholder="Ej. Restaurante La Costa"
                  {...register("company_name")}
                  className="w-full h-11 bg-fiord-50/20 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 rounded-xl pl-11 pr-4 text-xs font-semibold text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 dark:focus-visible:border-fiord-750 transition-all outline-none"
                />
              </div>
              {errors.company_name && (
                <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
                  {errors.company_name.message}
                </p>
              )}
            </div>

            {/* Industry Sector Dropdown Select */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                Sector Industrial *
              </Label>
              <Select
                value={watch("industry") || ""}
                onValueChange={(value) =>
                  setValue("industry", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full h-11 bg-fiord-50/20 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 rounded-xl px-4 text-xs font-semibold text-fiord-900 dark:text-fiord-100 focus:ring-1 focus:ring-fiord-300 dark:focus:ring-fiord-700 focus:border-fiord-300 dark:focus:border-fiord-750 transition-all outline-none shadow-none">
                  <SelectValue placeholder="Selecciona un sector" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-fiord-100 dark:border-fiord-800 bg-popover text-xs">
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
                <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
                  {errors.industry.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone Input */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                WhatsApp de Contacto
              </Label>
              <div className="relative flex items-center">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-fiord-400 dark:text-fiord-500" />
                <Input
                  type="tel"
                  placeholder="Ej. +52 998 123 4567"
                  {...register("phone")}
                  className="w-full h-11 bg-fiord-50/20 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 rounded-xl pl-11 pr-4 text-xs font-semibold text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 dark:focus-visible:border-fiord-750 transition-all outline-none"
                />
              </div>
            </div>

            {/* Company Size Input */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                Tamaño de la Empresa
              </Label>
              <Select
                value={watch("company_size") || ""}
                onValueChange={(value) => setValue("company_size", value)}
              >
                <SelectTrigger className="w-full h-11 bg-fiord-50/20 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 rounded-xl px-4 text-xs font-semibold text-fiord-900 dark:text-fiord-100 focus:ring-1 focus:ring-fiord-300 dark:focus:ring-fiord-700 focus:border-fiord-300 dark:focus:border-fiord-750 transition-all outline-none shadow-none">
                  <SelectValue placeholder="Selecciona el tamaño" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-fiord-100 dark:border-fiord-800 bg-popover text-xs">
                  <SelectItem value="1-10">1 - 10 empleados</SelectItem>
                  <SelectItem value="11-50">11 - 50 empleados</SelectItem>
                  <SelectItem value="51-200">51 - 200 empleados</SelectItem>
                  <SelectItem value="201-500">201 - 500 empleados</SelectItem>
                  <SelectItem value="500+">Más de 500 empleados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="h-px bg-fiord-100/50 dark:bg-fiord-800/40 w-full"></div>

          {/* Social Media & Web Channels */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold text-fiord-900 dark:text-fiord-50 tracking-tight uppercase">Canales Digitales (Muy valorados por candidatos)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Website Input */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">URL Sitio Web</Label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fiord-400 dark:text-fiord-500" />
                  <Input
                    type="text"
                    placeholder="https://miempresa.com"
                    {...register("website")}
                    className="w-full h-10 bg-fiord-50/20 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 rounded-xl pl-10 pr-4 text-xs font-semibold text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Instagram Input */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">Instagram</Label>
                <div className="relative">
                  <InstagramIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fiord-400 dark:text-fiord-500" />
                  <Input
                    type="text"
                    placeholder="https://instagram.com/perfil"
                    {...register("instagram_url")}
                    className="w-full h-10 bg-fiord-50/20 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 rounded-xl pl-10 pr-4 text-xs font-semibold text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Facebook Input */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">Facebook</Label>
                <div className="relative">
                  <FacebookIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fiord-400 dark:text-fiord-500" />
                  <Input
                    type="text"
                    placeholder="https://facebook.com/pagina"
                    {...register("facebook_url")}
                    className="w-full h-10 bg-fiord-50/20 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 rounded-xl pl-10 pr-4 text-xs font-semibold text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ========================================== */}
        {/* SECTION 3: LOGÍSTICA Y MOVILIDAD          */}
        {/* ========================================== */}
        <Card className="bg-white dark:bg-[#202023] border-fiord-100/60 dark:border-fiord-800/40 rounded-[24px] p-6 md:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-2 pb-1 border-b border-fiord-100/50 dark:border-fiord-800/40">
            <Bus className="size-5 text-fiord-550" />
            <h4 className="text-[13px] font-bold text-fiord-900 dark:text-fiord-50 uppercase tracking-tight">Logística y Movilidad del Personal</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Zone Selection */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                Zona General (Ciudad) *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-fiord-400 dark:text-fiord-500" />
                <Input
                  type="text"
                  placeholder="Ej. Playa del Carmen, Centro"
                  {...register("location")}
                  className="w-full h-11 bg-fiord-50/20 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 rounded-xl pl-11 pr-4 text-xs font-semibold text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 dark:focus-visible:border-fiord-750 transition-all outline-none"
                />
              </div>
              {errors.location && (
                <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
                  {errors.location.message}
                </p>
              )}
            </div>

            {/* Detailed Street Address / Crossings */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                Dirección Detallada / Cruzamientos / Referencias *
              </Label>
              <Input
                type="text"
                placeholder="Ej. Calle 10 Norte entre Av. 15 y 20, frente a OXXO"
                {...register("address_details")}
                className="w-full h-11 bg-fiord-50/20 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 rounded-xl px-4 text-xs font-semibold text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 dark:focus-visible:border-fiord-750 transition-all outline-none"
              />
              {errors.address_details && (
                <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
                  {errors.address_details.message}
                </p>
              )}
            </div>
          </div>

          {/* Transportation Route option */}
          <div className="flex items-start gap-3 p-4 bg-fiord-50/30 dark:bg-fiord-900/10 rounded-2xl border border-fiord-100/40 dark:border-fiord-850/20 mt-2">
            <Checkbox
              id="has_transport"
              checked={watch("has_transport")}
              onCheckedChange={(checked) => setValue("has_transport", !!checked)}
              className="mt-0.5 border-fiord-300 dark:border-fiord-700 data-[state=checked]:bg-fiord-950 dark:data-[state=checked]:bg-fiord-50"
            />
            <div className="space-y-1">
              <label
                htmlFor="has_transport"
                className="text-xs font-bold text-fiord-900 dark:text-fiord-50 cursor-pointer select-none"
              >
                ¿Ofrecen transporte de personal / ruta de transporte?
              </label>
              <p className="text-[11px] text-fiord-450 dark:text-fiord-500 font-semibold leading-relaxed">
                Selecciona si la empresa cuenta con camión de transporte propio o rutas subsidiadas para el personal (indispensable para hoteles, clubes de playa y parques en Quintana Roo y Yucatán).
              </p>
            </div>
          </div>
        </Card>

        {/* ========================================== */}
        {/* SECTION 4: VALOR Y BENEFICIOS CORPORATIVOS */}
        {/* ========================================== */}
        <Card className="bg-white dark:bg-[#202023] border-fiord-100/60 dark:border-fiord-800/40 rounded-[24px] p-6 md:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-2 pb-1 border-b border-fiord-100/50 dark:border-fiord-800/40">
            <CheckSquare className="size-5 text-fiord-550" />
            <h4 className="text-[13px] font-bold text-fiord-900 dark:text-fiord-50 uppercase tracking-tight">Prestaciones y Propuesta de Valor</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operational Shift dropdown */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                Horario u Operación Habitual *
              </Label>
              <Select
                value={watch("operation_hours") || ""}
                onValueChange={(value) => setValue("operation_hours", value, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full h-11 bg-fiord-50/20 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 rounded-xl px-4 text-xs font-semibold text-fiord-900 dark:text-fiord-100 focus:ring-1 focus:ring-fiord-300 dark:focus:ring-fiord-700 focus:border-fiord-300 transition-all outline-none shadow-none">
                  <SelectValue placeholder="Selecciona el tipo de turnos" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-fiord-100 dark:border-fiord-800 bg-popover text-xs">
                  <SelectItem value="Horario Comercial de Día">Horario Comercial de Día</SelectItem>
                  <SelectItem value="Turnos Rotativos">Turnos Rotativos (Rotación de Personal)</SelectItem>
                  <SelectItem value="Operación Nocturna">Operación Nocturna / Nocturno</SelectItem>
                  <SelectItem value="Mixto o Partido">Turnos Mixtos / Horarios Partidos</SelectItem>
                </SelectContent>
              </Select>
              {errors.operation_hours && (
                <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
                  {errors.operation_hours.message}
                </p>
              )}
            </div>

            {/* Information note */}
            <div className="p-4 rounded-2xl bg-fiord-50/30 dark:bg-fiord-950/10 border border-fiord-100/30 dark:border-fiord-850/10 flex items-start gap-2.5 text-fiord-500 dark:text-fiord-400 text-[11px] font-semibold leading-relaxed">
              <Clock className="size-4 shrink-0 text-fiord-400 mt-0.5" />
              <span>
                Los candidatos operativos y comerciales filtran ofertas según los giros de horarios disponibles. Indicar transparentemente los turnos mejora la retención y seriedad de las solicitudes.
              </span>
            </div>
          </div>

          {/* Benefits Checkmarks list */}
          <div className="space-y-4 pt-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
              Prestaciones Generales de la Empresa
            </Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* IMSS / Law Benefits */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-fiord-100/50 dark:border-fiord-800/40 hover:bg-fiord-50/30 dark:hover:bg-fiord-900/10 transition-colors">
                <Checkbox
                  id="benefit_imss"
                  checked={watch("benefit_imss")}
                  onCheckedChange={(checked) => setValue("benefit_imss", !!checked)}
                  className="border-fiord-300 dark:border-fiord-700 data-[state=checked]:bg-fiord-950 dark:data-[state=checked]:bg-fiord-50"
                />
                <label htmlFor="benefit_imss" className="text-xs font-semibold text-fiord-700 dark:text-fiord-300 cursor-pointer select-none">
                  🏥 IMSS / Prestaciones desde el Día 1
                </label>
              </div>

              {/* Tips */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-fiord-100/50 dark:border-fiord-800/40 hover:bg-fiord-50/30 dark:hover:bg-fiord-900/10 transition-colors">
                <Checkbox
                  id="benefit_tips"
                  checked={watch("benefit_tips")}
                  onCheckedChange={(checked) => setValue("benefit_tips", !!checked)}
                  className="border-fiord-300 dark:border-fiord-700 data-[state=checked]:bg-fiord-950 dark:data-[state=checked]:bg-fiord-50"
                />
                <label htmlFor="benefit_tips" className="text-xs font-semibold text-fiord-700 dark:text-fiord-300 cursor-pointer select-none">
                  💵 Propinas Diarias / Semanales
                </label>
              </div>

              {/* Employee Canteen */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-fiord-100/50 dark:border-fiord-800/40 hover:bg-fiord-50/30 dark:hover:bg-fiord-900/10 transition-colors">
                <Checkbox
                  id="benefit_canteen"
                  checked={watch("benefit_canteen")}
                  onCheckedChange={(checked) => setValue("benefit_canteen", !!checked)}
                  className="border-fiord-300 dark:border-fiord-700 data-[state=checked]:bg-fiord-950 dark:data-[state=checked]:bg-fiord-50"
                />
                <label htmlFor="benefit_canteen" className="text-xs font-semibold text-fiord-700 dark:text-fiord-300 cursor-pointer select-none">
                  🍲 Comedor de Empleados Incluido
                </label>
              </div>

              {/* Uniforms */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-fiord-100/50 dark:border-fiord-800/40 hover:bg-fiord-50/30 dark:hover:bg-fiord-900/10 transition-colors">
                <Checkbox
                  id="benefit_uniforms"
                  checked={watch("benefit_uniforms")}
                  onCheckedChange={(checked) => setValue("benefit_uniforms", !!checked)}
                  className="border-fiord-300 dark:border-fiord-700 data-[state=checked]:bg-fiord-950 dark:data-[state=checked]:bg-fiord-50"
                />
                <label htmlFor="benefit_uniforms" className="text-xs font-semibold text-fiord-700 dark:text-fiord-300 cursor-pointer select-none">
                  👕 Uniformes Proporcionados
                </label>
              </div>

              {/* Growth */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-fiord-100/50 dark:border-fiord-800/40 hover:bg-fiord-50/30 dark:hover:bg-fiord-900/10 transition-colors sm:col-span-2">
                <Checkbox
                  id="benefit_growth"
                  checked={watch("benefit_growth")}
                  onCheckedChange={(checked) => setValue("benefit_growth", !!checked)}
                  className="border-fiord-300 dark:border-fiord-700 data-[state=checked]:bg-fiord-950 dark:data-[state=checked]:bg-fiord-50"
                />
                <label htmlFor="benefit_growth" className="text-xs font-semibold text-fiord-700 dark:text-fiord-300 cursor-pointer select-none">
                  📈 Oportunidad de Crecimiento / Planes de Capacitación constante
                </label>
              </div>

            </div>
          </div>
        </Card>

        {/* ========================================== */}
        {/* SECTION 5: BIO COMERCIAL                   */}
        {/* ========================================== */}
        <Card className="bg-white dark:bg-[#202023] border-fiord-100/60 dark:border-fiord-800/40 rounded-[24px] p-6 md:p-8 space-y-4 shadow-xs">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-fiord-900 dark:text-fiord-50 tracking-tight">
                Bio Comercial
              </h4>
              <p className="text-[11px] text-fiord-450 dark:text-fiord-500 font-semibold leading-relaxed">
                Describe brevemente la misión y el valor de tu empresa para convencer a los candidatos.
              </p>
            </div>
            <span
              id="char-count"
              className={cn(
                "text-[10px] font-bold transition-colors",
                isWarningCount
                  ? "text-red-500 dark:text-red-400"
                  : "text-fiord-400 dark:text-fiord-500"
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
            className="w-full h-32 bg-fiord-50/20 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 rounded-xl px-5 py-4 text-xs font-semibold text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 dark:focus-visible:border-fiord-750 transition-all resize-none shadow-none"
          />
          {errors.description && (
            <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
              {errors.description.message}
            </p>
          )}
        </Card>

        {/* FOOTER ACTIONS BAR */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleReset();
              toast.info("Cambios descartados", {
                description: "Se han restaurado los valores anteriores de tu perfil.",
              });
            }}
            className="h-10 rounded-xl font-bold bg-white dark:bg-fiord-900/10 hover:bg-fiord-50 dark:hover:bg-fiord-900/40 text-fiord-700 dark:text-fiord-300 border border-fiord-100/80 dark:border-fiord-800/80 text-xs px-5 transition-all shadow-none"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Descartar
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="h-10 rounded-xl font-bold bg-fiord-950 dark:bg-fiord-50 hover:bg-fiord-900 dark:hover:bg-fiord-100 text-white dark:text-fiord-950 text-xs px-6 transition-all border-none"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin mr-1.5" />
            ) : (
              <Save className="size-3.5 mr-1.5" />
            )}
            {isSaving ? "Guardando..." : "Guardar Perfil"}
          </Button>
        </div>

      </form>
    </motion.div>
  );
}
