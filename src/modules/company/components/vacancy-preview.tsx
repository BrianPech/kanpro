"use client";

import * as React from "react";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Edit2,
  Bookmark,
  Building2,
  CheckCircle2,
  Gift,
  Clock,
  Sparkles,
  Phone,
  Globe,
  ChevronRight,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

export interface CompanyInfo {
  id?: string;
  company_name?: string | null;
  logo_url?: string | null;
  location?: string | null;
  industry?: string | null;
  description?: string | null;
  phone?: string | null;
  website_or_linkedin?: string | null;
  followers_count?: number | null;
}

export interface VacancyPreviewData {
  id?: string;
  title: string;
  category?: string | null;
  employment_type?: string | null;
  modality?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  description?: string | null;
  requirements?: string | null;
  location?: string | null;
  zone?: string | null;
  benefits?: string[] | string | null;
  skills?: string[] | string | null;
  created_at?: string | null;
  is_active?: boolean;
  status?: string | null;
  recruiter_id?: string | null;
  company_id?: string | null;
}

export interface VacancyPreviewProps {
  vacancy: VacancyPreviewData;
  company?: CompanyInfo | null;
  otherVacancies?: Array<{
    id: string;
    title: string;
    location?: string | null;
    created_at?: string | null;
  }>;
  onApply?: () => void;
  onSave?: () => void;
  onEdit?: () => void;
  onToggleActive?: (nextState: boolean) => void;
  isCompanyView?: boolean;
  isPreviewMode?: boolean;
}

export function VacancyPreview({
  vacancy,
  company,
  otherVacancies = [],
  onApply,
  onSave,
  onEdit,
  onToggleActive,
  isCompanyView = true,
  isPreviewMode = false,
}: VacancyPreviewProps) {
  const [isBookmarked, setIsBookmarked] = React.useState(false);

  const formatSalary = (min?: number | null, max?: number | null) => {
    const formatter = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    });

    if (min != null && max != null) {
      return `${formatter.format(min)} - ${formatter.format(max)} MXN`;
    } else if (min != null) {
      return `Desde ${formatter.format(min)} MXN`;
    } else if (max != null) {
      return `Hasta ${formatter.format(max)} MXN`;
    }
    return "Sueldo a convenir";
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Recientemente";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Recientemente";
    
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 24) {
      return diffHours <= 1 ? "Hace 1 hora" : `Hace ${diffHours} horas`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return diffDays === 1 ? "Hace 1 día" : `Hace ${diffDays} días`;
    }

    return date
      .toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(".", "");
  };

  const benefitsList: string[] = React.useMemo(() => {
    if (!vacancy.benefits) return [];
    if (Array.isArray(vacancy.benefits)) return vacancy.benefits;
    if (typeof vacancy.benefits === "string") {
      return vacancy.benefits.split(",").map((b) => b.trim()).filter(Boolean);
    }
    return [];
  }, [vacancy.benefits]);

  const skillsList: string[] = React.useMemo(() => {
    if (!vacancy.skills) return [];
    if (Array.isArray(vacancy.skills)) return vacancy.skills;
    if (typeof vacancy.skills === "string") {
      return vacancy.skills.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [vacancy.skills]);

  const responsibilitiesList: string[] = React.useMemo(() => {
    if (!vacancy.requirements) return [];
    const lines = vacancy.requirements
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter((l) => l.length > 0);
    return lines;
  }, [vacancy.requirements]);

  const companyInitials = (company?.company_name || "K'anPro")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* ========================================================================= */}
      {/* HEADER DE LA VACANTE (BANNER + AVATAR OVERLAP + BOTONES DE ACCIÓN)      */}
      {/* ========================================================================= */}
      <Card className="p-0 overflow-hidden bg-white dark:bg-fiord-950 border border-fiord-100 dark:border-fiord-800/80 rounded-3xl shadow-xs">
        {/* Banner Superior Edge-to-Edge */}
        <div className="h-44 md:h-52 w-full bg-gradient-to-r from-fiord-800 via-fiord-900 to-fiord-950 dark:from-slate-900 dark:via-fiord-950 dark:to-black relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-fiord-500/10 via-transparent to-transparent pointer-events-none" />
          
          {isPreviewMode && (
            <div className="absolute top-4 right-4 bg-fiord-950/80 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-white/10">
              Vista Previa en Tiempo Real
            </div>
          )}
        </div>

        {/* Sección de Identidad (Bajo el Banner) */}
        <div className="px-6 md:px-8 pb-8 pt-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            
            {/* Avatar Superpuesto + Contenedor de Texto */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Solo el Avatar sube con -mt-14 md:-mt-16 */}
              <Avatar className="-mt-14 md:-mt-16 size-24 md:size-28 rounded-2xl border-4 border-white dark:border-fiord-950 shadow-md bg-white dark:bg-fiord-900 shrink-0 overflow-hidden relative z-10">
                <AvatarImage
                  src={company?.logo_url || ""}
                  alt={company?.company_name || "Logo empresa"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-fiord-100 dark:bg-fiord-900 text-fiord-900 dark:text-fiord-100 font-black text-2xl rounded-xl">
                  {companyInitials}
                </AvatarFallback>
              </Avatar>

              {/* Nombre de la Empresa y Vacante (Totalmente visible y fuera del banner) */}
              <div className="space-y-1 pt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-fiord-950 dark:text-fiord-50">
                    {company?.company_name || "Empresa Aliada"}
                  </span>
                  {vacancy.is_active !== undefined && (
                    <Badge
                      className={cn(
                        "text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-none",
                        vacancy.is_active
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                          : "bg-fiord-100 dark:bg-fiord-900 text-fiord-700 dark:text-fiord-300 border-fiord-200 dark:border-fiord-800"
                      )}
                    >
                      {vacancy.is_active ? "● Activa" : "○ Pausada"}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-fiord-950 dark:text-fiord-50 tracking-tight leading-tight">
                  {vacancy.title || "Título del Puesto"}
                </h1>
                <div className="flex items-center gap-3 text-xs font-semibold text-fiord-500 dark:text-fiord-400 flex-wrap pt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-red-500 shrink-0" />
                    {vacancy.zone || vacancy.location || company?.location || "Mérida - Centro"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5 text-fiord-400 shrink-0" />
                    {formatDate(vacancy.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Fila de Botones de Acción (Derecha) */}
            <div className="flex items-center gap-3 pt-2 md:pt-0 self-start md:self-end">
              {isCompanyView ? (
                <>
                  {onEdit && (
                    <Button
                      onClick={onEdit}
                      variant="outline"
                      className="h-11 px-5 rounded-full border-fiord-200 dark:border-fiord-800 text-fiord-900 dark:text-fiord-100 font-bold text-xs gap-2 hover:bg-fiord-50 shadow-xs"
                    >
                      <Edit2 className="size-3.5 text-blue-600 dark:text-blue-400" />
                      Editar Vacante
                    </Button>
                  )}
                  {onToggleActive && (
                    <div className="flex items-center gap-2.5 px-4 h-11 rounded-full bg-fiord-50 dark:bg-fiord-900/40 border border-fiord-100 dark:border-fiord-800">
                      <Switch
                        checked={Boolean(vacancy.is_active)}
                        onCheckedChange={onToggleActive}
                      />
                      <span className="text-xs font-bold text-fiord-900 dark:text-fiord-100 select-none">
                        {vacancy.is_active ? "Activa" : "Pausada"}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsBookmarked(!isBookmarked);
                      if (onSave) onSave();
                    }}
                    className={cn(
                      "h-11 px-4 rounded-full border-fiord-200 dark:border-fiord-800 font-bold text-xs gap-2 shadow-xs transition-colors",
                      isBookmarked
                        ? "bg-fiord-100 dark:bg-fiord-900 text-fiord-950 dark:text-white"
                        : "bg-white dark:bg-fiord-950 text-fiord-700 dark:text-fiord-300 hover:bg-fiord-50"
                    )}
                  >
                    <Bookmark className={cn("size-4", isBookmarked && "fill-current")} />
                    <span>{isBookmarked ? "Guardado" : "Guardar"}</span>
                  </Button>

                  <Button
                    onClick={onApply}
                    className="h-11 px-7 rounded-full bg-fiord-950 hover:bg-fiord-900 dark:bg-fiord-50 dark:hover:bg-fiord-100 text-white dark:text-fiord-950 font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
                  >
                    Postularme
                  </Button>
                </>
              )}
            </div>

          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* LAYOUT PRINCIPAL (GRID DE 2 COLUMNAS)                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* COLUMNA IZQUIERDA (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-white dark:bg-fiord-950 border border-fiord-100 dark:border-fiord-800/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-fiord-100 dark:border-fiord-800/60">
              <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="size-4" />
              </div>
              <h2 className="text-lg font-extrabold text-fiord-950 dark:text-fiord-50 tracking-tight">
                Acerca del empleo
              </h2>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-fiord-450 dark:text-fiord-500">
                Descripción General
              </p>
              <div className="bg-fiord-50/40 dark:bg-fiord-900/20 border border-fiord-100/60 dark:border-fiord-800/40 p-5 rounded-2xl">
                <MarkdownRenderer content={vacancy.description} />
              </div>
            </div>

            {responsibilitiesList.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-fiord-450 dark:text-fiord-500">
                  Responsabilidades y Funciones
                </h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-fiord-800 dark:text-fiord-200 font-medium pl-1">
                  {responsibilitiesList.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <span className="text-fiord-900 dark:text-fiord-100">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {skillsList.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-fiord-450 dark:text-fiord-500 flex items-center gap-1.5">
                  <Tag className="size-3.5 text-fiord-500" />
                  Habilidades Requeridas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill, idx) => (
                    <Badge
                      key={idx}
                      className="rounded-full bg-fiord-100/70 dark:bg-fiord-900 text-fiord-900 dark:text-fiord-100 border border-fiord-200/60 dark:border-fiord-800 px-4 py-1.5 text-xs font-bold shadow-none"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {benefitsList.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-fiord-100 dark:border-fiord-800/60">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-fiord-450 dark:text-fiord-500 flex items-center gap-1.5">
                  <Gift className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  Beneficios e Incentivos
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {benefitsList.map((benefit, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-bold text-emerald-900 dark:text-emerald-200"
                    >
                      <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* ACERCA DE LA EMPRESA */}
          <Card className="bg-white dark:bg-fiord-950 border border-fiord-100 dark:border-fiord-800/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-14 rounded-2xl border border-fiord-200/60 dark:border-fiord-800 bg-white dark:bg-fiord-900 shrink-0 overflow-hidden">
                <AvatarImage src={company?.logo_url || ""} alt={company?.company_name || ""} />
                <AvatarFallback className="bg-fiord-100 dark:bg-fiord-900 text-fiord-950 dark:text-fiord-100 font-extrabold text-base">
                  {companyInitials}
                </AvatarFallback>
              </Avatar>

              <div>
                <h3 className="text-base font-extrabold text-fiord-950 dark:text-fiord-50">
                  Acerca de {company?.company_name || "la Empresa"}
                </h3>
                <p className="text-xs font-semibold text-fiord-500 dark:text-fiord-400">
                  {company?.industry || "Empresa empleadora"} • {company?.location || "Mérida - Centro"}
                </p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-fiord-700 dark:text-fiord-300 font-medium leading-relaxed">
              {company?.description ||
                "Empresa comprometida con el desarrollo del talento local en la región. Ofrece oportunidades de crecimiento y ambiente laboral colaborativo."}
            </p>

            {company?.website_or_linkedin && (
              <div className="pt-2">
                <a
                  href={
                    company.website_or_linkedin.startsWith("http")
                      ? company.website_or_linkedin
                      : `https://${company.website_or_linkedin}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Globe className="size-3.5" />
                  <span>Visitar sitio web / LinkedIn</span>
                </a>
              </div>
            )}
          </Card>
        </div>

        {/* COLUMNA DERECHA / SIDEBAR (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white dark:bg-fiord-950 border border-fiord-100 dark:border-fiord-800/80 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="space-y-1 pb-5 border-b border-fiord-100 dark:border-fiord-800/80">
              <p className="text-xs font-extrabold uppercase tracking-wider text-fiord-450 dark:text-fiord-500">
                Sueldo estimado mensual
              </p>
              <p className="text-2xl font-black text-fiord-950 dark:text-fiord-50 tracking-tight">
                {formatSalary(vacancy.salary_min, vacancy.salary_max)}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl bg-fiord-50 dark:bg-fiord-900 text-fiord-700 dark:text-fiord-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Briefcase className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-fiord-450 dark:text-fiord-500">
                    Sector / Categoría
                  </p>
                  <p className="text-xs font-bold text-fiord-900 dark:text-fiord-100 mt-0.5">
                    {vacancy.category || company?.industry || "General"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-fiord-450 dark:text-fiord-500">
                    Tipo de Jornada
                  </p>
                  <p className="text-xs font-bold text-fiord-900 dark:text-fiord-100 mt-0.5">
                    {vacancy.employment_type || "Tiempo Completo"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-fiord-450 dark:text-fiord-500">
                    Modalidad
                  </p>
                  <p className="text-xs font-bold text-fiord-900 dark:text-fiord-100 mt-0.5">
                    {vacancy.modality || "Presencial"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-fiord-450 dark:text-fiord-500">
                    Ubicación Exacta
                  </p>
                  <p className="text-xs font-bold text-fiord-900 dark:text-fiord-100 mt-0.5 leading-snug">
                    {vacancy.zone || vacancy.location || company?.location || "Mérida - Centro"}
                  </p>
                </div>
              </div>

              {company?.phone && (
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-fiord-450 dark:text-fiord-500">
                      Contacto WhatsApp
                    </p>
                    <p className="text-xs font-bold text-fiord-900 dark:text-fiord-100 mt-0.5">
                      {company.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {otherVacancies.length > 0 && (
            <Card className="bg-white dark:bg-fiord-950 border border-fiord-100 dark:border-fiord-800/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-fiord-950 dark:text-fiord-50">
                  Otras vacantes activas
                </h3>
                <Badge className="bg-fiord-100 dark:bg-fiord-900 text-fiord-800 dark:text-fiord-200 text-[10px] font-bold px-2 py-0.5 rounded-full border-none">
                  {otherVacancies.length}
                </Badge>
              </div>

              <div className="space-y-3 pt-1">
                {otherVacancies.map((job) => (
                  <Link
                    key={job.id}
                    href={`/dashboard/company/vacancies/${job.id}`}
                    className="block p-3 rounded-xl hover:bg-fiord-50 dark:hover:bg-fiord-900/40 transition-colors border border-transparent hover:border-fiord-100 dark:hover:border-fiord-800 space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-fiord-900 dark:text-fiord-100 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </p>
                      <ChevronRight className="size-3.5 text-fiord-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] font-semibold text-fiord-450 dark:text-fiord-500">
                      📍 {job.location || "Mérida"}
                    </p>
                  </Link>
                ))}
              </div>

              <Button
                render={<Link href="/dashboard/company/vacancies" />}
                variant="ghost"
                className="w-full h-10 rounded-xl text-xs font-bold text-fiord-700 dark:text-fiord-300 hover:bg-fiord-50 dark:hover:bg-fiord-900/40 border border-fiord-100 dark:border-fiord-800 mt-2"
              >
                Ver todas las vacantes
              </Button>
            </Card>
          )}
        </div>

      </div>
    </motion.div>
  );
}
