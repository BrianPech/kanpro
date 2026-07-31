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
import Link from "next/link";
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
      className="space-y-8 max-w-4xl mx-auto w-full"
    >
      <form onSubmit={onSubmit} method="POST" className="space-y-8">
        
        {/* ========================================== */}

        {/* TRUST / VALIDATION BADGE BANNER            */}
        {/* ========================================== */}
        {initialProfile?.is_validated ? (
          <div className="flex items-center gap-3.5 p-5 rounded-[20px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-2xs">
            <ShieldCheck className="size-6 shrink-0" />
            <div className="text-xs sm:text-sm font-semibold leading-relaxed">
              <span className="font-extrabold">Empresa Verificada</span>. Tu negocio ha sido validado por el equipo de K&apos;anPro. Tienes insignia de confianza activa en tu perfil público y tus ofertas tendrán prioridad en el feed de candidatos.
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-[20px] bg-[#f5f7fa] dark:bg-zinc-900/60 border border-[#ebeef3] dark:border-zinc-800 text-[#3e546d] dark:text-zinc-300 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <ShieldCheck className="size-6 shrink-0 text-[#5c7c9b]" />
              <div className="text-xs sm:text-sm font-semibold leading-relaxed">
                <span className="font-extrabold text-[#1f2732] dark:text-zinc-100">Verificación de Cuenta (Persona Moral)</span>. Completa la información legal y sube los 13 documentos obligatorios para obtener la insignia de confianza corporativa.
              </div>
            </div>
            <Button
              asChild
              className="h-10 px-5 rounded-[14px] bg-[#1f2732] dark:bg-zinc-100 hover:bg-[#253240] dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold shrink-0 cursor-pointer shadow-sm"
            >
              <Link href="/dashboard/company/verification">
                Ir a Verificación
              </Link>
            </Button>
          </div>
        )}

        {/* ========================================== */}
        {/* SECTION 1: MARCA E IDENTIDAD VISUAL        */}
        {/* ========================================== */}
        <Card className="bg-white dark:bg-[#18181b] border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] overflow-hidden shadow-xs">
          {/* Header Banner Uploader */}
          <div className="relative h-48 sm:h-56 bg-slate-100 dark:bg-zinc-900 border-b border-[#ebeef3] dark:border-zinc-800 overflow-hidden group">
            {bannerUrl ? (
              <img src={bannerUrl} alt="Portada" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#5c7c9b] dark:text-zinc-500 p-4">
                <ImageIcon className="size-10 stroke-[1.2]" />
                <span className="text-xs font-extrabold uppercase tracking-wider mt-2 text-[#1f2732] dark:text-zinc-300">Imagen de Portada / Banner Comercial</span>
                <p className="text-xs text-[#5c7c9b] dark:text-zinc-400 font-semibold mt-1">Recomendado: 1200x400px (Restaurante, Hotel, Local)</p>
              </div>
            )}
            
            <div className="absolute top-4 right-4">
              <Button
                type="button"
                className="h-10 rounded-[14px] text-xs sm:text-sm font-bold bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#253240] dark:hover:bg-zinc-200 flex items-center gap-2 shadow-md relative cursor-pointer"
              >
                <Camera className="size-4" />
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
              <div className="w-32 h-32 rounded-full bg-white dark:bg-[#18181b] border-4 border-white dark:border-[#18181b] shadow-md flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#5c7c9b] dark:text-zinc-400">
                    <Camera className="size-7" />
                    <span className="text-[10px] font-extrabold uppercase mt-1">Logo</span>
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
              <div className="absolute bottom-1 right-1 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 p-2 rounded-full shadow-md cursor-pointer active:scale-95 transition-transform">
                <Edit3 className="size-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Title / Info */}
            <div className="flex-grow pt-16 md:pt-20 space-y-1.5">
              <h3 className="text-[18px] sm:text-[20px] font-[800] text-[#1f2732] dark:text-zinc-100 tracking-tight flex items-center gap-2 justify-center md:justify-start">
                <Sparkles className="size-5 text-[#5c7c9b] shrink-0" />
                Identidad de Marca
              </h3>
              <p className="text-xs sm:text-sm text-[#5c7c9b] dark:text-zinc-400 font-semibold leading-relaxed max-w-lg">
                Sube tu logotipo comercial e imagen de portada para destacar en el feed de candidatos.
              </p>
            </div>
          </div>
        </Card>

        {/* ========================================== */}
        {/* SECTION 2: DATOS GENERALES Y REDES         */}
        {/* ========================================== */}
        <Card className="bg-white dark:bg-[#18181b] border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] p-6 sm:p-8 space-y-6 shadow-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Commercial Name Input */}
            <div className="space-y-2.5">
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200">
                Nombre Comercial *
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5c7c9b] dark:text-zinc-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Ej. Restaurante La Costa"
                  {...register("company_name")}
                  className="w-full h-14 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[16px] pl-11 pr-4 text-[15px] sm:text-[16px] font-[600] text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8] focus-visible:ring-2 focus-visible:ring-[#1f2732] transition-all outline-none"
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
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200">
                Sector Industrial *
              </label>
              <Select
                value={watch("industry") || ""}
                onValueChange={(value) =>
                  setValue("industry", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full h-14 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[16px] px-4 text-[15px] sm:text-[16px] font-[600] text-[#1f2732] dark:text-zinc-100 focus:ring-2 focus:ring-[#1f2732] transition-all outline-none shadow-none cursor-pointer">
                  <SelectValue placeholder="Selecciona un sector" />
                </SelectTrigger>
                <SelectContent className="rounded-[16px] border border-[#ebeef3] dark:border-zinc-800 bg-popover text-sm font-semibold">
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
            <div className="space-y-2.5">
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200">
                WhatsApp de Contacto
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5c7c9b] dark:text-zinc-400 pointer-events-none" />
                <Input
                  type="tel"
                  placeholder="Ej. +52 998 123 4567"
                  {...register("phone")}
                  className="w-full h-14 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[16px] pl-11 pr-4 text-[15px] sm:text-[16px] font-[600] text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8] focus-visible:ring-2 focus-visible:ring-[#1f2732] transition-all outline-none"
                />
              </div>
            </div>

            {/* Company Size Input */}
            <div className="space-y-2.5">
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200">
                Tamaño de la Empresa
              </label>
              <Select
                value={watch("company_size") || ""}
                onValueChange={(value) => setValue("company_size", value)}
              >
                <SelectTrigger className="w-full h-14 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[16px] px-4 text-[15px] sm:text-[16px] font-[600] text-[#1f2732] dark:text-zinc-100 focus:ring-2 focus:ring-[#1f2732] transition-all outline-none shadow-none cursor-pointer">
                  <SelectValue placeholder="Selecciona el tamaño" />
                </SelectTrigger>
                <SelectContent className="rounded-[16px] border border-[#ebeef3] dark:border-zinc-800 bg-popover text-sm font-semibold">
                  <SelectItem value="1-10">1 - 10 empleados</SelectItem>
                  <SelectItem value="11-50">11 - 50 empleados</SelectItem>
                  <SelectItem value="51-200">51 - 200 empleados</SelectItem>
                  <SelectItem value="201-500">201 - 500 empleados</SelectItem>
                  <SelectItem value="500+">Más de 500 empleados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="h-px bg-[#ebeef3] dark:bg-zinc-800 w-full" />

          {/* Social Media & Web Channels */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-[#1f2732] dark:text-zinc-100 uppercase tracking-wider">Canales Digitales</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Website Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5c7c9b] dark:text-zinc-400">Sitio Web</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] dark:text-zinc-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="https://miempresa.com"
                    {...register("website")}
                    className="w-full h-12 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[14px] pl-10 pr-4 text-sm font-semibold text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8] focus-visible:ring-2 focus-visible:ring-[#1f2732] transition-all outline-none"
                  />
                </div>
              </div>

              {/* Instagram Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5c7c9b] dark:text-zinc-400">Instagram</label>
                <div className="relative">
                  <InstagramIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] dark:text-zinc-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="https://instagram.com/perfil"
                    {...register("instagram_url")}
                    className="w-full h-12 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[14px] pl-10 pr-4 text-sm font-semibold text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8] focus-visible:ring-2 focus-visible:ring-[#1f2732] transition-all outline-none"
                  />
                </div>
              </div>

              {/* Facebook Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5c7c9b] dark:text-zinc-400">Facebook</label>
                <div className="relative">
                  <FacebookIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-[#5c7c9b] dark:text-zinc-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="https://facebook.com/pagina"
                    {...register("facebook_url")}
                    className="w-full h-12 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[14px] pl-10 pr-4 text-sm font-semibold text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8] focus-visible:ring-2 focus-visible:ring-[#1f2732] transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ========================================== */}
        {/* SECTION 3: LOGÍSTICA Y MOVILIDAD          */}
        {/* ========================================== */}
        <Card className="bg-white dark:bg-[#18181b] border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#ebeef3] dark:border-zinc-800">
            <Bus className="size-5 text-[#5c7c9b]" />
            <h4 className="text-[16px] sm:text-[18px] font-[800] text-[#1f2732] dark:text-zinc-100 tracking-tight">Logística y Ubicación de la Empresa</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Zone Selection */}
            <div className="space-y-2.5">
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200">
                Zona General (Ciudad) *
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5c7c9b] dark:text-zinc-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Ej. Playa del Carmen, Centro"
                  {...register("location")}
                  className="w-full h-14 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[16px] pl-11 pr-4 text-[15px] sm:text-[16px] font-[600] text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8] focus-visible:ring-2 focus-visible:ring-[#1f2732] transition-all outline-none"
                />
              </div>
              {errors.location && (
                <p className="text-xs sm:text-sm font-semibold text-rose-500">
                  {errors.location.message}
                </p>
              )}
            </div>

            {/* Detailed Street Address / Crossings */}
            <div className="space-y-2.5">
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200">
                Dirección Detallada / Referencias *
              </label>
              <Input
                type="text"
                placeholder="Ej. Calle 10 Norte entre Av. 15 y 20"
                {...register("address_details")}
                className="w-full h-14 bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[16px] px-4 text-[15px] sm:text-[16px] font-[600] text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8] focus-visible:ring-2 focus-visible:ring-[#1f2732] transition-all outline-none"
              />
              {errors.address_details && (
                <p className="text-xs sm:text-sm font-semibold text-rose-500">
                  {errors.address_details.message}
                </p>
              )}
            </div>
          </div>


        </Card>



        {/* ========================================== */}
        {/* SECTION 5: BIO COMERCIAL                   */}
        {/* ========================================== */}
        <Card className="bg-white dark:bg-[#18181b] border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h4 className="text-[16px] sm:text-[18px] font-[800] text-[#1f2732] dark:text-zinc-100 tracking-tight">
                Bio Comercial
              </h4>
              <p className="text-xs sm:text-sm text-[#5c7c9b] dark:text-zinc-400 font-semibold leading-relaxed">
                Describe la misión, ambiente de trabajo y cultura de tu empresa.
              </p>
            </div>
            <span
              id="char-count"
              className={cn(
                "text-xs font-bold transition-colors",
                isWarningCount
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-[#5c7c9b] dark:text-zinc-400"
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
            className="w-full min-h-[140px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[20px] p-5 text-[15px] sm:text-[16px] font-[600] leading-relaxed text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8] focus-visible:ring-2 focus-visible:ring-[#1f2732] transition-all resize-none shadow-none"
          />
          {errors.description && (
            <p className="text-xs sm:text-sm font-semibold text-rose-500">
              {errors.description.message}
            </p>
          )}
        </Card>

        {/* FOOTER ACTIONS BAR */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleReset();
              toast.info("Cambios descartados", {
                description: "Se han restaurado los valores anteriores de tu perfil.",
              });
            }}
            className="h-14 rounded-[18px] font-bold bg-white dark:bg-zinc-900 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 text-[#1f2732] dark:text-zinc-200 border border-[#d2dbe5] dark:border-zinc-800 text-sm sm:text-base px-6 transition-all shadow-none cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="size-4" />
            Descartar
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="h-14 rounded-[18px] font-bold bg-[#1f2732] dark:bg-zinc-100 hover:bg-[#253240] dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-base px-8 transition-all border-none cursor-pointer shadow-md active:scale-95 flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Save className="size-5" />
            )}
            {isSaving ? "Guardando..." : "Guardar Perfil"}
          </Button>
        </div>

      </form>
    </motion.div>
  );
}
