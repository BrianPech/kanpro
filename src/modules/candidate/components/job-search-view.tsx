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
  ArrowUpRight,
  ShieldCheck,
  Star,
  Users,
  Send,
  Loader2,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { jobSearchService, matchFuzzy } from "../services/job-search";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Strips HTML tags and excessive markdown artifacts to produce a clean plain-text excerpt for cards.
 */
export function stripHtmlAndMarkdown(content?: string | null): string {
  if (!content) return "";
  return content
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/[#*_~`>[\]()!]/g, "") // Remove common markdown syntax characters
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

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
const FILTER_MODALITIES = ["Presencial", "Híbrido", "Remoto"];
const FILTER_TYPES = ["Tiempo Completo", "Medio Tiempo", "Turno Nocturno", "Por Proyecto", "Prácticas"];
const FILTER_CATEGORIES = ["Hotelería y Turismo", "Alimentos y Bebidas", "Administración", "Tecnología", "Ventas y Atención", "Operaciones"];

export function JobSearchView({ initialVacancies = [], onBack }: JobSearchViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Search input & filter state
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeFilters, setActiveFilters] = React.useState<string[]>([]);
  const [savedJobIds, setSavedJobIds] = React.useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = React.useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = React.useState<"recent" | "salary" | "featured">("recent");

  // Selected vacancy in the 2-column view
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);

  // Mobile detail dialog state
  const [mobileDetailOpen, setMobileDetailOpen] = React.useState<boolean>(false);

  // Filter Modal State
  const [isFilterOpen, setIsFilterOpen] = React.useState<boolean>(false);

  // Action states
  const [isApplying, setIsApplying] = React.useState<boolean>(false);

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
          const [{ data: savedData }, { data: appliedData }] = await Promise.all([
            supabase
              .from("saved_vacancies")
              .select("vacancy_id")
              .eq("candidate_id", user.id),
            supabase
              .from("applications")
              .select("vacancy_id")
              .eq("candidate_id", user.id),
          ]);

          if (savedData) {
            setSavedJobIds(new Set(savedData.map((r: { vacancy_id: string }) => r.vacancy_id)));
          }

          if (appliedData) {
            setAppliedJobIds(new Set(appliedData.map((a: { vacancy_id: string }) => a.vacancy_id)));
          }
        }
      } catch (err) {
        console.error("Error loading candidate preferences:", err);
      }
    }
    loadUserData();
  }, [supabase]);

  // TanStack Query for dynamic search & vacancies feed
  const { data: vacancies = initialVacancies, isLoading, isError: hasError, refetch } = useQuery({
    queryKey: ['candidate-vacancies-feed'],
    queryFn: async () => {
      return await jobSearchService.searchVacancies({});
    },
    initialData: initialVacancies.length > 0 ? initialVacancies : undefined,
  });

  // Handle URL query param ?jobId=...
  const urlJobId = searchParams.get("jobId");
  React.useEffect(() => {
    if (urlJobId) {
      setSelectedJobId(urlJobId);
    }
  }, [urlJobId]);

  // Instant in-memory filter & sort
  const filteredVacancies = React.useMemo(() => {
    const list = vacancies.filter((vac: SearchVacancy) => {
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

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === "featured") {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
      }
      if (sortBy === "recent" && a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [vacancies, searchQuery, activeFilters, sortBy]);

  // Sync selected job with the first result if none or invalid
  React.useEffect(() => {
    if (filteredVacancies.length > 0) {
      if (!selectedJobId || !filteredVacancies.some((v) => v.id === selectedJobId)) {
        setSelectedJobId(filteredVacancies[0].id);
      }
    } else {
      setSelectedJobId(null);
    }
  }, [filteredVacancies, selectedJobId]);

  const selectedJob = React.useMemo(() => {
    return filteredVacancies.find((v) => v.id === selectedJobId) || filteredVacancies[0] || null;
  }, [filteredVacancies, selectedJobId]);

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

  // Handle Apply to Vacancy
  const handleApplyToJob = async (job: SearchVacancy) => {
    if (appliedJobIds.has(job.id) || isApplying) return;

    try {
      setIsApplying(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Inicia sesión para postularte a esta vacante");
        return;
      }

      const { error } = await supabase
        .from("applications")
        .insert({
          candidate_id: user.id,
          vacancy_id: job.id,
          status: "Pendiente"
        });

      if (error) {
        if (error.code === "23505") {
          setAppliedJobIds((prev) => new Set([...prev, job.id]));
          toast.info("Ya te has postulado a esta vacante");
          return;
        }
        throw error;
      }

      setAppliedJobIds((prev) => new Set([...prev, job.id]));
      toast.success("¡Postulación enviada exitosamente!", {
        description: `Tu postulación ha sido enviada a ${job.companyName}.`
      });
    } catch (err: any) {
      console.error("Error applying to vacancy:", err);
      toast.error("No se pudo completar la postulación", {
        description: err.message || "Intenta nuevamente."
      });
    } finally {
      setIsApplying(false);
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

  const handleCardClick = (job: SearchVacancy) => {
    setSelectedJobId(job.id);
    // On small screens, open the mobile modal
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileDetailOpen(true);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-200">
      
      {/* 1. Header Search Bar Row */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handleBack}
          aria-label="Regresar"
          className="size-10 rounded-xl border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground shrink-0 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="size-4" />
        </Button>

        {/* Search Input Box with Shadcn/UI Tokens */}
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por puesto, empresa, zona o habilidad..."
            className="h-10 rounded-xl bg-background border-border/70 pl-10 pr-9 text-xs sm:text-sm placeholder:text-muted-foreground shadow-2xs focus-visible:ring-primary/20"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Trigger Button */}
        <Button
          variant="outline"
          onClick={() => setIsFilterOpen(true)}
          aria-label="Filtros avanzados"
          className="h-10 px-3.5 rounded-xl border-border/70 hover:bg-muted/50 text-xs font-medium gap-2 shrink-0 shadow-2xs cursor-pointer"
        >
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilters.length > 0 && (
            <Badge
              variant="default"
              className="size-5 p-0 flex items-center justify-center rounded-full text-[10px] font-bold"
            >
              {activeFilters.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* 2. Active Filter Chips Bar */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          <span className="text-xs font-medium text-muted-foreground shrink-0">
            Filtros activos:
          </span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="shrink-0 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-medium bg-secondary text-secondary-foreground border border-border/60"
            >
              <span>{filter}</span>
              <button
                type="button"
                onClick={() => removeFilter(filter)}
                aria-label={`Remover filtro ${filter}`}
                className="p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <button
            type="button"
            onClick={clearAllSearchAndFilters}
            className="text-xs font-medium text-primary hover:underline underline-offset-4 ml-1 cursor-pointer shrink-0"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* 3. Recommended Tags */}
      {!hasSearched && !isLoading && (
        <div className="space-y-2.5">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-0.5">
            Búsquedas sugeridas
          </h2>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDED_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                onClick={() => addFilter(tag)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-card hover:bg-accent hover:text-accent-foreground border-border/60 transition-all cursor-pointer shadow-2xs select-none"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 4. Main 2-Column Split View (Left: Cards List | Right: Selected Vacancy Detail) */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-5 bg-card border border-border/60 rounded-2xl flex items-center gap-4 animate-pulse shadow-xs"
                >
                  <Skeleton className="size-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3 rounded-md" />
                    <Skeleton className="h-3.5 w-1/4 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden lg:block lg:col-span-7">
              <Skeleton className="h-[480px] w-full rounded-3xl" />
            </div>
          </div>
        ) : hasError ? (
          <div className="py-16 px-6 rounded-2xl bg-card border border-border/60 text-center space-y-3 shadow-xs">
            <WifiOff className="size-10 text-destructive mx-auto" />
            <h3 className="text-base font-semibold text-foreground">
              Error al consultar las vacantes
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Revisa tu conexión a internet o intenta nuevamente.
            </p>
            <Button
              onClick={() => refetch()}
              size="sm"
              className="rounded-xl text-xs font-medium gap-2 cursor-pointer"
            >
              <RotateCw className="size-3.5" />
              Reintentar
            </Button>
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="py-16 px-6 rounded-2xl bg-card border border-border/60 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
            <div className="size-12 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <SearchX className="size-6" />
            </div>
            
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {searchQuery.trim()
                  ? `No encontramos vacantes para "${searchQuery}"`
                  : "No se encontraron vacantes con los filtros seleccionados"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Intenta buscar con términos más generales o elimina algunos filtros aplicados.
              </p>
            </div>

            <Button
              onClick={clearAllSearchAndFilters}
              size="sm"
              className="rounded-xl text-xs font-medium gap-2 shadow-xs cursor-pointer"
            >
              <ListX className="size-4" />
              Limpiar búsqueda y filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Vacancies Cards (Ref. Image 1) */}
            <div className="lg:col-span-5 space-y-3.5">
              
              {/* Header: Title + Sort Control */}
              <div className="flex items-center justify-between px-1 pb-1">
                <div>
                  <h2 className="text-sm font-bold text-foreground truncate max-w-[220px]">
                    {searchQuery ? `Resultados de "${searchQuery}"` : "Vacantes Disponibles"}
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    {filteredVacancies.length} {filteredVacancies.length === 1 ? "vacante disponible" : "vacantes disponibles"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border/70 rounded-xl px-2.5 py-1.5 shadow-2xs">
                  <span className="hidden sm:inline">Ordenar:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent font-medium text-foreground text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="recent">Más recientes</option>
                    <option value="salary">Mayor sueldo</option>
                    <option value="featured">Destacadas</option>
                  </select>
                </div>
              </div>

              {/* Cards List with Scrollable Container on Desktop */}
              <div className="space-y-3 lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto pr-1 lg:pr-1.5 hide-scrollbar">
                {filteredVacancies.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  const isSaved = savedJobIds.has(job.id);
                  const isApplied = appliedJobIds.has(job.id);
                  const companyInitials = job.companyName ? job.companyName.substring(0, 2).toUpperCase() : "EM";

                  return (
                    <div
                      key={job.id}
                      onClick={() => handleCardClick(job)}
                      className={cn(
                        "rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer relative bg-card shadow-xs",
                        isSelected
                          ? "border-2 border-primary ring-2 ring-primary/15 bg-primary/[0.02] shadow-sm"
                          : "border border-border/70 hover:border-border hover:shadow-xs"
                      )}
                    >
                      {/* Top Row: Logo, Title with Sparkle, Bookmark & Summary */}
                      <div className="flex items-start gap-3.5">
                        {/* Company Logo Square */}
                        <Avatar className="size-12 rounded-2xl ring-1 ring-border/60 shrink-0 shadow-2xs">
                          {job.companyLogo ? (
                            <AvatarImage src={job.companyLogo} alt={job.companyName} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="rounded-2xl font-bold text-xs bg-muted text-foreground">
                            {companyInitials}
                          </AvatarFallback>
                        </Avatar>

                        {/* Title & Description Excerpt */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight truncate">
                                {job.title}
                              </h3>
                              <Sparkles className="size-3.5 text-primary fill-primary shrink-0" />
                            </div>

                            {/* Bookmark Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(job.id);
                              }}
                              aria-label={isSaved ? `Remover ${job.title} de guardados` : `Guardar ${job.title}`}
                              className="text-muted-foreground hover:text-amber-500 dark:hover:text-amber-400 p-1 rounded-md hover:bg-muted transition-colors cursor-pointer shrink-0"
                            >
                              <Bookmark
                                className={cn(
                                  "size-4 transition-transform active:scale-90",
                                  isSaved ? "fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" : ""
                                )}
                              />
                            </button>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
                            {stripHtmlAndMarkdown(job.description) || "Vacante activa para incorporarse al equipo de trabajo de forma inmediata."}
                          </p>
                        </div>
                      </div>

                      {/* Dashed Separator matching Reference 1 */}
                      <div className="border-t border-dashed border-border/60 my-3.5" />

                      {/* Bottom Row Stats (Rating/Trust, Applicants/Type, Verified Badge) */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground gap-2 pt-0.5">
                        <div className="flex items-center gap-1 font-medium text-foreground">
                          <Star className="size-3.5 text-amber-500 fill-amber-500 shrink-0" />
                          <span className="text-[11px] font-semibold font-mono">{job.formattedSalary}</span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium truncate">
                          <Users className="size-3 text-muted-foreground shrink-0" />
                          <span>{job.employmentType}</span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-semibold text-primary shrink-0">
                          <CheckCircle2 className="size-3.5 text-primary fill-primary/10 shrink-0" />
                          <span className="hidden sm:inline">Empresa Verificada</span>
                          <span className="sm:hidden">Verificada</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Selected Vacancy Detail (Ref. Image 2) */}
            <div className="hidden lg:block lg:col-span-7 sticky top-16">
              {selectedJob ? (
                <Card className="rounded-3xl border-border/70 bg-card p-6 sm:p-8 shadow-sm overflow-hidden space-y-6 min-h-[640px] max-h-[calc(100vh-130px)] overflow-y-auto hide-scrollbar">
                  
                  {/* 1. Header: Logo, Title with Sparkle, Subtitle & Action CTAs */}
                  <div className="flex items-start justify-between gap-4 pb-5 border-b border-border/60">
                    <div className="flex items-start gap-4 min-w-0">
                      <Avatar className="size-14 sm:size-16 rounded-2xl ring-1 ring-border/60 shrink-0 shadow-2xs">
                        {selectedJob.companyLogo ? (
                          <AvatarImage src={selectedJob.companyLogo} alt={selectedJob.companyName} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="rounded-2xl font-bold text-lg bg-muted text-foreground">
                          {selectedJob.companyName ? selectedJob.companyName.substring(0, 2).toUpperCase() : "EM"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 space-y-1">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2 tracking-tight">
                          <span>{selectedJob.title}</span>
                          <Sparkles className="size-4 text-primary fill-primary shrink-0" />
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{selectedJob.companyName}</span>
                          <span>•</span>
                          <span>{selectedJob.location}</span>
                          <span>•</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{selectedJob.formattedSalary}</span>
                        </p>
                      </div>
                    </div>

                    {/* Top Right Action CTAs matching Reference 2 */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant={appliedJobIds.has(selectedJob.id) ? "secondary" : "default"}
                        size="sm"
                        disabled={appliedJobIds.has(selectedJob.id) || isApplying}
                        onClick={() => handleApplyToJob(selectedJob)}
                        className={cn(
                          "h-9 px-4 rounded-xl text-xs font-semibold gap-1.5 shadow-xs cursor-pointer",
                          appliedJobIds.has(selectedJob.id) && "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                        )}
                      >
                        {isApplying ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : appliedJobIds.has(selectedJob.id) ? (
                          <>
                            <CheckCheck className="size-3.5" />
                            Postulado
                          </>
                        ) : (
                          <>
                            <Send className="size-3.5" />
                            Postularme
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleBookmark(selectedJob.id)}
                        className="h-9 px-3 rounded-xl text-xs font-medium gap-1.5 border-border/70 hover:bg-muted cursor-pointer shadow-2xs"
                      >
                        <Bookmark
                          className={cn(
                            "size-3.5",
                            savedJobIds.has(selectedJob.id) ? "fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" : "text-muted-foreground"
                          )}
                        />
                        <span>{savedJobIds.has(selectedJob.id) ? "Guardado" : "Guardar"}</span>
                      </Button>
                    </div>
                  </div>

                  {/* 2. Job Overview / Descripción del Puesto */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <span>Descripción del Puesto</span>
                      <Sparkles className="size-3.5 text-primary fill-primary" />
                    </h3>
                    <MarkdownRenderer
                      content={selectedJob.description || "Esta posición ofrece una excelente oportunidad de desarrollo profesional dentro de una empresa verificada en la región. Se busca un perfil comprometido y con vocación de servicio."}
                      className="text-xs sm:text-sm text-muted-foreground leading-relaxed"
                    />
                  </div>

                  {/* 3. What You Will Do / ¿Qué harás en este puesto? */}
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <span>¿Qué harás en este puesto?</span>
                      <Sparkles className="size-3.5 text-primary fill-primary" />
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-xs sm:text-sm text-foreground/90">
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>Ejecución de actividades operativas y de atención correspondientes al área de {selectedJob.category}.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs sm:text-sm text-foreground/90">
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>Colaboración en equipo y cumplimiento de estándares de calidad y servicio en {selectedJob.location}.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs sm:text-sm text-foreground/90">
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>Seguimiento de lineamientos internos y reporte directo a supervisores de área.</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Requirements / Requisitos y Habilidades */}
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <span>Requisitos y Habilidades</span>
                      <Sparkles className="size-3.5 text-primary fill-primary" />
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedJob.skills) && selectedJob.skills.length > 0 ? (
                        selectedJob.skills.map((sk) => (
                          <Badge key={sk} variant="secondary" className="px-2.5 py-1 text-xs font-medium bg-muted/60 text-foreground border-border/60">
                            {sk}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Disponibilidad de horario, actitud proactiva y responsabilidad.</span>
                      )}
                    </div>
                    {selectedJob.requirements && (
                      <MarkdownRenderer
                        content={selectedJob.requirements}
                        className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1"
                      />
                    )}
                  </div>

                  {/* 5. Benefits / Beneficios (If present) */}
                  {Array.isArray(selectedJob.benefits) && selectedJob.benefits.length > 0 && (
                    <div className="space-y-2.5">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <span>Beneficios y Prestaciones</span>
                        <Sparkles className="size-3.5 text-primary fill-primary" />
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.benefits.map((ben) => (
                          <Badge key={ben} variant="outline" className="px-2.5 py-1 text-xs font-medium border-primary/20 text-primary bg-primary/5">
                            ✓ {ben}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. About Company / Sobre la Empresa */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <span>Sobre {selectedJob.companyName}</span>
                        <Sparkles className="size-3.5 text-primary fill-primary" />
                      </h3>
                      <Badge variant="outline" className="gap-1 text-[11px] text-primary border-primary/30">
                        <ShieldCheck className="size-3" /> Verificada
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Empresa empleadora registrada en K&apos;anPro México. Todas las contrataciones se realizan bajo el marco legal y con garantía de protección de datos personales.
                    </p>
                  </div>

                </Card>
              ) : null}
            </div>

          </div>
        )}
      </div>

      {/* Mobile Vacancy Detail Dialog (< lg screens) */}
      {selectedJob && (
        <Dialog open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
          <DialogContent className="lg:hidden sm:max-w-lg rounded-3xl bg-card border-border p-5 sm:p-6 space-y-4 max-h-[88vh] overflow-y-auto">
            <DialogHeader className="pb-3 border-b border-border/60 text-left">
              <div className="flex items-start gap-3">
                <Avatar className="size-12 rounded-2xl ring-1 ring-border/60 shrink-0">
                  {selectedJob.companyLogo ? (
                    <AvatarImage src={selectedJob.companyLogo} alt={selectedJob.companyName} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="rounded-2xl font-bold text-xs bg-muted text-foreground">
                    {selectedJob.companyName ? selectedJob.companyName.substring(0, 2).toUpperCase() : "EM"}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-1.5 tracking-tight">
                    <span>{selectedJob.title}</span>
                    <Sparkles className="size-3.5 text-primary fill-primary shrink-0" />
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    {selectedJob.companyName} • {selectedJob.location}
                  </p>
                  <p className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedJob.formattedSalary}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>Descripción del Puesto</span>
                  <Sparkles className="size-3 text-primary" />
                </h4>
                <MarkdownRenderer
                  content={selectedJob.description || "Vacante disponible para incorporación inmediata."}
                  className="text-xs text-muted-foreground leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>¿Qué harás en este puesto?</span>
                  <Sparkles className="size-3 text-primary" />
                </h4>
                <div className="space-y-1.5 text-xs text-foreground/90">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Actividades operativas y de servicio en el área de {selectedJob.category}.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Cumplimiento de estándares de calidad y atención al cliente.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span>Requisitos</span>
                  <Sparkles className="size-3 text-primary" />
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(selectedJob.skills) && selectedJob.skills.length > 0 ? (
                    selectedJob.skills.map((sk) => (
                      <Badge key={sk} variant="secondary" className="text-[11px] py-0.5 px-2">
                        {sk}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Disponibilidad y proactividad.</span>
                  )}
                </div>
                {selectedJob.requirements && (
                  <MarkdownRenderer
                    content={selectedJob.requirements}
                    className="text-xs text-muted-foreground leading-relaxed mt-1"
                  />
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center gap-2">
              <Button
                variant={appliedJobIds.has(selectedJob.id) ? "secondary" : "default"}
                disabled={appliedJobIds.has(selectedJob.id) || isApplying}
                onClick={() => handleApplyToJob(selectedJob)}
                className="flex-1 h-9 rounded-xl text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
              >
                {isApplying ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : appliedJobIds.has(selectedJob.id) ? (
                  <>
                    <CheckCheck className="size-3.5" />
                    Postulado
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    Postularme
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleBookmark(selectedJob.id)}
                className="h-9 px-3 rounded-xl text-xs font-medium gap-1 border-border/70 hover:bg-muted cursor-pointer"
              >
                <Bookmark
                  className={cn(
                    "size-3.5",
                    savedJobIds.has(selectedJob.id) ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
                  )}
                />
                <span>{savedJobIds.has(selectedJob.id) ? "Guardado" : "Guardar"}</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Filter Slide-out Sheet */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col h-full bg-card border-l border-border/80 shadow-2xl"
        >
          <SheetHeader className="p-5 sm:p-6 pb-4 border-b border-border/60 space-y-1 text-left">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              <SheetTitle className="text-base sm:text-lg font-bold text-foreground">
                Filtros de Búsqueda
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              Ajusta las opciones para descubrir vacantes que se adapten a tu perfil.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Filter Categories */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* 1. Location filter */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Ubicación / Ciudad
                  </h4>
                </div>
                {FILTER_LOCATIONS.some((loc) => activeFilters.includes(loc)) && (
                  <span className="text-[10px] font-semibold text-primary">
                    {FILTER_LOCATIONS.filter((loc) => activeFilters.includes(loc)).length} seleccionados
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTER_LOCATIONS.map((loc) => {
                  const isSel = activeFilters.includes(loc);
                  return (
                    <Badge
                      key={loc}
                      variant={isSel ? "default" : "outline"}
                      onClick={() => (isSel ? removeFilter(loc) : addFilter(loc))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shadow-2xs select-none gap-1",
                        isSel
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-background hover:bg-muted/60 text-foreground border-border/70"
                      )}
                    >
                      {isSel && <Check className="size-3" />}
                      <span>{loc}</span>
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* 2. Modality filter */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="size-3.5 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Modalidad de Trabajo
                  </h4>
                </div>
                {FILTER_MODALITIES.some((mod) => activeFilters.includes(mod)) && (
                  <span className="text-[10px] font-semibold text-primary">
                    {FILTER_MODALITIES.filter((mod) => activeFilters.includes(mod)).length} seleccionados
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTER_MODALITIES.map((mod) => {
                  const isSel = activeFilters.includes(mod);
                  return (
                    <Badge
                      key={mod}
                      variant={isSel ? "default" : "outline"}
                      onClick={() => (isSel ? removeFilter(mod) : addFilter(mod))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shadow-2xs select-none gap-1",
                        isSel
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-background hover:bg-muted/60 text-foreground border-border/70"
                      )}
                    >
                      {isSel && <Check className="size-3" />}
                      <span>{mod}</span>
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* 3. Employment Type */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="size-3.5 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Tipo de Jornada / Contrato
                  </h4>
                </div>
                {FILTER_TYPES.some((type) => activeFilters.includes(type)) && (
                  <span className="text-[10px] font-semibold text-primary">
                    {FILTER_TYPES.filter((type) => activeFilters.includes(type)).length} seleccionados
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTER_TYPES.map((type) => {
                  const isSel = activeFilters.includes(type);
                  return (
                    <Badge
                      key={type}
                      variant={isSel ? "default" : "outline"}
                      onClick={() => (isSel ? removeFilter(type) : addFilter(type))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shadow-2xs select-none gap-1",
                        isSel
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-background hover:bg-muted/60 text-foreground border-border/70"
                      )}
                    >
                      {isSel && <Check className="size-3" />}
                      <span>{type}</span>
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* 4. Sector / Categoría */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="size-3.5 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Sector / Área Profesional
                  </h4>
                </div>
                {FILTER_CATEGORIES.some((cat) => activeFilters.includes(cat)) && (
                  <span className="text-[10px] font-semibold text-primary">
                    {FILTER_CATEGORIES.filter((cat) => activeFilters.includes(cat)).length} seleccionados
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTER_CATEGORIES.map((cat) => {
                  const isSel = activeFilters.includes(cat);
                  return (
                    <Badge
                      key={cat}
                      variant={isSel ? "default" : "outline"}
                      onClick={() => (isSel ? removeFilter(cat) : addFilter(cat))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shadow-2xs select-none gap-1",
                        isSel
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-background hover:bg-muted/60 text-foreground border-border/70"
                      )}
                    >
                      {isSel && <Check className="size-3" />}
                      <span>{cat}</span>
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Sheet Footer */}
          <SheetFooter className="p-4 sm:p-5 border-t border-border/60 bg-muted/20 flex flex-row items-center gap-3 mt-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveFilters([])}
              disabled={activeFilters.length === 0}
              className="flex-1 h-9 rounded-xl text-xs font-medium cursor-pointer"
            >
              Limpiar filtros
            </Button>
            <Button
              size="sm"
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 h-9 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
            >
              Ver {filteredVacancies.length} {filteredVacancies.length === 1 ? "vacante" : "vacantes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}


