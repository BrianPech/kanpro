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
    <div className="flex-grow min-h-full bg-transparent dark:bg-zinc-950 px-6 sm:px-10 lg:px-14 pt-4 pb-28 md:pb-8 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      
      {/* 1. Header Search Bar Row */}
      <div className="flex items-center gap-3.5 py-2">
        {/* Back Button Container (54x54, radius 18px, bg white) */}
        <button
          onClick={handleBack}
          aria-label="Regresar"
          className="w-[54px] h-[54px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[18px] flex items-center justify-center text-[#344558] dark:text-zinc-200 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs"
        >
          <ArrowLeft className="w-[22px] h-[22px] stroke-[2.4]" />
        </button>

        {/* Search Input Bar (h-54px, radius 27px, bg white) */}
        <div className="flex-1 h-[54px] bg-white dark:bg-zinc-900 rounded-[27px] px-5 flex items-center gap-3 border border-[#ebeef3] dark:border-zinc-800 shadow-2xs focus-within:border-[#344558] dark:focus-within:border-zinc-400 transition-all">
          <Search className="w-5 h-5 text-[#7d99b3] dark:text-zinc-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Puesto, empresa o zona..."
            className="w-full bg-transparent text-[15px] sm:text-[16px] font-[600] text-[#1f2732] dark:text-zinc-100 placeholder-[#7d99b3] dark:placeholder-zinc-500 focus:outline-none"
          />
          {searchQuery.length > 0 && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Limpiar búsqueda"
              className="p-1.5 text-[#7d99b3] hover:text-[#1f2732] dark:hover:text-zinc-200 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Filter Tune Button (54x54, radius 18px, bg white) */}
        <button
          onClick={() => setIsFilterOpen(true)}
          aria-label="Filtros"
          className="w-[54px] h-[54px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[18px] flex items-center justify-center text-[#344558] dark:text-zinc-200 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 shrink-0 relative shadow-2xs"
        >
          <SlidersHorizontal className="w-[24px] h-[24px] stroke-[2]" />
          {activeFilters.length > 0 && (
            <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-zinc-900" />
          )}
        </button>
      </div>

      {/* 2. Active Filter Chips Bar */}
      {activeFilters.length > 0 && (
        <div className="mt-3 h-[44px] flex items-center gap-2.5 overflow-x-auto hide-scrollbar pb-1">
          {activeFilters.map((filter, index) => {
            const isPrimary = index === 0;
            return (
              <div
                key={filter}
                className={`shrink-0 px-4 h-[36px] rounded-[22px] flex items-center gap-2 transition-all ${
                  isPrimary
                    ? "bg-[#1f2732] text-white border border-transparent shadow-xs"
                    : "bg-[#f5f7fa] dark:bg-zinc-900 text-[#344558] dark:text-zinc-200 border border-[#ebeef3] dark:border-zinc-800"
                }`}
              >
                <span className="text-[14px] font-extrabold tracking-[-0.2px]">
                  {filter}
                </span>
                <button
                  onClick={() => removeFilter(filter)}
                  className={`p-0.5 rounded-full hover:opacity-80 cursor-pointer ${
                    isPrimary ? "text-white/80 hover:text-white" : "text-[#5c7c9b] hover:text-[#1f2732]"
                  }`}
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Recommended Tags (shown initially when no search or filter active) */}
      {!hasSearched && !isLoading && (
        <div className="pt-6 space-y-4">
          <h2 className="text-[18px] sm:text-[20px] font-[800] tracking-[-0.4px] text-[#2f3c4b] dark:text-fiord-50">
            Búsquedas recomendadas
          </h2>
          <div className="flex flex-wrap gap-3 pt-1">
            {RECOMMENDED_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  addFilter(tag);
                }}
                className="px-5 py-3 bg-white dark:bg-zinc-900 rounded-[22px] border border-[#ebeef3] dark:border-zinc-800 text-[14px] font-[700] text-[#344558] dark:text-zinc-200 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Results Counter Label */}
      {!isLoading && !hasError && hasSearched && (
        <div className="pt-6 pb-2">
          <p className="text-[18px] sm:text-[20px] font-[800] tracking-[-0.3px] text-[#2f3c4b] dark:text-fiord-50">
            {filteredVacancies.length} empleos encontrados
          </p>
        </div>
      )}

      {/* 5. Main Results View / States */}
      <div className="pt-4 space-y-4">
        {isLoading ? (
          /* Skeleton Loader */
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-5 bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[20px] flex items-center gap-4 animate-pulse"
              >
                <div className="w-14 h-14 rounded-[14px] bg-[#ebeef3] dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-[#ebeef3] dark:bg-zinc-800 rounded w-1/2" />
                  <div className="h-4 bg-[#ebeef3] dark:bg-zinc-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          /* Connection / Database Error Card */
          <div className="py-14 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <WifiOff className="w-12 h-12 text-rose-500" />
            <h3 className="text-[18px] font-bold text-[#1f2732] dark:text-zinc-100">
              Error al consultar la base de datos
            </h3>
            <p className="text-[15px] text-[#5c7c9b] dark:text-zinc-400 max-w-xs leading-relaxed">
              Revisa tu conexión a internet o intenta nuevamente.
            </p>
            <Button
              onClick={() => setIsLoading(false)}
              className="mt-2 bg-[#1f2732] hover:bg-[#2f3c4b] text-white rounded-[14px] text-sm font-bold px-6 py-3 flex items-center gap-2"
            >
              <RotateCw className="w-5 h-5" />
              Reintentar
            </Button>
          </div>
        ) : filteredVacancies.length === 0 && hasSearched ? (
          /* Empty Search Results Card matching exact Flutter Spec & Screenshot */
          <div className="py-14 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-18 h-18 rounded-full bg-[#f5f7fa] dark:bg-zinc-900 flex items-center justify-center text-[#7d99b3] shrink-0">
              <SearchX className="w-9 h-9 stroke-[1.75]" />
            </div>
            
            <h3 className="text-[18px] font-bold text-[#1f2732] dark:text-zinc-100 max-w-sm leading-snug">
              {debouncedQuery.trim()
                ? `No encontramos vacantes para "${debouncedQuery}"`
                : "No se encontraron vacantes"}
            </h3>
            <p className="text-[15px] text-[#5c7c9b] dark:text-zinc-400 max-w-sm leading-relaxed">
              Intenta buscar con palabras más generales o elimina algunos filtros aplicados.
            </p>

            <button
              onClick={clearAllSearchAndFilters}
              className="mt-4 px-6 py-3.5 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#2f3c4b] dark:hover:bg-zinc-200 rounded-[16px] text-sm font-bold flex items-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ListX className="w-5 h-5 stroke-[2]" />
              Limpiar Búsqueda y Filtros
            </button>
          </div>
        ) : (
          /* Populated Results List */
          <div className="space-y-4">
            {filteredVacancies.map((job) => {
              const isSaved = savedJobIds.has(job.id);
              
              if (job.isFeatured) {
                /* Promoted / Featured Dark Card */
                return (
                  <div
                    key={job.id}
                    onClick={() => router.push(`/dashboard/candidate/discovery?jobId=${job.id}`)}
                    className="p-5 sm:p-6 bg-[#2f3c4b] dark:bg-fiord-950 text-white rounded-[22px] flex items-center justify-between gap-4 shadow-[0_8px_16px_rgba(31,39,50,0.12)] hover:bg-[#253240] transition-all cursor-pointer"
                  >
                    {/* Left: Icon box */}
                    <div className="w-14 h-14 rounded-[14px] bg-[#344558] flex items-center justify-center text-white shrink-0 font-bold text-sm">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover rounded-[14px]" />
                      ) : (
                        <Briefcase className="w-7 h-7 text-white" />
                      )}
                    </div>

                    {/* Center: Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[17px] sm:text-[19px] font-bold text-white tracking-[-0.3px] truncate">
                        {job.title}
                      </h4>
                      <p className="text-[14px] text-[#aabccf] font-semibold truncate mt-1">
                        {job.companyName} • {job.location}
                      </p>
                    </div>

                    {/* Right: Bookmark & Salary */}
                    <div className="flex flex-col items-end justify-center shrink-0 gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                        aria-label="Guardar vacante"
                        className="p-1.5 text-white hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <Bookmark className={`w-6 h-6 ${isSaved ? "fill-amber-400 text-amber-400" : "text-white"}`} />
                      </button>
                      <span className="text-[13px] sm:text-[14px] font-extrabold text-[#d2dbe5] truncate max-w-[130px]">
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
                  className="p-5 sm:p-6 bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[20px] flex items-center justify-between gap-4 shadow-2xs hover:bg-[#ebeef3]/60 dark:hover:bg-zinc-800/60 transition-all cursor-pointer"
                >
                  {/* Left: Icon box */}
                  <div className="w-14 h-14 rounded-[14px] bg-[#ebeef3] dark:bg-zinc-800 text-[#3e546d] dark:text-zinc-300 flex items-center justify-center shrink-0 font-bold text-sm">
                    {job.companyLogo ? (
                      <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover rounded-[14px]" />
                    ) : (
                      <Briefcase className="w-7 h-7 text-[#3e546d] dark:text-zinc-300" />
                    )}
                  </div>

                  {/* Center: Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[17px] sm:text-[19px] font-bold text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px] truncate">
                      {job.title}
                    </h4>
                    <p className="text-[14px] text-[#5c7c9b] dark:text-zinc-400 font-semibold truncate mt-1">
                      {job.companyName} • {job.location}
                    </p>
                  </div>

                  {/* Right: Bookmark & Salary */}
                  <div className="flex flex-col items-end justify-center shrink-0 gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                      aria-label="Guardar vacante"
                      className="p-1.5 text-[#7d99b3] hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Bookmark className={`w-6 h-6 ${isSaved ? "fill-amber-400 text-amber-400" : "text-[#7d99b3]"}`} />
                    </button>
                    <span className="text-[13px] sm:text-[14px] font-extrabold text-[#3e546d] dark:text-zinc-300 truncate max-w-[130px]">
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
        <DialogContent className="sm:max-w-[460px] rounded-t-[32px] sm:rounded-3xl bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 sm:p-8">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#ebeef3] dark:border-zinc-800">
            <DialogTitle className="text-[20px] font-[800] text-[#1f2732] dark:text-zinc-50">
              Filtros de Búsqueda
            </DialogTitle>
          </DialogHeader>

          <div className="py-5 space-y-6">
            {/* Ubicación Filter Section */}
            <div className="space-y-3">
              <h4 className="text-[16px] font-bold text-[#2f3c4b] dark:text-zinc-200">
                Ubicación
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {["Playa del Carmen", "Cancún", "Tulum", "Mérida"].map((loc) => {
                  const isSel = activeFilters.includes(loc);
                  return (
                    <button
                      key={loc}
                      onClick={() => (isSel ? removeFilter(loc) : addFilter(loc))}
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                        isSel
                          ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold shadow-xs"
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
            <div className="space-y-3">
              <h4 className="text-[16px] font-bold text-[#2f3c4b] dark:text-zinc-200">
                Tipo de Empleo
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {["Tiempo Completo", "Medio Tiempo", "Turno Nocturno"].map((type) => {
                  const isSel = activeFilters.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => (isSel ? removeFilter(type) : addFilter(type))}
                      className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                        isSel
                          ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold shadow-xs"
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

          <div className="flex items-center gap-3 pt-4 border-t border-[#ebeef3] dark:border-zinc-800">
            <Button
              variant="outline"
              onClick={() => setActiveFilters([])}
              className="flex-1 h-12 rounded-[16px] border-[#ebeef3] dark:border-zinc-700 text-[#1f2732] dark:text-zinc-200 font-bold text-sm cursor-pointer"
            >
              Limpiar
            </Button>
            <Button
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 h-12 rounded-[16px] bg-[#1f2732] dark:bg-zinc-100 hover:bg-[#2f3c4b] dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-sm cursor-pointer"
            >
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
