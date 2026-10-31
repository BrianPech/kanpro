/* eslint-disable @next/next/no-img-element */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Bookmark,
  Share2,
  Building2,
  CheckCircle2,
  Sparkles,
  Gift,
  Clock,
  Send,
  Check,
  Phone,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Navigation,
  Globe,
  Tag,
  Loader2,
} from "@/components/ui/icons";
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { parseLocation, cleanCityName } from '@/lib/formatters';
import { getCoordsForZone, haversineDistanceKm, GEO_CONFIG } from '@/config/geo';

export interface CompanyDetails {
  id?: string;
  company_name?: string | null;
  logo_url?: string | null;
  location?: string | null;
  industry?: string | null;
  description?: string | null;
  contact_phone?: string | null;
  website_url?: string | null;
  verification_status?: string | null;
}

export interface VacancyDetailData {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  zone?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  employment_type?: string | null;
  modality?: string | null;
  category?: string | null;
  skills?: string[] | null;
  benefits?: string[] | null;
  requirements?: string | null;
  is_featured?: boolean;
  is_promoted?: boolean;
  created_at?: string | null;
  company_id: string;
}

export interface CandidateVacancyDetailViewProps {
  vacancy: VacancyDetailData;
  company: CompanyDetails | null;
  similarVacancies?: VacancyDetailData[];
  initialIsSaved?: boolean;
  initialApplication?: { id: string; status: string } | null;
  candidateLocation?: string | null;
}

export function CandidateVacancyDetailView({
  vacancy,
  company,
  similarVacancies = [],
  initialIsSaved = false,
  initialApplication = null,
  candidateLocation = null,
}: CandidateVacancyDetailViewProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isSaved, setIsSaved] = React.useState(initialIsSaved);
  const [application, setApplication] = React.useState<{ id: string; status: string } | null>(initialApplication);
  const [isApplying, setIsApplying] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const cleanCity = cleanCityName(vacancy.location || '');
  const displayLocation = vacancy.zone && cleanCity
    ? `${vacancy.zone}, ${cleanCity}`
    : vacancy.location || vacancy.zone || 'Ubicación regional';

  // Distance calculation
  const distanceBadge = React.useMemo(() => {
    if (!candidateLocation) return null;
    const candCoords = getCoordsForZone(candidateLocation);
    const vacCoords =
      getCoordsForZone(`${cleanCity} - ${vacancy.zone || ''}`) ||
      getCoordsForZone(vacancy.zone) ||
      getCoordsForZone(cleanCity) ||
      (GEO_CONFIG[cleanCity]?.coords ?? null);

    if (candCoords && vacCoords) {
      const dist = haversineDistanceKm(candCoords.lat, candCoords.lng, vacCoords.lat, vacCoords.lng);
      if (dist < 1.5) return '< 1.5 km (Misma zona)';
      if (dist < 10) return `${dist.toFixed(1)} km de tu casa`;
      if (dist < 35) return `${dist.toFixed(0)} km (${cleanCity})`;
      return `${dist.toFixed(0)} km de distancia`;
    }
    return null;
  }, [candidateLocation, cleanCity, vacancy.zone]);

  // Formatted Salary
  const formattedSalary = React.useMemo(() => {
    const min = Number(vacancy.salary_min);
    const max = Number(vacancy.salary_max);
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()} MXN`;
    if (min) return `Desde $${min.toLocaleString()} MXN`;
    if (max) return `Hasta $${max.toLocaleString()} MXN`;
    return 'Sueldo a convenir / No especificado';
  }, [vacancy.salary_min, vacancy.salary_max]);

  // Publish date string
  const publishedDateText = React.useMemo(() => {
    if (!vacancy.created_at) return 'Reciente';
    try {
      const date = new Date(vacancy.created_at);
      return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Reciente';
    }
  }, [vacancy.created_at]);

  // Handle Share
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${vacancy.title} en ${company?.company_name || "K'anPro"}`,
          text: `Mira esta vacante de ${vacancy.title} en ${displayLocation} con salario de ${formattedSalary}`,
          url: shareUrl,
        });
      } catch (e) {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Enlace de la vacante copiado al portapapeles');
    }
  };

  // Handle Toggle Bookmark
  const handleToggleBookmark = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Inicia sesión para guardar vacantes');
        return;
      }

      if (isSaved) {
        const { error } = await supabase
          .from('saved_vacancies')
          .delete()
          .eq('candidate_id', user.id)
          .eq('vacancy_id', vacancy.id);

        if (error) throw error;
        setIsSaved(false);
        toast.info('Vacante removida de tus favoritos');
      } else {
        const { error } = await supabase
          .from('saved_vacancies')
          .insert({
            candidate_id: user.id,
            vacancy_id: vacancy.id,
          });

        if (error) throw error;
        setIsSaved(true);
        toast.success('Vacante guardada en tus favoritos');
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      toast.error('No se pudo actualizar favoritos');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Apply to Vacancy
  const handleApply = async () => {
    if (application) return;

    try {
      setIsApplying(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes iniciar sesión para postularte');
        return;
      }

      const { data: newApp, error } = await supabase
        .from('applications')
        .insert({
          candidate_id: user.id,
          vacancy_id: vacancy.id,
          status: 'Pendiente',
          applied_at: new Date().toISOString(),
        })
        .select('id, status')
        .single();

      if (error) {
        console.error('Error applying to vacancy:', error);
        toast.error('Hubo un error al enviar tu postulación');
        return;
      }

      setApplication({ id: newApp.id, status: newApp.status || 'Pendiente' });
      toast.success('🎉 ¡Postulación enviada exitosamente!', {
        description: `Tu perfil ha sido enviado a ${company?.company_name || 'la empresa'}.`,
      });
    } catch (err) {
      console.error('Apply error:', err);
      toast.error('No se pudo procesar la postulación');
    } finally {
      setIsApplying(false);
    }
  };

  // Skills list parsing with intelligent contextual fallback
  const skillsList = React.useMemo(() => {
    let rawList: string[] = [];
    if (Array.isArray(vacancy.skills)) {
      rawList = vacancy.skills.filter(Boolean);
    } else if (typeof vacancy.skills === 'string') {
      try {
        const parsed = JSON.parse(vacancy.skills);
        if (Array.isArray(parsed)) rawList = parsed.filter(Boolean);
      } catch {
        rawList = (vacancy.skills as string).split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    if (rawList.length > 0) return rawList;

    // Contextual fallback based on category & title
    const cat = (vacancy.category || '').toLowerCase();
    const tit = (vacancy.title || '').toLowerCase();

    if (cat.includes('tecno') || tit.includes('desarroll') || tit.includes('sistemas') || tit.includes('program')) {
      return ['Desarrollo de Software', 'Resolución de Problemas', 'Trabajo en Equipo', 'Pensamiento Lógico', 'Capacidad de Aprendizaje'];
    }
    if (cat.includes('venta') || tit.includes('ventas') || tit.includes('ejecutiv') || tit.includes('asesor') || tit.includes('cajer')) {
      return ['Atención al Cliente', 'Facilidad de Palabra', 'Orientación a Resultados', 'Puntualidad', 'Manejo de Caja'];
    }
    if (cat.includes('hotel') || cat.includes('turism') || tit.includes('meser') || tit.includes('recepc') || tit.includes('cocin') || tit.includes('camarist')) {
      return ['Servicio al Cliente', 'Trabajo en Equipo', 'Puntualidad', 'Actitud de Servicio', 'Dinamismo'];
    }
    if (cat.includes('admin') || tit.includes('admin') || tit.includes('contad') || tit.includes('auxiliar')) {
      return ['Organización', 'Manejo de Documentos', 'Responsabilidad', 'Trabajo en Equipo', 'Puntualidad'];
    }
    if (cat.includes('operac') || cat.includes('logist') || tit.includes('chofer') || tit.includes('almacen')) {
      return ['Organización', 'Puntualidad', 'Compromiso', 'Manejo Responsable', 'Trabajo en Equipo'];
    }
    return ['Trabajo en Equipo', 'Puntualidad', 'Responsabilidad', 'Buena Actitud', 'Compromiso'];
  }, [vacancy.skills, vacancy.category, vacancy.title]);

  // Benefits list parsing
  const benefitsList = React.useMemo(() => {
    if (Array.isArray(vacancy.benefits)) return vacancy.benefits.filter(Boolean);
    if (typeof vacancy.benefits === 'string') {
      try {
        const parsed = JSON.parse(vacancy.benefits);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return (vacancy.benefits as string).split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  }, [vacancy.benefits]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300 font-sans">
      
      {/* ── BACK BUTTON & TOP ACTIONS ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-3xl hover:bg-muted cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>Volver a vacantes</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-9 px-4 rounded-4xl border-border/70 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
          >
            <Share2 className="size-3.5" />
            <span className="hidden sm:inline">Compartir</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleBookmark}
            disabled={isSaving}
            className="h-9 px-4 rounded-4xl border-border/70 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
          >
            <Bookmark className={cn('size-3.5', isSaved ? 'fill-primary text-primary' : 'text-muted-foreground')} />
            <span className="hidden sm:inline">{isSaved ? 'Guardado' : 'Guardar'}</span>
          </Button>
        </div>
      </div>

      {/* ── HERO BANNER CARD ── */}
      <div className="bg-card border border-border/70 rounded-4xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Atmospheric radial wash */}
        <div className="absolute inset-0 pointer-events-none -z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-24 right-0 w-[500px] h-[300px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
            {/* Company Avatar */}
            <div className="size-16 rounded-3xl bg-muted border border-border/70 flex items-center justify-center text-foreground shrink-0 font-bold text-lg overflow-hidden shadow-2xs">
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.company_name || 'Empresa'} className="size-full object-cover" />
              ) : (
                <span>
                  {(company?.company_name || 'EM').substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  {company?.company_name || 'Empresa Empleadora'}
                  <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                </span>

                {distanceBadge && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-3xl bg-primary/10 text-primary border border-primary/20">
                    <Navigation className="size-2.5 text-primary" />
                    {distanceBadge}
                  </span>
                )}

                {(vacancy.is_featured || vacancy.is_promoted) && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-3xl bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="size-3" /> Destacada
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
                {vacancy.title}
              </h1>

              {/* Tag Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 bg-muted/60 px-2.5 py-0.5 rounded-3xl border border-border/60">
                  <MapPin className="size-3 text-muted-foreground shrink-0" />
                  {displayLocation}
                </span>
                <span className="inline-flex items-center gap-1 bg-muted/60 px-2.5 py-0.5 rounded-3xl border border-border/60">
                  <Briefcase className="size-3 text-muted-foreground shrink-0" />
                  {vacancy.employment_type || 'Tiempo Completo'}
                </span>
                <span className="inline-flex items-center gap-1 bg-muted/60 px-2.5 py-0.5 rounded-3xl border border-border/60">
                  <Building2 className="size-3 text-muted-foreground shrink-0" />
                  {vacancy.modality || 'Presencial'}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground pl-1">
                  <Clock className="size-3 shrink-0" />
                  Publicado el {publishedDateText}
                </span>
              </div>
            </div>
          </div>

          {/* Salary & Primary Apply Action */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-border/60 shrink-0">
            <div className="text-left md:text-right">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                Salario mensual ofrecido
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-foreground block mt-0.5">
                {formattedSalary}
              </span>
            </div>

            {application ? (
              <Button
                disabled
                className="w-full sm:w-auto h-9 px-4 rounded-4xl font-semibold text-xs bg-primary/10 text-primary border border-primary/20 gap-2 cursor-default"
              >
                <Check className="size-4 text-primary" />
                Postulado ({application.status})
              </Button>
            ) : (
              <Button
                onClick={handleApply}
                disabled={isApplying}
                className="w-full sm:w-auto h-9 px-5 rounded-4xl text-xs font-semibold gap-2 shadow-xs cursor-pointer"
              >
                {isApplying ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Postularme ahora
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN CONTENT LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (8 cols): Description, Requirements, Benefits */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Description */}
          <div className="bg-card border border-border/70 rounded-4xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
              <div className="size-8 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="size-4" />
              </div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Descripción del puesto
              </h2>
            </div>

            <div className="pt-1 text-sm text-foreground/90 leading-relaxed">
              <MarkdownRenderer content={vacancy.description} />
            </div>
          </div>

          {/* Benefits Section */}
          {benefitsList.length > 0 && (
            <div className="bg-card border border-border/70 rounded-4xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
                <div className="size-8 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Gift className="size-4" />
                </div>
                <h2 className="text-base font-bold text-foreground tracking-tight">
                  Prestaciones y Beneficios
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {benefitsList.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-3xl bg-muted/40 border border-border/60 text-xs sm:text-sm font-medium text-foreground"
                  >
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills & Requirements Section */}
          <div className="bg-card border border-border/70 rounded-4xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
              <div className="size-8 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Tag className="size-4" />
              </div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Requisitos y Habilidades
              </h2>
            </div>

            {/* Skills Badges */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Habilidades y Competencias Clave
              </span>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="rounded-3xl px-3 py-1 text-xs font-medium border bg-muted/60 text-foreground border-border/60"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Detailed Requirements */}
            <div className="space-y-3 pt-3 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Requisitos de Contratación
              </span>

              {vacancy.requirements && vacancy.requirements !== vacancy.description ? (
                <div className="pt-1 text-sm text-foreground/90 leading-relaxed">
                  <MarkdownRenderer content={vacancy.requirements} />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-center gap-2.5 p-3 rounded-3xl bg-muted/40 border border-border/60 text-xs sm:text-sm font-medium text-foreground">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Disponibilidad de horario para el puesto</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-3xl bg-muted/40 border border-border/60 text-xs sm:text-sm font-medium text-foreground">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Documentación básica en regla</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-3xl bg-muted/40 border border-border/60 text-xs sm:text-sm font-medium text-foreground">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Puntualidad y sentido de responsabilidad</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-3xl bg-muted/40 border border-border/60 text-xs sm:text-sm font-medium text-foreground">
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                    <span>Radicar en o cerca de {displayLocation}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT SIDEBAR (4 cols): Quick Details, Company Profile, Trust Card */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Summary Card */}
          <div className="bg-card border border-border/70 rounded-4xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground tracking-tight pb-3 border-b border-border/60">
              Resumen del empleo
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="size-4 text-primary shrink-0" />
                  Sueldo
                </span>
                <span className="font-semibold font-mono text-foreground text-right">{formattedSalary}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-4 text-muted-foreground shrink-0" />
                  Ubicación
                </span>
                <span className="font-medium text-foreground text-right truncate max-w-[170px]">
                  {displayLocation}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="size-4 text-muted-foreground shrink-0" />
                  Contrato
                </span>
                <span className="font-medium text-foreground text-right">
                  {vacancy.employment_type || 'Tiempo Completo'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="size-4 text-muted-foreground shrink-0" />
                  Modalidad
                </span>
                <span className="font-medium text-foreground text-right">
                  {vacancy.modality || 'Presencial'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Tag className="size-4 text-muted-foreground shrink-0" />
                  Categoría
                </span>
                <span className="font-medium text-foreground text-right">
                  {vacancy.category || 'General'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60">
              {application ? (
                <Button disabled className="w-full h-9 rounded-4xl font-semibold text-xs bg-primary/10 text-primary border border-primary/20">
                  Ya estás postulado
                </Button>
              ) : (
                <Button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="w-full h-9 rounded-4xl text-xs font-semibold shadow-xs gap-1.5 cursor-pointer"
                >
                  <Send className="size-3.5" />
                  Postularme a esta vacante
                </Button>
              )}
            </div>
          </div>

          {/* Company Card */}
          <div className="bg-card border border-border/70 rounded-4xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground tracking-tight pb-3 border-b border-border/60 flex items-center justify-between">
              <span>Sobre la empresa</span>
              <ShieldCheck className="size-4 text-primary" />
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-3xl bg-muted flex items-center justify-center text-foreground font-bold text-sm overflow-hidden border border-border/70">
                  {company?.logo_url ? (
                    <img src={company.logo_url} alt={company.company_name || 'Empresa'} className="size-full object-cover" />
                  ) : (
                    <Building2 className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {company?.company_name || 'Empresa Empleadora'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {company?.industry || 'Empresa Verificada'}
                  </p>
                </div>
              </div>

              {company?.description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {company.description}
                </p>
              )}

              {company?.website_url && (
                <a
                  href={company.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-4 pt-1"
                >
                  <Globe className="size-3.5" />
                  Sitio web de la empresa
                </a>
              )}
            </div>
          </div>

          {/* K'anPro Guarantee Card */}
          <div className="p-5 rounded-4xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="size-4 text-primary" />
              Garantía K&apos;anPro
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta vacante cuenta con salario real y validación de contacto directo con el área de Recursos Humanos.
            </p>
          </div>

        </div>

      </div>

      {/* ── SIMILAR VACANCIES SECTION ── */}
      {similarVacancies.length > 0 && (
        <section className="pt-6 space-y-4 border-t border-border/60">
          <h3 className="text-base font-bold tracking-tight text-foreground">
            Otras oportunidades que te pueden interesar
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {similarVacancies.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/dashboard/candidate/vacancies/${item.id}`)}
                className="group bg-card border border-border/70 rounded-4xl p-5 shadow-xs hover:border-border hover:bg-muted/30 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground font-normal mt-1">
                    {item.location} • {item.employment_type || 'Tiempo Completo'}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-foreground">
                    {item.salary_min && item.salary_max
                      ? `$${item.salary_min.toLocaleString()} - $${item.salary_max.toLocaleString()} MXN`
                      : 'Sueldo a convenir'}
                  </span>
                  <span className="text-xs font-semibold text-foreground inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Ver <ChevronRight className="size-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

