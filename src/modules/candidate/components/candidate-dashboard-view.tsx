/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  Bookmark, 
  CheckCircle2, 
  MapPin, 
  Search, 
  Sparkles, 
  ArrowUpRight, 
  DollarSign, 
  Compass, 
  Flame, 
  Clock, 
  ChevronRight,
  Navigation,
  Check,
  X,
  LayoutGrid,
  List as ListIcon,
  SlidersHorizontal,
  Building2,
  Share2,
  CheckCheck
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { CandidateDashboardData, VacancyItem } from "@/modules/candidate/services/candidate-dashboard";
import { cn } from "@/lib/utils";

export interface CandidateDashboardViewProps {
  initialData: CandidateDashboardData;
}

const CATEGORY_CHIPS = [
  "Todos",
  "Tecnología",
  "Administración",
  "Ventas y Comercial",
  "Hotelería y Turismo",
  "Operaciones",
  "Atención al Cliente",
  "Salud",
  "Logística",
];

const QUICK_ZONES = [
  "Todas las zonas",
  "Mérida",
  "Cancún",
  "Playa del Carmen",
  "Tulum",
  "Remoto",
];

export function CandidateDashboardView({
  initialData,
}: CandidateDashboardViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const searchInputId = useId();

  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedZone, setSelectedZone] = useState("Todas las zonas");
  const [sortBy, setSortBy] = useState<"nearby" | "salary" | "recent">("nearby");
  const [viewLayout, setViewLayout] = useState<"list" | "grid">("list");

  const candidateProfile = initialData?.profile;
  const candidateLocation = candidateProfile?.location || "";
  const rawFeaturedVacancies = initialData?.featuredVacancies || [];
  const rawNearbyVacancies = initialData?.nearbyVacancies || [];

  // Load saved vacancies and applied applications for the candidate
  useEffect(() => {
    let isMounted = true;
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: savedData }, { data: appliedData }] = await Promise.all([
          supabase
            .from("saved_vacancies")
            .select("vacancy_id")
            .eq("candidate_id", user.id),
          supabase
            .from("applications")
            .select("vacancy_id")
            .eq("candidate_id", user.id)
        ]);

        if (isMounted) {
          if (savedData) {
            setSavedJobIds(new Set(savedData.map((r: { vacancy_id: string }) => r.vacancy_id)));
          }
          if (appliedData) {
            setAppliedJobIds(new Set(appliedData.map((a: { vacancy_id: string }) => a.vacancy_id)));
          }
        }
      } catch (err) {
        console.error("Error fetching candidate data:", err);
      }
    }

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Bookmark toggle with optimistic updates & notification
  const toggleBookmark = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Inicia sesión para guardar vacantes");
        return;
      }

      const isCurrentlySaved = savedJobIds.has(id);

      // Optimistic update
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });

      if (isCurrentlySaved) {
        const { error } = await supabase
          .from("saved_vacancies")
          .delete()
          .eq("candidate_id", user.id)
          .eq("vacancy_id", id);

        if (error) {
          console.error("Error removing saved vacancy:", error);
          setSavedJobIds((prev) => new Set(prev).add(id));
          toast.error("Error al remover de guardados");
          return;
        }

        toast.info("Empleo removido de tus guardados");
      } else {
        const { error } = await supabase
          .from("saved_vacancies")
          .insert({
            candidate_id: user.id,
            vacancy_id: id,
          });

        if (error) {
          console.error("Error saving vacancy:", error);
          setSavedJobIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          toast.error("Error al guardar el empleo");
          return;
        }

        toast.success("Empleo guardado en favoritos");
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      toast.error("Error al actualizar favoritos");
    }
  };

  const handleCardClick = (jobId: string) => {
    router.push(`/dashboard/candidate/vacancies/${jobId}`);
  };

  // Quick share handler
  const handleShare = (e: React.MouseEvent, job: VacancyItem) => {
    e.stopPropagation();
    const url = `${window.location.origin}/dashboard/candidate/vacancies/${job.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Enlace de vacante copiado al portapapeles");
    } else {
      toast.info(`Enlace: ${url}`);
    }
  };

  // Dynamic filter & sort
  const filteredVacancies = useMemo(() => {
    let list = [...rawNearbyVacancies];

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((job) => {
        return (
          job.title.toLowerCase().includes(query) ||
          job.companyName.toLowerCase().includes(query) ||
          job.location.toLowerCase().includes(query) ||
          job.category.toLowerCase().includes(query) ||
          (job.zone && job.zone.toLowerCase().includes(query)) ||
          (job.skills && job.skills.some((s) => s.toLowerCase().includes(query)))
        );
      });
    }

    // Category filter
    if (selectedCategory !== "Todos") {
      list = list.filter((job) => {
        const cat = job.category.toLowerCase();
        const sel = selectedCategory.toLowerCase();
        if (cat.includes(sel)) return true;
        if (selectedCategory === "Tecnología" && (cat.includes("tech") || cat.includes("software") || cat.includes("it"))) return true;
        if (selectedCategory === "Hotelería y Turismo" && (cat.includes("turismo") || cat.includes("hotel") || cat.includes("restaurante"))) return true;
        return false;
      });
    }

    // Zone filter
    if (selectedZone !== "Todas las zonas") {
      const zoneQuery = selectedZone.toLowerCase();
      list = list.filter((job) => {
        if (selectedZone === "Remoto") {
          return job.location.toLowerCase().includes("remoto") || job.modality?.toLowerCase().includes("remoto");
        }
        return job.location.toLowerCase().includes(zoneQuery) || (job.zone && job.zone.toLowerCase().includes(zoneQuery));
      });
    }

    // Sort selection
    if (sortBy === "salary") {
      list.sort((a, b) => (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0));
    } else if (sortBy === "recent") {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else {
      // By proximity (pre-calculated with Haversine distance)
      list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    return list;
  }, [rawNearbyVacancies, searchQuery, selectedCategory, selectedZone, sortBy]);

  const activeFiltersCount = (selectedCategory !== "Todos" ? 1 : 0) + (selectedZone !== "Todas las zonas" ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("Todos");
    setSelectedZone("Todas las zonas");
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300 pb-16 font-sans">
      
      {/* ── 0. HERO SEARCH & RADAR BANNER (Fiord Atmospheric Wash) ── */}
      <section className="relative rounded-xl border border-fiord-200 dark:border-fiord-800 bg-white dark:bg-card p-6 sm:p-8 shadow-soft overflow-hidden">
        {/* Atmospheric Sky-Fiord Radial Gradient Wash */}
        <div className="absolute inset-0 pointer-events-none -z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-24 right-0 w-[550px] h-[350px] bg-gradient-to-b from-fiord-200/40 via-fiord-100/20 to-transparent dark:from-fiord-800/20 dark:via-fiord-900/10 dark:to-transparent blur-3xl rounded-full" />
          <div className="absolute -bottom-20 -left-10 w-[400px] h-[250px] bg-gradient-to-tr from-fiord-100/30 via-fiord-50/20 to-transparent dark:from-fiord-900/20 to-transparent blur-2xl rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-fiord-100 dark:bg-fiord-900/80 text-fiord-900 dark:text-fiord-100 border border-fiord-200 dark:border-fiord-800">
                <Compass className="size-3.5 text-fiord-700 dark:text-fiord-300 animate-spin [animation-duration:8s]" />
                Radar K&apos;anPro
              </span>

              {candidateLocation ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-fiord-700 dark:text-fiord-300 bg-fiord-50 dark:bg-fiord-950/60 px-2.5 py-1 rounded-full border border-fiord-200 dark:border-fiord-800 truncate max-w-xs">
                  <MapPin className="size-3 text-fiord-600 dark:text-fiord-400 shrink-0" />
                  {candidateLocation}
                </span>
              ) : (
                <Link
                  href="/dashboard/candidate/profile"
                  className="inline-flex items-center gap-1 text-xs font-medium text-fiord-600 hover:text-fiord-950 dark:text-fiord-400 dark:hover:text-fiord-100 underline decoration-fiord-300 underline-offset-2"
                >
                  <MapPin className="size-3 shrink-0" />
                  Registrar ubicación para cálculo de distancia
                </Link>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-semibold tracking-[-0.84px] leading-tight text-fiord-950 dark:text-fiord-50">
              Oportunidades laborales en el Sureste
            </h1>
            <p className="text-sm text-fiord-700 dark:text-fiord-300 leading-relaxed max-w-xl">
              Explora vacantes verificadas con transparencia salarial, prestaciones y cálculo de cercanía geográfica a tu domicilio.
            </p>
          </div>

          {/* Quick CTA button */}
          <div className="shrink-0 flex items-center gap-3">
            <Link href="/dashboard/candidate/discovery" className="w-full sm:w-auto">
              <Button className="h-10 px-5 rounded-md bg-fiord-950 text-white text-sm font-medium hover:bg-fiord-900 active:scale-[0.98] transition-all shadow-sm w-full sm:w-auto gap-2 dark:bg-fiord-100 dark:text-fiord-950 dark:hover:bg-white">
                <Sparkles className="size-4" />
                Explorar catálogo completo
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Search & Filter Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-fiord-100 dark:border-fiord-800/80 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <label htmlFor={searchInputId} className="sr-only">
                Buscar por puesto, empresa o habilidad
              </label>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fiord-500 dark:text-fiord-400 pointer-events-none" />
              <input
                id={searchInputId}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar puesto, empresa, habilidad o zona (ej. Contador, Mesero, Mérida)..."
                className="w-full h-10 bg-white dark:bg-fiord-950/60 border border-fiord-200 dark:border-fiord-800 rounded-md pl-10 pr-9 text-sm font-normal text-fiord-950 dark:text-fiord-50 placeholder:text-fiord-400 dark:placeholder:text-fiord-500 focus:outline-none focus:ring-2 focus:ring-fiord-400/50 focus:border-fiord-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fiord-400 hover:text-fiord-800 dark:hover:text-fiord-200 p-1 rounded-sm cursor-pointer transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Zone Quick Dropdown / Filter */}
            <div className="flex items-center gap-2">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                aria-label="Filtrar por zona"
                className="h-10 px-3 bg-white dark:bg-fiord-950/60 border border-fiord-200 dark:border-fiord-800 rounded-md text-xs font-medium text-fiord-800 dark:text-fiord-200 focus:outline-none focus:ring-2 focus:ring-fiord-400/50 cursor-pointer"
              >
                {QUICK_ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>

              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-10 px-3 rounded-md border-fiord-200 dark:border-fiord-800 text-fiord-700 dark:text-fiord-300 hover:bg-fiord-50 dark:hover:bg-fiord-900 text-xs font-medium gap-1.5"
                >
                  <X className="size-3.5" />
                  Limpiar ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>

          {/* Category Chips Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar pt-1" role="tablist" aria-label="Categorías de empleo">
            {CATEGORY_CHIPS.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer border",
                    isSelected
                      ? "bg-fiord-950 text-white border-fiord-950 dark:bg-fiord-100 dark:text-fiord-950 dark:border-fiord-100 shadow-xs"
                      : "bg-fiord-50 dark:bg-fiord-900/40 text-fiord-700 dark:text-fiord-300 border-fiord-200 dark:border-fiord-800 hover:bg-fiord-100 dark:hover:bg-fiord-800/60 hover:text-fiord-950 dark:hover:text-fiord-50"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 1. FEATURED SECTION (VACANTES DESTACADAS) ── */}
      <section className="space-y-4" aria-labelledby="featured-vacancies-heading">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center justify-center">
              <Flame className="size-4.5" />
            </div>
            <div>
              <h2 id="featured-vacancies-heading" className="text-lg font-semibold tracking-[-0.4px] text-fiord-950 dark:text-fiord-50">
                Vacantes destacadas
              </h2>
            </div>
          </div>
          
          <Link 
            href="/dashboard/candidate/discovery" 
            className="text-xs font-semibold text-fiord-700 hover:text-fiord-950 dark:text-fiord-300 dark:hover:text-fiord-50 transition-colors inline-flex items-center gap-1 group py-1"
          >
            Ver todas
            <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Featured Content 3-col Grid */}
        {rawFeaturedVacancies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rawFeaturedVacancies.map((job) => {
              const isSaved = savedJobIds.has(job.id);
              const isApplied = appliedJobIds.has(job.id);

              return (
                <div
                  key={job.id}
                  onClick={() => handleCardClick(job.id)}
                  className="group relative bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 rounded-lg p-5 flex flex-col justify-between shadow-soft hover:shadow-card-hover hover:border-fiord-400 dark:hover:border-fiord-600 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="space-y-3.5">
                    {/* Top Status Tags & Bookmark Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                          <Sparkles className="size-3" />
                          Destacada
                        </span>
                        {isApplied && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                            <CheckCheck className="size-3" />
                            Postulado
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleShare(e, job)}
                          aria-label={`Compartir vacante ${job.title}`}
                          className="text-fiord-400 hover:text-fiord-800 dark:hover:text-fiord-200 p-1.5 rounded-md hover:bg-fiord-50 dark:hover:bg-fiord-800/60 transition-colors cursor-pointer"
                        >
                          <Share2 className="size-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                          aria-label={isSaved ? `Remover ${job.title} de guardados` : `Guardar ${job.title}`}
                          className="text-fiord-400 hover:text-amber-500 dark:hover:text-amber-400 p-1.5 rounded-md hover:bg-fiord-50 dark:hover:bg-fiord-800/60 transition-colors cursor-pointer"
                        >
                          <Bookmark className={cn("size-4.5 transition-transform active:scale-90", isSaved ? "fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" : "")} />
                        </button>
                      </div>
                    </div>

                    {/* Company Branding & Job Title */}
                    <div className="flex items-start gap-3">
                      <div className="size-11 rounded-md bg-fiord-50 dark:bg-fiord-900/60 border border-fiord-200 dark:border-fiord-800 flex items-center justify-center text-fiord-900 dark:text-fiord-100 shrink-0 font-semibold text-xs overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                        {job.companyLogo ? (
                          <img src={job.companyLogo} alt={job.companyName} className="size-full object-cover" />
                        ) : (
                          <span>
                            {job.companyName.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-fiord-600 dark:text-fiord-400 truncate flex items-center gap-1">
                          {job.companyName}
                          <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        </p>
                        <h3 className="text-sm sm:text-base font-semibold text-fiord-950 dark:text-fiord-50 tracking-[-0.2px] line-clamp-2 group-hover:text-fiord-700 dark:group-hover:text-fiord-200 transition-colors mt-0.5">
                          {job.title}
                        </h3>
                      </div>
                    </div>

                    {/* Pills Row (Location, Modality, Proximity) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-normal text-fiord-700 dark:text-fiord-300 bg-fiord-50 dark:bg-fiord-900/50 px-2.5 py-0.5 rounded-full border border-fiord-200/80 dark:border-fiord-800">
                        <MapPin className="size-3 text-fiord-500 shrink-0" />
                        <span className="truncate max-w-[130px]">{job.location}</span>
                      </span>

                      {job.distanceBadge && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-fiord-800 dark:text-fiord-200 bg-fiord-100 dark:bg-fiord-800 px-2 py-0.5 rounded-full border border-fiord-200 dark:border-fiord-700">
                          <Navigation className="size-2.5 text-fiord-600 dark:text-fiord-300" />
                          {job.distanceBadge}
                        </span>
                      )}

                      <span className="text-[11px] font-normal text-fiord-600 dark:text-fiord-400 bg-fiord-50 dark:bg-fiord-900/40 px-2 py-0.5 rounded-full border border-fiord-200/60 dark:border-fiord-800">
                        {job.employmentType}
                      </span>
                    </div>
                  </div>

                  {/* Footer: High-contrast salary & CTA */}
                  <div className="pt-3.5 mt-4 border-t border-fiord-100 dark:border-fiord-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-fiord-500 dark:text-fiord-400 font-semibold uppercase tracking-wider block">
                        Salario mensual
                      </span>
                      <span className="text-sm font-semibold font-mono text-emerald-700 dark:text-emerald-400">
                        {job.formattedSalary}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-fiord-950 dark:text-fiord-100 group-hover:translate-x-0.5 transition-transform">
                      Ver vacante
                      <ArrowUpRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg bg-fiord-50 dark:bg-fiord-950/40 border border-fiord-200 dark:border-fiord-800 p-6 text-center">
            <p className="text-sm text-fiord-700 dark:text-fiord-300">
              No hay vacantes destacadas en este momento.
            </p>
          </div>
        )}
      </section>

      {/* ── 2. NEARBY FEED SECTION (EMPLEOS CERCA DE TI) ── */}
      <section className="space-y-4 pt-2" aria-labelledby="nearby-vacancies-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-md bg-fiord-100 dark:bg-fiord-900/80 text-fiord-950 dark:text-fiord-100 border border-fiord-200 dark:border-fiord-800 flex items-center justify-center">
                <Navigation className="size-4 text-fiord-700 dark:text-fiord-300" />
              </div>
              <h2 id="nearby-vacancies-heading" className="text-lg font-semibold tracking-[-0.4px] text-fiord-950 dark:text-fiord-50">
                Empleos cerca de ti
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-fiord-100 dark:bg-fiord-800 text-fiord-900 dark:text-fiord-100 border border-fiord-200 dark:border-fiord-700">
                {filteredVacancies.length}
              </span>
            </div>
            <p className="text-xs text-fiord-600 dark:text-fiord-400 mt-1">
              Ordenadas por cercanía geográfica y compatibilidad con tu perfil.
            </p>
          </div>

          {/* Controls: Sorting & View Layout */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Sort options */}
            <div className="inline-flex items-center bg-fiord-50 dark:bg-fiord-900/50 p-1 rounded-md border border-fiord-200 dark:border-fiord-800" role="group" aria-label="Ordenar vacantes">
              <button
                onClick={() => setSortBy("nearby")}
                aria-pressed={sortBy === "nearby"}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-sm transition-all cursor-pointer flex items-center gap-1",
                  sortBy === "nearby"
                    ? "bg-white dark:bg-fiord-800 text-fiord-950 dark:text-fiord-50 shadow-2xs font-semibold"
                    : "text-fiord-600 dark:text-fiord-400 hover:text-fiord-950 dark:hover:text-fiord-200"
                )}
              >
                <MapPin className="size-3" />
                Cercanía
              </button>
              <button
                onClick={() => setSortBy("salary")}
                aria-pressed={sortBy === "salary"}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-sm transition-all cursor-pointer flex items-center gap-1",
                  sortBy === "salary"
                    ? "bg-white dark:bg-fiord-800 text-fiord-950 dark:text-fiord-50 shadow-2xs font-semibold"
                    : "text-fiord-600 dark:text-fiord-400 hover:text-fiord-950 dark:hover:text-fiord-200"
                )}
              >
                <DollarSign className="size-3" />
                Sueldo
              </button>
              <button
                onClick={() => setSortBy("recent")}
                aria-pressed={sortBy === "recent"}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-sm transition-all cursor-pointer flex items-center gap-1",
                  sortBy === "recent"
                    ? "bg-white dark:bg-fiord-800 text-fiord-950 dark:text-fiord-50 shadow-2xs font-semibold"
                    : "text-fiord-600 dark:text-fiord-400 hover:text-fiord-950 dark:hover:text-fiord-200"
                )}
              >
                <Clock className="size-3" />
                Recientes
              </button>
            </div>

            {/* Layout Toggle (List / Grid) */}
            <div className="inline-flex items-center bg-fiord-50 dark:bg-fiord-900/50 p-1 rounded-md border border-fiord-200 dark:border-fiord-800" role="group" aria-label="Vista">
              <button
                onClick={() => setViewLayout("list")}
                aria-label="Vista de lista"
                aria-pressed={viewLayout === "list"}
                className={cn(
                  "p-1 rounded-sm transition-all cursor-pointer",
                  viewLayout === "list"
                    ? "bg-white dark:bg-fiord-800 text-fiord-950 dark:text-fiord-50 shadow-2xs"
                    : "text-fiord-500 hover:text-fiord-950 dark:hover:text-fiord-200"
                )}
              >
                <ListIcon className="size-3.5" />
              </button>
              <button
                onClick={() => setViewLayout("grid")}
                aria-label="Vista de cuadrícula"
                aria-pressed={viewLayout === "grid"}
                className={cn(
                  "p-1 rounded-sm transition-all cursor-pointer",
                  viewLayout === "grid"
                    ? "bg-white dark:bg-fiord-800 text-fiord-950 dark:text-fiord-50 shadow-2xs"
                    : "text-fiord-500 hover:text-fiord-950 dark:hover:text-fiord-200"
                )}
              >
                <LayoutGrid className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Nearby Vacancies Feed Container */}
        {filteredVacancies.length > 0 ? (
          <div className={cn(
            viewLayout === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          )}>
            {filteredVacancies.map((job) => {
              const isSaved = savedJobIds.has(job.id);
              const isApplied = appliedJobIds.has(job.id);

              if (viewLayout === "grid") {
                // Compact Grid Card
                return (
                  <div
                    key={job.id}
                    onClick={() => handleCardClick(job.id)}
                    className="group relative bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 rounded-lg p-5 flex flex-col justify-between shadow-soft hover:shadow-card-hover hover:border-fiord-400 dark:hover:border-fiord-600 transition-all cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {job.distanceBadge && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-fiord-800 dark:text-fiord-200 bg-fiord-100 dark:bg-fiord-800 px-2 py-0.5 rounded-full border border-fiord-200 dark:border-fiord-700">
                              <Navigation className="size-2.5 text-fiord-600 dark:text-fiord-300" />
                              {job.distanceBadge}
                            </span>
                          )}
                          {isApplied && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                              <CheckCheck className="size-3" />
                              Postulado
                            </span>
                          )}
                        </div>

                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                          aria-label={isSaved ? `Remover ${job.title} de guardados` : `Guardar ${job.title}`}
                          className="text-fiord-400 hover:text-amber-500 dark:hover:text-amber-400 p-1.5 rounded-md hover:bg-fiord-50 dark:hover:bg-fiord-800/60 transition-colors cursor-pointer"
                        >
                          <Bookmark className={cn("size-4.5 transition-transform active:scale-90", isSaved ? "fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" : "")} />
                        </button>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="size-11 rounded-md bg-fiord-50 dark:bg-fiord-900/60 border border-fiord-200 dark:border-fiord-800 flex items-center justify-center text-fiord-900 dark:text-fiord-100 shrink-0 font-semibold text-xs overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                          {job.companyLogo ? (
                            <img src={job.companyLogo} alt={job.companyName} className="size-full object-cover" />
                          ) : (
                            <span>
                              {job.companyName.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-fiord-600 dark:text-fiord-400 truncate flex items-center gap-1">
                            {job.companyName}
                            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          </p>
                          <h3 className="text-sm sm:text-base font-semibold text-fiord-950 dark:text-fiord-50 tracking-[-0.2px] line-clamp-2 group-hover:text-fiord-700 dark:group-hover:text-fiord-200 transition-colors mt-0.5">
                            {job.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-fiord-600 dark:text-fiord-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3 text-fiord-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{job.location}</span>
                        </span>
                        <span>•</span>
                        <span>{job.employmentType}</span>
                      </div>
                    </div>

                    <div className="pt-3.5 mt-4 border-t border-fiord-100 dark:border-fiord-800 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-fiord-500 dark:text-fiord-400 font-semibold uppercase tracking-wider block">
                          Sueldo
                        </span>
                        <span className="text-sm font-semibold font-mono text-emerald-700 dark:text-emerald-400">
                          {job.formattedSalary}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        className="h-8 px-3 rounded-md bg-fiord-950 text-white text-xs font-medium hover:bg-fiord-900 transition-all dark:bg-fiord-100 dark:text-fiord-950 dark:hover:bg-white gap-1"
                      >
                        Ver vacante
                        <ArrowUpRight className="size-3" />
                      </Button>
                    </div>
                  </div>
                );
              }

              // High-density Ergonomic List Row Card
              return (
                <div
                  key={job.id}
                  onClick={() => handleCardClick(job.id)}
                  className="group bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-soft hover:shadow-card-hover hover:border-fiord-400 dark:hover:border-fiord-600 transition-all cursor-pointer relative overflow-hidden"
                >
                  {/* Left Column: Avatar + Main Metadata */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Company Avatar */}
                    <div className="size-12 rounded-md bg-fiord-50 dark:bg-fiord-900/60 border border-fiord-200 dark:border-fiord-800 flex items-center justify-center text-fiord-900 dark:text-fiord-100 shrink-0 font-semibold text-xs overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.companyName} className="size-full object-cover" />
                      ) : (
                        <span>
                          {job.companyName.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Job Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-fiord-600 dark:text-fiord-400 truncate flex items-center gap-1">
                          {job.companyName}
                          <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        </span>

                        {job.distanceBadge && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-fiord-100 dark:bg-fiord-800 text-fiord-900 dark:text-fiord-100 border border-fiord-200 dark:border-fiord-700">
                            <Navigation className="size-2.5 text-fiord-600 dark:text-fiord-300" />
                            {job.distanceBadge}
                          </span>
                        )}

                        {job.isFeatured && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                            ★ Destacada
                          </span>
                        )}

                        {isApplied && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                            <CheckCheck className="size-3" /> Postulado
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-fiord-950 dark:text-fiord-50 tracking-[-0.2px] group-hover:text-fiord-700 dark:group-hover:text-fiord-200 transition-colors truncate">
                        {job.title}
                      </h3>

                      {/* Details row with pills */}
                      <div className="flex items-center gap-2.5 text-xs text-fiord-600 dark:text-fiord-400 flex-wrap pt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3 text-fiord-500 shrink-0" />
                          {job.location}
                        </span>
                        <span>•</span>
                        <span>{job.employmentType}</span>
                        <span>•</span>
                        <span className="font-medium text-fiord-800 dark:text-fiord-200">{job.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Salary, Bookmark & CTA */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-fiord-100 dark:border-fiord-800/80 gap-3">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-fiord-500 dark:text-fiord-400 font-semibold uppercase tracking-wider block">
                        Salario mensual
                      </span>
                      <span className="text-sm sm:text-base font-semibold font-mono text-emerald-700 dark:text-emerald-400">
                        {job.formattedSalary}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                        aria-label={isSaved ? `Remover ${job.title} de guardados` : `Guardar ${job.title}`}
                        className="p-2 text-fiord-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer rounded-md hover:bg-fiord-50 dark:hover:bg-fiord-800/60 border border-fiord-200 dark:border-fiord-800"
                      >
                        <Bookmark className={cn("size-4 transition-transform active:scale-90", isSaved ? "fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" : "")} />
                      </button>

                      <Button 
                        size="sm"
                        className="h-9 px-4 rounded-md bg-fiord-950 text-white text-xs font-medium hover:bg-fiord-900 transition-all dark:bg-fiord-100 dark:text-fiord-950 dark:hover:bg-white shadow-sm gap-1.5"
                      >
                        {isApplied ? "Ver postulación" : "Ver vacante"}
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* End of results banner */}
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <div className="size-8 rounded-full bg-fiord-100 dark:bg-fiord-900 flex items-center justify-center text-fiord-700 dark:text-fiord-300">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-medium text-fiord-600 dark:text-fiord-400">
                Has visto todas las vacantes cercanas según tus filtros
              </p>
              <Link href="/dashboard/candidate/discovery">
                <Button variant="outline" size="sm" className="rounded-md text-xs font-medium mt-1 border-fiord-200 dark:border-fiord-800">
                  Explorar todo el catálogo regional
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-xl bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-soft">
            <div className="size-14 rounded-lg bg-fiord-100 dark:bg-fiord-900/60 text-fiord-800 dark:text-fiord-200 flex items-center justify-center mb-4 border border-fiord-200 dark:border-fiord-800">
              <Compass className="size-7" />
            </div>
            <h3 className="text-lg font-semibold text-fiord-950 dark:text-fiord-50 mb-1">
              No se encontraron vacantes con estos filtros
            </h3>
            <p className="text-sm text-fiord-700 dark:text-fiord-300 max-w-md leading-relaxed mb-6">
              Intenta buscar con otros términos o limpia los filtros activos para ver todas las oportunidades en Yucatán y Quintana Roo.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button 
                variant="outline"
                onClick={clearAllFilters}
                className="h-9 px-4 rounded-md border-fiord-200 dark:border-fiord-800 text-xs font-medium cursor-pointer"
              >
                Limpiar filtros
              </Button>
              <Link href="/dashboard/candidate/discovery">
                <Button 
                  className="h-9 px-4 rounded-md bg-fiord-950 text-white text-xs font-medium hover:bg-fiord-900 shadow-sm cursor-pointer gap-1.5 dark:bg-fiord-100 dark:text-fiord-950 dark:hover:bg-white"
                >
                  <Sparkles className="size-3.5" />
                  Ver todas las vacantes
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}


