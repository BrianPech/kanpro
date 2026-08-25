/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Search, 
  SlidersHorizontal, 
  X, 
  Briefcase, 
  Bookmark, 
  RotateCw, 
  SearchX, 
  WifiOff, 
  CheckCircle2, 
  ListX,
  MapPin,
  DollarSign,
  Tag,
  Building2,
  Share2,
  Check,
  CheckCheck,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  ArrowUpRight,
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { jobSearchService, matchFuzzy } from "../services/job-search";
import { parseLocation } from "@/lib/formatters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface SearchVacancy {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string | null;
  companyPhone?: string | null;
  location: string;
  employmentType: string;
  formattedSalary: string;
  isFeatured: boolean;
  category: string;
  description?: string;
  skills?: string[];
  benefits?: string[];
  requirements?: string | null;
  zone?: string;
  modality?: string;
  createdAt?: string;
}

interface JobSearchViewProps {
  initialVacancies?: SearchVacancy[];
  onBack?: () => void;
}

const RECOMMENDED_TAGS = [
  "Recepcionista",
  "Mesero",
  "Cajero",
  "Camarista",
  "Bartender",
  "Playa del Carmen",
  "Mérida",
  "Cancún",
  "Tulum",
  "Tecnología",
  "Administración",
];

const FILTER_LOCATIONS = ["Mérida", "Cancún", "Playa del Carmen", "Tulum", "Chetumal", "Remoto"];
const FILTER_TYPES = ["Tiempo Completo", "Medio Tiempo", "Turno Nocturno", "Por Proyecto", "Prácticas"];
const FILTER_MODALITIES = ["Presencial", "Híbrido", "Remoto"];

export function JobSearchView({ initialVacancies = [], onBack }: JobSearchViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Search input & filter state
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeFilters, setActiveFilters] = React.useState<string[]>([]);
  const [savedJobIds, setSavedJobIds] = React.useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = React.useState<Set<string>>(new Set());
  const [viewLayout, setViewLayout] = React.useState<"list" | "grid">("list");

  // Filter Modal State
  const [isFilterOpen, setIsFilterOpen] = React.useState<boolean>(false);

  // Debounced search trigger
  const [debouncedQuery, setDebouncedQuery] = React.useState<string>("");

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load saved vacancies and applications from Supabase on mount
  React.useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const [{ data: savedData }, { data: appliedData }, { data: profile }] = await Promise.all([
            supabase
              .from("saved_vacancies")
              .select("vacancy_id")
              .eq("candidate_id", user.id),
            supabase
              .from("applications")
              .select("vacancy_id")
              .eq("candidate_id", user.id),
            supabase
              .from("profiles")
              .select("location")
              .eq("id", user.id)
              .maybeSingle()
          ]);

          if (savedData) {
            setSavedJobIds(new Set(savedData.map((r: { vacancy_id: string }) => r.vacancy_id)));
          }

          if (appliedData) {
            setAppliedJobIds(new Set(appliedData.map((a: { vacancy_id: string }) => a.vacancy_id)));
          }

          if (profile?.location) {
            const parsedLoc = parseLocation(profile.location);
            const userCity = parsedLoc.city;
            if (userCity && activeFilters.length === 0) {
              setActiveFilters([userCity]);
            }
          }
        }
      } catch (err) {
        console.error("Error loading candidate preferences:", err);
      }
    }
    loadUserData();
  }, [supabase, activeFilters.length]);

  // TanStack Query for dynamic search
  const { data: vacancies = initialVacancies, isLoading, isError: hasError, refetch } = useQuery({
    queryKey: ['vacancies-search', { query: debouncedQuery, filters: activeFilters }],
    queryFn: async () => {
      if (!debouncedQuery.trim() && activeFilters.length === 0) {
        return initialVacancies;
      }
      return await jobSearchService.searchVacancies({
        query: debouncedQuery,
        activeFilters: activeFilters,
      });
    },
    initialData: initialVacancies,
  });

  // Handle URL query param ?jobId=... by redirecting to dedicated vacancy page
  const urlJobId = searchParams.get("jobId");
  React.useEffect(() => {
    if (urlJobId) {
      router.push(`/dashboard/candidate/vacancies/${urlJobId}`);
    }
  }, [urlJobId, router]);

  const handleOpenDetail = (job: SearchVacancy) => {
    router.push(`/dashboard/candidate/vacancies/${job.id}`);
  };

  // Instant in-memory filter
  const filteredVacancies = React.useMemo(() => {
    return vacancies.filter((vac: SearchVacancy) => {
      const searchableContent = [
        vac.title,
        vac.companyName,
        vac.category,
        vac.location,
        vac.zone || "",
        vac.employmentType,
        vac.modality || "",
        vac.description || "",
        ...(Array.isArray(vac.skills) ? vac.skills : [])
      ].join(" ");

      if (searchQuery.trim() && !matchFuzzy(searchableContent, searchQuery.trim())) {
        return false;
      }

      for (const filterChip of activeFilters) {
        if (filterChip.trim() && !matchFuzzy(searchableContent, filterChip.trim())) {
          return false;
        }
      }

      return true;
    });
  }, [vacancies, searchQuery, activeFilters]);

  // Toggle bookmark
  const toggleBookmark = async (vacancyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Inicia sesión para guardar vacantes.");
        return;
      }

      const isCurrentlySaved = savedJobIds.has(vacancyId);

      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.delete(vacancyId);
        else next.add(vacancyId);
        return next;
      });

      if (isCurrentlySaved) {
        await supabase
          .from("saved_vacancies")
          .delete()
          .eq("candidate_id", user.id)
          .eq("vacancy_id", vacancyId);

        toast.info("Vacante eliminada de tus guardados");
      } else {
        await supabase
          .from("saved_vacancies")
          .insert({
            candidate_id: user.id,
            vacancy_id: vacancyId,
          });

        toast.success("¡Vacante guardada en tus favoritos!");
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      toast.error("Error al actualizar la lista de guardados");
    }
  };

  const handleShareVacancy = (e: React.MouseEvent, job: SearchVacancy) => {
    e.stopPropagation();
    const url = `${window.location.origin}/dashboard/candidate/vacancies/${job.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Enlace copiado al portapapeles");
    } else {
      toast.info(`Enlace: ${url}`);
    }
  };

  const addFilter = (filterText: string) => {
    const clean = filterText.trim();
    if (!clean) return;
    if (!activeFilters.includes(clean)) {
      setActiveFilters((prev) => [...prev, clean]);
    }
  };

  const removeFilter = (filterText: string) => {
    setActiveFilters((prev) => prev.filter((f) => f !== filterText));
  };

  const clearAllSearchAndFilters = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setActiveFilters([]);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const hasSearched = React.useMemo(() => {
    return searchQuery.trim().length > 0 || activeFilters.length > 0;
  }, [searchQuery, activeFilters]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300 font-sans">
      
      {/* 1. Header Search Bar Row */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          aria-label="Regresar"
          className="size-10 bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 rounded-md flex items-center justify-center text-fiord-700 dark:text-fiord-300 hover:bg-fiord-50 dark:hover:bg-fiord-900 transition-all cursor-pointer active:scale-95 shrink-0 shadow-soft"
        >
          <ArrowLeft className="size-4" />
        </button>

        {/* Search Input Box */}
        <div className="flex-1 h-10 bg-white dark:bg-card rounded-md px-3.5 flex items-center gap-2.5 border border-fiord-200 dark:border-fiord-800 shadow-soft focus-within:border-fiord-500 dark:focus-within:border-fiord-400 focus-within:ring-2 focus-within:ring-fiord-400/30 transition-all">
          <Search className="size-4 text-fiord-400 dark:text-fiord-500 shrink-0 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por puesto, empresa, zona o habilidad..."
            className="w-full bg-transparent text-sm font-normal text-fiord-950 dark:text-fiord-50 placeholder:text-fiord-400 dark:placeholder:text-fiord-500 focus:outline-none"
          />
          {searchQuery.length > 0 && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Limpiar búsqueda"
              className="p-1 text-fiord-400 hover:text-fiord-800 dark:hover:text-fiord-200 transition-colors shrink-0 cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Trigger Button */}
        <button
          onClick={() => setIsFilterOpen(true)}
          aria-label="Filtros avanzados"
          className="h-10 px-3.5 bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 rounded-md flex items-center gap-2 text-xs font-semibold text-fiord-800 dark:text-fiord-200 hover:bg-fiord-50 dark:hover:bg-fiord-900 transition-all cursor-pointer active:scale-95 shrink-0 relative shadow-soft"
        >
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilters.length > 0 && (
            <span className="inline-flex items-center justify-center size-5 bg-fiord-950 text-white dark:bg-fiord-100 dark:text-fiord-950 text-[10px] font-bold rounded-full">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* 2. Active Filter Chips Bar */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          <span className="text-xs font-semibold text-fiord-500 dark:text-fiord-400 shrink-0">
            Filtros activos:
          </span>
          {activeFilters.map((filter) => (
            <div
              key={filter}
              className="shrink-0 px-3 py-1 rounded-full flex items-center gap-1.5 bg-fiord-100 dark:bg-fiord-900/60 text-fiord-900 dark:text-fiord-100 border border-fiord-200 dark:border-fiord-800 text-xs font-medium"
            >
              <span>{filter}</span>
              <button
                onClick={() => removeFilter(filter)}
                aria-label={`Remover filtro ${filter}`}
                className="p-0.5 rounded-full hover:bg-fiord-200 dark:hover:bg-fiord-700 transition-colors cursor-pointer text-fiord-600 dark:text-fiord-300"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          <button
            onClick={clearAllSearchAndFilters}
            className="text-xs font-semibold text-fiord-600 hover:text-fiord-950 dark:text-fiord-400 dark:hover:text-fiord-100 underline decoration-fiord-300 underline-offset-2 ml-1 cursor-pointer shrink-0"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* 3. Recommended Tags */}
      {!hasSearched && !isLoading && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-fiord-500 dark:text-fiord-400">
            Búsquedas sugeridas
          </h2>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDED_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => addFilter(tag)}
                className="px-3.5 py-1.5 bg-white dark:bg-card rounded-full border border-fiord-200 dark:border-fiord-800 text-xs font-medium text-fiord-700 dark:text-fiord-300 hover:bg-fiord-50 dark:hover:bg-fiord-900 hover:text-fiord-950 dark:hover:text-fiord-50 transition-all cursor-pointer shadow-2xs"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Results Header (Counter & Layout Switcher) */}
      {!isLoading && !hasError && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm font-semibold text-fiord-950 dark:text-fiord-50">
            {filteredVacancies.length} {filteredVacancies.length === 1 ? "vacante disponible" : "vacantes disponibles"}
          </p>

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
      )}

      {/* 5. Main Results View */}
      <div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-5 bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 rounded-lg flex items-center gap-4 animate-pulse shadow-soft"
              >
                <div className="size-12 rounded-md bg-fiord-100 dark:bg-fiord-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-fiord-100 dark:bg-fiord-800 rounded w-1/3" />
                  <div className="h-3.5 bg-fiord-100 dark:bg-fiord-800 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="py-16 px-6 rounded-lg bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 text-center space-y-3 shadow-soft">
            <WifiOff className="size-10 text-rose-500 mx-auto" />
            <h3 className="text-base font-semibold text-fiord-950 dark:text-fiord-50">
              Error al consultar las vacantes
            </h3>
            <p className="text-xs text-fiord-600 dark:text-fiord-400 max-w-xs mx-auto">
              Revisa tu conexión a internet o intenta nuevamente.
            </p>
            <Button
              onClick={() => refetch()}
              className="h-9 px-4 rounded-md bg-fiord-950 text-white text-xs font-medium hover:bg-fiord-900 gap-2"
            >
              <RotateCw className="size-3.5" />
              Reintentar
            </Button>
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="py-16 px-6 rounded-lg bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 flex flex-col items-center justify-center text-center space-y-4 shadow-soft">
            <div className="size-12 rounded-md bg-fiord-100 dark:bg-fiord-900/60 flex items-center justify-center text-fiord-700 dark:text-fiord-300">
              <SearchX className="size-6" />
            </div>
            
            <div>
              <h3 className="text-base font-semibold text-fiord-950 dark:text-fiord-50">
                {searchQuery.trim()
                  ? `No encontramos vacantes para "${searchQuery}"`
                  : "No se encontraron vacantes con los filtros seleccionados"}
              </h3>
              <p className="text-xs text-fiord-600 dark:text-fiord-400 max-w-sm mt-1">
                Intenta buscar con términos más generales o elimina algunos filtros aplicados.
              </p>
            </div>

            <Button
              onClick={clearAllSearchAndFilters}
              className="h-9 px-4 rounded-md bg-fiord-950 text-white text-xs font-medium hover:bg-fiord-900 dark:bg-fiord-100 dark:text-fiord-950 dark:hover:bg-white gap-2 shadow-sm"
            >
              <ListX className="size-4" />
              Limpiar búsqueda y filtros
            </Button>
          </div>
        ) : (
          <div className={cn(
            viewLayout === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          )}>
            {filteredVacancies.map((job) => {
              const isApplied = appliedJobIds.has(job.id);
              const isSaved = savedJobIds.has(job.id);

              if (viewLayout === "grid") {
                return (
                  <div
                    key={job.id}
                    onClick={() => handleOpenDetail(job)}
                    className="group relative bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 rounded-lg p-5 flex flex-col justify-between shadow-soft hover:shadow-card-hover hover:border-fiord-400 dark:hover:border-fiord-600 transition-all cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {job.isFeatured && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                              <Sparkles className="size-3" />
                              Destacada
                            </span>
                          )}
                          {isApplied && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                              <CheckCheck className="size-3" />
                              Postulado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleShareVacancy(e, job)}
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

                      <div className="flex items-start gap-3">
                        <div className="size-11 rounded-md bg-fiord-50 dark:bg-fiord-900/60 border border-fiord-200 dark:border-fiord-800 flex items-center justify-center text-fiord-900 dark:text-fiord-100 shrink-0 font-semibold text-xs overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                          {job.companyLogo ? (
                            <img src={job.companyLogo} alt={job.companyName} className="size-full object-cover" />
                          ) : (
                            <span>{job.companyName.substring(0, 2).toUpperCase()}</span>
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
                          <span className="truncate max-w-[130px]">{job.location}</span>
                        </span>
                        <span>•</span>
                        <span>{job.employmentType}</span>
                      </div>
                    </div>

                    <div className="pt-3.5 mt-4 border-t border-fiord-100 dark:border-fiord-800 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-fiord-500 dark:text-fiord-400 font-semibold uppercase tracking-wider block">
                          Sueldo mensual
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

              // Standard List Row Card
              return (
                <div
                  key={job.id}
                  onClick={() => handleOpenDetail(job)}
                  className="group bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-soft hover:shadow-card-hover hover:border-fiord-400 dark:hover:border-fiord-600 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="size-12 rounded-md bg-fiord-50 dark:bg-fiord-900/60 border border-fiord-200 dark:border-fiord-800 flex items-center justify-center text-fiord-900 dark:text-fiord-100 shrink-0 font-semibold text-xs overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.companyName} className="size-full object-cover" />
                      ) : (
                        <span>{job.companyName.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-fiord-600 dark:text-fiord-400 truncate flex items-center gap-1">
                          {job.companyName}
                          <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        </span>

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
          </div>
        )}
      </div>

      {/* Filter Modal Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-lg bg-white dark:bg-card border border-fiord-200 dark:border-fiord-800 p-6">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-fiord-100 dark:border-fiord-800">
            <DialogTitle className="text-base font-semibold text-fiord-950 dark:text-fiord-50">
              Filtros avanzados
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-5">
            {/* Location filter */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-fiord-600 dark:text-fiord-400">
                Ubicación / Ciudad
              </h4>
              <div className="flex flex-wrap gap-2">
                {FILTER_LOCATIONS.map((loc) => {
                  const isSel = activeFilters.includes(loc);
                  return (
                    <button
                      key={loc}
                      onClick={() => (isSel ? removeFilter(loc) : addFilter(loc))}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border",
                        isSel
                          ? "bg-fiord-950 text-white border-fiord-950 dark:bg-fiord-100 dark:text-fiord-950 dark:border-fiord-100 shadow-xs"
                          : "bg-fiord-50 dark:bg-fiord-900/40 text-fiord-700 dark:text-fiord-300 border-fiord-200 dark:border-fiord-800 hover:bg-fiord-100"
                      )}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modality filter */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-fiord-600 dark:text-fiord-400">
                Modalidad
              </h4>
              <div className="flex flex-wrap gap-2">
                {FILTER_MODALITIES.map((mod) => {
                  const isSel = activeFilters.includes(mod);
                  return (
                    <button
                      key={mod}
                      onClick={() => (isSel ? removeFilter(mod) : addFilter(mod))}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border",
                        isSel
                          ? "bg-fiord-950 text-white border-fiord-950 dark:bg-fiord-100 dark:text-fiord-950 dark:border-fiord-100 shadow-xs"
                          : "bg-fiord-50 dark:bg-fiord-900/40 text-fiord-700 dark:text-fiord-300 border-fiord-200 dark:border-fiord-800 hover:bg-fiord-100"
                      )}
                    >
                      {mod}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Employment Type */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-fiord-600 dark:text-fiord-400">
                Tipo de Contrato
              </h4>
              <div className="flex flex-wrap gap-2">
                {FILTER_TYPES.map((type) => {
                  const isSel = activeFilters.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => (isSel ? removeFilter(type) : addFilter(type))}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border",
                        isSel
                          ? "bg-fiord-950 text-white border-fiord-950 dark:bg-fiord-100 dark:text-fiord-950 dark:border-fiord-100 shadow-xs"
                          : "bg-fiord-50 dark:bg-fiord-900/40 text-fiord-700 dark:text-fiord-300 border-fiord-200 dark:border-fiord-800 hover:bg-fiord-100"
                      )}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-fiord-100 dark:border-fiord-800">
            <Button
              variant="outline"
              onClick={() => setActiveFilters([])}
              className="flex-1 h-9 rounded-md border-fiord-200 dark:border-fiord-800 text-fiord-700 dark:text-fiord-300 text-xs font-medium"
            >
              Limpiar filtros
            </Button>
            <Button
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 h-9 rounded-md bg-fiord-950 text-white text-xs font-medium hover:bg-fiord-900 dark:bg-fiord-100 dark:text-fiord-950 dark:hover:bg-white"
            >
              Aplicar ({activeFilters.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
