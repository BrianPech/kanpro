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
  Check, 
  ListX 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface SearchVacancy {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string | null;
  location: string;
  employmentType: string;
  formattedSalary: string;
  isFeatured: boolean;
  category: string;
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
  "Tulum",
];

export function JobSearchView({ initialVacancies = [], onBack }: JobSearchViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search input & filter state
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeFilters, setActiveFilters] = React.useState<string[]>([]);
  const [savedJobIds, setSavedJobIds] = React.useState<Set<string>>(new Set());

  // UI state
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [hasError, setHasError] = React.useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = React.useState<boolean>(false);

  // Debounced search trigger
  const [debouncedQuery, setDebouncedQuery] = React.useState<string>("");

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Handle URL param default search
  React.useEffect(() => {
    const initialJobId = searchParams.get("jobId");
    if (initialJobId) {
      // scroll or highlight logic if needed
    }
  }, [searchParams]);

  // Toggle saved vacancy
  const toggleBookmark = (id: string) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Add / remove filter chips
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
    return debouncedQuery.trim().length > 0 || activeFilters.length > 0;
  }, [debouncedQuery, activeFilters]);

  // Filter vacancies matching query and active filters
  const filteredVacancies = React.useMemo(() => {
    return initialVacancies.filter((vac) => {
      const q = debouncedQuery.toLowerCase().trim();
      const matchesQuery = 
        !q || 
        vac.title.toLowerCase().includes(q) ||
        vac.companyName.toLowerCase().includes(q) ||
        vac.location.toLowerCase().includes(q) ||
        vac.category.toLowerCase().includes(q);

      const matchesFilters = activeFilters.every((filter) => {
        const f = filter.toLowerCase();
        return (
          vac.location.toLowerCase().includes(f) ||
          vac.employmentType.toLowerCase().includes(f) ||
          vac.title.toLowerCase().includes(f) ||
          vac.category.toLowerCase().includes(f)
        );
      });

      return matchesQuery && matchesFilters;
    });
  }, [initialVacancies, debouncedQuery, activeFilters]);

  return (
    <div className="flex-grow min-h-full bg-transparent dark:bg-zinc-950 px-5 sm:px-8 lg:px-12 pt-3 pb-24 md:pb-4 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
      
      {/* 1. Header Search Bar Row */}
      <div className="flex items-center gap-3 py-2">
        {/* Back Button Container (48x48, radius 16px, bg white) */}
        <button
          onClick={handleBack}
          aria-label="Regresar"
          className="w-[48px] h-[48px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[16px] flex items-center justify-center text-[#344558] dark:text-zinc-200 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs"
        >
          <ArrowLeft className="w-[20px] h-[20px] stroke-[2.2]" />
        </button>

        {/* Search Input Bar (h-48px, radius 24px, bg white) */}
        <div className="flex-1 h-[48px] bg-white dark:bg-zinc-900 rounded-[24px] px-4 flex items-center gap-2 border border-[#ebeef3] dark:border-zinc-800 shadow-2xs focus-within:border-[#344558] transition-all">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Puesto, empresa o zona..."
            className="w-full bg-transparent text-[14px] font-[600] text-[#1f2732] dark:text-zinc-100 placeholder-[#7d99b3] dark:placeholder-zinc-500 focus:outline-none"
          />
          {searchQuery.length > 0 && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Limpiar búsqueda"
              className="p-1 text-[#7d99b3] hover:text-[#1f2732] dark:hover:text-zinc-200 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Filter Tune Button (48x48, radius 16px, bg white) */}
        <button
          onClick={() => setIsFilterOpen(true)}
          aria-label="Filtros"
          className="w-[48px] h-[48px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[16px] flex items-center justify-center text-[#344558] dark:text-zinc-200 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 shrink-0 relative shadow-2xs"
        >
          <SlidersHorizontal className="w-[22px] h-[22px] stroke-[2]" />
          {activeFilters.length > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>

      {/* 2. Active Filter Chips Bar */}
      {activeFilters.length > 0 && (
        <div className="mt-2 h-[38px] flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          {activeFilters.map((filter, index) => {
            const isPrimary = index === 0;
            return (
              <div
                key={filter}
                className={`shrink-0 px-[14px] h-[32px] rounded-[20px] flex items-center gap-1.5 transition-all ${
                  isPrimary
                    ? "bg-[#1f2732] text-white border border-transparent shadow-xs"
                    : "bg-[#f5f7fa] dark:bg-zinc-900 text-[#344558] dark:text-zinc-200 border border-[#ebeef3] dark:border-zinc-800"
                }`}
              >
                <span className="text-[13px] font-bold tracking-[-0.2px]">
                  {filter}
                </span>
                <button
                  onClick={() => removeFilter(filter)}
                  className={`p-0.5 rounded-full hover:opacity-80 cursor-pointer ${
                    isPrimary ? "text-white/70 hover:text-white" : "text-[#5c7c9b] hover:text-[#1f2732]"
                  }`}
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Recommended Tags (shown initially when no search or filter active) */}
      {!hasSearched && !isLoading && (
        <div className="pt-4 space-y-3">
          <h2 className="text-[16px] font-[800] tracking-[-0.4px] text-[#2f3c4b] dark:text-fiord-50">
            Búsquedas recomendadas
          </h2>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {RECOMMENDED_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  addFilter(tag);
                }}
                className="px-4 py-[10px] bg-white dark:bg-zinc-900 rounded-[20px] border border-[#ebeef3] dark:border-zinc-800 text-[13px] font-[600] text-[#344558] dark:text-zinc-200 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Results Counter Label */}
      {!isLoading && !hasError && hasSearched && (
        <div className="pt-4 pb-2">
          <p className="text-[16px] font-[800] tracking-[-0.3px] text-[#2f3c4b] dark:text-fiord-50">
            {filteredVacancies.length} empleos encontrados
          </p>
        </div>
      )}

      {/* 5. Main Results View / States */}
      <div className="pt-3 space-y-3.5">
        {isLoading ? (
          /* Skeleton Loader */
          <div className="space-y-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[16px] flex items-center gap-3 animate-pulse"
              >
                <div className="w-12 h-12 rounded-[12px] bg-[#ebeef3] dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#ebeef3] dark:bg-zinc-800 rounded w-1/2" />
                  <div className="h-3 bg-[#ebeef3] dark:bg-zinc-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          /* Connection / Database Error Card */
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <WifiOff className="w-10 h-10 text-rose-500" />
            <h3 className="text-[16px] font-bold text-[#1f2732] dark:text-zinc-100">
              Error al consultar la base de datos
            </h3>
            <p className="text-[13px] text-[#5c7c9b] dark:text-zinc-400 max-w-xs leading-relaxed">
              Revisa tu conexión a internet o intenta nuevamente.
            </p>
            <Button
              onClick={() => setIsLoading(false)}
              className="mt-2 bg-[#1f2732] hover:bg-[#2f3c4b] text-white rounded-[12px] text-xs font-bold px-5 py-2.5 flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Reintentar
            </Button>
          </div>
        ) : filteredVacancies.length === 0 && hasSearched ? (
          /* Empty Search Results Card matching exact Flutter Spec & Screenshot */
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#f5f7fa] dark:bg-zinc-900 flex items-center justify-center text-[#7d99b3] shrink-0">
              <SearchX className="w-8 h-8 stroke-[1.75]" />
            </div>
            
            <h3 className="text-[16px] font-bold text-[#1f2732] dark:text-zinc-100 max-w-xs leading-snug">
              {debouncedQuery.trim()
                ? `No encontramos vacantes para "${debouncedQuery}"`
                : "No se encontraron vacantes"}
            </h3>
            <p className="text-[13px] text-[#5c7c9b] dark:text-zinc-400 max-w-xs leading-relaxed">
              Intenta buscar con palabras más generales o elimina algunos filtros aplicados.
            </p>

            <button
              onClick={clearAllSearchAndFilters}
              className="mt-3 px-5 py-3 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#2f3c4b] dark:hover:bg-zinc-200 rounded-[14px] text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ListX className="w-4 h-4 stroke-[2]" />
              Limpiar Búsqueda y Filtros
            </button>
          </div>
        ) : (
          /* Populated Results List */
          <div className="space-y-[14px]">
            {filteredVacancies.map((job) => {
              const isSaved = savedJobIds.has(job.id);
              
              if (job.isFeatured) {
                /* Promoted / Featured Dark Card */
                return (
                  <div
                    key={job.id}
                    onClick={() => router.push(`/dashboard/candidate/discovery?jobId=${job.id}`)}
                    className="p-[18px] bg-[#2f3c4b] dark:bg-fiord-950 text-white rounded-[20px] flex items-center justify-between gap-3 shadow-[0_6px_12px_rgba(31,39,50,0.1)] hover:bg-[#253240] transition-all cursor-pointer"
                  >
                    {/* Left: Icon box */}
                    <div className="w-12 h-12 rounded-[14px] bg-[#344558] flex items-center justify-center text-white shrink-0 font-bold text-xs">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover rounded-[14px]" />
                      ) : (
                        <Briefcase className="w-6 h-6 text-white" />
                      )}
                    </div>

                    {/* Center: Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[15px] font-bold text-white tracking-[-0.3px] truncate">
                        {job.title}
                      </h4>
                      <p className="text-[13px] text-[#aabccf] font-medium truncate mt-0.5">
                        {job.companyName} • {job.location}
                      </p>
                    </div>

                    {/* Right: Bookmark & Salary */}
                    <div className="flex flex-col items-end justify-center shrink-0 gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                        aria-label="Guardar vacante"
                        className="p-1 text-white hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <Bookmark className={`w-5 h-5 ${isSaved ? "fill-amber-400 text-amber-400" : "text-white"}`} />
                      </button>
                      <span className="text-[12px] font-bold text-[#d2dbe5] truncate max-w-[110px]">
                        {job.formattedSalary}
                      </span>
                    </div>
                  </div>
                );
              }

              /* Standard Light Card */
              return (
                <div
                  key={job.id}
                  onClick={() => router.push(`/dashboard/candidate/discovery?jobId=${job.id}`)}
                  className="p-4 bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[16px] flex items-center justify-between gap-3 shadow-2xs hover:bg-[#ebeef3]/50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
                >
                  {/* Left: Icon box */}
                  <div className="w-12 h-12 rounded-[12px] bg-[#ebeef3] dark:bg-zinc-800 text-[#3e546d] dark:text-zinc-300 flex items-center justify-center shrink-0 font-bold text-xs">
                    {job.companyLogo ? (
                      <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover rounded-[12px]" />
                    ) : (
                      <Briefcase className="w-6 h-6 text-[#3e546d]" />
                    )}
                  </div>

                  {/* Center: Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-bold text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px] truncate">
                      {job.title}
                    </h4>
                    <p className="text-[13px] text-[#5c7c9b] font-medium truncate mt-0.5">
                      {job.companyName} • {job.location}
                    </p>
                  </div>

                  {/* Right: Bookmark & Salary */}
                  <div className="flex flex-col items-end justify-center shrink-0 gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                      aria-label="Guardar vacante"
                      className="p-1 text-[#7d99b3] hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Bookmark className={`w-5 h-5 ${isSaved ? "fill-amber-400 text-amber-400" : "text-[#7d99b3]"}`} />
                    </button>
                    <span className="text-[12px] font-bold text-[#3e546d] dark:text-zinc-300 truncate max-w-[110px]">
                      {job.formattedSalary}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Filter Modal Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-t-[28px] sm:rounded-3xl bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-[#ebeef3] dark:border-zinc-800">
            <DialogTitle className="text-[18px] font-[800] text-[#1f2732] dark:text-zinc-50">
              Filtros de Búsqueda
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-5">
            {/* Ubicación Filter Section */}
            <div className="space-y-2">
              <h4 className="text-[14px] font-bold text-[#2f3c4b] dark:text-zinc-200">
                Ubicación
              </h4>
              <div className="flex flex-wrap gap-2">
                {["Playa del Carmen", "Cancún", "Tulum", "Mérida"].map((loc) => {
                  const isSel = activeFilters.includes(loc);
                  return (
                    <button
                      key={loc}
                      onClick={() => (isSel ? removeFilter(loc) : addFilter(loc))}
                      className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isSel
                          ? "bg-[#1f2732] text-white font-bold"
                          : "bg-[#f5f7fa] dark:bg-zinc-800 text-[#344558] dark:text-zinc-300 border border-[#ebeef3] dark:border-zinc-700"
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tipo de Empleo Filter Section */}
            <div className="space-y-2">
              <h4 className="text-[14px] font-bold text-[#2f3c4b] dark:text-zinc-200">
                Tipo de Empleo
              </h4>
              <div className="flex flex-wrap gap-2">
                {["Tiempo Completo", "Medio Tiempo", "Turno Nocturno"].map((type) => {
                  const isSel = activeFilters.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => (isSel ? removeFilter(type) : addFilter(type))}
                      className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isSel
                          ? "bg-[#1f2732] text-white font-bold"
                          : "bg-[#f5f7fa] dark:bg-zinc-800 text-[#344558] dark:text-zinc-300 border border-[#ebeef3] dark:border-zinc-700"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-[#ebeef3] dark:border-zinc-800">
            <Button
              variant="outline"
              onClick={() => setActiveFilters([])}
              className="flex-1 h-11 rounded-[14px] border-[#ebeef3] dark:border-zinc-700 text-[#1f2732] dark:text-zinc-200 font-bold text-xs"
            >
              Limpiar
            </Button>
            <Button
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 h-11 rounded-[14px] bg-[#1f2732] hover:bg-[#2f3c4b] text-white font-bold text-xs"
            >
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
